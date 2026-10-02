// The sign-up photo's life (S1-design 3.2): staged by the upload, claimed once by
// the registration transaction, purged if never claimed.
//
// The file is checked by its bytes, stored under a server-generated name, and
// recorded as a staged upload; the caller gets an id, never a URL, and registration
// can reference only that id (P1, P5).
import { createHmac, randomUUID } from 'node:crypto'
import { ApiError } from '../../../platform/errors'
import type { Db, Tx } from '../../../platform/persistence/db'
import type { UploadedFile } from '../../../platform/contract/handlers'
import type { PhotoStore } from '../adapters/photo-store'
import { detectImageType, extensionOf } from '../domain/image-type'

/** A staged photo can be claimed by a sign-up within this window; after it, the purge job deletes it. */
export const PHOTO_CLAIM_WINDOW_HOURS = 24

export interface StagePhotoDeps {
  db: Db
  store: PhotoStore
  ipHashSecret: string
}

export function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

export async function stagePhoto(file: UploadedFile, ip: string, deps: StagePhotoDeps): Promise<{ photoUploadId: string }> {
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
 * R4: claims a staged photo, once. Returns its URL, or null if the id was never
 * issued, was already claimed, or is older than the window. Runs inside the
 * registration transaction before anything else is written; once the profile row
 * exists, attachPhoto records which profile claimed it.
 */
export async function claimPhoto(tx: Tx, photoUploadId: string, now: Date): Promise<string | null> {
  const since = new Date(now.getTime() - PHOTO_CLAIM_WINDOW_HOURS * 3_600_000)
  const claimed = await tx.$queryRaw<{ url: string }[]>`
    UPDATE registration_photo_uploads SET "claimedAt" = ${now}
     WHERE id = ${photoUploadId}::uuid AND "claimedAt" IS NULL AND "createdAt" > ${since}
    RETURNING url`
  return claimed[0]?.url ?? null
}

export async function attachPhoto(tx: Tx, photoUploadId: string, workerProfileId: string): Promise<void> {
  await tx.registrationPhotoUpload.update({ where: { id: photoUploadId }, data: { claimedByWorkerProfileId: workerProfileId } })
}
