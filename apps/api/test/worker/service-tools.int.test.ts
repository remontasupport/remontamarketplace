// worker-tools U1 on PostGIS: a chosen service's tools through the real pipeline and transactions on the seeded worker
// harness (BR-3, BR-7, BR-8, BR-10, BR-15..BR-17, P3), and the admin read of one worker's services (BR-14). Runs only
// when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { adminContract } from '@remonta/api-contract'
import { SERVICE_TOOLS, TOOL_SERVICES } from '@remonta/schemas/data/serviceTools'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { testApp, type TestApp } from '../helpers'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

// The two tool services are fixed catalogue ids. Created here when the database has no catalogue, and then deleted
// again; left alone when the seeded catalogue already has them (as services.int.test.ts does).
const TOOL_CATEGORIES = [
  { id: 'cleaning-services', name: 'Cleaning Services' },
  { id: 'home-yard-maintenance', name: 'Home and Yard Maintenance' },
]

describe.skipIf(!local)('worker-tools U1 on PostGIS', () => {
  let h: WorkerHarness
  let admin: TestApp
  const created: string[] = []
  const as = (user: () => string) => ({ 'x-test-principal': `${user()}:WORKER` })
  const put = (path: string, body: unknown, user = () => h.b.userId) => h.t.fastify.inject({ method: 'PUT', url: path, headers: as(user), payload: body as object })
  const getTools = (user = () => h.b.userId) => h.t.fastify.inject({ method: 'GET', url: '/v1/worker/services/tools', headers: as(user) })
  const care = () => `${h.prefix}care`

  beforeAll(async () => {
    h = await workerHarness('worker-tools.test')
    for (const c of TOOL_CATEGORIES) {
      if (await h.db.category.findUnique({ where: { id: c.id }, select: { id: true } })) continue
      await h.db.category.create({ data: c })
      created.push(c.id)
    }
    admin = await testApp({ contracts: [adminContract], handlerSets: [adminHandlers({ db: h.db, clock: () => new Date() })] })
    const res = await put('/v1/worker/services', { services: [care(), 'cleaning-services', 'home-yard-maintenance'], subcategoryIds: [] })
    expect(res.statusCode, res.body).toBe(200)
  }, 60_000)
  afterAll(async () => {
    await admin?.close()
    if (created.length) await h.db.category.deleteMany({ where: { id: { in: created } } })
    await h.close()
  })

  it('BR-17: the read lists the chosen services that have a list, empty, in the services\' order', async () => {
    const res = await getTools()
    expect(res.statusCode, res.body).toBe(200)
    expect(res.headers['cache-control']).toContain('no-store')
    expect(res.json()).toEqual({
      services: [
        { categoryId: 'cleaning-services', toolIds: [], otherTools: [] },
        { categoryId: 'home-yard-maintenance', toolIds: [], otherTools: [] },
      ],
    })
  })

  it('saves in list order with cleaned own tools; the read shows it; the audit names the section; completion untouched', async () => {
    const before = await h.db.workerProfile.findUnique({ where: { id: h.b.profileId }, select: { profileCompleted: true } })
    const res = await put('/v1/worker/services/cleaning-services/tools', { toolIds: ['mop-and-bucket', 'vacuum-cleaner'], otherTools: [' Pressure  washer', 'pressure washer'] })
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ categoryId: 'cleaning-services', toolIds: ['vacuum-cleaner', 'mop-and-bucket'], otherTools: ['Pressure washer'] })
    expect((await getTools()).json().services[0]).toEqual(res.json())
    const audit = await h.db.auditLog.findFirst({ where: { userId: h.b.userId }, orderBy: { createdAt: 'desc' }, select: { action: true, metadata: true } })
    expect(audit).toMatchObject({ action: 'PROFILE_UPDATE', metadata: { section: 'putServiceTools.cleaning-services', profileId: h.b.profileId } })
    const after = await h.db.workerProfile.findUnique({ where: { id: h.b.profileId }, select: { profileCompleted: true } })
    expect(after).toEqual(before)
  })

  it('refusals: another list\'s tool (400 toolIds), a service with no list (400), a service not chosen (404), another worker\'s row untouched', async () => {
    const foreign = await put('/v1/worker/services/cleaning-services/tools', { toolIds: ['ladder'], otherTools: [] })
    expect(foreign.statusCode).toBe(400)
    expect(foreign.json().error.fields).toHaveProperty('toolIds')
    expect((await put('/v1/worker/services/support-worker/tools', { toolIds: [], otherTools: [] })).statusCode).toBe(400)
    // Worker A has only the harness service.
    const notChosen = await put('/v1/worker/services/home-yard-maintenance/tools', { toolIds: ['ladder'], otherTools: [] }, () => h.a.userId)
    expect(notChosen.statusCode).toBe(404)
    expect(await h.db.workerService.count({ where: { workerProfileId: h.a.profileId, categoryId: 'home-yard-maintenance' } })).toBe(0)
    expect((await getTools()).json().services[0].toolIds).toEqual(['vacuum-cleaner', 'mop-and-bucket'])
  })

  it('P3: any valid save reads back exactly as answered', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...TOOL_SERVICES).chain((s) =>
          fc.record({ s: fc.constant(s), ids: fc.subarray(SERVICE_TOOLS[s].map((t) => t.id) as string[]), others: fc.array(fc.stringMatching(/^[A-Za-z][A-Za-z ]{0,20}$/), { maxLength: 5 }) }),
        ),
        async ({ s, ids, others }) => {
          const res = await put(`/v1/worker/services/${s}/tools`, { toolIds: [...ids].reverse(), otherTools: others })
          expect(res.statusCode, res.body).toBe(200)
          const read = (await getTools()).json().services.find((x: { categoryId: string }) => x.categoryId === s)
          expect(read).toEqual(res.json())
          expect(read.toolIds).toEqual(ids)
        },
      ),
      { numRuns: 15 },
    )
  })

  it('BR-14: the admin read lists every service in order with names and tools; empty for a service with no list; 404 unknown', async () => {
    await put('/v1/worker/services/home-yard-maintenance/tools', { toolIds: ['trailer', 'ladder'], otherTools: ['Hose'] })
    const res = await admin.fastify.inject({ method: 'GET', url: `/v1/admin/workers/${h.b.profileId}/services`, headers: { 'x-test-principal': 'admin_1:ADMIN' } })
    expect(res.statusCode, res.body).toBe(200)
    const services = res.json().services
    expect(services.map((x: { categoryId: string }) => x.categoryId)).toEqual([care(), 'cleaning-services', 'home-yard-maintenance'])
    expect(services[0]).toMatchObject({ toolIds: [], otherTools: [] })
    expect(services[2]).toMatchObject({ categoryName: 'Home and Yard Maintenance', toolIds: ['ladder', 'trailer'], otherTools: ['Hose'] })
    const missing = await admin.fastify.inject({ method: 'GET', url: '/v1/admin/workers/no_such_worker/services', headers: { 'x-test-principal': 'admin_1:ADMIN' } })
    expect(missing.statusCode).toBe(404)
    const asWorker = await admin.fastify.inject({ method: 'GET', url: `/v1/admin/workers/${h.b.profileId}/services`, headers: as(() => h.b.userId) })
    expect(asWorker.statusCode).toBe(403)
  })

  it('BR-10: editing the services keeps a kept service\'s tools; removing it deletes them; re-adding starts empty', async () => {
    const keep = await put('/v1/worker/services', { services: ['cleaning-services', 'home-yard-maintenance'], subcategoryIds: [] })
    expect(keep.statusCode, keep.body).toBe(200)
    expect((await getTools()).json().services[1].toolIds).toEqual(['ladder', 'trailer'])
    await put('/v1/worker/services', { services: ['cleaning-services'], subcategoryIds: [] })
    expect((await getTools()).json().services.map((x: { categoryId: string }) => x.categoryId)).toEqual(['cleaning-services'])
    await put('/v1/worker/services', { services: ['cleaning-services', 'home-yard-maintenance'], subcategoryIds: [] })
    expect((await getTools()).json().services[1]).toEqual({ categoryId: 'home-yard-maintenance', toolIds: [], otherTools: [] })
  })
})
