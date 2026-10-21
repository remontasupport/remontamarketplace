// The tour's read and save (onboarding-tour U2; business-logic-model L2, L3; NFR design P1). Both fail silent: the
// read answers "unknown" for anything but a timely 200, and the save tries once more in the background, then gives
// up. Neither throws, neither shows anything.
import type { ApiOutcome } from "@/lib/api/outcome";
import type { TourView } from "@remonta/api-contract";

/** P1: past this the card is not offered for the visit; a late answer is dropped. */
export const TOUR_READ_DEADLINE_MS = 3000;
/** P1: the retry's wait without a usable Retry-After, and its cap. */
export const DEFAULT_RETRY_S = 5;
export const MAX_RETRY_S = 30;

export type TourSeen = "unseen" | "seen" | "unknown";

export interface TourApi {
  getTour(opts?: { signal?: AbortSignal }): Promise<ApiOutcome<TourView>>;
  putTourSeen(): Promise<ApiOutcome<TourView>>;
}

/** The timers the save waits with (a seam for the tests). */
export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}
const realTimers: Timers = { setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms), clearTimeout: (h) => globalThis.clearTimeout(h as number) };

/** L2: "unseen" only for a 200 with `seenAt: null` inside the deadline. */
export async function readTourSeen(api: TourApi, deadlineMs = TOUR_READ_DEADLINE_MS, timers: Timers = realTimers): Promise<TourSeen> {
  const abort = new AbortController();
  let timer: unknown;
  const late = new Promise<TourSeen>((resolve) => {
    timer = timers.setTimeout(() => {
      abort.abort();
      resolve("unknown");
    }, deadlineMs);
  });
  const answer = api
    .getTour({ signal: abort.signal })
    .then((r): TourSeen => (abort.signal.aborted ? "unknown" : r.kind === "ok" ? (r.body.seenAt === null ? "unseen" : "seen") : "unknown"))
    .catch((): TourSeen => "unknown");
  try {
    return await Promise.race([answer, late]);
  } finally {
    timers.clearTimeout(timer);
  }
}

/** L3 step 5: a usable Retry-After (finite, >= 0) capped at 30 s; otherwise 5 s. In seconds. */
export function retryDelay(retryAfterSeconds: unknown): number {
  return typeof retryAfterSeconds === "number" && Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0 ? Math.min(retryAfterSeconds, MAX_RETRY_S) : DEFAULT_RETRY_S;
}

/** L3 steps 3-4: the outcomes worth one more try, and how long to wait first; null = give up now. */
function retryAfterOf(r: ApiOutcome<TourView>): number | null {
  if (r.kind === "rateLimited") return retryDelay(r.retryAfterSeconds);
  if (r.kind === "unavailable") return DEFAULT_RETRY_S;
  if (r.kind === "failed" && r.status >= 500) return DEFAULT_RETRY_S;
  return null; // ok, unauthenticated, forbidden (impersonating), a 4xx
}

/**
 * L3: the save after the tour has closed. At most two calls; the second's outcome is not acted on. Returns a cancel
 * function for a pending retry (sign-out, leaving the dashboard).
 */
export function markTourSeen(api: TourApi, timers: Timers = realTimers): { done: Promise<void>; cancel: () => void } {
  let handle: unknown;
  let cancelled = false;
  let release: () => void = () => {};
  const once = () => api.putTourSeen().catch((): ApiOutcome<TourView> => ({ kind: "unavailable" }));
  const done = (async () => {
    const wait = retryAfterOf(await once());
    if (wait === null || cancelled) return;
    await new Promise<void>((resolve) => {
      release = resolve;
      handle = timers.setTimeout(resolve, wait * 1000);
    });
    if (!cancelled) await once();
  })();
  return {
    done,
    cancel: () => {
      cancelled = true;
      timers.clearTimeout(handle);
      release();
    },
  };
}
