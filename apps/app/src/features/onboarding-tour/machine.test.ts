// The tour's reducer (onboarding-tour U2 Step 4): the L1 table row by row, then the stateful property (PBT-06, P8).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { INITIAL, reduce, type TourEvent, type TourState } from "./machine";

const ctx = { steps: 5, impersonating: false };
const run = (step: number, mode: "first" | "replay" = "first"): TourState => ({ kind: "running", step, mode });

describe("the L1 table", () => {
  it("idle: UNSEEN offers the card; REPLAY runs step 1 as a replay; anything else stays", () => {
    expect(reduce(INITIAL, { type: "UNSEEN" }, ctx)).toEqual({ state: { kind: "offered" }, save: false });
    expect(reduce(INITIAL, { type: "REPLAY" }, ctx)).toEqual({ state: run(0, "replay"), save: false });
    expect(reduce(INITIAL, { type: "NEXT" }, ctx)).toEqual({ state: INITIAL, save: false });
  });
  it("idle while impersonating: UNSEEN offers nothing (P2); REPLAY still runs", () => {
    const imp = { ...ctx, impersonating: true };
    expect(reduce(INITIAL, { type: "UNSEEN" }, imp)).toEqual({ state: INITIAL, save: false });
    expect(reduce(INITIAL, { type: "REPLAY" }, imp).state).toEqual(run(0, "replay"));
  });
  it("offered: START runs step 1 as a first run; NOT_NOW and ESC close and save (D3)", () => {
    const offered: TourState = { kind: "offered" };
    expect(reduce(offered, { type: "START" }, ctx)).toEqual({ state: run(0), save: false });
    expect(reduce(offered, { type: "NOT_NOW" }, ctx)).toEqual({ state: { kind: "closed" }, save: true });
    expect(reduce(offered, { type: "ESC" }, ctx)).toEqual({ state: { kind: "closed" }, save: true });
    expect(reduce(offered, { type: "NEXT" }, ctx)).toEqual({ state: offered, save: false });
  });
  it("running: NEXT and BACK move within the steps; BACK on step 1 and NEXT on step 5 do nothing", () => {
    expect(reduce(run(0), { type: "NEXT" }, ctx).state).toEqual(run(1));
    expect(reduce(run(3), { type: "BACK" }, ctx).state).toEqual(run(2));
    expect(reduce(run(0), { type: "BACK" }, ctx).state).toEqual(run(0));
    expect(reduce(run(4), { type: "NEXT" }, ctx).state).toEqual(run(4));
  });
  it("running: FINISH only on the last step; SKIP and ESC end anywhere; a first run saves, a replay does not", () => {
    expect(reduce(run(2), { type: "FINISH" }, ctx)).toEqual({ state: run(2), save: false });
    expect(reduce(run(4), { type: "FINISH" }, ctx)).toEqual({ state: { kind: "closed" }, save: true });
    expect(reduce(run(1), { type: "SKIP" }, ctx)).toEqual({ state: { kind: "closed" }, save: true });
    expect(reduce(run(1), { type: "ESC" }, ctx)).toEqual({ state: { kind: "closed" }, save: true });
    expect(reduce(run(4, "replay"), { type: "FINISH" }, ctx)).toEqual({ state: { kind: "closed" }, save: false });
    expect(reduce(run(1, "replay"), { type: "SKIP" }, ctx)).toEqual({ state: { kind: "closed" }, save: false });
  });
  it("closed: never offered again in the visit; REPLAY runs", () => {
    const closed: TourState = { kind: "closed" };
    expect(reduce(closed, { type: "UNSEEN" }, ctx)).toEqual({ state: closed, save: false });
    expect(reduce(closed, { type: "REPLAY" }, ctx).state).toEqual(run(0, "replay"));
  });
  it("with no steps nothing runs", () => {
    const none = { steps: 0, impersonating: false };
    expect(reduce(INITIAL, { type: "REPLAY" }, none).state).toEqual(INITIAL);
    expect(reduce({ kind: "offered" }, { type: "START" }, none).state).toEqual({ kind: "offered" });
  });
});

const EVENTS: TourEvent["type"][] = ["UNSEEN", "REPLAY", "START", "NOT_NOW", "NEXT", "BACK", "FINISH", "SKIP", "ESC"];

describe("the stateful property (PBT-06)", () => {
  it("for any events: the step stays in range, a closed first run saves exactly once, a replay or an impersonated visit never saves", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 8 }), fc.boolean(), fc.array(fc.constantFrom(...EVENTS), { maxLength: 40 }), (steps, impersonating, types) => {
        const c = { steps, impersonating };
        let state: TourState = INITIAL;
        // The model: is a first run under way (offered or running "first") whose ending has not been saved?
        let saves = 0;
        let pendingFirst = false;
        for (const type of types) {
          const before = state;
          const r = reduce(state, { type }, c);
          state = r.state;
          if (r.save) saves++;
          if (state.kind === "running") {
            expect(state.step).toBeGreaterThanOrEqual(0);
            expect(state.step).toBeLessThan(steps);
            if (before.kind === "running" && type === "BACK" && before.step === 0) expect(state.step).toBe(0);
          }
          if (type === "FINISH" && before.kind === "running" && before.step !== steps - 1) expect(state).toEqual(before);
          if (before.kind === "offered" || (before.kind === "running" && before.mode === "first")) pendingFirst = true;
          if (state.kind === "closed" && before.kind !== "closed") {
            const shouldSave = pendingFirst && !(before.kind === "running" && before.mode === "replay") && !impersonating;
            expect(r.save).toBe(shouldSave);
            pendingFirst = false;
          }
        }
        if (impersonating) expect(saves).toBe(0);
        expect(saves).toBeLessThanOrEqual(1); // the card is offered at most once per visit, so a first run ends at most once
      }),
    );
  });
});
