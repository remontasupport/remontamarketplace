import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { searchLocalities, toEntry } from '../../src/modules/localities/locality-directory'
import { PwnedPasswordsChecker } from '../../src/modules/registration/adapters/pwned-passwords'
import { detectImageType } from '@remonta/schemas/image-type'
import { CATEGORY_ORDER, orderCategories } from '../../src/modules/registration/application/service-categories'
import { SafeHttpClient } from '../../src/platform/http/safe-http-client'

const entries = [
  { id: 1, suburb: 'Parramatta', state: 'NSW', postcode: '2150', searchName: 'parramatta' },
  { id: 2, suburb: 'North Parramatta', state: 'NSW', postcode: '2151', searchName: 'north parramatta' },
  { id: 3, suburb: 'Parramatta Park', state: 'QLD', postcode: '4870', searchName: 'parramatta park' },
  { id: 4, suburb: 'St Kilda', state: 'VIC', postcode: '3182', searchName: 'st kilda' },
  { id: 5, suburb: 'St Kilda', state: 'SA', postcode: '5110', searchName: 'st kilda' },
  { id: 6, suburb: 'Melbourne', state: 'VIC', postcode: '3000', searchName: 'melbourne' },
  { id: 7, suburb: 'Melbourne', state: 'VIC', postcode: '3004', searchName: 'melbourne' },
  { id: 8, suburb: 'Ti-Tree', state: 'NT', postcode: '0872', searchName: 'ti-tree' },
]
  .map(toEntry)
  .sort((a, b) => (a.searchName < b.searchName ? -1 : a.searchName > b.searchName ? 1 : a.postcode < b.postcode ? -1 : 1))

const ids = (q: string) => searchLocalities(entries, q).map((m) => m.id)

describe('searchLocalities', () => {
  it('puts name-prefix matches first, then later-word matches', () => {
    expect(ids('parra')).toEqual([1, 3, 2])
  })
  it('finds a suburb by a later word', () => {
    expect(ids('kilda').sort()).toEqual([4, 5])
    expect(ids('tree')).toEqual([8])
  })
  it('matches postcodes by prefix, and "suburb postcode" by both', () => {
    expect(ids('300')).toEqual([6, 7])
    expect(ids('melbourne 3004')).toEqual([7])
    expect(ids('  MELBOURNE   30 ')).toEqual([6, 7])
  })
  it('needs two characters and returns at most 10', () => {
    expect(ids('p')).toEqual([])
    const many = Array.from({ length: 30 }, (_, i) => toEntry({ id: i, suburb: `Aa${i}`, state: 'NSW', postcode: '2000', searchName: `aa${i}` }))
    expect(searchLocalities(many, 'aa')).toHaveLength(10)
  })
  it('labels each match as the autocomplete shows it', () => {
    expect(searchLocalities(entries, 'parramatta 2150')).toEqual([{ id: 1, suburb: 'Parramatta', state: 'NSW', postcode: '2150', label: 'Parramatta NSW 2150' }])
  })
  it('every result actually matches the query', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z ]{2,6}$/), (q) => {
        const t = q.trim().replace(/\s+/g, ' ')
        for (const m of searchLocalities(entries, q)) {
          const e = entries.find((x) => x.id === m.id)!
          expect(e.searchName.startsWith(t) || e.words.some((w) => w.startsWith(t))).toBe(true)
        }
      }),
    )
  })
})

describe('detectImageType (magic bytes, not the declared type)', () => {
  const bytes = (...b: number[]) => Uint8Array.from(b)
  const text = (s: string) => new TextEncoder().encode(s)
  it.each([
    ['JPEG', bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10), 'image/jpeg'],
    ['PNG', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0), 'image/png'],
    ['WebP', text('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '), 'image/webp'],
    ['HEIC', text('\u0000\u0000\u0000\u0018ftypheic\u0000\u0000'), 'image/heic'],
    ['an SVG', text('<svg xmlns="http://www.w3.org/2000/svg"/>'), null],
    ['HTML named photo.jpg', text('<html><script>alert(1)</script>'), null],
    ['a PDF', text('%PDF-1.7'), null],
    ['a GIF', text('GIF89a'), null],
    ['an MP4 (ftyp but not HEIC)', text('\u0000\u0000\u0000\u0018ftypisom\u0000\u0000'), null],
    ['nothing', bytes(), null],
  ])('%s -> %s', (_label, b, type) => {
    expect(detectImageType(b)).toBe(type)
  })
})

describe('PwnedPasswordsChecker (k-anonymity)', () => {
  // SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
  const fetchReturning = (body: string | Error, seen: string[]) =>
    (async (url: URL | string) => {
      seen.push(String(url))
      if (body instanceof Error) throw body
      return new Response(body, { status: 200 })
    }) as unknown as typeof fetch
  const checker = (body: string | Error, seen: string[] = []) =>
    new PwnedPasswordsChecker(new SafeHttpClient({ allowedHosts: ['api.pwnedpasswords.com'], fetch: fetchReturning(body, seen) }))

  it('sends only the first 5 hash characters', async () => {
    const seen: string[] = []
    await checker('', seen).check('password')
    expect(seen).toEqual(['https://api.pwnedpasswords.com/range/5BAA6'])
  })
  it('finds a breached password', async () => {
    expect(await checker('0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:9659365\r\n').check('password')).toEqual({ status: 'breached', count: 9659365 })
  })
  it('treats a padding line (count 0) as clear', async () => {
    expect(await checker('1E4C9B93F3F0682250B6CF8331B7EE68FD8:0\r\n').check('password')).toEqual({ status: 'clear' })
  })
  it('is "unknown", never "clear", when the service is unreachable', async () => {
    expect(await checker(new TypeError('fetch failed')).check('password')).toEqual({ status: 'unknown', reason: 'network' })
  })
})

describe('orderCategories (GET /v1/service-categories)', () => {
  it('puts the main services first, in their fixed order, then the rest by name', () => {
    const names = ['Personal Trainer', 'Nursing Services', 'Support Worker', 'Cleaning Services', 'Beauty', 'Support Worker (High Intensity)']
    expect(orderCategories(names.map((name) => ({ name }))).map((c) => c.name)).toEqual([
      'Support Worker',
      'Support Worker (High Intensity)',
      'Cleaning Services',
      'Nursing Services',
      'Beauty',
      'Personal Trainer',
    ])
  })

  it('is a permutation with the listed names first (in order) and the others sorted', () => {
    const name = fc.oneof(fc.constantFrom(...CATEGORY_ORDER), fc.string({ minLength: 1, maxLength: 12 }))
    fc.assert(
      fc.property(fc.uniqueArray(name, { maxLength: 15 }), (names) => {
        const out = orderCategories(names.map((n) => ({ name: n }))).map((c) => c.name)
        expect([...out].sort()).toEqual([...names].sort())
        const listed = out.filter((n) => (CATEGORY_ORDER as readonly string[]).includes(n))
        const rest = out.slice(listed.length)
        expect(out.slice(0, listed.length)).toEqual(listed)
        expect(listed).toEqual(CATEGORY_ORDER.filter((n) => listed.includes(n)))
        expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)))
      }),
    )
  })
})
