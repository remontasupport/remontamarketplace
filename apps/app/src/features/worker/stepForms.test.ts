// Save on leaving a My Profile step (2026-11-19): only changed forms are saved, in page order, and a failure stops it.
import { describe, expect, it } from "vitest";
import { saveInOrder, type StepForm } from "./stepForms";

const form = (changed: boolean, stores = true) => {
  const calls: string[] = [];
  const f: StepForm & { calls: string[] } = { calls, changed: () => changed, save: async () => (calls.push("save"), stores) };
  return f;
};

describe("saveInOrder", () => {
  it("makes no request when nothing changed, and leaving goes ahead", async () => {
    const [a, b] = [form(false), form(false)];
    expect(await saveInOrder([a, b])).toBe(true);
    expect([...a.calls, ...b.calls]).toEqual([]);
  });

  it("saves only the changed forms", async () => {
    const [a, b] = [form(false), form(true)];
    expect(await saveInOrder([a, b])).toBe(true);
    expect(a.calls).toEqual([]);
    expect(b.calls).toEqual(["save"]);
  });

  it("stops at the first form that does not store: the worker stays on the step", async () => {
    const [a, b] = [form(true, false), form(true)];
    expect(await saveInOrder([a, b])).toBe(false);
    expect(b.calls).toEqual([]);
  });
});
