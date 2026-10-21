// The tour's rules (onboarding-tour U2 Step 6): TR-1, TR-8, TR-9, TR-12, R6 and the card placement, with a property
// that the card is always on screen.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { cardPlacement, nextShowable, REPLAY_HREF, replayRequested, shouldRead, tourEnabled, WORKER_HOME } from "./rules";

describe("tourEnabled (TR-8)", () => {
  it("is on for workers only", () => {
    expect(tourEnabled("WORKER")).toBe(true);
    for (const r of ["ADMIN", "CLIENT", "COORDINATOR", "SUPPORT_COORDINATOR", "", null, undefined]) expect(tourEnabled(r), String(r)).toBe(false);
  });
});

describe("shouldRead (TR-1, P2)", () => {
  it("reads on the worker home only", () => {
    expect(shouldRead({ pathname: WORKER_HOME, impersonating: false })).toBe(true);
    expect(shouldRead({ pathname: "/dashboard/worker/profile/name", impersonating: false })).toBe(false);
    expect(shouldRead({ pathname: null, impersonating: false })).toBe(false);
  });
  it("R6: never while an admin impersonates", () => {
    expect(shouldRead({ pathname: WORKER_HOME, impersonating: true })).toBe(false);
  });
});

describe("replayRequested (TR-9)", () => {
  it("is ?tour=start, nothing else", () => {
    expect(REPLAY_HREF).toBe("/dashboard/worker?tour=start");
    expect(replayRequested(new URLSearchParams("tour=start"))).toBe(true);
    expect(replayRequested(new URLSearchParams("tour=1"))).toBe(false);
    expect(replayRequested(new URLSearchParams(""))).toBe(false);
    expect(replayRequested(null)).toBe(false);
  });
});

describe("nextShowable (TR-12)", () => {
  const on = (...steps: number[]) => (i: number) => steps.includes(i);
  it("skips a missing target in the direction of travel", () => {
    expect(nextShowable(1, 1, 5, on(0, 1, 3, 4))).toBe(3);
    expect(nextShowable(3, -1, 5, on(0, 1, 3, 4))).toBe(1);
    expect(nextShowable(0, 0, 5, on(2, 4))).toBe(2);
    expect(nextShowable(0, 0, 5, on(0, 4))).toBe(0);
  });
  it("answers null when nothing is left that way (the tour ends as a skip)", () => {
    expect(nextShowable(3, 1, 5, on(0, 1))).toBeNull();
    expect(nextShowable(1, -1, 5, on(2, 3))).toBeNull();
    expect(nextShowable(0, 0, 5, on())).toBeNull();
  });
  it("property: the answer is in range, showable, and the nearest in that direction", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 8 }), fc.nat(), fc.constantFrom<-1 | 0 | 1>(-1, 0, 1), fc.array(fc.boolean(), { minLength: 8, maxLength: 8 }), (count, f, dir, shown) => {
        const from = f % count;
        const r = nextShowable(from, dir, count, (i) => shown[i]!);
        const candidates = Array.from({ length: count }, (_, i) => i).filter((i) => shown[i] && (dir === 1 ? i > from : dir === -1 ? i < from : i >= from));
        const nearest = dir === -1 ? candidates.at(-1) : candidates[0];
        expect(r).toBe(nearest ?? null);
      }),
    );
  });
});

describe("cardPlacement (Q4 A)", () => {
  const card = { width: 320, height: 200 };
  const screen = { width: 1280, height: 800 };
  it("a phone: the bottom of the screen", () => {
    expect(cardPlacement({ top: 100, left: 0, width: 280, height: 44 }, { width: 390, height: 844 }, card, true)).toEqual({ kind: "bottom" });
  });
  it("a sidebar item: to its right, the arrow at its middle", () => {
    const p = cardPlacement({ top: 300, left: 0, width: 260, height: 44 }, screen, card, false);
    expect(p).toEqual({ kind: "side", top: 222, left: 276, arrowTop: 100 });
  });
  it("a wide target with no room on the right (the checklist): below it, or above when below is full", () => {
    expect(cardPlacement({ top: 200, left: 300, width: 960, height: 240 }, screen, card, false)).toMatchObject({ kind: "below", top: 456 });
    expect(cardPlacement({ top: 520, left: 300, width: 960, height: 240 }, screen, card, false)).toMatchObject({ kind: "above", top: 304 });
  });
  it("property: whatever the target, on a screen larger than the card, the card is on screen", () => {
    fc.assert(
      fc.property(
        fc.record({ top: fc.integer({ min: -200, max: 1200 }), left: fc.integer({ min: -100, max: 1400 }), width: fc.integer({ min: 1, max: 1400 }), height: fc.integer({ min: 1, max: 1200 }) }),
        fc.record({ width: fc.integer({ min: 340, max: 2560 }), height: fc.integer({ min: 220, max: 1600 }) }),
        (target, viewport) => {
          const p = cardPlacement(target, viewport, card, false);
          if (p.kind === "bottom") return;
          expect(p.top).toBeGreaterThanOrEqual(0);
          expect(p.left).toBeGreaterThanOrEqual(0);
          expect(p.top + card.height).toBeLessThanOrEqual(viewport.height);
          expect(p.left + card.width).toBeLessThanOrEqual(viewport.width);
        },
      ),
    );
  });
});
