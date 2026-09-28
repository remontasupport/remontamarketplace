// Sign-up photo upload (S1-design 3.2). The file is checked by its bytes, stored
// under a server-generated name, and recorded as a staged upload; the caller gets
// an id, never a URL, and registration can reference only that id (P1, P5).
import { createHmac, randomUUID } from 'node:crypto'
import { ApiError } from '../../../platform/errors'
import type { Db } from '../../../platform/persistence/db'
import type { UploadedFile } from '../../../platform/contract/handlers'
import type { PhotoStore } from '../adapters/photo-store'
import { detectImageType, extensionOf } from '../domain/image-type'

export interface StagePhotoDeps {
  db: Db
  store: PhotoStore
  ipHashSecret: string
}

export function hashIp(ip: string, secret: string): string {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

export async function stagePhoto(file: UploadedFile, ip: string, deps: StagePhotoDeps): Promise<{ photoUploadId: string }> {
  const type = detectImageType(file.data)
  if (!type) throw new ApiError(415, `photo bytes are not an accepted image (declared ${file.declaredType})`, { photo: ['Please upload a JPEG, PNG, WebP or HEIC photo'] })

  const id = randomUUID()
  const key = `workers/registration/${id}.${extensionOf(type)}`
  const url = await deps.store.put(key, file.data, type)
  try {
    await deps.db.registrationPhotoUpload.create({
      data: { id, blobKey: key, url, contentType: type, sizeBytes: file.data.byteLength, ipHash: hashIp(ip, deps.ipHashSecret) },
    })
  } catch (err) {
    await deps.store.delete(key).catch(() => {}) // no orphan blob for a row that does not exist
    throw err
  }
  return { photoUploadId: id }
}
