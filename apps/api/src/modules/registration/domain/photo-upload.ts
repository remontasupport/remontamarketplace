// The sign-up photo's keys, stores and windows (U3 functional design, zero new
// columns): nothing is persisted when a ticket is issued; a row exists only once
// confirm has checked the object; which store holds an object is the key's prefix;
// the processed copies' keys derive from the profile id and the upload id.
import { extensionOf, type ImageType } from '@remonta/schemas/image-type'

/** A ticket (signed upload policy) is valid this long; a staging object nobody confirms is removed by the bucket's lifecycle rule. */
export const TICKET_TTL_MS = 10 * 60_000
/** A confirmed upload can be claimed by a sign-up within this window; after it, the purge job deletes it. */
export const PHOTO_CLAIM_WINDOW_HOURS = 24

/** Where the browser's uploads land: private; read by the api only. */
export const STAGING_PREFIX = 'staging/'
/** Where processed copies live: publicly readable (a managed folder). */
export const PROCESSED_PREFIX = 'workers/'
/** The prefix every Vercel Blob row ever had (the multipart entry, kept until the clean-up PR). */
export const BLOB_PREFIX = 'workers/registration/'

export type PhotoStoreName = 'gcs' | 'vercel-blob'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function stagingKey(id: string): string {
  assertId(id)
  return `${STAGING_PREFIX}${id}`
}

export function processedKey(workerProfileId: string, id: string): string {
  return `${profilePrefix(workerProfileId, id)}.jpg`
}

export function thumbnailKey(workerProfileId: string, id: string): string {
  return `${profilePrefix(workerProfileId, id)}-256.jpg`
}

/** The copy stored as uploaded when the bytes cannot be decoded (R4.8). */
export function asIsKey(workerProfileId: string, id: string, type: ImageType): string {
  return `${profilePrefix(workerProfileId, id)}.${extensionOf(type)}`
}

/** Every key under the profile's folder starts with this: the processing handler's "already done" test (R4.1). */
export function profilePrefix(workerProfileId: string, id: string): string {
  assertId(id)
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(workerProfileId)) throw new Error('photo: profile id is not a safe key segment')
  return `${PROCESSED_PREFIX}${workerProfileId}/${id}`
}

export function idFromStagingKey(key: string): string | null {
  if (!key.startsWith(STAGING_PREFIX)) return null
  const id = key.slice(STAGING_PREFIX.length)
  return UUID.test(id) ? id : null
}

/** Which adapter owns an object: the Blob rows are recognisable by their prefix. */
export function storeOf(key: string): PhotoStoreName {
  return key.startsWith(BLOB_PREFIX) ? 'vercel-blob' : 'gcs'
}

export function publicUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, '')}/${key}`
}

/** R3.1: the row exists, is unclaimed, and was confirmed within the window. */
export function isClaimable(row: { claimedAt: Date | null; createdAt: Date }, now: Date): boolean {
  return row.claimedAt === null && row.createdAt.getTime() > now.getTime() - PHOTO_CLAIM_WINDOW_HOURS * 3_600_000
}

function assertId(id: string): void {
  if (!UUID.test(id)) throw new Error('photo: upload id is not a uuid')
}
