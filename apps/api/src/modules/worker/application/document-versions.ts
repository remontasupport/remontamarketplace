// document-history U1 (aidlc-docs inception/requirements R1, R2): a worker document is never lost to a re-upload, a
// worker's delete or a removed service. Each of those paths reads the old verification_requirements row inside its
// transaction; keepVersion copies it to document_versions in that same transaction, and the path no longer deletes the
// file after the commit. Only the admin delete and the 7-year retention job delete a kept file.
import type { Prisma, Tx } from '../../../platform/persistence/db'
import { fileOf } from './service-documents'

export type VersionReason = 'REPLACED' | 'DELETED_BY_WORKER' | 'SERVICE_REMOVED'

/** Everything a version keeps: the paths select this for the row they replace or delete. */
export const VERSION_SOURCE_SELECT = {
  id: true,
  workerProfileId: true,
  requirementType: true,
  requirementName: true,
  documentCategory: true,
  status: true,
  documentUrl: true,
  metadata: true,
  documentUploadedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  expiresAt: true,
} as const

export type VersionSource = Prisma.VerificationRequirementGetPayload<{ select: typeof VERSION_SOURCE_SELECT }>

/** A row with a file worth keeping: the api's own key or a stored URL. A Right to Work "citizen" row has neither. */
export function hasFile(row: { documentUrl: string | null; metadata: Prisma.JsonValue | null }): boolean {
  const f = fileOf(row)
  return f.storageKey !== null || f.url !== null
}

/** Copies the rows (those with a file) to document_versions; returns how many were kept. */
export async function keepVersions(tx: Tx, rows: readonly VersionSource[], reason: VersionReason, now: Date): Promise<number> {
  const kept = rows.filter(hasFile)
  if (!kept.length) return 0
  await tx.documentVersion.createMany({
    data: kept.map((r) => ({
      workerProfileId: r.workerProfileId,
      requirementId: r.id,
      requirementType: r.requirementType,
      requirementName: r.requirementName,
      documentCategory: r.documentCategory,
      status: r.status,
      documentUrl: r.documentUrl,
      metadata: (r.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      uploadedAt: r.documentUploadedAt,
      reviewedAt: r.reviewedAt,
      reviewedBy: r.reviewedBy,
      approvedAt: r.approvedAt,
      rejectedAt: r.rejectedAt,
      rejectionReason: r.rejectionReason,
      expiresAt: r.expiresAt,
      reason,
      supersededAt: now,
    })),
  })
  return kept.length
}
