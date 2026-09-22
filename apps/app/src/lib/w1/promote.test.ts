/**
 * Tests for the W1 time-conversion pair.
 *
 * `toMinutes` and `fromMinutes` are documented in promote.ts as "kept beside it
 * so the pair cannot drift". A property test is how that intent is actually
 * enforced rather than merely stated.
 *
 * Note: importing promote.ts costs nothing at runtime. Its only import is
 * `import type { Prisma }`, which TypeScript erases at compile time, so no
 * Prisma client is loaded here.
 *
 * Globals are off (see vitest.config.ts) — describe/it/expect are imported.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

import { toMinutes, fromMinutes } from "@/lib/w1/promote";

const MINUTES_IN_DAY = 24 * 60; // 1440; valid values are 0..1439

describe("fromMinutes", () => {
  it("zero-pads both fields", () => {
    // Not cosmetic: the availability UI parses `dayjs('2000-01-01T' + value)`,
    // which resolves "09:00" and fails on "9:00".
    expect(fromMinutes(0)).toBe("00:00");
    expect(fromMinutes(9 * 60)).toBe("09:00");
    expect(fromMinutes(9 * 60 + 5)).toBe("09:05");
    expect(fromMinutes(23 * 60 + 59)).toBe("23:59");
  });
});

describe("toMinutes", () => {
  it("converts well-formed times", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("23:59")).toBe(1439);
  });

  it("accepts a single-digit hour", () => {
    // The regex is \d{1,2}, so "9:00" parses even though fromMinutes never
    // produces it. This asymmetry is why the string round-trip normalises
    // rather than being an identity — see the round-trip property below.
    expect(toMinutes("9:00")).toBe(540);
  });

  it("tolerates surrounding whitespace", () => {
    expect(toMinutes("  09:30  ")).toBe(570);
  });

  it("returns null rather than a wrong number for out-of-range values", () => {
    // promote.ts is explicit that null exists so a bad value is reported
    // instead of silently becoming 0, which would read as midnight.
    expect(toMinutes("24:00")).toBeNull();
    expect(toMinutes("23:60")).toBeNull();
    expect(toMinutes("99:99")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(toMinutes("")).toBeNull();
    expect(toMinutes("0900")).toBeNull();
    expect(toMinutes("09:0")).toBeNull();
    expect(toMinutes("09:00:00")).toBeNull();
    expect(toMinutes("nine o'clock")).toBeNull();
  });

  it("returns null for non-string input", () => {
    expect(toMinutes(540)).toBeNull();
    expect(toMinutes(null)).toBeNull();
    expect(toMinutes(undefined)).toBeNull();
    expect(toMinutes({ hour: 9 })).toBeNull();
    expect(toMinutes(["09:00"])).toBeNull();
  });
});

describe("round-trip properties", () => {
  it("minutes -> string -> minutes is the identity for every valid minute", () => {
    // PBT-02. This is the property that stops the pair drifting: if either
    // function changes shape without the other, this fails.
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MINUTES_IN_DAY - 1 }), (minutes) => {
        expect(toMinutes(fromMinutes(minutes))).toBe(minutes);
      }),
    );
  });

  it("string -> minutes -> string NORMALISES; it is not the identity", () => {
    // The reverse direction is deliberately *not* an identity. toMinutes
    // accepts a single-digit hour, fromMinutes always emits two digits, so
    // "9:00" -> 540 -> "09:00". Asserting identity here would be wrong, and
    // this test exists so that mistake is caught rather than introduced.
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 59 }),
        (hour, minute) => {
          const unpadded = `${hour}:${String(minute).padStart(2, "0")}`;
          const parsed = toMinutes(unpadded);

          expect(parsed).not.toBeNull();
          const rendered = fromMinutes(parsed as number);

          // Always well-formed, whatever went in.
          expect(rendered).toMatch(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/);

          // Idempotent after one pass, even though the first pass may change
          // the string.
          expect(fromMinutes(toMinutes(rendered) as number)).toBe(rendered);
        },
      ),
    );
  });

  it("output always satisfies the validator the save path applies", () => {
    // PBT-03. promote.ts records that save-side validation enforces
    // ^([0-1][0-9]|2[0-3]):[0-5][0-9]$. Anything fromMinutes emits for a valid
    // minute must pass it, or a round-tripped value would be rejected on save.
    fc.assert(
      fc.property(fc.integer({ min: 0, max: MINUTES_IN_DAY - 1 }), (minutes) => {
        expect(fromMinutes(minutes)).toMatch(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/);
      }),
    );
  });

  it("rejects every out-of-range hour or minute", () => {
    // PBT-03. Anything outside 0-23 / 0-59 must be null, never a number.
    fc.assert(
      fc.property(
        fc.integer({ min: 24, max: 99 }),
        fc.integer({ min: 0, max: 59 }),
        (hour, minute) => {
          const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
          expect(toMinutes(value)).toBeNull();
        },
      ),
    );

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 60, max: 99 }),
        (hour, minute) => {
          const value = `${String(hour).padStart(2, "0")}:${String(minute)}`;
          expect(toMinutes(value)).toBeNull();
        },
      ),
    );
  });
});
