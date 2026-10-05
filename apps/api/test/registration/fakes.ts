// Test doubles for the sign-up photo (U3): an in-memory bucket with failure
// injection, and a Blob double for the multipart path kept during the overlap.
import type { ImageType } from '@remonta/schemas/image-type'
import { StoreUnavailable, type BlobPhotoStore, type ObjectInfo, type PhotoStore, type UploadTicket } from '../../src/modules/registration/adapters/photo-store'

type Op = 'createUploadTicket' | 'inspect' | 'readPrefix' | 'read' | 'write' | 'delete'

export class InMemoryPhotoStore implements PhotoStore {
  readonly objects = new Map<string, { data: Buffer; contentType: string; cacheControl?: string }>()
  readonly tickets: { key: string; contentType: string; maxBytes: number; expiresAt: Date }[] = []
  readonly calls: Op[] = []
  private failures = new Map<Op, number>()
  private notFoundOnRead = false

  constructor(readonly publicBaseUrl = 'http://bucket.test/photos') {}

  /** The next `times` calls of `op` throw StoreUnavailable. */
  failNext(op: Op, times = 1): void {
    this.failures.set(op, times)
  }
  /** `read` throws the SDK's 404 shape (a missing object) instead of returning. */
  readNotFound(): void {
    this.notFoundOnRead = true
  }
  /** Stands in for the browser: puts bytes under a key as the policy would allow. */
  putAsBrowser(key: string, data: Buffer, contentType: string): void {
    this.objects.set(key, { data, contentType })
  }

  private hit(op: Op): void {
    this.calls.push(op)
    const n = this.failures.get(op) ?? 0
    if (n > 0) {
      this.failures.set(op, n - 1)
      throw new StoreUnavailable(op, 'injected failure')
    }
  }

  async createUploadTicket(key: string, contentType: ImageType, maxBytes: number, expiresAt: Date): Promise<UploadTicket> {
    this.hit('createUploadTicket')
    this.tickets.push({ key, contentType, maxBytes, expiresAt })
    return { url: `${this.publicBaseUrl}/`, fields: { key, 'Content-Type': contentType, policy: 'fake', 'x-goog-signature': 'fake' }, expiresAt }
  }
  async inspect(key: string): Promise<ObjectInfo | null> {
    this.hit('inspect')
    const o = this.objects.get(key)
    return o ? { sizeBytes: o.data.byteLength, contentType: o.contentType } : null
  }
  async readPrefix(key: string, bytes: number): Promise<Uint8Array> {
    this.hit('readPrefix')
    const o = this.objects.get(key)
    if (!o) throw Object.assign(new Error('not found'), { code: 404 })
    return new Uint8Array(o.data.subarray(0, bytes))
  }
  async read(key: string): Promise<Buffer> {
    this.hit('read')
    const o = this.objects.get(key)
    if (!o || this.notFoundOnRead) throw Object.assign(new Error('not found'), { code: 404 })
    return o.data
  }
  async write(key: string, data: Buffer, contentType: string, opts: { cacheControl: string }): Promise<string> {
    this.hit('write')
    this.objects.set(key, { data, contentType, cacheControl: opts.cacheControl })
    return `${this.publicBaseUrl}/${key}`
  }
  async delete(key: string): Promise<void> {
    this.hit('delete')
    this.objects.delete(key)
  }
}

export class InMemoryBlobStore implements BlobPhotoStore {
  readonly objects = new Map<string, Buffer>()
  readonly deleted: string[] = []
  constructor(private readonly down = false) {}
  async put(key: string, data: Buffer): Promise<string> {
    this.objects.set(key, data)
    return `local-photo://${key}`
  }
  async delete(key: string): Promise<void> {
    if (this.down) throw new Error('blob store down')
    this.deleted.push(key)
    this.objects.delete(key)
  }
}

/** A minimal JPEG (SOI, APP0, EOI): passes the sniffer, cannot be decoded by sharp. */
export const TINY_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9])

/** A real, decodable JPEG with EXIF (orientation 6 and a GPS block), `w` x `h`. */
export async function jpegWithExif(w: number, h: number): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  return sharp({ create: { width: w, height: h, channels: 3, background: { r: 200, g: 40, b: 40 } } })
    .jpeg()
    .withMetadata({ orientation: 6, exif: { IFD0: { Copyright: 'test', ImageDescription: 'has exif' }, IFD3: { GPSLatitudeRef: 'S' } } })
    .toBuffer()
}

export async function pngOf(w: number, h: number): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  return sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 100, b: 0, alpha: 1 } } }).png().toBuffer()
}
