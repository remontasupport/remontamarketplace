// worker-activation U1 on PostGIS (BR-9): the worker's own activation read, through the pipeline on the seeded worker
// harness: false by default, the admin's value once set, never another worker's, never cached; and no worker body can
// set it (BR-1). Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

describe.skipIf(!local)('the worker activation read on PostGIS', () => {
  let h: WorkerHarness
  const as = (userId: string) => ({ 'x-test-principal': `${userId}:WORKER` })
  const read = (userId: string) => h.t.fastify.inject({ method: 'GET', url: '/v1/worker/activation', headers: as(userId) })

  beforeAll(async () => {
    h = await workerHarness('worker-activation.test')
  }, 60_000)
  afterAll(async () => {
    await h.close()
  })
  beforeEach(async () => {
    await h.db.workerProfile.updateMany({ where: { id: { in: [h.a.profileId, h.b.profileId] } }, data: { isActivated: false } })
  })

  it('false by default, never cached', async () => {
    const res = await read(h.a.userId)
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ activated: false })
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it("the caller's own value only", async () => {
    await h.db.workerProfile.update({ where: { id: h.b.profileId }, data: { isActivated: true } })
    expect((await read(h.a.userId)).json()).toEqual({ activated: false })
    expect((await read(h.b.userId)).json()).toEqual({ activated: true })
  })

  it('BR-1: a worker body carrying the flag is refused and writes nothing', async () => {
    const res = await h.t.fastify.inject({ method: 'PUT', url: '/v1/worker/profile/bio', headers: as(h.a.userId), payload: { bio: 'Hello there, I am a support worker.', isActivated: true } })
    expect(res.statusCode).toBe(400)
    expect((await read(h.a.userId)).json()).toEqual({ activated: false })
  })
})
