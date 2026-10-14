// Photos (U2 R4, L5): the sign-up's direct upload reused -- a ticket for the bucket, the
// confirm that inspects what landed, then a claim by this worker's profile as its one photo,
// and the PhotoUploaded event whose handler writes the clean copy to Vercel Blob and repoints
// the column. One photo per worker (user, 2026-10-14): `worker_profiles.photos` only; the
// legacy `additionalPhotos` column is neither read nor written here (its data is kept).
import type { Photos } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import { enqueue } from '../../../platform/outbox/outbox'
import type { Tx } from '../../../platform/persistence/db'
import { attachPhoto, claimPhoto } from '../../registration/application/photo-claim'
import { PHOTO_UPLOADED, type PhotoUploadedPayload } from '../../registration/domain/events'
import { PROCESSED_PREFIX } from '../../registration/domain/photo-upload'

export function photosOf(row: { photos: string | null }): Photos {
  return { main: row.photos || null }
}

/** R4.4, pure: only the worker's own photo can be removed. */
export function withoutPhoto(current: Photos, url: string): Photos | { refused: string } {
  return current.main === url ? { main: null } : { refused: 'Not your photo' }
}

/** Claims a confirmed upload for this profile as its photo, replacing the current one (R4.2). Idempotent for the same profile. */
export async function claimAsPhoto(tx: Tx, profileId: string, uploadId: string, now: Date): Promise<Photos> {
  const profile = await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true } })
  const row = await tx.registrationPhotoUpload.findUnique({ where: { id: uploadId }, select: { url: true, claimedByWorkerProfileId: true } })
  if (!row) throw new ApiError(404, 'photo upload not found')
  if (row.claimedByWorkerProfileId) {
    if (row.claimedByWorkerProfileId !== profileId) throw new ApiError(404, 'photo upload not owned') // never reveal another's
    return photosOf(profile) // a repeat of this worker's confirm
  }
  const claimed = await claimPhoto(tx, uploadId, now)
  if (!claimed) throw new ApiError(404, 'photo upload expired or already used')
  await tx.workerProfile.update({ where: { id: profileId }, data: { photos: row.url }, select: { id: true } })
  await attachPhoto(tx, uploadId, profileId)
  const payload: PhotoUploadedPayload = { photoUploadId: uploadId, workerProfileId: profileId }
  await enqueue(tx, { type: PHOTO_UPLOADED, payload }, now)
  return { main: row.url }
}

export async function removeOne(tx: Tx, profileId: string, url: string): Promise<Photos> {
  const profile = await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true } })
  const next = withoutPhoto(photosOf(profile), url)
  if ('refused' in next) throw new ApiError(400, next.refused, { url: [next.refused] })
  await tx.workerProfile.update({ where: { id: profileId }, data: { photos: null }, select: { id: true } })
  return next
}

/** An https URL on Vercel Blob's public host (`<store>.public.blob.vercel-storage.com`), by its parsed host, never a substring. */
export function isBlobUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

const UPLOAD_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z]{3,4}$/

/**
 * Is `url` a file the api itself wrote for this profile: `workers/<profileId>/<upload id>.<ext>` (processedKey,
 * asIsKey), on Blob's host, nothing after the path? Being in the caller's columns is not enough: the legacy
 * `updateWorkerPhoto` action stores any URL, so another worker's would otherwise be deleted (F1, api-review 2026-10-14).
 */
export function isOwnStoredPhoto(url: string, profileId: string): boolean {
  if (!isBlobUrl(url)) return false
  const u = new URL(url)
  if (u.search || u.hash) return false
  const prefix = `/${PROCESSED_PREFIX}${profileId}/`
  return u.pathname.startsWith(prefix) && UPLOAD_FILE.test(u.pathname.slice(prefix.length))
}

/**
 * After commit, best-effort (R4.4): the processed Blob copy and its thumbnail, only in the caller's own folder
 * (isOwnStoredPhoto). Anything else -- another worker's file, the app's legacy uploads -- leaves the column and stays
 * in the store; a staged bucket object is the purge job's.
 */
export async function deleteStoredPhoto(blob: { delete(urlOrKey: string): Promise<void> }, url: string, profileId: string, log: { warn(o: object, m: string): void }): Promise<void> {
  if (!isOwnStoredPhoto(url, profileId)) {
    if (isBlobUrl(url)) log.warn({ profileId, reason: 'not-own-folder' }, 'photo delete skipped')
    return
  }
  const targets = [url, ...(url.endsWith('.jpg') ? [url.replace(/\.jpg$/, '-256.jpg')] : [])]
  for (const t of targets) await blob.delete(t).catch((err: unknown) => log.warn({ err: err instanceof Error ? err.message : String(err) }, 'photo delete failed'))
}
