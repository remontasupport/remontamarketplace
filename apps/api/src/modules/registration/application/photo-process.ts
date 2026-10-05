// R4: the clean copy. After the account exists (the claim enqueued PhotoUploaded), the
// original is decoded, oriented, resized inside 1600 px, re-encoded as JPEG with every
// metadata block removed, plus a 256 px thumbnail; the profile is pointed at the clean
// copy and the original deleted. Idempotent: "already done" is read from the profile
// (the URLs derive from the ids; nothing is recorded on the row -- U3, zero columns).
// Undecodable bytes end in a copy stored as uploaded (R4.8), so the account never ends
// without a photo; the event completes with a warning. A bulkhead keeps at most a few
// decodes in flight per instance (NFR design P3); when full, the handler waits and the
// outbox retries if it must.
import { extensionOf, type ImageType } from '@remonta/schemas/image-type'
import type { FastifyBaseLogger } from 'fastify'
import { PermanentFailure } from '../../../platform/errors'
import { Bulkhead } from '../../../platform/load/bulkhead'
import type { OutboxEvent, OutboxHandler } from '../../../platform/outbox/outbox'
import type { Db } from '../../../platform/persistence/db'
import { isNotFound } from '../adapters/gcs-photo-store'
import type { PhotoStore } from '../adapters/photo-store'
import { photoUploadedPayload } from '../domain/events'
import { asIsKey, processedKey, profilePrefix, publicUrl, thumbnailKey } from '../domain/photo-upload'

export const PROCESSED_MAX_EDGE = 1600
export const THUMBNAIL_MAX_EDGE = 256
export const JPEG_QUALITY = 85
/** Keys are unique per upload, so a copy never changes: cache for a year. */
export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

export interface PhotoProcessDeps {
  db: Db
  bucket: PhotoStore
  publicBaseUrl: string
  log: FastifyBaseLogger
  /** At most this many decodes in flight per instance (default 2). */
  concurrency?: number
}

export type ProcessOutcome = 'processed' | 'fallback' | 'already'

export async function processPhoto(photoUploadId: string, workerProfileId: string, deps: PhotoProcessDeps, signal: AbortSignal): Promise<ProcessOutcome> {
  const row = await deps.db.registrationPhotoUpload.findUnique({ where: { id: photoUploadId }, select: { blobKey: true, contentType: true } })
  if (!row) throw new PermanentFailure(`photo ${photoUploadId}: no such upload`)
  const profile = await deps.db.workerProfile.findUnique({ where: { id: workerProfileId }, select: { photos: true } })
  if (!profile) throw new PermanentFailure(`photo ${photoUploadId}: profile ${workerProfileId} no longer exists`)

  // R4.1: done already (a re-run after a crash between the profile update and the delete).
  const donePrefix = publicUrl(deps.publicBaseUrl, profilePrefix(workerProfileId, photoUploadId))
  if (profile.photos?.startsWith(donePrefix)) {
    await deps.bucket.delete(row.blobKey).catch(() => {})
    return 'already'
  }

  let original: Buffer
  try {
    original = await deps.bucket.read(row.blobKey)
  } catch (err) {
    if (isNotFound(err)) throw new PermanentFailure(`photo ${photoUploadId}: staging object ${row.blobKey} is missing`)
    throw err
  }
  throwIfAborted(signal)

  const started = Date.now()
  let main: Buffer, thumb: Buffer, decodeMs: number
  try {
    const sharp = (await import('sharp')).default
    const pipeline = (edge: number) =>
      sharp(original, { failOn: 'error' })
        .rotate() // apply the EXIF orientation before the metadata goes
        .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
        .toColorspace('srgb')
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true }) // no withMetadata(): EXIF, GPS, XMP, IPTC and ICC are dropped
        .toBuffer()
    main = await pipeline(PROCESSED_MAX_EDGE)
    decodeMs = Date.now() - started
    thumb = await pipeline(THUMBNAIL_MAX_EDGE)
  } catch (err) {
    // R4.8: undecodable. Store the upload as it is under the profile; no thumbnail.
    const type = row.contentType as ImageType
    const key = asIsKey(workerProfileId, photoUploadId, type)
    const url = await deps.bucket.write(key, original, type, { cacheControl: IMMUTABLE_CACHE })
    await deps.db.workerProfile.update({ where: { id: workerProfileId }, data: { photos: url } })
    await deps.bucket.delete(row.blobKey).catch(() => {})
    deps.log.warn({ photoUploadId, workerProfileId, err: err instanceof Error ? err.message : String(err), bytesIn: original.byteLength, outcome: 'fallback' }, 'photo-processing-fallback')
    return 'fallback'
  }
  throwIfAborted(signal)

  const processedUrl = await deps.bucket.write(processedKey(workerProfileId, photoUploadId), main, 'image/jpeg', { cacheControl: IMMUTABLE_CACHE })
  await deps.bucket.write(thumbnailKey(workerProfileId, photoUploadId), thumb, 'image/jpeg', { cacheControl: IMMUTABLE_CACHE })
  await deps.db.workerProfile.update({ where: { id: workerProfileId }, data: { photos: processedUrl } })
  await deps.bucket.delete(row.blobKey).catch((err: unknown) => deps.log.warn({ photoUploadId, err: err instanceof Error ? err.message : String(err) }, 'photo-process staging delete failed'))
  deps.log.info({ photoUploadId, workerProfileId, decodeMs, encodeMs: Date.now() - started - decodeMs, bytesIn: original.byteLength, bytesOut: main.byteLength, outcome: 'processed' }, 'photo-process')
  return 'processed'
}

export function photoUploadedHandler(deps: PhotoProcessDeps): OutboxHandler {
  const bulkhead = new Bulkhead({ name: 'photo-processing', maxConcurrent: deps.concurrency ?? 2, maxQueue: 20, queueTimeoutMs: 10_000 })
  return async (event: OutboxEvent, signal: AbortSignal) => {
    const p = photoUploadedPayload.safeParse(event.payload)
    if (!p.success) throw new PermanentFailure(`${event.type} ${event.id}: malformed payload`)
    await bulkhead.run(() => processPhoto(p.data.photoUploadId, p.data.workerProfileId, deps, signal))
  }
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new Error('photo processing aborted (handler timeout)')
}

export { extensionOf }
