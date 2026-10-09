// The page's mappings (U2 R11.1-R11.3, J1): display -> canonical, and the URL
// round trip through the contract's canonical form (G6 on the app side): for any
// state, filtersFromURL(urlFromFilters(f)) builds the same URL again.
import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { AGE_RANGES } from '@remonta/api-contract'
import { canonicalOf, DEFAULT_FILTERS, EXPERIENCE_OPTIONS, experienceAreasOfLabel, filtersFromURL, toQuery, urlFromFilters, type AdminFilters } from './query'

describe('toQuery (R11.1)', () => {
  it('maps display values to canonical ones and omits all/none', () => {
    const q = toQuery({
      ...DEFAULT_FILTERS,
      gender: 'female',
      hasVehicle: 'Yes',
      workerType: 'Contractor',
      age: '60+',
      typeOfSupport: 'support-worker',
      experienceWith: ['Aged Care', 'Mental health'],
      experienceAreas: { AGED_CARE: ['Dementia', 'Stroke Recovery'], DISABILITY: ['Autism'] },
      languages: ['Spanish'],
      search: '  Test Terson  ',
      locality: { id: 5410, label: 'Parramatta NSW 2150' },
      withinKm: 10,
    })
    expect(q).toEqual({
      page: 1,
      pageSize: 6,
      localityId: 5410,
      withinKm: 10,
      search: 'Test Terson',
      typeOfSupport: 'support-worker',
      gender: 'Female',
      hasVehicle: 'Yes',
      workerType: 'Contractor',
      age: '60+',
      languages: ['Spanish'],
      experienceWith: ['AGED_CARE', 'MENTAL_HEALTH'],
      experienceAreas: ['AGED_CARE:Dementia', 'AGED_CARE:Stroke Recovery'], // Disability is not searched: its areas stay home (R3.11)
    })
    expect(toQuery(DEFAULT_FILTERS)).toEqual({ page: 1, pageSize: 6 })
  })

  it('experience areas: only the vocabulary of a searched domain is sent; the URL restores them under their domain', () => {
    expect(toQuery({ ...DEFAULT_FILTERS, experienceWith: ['Aged Care'], experienceAreas: { AGED_CARE: ['Autism', 'Dementia'] } }).experienceAreas).toEqual(['AGED_CARE:Dementia'])
    expect(toQuery({ ...DEFAULT_FILTERS, experienceAreas: { AGED_CARE: ['Dementia'] } })).toEqual({ page: 1, pageSize: 6 })
    expect(experienceAreasOfLabel('Aged Care')).toContain('Dementia')
    expect(experienceAreasOfLabel('nope')).toEqual([])
    const back = filtersFromURL(new URLSearchParams('experienceWith=AGED_CARE&experienceAreas=AGED_CARE%3ADementia%2CAGED_CARE%3AStroke+Recovery'))
    expect(back.experienceWith).toEqual(['Aged Care'])
    expect(back.experienceAreas).toEqual({ AGED_CARE: ['Dementia', 'Stroke Recovery'] })
    // A URL with an area but not its domain is what the contract would refuse: the state drops the area.
    expect(filtersFromURL(new URLSearchParams('experienceAreas=AGED_CARE%3ADementia')).experienceAreas).toEqual({})
  })

  it('unplaced drops the locality and the radius (R1.4); a distance sort needs a locality (R11.3)', () => {
    const f: AdminFilters = { ...DEFAULT_FILTERS, unplaced: true, locality: { id: 1, label: 'x' }, withinKm: 5, sortBy: 'distance' }
    expect(toQuery(f)).toEqual({ page: 1, pageSize: 6, unplaced: true })
    expect(toQuery({ ...DEFAULT_FILTERS, sortBy: 'distance' })).toEqual({ page: 1, pageSize: 6 })
    expect(toQuery({ ...DEFAULT_FILTERS, sortBy: 'lastName', sortOrder: 'asc' })).toEqual({ page: 1, pageSize: 6, sortBy: 'lastName', sortOrder: 'asc' })
  })

  it('withinKm without a locality is never sent', () => {
    expect(toQuery({ ...DEFAULT_FILTERS, withinKm: 10 })).toEqual({ page: 1, pageSize: 6 })
  })
})

describe('the URL state (R11.2)', () => {
  it('carries the canonical query and the suburb label', () => {
    const url = urlFromFilters({ ...DEFAULT_FILTERS, locality: { id: 5410, label: 'Parramatta NSW 2150' }, withinKm: 10, gender: 'female' })
    expect(url).toBe('?gender=Female&localityId=5410&page=1&pageSize=6&withinKm=10&localityLabel=Parramatta+NSW+2150')
    const back = filtersFromURL(new URLSearchParams(url))
    expect(back.locality).toEqual({ id: 5410, label: 'Parramatta NSW 2150' })
    expect(back.withinKm).toBe(10)
    expect(back.gender).toBe('female')
  })

  it('an invalid URL falls back to the defaults', () => {
    expect(filtersFromURL(new URLSearchParams('?withinKm=10'))).toEqual(DEFAULT_FILTERS)
    expect(filtersFromURL(new URLSearchParams('?nope=1'))).toEqual(DEFAULT_FILTERS)
  })

  const filters: fc.Arbitrary<AdminFilters> = fc
    .record({
      page: fc.integer({ min: 1, max: 50 }),
      sortBy: fc.option(fc.constantFrom('createdAt', 'firstName', 'lastName', 'city', 'state', 'distance' as const), { nil: undefined }),
      sortOrder: fc.option(fc.constantFrom('asc' as const, 'desc' as const), { nil: undefined }),
      search: fc.stringMatching(/^[A-Za-z0-9 ]{0,20}$/),
      locality: fc.option(fc.record({ id: fc.integer({ min: 1, max: 20000 }), label: fc.stringMatching(/^[A-Za-z ]{1,20} [A-Z]{2,3} [0-9]{4}$/) }), { nil: undefined }),
      withinKm: fc.option(fc.constantFrom(5, 10, 20, 50), { nil: undefined }),
      unplaced: fc.boolean(),
      typeOfSupport: fc.option(fc.constantFrom('support-worker', 'therapeutic-supports', 'nursing-services'), { nil: undefined }),
      gender: fc.constantFrom('all' as const, 'male' as const, 'female' as const),
      hasVehicle: fc.constantFrom('all' as const, 'Yes' as const, 'No' as const),
      workerType: fc.constantFrom('all' as const, 'Employee' as const, 'Contractor' as const),
      age: fc.constantFrom('all' as const, ...AGE_RANGES),
      languages: fc.uniqueArray(fc.constantFrom('English', 'Spanish', 'Arabic', 'Hindi'), { maxLength: 3 }),
      therapeuticSubcategories: fc.uniqueArray(fc.constantFrom('sub-a', 'sub-b', 'sub-c'), { maxLength: 2 }),
      experienceWith: fc.uniqueArray(fc.constantFrom(...EXPERIENCE_OPTIONS.map((o) => o.label)), { maxLength: 3 }),
      experienceAreas: fc.record(
        {
          AGED_CARE: fc.uniqueArray(fc.constantFrom('Dementia', 'Stroke Recovery', "Parkinson's Disease"), { maxLength: 3 }),
          DISABILITY: fc.uniqueArray(fc.constantFrom('Autism', 'Epilepsy'), { maxLength: 2 }),
        },
        { requiredKeys: [] },
      ),
    })
    .map((f) => ({ ...f, pageSize: 6 }))

  it('round-trips through the URL for any state (G6, app side)', () => {
    fc.assert(
      fc.property(filters, (f) => {
        const url = urlFromFilters(f)
        const back = filtersFromURL(new URLSearchParams(url))
        expect(urlFromFilters(back)).toBe(url)
        expect(canonicalOf(back)).toBe(canonicalOf(f))
      }),
      { numRuns: 300 },
    )
  })

  it('the canonical string does not depend on array order', () => {
    const a = canonicalOf({ ...DEFAULT_FILTERS, languages: ['Spanish', 'Arabic'], experienceWith: ['Disability', 'Aged Care'] })
    const b = canonicalOf({ ...DEFAULT_FILTERS, languages: ['Arabic', 'Spanish'], experienceWith: ['Aged Care', 'Disability'] })
    expect(a).toBe(b)
  })
})
