import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { ACCEPTED_IMAGE_TYPES, detectImageType, extensionOf, IMAGE_HEADER_BYTES, isAcceptedImageType, isHeicHeader } from './image-type'

const JPEG = [0xff, 0xd8, 0xff, 0xe0]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const WEBP = [...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0)))
const heic = (brand: string) => [0, 0, 0, 0x18, ...'ftyp'].map((c) => (typeof c === 'number' ? c : c.charCodeAt(0))).concat([...brand].map((c) => c.charCodeAt(0)))

describe('detectImageType (examples)', () => {
  it.each([
    ['JPEG', JPEG, 'image/jpeg'],
    ['PNG', PNG, 'image/png'],
    ['WebP', WEBP, 'image/webp'],
    ['HEIC heic', heic('heic'), 'image/heic'],
    ['HEIC mif1', heic('mif1'), 'image/heic'],
    ['SVG', [...'<svg xmlns'].map((c) => c.charCodeAt(0)), null],
    ['GIF', [...'GIF89a'].map((c) => c.charCodeAt(0)), null],
    ['empty', [], null],
    ['RIFF but not WEBP (WAV)', [...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WAVE'].map((c) => c.charCodeAt(0))), null],
    ['ftyp with an mp4 brand', heic('isom'), null],
  ])('%s', (_, bytes, expected) => {
    expect(detectImageType(new Uint8Array(bytes))).toBe(expected)
  })

  it('names the extension and the accepted set', () => {
    expect(extensionOf('image/jpeg')).toBe('jpg')
    expect(ACCEPTED_IMAGE_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp'])
    expect(isAcceptedImageType('image/heic')).toBe(false)
    expect(isAcceptedImageType('image/webp')).toBe(true)
    expect(isHeicHeader(new Uint8Array(heic('heix')))).toBe(true)
    expect(isHeicHeader(new Uint8Array(JPEG))).toBe(false)
  })
})

describe('detectImageType (properties)', () => {
  const signatures: [string, number[]][] = [
    ['image/jpeg', JPEG],
    ['image/png', PNG],
    ['image/webp', WEBP],
    ['image/heic', heic('heic')],
  ]
  const tail = fc.uint8Array({ minLength: 0, maxLength: 64 })

  it('any buffer starting with a known signature classifies as that type, whatever follows', () => {
    fc.assert(
      fc.property(fc.constantFrom(...signatures), tail, ([type, sig], rest) => detectImageType(new Uint8Array([...sig, ...rest])) === type),
    )
  })

  it('depends only on the first IMAGE_HEADER_BYTES bytes', () => {
    fc.assert(
      fc.property(fc.uint8Array({ minLength: IMAGE_HEADER_BYTES, maxLength: 256 }), fc.uint8Array({ maxLength: 256 }), (head, more) => detectImageType(head) === detectImageType(new Uint8Array([...head.subarray(0, IMAGE_HEADER_BYTES), ...more]))),
    )
  })

  it('a buffer whose first bytes match no signature classifies as null', () => {
    const noSignature = fc.uint8Array({ minLength: 0, maxLength: 32 }).filter((b) => {
      const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
      const png = PNG.every((v, i) => b[i] === v)
      const riff = String.fromCharCode(...b.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...b.subarray(8, 12)) === 'WEBP'
      const ftyp = String.fromCharCode(...b.subarray(4, 8)) === 'ftyp'
      return !(jpeg || png || riff || ftyp)
    })
    fc.assert(fc.property(noSignature, (b) => detectImageType(b) === null))
  })
})
