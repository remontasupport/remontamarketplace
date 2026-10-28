// The two searches without a database (search-locations U1): how each entry's query fills the one spec (BR-E3,
// BR-K5, BR-P5, BR-S1), the cards (E4, E5), and the statement's shape (BR-D1, BR-O1/O2).
import { clientWorkerQuerySchema, publicWorkerQuerySchema } from '@remonta/api-contract'
import { describe, expect, it } from 'vitest'
import type { PlaceLookup } from '../../src/modules/locations/domain/place'
import { clientCardOf, publicCardOf, searchForClient, searchPublic, type SearchDeps, type SearchNotes } from '../../src/modules/search/application/search-workers'
import { containsPattern, searchStatement, type RawSearchRow, type SearchSpec } from '../../src/modules/search/persistence/worker-search-sql'

const parramatta = { id: 1, searchName: 'parramatta', state: 'NSW', postcode: '2150', latitude: -33.81, longitude: 151.0 }
const places: PlaceLookup = {
  byPostcode: async (pc) => (pc === '2150' ? [parramatta] : []),
  byName: async (name) => (name === 'parramatta' ? [parramatta] : []),
}

function harness(over: Partial<SearchDeps> = {}) {
  const specs: SearchSpec[] = []
  const deps: SearchDeps = {
    db: {} as never,
    places,
    serviceTerms: async () => new Set(['nursing services']),
    run: async (_db, spec) => {
      specs.push(spec)
      return { rows: [], total: 0 }
    },
    ...over,
  }
  const notes = (): SearchNotes => ({ place: 'none', keywordNamesFailed: false })
  return { deps, specs, notes }
}

const row = (over: Partial<RawSearchRow> = {}): RawSearchRow => ({
  id: 'w1',
  firstName: 'Ann',
  lastName: 'Lee',
  photos: null,
  introduction: null,
  city: null,
  state: null,
  services: null,
  approved: false,
  distance_m: null,
  total: 1,
  ...over,
})

describe('the client search fills the spec', () => {
  it('BR-E3: the default listing needs an introduction; any search, place or service lifts it', async () => {
    const h = harness()
    for (const q of [{}, { search: 'cooking' }, { location: 'Nowhere at all' }, { services: 'Support Worker' }]) {
      await searchForClient(h.deps, clientWorkerQuerySchema.parse(q), h.notes())
    }
    expect(h.specs.map((s) => s.introductionRequired)).toEqual([true, false, false, false])
  })

  it('classifies keywords with the service names', async () => {
    const h = harness()
    await searchForClient(h.deps, clientWorkerQuerySchema.parse({ search: 'loves nursing and cooking' }), h.notes())
    expect(h.specs[0]!.keywords).toEqual([
      { token: 'nursing', kind: 'service' },
      { token: 'cooking', kind: 'text' },
    ])
  })

  it('BR-K5: names that cannot be read make every token text, and say so', async () => {
    const h = harness({ serviceTerms: async () => Promise.reject(new Error('db down')) })
    const n = h.notes()
    await searchForClient(h.deps, clientWorkerQuerySchema.parse({ search: 'nursing' }), n)
    expect(h.specs[0]!.keywords).toEqual([{ token: 'nursing', kind: 'text' }])
    expect(n.keywordNamesFailed).toBe(true)
  })

  it('the place and the radius: a suggestion is placed; unknown text and a failed lookup search without a place (BR-P5)', async () => {
    const h = harness()
    const placed = h.notes()
    await searchForClient(h.deps, clientWorkerQuerySchema.parse({ location: 'Parramatta, NSW 2150', within: '20' }), placed)
    expect(h.specs[0]!.place).toEqual({ lat: -33.81, lng: 151.0, via: 'suburb' })
    expect(h.specs[0]!.withinKm).toBe(20)
    expect(placed.place).toBe('suburb')

    const unmatched = h.notes()
    await searchForClient(h.deps, clientWorkerQuerySchema.parse({ location: 'Gold Coast' }), unmatched)
    expect(h.specs[1]!.place).toBeNull()
    expect(unmatched.place).toBe('unmatched')

    const broken = harness({ places: { byPostcode: () => Promise.reject(new Error('x')), byName: () => Promise.reject(new Error('x')) } })
    const failed = broken.notes()
    await searchForClient(broken.deps, clientWorkerQuerySchema.parse({ location: 'Parramatta, NSW 2150' }), failed)
    expect(broken.specs[0]!.place).toBeNull()
    expect(failed.place).toBe('failed')
  })
})

describe('the public search fills the spec', () => {
  it('maps the slug to its category, ignores `all`, takes an unknown slug as a name (BR-S1)', async () => {
    const h = harness()
    for (const typeOfSupport of ['support-worker', 'all', 'Nursing Services']) await searchPublic(h.deps, publicWorkerQuerySchema.parse({ typeOfSupport }), h.notes())
    expect(h.specs.map((s) => s.services)).toEqual([['Support Worker'], [], ['Nursing Services']])
    expect(h.specs.every((s) => !s.introductionRequired && s.keywords.length === 0)).toBe(true)
  })

  it('the envelope: success, data, pagination', async () => {
    const h = harness({ run: async () => ({ rows: [row()], total: 25 }) })
    const body = await searchPublic(h.deps, publicWorkerQuerySchema.parse({ page: '2' }), h.notes())
    expect(body.success).toBe(true)
    expect(body.pagination).toEqual({ total: 25, page: 2, pageSize: 12, totalPages: 3, hasNext: true, hasPrev: true })
  })
})

describe('the cards', () => {
  it('E4: first service as role, skills from the first five, "Suburb, ST" else Australia', () => {
    const services = Array.from({ length: 6 }, (_, i) => ({ name: `S${i}`, subs: [`a${i}`, 'shared'] }))
    expect(clientCardOf(row({ services, city: 'Parramatta', state: 'NSW', approved: true, photos: '' }))).toEqual({
      id: 'w1',
      firstName: 'Ann',
      lastName: 'Lee',
      photo: null,
      role: 'S0',
      bio: '',
      skills: ['a0', 'shared', 'a1', 'a2', 'a3', 'a4'],
      location: 'Parramatta, NSW',
      isNdisCompliant: true,
    })
    expect(clientCardOf(row())).toMatchObject({ role: 'Support Worker', location: 'Australia', isNdisCompliant: false })
  })

  it('E5: distinct service names; the distance only with a place, to one decimal', () => {
    const r = row({ services: [{ name: 'A', subs: [] }, { name: 'A', subs: [] }], distance_m: 12_345 })
    expect(publicCardOf(r, true)).toMatchObject({ services: ['A'], distanceKm: 12.3 })
    expect(publicCardOf(r, false)).not.toHaveProperty('distanceKm')
  })
})

describe('the statement', () => {
  const spec = (over: Partial<SearchSpec> = {}): SearchSpec => ({ introductionRequired: false, keywords: [], services: [], place: null, withinKm: 50, page: 1, pageSize: 20, ...over })
  const text = (s: { sql: string }) => s.sql.replace(/\s+/g, ' ')

  it('BR-O1: without a place, newest first and no radius', () => {
    const s = text(searchStatement(spec()))
    expect(s).toMatch(/ORDER BY p\."createdAt" DESC, p\.id ASC/)
    expect(s).not.toMatch(/ST_DWithin/)
  })

  it('BR-D1, BR-O2: with a place, within the radius, nearest then newest', () => {
    const s = searchStatement(spec({ place: { lat: -33.8, lng: 151, via: 'suburb' }, withinKm: 20 }))
    expect(text(s)).toMatch(/AND wl\.point IS NOT NULL AND ST_DWithin\(wl\.point, ST_SetSRID\(ST_MakePoint\(/)
    expect(text(s)).toMatch(/ORDER BY distance_m ASC, p\."createdAt" DESC, p\.id ASC/)
    expect(s.values).toContain(20_000)
  })

  it('BR-E1: every unsuspended worker with a name, for both searches; the activation switch is not read', () => {
    const s = text(searchStatement(spec()))
    expect(s).toMatch(/u\.status = 'ACTIVE' AND p\."firstName" <> '' AND p\."lastName" <> ''/)
    expect(s).not.toMatch(/isActivated/)
  })

  it('binds every keyword, wildcards literal', () => {
    const s = searchStatement(spec({ keywords: [{ token: '50%_off', kind: 'text' }] }))
    expect(s.values).toContain('%50\\%\\_off%')
    expect(s.sql).not.toContain('50%')
    expect(containsPattern('a\\b')).toBe('%a\\\\b%')
  })
})
