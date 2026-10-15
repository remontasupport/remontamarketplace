// U3a services on PostGIS (services-inventory.md, D2): the chosen services and their registrations, through the real
// pipeline and transactions on the seeded worker harness. Runs only when TEST_DATABASE_URL points at localhost (CI's
// API Quality job).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

// The two registration services are fixed catalogue ids. Created here when the database has no catalogue, and then
// deleted again; left alone when the seeded catalogue already has them.
const REG_CATEGORIES = [
  { id: 'nursing-services', name: 'Nursing Services' },
  { id: 'therapeutic-supports', name: 'Therapeutic Supports' },
]

describe.skipIf(!local)('U3a services on PostGIS', () => {
  let h: WorkerHarness
  const created: string[] = []
  const nextYear = `${new Date().getUTCFullYear() + 1}-05-31`
  const put = (path: string, body: unknown, user = () => h.b.userId) => h.t.fastify.inject({ method: 'PUT', url: path, headers: { 'x-test-principal': `${user()}:WORKER` }, payload: body as object })
  const profile = async (user = () => h.b.userId) => (await h.get(user())).json()
  const care = () => `${h.prefix}care`
  const sub = () => `${h.prefix}sub`
  const nurse = { categoryId: 'nursing-services', nursingType: 'registered', hasExperience: true, registrationNumber: 'NMW0001234567', expiryDate: nextYear }

  beforeAll(async () => {
    h = await workerHarness('worker-services.test')
    for (const c of REG_CATEGORIES) {
      if (await h.db.category.findUnique({ where: { id: c.id }, select: { id: true } })) continue
      await h.db.category.create({ data: c })
      created.push(c.id)
    }
  }, 60_000)
  afterAll(async () => {
    if (created.length) await h.db.category.deleteMany({ where: { id: { in: created } } })
    await h.close()
  })

  it('replaces the services in the order chosen; the read shows them and the audit row names the section', async () => {
    const res = await put('/v1/worker/services', { services: [care(), 'nursing-services'], subcategoryIds: [sub()] })
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json().services.map((s: any) => s.categoryId)).toEqual([care(), 'nursing-services'])
    expect(res.json().services[0]).toMatchObject({ subcategoryIds: [sub()], subcategoryNames: ['Harness Sub'] })
    expect((await profile()).services).toEqual(res.json().services)
    const audit = await h.db.auditLog.findFirst({ where: { userId: h.b.userId }, orderBy: { createdAt: 'desc' }, select: { action: true, metadata: true } })
    expect(audit).toMatchObject({ action: 'PROFILE_UPDATE', metadata: { section: 'putServices', profileId: h.b.profileId } })
  })

  it('refuses a service outside the catalogue and a sub-category of a service not chosen, naming the field', async () => {
    const unknown = await put('/v1/worker/services', { services: ['no-such-service'], subcategoryIds: [] })
    expect(unknown.statusCode).toBe(400)
    expect(unknown.json().fields).toHaveProperty('services')
    const stray = await put('/v1/worker/services', { services: ['nursing-services'], subcategoryIds: [sub()] })
    expect(stray.statusCode).toBe(400)
    expect(stray.json().fields).toHaveProperty('subcategoryIds')
  })

  it('S4: a registration for a service not chosen is 404 and creates nothing; a body for another service is 400', async () => {
    const res = await put('/v1/worker/services/therapeutic-supports/registration', { categoryId: 'therapeutic-supports', registrationNumber: 'PSY12345', expiryDate: nextYear })
    expect(res.statusCode).toBe(404)
    expect(await h.db.workerService.count({ where: { workerProfileId: h.b.profileId, categoryId: 'therapeutic-supports' } })).toBe(0)
    const mismatch = await put('/v1/worker/services/nursing-services/registration', { categoryId: 'therapeutic-supports', registrationNumber: 'PSY12345', expiryDate: nextYear })
    expect(mismatch.statusCode).toBe(400)
  })

  it('saves a registration on the chosen service; the read shows it', async () => {
    const res = await put('/v1/worker/services/nursing-services/registration', nurse)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ ...nurse })
    expect((await profile()).serviceRegistrations).toEqual([nurse])
  })

  it('D2: removing a service sets its registration aside, hidden; choosing it again brings it back', async () => {
    const removed = await put('/v1/worker/services', { services: [care()], subcategoryIds: [] })
    expect(removed.statusCode, removed.body).toBe(200)
    expect((await profile()).serviceRegistrations).toEqual([])
    expect(await h.db.workerServiceArchive.count({ where: { workerProfileId: h.b.profileId, categoryId: 'nursing-services' } })).toBe(1)

    const back = await put('/v1/worker/services', { services: [care(), 'nursing-services'], subcategoryIds: [] })
    expect(back.statusCode, back.body).toBe(200)
    expect((await profile()).serviceRegistrations).toEqual([nurse])
    expect(await h.db.workerServiceArchive.count({ where: { workerProfileId: h.b.profileId } })).toBe(0)
  })

  it('a kept service keeps its row (and its first-chosen place) when the list is re-sent in another order', async () => {
    const before = await h.db.workerService.findMany({ where: { workerProfileId: h.b.profileId }, select: { id: true, categoryId: true } })
    const res = await put('/v1/worker/services', { services: ['nursing-services', care()], subcategoryIds: [] })
    expect(res.statusCode).toBe(200)
    const after = await h.db.workerService.findMany({ where: { workerProfileId: h.b.profileId }, select: { id: true, categoryId: true } })
    expect(after.map((r) => r.id).sort()).toEqual(before.map((r) => r.id).sort())
    expect(res.json().services.map((s: any) => s.categoryId)).toEqual([care(), 'nursing-services'])
  })

  it('stored junk reads tolerantly: an expiry of "-01-00" and an empty number read as null', async () => {
    await h.db.workerService.update({
      where: { workerProfileId_categoryId: { workerProfileId: h.b.profileId, categoryId: 'nursing-services' } },
      data: { metadata: { nursingType: 'registered', hasExperience: false, registrationNumber: '', expiryDate: '-01-00' } },
    })
    const res = await h.get(h.b.userId)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json().serviceRegistrations).toEqual([{ categoryId: 'nursing-services', nursingType: 'registered', hasExperience: false, registrationNumber: null, expiryDate: null }])
  })
})
