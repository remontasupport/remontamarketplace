// Photos (U2 R4, L5): the sign-up's direct upload reused -- a ticket for the bucket, the
// confirm that inspects what landed, then a claim by this worker's profile as its one photo,
// and the PhotoUploaded event whose handler writes the clean copy to Vercel Blob and repoints
// the column. The main photo is `worker_profiles.photos`; the extra photos (back on 2026-10-23, for workers and
// admins, at most 2) are the JSON array `worker_profiles.additionalPhotos`, which the clean-copy handler repoints too.
import { MAX_ADDITIONAL_PHOTOS, STORED_ADDITIONAL_PHOTOS_MAX, type Photos, type WorkerPhotos } from '@remonta/api-contract'
import { ApiError } from '../../../platform/errors'
import { enqueue } from '../../../platform/outbox/outbox'
import type { Tx } from '../../../platform/persistence/db'
import { claimPhotoFor } from '../../registration/application/photo-claim'
import { PHOTO_UPLOADED, type PhotoUploadedPayload } from '../../registration/domain/events'
import { PROCESSED_PREFIX } from '../../registration/domain/photo-upload'

export function photosOf(row: { photos: string | null }): Photos {
  return { main: row.photos || null }
}

/** R4.4, pure: only the worker's own photo can be removed. */
export function withoutPhoto(current: Photos, url: string): Photos | { refused: string } {
  return current.main === url ? { main: null } : { refused: 'Not your photo' }
}

/**
 * Claims a confirmed upload for this profile as its photo, replacing the current one (R4.2). Idempotent for the same
 * profile. The usual path is three statements: the claim (with its owner, returning the URL), the column, the event
 * (audit P7: it was six); the reads happen only when the claim finds nothing, to say why.
 */
export async function claimAsPhoto(tx: Tx, profileId: string, uploadId: string, now: Date): Promise<Photos> {
  const claimed = await claimPhotoFor(tx, uploadId, profileId, now)
  if (claimed) {
    await tx.workerProfile.update({ where: { id: profileId }, data: { photos: claimed.url }, select: { id: true } })
    const payload: PhotoUploadedPayload = { photoUploadId: uploadId, workerProfileId: profileId }
    await enqueue(tx, { type: PHOTO_UPLOADED, payload }, now)
    return { main: claimed.url }
  }
  const row = await tx.registrationPhotoUpload.findUnique({ where: { id: uploadId }, select: { claimedByWorkerProfileId: true } })
  if (!row) throw new ApiError(404, 'photo upload not found')
  if (row.claimedByWorkerProfileId === profileId) {
    // A repeat of this worker's confirm: answer what the profile shows now.
    return photosOf(await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true } }))
  }
  if (row.claimedByWorkerProfileId) throw new ApiError(404, 'photo upload not owned') // never reveal another's
  throw new ApiError(404, 'photo upload expired or already used')
}

/**
 * Removes the worker's photo. The page may still hold the address the confirm answered -- the private staging copy --
 * after the clean copy has replaced it (bug 2026-10-16: "Not your photo"); an upload this profile claimed counts as
 * naming its photo. Answers the photos left and the address actually removed (its file is deleted after the commit).
 */
export async function removeOne(tx: Tx, profileId: string, url: string): Promise<{ photos: Photos; removed: string | null }> {
  const profile = await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true } })
  const current = photosOf(profile)
  let next = withoutPhoto(current, url)
  if ('refused' in next && current.main) {
    const ownUpload = await tx.registrationPhotoUpload.findFirst({ where: { url, claimedByWorkerProfileId: profileId }, select: { id: true } })
    if (ownUpload) next = withoutPhoto(current, current.main)
  }
  if ('refused' in next) throw new ApiError(400, next.refused, { url: [next.refused] })
  await tx.workerProfile.update({ where: { id: profileId }, data: { photos: null }, select: { id: true } })
  return { photos: next, removed: current.main }
}

/** The stored JSON array, read defensively: anything that is not an array of strings reads as none. */
export function parseAdditionalPhotos(stored: string | null): string[] {
  if (!stored) return []
  try {
    const v: unknown = JSON.parse(stored)
    return Array.isArray(v) ? v.filter((u): u is string => typeof u === 'string' && u.length > 0).slice(0, STORED_ADDITIONAL_PHOTOS_MAX) : []
  } catch {
    return []
  }
}

export function workerPhotosOf(row: { photos: string | null; additionalPhotos: string | null }): WorkerPhotos {
  return { main: row.photos || null, additional: parseAdditionalPhotos(row.additionalPhotos) }
}

const toColumns = (p: WorkerPhotos) => ({ photos: p.main, additionalPhotos: p.additional.length ? JSON.stringify(p.additional) : null })

/**
 * Pure: the photos after adding `url` as an extra photo, or the refusal. With no main photo the upload becomes the main
 * when `mainIfNone` (the worker: extra photos never stand without one), else it is refused (an admin adds extras only).
 */
export function placeAdditional(current: WorkerPhotos, url: string, mainIfNone: boolean): WorkerPhotos | { refused: string } {
  if (current.main === null) return mainIfNone ? { main: url, additional: current.additional } : { refused: 'The worker has no main photo yet' }
  if (current.additional.length >= MAX_ADDITIONAL_PHOTOS) return { refused: `At most ${MAX_ADDITIONAL_PHOTOS} extra photos` }
  return { main: current.main, additional: [...current.additional, url] }
}

/** Pure: the photos without the extra photo `url`, or the refusal. The main photo is never removed here. */
export function withoutAdditional(current: WorkerPhotos, url: string): WorkerPhotos | { refused: string } {
  return current.additional.includes(url) ? { main: current.main, additional: current.additional.filter((u) => u !== url) } : { refused: 'Not one of the extra photos' }
}

/** Pure: the extra photo `url` becomes the main; the old main takes its place (none: the extra just moves up). */
export function swapMain(current: WorkerPhotos, url: string): WorkerPhotos | { refused: string } {
  const i = current.additional.indexOf(url)
  if (i === -1) return { refused: 'Not one of the extra photos' }
  const additional = [...current.additional]
  if (current.main) additional[i] = current.main
  else additional.splice(i, 1)
  return { main: url, additional }
}

/** The extra photo a URL names: itself, or the clean copy made from an upload this profile claimed (the staging address). */
async function extraNamedBy(tx: Tx, profileId: string, current: WorkerPhotos, url: string): Promise<string> {
  if (current.additional.includes(url)) return url
  const own = await tx.registrationPhotoUpload.findFirst({ where: { url, claimedByWorkerProfileId: profileId }, select: { id: true } })
  return (own && current.additional.find((u) => u.includes(`/${PROCESSED_PREFIX}${profileId}/${own.id}`))) || url
}

/** "Replace photo" with an existing extra photo (2026-10-23): swapMain on the stored columns; no file is touched. */
export async function makeAdditionalMain(tx: Tx, profileId: string, url: string): Promise<WorkerPhotos> {
  const current = workerPhotosOf(await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true, additionalPhotos: true } }))
  const next = swapMain(current, await extraNamedBy(tx, profileId, current, url))
  if ('refused' in next) throw new ApiError(400, next.refused, { url: [next.refused] })
  await tx.workerProfile.update({ where: { id: profileId }, data: toColumns(next), select: { id: true } })
  return next
}

/** Claims a confirmed upload for this profile as an extra photo (placeAdditional's rule). Idempotent for the same profile. */
export async function claimAsAdditional(tx: Tx, profileId: string, uploadId: string, now: Date, mainIfNone: boolean): Promise<WorkerPhotos> {
  const current = workerPhotosOf(await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true, additionalPhotos: true } }))
  const claimed = await claimPhotoFor(tx, uploadId, profileId, now)
  if (!claimed) {
    const row = await tx.registrationPhotoUpload.findUnique({ where: { id: uploadId }, select: { claimedByWorkerProfileId: true } })
    if (!row) throw new ApiError(404, 'photo upload not found')
    if (row.claimedByWorkerProfileId === profileId) return current // a repeat of this confirm
    if (row.claimedByWorkerProfileId) throw new ApiError(404, 'photo upload not owned') // never reveal another's
    throw new ApiError(404, 'photo upload expired or already used')
  }
  // Refused after the claim: the transaction rolls the claim back with it.
  const next = placeAdditional(current, claimed.url, mainIfNone)
  if ('refused' in next) throw new ApiError(400, next.refused, { uploadId: [next.refused] })
  await tx.workerProfile.update({ where: { id: profileId }, data: toColumns(next), select: { id: true } })
  const payload: PhotoUploadedPayload = { photoUploadId: uploadId, workerProfileId: profileId }
  await enqueue(tx, { type: PHOTO_UPLOADED, payload }, now)
  return next
}

/**
 * Removes one extra photo. The page may still hold the address the confirm answered (the staging copy) after the clean
 * copy replaced it: an upload this profile claimed counts as naming the extra photo made from it. Answers the photos
 * left and the address actually removed (its file is deleted after the commit, own folder only).
 */
export async function removeAdditional(tx: Tx, profileId: string, url: string): Promise<{ photos: WorkerPhotos; removed: string }> {
  const current = workerPhotosOf(await tx.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true, additionalPhotos: true } }))
  const target = await extraNamedBy(tx, profileId, current, url)
  const next = withoutAdditional(current, target)
  if ('refused' in next) throw new ApiError(400, next.refused, { url: [next.refused] })
  await tx.workerProfile.update({ where: { id: profileId }, data: toColumns(next), select: { id: true } })
  return { photos: next, removed: target }
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
