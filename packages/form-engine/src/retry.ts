// Sending the sign-up over a bad connection (S1 step 9, user request 2026-09-25).
//
// Resending is always safe: the server either never saw the request, rolled it
// back, or already created the account -- in which case it answers the same 202
// again. So a failed or unanswered attempt is simply retried, with growing
// waits, honouring Retry-After, and pausing (without using up attempts) while the
// device is offline.

export type AttemptOutcome<T> =
  | { kind: "done"; value: T }
  /** Worth another try: network error, timeout, 429, 502, 503, 504. */
  | { kind: "retry"; reason: string; retryAfterSeconds?: number }
  /** Retrying cannot help (a validation error, a 4xx). */
  | { kind: "fail"; value: T };

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** The longest Retry-After we will honour. */
  maxRetryAfterMs?: number;
  sleep?: (ms: number) => Promise<void>;
  isOnline?: () => boolean;
  waitUntilOnline?: () => Promise<void>;
  /** Called before each wait, for the "still trying" message. */
  onRetry?: (info: { attempt: number; reason: string; waitMs: number }) => void;
  onOffline?: () => void;
}

export class RetriesExhausted extends Error {
  constructor(readonly attempts: number, readonly lastReason: string) {
    super(`gave up after ${attempts} attempts: ${lastReason}`);
    this.name = "RetriesExhausted";
  }
}

/** 1 s, 2 s, 4 s, 8 s..., capped, with +-20% jitter so many phones do not retry in lockstep. */
export function backoffMs(attempt: number, base: number, max: number, random: () => number = Math.random): number {
  const raw = Math.min(max, base * 2 ** (attempt - 1));
  return Math.round(raw * (0.8 + random() * 0.4));
}

export async function withRetry<T>(attempt: (n: number) => Promise<AttemptOutcome<T>>, opts: RetryOptions = {}): Promise<{ value: T; ok: boolean; attempts: number }> {
  const maxAttempts = opts.maxAttempts ?? 5;
  const base = opts.baseDelayMs ?? 1000;
  const max = opts.maxDelayMs ?? 8000;
  const maxRetryAfter = opts.maxRetryAfterMs ?? 30_000;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  // The platform supplies these (browser: navigator.onLine and the online event).
  const isOnline = opts.isOnline ?? (() => true);
  const waitUntilOnline = opts.waitUntilOnline ?? (() => Promise.resolve());

  let lastReason = "not attempted";
  for (let n = 1; n <= maxAttempts; n++) {
    // Offline does not count as an attempt: wait for the connection to come back.
    while (!isOnline()) {
      opts.onOffline?.();
      await waitUntilOnline();
    }
    let outcome: AttemptOutcome<T>;
    try {
      outcome = await attempt(n);
    } catch (err) {
      // A thrown error is a network failure or a timeout: the request may or may
      // not have arrived, and resending is safe either way.
      outcome = { kind: "retry", reason: err instanceof Error ? err.name || err.message : "network error" };
    }
    if (outcome.kind === "done") return { value: outcome.value, ok: true, attempts: n };
    if (outcome.kind === "fail") return { value: outcome.value, ok: false, attempts: n };
    lastReason = outcome.reason;
    if (n === maxAttempts) break;
    const waitMs =
      outcome.retryAfterSeconds !== undefined ? Math.min(maxRetryAfter, outcome.retryAfterSeconds * 1000) : backoffMs(n, base, max);
    opts.onRetry?.({ attempt: n, reason: outcome.reason, waitMs });
    await sleep(waitMs);
  }
  throw new RetriesExhausted(maxAttempts, lastReason);
}

/** HTTP statuses where waiting and resending can succeed. */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}
