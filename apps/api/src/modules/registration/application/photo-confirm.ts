// R2: confirm an upload before trusting it. The object is inspected (size, content
// type) and its first 16 bytes classified; only then does the row exist (U3, zero new
// columns). A rejected object is deleted and leaves nothing behind. Idempotent: a
// second confirm of a staged id answers 200 without touching anything; a concurrent
// one loses on the primary key and answers 200 too.
import { detectImageType, IMAGE_HEADER_BYTES, isAcceptedImageType } from '@remonta/schemas/image-type'
import { PHOTO_MAX_BYTES } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import { ApiError } from '../../../platform/errors'
import { Prisma, type Db } from '../../../platform/persistence/db'
import { StoreUnavailable, type PhotoStore } from '../adapters/photo-store'
import { publicUrl, stagingKey } from '../domain/photo-upload'
import { PHOTO_STORE_UNAVAILABLE } from './photo-ticket'
import { hashIp } from './stage-photo'

export interface PhotoConfirmDeps {
  db: Db
  bucket: PhotoStore
  publicBaseUrl: string
  ipHashSecret: string
  now?: () => Date
}

export const PHOTO_TOO_LARGE = 'Your photo is too large. Please choose a photo under 5 MB.'
export const PHOTO_NOT_ACCEPTED = 'Please upload a JPEG, PNG or WebP photo.'
export const PHOTO_UPLOAD_INCOMPLETE = 'Your photo upload did not finish. Please try again.'

export type RejectReason = 'too-large' | 'not-image' | 'wrong-type'

export async function confirmPhotoUpload(photoUploadId: string, ip: string, deps: PhotoConfirmDeps, log: FastifyBaseLogger): Promise<{ photoUploadId: string }> {
  const now = (deps.now ?? (() => new Date()))()
  const started = Date.now()

  // R2.1: already a row (bucket or Blob, claimed or not) -> idempotent 200.
  const existing = await deps.db.registrationPhotoUpload.findUnique({ where: { id: photoUploadId }, select: { id: true } })
  if (existing) {
    log.info({ photoUploadId, outcome: 'idempotent' }, 'photo-confirm')
    return { photoUploadId }
  }

  const key = stagingKey(photoUploadId)
  let info, head
  try {
    info = await deps.bucket.inspect(key)
    if (!info) {
      log.info({ photoUploadId, outcome: 'missing', inspectMs: Date.now() - started }, 'photo-confirm')
      throw new ApiError(409, 'photo upload incomplete', { photo: [PHOTO_UPLOAD_INCOMPLETE] })
    }
    if (info.sizeBytes > PHOTO_MAX_BYTES) await reject(deps, log, photoUploadId, key, 'too-large', 413, PHOTO_TOO_LARGE)
    const readStarted = Date.now()
    head = await deps.bucket.readPrefix(key, IMAGE_HEADER_BYTES)
    const type = detectImageType(head)
    if (!type || !isAcceptedImageType(type)) await reject(deps, log, photoUploadId, key, 'not-image', 415, PHOTO_NOT_ACCEPTED)
    if (type !== info.contentType) await reject(deps, log, photoUploadId, key, 'wrong-type', 415, PHOTO_NOT_ACCEPTED)

    // R2.6: the row. A concurrent confirm that inserted first wins the primary key.
    try {
      await deps.db.registrationPhotoUpload.create({
        data: { id: photoUploadId, blobKey: key, url: publicUrl(deps.publicBaseUrl, key), contentType: type!, sizeBytes: info.sizeBytes, ipHash: hashIp(ip, deps.ipHashSecret), createdAt: now },
      })
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err
    }
    log.info({ photoUploadId, outcome: 'staged', sizeBytes: info.sizeBytes, contentType: type, inspectMs: readStarted - started, readMs: Date.now() - readStarted }, 'photo-confirm')
    return { photoUploadId }
  } catch (err) {
    if (err instanceof StoreUnavailable) {
      log.warn({ photoUploadId, err: err.message }, 'photo-confirm store unavailable')
      throw new ApiError(503, 'photo store unavailable', { photo: [PHOTO_STORE_UNAVAILABLE] }, { 'retry-after': '2' })
    }
    throw err
  }
}

/** Deletes the object (best effort), logs the reason, and throws the response. Never writes a row. */
async function reject(deps: PhotoConfirmDeps, log: FastifyBaseLogger, photoUploadId: string, key: string, reason: RejectReason, status: 413 | 415, message: string): Promise<never> {
  await deps.bucket.delete(key).catch((err: unknown) => log.warn({ photoUploadId, err: err instanceof Error ? err.message : String(err) }, 'photo-confirm delete failed'))
  log.warn({ photoUploadId, reason }, 'photo-rejected')
  throw new ApiError(status, `photo rejected: ${reason}`, { photo: [message] })
}
