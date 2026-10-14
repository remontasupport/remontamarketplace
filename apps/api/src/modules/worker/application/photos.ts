// Photos (U2 R4, L5): the sign-up's direct upload reused -- a ticket for the bucket, the
// confirm that inspects what landed, then a claim by this worker's profile into the main or
// an additional slot, and the PhotoUploaded event whose handler writes the clean copy to
// Vercel Blob and repoints whichever column holds the staged URL. Make-main and remove work
// by URL on today's two columns (`photos`, the JSON array `additionalPhotos`), so every
// reader of those columns is unchanged (R4.5).
import { MAX_ADDITIONAL_PHOTOS, type Photos } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import { enqueue } from '../../../platform/outbox/outbox'
import type { Tx } from '../../../platform/persistence/db'
import { parseAdditionalPhotos } from './get-profile'
import { attachPhoto, claimPhoto } from '../../registration/application/photo-claim'
import { PHOTO_UPLOADED, type PhotoUploadedPayload } from '../../registration/domain/events'
import { PROCESSED_PREFIX } from '../../registration/domain/photo-upload'

export function photosOf(row: { photos: string | null; additionalPhotos: string | null }): Photos {
  return { main: row.photos || null, additional: parseAdditionalPhotos(row.additionalPhotos).slice(0, MAX_ADDITIONAL_PHOTOS) }
}

const toColumns = (p: Photos) => ({ photos: p.main, additionalPhotos: p.additional.length ? JSON.stringify(p.additional) : null })

/** R4.2's slot rule, pure: the photos after placing `url` in `slot`, or the refusal. */
export function placePhoto(current: Photos, url: string, slot: 'main' | 'additional'): Photos | { refused: string } {
  // With no main photo, any upload becomes the main: additional photos never stand without one (R4.4).
  if (slot === 'main' || current.main === null) return { main: url, additional: current.additional }
  if (current.additional.length >= MAX_ADDITIONAL_PHOTOS) return { refused: `At most ${MAX_ADDITIONAL_PHOTOS} additional photos` }
  return { main: current.main, additional: [...current.additional, url] }
}

/** R4.3, pure. */
export function swapMain(current: Photos, url: string): Photos | { refused: string } {
  const i = current.additional.indexOf(url)
  if (i === -1) return { refused: 'Not one of your additional photos' }
  const additional = [...current.additional]
  if (current.main) additional[i] = current.main
  else additional.splice(i, 1)
  return { main: url, additional }
}

/** R4.4, pure: an additional photo goes; the main only when it is the last photo. */
export function withoutPhoto(current: Photos, url: string): Photos | { refused: string } {
  if (current.additional.includes(url)) return { main: current.main, additional: current.additional.filter((u) => u !== url) }
  if (current.main === url) {
    if (current.additional.length > 0) return { refused: 'Make another photo the main photo first' }
    return { main: null, additional: [] }
  }
  return { refused: 'Not one of your photos' }
}

const refuse = (r: Photos | { refused: string }, field: string): Photos => {
  if ('refused' in r) throw new ApiError(400, r.refused, { [field]: [r.refused] })
  return r
}

/** Claims a confirmed upload for this profile and places it (R4.2). Idempotent for the same profile. */
export async function claimIntoSlot(tx: Tx, profileId: string, uploadId: string, slot: 'main' | 'additional', now: Date): Promise<Photos> {
  const profile = await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true, additionalPhotos: true } })
  const current = photosOf(profile)
  const row = await tx.registrationPhotoUpload.findUnique({ where: { id: uploadId }, select: { url: true, claimedByWorkerProfileId: true } })
  if (!row) throw new ApiError(404, 'photo upload not found')
  if (row.claimedByWorkerProfileId) {
    if (row.claimedByWorkerProfileId !== profileId) throw new ApiError(404, 'photo upload not owned') // never reveal another's
    return current // a repeat of this worker's confirm
  }
  const claimed = await claimPhoto(tx, uploadId, now)
  if (!claimed) throw new ApiError(404, 'photo upload expired or already used')
  const next = refuse(placePhoto(current, row.url, slot), 'slot')
  await tx.workerProfile.update({ where: { id: profileId }, data: toColumns(next), select: { id: true } })
  await attachPhoto(tx, uploadId, profileId)
  const payload: PhotoUploadedPayload = { photoUploadId: uploadId, workerProfileId: profileId }
  await enqueue(tx, { type: PHOTO_UPLOADED, payload }, now)
  return next
}

export async function makeMain(tx: Tx, profileId: string, url: string): Promise<Photos> {
  const profile = await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true, additionalPhotos: true } })
  const next = refuse(swapMain(photosOf(profile), url), 'url')
  await tx.workerProfile.update({ where: { id: profileId }, data: toColumns(next), select: { id: true } })
  return next
}

export async function removeOne(tx: Tx, profileId: string, url: string): Promise<Photos> {
  const profile = await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true, additionalPhotos: true } })
  const next = refuse(withoutPhoto(photosOf(profile), url), 'url')
  await tx.workerProfile.update({ where: { id: profileId }, data: toColumns(next), select: { id: true } })
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
