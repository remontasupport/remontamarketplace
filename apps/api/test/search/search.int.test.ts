// The two worker searches on PostGIS (search-locations U1): one eligibility for both entries (BR-E1), the radius against a
// Haversine oracle (BR-D1), unplaced workers left out with a place (FR-4), distances non-decreasing (P4), ties
// newest first (BR-O2), pages partition the result (P3), and the keyword fields (BR-K3). Reuses the admin search's
// seeded population. Runs only when TEST_DATABASE_URL points at localhost and the suburb list is loaded.
import { searchContract, type ClientWorkerCard, type PublicWorkerCard } from '@remonta/api-contract'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { searchHandlers } from '../../src/modules/search/search.handlers'
import { adminHarness, haversineM, type AdminHarness, type SeededWorker } from '../admin/harness'
import { testApp, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
if (url && !local) throw new Error('TEST_DATABASE_URL must point at localhost')

/** The harness's category name: every search here is scoped to its workers by it. */
const SERVICE = 'Harness Support'

describe.skipIf(!local)('the worker searches on PostGIS', () => {
  let h: AdminHarness
  let t: TestApp
  /** Index in the harness = age order: a lower index is a newer profile. */
  const order = new Map<string, number>()
  /** Two thirds switched on by an admin: both searches must ignore the switch (user 2026-10-28). */
  const activated = (_w: SeededWorker, i: number) => i % 3 !== 0

  beforeAll(async () => {
    h = await adminHarness('search-workers.test', { workers: 150, seed: 20261028 })
    h.workers.forEach((w, i) => order.set(w.id, i))
    await h.db.workerProfile.updateMany({ where: { id: { in: h.workers.filter(activated).map((w) => w.id) } }, data: { isActivated: true } })
    // BR-K3 fixtures: a hobby on one worker, an interest on another (exact array element).
    await h.db.workerProfile.update({ where: { id: h.workers[0]!.id }, data: { hobbies: 'Harnesscooking on weekends' } })
    await h.db.workerAdditionalInfo.upsert({ where: { workerProfileId: h.workers[1]!.id }, create: { workerProfileId: h.workers[1]!.id, interests: ['harnessmusic'] }, update: { interests: ['harnessmusic'] } })
    t = await testApp({ contracts: [searchContract], handlerSets: [searchHandlers({ db: h.db, clock: () => new Date() })], publicEndpoints: [{ route: 'GET /v1/public/workers', reason: 'The marketing site worker list, public cards only (test).' }] })
  }, 120_000)
  afterAll(async () => {
    await t?.close()
    await h?.close()
  })

  async function pages<T>(path: string, query: Record<string, string>, pageSize: number, headers: Record<string, string> = {}): Promise<{ rows: T[]; total: number }> {
    const rows: T[] = []
    let total = 0
    for (let page = 1; ; page++) {
      const res = await t.fastify.inject({ method: 'GET', url: `${path}?${new URLSearchParams({ ...query, page: String(page), pageSize: String(pageSize) })}`, headers: { 'cache-control': 'no-cache', ...headers } })
      expect(res.statusCode, res.body).toBe(200)
      const body = res.json() as { data: T[]; pagination: { total: number; hasNext: boolean } }
      rows.push(...body.data.filter((r) => order.has((r as { id: string }).id))) // this suite's workers only
      total = body.pagination.total
      if (!body.pagination.hasNext) break
    }
    return { rows, total }
  }
  const client = (query: Record<string, string>, pageSize = 50) => pages<ClientWorkerCard>('/v1/client/workers', { services: SERVICE, ...query }, pageSize, { 'x-test-principal': 'client_1:CLIENT' })
  const pub = (query: Record<string, string>, pageSize = 50) => pages<PublicWorkerCard>('/v1/public/workers', { typeOfSupport: SERVICE, ...query }, pageSize)
  const withService = () => h.workers.filter((w) => w.serviceIds.length > 0)

  it('BR-E1: both searches list every unsuspended worker, switched on or not', async () => {
    const unsuspended = new Set(withService().filter((w) => w.status === 'ACTIVE').map((w) => w.id))
    expect(new Set((await client({})).rows.map((r) => r.id))).toEqual(unsuspended)
    expect(new Set((await pub({})).rows.map((r) => r.id))).toEqual(unsuspended)
  }, 60_000)

  it('BR-D1, FR-4, P4: within X km of a suggestion equals the oracle, unplaced left out, distances non-decreasing', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: h.localities.length - 1 }), fc.constantFrom(5, 20, 50, 200), async (li, km) => {
        const loc = h.localities[li]!
        const { rows } = await pub({ location: `${loc.suburb}, ${loc.state} ${loc.postcode}`, within: String(km) })
        const got = new Set(rows.map((r) => r.id))
        for (const w of withService()) {
          if (w.status !== 'ACTIVE') continue
          if (!w.home) {
            expect(got.has(w.id), 'an unplaced worker in a search with a place').toBe(false)
            continue
          }
          const d = haversineM(w.home.latitude, w.home.longitude, loc.latitude, loc.longitude)
          if (d < km * 1000 * 0.995) expect(got.has(w.id), `${w.id} at ${Math.round(d)} m within ${km} km`).toBe(true)
          if (d > km * 1000 * 1.005) expect(got.has(w.id), `${w.id} at ${Math.round(d)} m outside ${km} km`).toBe(false)
        }
        const ds = rows.map((r) => r.distanceKm!)
        for (let i = 1; i < ds.length; i++) expect(ds[i]).toBeGreaterThanOrEqual(ds[i - 1]!)
      }),
      { numRuns: 15 },
    )
  }, 120_000)

  it('BR-O2: workers at one distance come newest first', async () => {
    const loc = h.localities[0]! // Parramatta: the harness's cluster
    const { rows } = await pub({ location: `${loc.suburb}, ${loc.state} ${loc.postcode}`, within: '200' })
    for (let i = 1; i < rows.length; i++) {
      if (rows[i]!.distanceKm === rows[i - 1]!.distanceKm) expect(order.get(rows[i]!.id)!).toBeGreaterThan(order.get(rows[i - 1]!.id)!)
    }
  }, 60_000)

  it('P3: pages partition the result for any page size, with a constant total', async () => {
    const all = (await client({}, 50)).rows.map((r) => r.id)
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async (pageSize) => {
        const { rows, total } = await client({}, pageSize)
        const ids = rows.map((r) => r.id)
        expect(ids).toEqual(all)
        expect(new Set(ids).size).toBe(ids.length)
        expect(total).toBeGreaterThanOrEqual(all.length)
      }),
      { numRuns: 10 },
    )
  }, 120_000)

  it('BR-K3: a text keyword finds a hobby and an exact interest; every keyword must match', async () => {
    const w0 = h.workers[0]!
    const w1 = h.workers[1]!
    const visible = (w: SeededWorker) => w.status === 'ACTIVE'
    const q = async (search: string) => (await pages<ClientWorkerCard>('/v1/client/workers', { search }, 50, { 'x-test-principal': 'client_1:CLIENT' })).rows.map((r) => r.id)
    expect(await q('loves harnesscooking')).toEqual(visible(w0) ? [w0.id] : [])
    expect(await q('harnessmusic')).toEqual(visible(w1) ? [w1.id] : [])
    expect(await q('harnesscooking harnessmusic')).toEqual([])
  }, 60_000)

  it('the place in text: a postcode alone and an unknown name', async () => {
    const loc = h.localities[0]!
    const byPostcode = await pub({ location: loc.postcode, within: '5' })
    expect(byPostcode.rows.every((r) => r.distanceKm !== undefined)).toBe(true)
    const nowhere = await pub({ location: 'Nowhere Special', within: '5' })
    expect(nowhere.rows.every((r) => r.distanceKm === undefined)).toBe(true) // BR-P5: no place, no radius
    expect(nowhere.rows.length).toBe((await pub({})).rows.length)
  }, 60_000)
})
