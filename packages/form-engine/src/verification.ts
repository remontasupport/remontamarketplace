// Email verification for an `emailCode` field (S1 step 13): asking apps/api to
// send a code, then checking the code the person typed. Both go through the
// contract client with the same retries as the submission; the send fetches a
// fresh CAPTCHA token per attempt, as its entry demands. What comes back on
// success is the PROOF the sign-up body carries: the ticket plus the code.
import type { EntryDef } from "@remonta/api-contract";
import { ATTEMPT_TIMEOUT_MS, contractCall, messageFor, outcomeOf } from "./submit";
import { RetriesExhausted, withRetry, type RetryOptions } from "./retry";
import type { Backend, FieldDef, FormDefinition } from "./types";

export type EmailCodeField = Extract<FieldDef, { kind: "emailCode" }>;

export interface EmailCodeTicket {
  token: string;
  expiresAt: number;
}

export interface EmailCodeProof extends EmailCodeTicket {
  code: string;
}

export type RequestCodeResult = { ok: true; ticket: EmailCodeTicket } | { ok: false; message: string };
export type AvailabilityResult = { ok: true; available: boolean } | { ok: false; message: string };
export type ConfirmCodeResult = { ok: true; proof: EmailCodeProof } | { ok: false; message: string };

export const UNREACHABLE = "We couldn't reach Remonta. Please check your connection and try again.";
export const NOT_SENT = "We couldn't send the code right now. Please try again in a moment.";
export const TOO_MANY = "Too many requests from this connection. Please wait a while before trying again.";
export const EMAIL_TAKEN = "An account with this email already exists. Please sign in instead.";

/**
 * Whether the address can sign up, asked once per address when the field loses
 * focus. Fast by design (one indexed lookup, no CAPTCHA); a single attempt, no
 * retries: the person is waiting, and a failed check does not block them (the
 * sign-up itself still handles an existing address).
 */
export async function checkEmailAvailability(def: FormDefinition, backend: Backend, field: EmailCodeField, email: string): Promise<AvailabilityResult> {
  if (!field.availabilityEntry) return { ok: true, available: true };
  const ask = contractCall(def.contract, backend.apiBaseUrl, field.availabilityEntry);
  try {
    const r = await ask({ body: { email } }, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) });
    if (r.ok) return { ok: true, available: (r.body as { available: boolean }).available };
    return { ok: false, message: r.status === 429 ? TOO_MANY : UNREACHABLE };
  } catch {
    return { ok: false, message: UNREACHABLE };
  }
}

/**
 * A rate limit is final for these calls: the window is an hour, so retrying now
 * cannot help and every retry counts against the same limit. (The submission
 * keeps retrying a 429, honouring Retry-After: it is the one call that matters.)
 */
function finalOn429<R extends { ok: boolean; status: number; retryAfterSeconds?: number }>(r: R) {
  return r.status === 429 ? ({ kind: "fail", value: r } as const) : outcomeOf(r);
}

/** When the retries ran out: what the LAST answer was decides the message. */
function afterRetries(err: unknown, sending: boolean): string {
  if (err instanceof RetriesExhausted) {
    if (err.lastReason === "HTTP 429") return TOO_MANY;
    if (/^HTTP 5/.test(err.lastReason)) return sending ? NOT_SENT : UNREACHABLE;
  }
  return UNREACHABLE;
}

/** The reCAPTCHA action an entry demands, or undefined when it has none. */
export function captchaActionOf(entry: EntryDef | undefined): string | undefined {
  const bot = entry?.meta.bot;
  return bot && bot !== "none" ? bot.captcha.action : undefined;
}

export async function requestEmailCode(
  def: FormDefinition,
  backend: Backend,
  field: EmailCodeField,
  email: string,
  deps: { getCaptchaToken?: (action: string) => Promise<string>; retry?: RetryOptions },
): Promise<RequestCodeResult> {
  const send = contractCall(def.contract, backend.apiBaseUrl, field.sendEntry);
  const action = captchaActionOf(def.contract.entries[field.sendEntry]);
  try {
    const { value: r } = await withRetry(async () => {
      const captchaToken = action ? await deps.getCaptchaToken!(action) : undefined; // fresh every attempt
      return finalOn429(await send({ body: { email, ...(captchaToken ? { captchaToken } : {}) } }, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) }));
    }, deps.retry);
    if (r.ok) return { ok: true, ticket: r.body as EmailCodeTicket };
    const fields = (r.body as { error?: { fields?: Record<string, string[]> } } | null)?.error?.fields;
    if (r.status === 429) return { ok: false, message: TOO_MANY };
    if (r.status === 500 || r.status === 503) return { ok: false, message: NOT_SENT };
    return { ok: false, message: fields?.email?.[0] ?? messageFor(r.status) };
  } catch (err) {
    return { ok: false, message: afterRetries(err, true) };
  }
}

export async function confirmEmailCode(
  def: FormDefinition,
  backend: Backend,
  field: EmailCodeField,
  args: { email: string; code: string; ticket: EmailCodeTicket },
  deps: { retry?: RetryOptions } = {},
): Promise<ConfirmCodeResult> {
  const verify = contractCall(def.contract, backend.apiBaseUrl, field.verifyEntry);
  try {
    const { value: r } = await withRetry(
      async () => finalOn429(await verify({ body: { email: args.email, code: args.code, ...args.ticket } }, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) })),
      deps.retry,
    );
    if (r.ok) return { ok: true, proof: { ...args.ticket, code: args.code } };
    if (r.status === 429) return { ok: false, message: TOO_MANY };
    const fields = (r.body as { error?: { fields?: Record<string, string[]> } } | null)?.error?.fields;
    return { ok: false, message: fields?.code?.[0] ?? fields?.token?.[0] ?? messageFor(r.status) };
  } catch (err) {
    return { ok: false, message: afterRetries(err, false) };
  }
}
