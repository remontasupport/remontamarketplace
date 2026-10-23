// The admin search's nurse type on PostGIS (2026-10-23): the filter equals a reference model over random answers -- a
// worker matches when their nursing-services row's metadata says that type; no answer, no row, or the answer on another
// service's row never matches. Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { adminContract } from '@remonta/api-contract'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const DOMAIN = 'admin-nursing.test'
const LAST_NAME = 'Nursingharness'
const COUNT = 10

/** A worker's drawn state: no nursing row, a row without an answer, or a row with one; and a decoy on another row. */
type Drawn = { row: 'none' | 'unanswered' | 'registered' | 'enrolled'; decoy: boolean }

describe.skipIf(!local)('the nurse type filter on PostGIS', () => {
  let db: Db
  let t: TestApp
  const ids: string[] = []

  const cleanup = async () => {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } })
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } })
  }
  const found = async (q: Record<string, string>) => {
    const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/workers?${new URLSearchParams({ search: LAST_NAME, pageSize: '50', ...q })}`, headers: { 'x-test-principal': 'admin_1:ADMIN', 'cache-control': 'no-cache' } })
    expect(res.statusCode, res.body).toBe(200)
    return (res.json().data as { id: string }[]).map((r) => r.id).sort()
  }
  const seed = async (drawn: Drawn[]) => {
    await db.workerService.deleteMany({ where: { workerProfileId: { in: ids } } })
    await db.workerService.createMany({
      data: drawn.flatMap((d, i) => [
        ...(d.row === 'none' ? [] : [{ workerProfileId: ids[i]!, categoryId: 'nursing-services', categoryName: 'Nursing Services', metadata: d.row === 'unanswered' ? {} : { nursingType: d.row } }]),
        // The same answer on another service's row must never count.
        ...(d.decoy ? [{ workerProfileId: ids[i]!, categoryId: 'support-worker', categoryName: 'Support Worker', metadata: { nursingType: 'registered' } }] : []),
      ]),
    })
  }

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    for (let i = 0; i < COUNT; i++) {
      const u = await db.user.create({
        data: { email: `w${i}@${DOMAIN}`, passwordHash: 'x', role: 'WORKER', status: 'ACTIVE', updatedAt: new Date(), workerProfile: { create: { firstName: `N${i}`, lastName: LAST_NAME, mobile: `04200000${String(i).padStart(2, '0')}`, updatedAt: new Date() } } },
        select: { workerProfile: { select: { id: true } } },
      })
      ids.push(u.workerProfile!.id)
    }
    t = await testApp({ contracts: [adminContract], handlerSets: [adminHandlers({ db, clock: () => new Date() })] })
  }, 60_000)
  afterAll(async () => {
    await t?.close()
    if (db) {
      await cleanup()
      await db.$disconnect()
    }
  })

  it('equals the model for random answers', async () => {
    const drawnArb = fc.array(fc.record({ row: fc.constantFrom('none' as const, 'unanswered' as const, 'registered' as const, 'enrolled' as const), decoy: fc.boolean() }), { minLength: COUNT, maxLength: COUNT })
    await fc.assert(
      fc.asyncProperty(drawnArb, async (drawn) => {
        await seed(drawn)
        for (const type of ['registered', 'enrolled'] as const) {
          expect(await found({ typeOfSupport: 'nursing-services', nursingType: type })).toEqual(ids.filter((_, i) => drawn[i]!.row === type).sort())
        }
      }),
      { numRuns: 8 },
    )
  })

  it('400 without Nursing Services as the type of support', async () => {
    const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/workers?nursingType=registered`, headers: { 'x-test-principal': 'admin_1:ADMIN' } })
    expect(res.statusCode).toBe(400)
  })
})
