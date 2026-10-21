// The Services pages on apps/api (api-review U3c): the logic the legacy pages reach for, with no React in it.
// - service documents: read from the profile, uploaded straight to the private bucket (ticket -> upload -> confirm),
//   deleted by id (U3b);
// - the nursing and therapeutic registrations: read from the profile, saved by PUT (U3a), in the shape the pages'
//   forms already hold (day, month name, year).
import type { Profile, ServiceDocument, ServiceRegistrationBody, ServiceRegistrationView } from "@remonta/api-contract";
import { DOCUMENT_HEADER_BYTES, DOCUMENT_MAX_BYTES, detectDocumentType, type DocumentType } from "@remonta/schemas/document-type";
import { xhrUploader } from "@/features/forms/adapters/xhrUploader";
import type { ApiOutcome } from "@/lib/api/outcome";
import { workerApi, type WorkerApi } from "./api";

export const DOCUMENT_SERVICE_MESSAGE = "We couldn't save your document right now. Please try again in a moment.";
export const DOCUMENT_TYPE_MESSAGE = "Please upload a PDF, or a photo (JPEG, PNG, WebP or HEIC).";
export const DOCUMENT_SIZE_MESSAGE = "Your document is too large. Please choose a file under 50 MB.";

/** The words a page shows for a refused or failed call: the api's own field message when it gave one. */
export function messageOf(r: Exclude<ApiOutcome<unknown>, { kind: "ok" }>, fallback = DOCUMENT_SERVICE_MESSAGE): string {
  if (r.kind === "rateLimited") return "Too many changes at once. Please wait a moment and try again.";
  if (r.kind === "unauthenticated") return "Your session has ended. Please sign in again.";
  if (r.kind === "failed" && r.fields) return Object.values(r.fields)[0]?.[0] ?? fallback;
  return fallback;
}

// ---- Documents --------------------------------------------------------------------------------------------------

/** The shape the legacy pages read (`documentType` is the type id, `serviceTitle` the service's name). */
export interface LegacyServiceDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
  status: string;
  serviceTitle: string | null;
  fileName: string | null;
}

export function legacyDocumentOf(d: ServiceDocument): LegacyServiceDocument {
  return { id: d.id, documentType: d.requirementType, documentUrl: d.url ?? "", uploadedAt: d.uploadedAt ?? "", status: d.status, serviceTitle: d.serviceName || null, fileName: d.fileName };
}

/** The category id of a chosen service, by the name the pages carry; undefined when it is not one of the worker's. */
export function categoryIdOf(profile: Pick<Profile, "services">, serviceTitle: string): string | undefined {
  const t = serviceTitle.trim().toLowerCase();
  return profile.services.find((s) => s.categoryName.trim().toLowerCase() === t)?.categoryId;
}

/** The file's real type from its first bytes (never its name or the browser's guess), or null when not accepted. */
export async function documentTypeOf(file: Blob): Promise<DocumentType | null> {
  const head = new Uint8Array(await file.slice(0, DOCUMENT_HEADER_BYTES).arrayBuffer());
  const t = detectDocumentType(head);
  // A HEIF container reads as HEIC; the browser's own type keeps the HEIF label for the policy when it says so.
  return t === "image/heic" && file.type === "image/heif" ? "image/heif" : t;
}

/** An upload that did not go through; `retryable` when trying again could help (the api or the network away). */
export type UploadFailure = { ok: false; message: string; retryable: boolean };

/** True for an outcome a second attempt could change (not a refusal of the request itself). */
export function isTransient(r: Exclude<ApiOutcome<unknown>, { kind: "ok" }>): boolean {
  return r.kind === "unavailable" || (r.kind === "failed" && r.status >= 500);
}

/**
 * The first two of a document's three calls (U3b, U4a): the file checked here, a ticket, the bytes straight to the
 * private bucket. The answer is the upload's id for the confirm, or a message for the page.
 */
export async function stageDocument(file: File, opts: { onProgress?: (percent: number) => void; api?: WorkerApi } = {}): Promise<{ ok: true; uploadId: string } | UploadFailure> {
  const api = opts.api ?? workerApi;
  const type = await documentTypeOf(file);
  if (!type) return { ok: false, message: DOCUMENT_TYPE_MESSAGE, retryable: false };
  if (file.size > DOCUMENT_MAX_BYTES) return { ok: false, message: DOCUMENT_SIZE_MESSAGE, retryable: false };
  const ticket = await api.createServiceDocumentTicket({ contentType: type, sizeBytes: file.size });
  if (ticket.kind !== "ok") return { ok: false, message: messageOf(ticket), retryable: isTransient(ticket) };
  try {
    await xhrUploader.upload(file, ticket.body.upload, { onProgress: (sent, total) => opts.onProgress?.(Math.round((sent / total) * 100)) });
  } catch {
    return { ok: false, message: DOCUMENT_SERVICE_MESSAGE, retryable: true };
  }
  return { ok: true, uploadId: ticket.body.uploadId };
}

/** One service document, the whole way: staged, then confirmed. The answer is the document as recorded, or a message for the page. */
export async function uploadServiceDocument(
  file: File,
  target: { categoryId: string; requirementType: string },
  opts: { onProgress?: (percent: number) => void; api?: WorkerApi } = {},
): Promise<{ ok: true; document: ServiceDocument } | { ok: false; message: string }> {
  const api = opts.api ?? workerApi;
  const staged = await stageDocument(file, opts);
  if (!staged.ok) return { ok: false, message: staged.message };
  const confirmed = await api.confirmServiceDocument({ uploadId: staged.uploadId, categoryId: target.categoryId, requirementType: target.requirementType, fileName: fileNameOf(file) });
  return confirmed.kind === "ok" ? { ok: true, document: confirmed.body } : { ok: false, message: messageOf(confirmed) };
}

/** The file's own name as the api accepts it: no path, no control characters, at most 200 characters. */
export function fileNameOf(file: { name?: string }): string {
  const base = (file.name ?? "").split(/[\\/]/).pop() ?? "";
  const clean = [...base].filter((c) => c >= " " && c !== "\u007f").join("").trim().slice(0, 200);
  return clean || "document";
}

// ---- Registrations ----------------------------------------------------------------------------------------------

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

export interface RegistrationForm {
  nursingType?: "registered" | "enrolled";
  hasExperience?: boolean;
  registrationNumber?: string;
  expiryDay?: string;
  expiryMonth?: string;
  expiryYear?: string;
}

/** A stored registration in the form's shape (the month by name, the day without padding, as the pickers hold them). */
export function formOf(v: ServiceRegistrationView | undefined): RegistrationForm | null {
  if (!v) return null;
  const [y, m, d] = v.expiryDate ? v.expiryDate.split("-") : [];
  return {
    ...(v.nursingType ? { nursingType: v.nursingType } : {}),
    ...(v.hasExperience !== null ? { hasExperience: v.hasExperience } : {}),
    registrationNumber: v.registrationNumber ?? "",
    expiryDay: d ? String(Number(d)) : "",
    expiryMonth: m ? (MONTHS[Number(m) - 1] ?? "") : "",
    expiryYear: y ?? "",
  };
}

/** YYYY-MM-DD from the three pickers, or null when any is missing. */
export function expiryOf(f: RegistrationForm): string | null {
  const month = MONTHS.indexOf((f.expiryMonth ?? "") as (typeof MONTHS)[number]) + 1;
  const day = Number(f.expiryDay);
  const year = Number(f.expiryYear);
  if (!month || !day || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function registrationBodyOf(service: "nursing-services" | "therapeutic-supports", f: RegistrationForm): ServiceRegistrationBody {
  if (service === "therapeutic-supports") return { categoryId: service, registrationNumber: (f.registrationNumber ?? "").trim(), expiryDate: expiryOf(f) ?? "" };
  const nursingType = f.nursingType ?? "registered";
  return nursingType === "enrolled"
    ? { categoryId: service, nursingType, hasExperience: f.hasExperience ?? false, registrationNumber: null, expiryDate: null }
    : { categoryId: service, nursingType, hasExperience: f.hasExperience ?? false, registrationNumber: (f.registrationNumber ?? "").trim(), expiryDate: expiryOf(f) ?? "" };
}

/** The page's error keys for the api's field names (the pages show `registrationNumber` and `expiryDate`). */
export async function saveRegistration(service: "nursing-services" | "therapeutic-supports", f: RegistrationForm, api: WorkerApi = workerApi): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const r = await api.putServiceRegistration(registrationBodyOf(service, f));
  if (r.kind === "ok") return { ok: true };
  if (r.kind === "failed" && r.fields) {
    const errors: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.fields)) errors[k.endsWith("expiryDate") ? "expiryDate" : k.endsWith("registrationNumber") ? "registrationNumber" : "general"] = v[0] ?? DOCUMENT_SERVICE_MESSAGE;
    return { ok: false, errors };
  }
  return { ok: false, errors: { general: messageOf(r, "We couldn't save your registration right now. Please try again.") } };
}
