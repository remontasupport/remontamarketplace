// The two-section page's one Save (user, 2026-10-13): what it saves, and that a bad answer saves nothing.
import { describe, expect, it } from "vitest";
import { dueParts, savePair, type PairPart } from "./pair";

const part = (changed: boolean, valid = true, stores = true) => {
  const calls: string[] = [];
  const p: PairPart & { calls: string[] } = {
    changed,
    calls,
    validate: () => (calls.push("validate"), valid),
    submit: async () => (calls.push("submit"), stores),
  };
  return p;
};

describe("one Save for two sections", () => {
  it("saves only the edited sections; both when neither was edited", () => {
    const [a, b] = [part(true), part(false)];
    expect(dueParts([a, b])).toEqual([a]);
    expect(dueParts([part(false), part(false)])).toHaveLength(2);
  });

  it("checks both before saving either: an invalid second answer saves nothing", async () => {
    const [a, b] = [part(true), part(true, false)];
    expect(await savePair([a, b])).toBe(false);
    expect(a.calls).toEqual(["validate"]);
    expect(b.calls).toEqual(["validate"]);
  });

  it("saves in page order and stops at the first that does not store", async () => {
    const [a, b] = [part(true, true, false), part(true)];
    expect(await savePair([a, b])).toBe(false);
    expect(a.calls).toEqual(["validate", "submit"]);
    expect(b.calls).toEqual(["validate"]);
    const [c, d] = [part(true), part(true)];
    expect(await savePair([c, d])).toBe(true);
    expect(d.calls).toEqual(["validate", "submit"]);
  });

  it("an untouched section is neither checked nor saved", async () => {
    const [a, b] = [part(false, false), part(true)];
    expect(await savePair([a, b])).toBe(true);
    expect(a.calls).toEqual([]);
  });
});
