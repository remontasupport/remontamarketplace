// R1: a ticket to upload one photo straight to the bucket. Nothing is persisted here
// (U3, zero new columns): the policy carries the key, the type, the size range and
// the expiry, and storage enforces them; confirm creates the row once the object has
// been checked. The id is a fresh uuid, so a ticket cannot be aimed at someone else's
// object.
import type { PhotoTicketRequest, PhotoTicketResponse } from '@remonta/api-contract'
import { PHOTO_MAX_BYTES } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import type { PhotoStore } from '../adapters/photo-store'
import { issueUploadTicket } from './upload-ticket'

export interface PhotoTicketDeps {
  bucket: PhotoStore
  now?: () => Date
}

export const PHOTO_STORE_UNAVAILABLE = "We couldn't upload your photo right now. Please try again in a moment."

export async function createPhotoTicket(input: PhotoTicketRequest, deps: PhotoTicketDeps, log: FastifyBaseLogger): Promise<PhotoTicketResponse> {
  const now = (deps.now ?? (() => new Date()))()
  const started = Date.now()
  const { id, ...ticket } = await issueUploadTicket(deps.bucket, { contentType: input.contentType, maxBytes: PHOTO_MAX_BYTES, unavailable: { field: 'photo', message: PHOTO_STORE_UNAVAILABLE, reason: 'photo' } }, now, log)
  log.info({ photoUploadId: id, contentType: input.contentType, sizeBytes: input.sizeBytes, signMs: Date.now() - started }, 'photo-ticket')
  return { photoUploadId: id, ...ticket }
}
