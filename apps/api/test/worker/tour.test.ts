// The dashboard tour's "seen" time (onboarding-tour U1) through the real pipeline, on an in-memory stand-in for the
// two statements it runs (the ownership lookup and the COALESCE update) and the audit row: access (BR-1, BR-2), the
// no-store read (BR-7), no body (BR-4), the first time kept (BR-3), the audit section (BR-5), impersonation (BR-10).
// The database-backed half, the same rules on PostGIS, is tour.int.test.ts.
import { contracts, platformContract, tourViewSchema, workerContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import fc from 'fast-check'
import { afterEach, describe, expect, it } from 'vitest'
import { platformHandlers } from '../../src/modules/platform/platform.handlers'
import { TOUR_NOT_WHILE_IMPERSONATING } from '../../src/modules/worker/application/sections/tour'
import { workerHandlers } from '../../src/modules/worker/worker.handlers'
import type { Db } from '../../src/platform/persistence/db'
import { testApp, unreachableHandlers, workerToken, type TestApp } from '../helpers'

interface Row {
  id: string
  userId: string
  tourSeenAt: Date | null
}

/** Just enough of Prisma for readTransaction, replaceSection, markTourSeen and the audit recorder. */
function fakeDb(rows: Row[]) {
  const audits: { action: string; userId: string | null; metadata: Record<string, unknown> }[] = []
  let writes = 0
  const tx = {
    $executeRaw: async () => 0,
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.join('?')
      if (sql.includes('FROM worker_profiles WHERE "userId"')) {
        const r = rows.find((x) => x.userId === values[1])
        return r ? [{ timeout: '5000', id: r.id, userId: r.userId }] : []
      }
      if (sql.includes('UPDATE worker_profiles SET "tourSeenAt" = COALESCE("tourSeenAt",')) {
        writes++
        const r = rows.find((x) => x.id === values[1])
        if (!r) return []
        r.tourSeenAt ??= values[0] as Date
        return [{ tourSeenAt: r.tourSeenAt }]
      }
      throw new Error(`unexpected statement: ${sql}`)
    },
    workerProfile: {
      findUnique: async ({ where }: { where: { userId: string } }) => {
        const r = rows.find((x) => x.userId === where.userId)
        return r ? { tourSeenAt: r.tourSeenAt } : null
      },
    },
    auditLog: { create: async ({ data }: { data: (typeof audits)[number] }) => void audits.push(data) },
  }
  const db = { $transaction: async (work: (t: typeof tx) => Promise<unknown>) => work(tx) } as unknown as Db
  return { db, audits, writes: () => writes }
}

let t: TestApp | undefined
afterEach(async () => {
  await t?.close()
  t = undefined
})

async function app(rows: Row[], clock: () => Date = () => new Date('2026-10-21T01:00:00.000Z')) {
  const f = fakeDb(rows)
  t = await testApp({
    contracts,
    handlerSets: [
      platformHandlers({ db: f.db, clock, lastSuccessAt: () => Date.now() }),
      workerHandlers({ db: f.db, clock }),
      ...contracts.filter((c) => c !== platformContract && c !== workerContract).map(unreachableHandlers),
    ],
    publicEndpoints: publicEndpoints as PublicEndpoint[],
  })
  return f
}

const read = (headers: Record<string, string> = {}) => t!.fastify.inject({ method: 'GET', url: '/v1/worker/tour', headers })
const save = (headers: Record<string, string> = {}, payload?: object) => t!.fastify.inject({ method: 'PUT', url: '/v1/worker/tour/seen', headers, ...(payload ? { payload } : {}) })

describe('GET /v1/worker/tour', () => {
  it('answers null for a worker who has not seen the tour, never cached (BR-7)', async () => {
    await app([{ id: 'wp_a', userId: 'u_a', tourSeenAt: null }])
    const res = await read(workerToken('u_a'))
    expect(res.statusCode).toBe(200)
    expect(tourViewSchema.parse(res.json())).toEqual({ seenAt: null })
    expect(res.headers['cache-control']).toBe('no-store')
    expect(res.headers['etag']).toBeUndefined()
  })

  it("answers the stored time, and only the caller's own (BR-1)", async () => {
    await app([
      { id: 'wp_a', userId: 'u_a', tourSeenAt: new Date('2026-10-20T03:04:05.000Z') },
      { id: 'wp_b', userId: 'u_b', tourSeenAt: null },
    ])
    expect((await read(workerToken('u_a'))).json()).toEqual({ seenAt: '2026-10-20T03:04:05.000Z' })
    expect((await read(workerToken('u_b'))).json()).toEqual({ seenAt: null })
  })

  it('a worker without a profile row is 404; no token is 401; another role is 403 (BR-1, BR-2)', async () => {
    await app([])
    const orphan = await read(workerToken('u_orphan'))
    expect(orphan.statusCode).toBe(404)
    expect(orphan.json().error.code).toBe('NOT_FOUND')
    expect((await read()).statusCode).toBe(401)
    expect((await read({ 'x-test-principal': 'u_a:ADMIN' })).statusCode).toBe(403)
  })

  it('an impersonating admin may read (reading uses nothing up)', async () => {
    await app([{ id: 'wp_a', userId: 'u_a', tourSeenAt: null }])
    expect((await read({ 'x-test-principal': 'u_a:WORKER:admin_1' })).statusCode).toBe(200)
  })
})

describe('PUT /v1/worker/tour/seen', () => {
  it('stores the api clock, answers it, and records the audit row with the section (BR-4, BR-5)', async () => {
    const rows: Row[] = [{ id: 'wp_a', userId: 'u_a', tourSeenAt: null }]
    const f = await app(rows)
    const res = await save(workerToken('u_a'))
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ seenAt: '2026-10-21T01:00:00.000Z' })
    expect(rows[0]!.tourSeenAt?.toISOString()).toBe('2026-10-21T01:00:00.000Z')
    expect(f.audits).toHaveLength(1)
    expect(f.audits[0]).toMatchObject({ action: 'PROFILE_UPDATE', userId: 'u_a', metadata: { section: 'putTourSeen', profileId: 'wp_a' } })
  })

  it('refuses a body (BR-4)', async () => {
    const f = await app([{ id: 'wp_a', userId: 'u_a', tourSeenAt: null }])
    const res = await save(workerToken('u_a'), { seenAt: '2000-01-01T00:00:00.000Z' })
    expect(res.statusCode).toBe(400)
    expect(f.writes()).toBe(0)
  })

  it('an impersonating admin is 403 with the reason, and nothing is written or audited (BR-10)', async () => {
    const rows: Row[] = [{ id: 'wp_a', userId: 'u_a', tourSeenAt: null }]
    const f = await app(rows)
    const res = await save({ 'x-test-principal': 'u_a:WORKER:admin_1' })
    expect(res.statusCode).toBe(403)
    expect(res.json().error.fields.general).toEqual([TOUR_NOT_WHILE_IMPERSONATING])
    expect(rows[0]!.tourSeenAt).toBeNull()
    expect(f.writes()).toBe(0)
    expect(f.audits).toHaveLength(0)
  })

  it('no token is 401; another role is 403; a worker without a profile row is 404 (BR-1, BR-2)', async () => {
    const f = await app([])
    expect((await save()).statusCode).toBe(401)
    expect((await save({ 'x-test-principal': 'u_a:ADMIN' })).statusCode).toBe(403)
    expect((await save(workerToken('u_orphan'))).statusCode).toBe(404)
    expect(f.writes()).toBe(0)
  })

  it('property (P8 U1-1): any number of saves at any later times keep the first time, and every answer carries it', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.integer({ min: 0, max: 10_000_000 }), { minLength: 1, maxLength: 8 }), async (gaps) => {
        let at = Date.parse('2026-10-21T00:00:00.000Z')
        const times = gaps.map((g) => (at += g))
        let i = 0
        const rows: Row[] = [{ id: 'wp_a', userId: 'u_a', tourSeenAt: null }]
        await app(rows, () => new Date(times[Math.min(i++, times.length - 1)]!))
        const first = new Date(times[0]!).toISOString()
        for (let n = 0; n < times.length; n++) expect((await save(workerToken('u_a'))).json()).toEqual({ seenAt: first })
        expect((await read(workerToken('u_a'))).json()).toEqual({ seenAt: first })
        await t!.close()
        t = undefined
      }),
      { numRuns: 25 },
    )
  })

  it("property (P8 U1-2): one worker's saves never change another's value", async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.constantFrom<string>('u_a', 'u_b'), { minLength: 1, maxLength: 6 }), async (callers) => {
        const rows: Row[] = [
          { id: 'wp_a', userId: 'u_a', tourSeenAt: null },
          { id: 'wp_b', userId: 'u_b', tourSeenAt: null },
        ]
        await app(rows)
        for (const c of callers) await save(workerToken(c))
        for (const r of rows) expect(r.tourSeenAt === null).toBe(!callers.includes(r.userId))
        await t!.close()
        t = undefined
      }),
      { numRuns: 25 },
    )
  })
})
