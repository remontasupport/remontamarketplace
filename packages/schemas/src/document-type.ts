// A service document's real type, from its first bytes (U3b, api-review): what the worker may upload as a
// qualification, registration, licence or insurance -- a PDF or a photo of it. Shared by apps/api (to check what
// landed in the bucket) and the app (to refuse before uploading), as image-type.ts is for the profile photo. Pure: no
// imports beyond image-type (P-5). The declared type and the file name are never trusted.
import { detectImageType, IMAGE_HEADER_BYTES } from './image-type'

export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

/** Today's limit for a service document (the app's upload action, 50 MB). */
export const DOCUMENT_MAX_BYTES = 50 * 1024 * 1024

/** Bytes needed to classify: the image signatures' (16) cover "%PDF-" too. */
export const DOCUMENT_HEADER_BYTES = IMAGE_HEADER_BYTES

const EXT: Record<DocumentType, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' }

export function documentExtensionOf(t: DocumentType): string {
  return EXT[t]
}

/** The type the bytes are, or null. HEIC and HEIF share a container: both read as `image/heic`. */
export function detectDocumentType(b: Uint8Array): DocumentType | null {
  if (b.length >= 5 && String.fromCharCode(...b.subarray(0, 5)) === '%PDF-') return 'application/pdf'
  return detectImageType(b)
}

/** Do the bytes match what was declared (and stored as the object's content type)? HEIF counts as HEIC. */
export function matchesDeclared(detected: DocumentType | null, declared: string | null | undefined): boolean {
  if (!detected || !declared) return false
  if (detected === 'image/heic') return declared === 'image/heic' || declared === 'image/heif'
  return detected === declared
}

export function isDocumentType(t: string | null | undefined): t is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(t ?? '')
}
