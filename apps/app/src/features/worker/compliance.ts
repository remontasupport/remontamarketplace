// The Compliance steps on apps/api (api-review U4b): the logic the legacy steps reach for, with no React in it.
// - the documents: read from the profile's `complianceDocuments`, in the shapes the steps already read;
// - an upload: staged straight to the private bucket, then confirmed as a compliance document (U4a);
// - the Right to Work citizenship answer.
import type { ComplianceDocument, Profile } from "@remonta/api-contract";
import { workerApi, type WorkerApi } from "./api";
import { fileNameOf, isTransient, messageOf, stageDocument, type UploadFailure } from "./services";

/** One document in the shape the compliance steps read (`documentType` is the key, `expiryDate` a calendar date). */
export interface LegacyComplianceDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  documentCategory: string | null;
  status: string;
  uploadedAt: string;
  expiryDate?: string;
}

export function legacyComplianceOf(d: ComplianceDocument): LegacyComplianceDocument {
  return {
    id: d.id,
    documentType: d.requirementType,
    documentUrl: d.url ?? "",
    documentCategory: d.documentCategory,
    status: d.status,
    uploadedAt: d.uploadedAt ?? "",
    ...(d.expiresAt ? { expiryDate: d.expiresAt.slice(0, 10) } : {}),
  };
}

type Docs = Pick<Profile, "complianceDocuments">;

/** The rows of one type that hold a file, newest first, plus the Right to Work answer (the legacy list format). */
export function documentsOf(profile: Docs, documentType: string): { success: true; documents: LegacyComplianceDocument[]; metadata: { isCitizen: boolean } | null } {
  const rows = profile.complianceDocuments.filter((d) => d.requirementType === documentType);
  const answer = rows.find((d) => d.isCitizen !== null)?.isCitizen;
  return {
    success: true,
    documents: rows
      .filter((d) => d.url)
      .sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""))
      .map(legacyComplianceOf),
    metadata: answer === undefined || answer === null ? null : { isCitizen: answer },
  };
}

/** The one document of a type, or null (the legacy single format: a row without a file is no document). */
export function documentOf(profile: Docs, documentType: string): { document: LegacyComplianceDocument | null } {
  return { document: documentsOf(profile, documentType).documents[0] ?? null };
}

/** The 100-point identity documents and the vehicle driver's licence, as the identity step and the vehicle question read them. */
export function isIdentityType(documentType: string): boolean {
  return documentType.startsWith("identity-") || documentType === "driver-license-vehicle";
}

export function identityDocumentsOf(profile: Docs): { success: true; documents: LegacyComplianceDocument[] } {
  return { success: true, documents: profile.complianceDocuments.filter((d) => d.url && isIdentityType(d.requirementType)).map(legacyComplianceOf) };
}

/**
 * One compliance document, the whole way: staged, then confirmed under its key. A date already passed is refused by
 * the api ("This document has expired", DC5) and nothing is saved.
 */
export async function uploadComplianceDocument(
  file: File,
  target: { requirementType: string; expiryDate?: string | null; acknowledgement?: { workerName: string; signatureDate: string } | null },
  opts: { onProgress?: (percent: number) => void; api?: WorkerApi } = {},
): Promise<{ ok: true; document: ComplianceDocument } | UploadFailure> {
  const api = opts.api ?? workerApi;
  const staged = await stageDocument(file, opts);
  if (!staged.ok) return staged;
  const confirmed = await api.confirmComplianceDocument({
    uploadId: staged.uploadId,
    requirementType: target.requirementType,
    fileName: fileNameOf(file),
    expiryDate: target.expiryDate || null,
    acknowledgement: target.acknowledgement ?? null,
  });
  return confirmed.kind === "ok" ? { ok: true, document: confirmed.body } : { ok: false, message: messageOf(confirmed), retryable: isTransient(confirmed) };
}

/** The Right to Work answer: a citizen needs no document. */
export async function saveCitizenship(isCitizen: boolean, api: WorkerApi = workerApi): Promise<{ ok: true } | { ok: false; message: string }> {
  const r = await api.putCitizenship({ isCitizen });
  return r.kind === "ok" ? { ok: true } : { ok: false, message: messageOf(r, "We couldn't save your answer right now. Please try again.") };
}
