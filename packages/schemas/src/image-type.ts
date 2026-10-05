// An image's real type, from its first bytes. Shared by the sign-up wizard (to refuse
// a HEIC before any upload) and by apps/api (to check what landed in the bucket), so
// both sides make the same decision from one implementation. Pure: no imports (P-5).
//
// The client's declared type and the file name are never trusted: a file called
// photo.jpg can be anything.

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'

/** What the sign-up accepts. HEIC is detected only to say no to it (user decision, 2026-10-05). */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number]

/** Bytes needed to classify: the longest signature (HEIC's `ftyp` box brand) ends at offset 12. */
export const IMAGE_HEADER_BYTES = 16

const EXT: Record<ImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }

export function extensionOf(t: ImageType): string {
  return EXT[t]
}

const HEIC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'])

export function detectImageType(b: Uint8Array): ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return 'image/png'
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'image/webp'
  if (b.length >= 12 && ascii(b, 4, 8) === 'ftyp' && HEIC_BRANDS.has(ascii(b, 8, 12))) return 'image/heic'
  return null
}

export function isAcceptedImageType(t: string | null | undefined): t is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(t ?? '')
}

/** True when the bytes are a HEIC/HEIF container: the one format the sign-up names in its message. */
export function isHeicHeader(b: Uint8Array): boolean {
  return detectImageType(b) === 'image/heic'
}

function ascii(b: Uint8Array, from: number, to: number): string {
  return String.fromCharCode(...b.subarray(from, to))
}
