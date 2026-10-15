import { describe, expect, it } from 'vitest'
import { detectDocumentType, documentExtensionOf, isDocumentType, matchesDeclared } from './document-type'

const bytes = (...v: (number | string)[]) => new Uint8Array(v.flatMap((x) => (typeof x === 'string' ? [...x].map((c) => c.charCodeAt(0)) : [x])))

describe('detectDocumentType', () => {
  it('a PDF, and the image types of image-type', () => {
    expect(detectDocumentType(bytes('%PDF-1.7\n'))).toBe('application/pdf')
    expect(detectDocumentType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(detectDocumentType(bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png')
    expect(detectDocumentType(bytes('RIFF', 0, 0, 0, 0, 'WEBP'))).toBe('image/webp')
    expect(detectDocumentType(bytes(0, 0, 0, 0x18, 'ftyp', 'mif1'))).toBe('image/heic')
  })
  it('anything else is null: a renamed text file, a zip (docx), a short header, "%PDF" without the dash', () => {
    for (const b of [bytes('hello world'), bytes('PK', 3, 4), bytes('%PD'), bytes('%PDF1')]) expect(detectDocumentType(b)).toBeNull()
  })
})

describe('matchesDeclared', () => {
  it('the bytes must be what was declared; HEIF counts as HEIC', () => {
    expect(matchesDeclared('application/pdf', 'application/pdf')).toBe(true)
    expect(matchesDeclared('image/heic', 'image/heif')).toBe(true)
    expect(matchesDeclared('image/jpeg', 'application/pdf')).toBe(false)
    expect(matchesDeclared('application/pdf', 'image/jpeg')).toBe(false)
    expect(matchesDeclared(null, 'application/pdf')).toBe(false)
    expect(matchesDeclared('application/pdf', null)).toBe(false)
  })
  it('extensions and the list', () => {
    expect(documentExtensionOf('application/pdf')).toBe('pdf')
    expect(documentExtensionOf('image/heif')).toBe('heif')
    expect(isDocumentType('application/pdf')).toBe(true)
    expect(isDocumentType('application/zip')).toBe(false)
  })
})
