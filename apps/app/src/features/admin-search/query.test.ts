// The page's mappings (U2 R11.1-R11.3, J1): display -> canonical, and the URL
// round trip through the contract's canonical form (G6 on the app side): for any
// state, filtersFromURL(urlFromFilters(f)) builds the same URL again.
import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { AGE_RANGES, workerSearchQuerySchema } from '@remonta/api-contract'
import { SERVICE_TOOLS, TOOL_IDS, TOOL_SERVICES, toolSearchOf } from '@remonta/schemas/data/serviceTools'
import { canonicalOf, DEFAULT_FILTERS, searchRequestOf, TOOL_GROUPS, toolGroupFor, toolSearchView, EXPERIENCE_OPTIONS, experienceAreasOfLabel, filtersFromURL, toQuery, urlFromFilters, type AdminFilters } from './query'

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
      state: 'NSW',
    })
    expect(q).toEqual({
      page: 1,
      pageSize: 6,
      localityId: 5410,
      withinKm: 10,
      state: 'NSW',
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

  it('state: sent as its code, kept with the unmapped list, restored from the URL (R3.12)', () => {
    expect(toQuery({ ...DEFAULT_FILTERS, unplaced: true, state: 'VIC' })).toEqual({ page: 1, pageSize: 6, unplaced: true, state: 'VIC' })
    expect(filtersFromURL(new URLSearchParams('state=QLD')).state).toBe('QLD')
    expect(filtersFromURL(new URLSearchParams('state=XX')).state).toBe('all') // the contract refuses it: defaults
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
      state: fc.constantFrom('all' as const, 'NSW' as const, 'VIC' as const, 'WA' as const),
      typeOfSupport: fc.option(fc.constantFrom('support-worker', 'therapeutic-supports', 'nursing-services', 'cleaning-services', 'home-yard-maintenance'), { nil: undefined }),
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
      tools: fc.uniqueArray(fc.constantFrom(...TOOL_IDS), { maxLength: 4 }),
      toolSearch: fc.constantFrom('', 'gurney', 'pressure washer', 'mowers', '&', 'Saw'),
      activation: fc.constantFrom('all' as const, 'active' as const, 'inactive' as const),
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

describe('the Tools filter (worker-tools UR-8, PU4; shown for its type of support only, user 2026-10-22)', () => {
  it('two groups, the shared lists in order; a group only for its own type of support', () => {
    expect(TOOL_GROUPS.map((g) => [g.label, g.tools.length])).toEqual([['Cleaning Services', 14], ['Home and Yard Maintenance', 15]])
    expect(toolGroupFor('cleaning-services')?.label).toBe('Cleaning Services')
    expect(toolGroupFor('home-yard-maintenance')?.label).toBe('Home and Yard Maintenance')
    expect(toolGroupFor('support-worker')).toBeUndefined()
    expect(toolGroupFor(undefined)).toBeUndefined()
  })

  it("toQuery sends only the type of support's own listed tools; none without one of the two services", () => {
    expect(toQuery({ ...DEFAULT_FILTERS, typeOfSupport: 'home-yard-maintenance', tools: ['ladder', 'hammer', 'vacuum-cleaner'] }).tools).toEqual(['ladder'])
    expect(toQuery({ ...DEFAULT_FILTERS, typeOfSupport: 'cleaning-services', tools: ['ladder', 'vacuum-cleaner'] }).tools).toEqual(['vacuum-cleaner'])
    expect(toQuery({ ...DEFAULT_FILTERS, tools: ['ladder'] })).not.toHaveProperty('tools')
    expect(toQuery({ ...DEFAULT_FILTERS, typeOfSupport: 'support-worker', tools: ['ladder'] })).not.toHaveProperty('tools')
    expect(toQuery(DEFAULT_FILTERS)).not.toHaveProperty('tools')
  })

  it('a URL with tools but another type of support restores no tools', () => {
    expect(filtersFromURL(new URLSearchParams('tools=ladder&typeOfSupport=support-worker')).tools).toEqual([])
    expect(filtersFromURL(new URLSearchParams('tools=ladder,vacuum-cleaner&typeOfSupport=home-yard-maintenance')).tools).toEqual(['ladder'])
  })

  it("PU4: any set of the service's tools reaches the contract and comes back from the URL as the same set", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOL_SERVICES).chain((service) => fc.tuple(fc.constant(service), fc.uniqueArray(fc.constantFrom(...SERVICE_TOOLS[service].map((t) => t.id)), { minLength: 1, maxLength: 8 }))),
        ([service, tools]) => {
          const f = { ...DEFAULT_FILTERS, typeOfSupport: service, tools: tools as string[] }
          const parsed = workerSearchQuerySchema.parse(Object.fromEntries(new URLSearchParams(canonicalOf(f))))
          expect([...(parsed.tools ?? [])].sort()).toEqual([...tools].sort())
          expect([...filtersFromURL(new URLSearchParams(urlFromFilters(f))).tools].sort()).toEqual([...tools].sort())
        },
      ),
    )
  })
})

describe('the tool search box (tool search TS-5)', () => {
  it('sent only with a type of support that has a list and a kept word; restored from the URL the same way', () => {
    expect(toQuery({ ...DEFAULT_FILTERS, typeOfSupport: 'home-yard-maintenance', toolSearch: '  gurney ' }).toolSearch).toBe('gurney')
    expect(toQuery({ ...DEFAULT_FILTERS, typeOfSupport: 'support-worker', toolSearch: 'gurney' })).not.toHaveProperty('toolSearch')
    expect(toQuery({ ...DEFAULT_FILTERS, toolSearch: 'gurney' })).not.toHaveProperty('toolSearch')
    expect(toQuery({ ...DEFAULT_FILTERS, typeOfSupport: 'cleaning-services', toolSearch: '& a' })).not.toHaveProperty('toolSearch')
    expect(filtersFromURL(new URLSearchParams('toolSearch=gurney&typeOfSupport=home-yard-maintenance')).toolSearch).toBe('gurney')
    expect(filtersFromURL(new URLSearchParams('toolSearch=gurney&typeOfSupport=support-worker')).toolSearch).toBe('')
  })

  it("narrows the buttons to the api's own matches, keeps the ticked ones, and names the other names", () => {
    const v = toolSearchView('home-yard-maintenance', 'gurney', ['ladder'])
    expect(v.tools.map((t) => t.id)).toEqual(['pressure-washer', 'ladder'])
    expect(v.otherNames).toContain('water blaster')
    expect(toolSearchView('home-yard-maintenance', '', []).tools).toHaveLength(15)
    expect(toolSearchView('support-worker', 'gurney', []).tools).toEqual([])
  })

  it("TS-6: the narrowed buttons are exactly the shared matcher's listed tools (plus the ticked ones)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...TOOL_SERVICES), fc.string({ maxLength: 20 }), (service, text) => {
        const m = toolSearchOf(text, [service])
        const shown = toolSearchView(service, text, []).tools.map((t) => t.id)
        expect(shown).toEqual(m ? m.listedIds : SERVICE_TOOLS[service].map((t) => t.id))
      }),
    )
  })
})


describe('the activation tab (worker-activation A2, A3)', () => {
  it('All sends nothing; Active and Inactive send the flag; the URL keeps it', () => {
    expect(toQuery(DEFAULT_FILTERS)).not.toHaveProperty('activation')
    expect(toQuery({ ...DEFAULT_FILTERS, activation: 'inactive' }).activation).toBe('inactive')
    expect(filtersFromURL(new URLSearchParams(urlFromFilters({ ...DEFAULT_FILTERS, activation: 'active' }))).activation).toBe('active')
    expect(filtersFromURL(new URLSearchParams('activation=bogus')).activation).toBe('all')
  })

  it('every request asks for the row flag, and the URL bar never carries it', () => {
    fc.assert(
      fc.property(fc.constantFrom('all' as const, 'active' as const, 'inactive' as const), (activation) => {
        const f = { ...DEFAULT_FILTERS, activation }
        expect(searchRequestOf(f)).toEqual({ ...toQuery(f), withActivation: true })
        expect(urlFromFilters(f)).not.toContain('withActivation')
      }),
    )
  })
})
