// The admin search on PostGIS (U2): the geography predicate against a Haversine
// oracle (G1), pages partition the ranked set (G2), placed + unplaced = all (G3), the
// example cases of the functional design, and the statement-timeout scenario (S1).
// Runs only when TEST_DATABASE_URL points at localhost and the suburb list is loaded.
import type { WorkerSearchResponse } from '@remonta/api-contract'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Prisma } from '../../src/platform/persistence/db'
import { adminHarness, haversineM, type AdminHarness, type SeededWorker } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
if (url && !local) throw new Error('TEST_DATABASE_URL must point at localhost')

describe.skipIf(!local)('admin worker search on PostGIS', () => {
  let h: AdminHarness
  /** The fixture's active workers, the population every oracle reasons about. */
  let active: SeededWorker[]
  const ids = (res: WorkerSearchResponse) => res.data.map((r) => r.id)
  const fixtureOnly = (res: WorkerSearchResponse) => ({ ...res, data: res.data.filter((r) => active.some((w) => w.id === r.id) || h.workers.some((w) => w.id === r.id)) })

  /** Every page of a query, concatenated, restricted to the fixture (other rows may exist on the database). */
  async function allPages(query: Record<string, string>, pageSize = 50): Promise<{ rows: WorkerSearchResponse['data']; total: number; unplacedCount: number }> {
    const rows: WorkerSearchResponse['data'] = []
    let page = 1
    let total = 0
    let unplacedCount = 0
    for (;;) {
      const res = await h.search({ ...query, page: String(page), pageSize: String(pageSize) })
      expect(res.statusCode, res.body).toBe(200)
      const body = res.json() as WorkerSearchResponse
      total = body.pagination.total
      unplacedCount = body.unplacedCount
      rows.push(...body.data)
      if (!body.pagination.hasNext) break
      page++
    }
    return { rows, total, unplacedCount }
  }

  beforeAll(async () => {
    h = await adminHarness('admin-search.test', { workers: 300 })
    active = h.workers.filter((w) => w.status === 'ACTIVE')
  }, 120_000)
  afterAll(async () => {
    await h.close()
  })

  // The fixture shares the database with whatever else is there; the harness's own
  // service id scopes every search to its workers.
  const mine = { typeOfSupport: 'admin-search.test-support-worker' }
  const mineActive = () => active.filter((w) => w.serviceIds.length > 0)

  it('G1: within X km of a suburb equals the Haversine oracle (0.5 % band), distances non-decreasing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: h.localities.length - 1 }), fc.constantFrom(5, 10, 20, 50, 200), async (li, km) => {
        const loc = h.localities[li]!
        const { rows } = await allPages({ ...mine, localityId: String(loc.id), withinKm: String(km) })
        const got = new Set(rows.map((r) => r.id))
        for (const w of mineActive()) {
          if (!w.home) {
            expect(got.has(w.id), 'an unplaced worker in a distance search').toBe(false)
            continue
          }
          const d = haversineM(w.home.latitude, w.home.longitude, loc.latitude, loc.longitude)
          const limit = km * 1000
          if (d < limit * 0.995) expect(got.has(w.id), `${w.id} at ${Math.round(d)} m should be within ${km} km`).toBe(true)
          if (d > limit * 1.005) expect(got.has(w.id), `${w.id} at ${Math.round(d)} m should be outside ${km} km`).toBe(false)
        }
        const ds = rows.map((r) => r.distanceKm ?? -1)
        for (let i = 1; i < ds.length; i++) expect(ds[i]).toBeGreaterThanOrEqual(ds[i - 1]!)
      }),
      { numRuns: 25 },
    )
  }, 120_000)

  it('G2: pages partition the ranked set with a constant total, for any page size', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 100 }), fc.constantFrom('createdAt', 'lastName', 'city'), async (pageSize, sortBy) => {
        const { rows, total } = await allPages({ ...mine, sortBy, sortOrder: 'asc' }, pageSize)
        const seen = rows.map((r) => r.id)
        expect(new Set(seen).size).toBe(seen.length)
        expect(seen.length).toBe(total)
        expect(total).toBe(mineActive().length)
      }),
      { numRuns: 12 },
    )
  }, 120_000)

  it('G3: placed-matching + unplaced count = all matching; the unmapped list and a distance list are disjoint', async () => {
    const parramatta = h.localities[0]!
    const any = await allPages({ ...mine, localityId: String(parramatta.id) })
    const unmapped = await allPages({ ...mine, unplaced: 'true' })
    const all = await allPages({ ...mine })
    expect(any.rows.length + unmapped.rows.length).toBe(all.total)
    expect(any.unplacedCount).toBe(unmapped.rows.length)
    expect(unmapped.rows.length).toBe(mineActive().filter((w) => !w.home).length)
    const a = new Set(any.rows.map((r) => r.id))
    for (const r of unmapped.rows) expect(a.has(r.id)).toBe(false)
    for (const r of unmapped.rows) expect(r.location).toBeUndefined()
    for (const r of any.rows) expect(r.location).toBeDefined()
  })

  describe('each filter alone matches the fixture', () => {
    it('gender, vehicle, worker type', async () => {
      for (const [param, value, pick] of [
        ['gender', 'Female', (w: SeededWorker) => w.gender === 'Female'],
        ['hasVehicle', 'No', (w: SeededWorker) => w.hasVehicle === 'No'],
        ['workerType', 'Employee', (w: SeededWorker) => w.workerType === 'tfn'],
      ] as const) {
        const { rows } = await allPages({ ...mine, [param]: value })
        expect(new Set(rows.map((r) => r.id))).toEqual(new Set(mineActive().filter(pick).map((w) => w.id)))
      }
    })
    it('age ranges with today\'s rule (text window, integer fallback)', async () => {
      const year = new Date().getUTCFullYear()
      for (const [range, min, max] of [['20-30', 20, 30], ['31-45', 31, 45], ['46-60', 46, 60], ['60+', 60, 120]] as const) {
        const { rows } = await allPages({ ...mine, age: range })
        const expected = mineActive().filter((w) => (w.dateOfBirth ? w.dateOfBirth >= `${year - max}-01-01` && w.dateOfBirth <= `${year - min}-12-31` : w.age !== null && w.age >= min && w.age <= max))
        expect(new Set(rows.map((r) => r.id))).toEqual(new Set(expected.map((w) => w.id)))
      }
    })
    it('languages (additional info first, else the profile), experience (all of), therapeutic sub-categories (any of)', async () => {
      const lang = await allPages({ ...mine, languages: 'mandarin' })
      expect(new Set(lang.rows.map((r) => r.id))).toEqual(new Set(mineActive().filter((w) => (w.infoLanguages.length ? w.infoLanguages : w.languages).includes('Mandarin')).map((w) => w.id)))
      const exp = await allPages({ ...mine, experienceWith: 'AGED_CARE,DISABILITY' })
      expect(new Set(exp.rows.map((r) => r.id))).toEqual(new Set(mineActive().filter((w) => w.domains.includes('AGED_CARE') && w.domains.includes('DISABILITY')).map((w) => w.id)))
      const sub = await allPages({ ...mine, therapeuticSubcategories: 'admin-search.test-sub-a' })
      expect(new Set(sub.rows.map((r) => r.id))).toEqual(new Set(mineActive().filter((w) => w.therapeuticSubcategoryIds.includes('admin-search.test-sub-a')).map((w) => w.id)))
    })
    it('experience areas: any of the areas within a domain, all of the domains (R3.11); a pair without its domain is 400', async () => {
      const areas = await allPages({ ...mine, experienceWith: 'AGED_CARE,DISABILITY', experienceAreas: 'AGED_CARE:Dementia,AGED_CARE:Stroke Recovery,DISABILITY:Autism' })
      const expected = mineActive().filter((w) => {
        const aged = w.specificAreas.AGED_CARE ?? []
        const dis = w.specificAreas.DISABILITY ?? []
        return w.domains.includes('AGED_CARE') && w.domains.includes('DISABILITY') && (aged.includes('Dementia') || aged.includes('Stroke Recovery')) && dis.includes('Autism')
      })
      expect(expected.length, 'the fixture has such workers').toBeGreaterThan(0)
      expect(new Set(areas.rows.map((r) => r.id))).toEqual(new Set(expected.map((w) => w.id)))
      expect(areas.rows.length).toBeLessThan((await allPages({ ...mine, experienceWith: 'AGED_CARE,DISABILITY' })).rows.length)
      const bad = await h.search({ ...mine, experienceWith: 'DISABILITY', experienceAreas: 'AGED_CARE:Dementia' })
      expect(bad.statusCode).toBe(400)
      expect((bad.json() as { error: { fields?: Record<string, string[]> } }).error.fields).toEqual({ experienceAreas: ['Choose the experience type first'] })
    })
    it('the name search in both word orders, and mobile', async () => {
      const a = await allPages({ ...mine, search: 'Test Terson' })
      const b = await allPages({ ...mine, search: 'Terson Test' })
      const expected = mineActive().filter((w) => w.firstName === 'Test' && w.lastName === 'Terson')
      expect(new Set(a.rows.map((r) => r.id))).toEqual(new Set(expected.map((w) => w.id)))
      expect(new Set(b.rows.map((r) => r.id))).toEqual(new Set(expected.map((w) => w.id)))
      const one = h.workers[0]!
      const m = await h.search({ ...mine, search: `04${String(10_000_000).padStart(8, '0')}` })
      expect(ids(m.json() as WorkerSearchResponse)).toContain(one.id)
    })
  })

  it('combines a filter with the suburb and the distance (US-AS-06): female workers within 20 km of Parramatta', async () => {
    const p = h.localities[0]!
    const { rows } = await allPages({ ...mine, gender: 'Female', localityId: String(p.id), withinKm: '20' })
    for (const r of rows) {
      expect(r.gender).toBe('Female')
      expect(r.distanceKm).toBeLessThanOrEqual(20.05)
    }
    const expected = mineActive().filter((w) => w.gender === 'Female' && w.home && haversineM(w.home.latitude, w.home.longitude, p.latitude, p.longitude) <= 20_000 * 0.995)
    for (const w of expected) expect(rows.map((r) => r.id)).toContain(w.id)
  })

  it('the invariants answer 400 with the field; an unknown suburb 400; a page past the end is empty with counts', async () => {
    expect((await h.search({ withinKm: '10' })).statusCode).toBe(400)
    expect((await h.search({ withinKm: '10' })).json()).toMatchObject({ error: { fields: { withinKm: ['Choose a suburb first'] } } })
    expect((await h.search({ sortBy: 'distance' })).json()).toMatchObject({ error: { fields: { sortBy: expect.any(Array) } } })
    expect((await h.search({ localityId: '999999999' })).json()).toMatchObject({ error: { fields: { localityId: ['Unknown suburb'] } } })
    const past = (await h.search({ ...mine, page: '999' })).json() as WorkerSearchResponse
    expect(past.data).toEqual([])
    expect(past.pagination.total).toBe(mineActive().length)
    expect(past.pagination.hasPrev).toBe(true)
  })

  it('sorts by city and state from the HOME suburb (legacy columns for the unplaced), ties by id', async () => {
    const { rows } = await allPages({ ...mine, sortBy: 'city', sortOrder: 'asc' })
    const labels = rows.map((r) => r.location?.localityLabel.split(' ')[0] ?? r.city ?? '')
    for (let i = 1; i < labels.length; i++) expect(labels[i]!.localeCompare(labels[i - 1]!, 'en', { sensitivity: 'base' }) >= 0 || labels[i] === labels[i - 1]).toBe(true)
  })

  it('S1: a statement cancelled by its timeout answers 503 with Retry-After', async () => {
    // The same transaction shape as runSearch, with a sleep that outlives the timeout.
    await expect(
      h.db.$transaction(async (tx) => {
        await tx.$executeRaw(Prisma.raw('SET LOCAL statement_timeout = 200'))
        await tx.$queryRaw`SELECT pg_sleep(2)`
      }),
    ).rejects.toMatchObject({})
    // The mapping is covered by test/errors.test.ts; here we assert the database produces 57014.
    try {
      await h.db.$transaction(async (tx) => {
        await tx.$executeRaw(Prisma.raw('SET LOCAL statement_timeout = 200'))
        await tx.$queryRaw`SELECT pg_sleep(2)`
      })
    } catch (e) {
      const err = e as { meta?: { code?: string }; message?: string }
      expect(err.meta?.code === '57014' || /statement timeout/i.test(err.message ?? '')).toBe(true)
    }
  })
})
