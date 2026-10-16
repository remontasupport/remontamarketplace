// Compliance documents (api-review U4a, u4a-compliance-documents-design.md): identity, screening checks, trainings,
// the contract and the Code of Conduct, kept in the private bucket (DC2) through U3b's ticket, staging check and copy.
// Replaces the app's uploadComplianceDocument / POST /api/compliance/upload / deleteComplianceDocument / the
// identity-documents delete and the citizenship PATCH.
//
// One row per type (found, then updated or created), as the app writes it today: `requirementType` is the type key,
// `documentCategory` the 100-point split for identity, the review fields cleared on a new file, and the worker's
// `verificationStatus` moved to PENDING_REVIEW, which is what puts the worker in the admin review queue.
import { randomUUID } from 'node:crypto'
import type { ComplianceDocument, ConfirmComplianceDocumentBody } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import type { Prisma, Tx } from '../../../platform/persistence/db'
import { complianceSpecOf, LEGACY_COMPLIANCE_FOLDERS, type ComplianceDocumentSpec } from '../domain/compliance-documents'
import { isBlobUrl } from './photos'
import { documentPath, fileOf, type DocumentFile, type StagedDocument } from './service-documents'

const metaOf = (m: Prisma.JsonValue | null | undefined): Record<string, unknown> => (m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, unknown>) : {})

/**
 * "Not a service document", null categories included: most compliance rows have no category, and in SQL
 * `NOT (category = 'SERVICE_QUALIFICATION')` is not true for a NULL -- such rows were never found (CI, PR #70: a
 * re-upload made a second row, a delete answered 404).
 */
export const NOT_A_SERVICE_DOCUMENT = { OR: [{ documentCategory: null }, { documentCategory: { not: 'SERVICE_QUALIFICATION' as const } }] }

export const COMPLIANCE_ROW_SELECT = { id: true, requirementType: true, requirementName: true, status: true, documentCategory: true, documentUrl: true, documentUploadedAt: true, expiresAt: true, metadata: true } as const

export function complianceView(row: {
  id: string
  requirementType: string
  requirementName: string
  status: string
  documentCategory: string | null
  documentUrl: string | null
  documentUploadedAt: Date | null
  expiresAt: Date | null
  metadata: Prisma.JsonValue | null
}): ComplianceDocument {
  const m = metaOf(row.metadata)
  return {
    id: row.id.slice(0, 40),
    requirementType: row.requirementType.slice(0, 120),
    name: row.requirementName.slice(0, 200),
    status: String(row.status).slice(0, 20),
    documentCategory: row.documentCategory ? String(row.documentCategory).slice(0, 40) : null,
    url: row.documentUrl ? row.documentUrl.slice(0, 2048) : null,
    fileName: typeof m.fileName === 'string' ? m.fileName.slice(0, 200) : null,
    uploadedAt: row.documentUploadedAt ? row.documentUploadedAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    isCitizen: typeof m.isCitizen === 'boolean' ? m.isCitizen : null,
  }
}

export interface ComplianceTarget {
  profileId: string
  type: string
  spec: ComplianceDocumentSpec
}

/** The worker's profile and the type's spec, read before the bucket is touched; the type's own rules on the body. */
export async function complianceTargetOf(db: Tx | Prisma.TransactionClient, userId: string, body: ConfirmComplianceDocumentBody): Promise<ComplianceTarget> {
  const profile = await db.workerProfile.findUnique({ where: { userId }, select: { id: true } })
  if (!profile) throw new ApiError(404, 'worker profile not found')
  const known = complianceSpecOf(body.requirementType, null)
  const spec = known ?? complianceSpecOf(body.requirementType, await db.document.findUnique({ where: { id: body.requirementType }, select: { name: true, category: true } }))
  // C4: today any type string became a row; only the table's types and the catalogue's compliance and training documents.
  if (!spec) throw new ApiError(400, `document type ${body.requirementType} not a compliance document`, { requirementType: ['That is not a document we ask for here'] })
  if (spec.expiryRequired && !body.expiryDate) throw new ApiError(400, `${body.requirementType} needs an expiry`, { expiryDate: ['Please enter the expiry date'] })
  if (!spec.acknowledgement && body.acknowledgement) throw new ApiError(400, 'acknowledgement only for the Code of Conduct', { acknowledgement: ['Not for this document'] })
  if (spec.acknowledgement && !body.acknowledgement) throw new ApiError(400, 'the Code of Conduct needs its acknowledgement', { acknowledgement: ['Please sign the Code of Conduct'] })
  return { profileId: profile.id, type: body.requirementType, spec }
}

/** Records the file as the row of its type; returns the view and the file it replaced (deleted after the commit). */
export async function recordComplianceDocument(
  tx: Tx,
  target: ComplianceTarget,
  body: ConfirmComplianceDocumentBody,
  staged: StagedDocument,
  now: Date,
): Promise<{ view: ComplianceDocument; replaced: DocumentFile | null }> {
  const existing = await tx.verificationRequirement.findFirst({
    where: { workerProfileId: target.profileId, requirementType: target.type, ...NOT_A_SERVICE_DOCUMENT },
    select: { id: true, documentUrl: true, metadata: true },
    orderBy: { updatedAt: 'desc' },
  })
  const id = existing?.id ?? randomUUID()
  const { storageKey: _k, fileName: _f, contentType: _c, sizeBytes: _s, uploadId: _u, ...kept } = metaOf(existing?.metadata)
  const metadata = {
    ...kept,
    storageKey: staged.key,
    fileName: body.fileName,
    contentType: staged.type,
    sizeBytes: staged.sizeBytes,
    uploadId: body.uploadId,
    ...(body.acknowledgement ? { workerName: body.acknowledgement.workerName, signatureDate: body.acknowledgement.signatureDate, acknowledgedAt: now.toISOString() } : {}),
  }
  const data = {
    requirementName: target.spec.name,
    documentCategory: target.spec.documentCategory,
    status: 'SUBMITTED' as const,
    documentUrl: documentPath(id, body.fileName, staged.type),
    documentUploadedAt: now,
    submittedAt: now,
    expiresAt: body.expiryDate ? new Date(`${body.expiryDate}T00:00:00.000Z`) : null,
    reviewedAt: null,
    reviewedBy: null,
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    updatedAt: now,
    metadata,
  }
  const row = existing
    ? await tx.verificationRequirement.update({ where: { id }, data, select: COMPLIANCE_ROW_SELECT })
    : await tx.verificationRequirement.create({ data: { id, workerProfileId: target.profileId, requirementType: target.type, isRequired: target.spec.required, ...data }, select: COMPLIANCE_ROW_SELECT })
  // As today: a new document puts the worker in the review queue.
  await tx.workerProfile.update({ where: { id: target.profileId }, data: { verificationStatus: 'PENDING_REVIEW' }, select: { id: true } })
  const old = existing ? fileOf(existing) : null
  return { view: complianceView(row), replaced: old && (old.storageKey !== staged.key || old.url !== row.documentUrl) ? old : null }
}

/** A retry of a confirm already recorded (the staging object has moved): its row, or null. */
export async function complianceAlreadyRecorded(db: Tx | Prisma.TransactionClient, profileId: string, uploadId: string): Promise<ComplianceDocument | null> {
  const row = await db.verificationRequirement.findFirst({
    where: { workerProfileId: profileId, ...NOT_A_SERVICE_DOCUMENT, metadata: { path: ['uploadId'], equals: uploadId } },
    select: COMPLIANCE_ROW_SELECT,
  })
  return row ? complianceView(row) : null
}

/** Deletes one of the worker's compliance rows (never a service document: those have their own entry). */
export async function removeComplianceDocument(tx: Tx, profileId: string, documentId: string): Promise<DocumentFile> {
  const row = await tx.verificationRequirement.findFirst({
    where: { id: documentId, workerProfileId: profileId, ...NOT_A_SERVICE_DOCUMENT },
    select: { id: true, documentUrl: true, metadata: true },
  })
  if (!row) throw new ApiError(404, 'compliance document not found') // another worker's is never revealed
  await tx.verificationRequirement.delete({ where: { id: row.id } })
  return fileOf(row)
}

/**
 * The Right to Work answer (the C1 rule, on the api): a citizen needs no document and is SUBMITTED; a "no" leaves an
 * uploaded document's status alone and takes back a claim that has no file.
 */
export async function writeCitizenship(tx: Tx, profileId: string, isCitizen: boolean, now: Date): Promise<ComplianceDocument> {
  const existing = await tx.verificationRequirement.findFirst({
    where: { workerProfileId: profileId, requirementType: 'right-to-work' },
    select: { id: true, status: true, submittedAt: true, documentUrl: true, metadata: true },
    orderBy: { updatedAt: 'desc' },
  })
  const row = existing
    ? await tx.verificationRequirement.update({
        where: { id: existing.id },
        data: {
          metadata: { ...metaOf(existing.metadata), isCitizen },
          status: isCitizen ? 'SUBMITTED' : existing.documentUrl ? existing.status : 'PENDING',
          submittedAt: isCitizen ? (existing.submittedAt ?? now) : existing.documentUrl ? existing.submittedAt : null,
          updatedAt: now,
        },
        select: COMPLIANCE_ROW_SELECT,
      })
    : await tx.verificationRequirement.create({
        data: { workerProfileId: profileId, requirementType: 'right-to-work', requirementName: 'Right to Work Documents', isRequired: true, status: isCitizen ? 'SUBMITTED' : 'PENDING', submittedAt: isCitizen ? now : null, metadata: { isCitizen }, updatedAt: now },
        select: COMPLIANCE_ROW_SELECT,
      })
  return complianceView(row)
}

/**
 * A legacy compliance file the app stored for this user: on Blob's host, under `<legacy folder>/<userId>/`, nothing
 * after the path. Being on the worker's row is not enough (C5: a copied reference shared one URL between rows).
 */
export function ownComplianceBlobUrl(url: string, userId: string): boolean {
  if (!isBlobUrl(url)) return false
  const u = new URL(url)
  if (u.search || u.hash || u.pathname.includes('..') || u.pathname.includes('%2')) return false
  return LEGACY_COMPLIANCE_FOLDERS.some((f) => u.pathname.startsWith(`/${f}/${userId}/`))
}
