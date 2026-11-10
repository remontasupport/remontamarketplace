// document-history U1 (R4, R5): the only two ways a kept worker document is deleted -- an admin's delete of one version,
// and the retention job after seven years. Both remove the row in a transaction, then the file after the commit, and
// only when nothing else still points at that file (a current document, or another version) and the api can prove the
// file is this worker's (deleteDocumentFiles: its own bucket key, or a legacy Blob URL in the worker's own folder).
import type { Prisma, Tx } from '../../../platform/persistence/db'
import type { PhotoStore } from '../../registration/adapters/photo-store'
import { ownComplianceBlobUrl } from './compliance-documents'
import { ownServiceDocument } from './sections/services'
import { deleteDocumentFiles, fileOf, type DocumentFile } from './service-documents'

/** Seven years (D2, user 2026-11-11). */
export const VERSION_RETENTION_YEARS = 7

/** The newest supersededAt a version may have and still be deleted by the retention job: now minus seven years (UTC). */
export function retentionCutoff(now: Date): Date {
  const d = new Date(now.getTime())
  d.setUTCFullYear(d.getUTCFullYear() - VERSION_RETENTION_YEARS)
  return d
}

export interface RemovedVersion {
  owner: { userId: string; profileId: string }
  /** The file to delete after the commit; null when it had none or something still uses it. */
  file: DocumentFile | null
}

/** Is the file still used by a current document or another version of this worker? (A legacy https URL compared as is.) */
async function stillUsed(tx: Tx, profileId: string, f: DocumentFile): Promise<boolean> {
  if (f.storageKey) {
    const byKey = { workerProfileId: profileId, metadata: { path: ['storageKey'], equals: f.storageKey } }
    return (await tx.verificationRequirement.count({ where: byKey })) > 0 || (await tx.documentVersion.count({ where: byKey })) > 0
  }
  if (f.url && /^https:\/\//.test(f.url)) {
    // A legacy URL may have been copied onto another worker's row (C5): any row anywhere keeps it.
    return (await tx.verificationRequirement.count({ where: { documentUrl: f.url } })) > 0 || (await tx.documentVersion.count({ where: { documentUrl: f.url } })) > 0
  }
  return true // nothing the api could delete
}

/** Deletes one version row inside `tx`; null when there is none. The file is for the caller to delete after the commit. */
export async function removeVersion(tx: Tx, versionId: string): Promise<RemovedVersion | null> {
  const v = await tx.documentVersion.findUnique({
    where: { id: versionId },
    select: { id: true, workerProfileId: true, documentUrl: true, metadata: true, workerProfile: { select: { userId: true } } },
  })
  if (!v) return null
  await tx.documentVersion.delete({ where: { id: v.id } })
  const f = fileOf(v as { documentUrl: string | null; metadata: Prisma.JsonValue | null })
  const file = (f.storageKey || f.url) && !(await stillUsed(tx, v.workerProfileId, f)) ? f : null
  return { owner: { userId: v.workerProfile.userId, profileId: v.workerProfileId }, file }
}

/** A legacy Blob file of either kind the app stored for this user. */
const ownLegacyFile = (url: string, userId: string) => ownServiceDocument(url, userId) || ownComplianceBlobUrl(url, userId)

export type VersionStores = { bucket?: PhotoStore; blob?: { delete(urlOrKey: string): Promise<void> } }

/** After the commit, best-effort (a failure is logged and the file left, never an error to the admin). */
export async function deleteRemovedFile(stores: VersionStores, removed: RemovedVersion, log: { warn(o: object, m: string): void }): Promise<void> {
  if (removed.file) await deleteDocumentFiles(stores, [removed.file], removed.owner, ownLegacyFile, log)
}
