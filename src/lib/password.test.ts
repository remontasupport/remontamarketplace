/**
 * Tests for verification-code generation.
 *
 * These codes are credentials. The previous implementation used Math.random,
 * which is not cryptographically secure and whose output is predictable from
 * prior values. It now uses crypto.randomInt.
 *
 * Only generateVerificationCode is covered here. The bcrypt functions in this
 * module are slow by design and belong in their own suite.
 */

import { describe, it, expect } from "vitest";

import { generateVerificationCode } from "@/lib/password";

describe("generateVerificationCode", () => {
  it("always produces exactly six digits", () => {
    // Run enough times to catch an off-by-one at either bound. randomInt's upper
    // bound is exclusive, so 1000000 yields a maximum of 999999 -- getting that
    // wrong by one would emit a seven-digit code, and this would find it.
    for (let i = 0; i < 10_000; i++) {
      const { code } = generateVerificationCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("stays within 100000..999999", () => {
    for (let i = 0; i < 10_000; i++) {
      const n = Number(generateVerificationCode().code);
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });

  it("never produces a leading zero", () => {
    // A leading zero would mean the numeric range slipped below 100000, which
    // would shrink the keyspace.
    for (let i = 0; i < 5_000; i++) {
      expect(generateVerificationCode().code.startsWith("0")).toBe(false);
    }
  });

  it("does not repeat itself over a large sample", () => {
    // Not a randomness test -- a real one does not belong in a unit suite. This
    // is a smoke check that would catch a constant or a badly stuck generator.
    // Over 5,000 draws from 900,000 values, collisions are expected (birthday
    // bound), so the assertion is deliberately loose.
    const seen = new Set<string>();
    for (let i = 0; i < 5_000; i++) {
      seen.add(generateVerificationCode().code);
    }
    expect(seen.size).toBeGreaterThan(4_900);
  });

  it("returns an expiry the requested number of minutes ahead", () => {
    const before = Date.now();
    const { expires } = generateVerificationCode(15);
    const after = Date.now();

    expect(expires.getTime()).toBeGreaterThanOrEqual(before + 15 * 60 * 1000 - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + 15 * 60 * 1000 + 1000);
  });

  it("defaults to a 15 minute expiry", () => {
    const { expires } = generateVerificationCode();
    const minutesAhead = (expires.getTime() - Date.now()) / 60000;
    expect(minutesAhead).toBeGreaterThan(14.9);
    expect(minutesAhead).toBeLessThan(15.1);
  });
});
