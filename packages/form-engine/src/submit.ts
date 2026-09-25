// Sending a form to apps/api through its contract client, over a bad connection:
// a fresh CAPTCHA token for every attempt, retries with back-off honouring
// Retry-After, a timeout per attempt. Resending is safe: the server either never
// saw the request, rolled it back, or already accepted it and answers the same.
import { createClient, type Contract } from "@remonta/api-contract";
import { toRequestBody } from "./form";
import { isRetryableStatus, withRetry, type AttemptOutcome, type RetryOptions } from "./retry";
import type { Backend, FormDefinition, SubmitResult } from "./types";

export const ATTEMPT_TIMEOUT_MS = 20_000;

type Api = Extract<Backend, { mode: "api" }>;
type AnyCall = (args: { body: unknown }, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; body: unknown; retryAfterSeconds?: number }>;

function call(contract: Contract, baseUrl: string, entry: string): AnyCall {
  const client = createClient(contract, { baseUrl }) as unknown as Record<string, AnyCall>;
  const fn = client[entry];
  if (!fn) throw new Error(`${contract.area}.${entry} is not in the contract`);
  return fn;
}

function outcomeOf<R extends { ok: boolean; status: number; retryAfterSeconds?: number }>(r: R): AttemptOutcome<R> {
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
  const send = call(def.contract, backend.apiBaseUrl, def.submitEntry);
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

/** Stages a file through an upload entry and returns the field value it answers with. */
export async function uploadToApi(def: FormDefinition, backend: Api, entry: string, file: Blob & { name?: string }, deps: { retry?: RetryOptions } = {}): Promise<string> {
  const send = call(def.contract, backend.apiBaseUrl, entry);
  const { value, ok } = await withRetry(async () => {
    const body = new FormData();
    body.append("photo", file, file.name ?? "photo.jpg");
    return outcomeOf(await send({ body }, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) }));
  }, deps.retry);
  const answer = value.body as { photoUploadId?: string; error?: { fields?: Record<string, string[]> } } | null;
  if (ok && value.ok && answer?.photoUploadId) return answer.photoUploadId;
  throw new Error(answer?.error?.fields?.photo?.[0] ?? "Your photo could not be uploaded. Please try another photo.");
}

/** "services.0" -> "services": messages attach to the field, not an array index. */
function topLevel(f: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(f)) (out[k.split(".")[0]!] ??= []).push(...v);
  return out;
}

function messageFor(status: number): string {
  if (status === 403) return "We couldn't confirm you're not a robot. Please refresh the page and try again.";
  if (status === 413 || status === 415) return "Your photo could not be accepted. Please upload a JPEG, PNG, WebP or HEIC photo.";
  return "Something went wrong on our side. Your details are saved on this device -- please try again in a moment.";
}
