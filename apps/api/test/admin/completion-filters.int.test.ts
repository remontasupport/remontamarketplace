// admin-completion-filters U1 on PostGIS: the four filters equal a reference model (parseStoredFlags) over random
// stored setupProgress values -- NULL, an empty object, a missing key, false, true and look-alikes ("true", 1) -- and
// `withCompletion` returns the same reading per row. Runs only when TEST_DATABASE_URL points at localhost (CI).
import { adminContract, COMPLETION_FLAGS, type CompletionFlag } from '@remonta/api-contract'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { parseStoredFlags } from '../../src/modules/worker/domain/persist-completion'
import { createDb, Prisma, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const DOMAIN = 'admin-completion.test'
const LAST_NAME = 'Completionharness'
const COUNT = 10

type Stored = null | Record<string, unknown>
const valueArb = fc.constantFrom<unknown>(true, false, 'true', 1, null, undefined)
const storedArb: fc.Arbitrary<Stored> = fc.oneof(
  fc.constant(null),
  fc.record({ accountDetails: valueArb, compliance: valueArb, trainings: valueArb, services: valueArb }).map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined))),
)

describe.skipIf(!local)('the completion filters on PostGIS', () => {
  let db: Db
  let t: TestApp
  const ids: string[] = []

  const cleanup = async () => {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } })
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } })
  }
  const get = async (q: Record<string, string>) => {
    const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/workers?${new URLSearchParams({ search: LAST_NAME, pageSize: '50', ...q })}`, headers: { 'x-test-principal': 'admin_1:ADMIN', 'cache-control': 'no-cache' } })
    expect(res.statusCode, res.body).toBe(200)
    return res.json().data as { id: string; completion?: Record<CompletionFlag, boolean> }[]
  }
  const seed = async (stored: Stored[]) => {
    for (let i = 0; i < COUNT; i++) {
      await db.workerProfile.update({ where: { id: ids[i]! }, data: { setupProgress: stored[i] === null ? Prisma.DbNull : (stored[i] as Prisma.InputJsonValue) } })
    }
  }

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    for (let i = 0; i < COUNT; i++) {
      const u = await db.user.create({
        data: { email: `w${i}@${DOMAIN}`, passwordHash: 'x', role: 'WORKER', status: 'ACTIVE', updatedAt: new Date(), workerProfile: { create: { firstName: `C${i}`, lastName: LAST_NAME, mobile: `04300000${String(i).padStart(2, '0')}`, updatedAt: new Date() } } },
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

  it('each filter, alone and with another, equals the model; the rows carry the same reading', async () => {
    const flagArb = fc.constantFrom(...COMPLETION_FLAGS)
    await fc.assert(
      fc.asyncProperty(fc.array(storedArb, { minLength: COUNT, maxLength: COUNT }), flagArb, flagArb, async (stored, a, b) => {
        await seed(stored)
        const model = stored.map((s) => parseStoredFlags(s))
        const expected = (keep: (i: number) => boolean) => ids.filter((_, i) => keep(i)).sort()
        const found = async (q: Record<string, string>) => (await get(q)).map((r) => r.id).sort()

        expect(await found({ [a]: 'complete' })).toEqual(expected((i) => model[i]![a]))
        expect(await found({ [a]: 'incomplete' })).toEqual(expected((i) => !model[i]![a]))
        if (a !== b) expect(await found({ [a]: 'complete', [b]: 'incomplete' })).toEqual(expected((i) => model[i]![a] && !model[i]![b]))

        for (const row of await get({ withCompletion: 'true' })) expect(row.completion).toEqual(model[ids.indexOf(row.id)])
      }),
      { numRuns: 8 },
    )
  })
})
