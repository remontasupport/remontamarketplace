// One direct upload ticket (U3's pattern): a fresh uuid names `staging/<uuid>`, and the signed policy binds that key, the
// type, the size cap and a ten-minute expiry. Nothing is persisted. The sign-up photo, a worker document (U3b) and the
// sign-up's signed agreement (signup-abn-agreement U1) all issue theirs here; each says what it calls the id and how a
// store outage reads to its user.
import { randomUUID } from 'node:crypto'
import type { DocumentType } from '@remonta/schemas/document-type'
import type { ImageType } from '@remonta/schemas/image-type'
import { ApiError } from '../../../platform/errors'
import { StoreUnavailable, type PhotoStore } from '../adapters/photo-store'
import { stagingKey, TICKET_TTL_MS } from '../domain/photo-upload'

export interface IssuedTicket {
  id: string
  upload: { url: string; method: 'POST'; fields: Record<string, string>; fileField: 'file' }
  expiresAt: string
}

export interface TicketSpec {
  contentType: ImageType | DocumentType
  maxBytes: number
  /** The 503's field and message when the store does not answer. */
  unavailable: { field: string; message: string; reason: string }
}

export async function issueUploadTicket(bucket: PhotoStore, spec: TicketSpec, now: Date, log: { warn: (o: object, msg: string) => void }): Promise<IssuedTicket> {
  const id = randomUUID()
  const expiresAt = new Date(now.getTime() + TICKET_TTL_MS)
  let ticket
  try {
    ticket = await bucket.createUploadTicket(stagingKey(id), spec.contentType, spec.maxBytes, expiresAt)
  } catch (err) {
    if (err instanceof StoreUnavailable) {
      log.warn({ err: err.message }, `${spec.unavailable.reason} store unavailable`)
      throw new ApiError(503, `${spec.unavailable.reason} store unavailable`, { [spec.unavailable.field]: [spec.unavailable.message] }, { 'retry-after': '2' })
    }
    throw err
  }
  return { id, upload: { url: ticket.url, method: 'POST', fields: ticket.fields, fileField: 'file' }, expiresAt: expiresAt.toISOString() }
}
