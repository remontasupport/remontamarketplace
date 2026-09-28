// Email verification for an `emailCode` field (S1 step 13): asking apps/api to
// send a code, then checking the code the person typed. Both go through the
// contract client with the same retries as the submission; the send fetches a
// fresh CAPTCHA token per attempt, as its entry demands. What comes back on
// success is the PROOF the sign-up body carries: the ticket plus the code.
import type { EntryDef } from "@remonta/api-contract";
import { ATTEMPT_TIMEOUT_MS, contractCall, messageFor, outcomeOf, type ApiBackend } from "./submit";
import { withRetry, type RetryOptions } from "./retry";
import type { FieldDef, FormDefinition } from "./types";

export type EmailCodeField = Extract<FieldDef, { kind: "emailCode" }>;

export interface EmailCodeTicket {
  token: string;
  expiresAt: number;
}

export interface EmailCodeProof extends EmailCodeTicket {
  code: string;
}

export type RequestCodeResult = { ok: true; ticket: EmailCodeTicket } | { ok: false; message: string };
export type ConfirmCodeResult = { ok: true; proof: EmailCodeProof } | { ok: false; message: string };

export const UNREACHABLE = "We couldn't reach Remonta. Please check your connection and try again.";

/** The reCAPTCHA action an entry demands, or undefined when it has none. */
export function captchaActionOf(entry: EntryDef | undefined): string | undefined {
  const bot = entry?.meta.bot;
  return bot && bot !== "none" ? bot.captcha.action : undefined;
}

export async function requestEmailCode(
  def: FormDefinition,
  backend: ApiBackend,
  field: EmailCodeField,
  email: string,
  deps: { getCaptchaToken?: (action: string) => Promise<string>; retry?: RetryOptions },
): Promise<RequestCodeResult> {
  const send = contractCall(def.contract, backend.apiBaseUrl, field.sendEntry);
  const action = captchaActionOf(def.contract.entries[field.sendEntry]);
  try {
    const { value: r } = await withRetry(async () => {
      const captchaToken = action ? await deps.getCaptchaToken!(action) : undefined; // fresh every attempt
      return outcomeOf(await send({ body: { email, ...(captchaToken ? { captchaToken } : {}) } }, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) }));
    }, deps.retry);
    if (r.ok) return { ok: true, ticket: r.body as EmailCodeTicket };
    const fields = (r.body as { error?: { fields?: Record<string, string[]> } } | null)?.error?.fields;
    return { ok: false, message: fields?.email?.[0] ?? messageFor(r.status) };
  } catch {
    return { ok: false, message: UNREACHABLE };
  }
}

export async function confirmEmailCode(
  def: FormDefinition,
  backend: ApiBackend,
  field: EmailCodeField,
  args: { email: string; code: string; ticket: EmailCodeTicket },
  deps: { retry?: RetryOptions } = {},
): Promise<ConfirmCodeResult> {
  const verify = contractCall(def.contract, backend.apiBaseUrl, field.verifyEntry);
  try {
    const { value: r } = await withRetry(
      async () => outcomeOf(await verify({ body: { email: args.email, code: args.code, ...args.ticket } }, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) })),
      deps.retry,
    );
    if (r.ok) return { ok: true, proof: { ...args.ticket, code: args.code } };
    const fields = (r.body as { error?: { fields?: Record<string, string[]> } } | null)?.error?.fields;
    return { ok: false, message: fields?.code?.[0] ?? fields?.token?.[0] ?? messageFor(r.status) };
  } catch {
    return { ok: false, message: UNREACHABLE };
  }
}
