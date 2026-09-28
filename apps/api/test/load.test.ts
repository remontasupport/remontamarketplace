// Step 5b: overload protection.
import { defineContract, errorResponseSchema, meta, platformContract, type PublicEndpoint } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { defineHandlers, type HandlerSet } from '../src/platform/contract/handlers'
import { ApiError, statusOf } from '../src/platform/errors'
import { Bulkhead, BulkheadFullError } from '../src/platform/load/bulkhead'
import { LoadShedder } from '../src/platform/load/load-shedder'
import { createDb } from '../src/platform/persistence/db'
import { testApp } from './helpers'

const open = meta({ access: 'public', bot: 'none', rateLimit: [{ per: 'ip', limit: 1000, window: '1m' }], maxBodyKb: 1 })
const loadContract = defineContract('testLoad', {
  slow: { method: 'GET', path: '/v1/test/slow', summary: 't', responses: { 200: z.strictObject({}) }, meta: open },
  fails: { method: 'GET', path: '/v1/test/fails', summary: 't', responses: { 200: z.strictObject({}) }, meta: open },
})
const allow: PublicEndpoint[] = ['GET /v1/test/slow', 'GET /v1/test/fails'].map((route) => ({ route, reason: 'load test entry' }))

function gatedApp(shedder: LoadShedder) {
  let open_!: () => void
  let gate = new Promise<void>((r) => (open_ = r))
  const handlers = defineHandlers(loadContract, {
    slow: async () => {
      await gate
      return { status: 200, body: {} }
    },
    fails: async () => {
      throw new Error('boom')
    },
  })
  return {
    app: testApp({ contracts: [loadContract], handlerSets: [handlers as unknown as HandlerSet], publicEndpoints: allow, shedder }),
    release: () => open_(),
    reset: () => (gate = new Promise<void>((r) => (open_ = r))),
  }
}

describe('load shedding', () => {
  it('admits up to maxInFlight and answers the rest with a fast 503 + Retry-After', async () => {
    const shedder = new LoadShedder({ maxInFlight: 3, maxEventLoopDelayMs: 1e6, delayProbe: () => 0 })
    const g = gatedApp(shedder)
    const t = await g.app
    const held = [1, 2, 3].map(() => t.fastify.inject({ method: 'GET', url: '/v1/test/slow' }))
    await new Promise((r) => setTimeout(r, 20))
    expect(shedder.current).toBe(3)

    const shed = await t.fastify.inject({ method: 'GET', url: '/v1/test/slow' })
    expect(shed.statusCode).toBe(503)
    expect(shed.headers['retry-after']).toBe('2')
    expect(shed.headers['x-content-type-options']).toBe('nosniff')
    expect(errorResponseSchema.parse(shed.json()).error.code).toBe('UNAVAILABLE')

    g.release()
    expect((await Promise.all(held)).map((r) => r.statusCode)).toEqual([200, 200, 200])
    expect(shedder.current).toBe(0)
    g.reset()
    g.release()
    expect((await t.fastify.inject({ method: 'GET', url: '/v1/test/slow' })).statusCode).toBe(200)
    await t.close()
  })

  it('never sheds an entry marked exempt (the health check)', async () => {
    const shedder = new LoadShedder({ maxInFlight: 1, maxEventLoopDelayMs: 1, delayProbe: () => 10_000 })
    const t = await testApp({
      contracts: [platformContract],
      handlerSets: [defineHandlers(platformContract, { health: async () => ({ status: 200, body: { status: 'ok' } }) }) as unknown as HandlerSet],
      publicEndpoints: [{ route: 'GET /v1/health', reason: 'health probe' }],
      shedder,
    })
    expect((await t.fastify.inject({ method: 'GET', url: '/v1/health' })).statusCode).toBe(200)
    expect(shedder.current).toBe(0)
    await t.close()
  })

  it('sheds while the event loop is lagging, and recovers when it is not', async () => {
    let lag = 500
    const shedder = new LoadShedder({ maxInFlight: 100, maxEventLoopDelayMs: 200, delayProbe: () => lag })
    const g = gatedApp(shedder)
    g.release()
    const t = await g.app
    expect((await t.fastify.inject({ method: 'GET', url: '/v1/test/slow' })).statusCode).toBe(503)
    lag = 10
    expect((await t.fastify.inject({ method: 'GET', url: '/v1/test/slow' })).statusCode).toBe(200)
    await t.close()
  })

  it('never leaks a slot: after any mix of outcomes, nothing is left in flight', async () => {
    const shedder = new LoadShedder({ maxInFlight: 1000, maxEventLoopDelayMs: 1e6, delayProbe: () => 0 })
    const g = gatedApp(shedder)
    g.release()
    const t = await g.app
    await fc.assert(
      fc.asyncProperty(fc.array(fc.constantFrom('/v1/test/slow', '/v1/test/fails', '/v1/test/slow?bad=1', '/v1/nowhere'), { minLength: 1, maxLength: 25 }), async (urls) => {
        await Promise.all(urls.map((url) => t.fastify.inject({ method: 'GET', url })))
        expect(shedder.current).toBe(0)
      }),
      { numRuns: 30 },
    )
    await t.close()
  })
})

describe('Bulkhead', () => {
  it('never runs more than maxConcurrent at once; overflow is refused, not queued forever', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 0, max: 5 }),
        fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 1, maxLength: 20 }),
        async (maxConcurrent, maxQueue, durations) => {
          const b = new Bulkhead({ name: 'test', maxConcurrent, maxQueue, queueTimeoutMs: 1000 })
          let active = 0
          let peak = 0
          const results = await Promise.allSettled(
            durations.map((ms) =>
              b.run(async () => {
                peak = Math.max(peak, ++active)
                await new Promise((r) => setTimeout(r, ms))
                active--
              }),
            ),
          )
          expect(peak).toBeLessThanOrEqual(maxConcurrent)
          const refused = results.filter((r) => r.status === 'rejected')
          expect(refused).toHaveLength(Math.max(0, durations.length - maxConcurrent - maxQueue))
          for (const r of refused) expect((r as PromiseRejectedResult).reason).toBeInstanceOf(BulkheadFullError)
          expect(b.stats).toEqual({ active: 0, waiting: 0 })
        },
      ),
      { numRuns: 60 },
    )
  })

  it('a waiting caller gives up after queueTimeoutMs with a 503', async () => {
    const b = new Bulkhead({ name: 'hash', maxConcurrent: 1, maxQueue: 5, queueTimeoutMs: 30 })
    let release!: () => void
    const first = b.run(() => new Promise<void>((r) => (release = r)))
    const second = b.run(async () => 'ran')
    const err = await second.catch((e: unknown) => e)
    expect(err).toBeInstanceOf(BulkheadFullError)
    expect(statusOf(err)).toBe(503)
    release()
    await first
    expect(b.stats).toEqual({ active: 0, waiting: 0 })
  })

  it('a failing run frees its slot', async () => {
    const b = new Bulkhead({ name: 'hash', maxConcurrent: 1, maxQueue: 0, queueTimeoutMs: 10 })
    await expect(b.run(async () => { throw new ApiError(400) })).rejects.toBeInstanceOf(ApiError)
    await expect(b.run(async () => 'ok')).resolves.toBe('ok')
  })
})

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false

describe.skipIf(!local)('bounded database pool (PostGIS)', () => {
  it('a query that cannot get a connection in time fails fast and maps to 503', async () => {
    const db = createDb(url!, { poolSize: 1, poolTimeoutS: 1 })
    try {
      const holder = db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_sleep(2.5)`
      }, { timeout: 10_000 })
      await new Promise((r) => setTimeout(r, 200))
      const started = Date.now()
      let err: unknown
      try {
        await db.$queryRaw`SELECT 1`
      } catch (e) {
        err = e
      }
      expect(Date.now() - started).toBeLessThan(2000)
      expect((err as { code?: string }).code).toBe('P2024')
      expect(statusOf(err)).toBe(503)
      await holder
    } finally {
      await db.$disconnect()
    }
  }, 15_000)
})
