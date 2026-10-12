// GET /v1/worker/profile through the real pipeline with a fake read (no database):
// the contract shape, the private cache (R2.7, P4, P13 e), ownership and the
// envelope (R1.2, R1.5), the failure injections that need no database (P13 c, d),
// and the log lines (U1-SEC-06, P12). The database-backed half is profile.int.test.ts.
import { contracts, platformContract, profileSchema, workerContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { afterEach, describe, expect, it } from 'vitest'
import { platformHandlers } from '../../src/modules/platform/platform.handlers'
import type { ProfileRows } from '../../src/modules/worker/persistence/profile-read'
import { workerHandlers, type WorkerModuleDeps } from '../../src/modules/worker/worker.handlers'
import { LoadShedder } from '../../src/platform/load/load-shedder'
import type { Db } from '../../src/platform/persistence/db'
import { testApp, unreachableHandlers, workerToken, type TestApp } from '../helpers'
import { sampleRows } from './units.test'

let t: TestApp | undefined
afterEach(async () => {
  await t?.close()
  t = undefined
})

interface Fixture {
  rows: Map<string, ProfileRows>
  logs: Record<string, unknown>[]
  calls: number
}

async function app(opts: { read?: WorkerModuleDeps['read']; shedder?: LoadShedder } = {}): Promise<Fixture> {
  const rows = new Map<string, ProfileRows>()
  rows.set('u_a', sampleRows())
  rows.set('u_b', sampleRows({ id: 'wp_2', userId: 'u_b', firstName: 'Ben', lastName: 'Nguyen', mobile: '0499999999', locations: [], workerAdditionalInfo: null }))
  const f: Fixture = { rows, logs: [], calls: 0 }
  const read: WorkerModuleDeps['read'] =
    opts.read ??
    (async (_db, userId) => {
      f.calls++
      return rows.get(userId) ?? null
    })
  const db = {} as Db
  t = await testApp({
    contracts,
    handlerSets: [
      platformHandlers({ db, clock: () => new Date(), lastSuccessAt: () => Date.now() }),
      workerHandlers({ db, clock: () => new Date(), read }),
      ...contracts.filter((c) => c !== platformContract && c !== workerContract).map(unreachableHandlers),
    ],
    publicEndpoints: publicEndpoints as PublicEndpoint[],
    shedder: opts.shedder,
    logs: f.logs,
  })
  return f
}

const get = (headers: Record<string, string> = {}) => t!.fastify.inject({ method: 'GET', url: '/v1/worker/profile', headers })

describe('GET /v1/worker/profile', () => {
  it('answers the contract shape for the signed-in worker, privately cacheable with a strong ETag (R2.7)', async () => {
    await app()
    const res = await get(workerToken('u_a'))
    expect(res.statusCode).toBe(200)
    const body = profileSchema.parse(res.json())
    expect(body.id).toBe('wp_1')
    expect(body.names.firstName).toBe('Mary')
    expect(res.headers['cache-control']).toBe('private, max-age=60')
    expect(res.headers['vary']).toBe('Authorization')
    expect(String(res.headers['etag'])).toMatch(/^"sha256-[A-Za-z0-9_-]+"$/)
  })

  it('P4: two reads with no write between them give equal bodies and the same ETag; If-None-Match -> 304 with no body', async () => {
    await app()
    const a = await get(workerToken('u_a'))
    const b = await get(workerToken('u_a'))
    expect(a.json()).toEqual(b.json())
    expect(a.headers['etag']).toBe(b.headers['etag'])
    const c = await get({ ...workerToken('u_a'), 'if-none-match': String(a.headers['etag']) })
    expect(c.statusCode).toBe(304)
    expect(c.body).toBe('')
    expect(c.headers['cache-control']).toBe('private, max-age=60')
  })

  it('P13 e: after the row changes, a conditional read gets 200 with a new ETag', async () => {
    const f = await app()
    const a = await get(workerToken('u_a'))
    f.rows.set('u_a', sampleRows({ introduction: 'Something else entirely, long enough to count as a bio.' }))
    const b = await get({ ...workerToken('u_a'), 'if-none-match': String(a.headers['etag']) })
    expect(b.statusCode).toBe(200)
    expect(b.headers['etag']).not.toBe(a.headers['etag'])
  })

  it('P1: a worker sees only their own rows; another worker\'s values never appear', async () => {
    await app()
    const b = await get(workerToken('u_b'))
    expect(b.statusCode).toBe(200)
    const body = profileSchema.parse(b.json())
    expect(body.id).toBe('wp_2')
    expect(body.serviceArea).toBeNull()
    expect(body.sections.bankAccount).toBeNull()
    const text = b.body
    for (const foreign of ['wp_1', 'Mary', "O'Connor", '0412345678', 'Parramatta', '55512399']) expect(text).not.toContain(foreign)
  })

  it('R1.5, R1.2: 401 without a principal, 403 for any other role, 404 in the envelope for a WORKER with no profile (one warn line)', async () => {
    const f = await app()
    expect((await get()).statusCode).toBe(401)
    for (const role of ['ADMIN', 'CLIENT', 'COORDINATOR']) expect((await get({ 'x-test-principal': `u_a:${role}` })).statusCode, role).toBe(403)
    const none = await get(workerToken('u_none'))
    expect(none.statusCode).toBe(404)
    expect(none.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found.', requestId: none.headers['x-request-id'] } })
    const warn = f.logs.find((l) => l.reason === 'WORKER_PROFILE_NOT_FOUND')
    expect(warn).toMatchObject({ level: 40, userId: 'u_none' })
  })

  it('U1-SEC-06: one info line per read with ids and timing, never a name, a number or a row', async () => {
    const f = await app()
    await get(workerToken('u_a'))
    const line = f.logs.find((l) => l.entry === 'worker.getProfile')
    expect(line).toMatchObject({ userId: 'u_a', percent: expect.any(Number), durationMs: expect.any(Number) })
    const all = JSON.stringify(f.logs)
    for (const secret of ['Mary', "O'Connor", '0412345678', '062000', '55512399']) expect(all).not.toContain(secret)
  })

  it('P13 c: with the limiter down the read is 503 (reason: limiter), the health probe stays 200', async () => {
    const f = await app()
    t!.rateLimiter.mode = 'down'
    const res = await get(workerToken('u_a'))
    expect(res.statusCode).toBe(503)
    expect(res.headers['retry-after']).toBe('2')
    expect((await t!.fastify.inject({ method: 'GET', url: '/v1/health' })).statusCode).toBe(200)
    expect(f.logs.some((l) => l.msg === 'request failed' && l.reason === 'limiter')).toBe(true)
  })

  it('P13 d: at MAX_IN_FLIGHT=2 the third concurrent read is shed (reason: shed) and admitted once one finishes', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const f = await app({
      shedder: new LoadShedder({ maxInFlight: 2, maxEventLoopDelayMs: 1e6, delayProbe: () => 0 }),
      read: async () => {
        await gate
        return sampleRows()
      },
    })
    const held = [1, 2].map(() => get(workerToken('u_a')))
    await new Promise((r) => setTimeout(r, 20))
    const shed = await get(workerToken('u_a'))
    expect(shed.statusCode).toBe(503)
    expect(shed.headers['retry-after']).toBe('2')
    expect(f.logs.some((l) => l.msg === 'request failed' && l.reason === 'shed')).toBe(true)
    expect((await t!.fastify.inject({ method: 'GET', url: '/v1/health' })).statusCode).toBe(200) // never shed
    release()
    expect((await Promise.all(held)).map((r) => r.statusCode)).toEqual([200, 200])
    expect((await get(workerToken('u_a'))).statusCode).toBe(200)
  })

  it('refuses query parameters and a body (R1.1: no input at all)', async () => {
    await app()
    expect((await t!.fastify.inject({ method: 'GET', url: '/v1/worker/profile?userId=u_b', headers: workerToken('u_a') })).statusCode).toBe(400)
    expect((await t!.fastify.inject({ method: 'POST', url: '/v1/worker/profile', headers: workerToken('u_a'), payload: {} })).statusCode).toBe(404)
  })
})
