// The bucket adapter (U3, AD-1, T2-T4): Google Cloud Storage through the official
// client. Tickets are V4 signed POST policies; on Cloud Run the client signs them with
// the runtime service account through IAM `signBlob` (no key file); tests inject a
// throwaway key, and point `apiEndpoint` at a fake server (no credentials needed then).
//
// One call = one attempt under one timeout (NFR design P1): the caller decides what a
// failure means. The SDK talks to Google's fixed hosts on its own -- not through
// SafeHttpClient, like the Blob SDK; no caller-supplied URL is involved.
import { Storage, type Bucket } from '@google-cloud/storage'
import type { ImageType } from '@remonta/schemas/image-type'
import { StoreUnavailable, type ObjectInfo, type PhotoStore, type UploadTicket } from './photo-store'

export interface GcsPhotoStoreOptions {
  bucket: string
  /** `https://storage.googleapis.com/<bucket>` in production; the fake server's URL in tests. */
  publicBaseUrl: string
  /** The fake server (tests, local). Unset in production. */
  apiEndpoint?: string
  /** Tests: a throwaway service-account key so policies can be signed offline. */
  credentials?: { client_email: string; private_key: string }
  timeoutMs: number
}

export class GcsPhotoStore implements PhotoStore {
  private readonly bucket: Bucket
  private readonly base: string
  private readonly timeoutMs: number

  constructor(opts: GcsPhotoStoreOptions) {
    const storage = new Storage({
      ...(opts.apiEndpoint ? { apiEndpoint: opts.apiEndpoint, projectId: 'local' } : {}),
      ...(opts.credentials ? { credentials: opts.credentials } : {}),
      retryOptions: { autoRetry: false },
    })
    this.bucket = storage.bucket(opts.bucket)
    this.base = opts.publicBaseUrl.replace(/\/+$/, '')
    this.timeoutMs = opts.timeoutMs
  }

  async createUploadTicket(key: string, contentType: ImageType, maxBytes: number, expiresAt: Date): Promise<UploadTicket> {
    const [policy] = await this.bounded('sign', () =>
      this.bucket.file(key).generateSignedPostPolicyV4({
        expires: expiresAt,
        conditions: [
          ['eq', '$Content-Type', contentType],
          ['content-length-range', 1, maxBytes],
        ],
        fields: { 'Content-Type': contentType, success_action_status: '201' },
      }),
    )
    return { url: policy.url, fields: policy.fields, expiresAt }
  }

  async inspect(key: string): Promise<ObjectInfo | null> {
    try {
      const [meta] = await this.bounded('inspect', () => this.bucket.file(key).getMetadata())
      return { sizeBytes: Number(meta.size ?? 0), contentType: meta.contentType ?? null }
    } catch (err) {
      if (isNotFound(err)) return null
      throw err
    }
  }

  async readPrefix(key: string, bytes: number): Promise<Uint8Array> {
    const chunks: Buffer[] = []
    await this.bounded('read-prefix', () => {
      return new Promise<void>((resolve, reject) => {
        this.bucket
          .file(key)
          .createReadStream({ start: 0, end: bytes - 1, validation: false })
          .on('data', (c: Buffer) => chunks.push(c))
          .on('end', resolve)
          .on('error', reject)
      })
    })
    return new Uint8Array(Buffer.concat(chunks).subarray(0, bytes))
  }

  async read(key: string): Promise<Buffer> {
    const [data] = await this.bounded('read', () => this.bucket.file(key).download())
    return data
  }

  async write(key: string, data: Buffer, contentType: string, opts: { cacheControl: string }): Promise<string> {
    await this.bounded('write', () => this.bucket.file(key).save(data, { contentType, metadata: { cacheControl: opts.cacheControl }, resumable: false, validation: false }))
    return `${this.base}/${key}`
  }

  async delete(key: string): Promise<void> {
    await this.bounded('delete', () => this.bucket.file(key).delete({ ignoreNotFound: true }))
  }

  /** One attempt, one deadline. A missing object surfaces as the SDK's 404 (callers of inspect map it); everything else is StoreUnavailable. */
  private async bounded<T>(op: string, call: () => Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new StoreUnavailable(op, `timeout after ${this.timeoutMs} ms`)), this.timeoutMs)
    })
    try {
      return await Promise.race([call(), deadline])
    } catch (err) {
      if (err instanceof StoreUnavailable || isNotFound(err)) throw err
      throw new StoreUnavailable(op, err)
    } finally {
      clearTimeout(timer)
    }
  }
}

export function isNotFound(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 404
}
