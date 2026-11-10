// document-history U1 (R3, R4): the admin's history page. A worker's past documents newest first, a short link to one,
// and the delete of one for good (audited; the file after the commit, only when nothing else uses it).
import { DOCUMENT_VERSIONS_MAX, type DocumentLink, type DocumentVersion, type DocumentVersionList } from '@remonta/api-contract'
import type { Clock } from '../../../platform/clock'
import type { AuditRecorder } from '../../../platform/audit'
import { ApiError } from '../../../platform/errors'
import { unitOfWork, type Db, type Prisma } from '../../../platform/persistence/db'
import type { PhotoStore } from '../../registration/adapters/photo-store'
import { deleteRemovedFile, removeVersion, type VersionStores } from '../../worker/application/document-version-removal'
import { linkFor } from '../../worker/application/service-documents'

const iso = (d: Date | null) => (d ? d.toISOString() : null)
const fileNameOf = (m: Prisma.JsonValue | null): string | null => {
  const n = m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, unknown>).fileName : null
  return typeof n === 'string' ? n.slice(0, 200) : null
}

const VERSION_SELECT = {
  id: true,
  requirementId: true,
  requirementType: true,
  requirementName: true,
  documentCategory: true,
  status: true,
  metadata: true,
  uploadedAt: true,
  expiresAt: true,
  reviewedAt: true,
  reviewedBy: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  reason: true,
  supersededAt: true,
} as const

type VersionRow = Prisma.DocumentVersionGetPayload<{ select: typeof VERSION_SELECT }>

/** The answer for one row: no storage key, no URL (the link entry gives one), strings bounded. */
export function versionView(r: VersionRow): DocumentVersion {
  return {
    id: r.id,
    requirementId: r.requirementId,
    requirementType: r.requirementType.slice(0, 200),
    name: r.requirementName.slice(0, 200),
    documentCategory: r.documentCategory,
    status: String(r.status),
    fileName: fileNameOf(r.metadata),
    uploadedAt: iso(r.uploadedAt),
    expiresAt: iso(r.expiresAt),
    reviewedAt: iso(r.reviewedAt),
    reviewedBy: r.reviewedBy ? r.reviewedBy.slice(0, 320) : null,
    approvedAt: iso(r.approvedAt),
    rejectedAt: iso(r.rejectedAt),
    rejectionReason: r.rejectionReason ? r.rejectionReason.slice(0, 2000) : null,
    reason: r.reason,
    supersededAt: r.supersededAt.toISOString(),
  }
}

export async function listDocumentVersions(deps: { db: Db }, workerId: string): Promise<DocumentVersionList> {
  const profile = await deps.db.workerProfile.findUnique({ where: { id: workerId }, select: { id: true } })
  if (!profile) throw new ApiError(404, 'worker not found')
  const rows = await deps.db.documentVersion.findMany({
    where: { workerProfileId: workerId },
    select: VERSION_SELECT,
    orderBy: [{ supersededAt: 'desc' }, { id: 'desc' }],
    take: DOCUMENT_VERSIONS_MAX + 1,
  })
  return { workerId, versions: rows.slice(0, DOCUMENT_VERSIONS_MAX).map(versionView), truncated: rows.length > DOCUMENT_VERSIONS_MAX }
}

export async function documentVersionLink(deps: { db: Db; clock: Clock; bucket?: PhotoStore }, versionId: string): Promise<{ link: DocumentLink; workerProfileId: string }> {
  const v = await deps.db.documentVersion.findUnique({ where: { id: versionId }, select: { workerProfileId: true, documentUrl: true, metadata: true } })
  if (!v) throw new ApiError(404, 'document version not found')
  return { link: await linkFor(deps.bucket, v, deps.clock()), workerProfileId: v.workerProfileId }
}

export async function deleteDocumentVersion(
  deps: { db: Db; stores: VersionStores; log: { warn(o: object, m: string): void } },
  audit: AuditRecorder,
  adminUserId: string,
  versionId: string,
): Promise<{ workerProfileId: string; fileDeleted: boolean }> {
  const removed = await unitOfWork(deps.db, async (tx) => {
    const r = await removeVersion(tx, versionId)
    if (!r) throw new ApiError(404, 'document version not found')
    await audit.record(tx, { action: 'DOCUMENT_VERSION_DELETE', userId: adminUserId, metadata: { versionId, workerProfileId: r.owner.profileId, fileDeleted: r.file !== null } })
    return r
  })
  await deleteRemovedFile(deps.stores, removed, deps.log)
  return { workerProfileId: removed.owner.profileId, fileDeleted: removed.file !== null }
}
