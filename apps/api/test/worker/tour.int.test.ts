// The dashboard tour's "seen" time on PostGIS (onboarding-tour U1; BR-1, BR-3, BR-5, E1): the real COALESCE update,
// the column, updatedAt left alone and the audit row, through the pipeline on the seeded worker harness. Runs only
// when TEST_DATABASE_URL points at localhost (CI's API Quality job). The pipeline half is tour.test.ts.
import fc from 'fast-check'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

describe.skipIf(!local)('the tour entries on PostGIS', () => {
  let h: WorkerHarness
  const as = (userId: string) => ({ 'x-test-principal': `${userId}:WORKER` })
  const read = (userId: string) => h.t.fastify.inject({ method: 'GET', url: '/v1/worker/tour', headers: as(userId) })
  const save = (userId: string) => h.t.fastify.inject({ method: 'PUT', url: '/v1/worker/tour/seen', headers: as(userId) })
  const stored = async (profileId: string) => (await h.db.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { tourSeenAt: true, updatedAt: true } }))

  beforeAll(async () => {
    h = await workerHarness('worker-tour.test')
  }, 60_000)
  afterAll(async () => {
    await h.close()
  })
  beforeEach(async () => {
    await h.db.workerProfile.updateMany({ where: { id: { in: [h.a.profileId, h.b.profileId] } }, data: { tourSeenAt: null } })
  })

  it('a new column, null for every seeded worker: the read answers null', async () => {
    const res = await read(h.a.userId)
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ seenAt: null })
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('the save stores the time, leaves updatedAt alone, and records one PROFILE_UPDATE row with the section (E1, BR-5)', async () => {
    const before = await stored(h.a.profileId)
    const since = new Date()
    const res = await save(h.a.userId)
    expect(res.statusCode, res.body).toBe(200)
    const after = await stored(h.a.profileId)
    expect(after.tourSeenAt).not.toBeNull()
    expect(res.json()).toEqual({ seenAt: after.tourSeenAt!.toISOString() })
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime())
    const audits = await h.db.auditLog.findMany({ where: { userId: h.a.userId, createdAt: { gte: since }, action: 'PROFILE_UPDATE' }, select: { metadata: true } })
    expect(audits.map((a) => (a.metadata as { section?: string }).section)).toEqual(['putTourSeen'])
  })

  it('two saves at once store one time, and both answers carry it (BR-3: one statement)', async () => {
    const [x, y] = await Promise.all([save(h.a.userId), save(h.a.userId)])
    expect([x.statusCode, y.statusCode]).toEqual([200, 200])
    const s = (await stored(h.a.profileId)).tourSeenAt!.toISOString()
    expect(x.json()).toEqual({ seenAt: s })
    expect(y.json()).toEqual({ seenAt: s })
  })

  it('property (P8 U1-1, U1-2): for any sequence of saves by either worker, each keeps its first time and never changes the other', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.constantFrom<'a' | 'b'>('a', 'b'), { minLength: 1, maxLength: 5 }), async (callers) => {
        await h.db.workerProfile.updateMany({ where: { id: { in: [h.a.profileId, h.b.profileId] } }, data: { tourSeenAt: null } })
        const first: Partial<Record<'a' | 'b', string>> = {}
        for (const c of callers) {
          const res = await save(h[c].userId)
          expect(res.statusCode).toBe(200)
          first[c] ??= res.json().seenAt
          expect(res.json()).toEqual({ seenAt: first[c] })
        }
        for (const c of ['a', 'b'] as const) expect((await read(h[c].userId)).json()).toEqual({ seenAt: first[c] ?? null })
      }),
      { numRuns: 10 },
    )
  })

  it('a WORKER account without a profile row is 404 on both entries, and nothing is written (BR-1)', async () => {
    expect((await read(h.orphan.userId)).statusCode).toBe(404)
    expect((await save(h.orphan.userId)).statusCode).toBe(404)
  })
})
