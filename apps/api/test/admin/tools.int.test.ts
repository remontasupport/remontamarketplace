// worker-tools U1 on PostGIS, P4 (BR-12): the admin search's tools filter equals a reference model -- a worker matches
// when every queried id is on that worker's row of the id's own service. A dozen workers isolated by an email domain
// and a shared last name (the search's name filter keeps the rest of the database out); their tool rows re-drawn on
// every run. Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { adminContract } from '@remonta/api-contract'
import { SERVICE_TOOLS, TOOL_IDS, TOOL_SERVICES, toolServiceOf, type ToolService } from '@remonta/schemas/data/serviceTools'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const DOMAIN = 'admin-tools.test'
const LAST_NAME = 'Toolsfilterharness'
const COUNT = 12

type Row = Partial<Record<ToolService, string[]>>

describe.skipIf(!local)('worker-tools U1: the admin tools filter on PostGIS', () => {
  let db: Db
  let t: TestApp
  const ids: string[] = []

  const cleanup = async () => {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } })
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } }) // profiles and services cascade
  }
  const search = (q: Record<string, string>) =>
    t.fastify.inject({ method: 'GET', url: `/v1/admin/workers?${new URLSearchParams({ search: LAST_NAME, pageSize: '50', ...q })}`, headers: { 'x-test-principal': 'admin_1:ADMIN', 'cache-control': 'no-cache' } })
  const found = async (q: Record<string, string>) => {
    const res = await search(q)
    expect(res.statusCode, res.body).toBe(200)
    return (res.json().data as { id: string }[]).map((r) => r.id).sort()
  }
  /** Each worker's tool rows replaced: a service row only where the drawn row has that service. */
  const seed = async (rows: Row[]) => {
    await db.workerService.deleteMany({ where: { workerProfileId: { in: ids } } })
    await db.workerService.createMany({
      data: rows.flatMap((r, i) =>
        (Object.entries(r) as [ToolService, string[]][]).map(([categoryId, toolIds]) => ({ workerProfileId: ids[i]!, categoryId, categoryName: categoryId, toolIds })),
      ),
    })
  }
  const model = (rows: Row[], query: string[]) =>
    ids.filter((_, i) => query.every((id) => rows[i]![toolServiceOf(id)!]?.includes(id) ?? false)).sort()

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    for (let i = 0; i < COUNT; i++) {
      const u = await db.user.create({
        data: { email: `w${i}@${DOMAIN}`, passwordHash: 'x', role: 'WORKER', status: 'ACTIVE', updatedAt: new Date(), workerProfile: { create: { firstName: `W${i}`, lastName: LAST_NAME, mobile: `04000000${String(i).padStart(2, '0')}`, updatedAt: new Date() } } },
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

  it('examples: all of the ids, each on its own service; own tools never searched; echoed', async () => {
    await seed([
      { 'cleaning-services': ['vacuum-cleaner'], 'home-yard-maintenance': ['ladder'] },
      { 'cleaning-services': ['vacuum-cleaner'] },
      { 'home-yard-maintenance': ['ladder', 'trailer'] },
      // `ladder` on the wrong service's row never counts.
      { 'cleaning-services': ['ladder'] },
    ])
    await db.workerService.updateMany({ where: { workerProfileId: ids[1]!, categoryId: 'cleaning-services' }, data: { otherTools: ['Ladder'] } })
    expect(await found({ tools: 'ladder,vacuum-cleaner' })).toEqual([ids[0]!])
    expect(await found({ tools: 'ladder' })).toEqual([ids[0]!, ids[2]!].sort())
    expect(await found({})).toHaveLength(COUNT)
    expect((await search({ tools: 'trailer,ladder' })).json().appliedFilters.tools).toEqual(['ladder', 'trailer'])
    expect((await search({})).json().appliedFilters).not.toHaveProperty('tools')
    expect((await search({ tools: 'hammer' })).statusCode).toBe(400)
  })

  it('P4: for random tool rows and a random query, the search equals the model', async () => {
    const row: fc.Arbitrary<Row> = fc.record(
      Object.fromEntries(TOOL_SERVICES.map((s) => [s, fc.subarray(SERVICE_TOOLS[s].map((x) => x.id) as string[], { maxLength: 6 })])) as Record<ToolService, fc.Arbitrary<string[]>>,
      { requiredKeys: [] },
    )
    await fc.assert(
      fc.asyncProperty(fc.array(row, { minLength: COUNT, maxLength: COUNT }), fc.subarray(TOOL_IDS as unknown as string[], { minLength: 1, maxLength: 3 }), async (rows, query) => {
        await seed(rows)
        expect(await found({ tools: query.join(',') })).toEqual(model(rows, query))
      }),
      { numRuns: 25 },
    )
  })

  it('combines with another filter (AND)', async () => {
    await seed([{ 'home-yard-maintenance': ['ladder'] }, { 'home-yard-maintenance': ['ladder'] }])
    await db.workerProfile.update({ where: { id: ids[1]! }, data: { gender: 'Female' } })
    expect(await found({ tools: 'ladder', gender: 'Female' })).toEqual([ids[1]!])
  })
})
