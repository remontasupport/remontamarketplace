// canonical.ts (U2, R8.5, property G6): one spelling per query, whatever the order of
// keys and array items; and the csv parsing of the admin search query (R1.5).
import { EXPERIENCE_AREA_PAIRS } from '@remonta/schemas/data/experienceAreas'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { adminContract, AGE_RANGES, CARE_DOMAINS, canonicalQueryOf, serializeCanonical, workerSearchQuerySchema } from '../src/index'

const entry = adminContract.entries.searchWorkers
const parseUrl = (s: string) => Object.fromEntries(new URLSearchParams(s))

describe('serializeCanonical', () => {
  it('sorts keys, sorts and joins arrays, drops absent and empty values, encodes', () => {
    expect(serializeCanonical({ page: 1, languages: ['Mandarin', 'English'], search: 'Test Terson', unplaced: undefined, empty: [] })).toBe(
      'languages=English%2CMandarin&page=1&search=Test+Terson',
    )
    expect(serializeCanonical({})).toBe('')
  })
})

describe('the admin search query', () => {
  it('splits, trims, deduplicates and sorts comma-separated values; refuses more than 20 (R1.5)', () => {
    const q = workerSearchQuerySchema.parse({ languages: ' Mandarin, English ,,Mandarin ', experienceWith: 'AGED_CARE,DISABILITY' })
    expect(q.languages).toEqual(['English', 'Mandarin'])
    expect(q.experienceWith).toEqual(['AGED_CARE', 'DISABILITY'])
    expect(workerSearchQuerySchema.safeParse({ languages: Array.from({ length: 21 }, (_, i) => `l${i}`).join(',') }).success).toBe(false)
    expect(workerSearchQuerySchema.safeParse({ experienceWith: 'Aged Care' }).success).toBe(false)
  })

  it('experience areas travel as DOMAIN:Area pairs from the shared vocabulary, sorted; anything else is refused', () => {
    const q = workerSearchQuerySchema.parse({ experienceWith: 'AGED_CARE', experienceAreas: "AGED_CARE:Stroke Recovery,AGED_CARE:Dementia, AGED_CARE:Dementia" })
    expect(q.experienceAreas).toEqual(['AGED_CARE:Dementia', 'AGED_CARE:Stroke Recovery'])
    expect(workerSearchQuerySchema.safeParse({ experienceAreas: 'AGED_CARE:Autism' }).success).toBe(false) // Autism is a Disability area
    expect(workerSearchQuerySchema.safeParse({ experienceAreas: 'Dementia' }).success).toBe(false)
    expect(workerSearchQuerySchema.safeParse({ experienceAreas: 'aged_care:Dementia' }).success).toBe(false)
    expect(workerSearchQuerySchema.safeParse({ experienceAreas: EXPERIENCE_AREA_PAIRS.join(',') }).success).toBe(true) // every area at once is allowed
  })

  it('coerces the numbers and the flag a URL carries, applies the defaults, and is strict (R1.1)', () => {
    const q = workerSearchQuerySchema.parse({ page: '2', pageSize: '50', localityId: '1234', withinKm: '10', unplaced: 'true' })
    expect([q.page, q.pageSize, q.localityId, q.withinKm, q.unplaced]).toEqual([2, 50, 1234, 10, true])
    expect(workerSearchQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 })
    for (const bad of [{ pageSize: '101' }, { withinKm: '501' }, { page: '0' }, { gender: 'male' }, { age: '18-24' }, { documentCategories: 'x' }, { location: 'Parramatta' }]) {
      expect(workerSearchQuerySchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false)
    }
  })

  it('G6: the canonical string survives a round trip and ignores the order of keys and items', () => {
    const arb = fc.record(
      {
        page: fc.integer({ min: 1, max: 50 }).map(String),
        pageSize: fc.integer({ min: 1, max: 100 }).map(String),
        search: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0 && !/[,]/.test(s)),
        localityId: fc.integer({ min: 1, max: 20000 }).map(String),
        withinKm: fc.constantFrom('5', '10', '20', '50'),
        gender: fc.constantFrom('Male', 'Female'),
        age: fc.constantFrom(...AGE_RANGES),
        languages: fc.uniqueArray(fc.constantFrom('English', 'Mandarin', 'Arabic', 'Hindi'), { minLength: 1, maxLength: 4 }).map((a) => a.join(',')),
        experienceWith: fc.uniqueArray(fc.constantFrom(...CARE_DOMAINS), { minLength: 1, maxLength: 3 }).map((a) => a.join(',')),
      },
      { requiredKeys: [] },
    )
    fc.assert(
      fc.property(arb, fc.integer({ min: 0, max: 1000 }), (q, seed) => {
        const input: Record<string, string> = { ...q }
        if (input.withinKm !== undefined && input.localityId === undefined) delete input.withinKm
        const once = canonicalQueryOf(entry, input)
        // Round trip: parse the string back and canonicalise again.
        expect(canonicalQueryOf(entry, parseUrl(once))).toBe(once)
        // Order independence: shuffle keys and the items of every list.
        const keys = Object.keys(input).sort(() => ((seed * 9301 + 49297) % 233280) / 233280 - 0.5)
        const shuffled: Record<string, string> = {}
        for (const k of keys) {
          const v = input[k]!
          shuffled[k] = v.includes(',') ? v.split(',').reverse().join(',') : v
        }
        expect(canonicalQueryOf(entry, shuffled)).toBe(once)
      }),
      { numRuns: 150 },
    )
  })
})
