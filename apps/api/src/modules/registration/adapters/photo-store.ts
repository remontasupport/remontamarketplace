// Where registration photos are stored (S1-design 3.2): a port, so AU private
// storage (OI-07) is an adapter swap. Keys are server-generated; the client never
// names a file.
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

export interface PhotoStore {
  /** Stores the bytes under `key` and returns the public URL. */
  put(key: string, data: Buffer, contentType: string): Promise<string>
  delete(key: string): Promise<void>
}

/** Development only (config refuses it in production): files under a local folder. */
export class LocalDiskPhotoStore implements PhotoStore {
  private readonly root: string
  constructor(dir: string) {
    this.root = resolve(dir)
  }
  private pathOf(key: string): string {
    const p = resolve(join(this.root, key))
    if (!p.startsWith(this.root)) throw new Error('photo key escapes the store')
    return p
  }
  async put(key: string, data: Buffer): Promise<string> {
    const p = this.pathOf(key)
    await mkdir(dirname(p), { recursive: true })
    await writeFile(p, data)
    return `local-photo://${key}`
  }
  async delete(key: string): Promise<void> {
    await rm(this.pathOf(key), { force: true })
  }
}

/**
 * Vercel Blob, public, as today (apps/app lib/blobStorage.ts). The SDK makes its
 * own request to Vercel's fixed API host -- the one outbound call not made through
 * SafeHttpClient; no caller-supplied URL is involved.
 */
export class VercelBlobPhotoStore implements PhotoStore {
  constructor(private readonly token: string) {}
  async put(key: string, data: Buffer, contentType: string): Promise<string> {
    const { put } = await import('@vercel/blob')
    const blob = await put(key, data, { access: 'public', contentType, token: this.token, addRandomSuffix: false })
    return blob.url
  }
  async delete(key: string): Promise<void> {
    const { del } = await import('@vercel/blob')
    await del(key, { token: this.token })
  }
}
