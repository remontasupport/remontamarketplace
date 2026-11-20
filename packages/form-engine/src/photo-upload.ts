// The sign-up photo's direct upload (U3, functional design R6, L6): ask the api for a
// ticket, send the file straight to storage through the platform's Uploader, then ask
// the api to confirm. The api never carries the bytes. The signed agreement
// (signup-abn-agreement U2) uses the same loop without the confirm: the submit checks it. Over a bad connection: up to
// two more tries on the same ticket, then one fresh ticket, then the field error; the
// engine's retry (Retry-After, offline pause) wraps the api calls; an abort signal
// stops everything (a new pick, leaving the form). No DOM here (P-7): the transport
// is the port.
import { isHeicHeader as sniffHeic } from "@remonta/schemas/image-type";
import { contractCall, outcomeOf, ATTEMPT_TIMEOUT_MS } from "./submit";
import { backoffMs, withRetry, type RetryOptions } from "./retry";
import type { Backend, FieldDef, FormDefinition, UploadError, UploadProgress, UploadTarget, Uploader } from "./types";

export const HEIC_MESSAGE = "This photo is in HEIC format. Please choose a JPEG or PNG. On iPhone, set Camera > Formats > Most Compatible.";
export const UPLOAD_FAILED_MESSAGE = "Your photo could not be uploaded. Please try again or choose another photo.";
export const PHOTO_TOO_LARGE_MESSAGE = "Your photo is too large. Please choose a photo under 5 MB.";
export const PHOTO_NOT_ACCEPTED_MESSAGE = "Please upload a JPEG, PNG or WebP photo.";
export const PHOTO_SERVICE_MESSAGE = "We couldn't upload your photo right now. Please try again in a moment.";

/** Tries on one ticket after the first (R6.3), and fresh tickets after the first (R6.6). */
export const SAME_TICKET_RETRIES = 2;
export const FRESH_TICKETS = 1;

/** True when the bytes are a HEIC container: refused on the device before any upload (R7.2). */
export function isHeicHeader(bytes: Uint8Array): boolean {
  return sniffHeic(bytes);
}

export const AGREEMENT_UPLOAD_FAILED_MESSAGE = "Your signed agreement could not be saved. Please check your connection and sign again.";
export const AGREEMENT_SERVICE_MESSAGE = "We couldn't save your signed agreement right now. Please try again in a moment.";

/** A failure the field shows; the message is already the person's. */
export class UploadFieldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadFieldError";
  }
}
/** The photo's name for it (U3). */
export const PhotoFieldError = UploadFieldError;
export type PhotoFieldError = UploadFieldError;

/** What differs between the uploads that share the loop. */
interface DirectUpload {
  ticketEntry: string;
  /** Absent: the upload is done once the file is in storage (the submit checks it). */
  confirmEntry?: string;
  /** The ticket's id key: `photoUploadId` or `uploadId`. */
  idKey: string;
  /** The field the api names in its errors. */
  errorField: string;
  messages: { failed: string; tooLarge: string; notAccepted: string; service: string };
}

const PHOTO_MESSAGES = { failed: UPLOAD_FAILED_MESSAGE, tooLarge: PHOTO_TOO_LARGE_MESSAGE, notAccepted: PHOTO_NOT_ACCEPTED_MESSAGE, service: PHOTO_SERVICE_MESSAGE };
const AGREEMENT_MESSAGES = { failed: AGREEMENT_UPLOAD_FAILED_MESSAGE, tooLarge: AGREEMENT_UPLOAD_FAILED_MESSAGE, notAccepted: AGREEMENT_UPLOAD_FAILED_MESSAGE, service: AGREEMENT_SERVICE_MESSAGE };

export interface StagePhotoDeps {
  uploader: Uploader;
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;
  retry?: RetryOptions;
  /** For tests. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

type Ticket = Record<string, unknown> & { upload: UploadTarget; expiresAt: string };

/** The declared type: the sniffed one when known, else the file's, else JPEG (R7.4). */
export function declaredTypeOf(header: Uint8Array, fileType: string | undefined): "image/jpeg" | "image/png" | "image/webp" {
  const b = header;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP") return "image/webp";
  if (fileType === "image/png" || fileType === "image/webp") return fileType;
  return "image/jpeg";
}

/**
 * Stages a photo and returns the id the sign-up sends. `header` is the file's first
 * bytes (the platform reads them; the engine cannot). Throws PhotoFieldError with the
 * message to show, or the abort reason.
 */
export function stagePhoto(
  def: FormDefinition,
  backend: Backend,
  field: Extract<FieldDef, { kind: "photo" }>,
  file: Blob & { name?: string; type?: string },
  header: Uint8Array,
  deps: StagePhotoDeps,
): Promise<string> {
  const spec = { ticketEntry: field.ticketEntry, confirmEntry: field.confirmEntry, idKey: "photoUploadId", errorField: "photo", messages: PHOTO_MESSAGES };
  return stageDirect(def, backend, spec, file, declaredTypeOf(header, file.type), deps);
}

/** Stages the signed agreement PDF (signup-abn-agreement U2) and returns its upload id; no confirm. */
export function stageAgreement(def: FormDefinition, backend: Backend, field: Extract<FieldDef, { kind: "agreement" }>, pdf: Blob, deps: StagePhotoDeps): Promise<string> {
  const spec = { ticketEntry: field.ticketEntry, idKey: "uploadId", errorField: "agreement", messages: AGREEMENT_MESSAGES };
  return stageDirect(def, backend, spec, pdf, "application/pdf", deps);
}

async function stageDirect(def: FormDefinition, backend: Backend, spec: DirectUpload, file: Blob, contentType: string, deps: StagePhotoDeps): Promise<string> {
  const ticketCall = contractCall(def.contract, backend.apiBaseUrl, spec.ticketEntry);
  const confirmCall = spec.confirmEntry ? contractCall(def.contract, backend.apiBaseUrl, spec.confirmEntry) : null;
  const now = deps.now ?? (() => Date.now());
  const sleep = deps.sleep ?? deps.retry?.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const progress = (p: UploadProgress) => deps.onProgress?.(p);
  const m = spec.messages;

  for (let fresh = 0; fresh <= FRESH_TICKETS; fresh++) {
    throwIfAborted(deps.signal);
    progress("indeterminate");
    const ticket = await apiCall<Ticket>(ticketCall, { contentType, sizeBytes: file.size }, deps, spec);
    const id = ticket[spec.idKey] as string;
    const expiresAt = Date.parse(ticket.expiresAt);
    let sameTicketTries = 0;
    let ticketDead = false;
    while (!ticketDead) {
      throwIfAborted(deps.signal);
      if (now() >= expiresAt) break; // R6.6: expired -> a fresh ticket
      try {
        await deps.uploader.upload(file, ticket.upload, { onProgress: (sent, total) => progress({ sent, total }), signal: deps.signal });
      } catch (err) {
        throwIfAborted(deps.signal);
        const e = err as UploadError;
        if (e && e.policyRefused) break; // R6.4: storage refused the ticket
        if (++sameTicketTries > SAME_TICKET_RETRIES) break; // R6.3
        await sleep(backoffMs(sameTicketTries, deps.retry?.baseDelayMs ?? 1000, deps.retry?.maxDelayMs ?? 8000));
        continue;
      }
      if (!confirmCall) return id;
      progress("indeterminate");
      const r = await confirm(confirmCall, { [spec.idKey]: id }, deps, spec);
      if (r.status === 200) return id;
      if (r.status === 409) {
        // R6.5: the object is not there (yet): same as an upload failure.
        if (++sameTicketTries > SAME_TICKET_RETRIES) break;
        await sleep(backoffMs(sameTicketTries, deps.retry?.baseDelayMs ?? 1000, deps.retry?.maxDelayMs ?? 8000));
        continue;
      }
      if (r.status === 413) throw new UploadFieldError(r.fieldMessage ?? m.tooLarge);
      if (r.status === 415) throw new UploadFieldError(r.fieldMessage ?? m.notAccepted);
      if (r.status === 404) {
        ticketDead = true; // nothing to confirm under this id any more
        break;
      }
      throw new UploadFieldError(r.fieldMessage ?? m.service);
    }
  }
  throw new UploadFieldError(m.failed);
}

type Answer = { status: number; body: unknown; fieldMessage?: string };

/** The api call under the engine's retry (Retry-After, offline pause); 400/415 and the like are final. */
async function apiCall<T>(call: ReturnType<typeof contractCall>, body: unknown, deps: StagePhotoDeps, spec: DirectUpload): Promise<T> {
  let out: { value: { ok: boolean; status: number; body: unknown }; ok: boolean };
  try {
    out = await withRetry(async () => outcomeOf(await call({ body }, { signal: anySignal(deps.signal, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)) })), deps.retry);
  } catch (err) {
    throwIfAborted(deps.signal);
    throw new UploadFieldError(spec.messages.service);
  }
  if (out.value.ok) return out.value.body as T;
  const m = spec.messages;
  throw new UploadFieldError(fieldMessageOf(out.value.body, spec.errorField) ?? (out.value.status === 413 ? m.tooLarge : out.value.status === 415 ? m.notAccepted : m.service));
}

/** Confirm: 409 and 404 are decisions for the loop, not failures; 429/503 are retried by the engine. */
async function confirm(call: ReturnType<typeof contractCall>, body: Record<string, string>, deps: StagePhotoDeps, spec: DirectUpload): Promise<Answer> {
  try {
    const { value } = await withRetry(async () => {
      const r = await call({ body }, { signal: anySignal(deps.signal, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)) });
      if (r.status === 409 || r.status === 404) return { kind: "fail" as const, value: r };
      return outcomeOf(r);
    }, deps.retry);
    return { status: value.status, body: value.body, fieldMessage: fieldMessageOf(value.body, spec.errorField) };
  } catch (err) {
    throwIfAborted(deps.signal);
    throw new UploadFieldError(spec.messages.service);
  }
}

function fieldMessageOf(body: unknown, field: string): string | undefined {
  return (body as { error?: { fields?: Record<string, string[] | undefined> } } | null)?.error?.fields?.[field]?.[0];
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : new Error("upload aborted");
}

function anySignal(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
  if (!a) return b;
  const c = new AbortController();
  const onAbort = (s: AbortSignal) => () => c.abort(s.reason);
  if (a.aborted) c.abort(a.reason);
  else a.addEventListener("abort", onAbort(a), { once: true });
  if (b.aborted) c.abort(b.reason);
  else b.addEventListener("abort", onAbort(b), { once: true });
  return c.signal;
}
