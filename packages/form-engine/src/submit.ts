// Sending a form to apps/api through its contract client, over a bad connection:
// a fresh CAPTCHA token for every attempt, retries with back-off honouring
// Retry-After, a timeout per attempt. Resending is safe: the server either never
// saw the request, rolled it back, or already accepted it and answers the same.
import { createClient, type Contract } from "@remonta/api-contract";
import { toRequestBody } from "./form";
import { isRetryableStatus, withRetry, type AttemptOutcome, type RetryOptions } from "./retry";
import type { Backend, FormDefinition, SubmitResult } from "./types";

export const ATTEMPT_TIMEOUT_MS = 20_000;

type Api = Backend;
type AnyCall = (args: { body: unknown }, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; body: unknown; retryAfterSeconds?: number }>;

/** The contract client's method for an entry, untyped: the definition already checked the entry exists. */
export function contractCall(contract: Contract, baseUrl: string, entry: string): AnyCall {
  const client = createClient(contract, { baseUrl }) as unknown as Record<string, AnyCall>;
  const fn = client[entry];
  if (!fn) throw new Error(`${contract.area}.${entry} is not in the contract`);
  return fn;
}

export function outcomeOf<R extends { ok: boolean; status: number; retryAfterSeconds?: number }>(r: R): AttemptOutcome<R> {
  if (r.ok) return { kind: "done", value: r };
  if (isRetryableStatus(r.status)) return { kind: "retry", reason: `HTTP ${r.status}`, retryAfterSeconds: r.retryAfterSeconds };
  return { kind: "fail", value: r };
}

export interface SubmitDeps {
  query: URLSearchParams;
  /** Required when the definition has `captcha`: a new token for each call. */
  getCaptchaToken?: (action: string) => Promise<string>;
  retry?: RetryOptions;
}

export async function submitToApi(def: FormDefinition, backend: Api, values: Record<string, unknown>, deps: SubmitDeps): Promise<SubmitResult> {
  const send = contractCall(def.contract, backend.apiBaseUrl, def.submitEntry);
  const body = toRequestBody(def, values, deps.query);
  try {
    const { value: r } = await withRetry(async () => {
      const token = def.captcha ? await deps.getCaptchaToken!(def.captcha) : undefined; // fresh every attempt
      return outcomeOf(await send({ body: token ? { ...body, captchaToken: token } : body }, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) }));
    }, deps.retry);
    if (r.ok) return { ok: true };
    const fields = (r.body as { error?: { fields?: Record<string, string[]> } } | null)?.error?.fields;
    if (r.status === 400 && fields) return { ok: false, kind: "invalid", fields: topLevel(fields) };
    return { ok: false, kind: "failed", message: messageFor(r.status) };
  } catch {
    return { ok: false, kind: "failed", message: "We couldn't reach Remonta. Your details are saved on this device -- please check your connection and try again." };
  }
}

// The photo upload lives in photo-upload.ts (U3): ticket, direct upload, confirm.

/** "services.0" -> "services": messages attach to the field, not an array index. */
function topLevel(f: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(f)) (out[k.split(".")[0]!] ??= []).push(...v);
  return out;
}

export function messageFor(status: number): string {
  if (status === 403) return "We couldn't confirm you're not a robot. Please refresh the page and try again.";
  if (status === 413) return "Your photo is too large. Please choose a photo under 5 MB.";
  if (status === 415) return "Please upload a JPEG, PNG or WebP photo.";
  return "Something went wrong on our side. Your details are saved on this device -- please try again in a moment.";
}
