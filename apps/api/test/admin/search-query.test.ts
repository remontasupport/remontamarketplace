// search-query.ts (U2, rules R1.2-R1.5, R3.6, R7; properties G5, G9): the pure
// normalisation of the admin search and the age rule against today's registry
// function, ported here as the oracle.
import { workerSearchQuerySchema, type WorkerSearchQueryParsed } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../src/platform/errors'
import { appliedFiltersOf, birthWindowOf, escapeLike, normaliseQuery, titleCase } from '../../src/modules/admin/domain/search-query'

const NOW = new Date('2026-10-08T00:00:00Z')
const parse = (raw: Record<string, unknown>): WorkerSearchQueryParsed => workerSearchQuerySchema.parse(raw)

/** Today's `age` filter of apps/app's admin route, verbatim in effect (the oracle for G9). */
function todaysAgeWindow(range: string, now: Date): { minAge: number; maxAge: number; minBirth: string; maxBirth: string } | null {
  const currentYear = now.getUTCFullYear()
  let minAge: number
  let maxAge: number
  if (range === '60+') {
    minAge = 60
    maxAge = 120
  } else {
    const match = range.match(/^(\d+)-(\d+)$/)
    if (!match) return null
    minAge = parseInt(match[1]!, 10)
    maxAge = parseInt(match[2]!, 10)
  }
  const maxBirthYear = currentYear - minAge
  const minBirthYear = currentYear - maxAge
  return { minAge, maxAge, minBirth: `${minBirthYear}-01-01`, maxBirth: `${maxBirthYear}-12-31` }
}

describe('normaliseQuery', () => {
  it('defaults: createdAt desc without a suburb, distance asc with one (R1.2)', () => {
    expect(normaliseQuery(parse({}), NOW)).toMatchObject({ page: 1, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc', unplaced: false })
    expect(normaliseQuery(parse({ localityId: '12' }), NOW)).toMatchObject({ sortBy: 'distance', sortOrder: 'asc', localityId: 12 })
    expect(normaliseQuery(parse({ localityId: '12', sortBy: 'lastName' }), NOW)).toMatchObject({ sortBy: 'lastName', sortOrder: 'desc' })
  })

  it('refuses a radius or a distance sort without a suburb, naming the field (R1.3)', () => {
    expect(() => normaliseQuery(parse({ withinKm: '10' }), NOW)).toThrow(ApiError)
    try {
      normaliseQuery(parse({ withinKm: '10' }), NOW)
    } catch (e) {
      expect((e as ApiError).fields).toEqual({ withinKm: ['Choose a suburb first'] })
    }
    expect(() => normaliseQuery(parse({ sortBy: 'distance' }), NOW)).toThrow(/sortBy=distance/)
  })

  it('the unmapped list ignores the location and never fails for it (R1.4)', () => {
    const q = normaliseQuery(parse({ unplaced: 'true', localityId: '12', withinKm: '10' }), NOW)
    expect(q.unplaced).toBe(true)
    expect(q.localityId).toBeUndefined()
    expect(q.withinKm).toBeUndefined()
    expect(q.sortBy).toBe('createdAt')
  })

  it('normalises the text and the lists; maps the worker type to the JSON code (R3.1, R3.7, R3.8)', () => {
    const q = normaliseQuery(parse({ search: '  Test   Terson ', languages: 'mandarin,ENGLISH', workerType: 'Employee' }), NOW)
    expect(q.search).toBe('Test Terson')
    expect(q.searchParts).toEqual(['Test', 'Terson'])
    expect(q.languages).toEqual(['English', 'Mandarin'])
    expect(q.workerTypeCode).toBe('tfn')
    expect(normaliseQuery(parse({ workerType: 'Contractor' }), NOW).workerTypeCode).toBe('abn')
  })

  it('G5: idempotent, and appliedFilters echoes exactly the active filters', () => {
    const arb = fc.record(
      {
        page: fc.integer({ min: 1, max: 9 }).map(String),
        search: fc.constantFrom('a', 'Test Terson', 'x y z'),
        localityId: fc.integer({ min: 1, max: 999 }).map(String),
        withinKm: fc.constantFrom('5', '10', '20', '50'),
        gender: fc.constantFrom('Male', 'Female'),
        hasVehicle: fc.constantFrom('Yes', 'No'),
        workerType: fc.constantFrom('Employee', 'Contractor'),
        age: fc.constantFrom('20-30', '31-45', '46-60', '60+'),
        languages: fc.constantFrom('English', 'English,Mandarin'),
        experienceWith: fc.constantFrom('AGED_CARE', 'AGED_CARE,DISABILITY'),
        unplaced: fc.constantFrom('true', 'false'),
      },
      { requiredKeys: [] },
    )
    fc.assert(
      fc.property(arb, (raw) => {
        const input: Record<string, string> = { ...raw }
        if (input.withinKm && !input.localityId) delete input.withinKm
        const q = normaliseQuery(parse(input), NOW)
        const applied = appliedFiltersOf(q, q.localityId !== undefined ? { id: q.localityId, label: 'X' } : undefined)
        for (const k of ['search', 'gender', 'hasVehicle', 'workerType'] as const) {
          if (input[k] !== undefined) expect(applied[k]).toBe(k === 'search' ? input[k]!.trim().replace(/\s+/g, ' ') : input[k])
          else expect(applied[k]).toBeUndefined()
        }
        expect(applied.unplaced).toBe(q.unplaced ? true : undefined)
        expect(applied.locality !== undefined).toBe(q.localityId !== undefined)
        expect(applied.withinKm).toBe(q.withinKm)
        expect(applied.age).toBe(q.age?.range)
      }),
      { numRuns: 150 },
    )
  })
})

describe('birthWindowOf', () => {
  it('G9: matches today\'s rule for every range and any year', () => {
    fc.assert(
      fc.property(fc.constantFrom('20-30', '31-45', '46-60', '60+'), fc.integer({ min: 2020, max: 2040 }), (range, year) => {
        const now = new Date(Date.UTC(year, 5, 15))
        const ours = birthWindowOf(range, now)
        const theirs = todaysAgeWindow(range, now)!
        expect([ours.minAge, ours.maxAge, ours.minBirth, ours.maxBirth]).toEqual([theirs.minAge, theirs.maxAge, theirs.minBirth, theirs.maxBirth])
      }),
    )
  })
  it('the four ranges at 2026', () => {
    expect(birthWindowOf('20-30', NOW)).toMatchObject({ minBirth: '1996-01-01', maxBirth: '2006-12-31' })
    expect(birthWindowOf('60+', NOW)).toMatchObject({ minAge: 60, maxAge: 120, minBirth: '1906-01-01', maxBirth: '1966-12-31' })
  })
})

describe('helpers', () => {
  it('titleCase and escapeLike', () => {
    expect(titleCase('mandarin chinese')).toBe('Mandarin Chinese')
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b')
  })
})
