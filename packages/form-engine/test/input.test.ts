// The phone kind's input constraint: what the box lets you type, checked as
// properties. The contract's rule (normaliseAuMobile) still decides validity.
import { normaliseAuMobile } from "@remonta/schemas/schema/workerRegistrationSchema";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { constrainAuMobileInput, KINDS } from "../src/kinds";

const typed = (text: string) => [...text].reduce((acc, ch) => constrainAuMobileInput(acc + ch), "");

describe("constrainAuMobileInput", () => {
  it("is the phone kind's sanitiser", () => {
    expect(KINDS.phone.sanitise).toBe(constrainAuMobileInput);
  });

  it.each([
    ["0412 345 678", "0412 345 678"],
    ["0412345678", "0412345678"],
    ["+61 412 345 678", "+61 412 345 678"],
    ["04123456789", "0412345678"], // an 11th digit without a country code is dropped
    ["+61 412 345 6789", "+61 412 345 678"],
    ["0412-345-678", "0412345678"],
    ["(04) 1234 5678", "04 1234 5678"],
    ["04 12 abc 34", "04 12 34"],
    ["0412  345   678", "0412 345 678"],
    [" 0412", "0412"],
    ["04+12", "0412"],
  ])("%j -> %j", (input, out) => {
    expect(constrainAuMobileInput(input)).toBe(out);
  });

  const anyText = fc.string({ maxLength: 40 });

  it("only ever leaves a leading +, digits and single spaces", () => {
    fc.assert(
      fc.property(anyText, (raw) => {
        const s = constrainAuMobileInput(raw);
        expect(s).toMatch(/^\+?[0-9 ]*$/);
        expect(s).not.toMatch(/ {2}/);
        expect(s.startsWith(" ")).toBe(false);
      }),
    );
  });

  it("never holds more digits than a mobile: 10, or 11 with the 61 country code", () => {
    fc.assert(
      fc.property(anyText, (raw) => {
        const s = constrainAuMobileInput(raw);
        const digits = s.replace(/\D/g, "");
        expect(digits.length).toBeLessThanOrEqual(s.startsWith("+") || digits.startsWith("61") ? 11 : 10);
      }),
    );
  });

  it("is idempotent, and typing character by character ends where pasting does", () => {
    fc.assert(
      fc.property(anyText, (raw) => {
        const once = constrainAuMobileInput(raw);
        expect(constrainAuMobileInput(once)).toBe(once);
        expect(constrainAuMobileInput(typed(raw))).toBe(typed(raw));
      }),
    );
  });

  // Any real mobile, in the forms people type it.
  const mobile = fc.stringMatching(/^[0-9]{8}$/).map((rest) => `4${rest}`);
  const written = fc.tuple(mobile, fc.constantFrom("0", "+61 ", "+61", "61 "), fc.constantFrom("", " ")).map(
    ([n, prefix, sep]) => ({ n, text: `${prefix}${n.slice(0, 3)}${sep}${n.slice(3, 6)}${sep}${n.slice(6)}` }),
  );

  it("passes every real mobile through untouched, typed or pasted, and the contract then accepts it", () => {
    fc.assert(
      fc.property(written, ({ n, text }) => {
        expect(constrainAuMobileInput(text)).toBe(text);
        expect(typed(text)).toBe(text);
        expect(normaliseAuMobile(text)).toBe(`+61${n}`);
      }),
    );
  });
});
