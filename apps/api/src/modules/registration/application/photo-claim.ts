// The sign-up photo's claim (S1-design 3.2, U3 R3.1): a row confirmed by
// photo-confirm.ts is claimed once, by the registration transaction, within the
// window; the purge job deletes what is never claimed. The keyed IP hash lives here
// because confirm and the claim share it.
import { createHmac } from 'node:crypto'
import type { Tx } from '../../../platform/persistence/db'
import { PHOTO_CLAIM_WINDOW_HOURS } from '../domain/photo-upload'

export { PHOTO_CLAIM_WINDOW_HOURS }

export function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

/**
 * R4 / U3 R3.1: claims a staged photo, once. Returns its key, or null if the id was
 * never confirmed, was already claimed, or is older than the window. Runs inside the
 * registration transaction before anything else is written; once the profile row
 * exists, attachPhoto records which profile claimed it.
 */
export async function claimPhoto(tx: Tx, photoUploadId: string, now: Date): Promise<{ key: string } | null> {
  const since = new Date(now.getTime() - PHOTO_CLAIM_WINDOW_HOURS * 3_600_000)
  const claimed = await tx.$queryRaw<{ blobKey: string }[]>`
    UPDATE registration_photo_uploads SET "claimedAt" = ${now}
     WHERE id = ${photoUploadId}::uuid AND "claimedAt" IS NULL AND "createdAt" > ${since}
    RETURNING "blobKey"`
  return claimed[0] ? { key: claimed[0].blobKey } : null
}

export async function attachPhoto(tx: Tx, photoUploadId: string, workerProfileId: string): Promise<void> {
  await tx.registrationPhotoUpload.update({ where: { id: photoUploadId }, data: { claimedByWorkerProfileId: workerProfileId } })
}
