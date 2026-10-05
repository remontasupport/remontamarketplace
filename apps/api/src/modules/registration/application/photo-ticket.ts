// R1: a ticket to upload one photo straight to the bucket. Nothing is persisted here
// (U3, zero new columns): the policy carries the key, the type, the size range and
// the expiry, and storage enforces them; confirm creates the row once the object has
// been checked. The id is a fresh uuid, so a ticket cannot be aimed at someone else's
// object.
import { randomUUID } from 'node:crypto'
import type { PhotoTicketRequest, PhotoTicketResponse } from '@remonta/api-contract'
import { PHOTO_MAX_BYTES } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import { ApiError } from '../../../platform/errors'
import { StoreUnavailable, type PhotoStore } from '../adapters/photo-store'
import { stagingKey, TICKET_TTL_MS } from '../domain/photo-upload'

export interface PhotoTicketDeps {
  bucket: PhotoStore
  now?: () => Date
}

export const PHOTO_STORE_UNAVAILABLE = "We couldn't upload your photo right now. Please try again in a moment."

export async function createPhotoTicket(input: PhotoTicketRequest, deps: PhotoTicketDeps, log: FastifyBaseLogger): Promise<PhotoTicketResponse> {
  const now = (deps.now ?? (() => new Date()))()
  const id = randomUUID()
  const key = stagingKey(id)
  const expiresAt = new Date(now.getTime() + TICKET_TTL_MS)
  const started = Date.now()
  let ticket
  try {
    ticket = await deps.bucket.createUploadTicket(key, input.contentType, PHOTO_MAX_BYTES, expiresAt)
  } catch (err) {
    if (err instanceof StoreUnavailable) {
      log.warn({ err: err.message }, 'photo-ticket store unavailable')
      throw new ApiError(503, 'photo store unavailable', { photo: [PHOTO_STORE_UNAVAILABLE] }, { 'retry-after': '2' })
    }
    throw err
  }
  log.info({ photoUploadId: id, contentType: input.contentType, sizeBytes: input.sizeBytes, signMs: Date.now() - started }, 'photo-ticket')
  return {
    photoUploadId: id,
    upload: { url: ticket.url, method: 'POST', fields: ticket.fields, fileField: 'file' },
    expiresAt: expiresAt.toISOString(),
  }
}
