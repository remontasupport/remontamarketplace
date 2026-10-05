// Where sign-up photos are stored: ports, so a store is an adapter swap (S1-design
// 3.2, OI-07). Keys are server-generated; the client never names a file.
//
// Two ports (U3, option 2):
//   PhotoStore      the bucket: the browser uploads under a ticket; the api inspects,
//                   reads and deletes (gcs-photo-store.ts). Private, upload-only.
//   BlobPhotoStore  Vercel Blob, where every photo lives and is served from: the
//                   processing handler puts the clean copies there.
import type { ImageType } from '@remonta/schemas/image-type'

/** A signed POST policy: the browser sends `fields` plus the file as a multipart form to `url`. */
export interface UploadTicket {
  url: string
  fields: Record<string, string>
  expiresAt: Date
}

export interface ObjectInfo {
  sizeBytes: number
  contentType: string | null
}

/** The store did not answer within the timeout or failed on its side: 503 to a request, a retry for a job. */
export class StoreUnavailable extends Error {
  constructor(op: string, cause: unknown) {
    super(`photo store: ${op} failed: ${cause instanceof Error ? cause.message : String(cause)}`)
    this.name = 'StoreUnavailable'
  }
}

export interface PhotoStore {
  /** A policy bound to exactly `key`, `contentType`, at most `maxBytes`, until `expiresAt` (R1.4). */
  createUploadTicket(key: string, contentType: ImageType, maxBytes: number, expiresAt: Date): Promise<UploadTicket>
  /** Size and content type, or null when the object does not exist. */
  inspect(key: string): Promise<ObjectInfo | null>
  /** The first `bytes` bytes (fewer if the object is shorter). */
  readPrefix(key: string, bytes: number): Promise<Uint8Array>
  read(key: string): Promise<Buffer>
  /** Stores `data` and returns its public URL (public only where the bucket's prefix allows it). */
  write(key: string, data: Buffer, contentType: string, opts: { cacheControl: string }): Promise<string>
  /** A missing object is not an error. */
  delete(key: string): Promise<void>
}

export interface BlobPhotoStore {
  /** Stores the bytes under `key` and returns the public URL. `cacheControlMaxAge` in seconds. */
  put(key: string, data: Buffer, contentType: string, opts?: { cacheControlMaxAge?: number }): Promise<string>
  delete(key: string): Promise<void>
}

/**
 * Vercel Blob, public: where every photo lives and is served from (user decision
 * 2026-10-05). The processing handler writes the clean copies here. The SDK makes its
 * own request to Vercel's fixed API host -- not through SafeHttpClient; no
 * caller-supplied URL is involved.
 */
export class VercelBlobPhotoStore implements BlobPhotoStore {
  constructor(private readonly token: string) {}
  async put(key: string, data: Buffer, contentType: string, opts: { cacheControlMaxAge?: number } = {}): Promise<string> {
    const { put } = await import('@vercel/blob')
    const blob = await put(key, data, { access: 'public', contentType, token: this.token, addRandomSuffix: false, ...(opts.cacheControlMaxAge ? { cacheControlMaxAge: opts.cacheControlMaxAge } : {}) })
    return blob.url
  }
  async delete(key: string): Promise<void> {
    const { del } = await import('@vercel/blob')
    await del(key, { token: this.token })
  }
}
