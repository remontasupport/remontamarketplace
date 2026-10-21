// The tour's rules as pure functions (onboarding-tour U2 Step 6), so the app's Node tests can hold them without a
// DOM: who gets the tour (TR-8), when the home reads "seen" (TR-1, P2), which step shows when a target is missing
// (TR-12), where the card goes (Q4 A) and whether the address asks for a replay (TR-9).
import { UserRole } from "@/types/auth";

export const WORKER_HOME = "/dashboard/worker";
/** The sidebar becomes the drawer at this width (`app/styles/dashboard.css`). */
export const PHONE_QUERY = "(max-width: 768px)";
export const REPLAY_PARAM = "tour";
export const REPLAY_VALUE = "start";
export const REPLAY_HREF = `${WORKER_HOME}?${REPLAY_PARAM}=${REPLAY_VALUE}`;

/** TR-8: the tour and its help button exist for workers only (the layout is shared by every role). */
export const tourEnabled = (role: string | null | undefined): boolean => role === UserRole.WORKER;

/** TR-1, P2: the "seen" read happens on the worker home only, and never while an admin impersonates. */
export const shouldRead = (o: { pathname: string | null; impersonating: boolean }): boolean => o.pathname === WORKER_HOME && !o.impersonating;

/** TR-9: `?tour=start` asks the home to start a replay. */
export const replayRequested = (params: { get(name: string): string | null } | null | undefined): boolean => params?.get(REPLAY_PARAM) === REPLAY_VALUE;

/**
 * TR-12: from `from`, the first step in `direction` (+1 forward, -1 back, 0 = `from` itself, then forward) whose
 * target is on the page; null when there is none, and the tour ends as a skip.
 */
export function nextShowable(from: number, direction: -1 | 0 | 1, count: number, has: (step: number) => boolean): number | null {
  const step = direction === 0 ? 1 : direction;
  for (let i = from + (direction === 0 ? 0 : direction); i >= 0 && i < count; i += step) if (has(i)) return i;
  return null;
}

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}
export interface Size {
  width: number;
  height: number;
}
export type Placement =
  | { kind: "side"; top: number; left: number; arrowTop: number }
  | { kind: "below" | "above"; top: number; left: number; arrowLeft: number }
  | { kind: "bottom" };

const GAP = 16;
const MARGIN = 8;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Q4 A: on a phone the card is fixed at the bottom of the screen. On a computer it sits to the right of the target with
 * its arrow at the target's middle; when the right side has no room (the checklist, in the main column) it goes below
 * the target, or above it. Always kept on screen.
 */
export function cardPlacement(target: Rect, viewport: Size, card: Size, phone: boolean): Placement {
  if (phone) return { kind: "bottom" };
  const midY = target.top + target.height / 2;
  const midX = target.left + target.width / 2;
  const maxTop = Math.max(MARGIN, viewport.height - card.height - MARGIN);
  const maxLeft = Math.max(MARGIN, viewport.width - card.width - MARGIN);
  const right = Math.max(MARGIN, target.left + target.width + GAP);
  if (right + card.width + MARGIN <= viewport.width) {
    const top = clamp(midY - card.height / 2, MARGIN, maxTop);
    return { kind: "side", top, left: right, arrowTop: clamp(midY - top, GAP, Math.max(GAP, card.height - GAP)) };
  }
  const left = clamp(midX - card.width / 2, MARGIN, maxLeft);
  const arrowLeft = clamp(midX - left, GAP, Math.max(GAP, card.width - GAP));
  // Clamped as well: a target partly off screen (mid-scroll) must not push the card past an edge.
  const below = target.top + target.height + GAP;
  if (below + card.height + MARGIN <= viewport.height) return { kind: "below", top: clamp(below, MARGIN, maxTop), left, arrowLeft };
  const above = target.top - GAP - card.height;
  if (above >= MARGIN) return { kind: "above", top: clamp(above, MARGIN, maxTop), left, arrowLeft };
  // No room around the target (a very tall one): over its lower part, still on screen.
  return { kind: "below", top: maxTop, left, arrowLeft };
}
