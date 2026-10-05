// The sign-up photo's life (S1-design 3.2): staged by the upload, claimed once by
// the registration transaction, purged if never claimed.
//
// The file is checked by its bytes, stored under a server-generated name, and
// recorded as a staged upload; the caller gets an id, never a URL, and registration
// can reference only that id (P1, P5).
//
// U3: this is the multipart path, kept unchanged in behaviour until the wizard uses
// the direct upload (ticket + confirm, photo-ticket.ts / photo-confirm.ts); it goes
// in the clean-up PR. Its rows are recognisable by the `workers/registration/` prefix.
import { createHmac, randomUUID } from 'node:crypto'
import { ApiError } from '../../../platform/errors'
import type { Db, Tx } from '../../../platform/persistence/db'
import type { UploadedFile } from '../../../platform/contract/handlers'
import type { BlobPhotoStore } from '../adapters/photo-store'
import { detectImageType, extensionOf } from '../domain/image-type'
import { PHOTO_CLAIM_WINDOW_HOURS } from '../domain/photo-upload'

export { PHOTO_CLAIM_WINDOW_HOURS }

export const PHOTO_UPLOADS_UNAVAILABLE = 'Photo uploads are temporarily unavailable. Please try again in a moment.'

export interface StagePhotoDeps {
  db: Db
  /** Absent once the Blob token is gone (clean-up PR); the entry then answers 503. */
  store: BlobPhotoStore | undefined
  ipHashSecret: string
}

export function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

export async function stagePhoto(file: UploadedFile, ip: string, deps: StagePhotoDeps): Promise<{ photoUploadId: string }> {
  if (!deps.store) throw new ApiError(503, 'blob store not configured', { photo: [PHOTO_UPLOADS_UNAVAILABLE] }, { 'retry-after': '60' })
  const type = detectImageType(file.data)
  if (!type) throw new ApiError(415, `photo bytes are not an accepted image (declared ${file.declaredType})`, { photo: ['Please upload a JPEG, PNG, WebP or HEIC photo'] })

  const id = randomUUID()
  const key = `workers/registration/${id}.${extensionOf(type)}`
  const url = await deps.store.put(key, file.data, type)
  try {
    await deps.db.registrationPhotoUpload.create({
      data: { id, blobKey: key, url, contentType: type, sizeBytes: file.data.byteLength, ipHash: hashIp(ip, deps.ipHashSecret) },
    })
  } catch (err) {
    await deps.store.delete(key).catch(() => {}) // no orphan blob for a row that does not exist
    throw err
  }
  return { photoUploadId: id }
}

/**
 * R4 / U3 R3.1: claims a staged photo, once. Returns its URL and key, or null if the
 * id was never confirmed, was already claimed, or is older than the window. Runs
 * inside the registration transaction before anything else is written; once the
 * profile row exists, attachPhoto records which profile claimed it. The key's prefix
 * says which store holds the object (domain/photo-upload.ts storeOf).
 */
export async function claimPhoto(tx: Tx, photoUploadId: string, now: Date): Promise<{ url: string; key: string } | null> {
  const since = new Date(now.getTime() - PHOTO_CLAIM_WINDOW_HOURS * 3_600_000)
  const claimed = await tx.$queryRaw<{ url: string; blobKey: string }[]>`
    UPDATE registration_photo_uploads SET "claimedAt" = ${now}
     WHERE id = ${photoUploadId}::uuid AND "claimedAt" IS NULL AND "createdAt" > ${since}
    RETURNING url, "blobKey"`
  return claimed[0] ? { url: claimed[0].url, key: claimed[0].blobKey } : null
}

export async function attachPhoto(tx: Tx, photoUploadId: string, workerProfileId: string): Promise<void> {
  await tx.registrationPhotoUpload.update({ where: { id: photoUploadId }, data: { claimedByWorkerProfileId: workerProfileId } })
}
