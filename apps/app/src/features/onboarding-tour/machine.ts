// The tour as a pure reducer (onboarding-tour U2; business-logic-model L1, E2, TR-2, TR-3, P2). No React, no
// timers, no api: `reduce` answers the next state and whether the caller should save "seen" (once, on the end of a
// first run). A replay and an impersonating admin never save.

export type TourMode = "first" | "replay";

export type TourState =
  | { kind: "idle" }
  | { kind: "offered" }
  | { kind: "running"; step: number; mode: TourMode }
  | { kind: "closed" };

export type TourEvent =
  | { type: "UNSEEN" }
  | { type: "REPLAY" }
  | { type: "START" }
  | { type: "NOT_NOW" }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "FINISH" }
  | { type: "SKIP" }
  | { type: "ESC" };

export interface TourContext {
  /** The number of steps (TOUR_STEPS.length). */
  steps: number;
  impersonating: boolean;
}

export interface Reduced {
  state: TourState;
  save: boolean;
}

export const INITIAL: TourState = { kind: "idle" };

const stay = (state: TourState): Reduced => ({ state, save: false });
const close = (save: boolean, ctx: TourContext): Reduced => ({ state: { kind: "closed" }, save: save && !ctx.impersonating });

export function reduce(state: TourState, event: TourEvent, ctx: TourContext): Reduced {
  const last = ctx.steps - 1;
  switch (state.kind) {
    case "idle":
      if (event.type === "UNSEEN") return stay(ctx.impersonating ? state : { kind: "offered" });
      if (event.type === "REPLAY" && ctx.steps > 0) return stay({ kind: "running", step: 0, mode: "replay" });
      return stay(state);
    case "offered":
      if (event.type === "START" && ctx.steps > 0) return stay({ kind: "running", step: 0, mode: "first" });
      if (event.type === "NOT_NOW" || event.type === "ESC") return close(true, ctx);
      return stay(state);
    case "running": {
      const first = state.mode === "first";
      if (event.type === "NEXT" && state.step < last) return stay({ ...state, step: state.step + 1 });
      if (event.type === "BACK" && state.step > 0) return stay({ ...state, step: state.step - 1 });
      if (event.type === "FINISH" && state.step === last) return close(first, ctx);
      if (event.type === "SKIP" || event.type === "ESC") return close(first, ctx);
      return stay(state);
    }
    case "closed":
      // Never offered twice in a visit; a replay is always allowed.
      if (event.type === "REPLAY" && ctx.steps > 0) return stay({ kind: "running", step: 0, mode: "replay" });
      return stay(state);
  }
}
