// worker-rates (2026-11-20) on PostGIS: the worker_rates table through the pipeline -- the read before and after a
// save, the replace, cents stored exactly, the CHECK constraint, the audit row, no completion change, and the admin's
// read of one worker. Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { adminContract, RATE_NAMES, toCents, type RatesBody } from '@remonta/api-contract'
import fc from 'fast-check'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { testApp, type TestApp } from '../helpers'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const EMPTY = { weekday: null, saturday: null, sunday: null, publicHoliday: null, evening: null, inactiveSleepover: null, updatedAt: null }
const BODY: RatesBody = { weekday: 42.5, saturday: 55, sunday: null, publicHoliday: 90.25, evening: null, inactiveSleepover: 250 }

describe.skipIf(!local)('the rates entries on PostGIS', () => {
  let h: WorkerHarness
  let admin: TestApp
  const as = (userId: string) => ({ 'x-test-principal': `${userId}:WORKER` })
  const read = (userId: string) => h.t.fastify.inject({ method: 'GET', url: '/v1/worker/rates', headers: as(userId) })
  const save = (userId: string, payload: unknown) => h.t.fastify.inject({ method: 'PUT', url: '/v1/worker/rates', headers: as(userId), payload: payload as object })
  const adminRead = (workerId: string) =>
    admin.fastify.inject({ method: 'GET', url: `/v1/admin/workers/${workerId}/rates`, headers: { 'x-test-principal': 'admin_1:ADMIN', 'cache-control': 'no-cache' } })

  beforeAll(async () => {
    h = await workerHarness('worker-rates.test')
    admin = await testApp({ contracts: [adminContract], handlerSets: [adminHandlers({ db: h.db, clock: () => new Date() })] })
  }, 60_000)
  afterAll(async () => {
    await admin?.close()
    await h?.close()
  })
  beforeEach(async () => {
    await h.db.workerRates.deleteMany({ where: { workerProfileId: { in: [h.a.profileId, h.b.profileId] } } })
  })

  it('before any save: every field null, never cached; the admin sees the same', async () => {
    const res = await read(h.a.userId)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ rates: EMPTY })
    expect(res.headers['cache-control']).toBe('no-store')
    expect((await adminRead(h.a.profileId)).json()).toEqual({ rates: EMPTY })
  })

  it('the save stores cents, answers dollars, records one PROFILE_UPDATE row and leaves the completion flags alone', async () => {
    const before = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true } })
    const since = new Date()
    const res = await save(h.a.userId, BODY)
    expect(res.statusCode, res.body).toBe(200)
    const row = await h.db.workerRates.findUniqueOrThrow({ where: { workerProfileId: h.a.profileId } })
    expect(row).toMatchObject({ weekdayCents: 4250, saturdayCents: 5500, sundayCents: null, publicHolidayCents: 9025, eveningCents: null, inactiveSleepoverCents: 25000 })
    const view = { ...BODY, updatedAt: row.updatedAt.toISOString() }
    expect(res.json()).toEqual(view)
    expect((await read(h.a.userId)).json()).toEqual({ rates: view })
    expect((await adminRead(h.a.profileId)).json()).toEqual({ rates: view })
    // The other worker is untouched.
    expect((await read(h.b.userId)).json()).toEqual({ rates: EMPTY })
    const audits = await h.db.auditLog.findMany({ where: { userId: h.a.userId, createdAt: { gte: since }, action: 'PROFILE_UPDATE' }, select: { metadata: true } })
    expect(audits.map((a) => (a.metadata as { section?: string }).section)).toEqual(['putRates'])
    const after = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true } })
    expect(after.setupProgress).toEqual(before.setupProgress)
  })

  it('a second save replaces all six (a rate cleared becomes null)', async () => {
    await save(h.a.userId, BODY)
    const res = await save(h.a.userId, { ...BODY, saturday: null, evening: 61.1 })
    expect(res.statusCode, res.body).toBe(200)
    expect(await h.db.workerRates.findUniqueOrThrow({ where: { workerProfileId: h.a.profileId } })).toMatchObject({ saturdayCents: null, eveningCents: 6110, weekdayCents: 4250 })
    expect(await h.db.workerRates.count({ where: { workerProfileId: h.a.profileId } })).toBe(1)
  })

  it('refuses a missing weekday rate, a fraction of a cent and an unknown field with 400; nothing is written', async () => {
    for (const bad of [{ ...BODY, weekday: null }, { ...BODY, sunday: 1.005 }, { ...BODY, night: 1 }]) {
      const res = await save(h.a.userId, bad)
      expect(res.statusCode, JSON.stringify(bad)).toBe(400)
    }
    expect(await h.db.workerRates.count({ where: { workerProfileId: h.a.profileId } })).toBe(0)
  })

  it('the CHECK constraint refuses a stored amount outside 1..999999 cents', async () => {
    await expect(h.db.workerRates.create({ data: { workerProfileId: h.a.profileId, weekdayCents: 0 } })).rejects.toThrow()
    await expect(h.db.workerRates.create({ data: { workerProfileId: h.a.profileId, weekdayCents: 1_000_000 } })).rejects.toThrow()
  })

  it('property: any valid set of rates is read back exactly as saved', async () => {
    const amount = fc.integer({ min: 1, max: 999999 }).map((c) => c / 100)
    const optional = fc.option(amount, { nil: null })
    await fc.assert(
      fc.asyncProperty(fc.record({ weekday: amount, saturday: optional, sunday: optional, publicHoliday: optional, evening: optional, inactiveSleepover: optional }), async (body) => {
        expect((await save(h.a.userId, body)).statusCode).toBe(200)
        const { rates } = (await read(h.a.userId)).json()
        for (const n of RATE_NAMES) expect(rates[n] === null ? null : toCents(rates[n]), n).toBe(body[n] === null ? null : toCents(body[n]))
      }),
      { numRuns: 15 },
    )
  })

  it('a WORKER account without a profile is 404 on both entries; an unknown worker id is 404 for the admin', async () => {
    expect((await read(h.orphan.userId)).statusCode).toBe(404)
    expect((await save(h.orphan.userId, BODY)).statusCode).toBe(404)
    expect((await adminRead('cmnoworker0000000000000000')).statusCode).toBe(404)
  })
})
