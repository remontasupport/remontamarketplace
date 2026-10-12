// The recent-success health check (U1 worker-area, NFR pattern P4, P13 f), with a fake
// clock and a fake database: no query while a transaction committed within 30 s; one
// SELECT 1 under a 2 s timeout otherwise; 503 within 2 s when the database is gone.
import { platformContract } from '@remonta/api-contract'
import { afterEach, describe, expect, it } from 'vitest'
import { HEALTH_QUERY_TIMEOUT_MS, platformHandlers, RECENT_SUCCESS_MS } from '../../src/modules/platform/platform.handlers'
import { lastDbSuccessAt, recordDbSuccess, resetDbSuccess, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

type Mode = 'ok' | 'down' | 'hang'

/** A database that answers, refuses, or never answers; counts the transactions it was asked for. */
function fakeDb(mode: () => Mode) {
  const calls = { transactions: 0 }
  const db = {
    $transaction: async (work: (tx: unknown) => Promise<unknown>) => {
      calls.transactions++
      const tx = {
        $executeRaw: async () => 0,
        $queryRaw: async () => {
          if (mode() === 'down') throw Object.assign(new Error("Can't reach database server"), { name: 'PrismaClientInitializationError' })
          if (mode() === 'hang') await new Promise((r) => setTimeout(r, HEALTH_QUERY_TIMEOUT_MS + 500))
          return [{ '?column?': 1 }]
        },
      }
      return work(tx)
    },
  } as unknown as Db
  return { db, calls }
}

let t: TestApp | undefined
afterEach(async () => {
  await t?.close()
  t = undefined
  resetDbSuccess()
})

async function app(mode: () => Mode, now: () => number, last?: () => number | null) {
  const f = fakeDb(mode)
  t = await testApp({
    contracts: [platformContract],
    handlerSets: [platformHandlers({ db: f.db, clock: () => new Date(now()), lastSuccessAt: last })],
    publicEndpoints: [{ route: 'GET /v1/health', reason: 'the liveness probe' }],
  })
  return { ...f, health: () => t!.fastify.inject({ method: 'GET', url: '/v1/health' }) }
}

describe('GET /v1/health', () => {
  it('answers 200 without a query while a transaction committed within 30 s (a saturated pool is not a dead service)', async () => {
    let now = 1_000_000
    const a = await app(() => 'down', () => now, () => now - RECENT_SUCCESS_MS)
    expect((await a.health()).statusCode).toBe(200)
    expect(a.calls.transactions).toBe(0)
  })

  it('runs SELECT 1 when the last success is stale or unknown: 200 while the database answers', async () => {
    const now = 1_000_000
    const stale = await app(() => 'ok', () => now, () => now - RECENT_SUCCESS_MS - 1)
    expect((await stale.health()).statusCode).toBe(200)
    expect(stale.calls.transactions).toBe(1)
    await t!.close()
    t = undefined
    const boot = await app(() => 'ok', () => now, () => null)
    expect((await boot.health()).statusCode).toBe(200)
    expect(boot.calls.transactions).toBe(1)
  })

  it('503 with Retry-After when stale and the database is down (P13 f), in the error envelope', async () => {
    const now = 1_000_000
    const a = await app(() => 'down', () => now, () => null)
    const started = Date.now()
    const res = await a.health()
    expect(res.statusCode).toBe(503)
    expect(res.headers['retry-after']).toBe('2')
    expect(res.json().error.code).toBe('UNAVAILABLE')
    expect(Date.now() - started).toBeLessThan(HEALTH_QUERY_TIMEOUT_MS)
  })

  it('the persistence module records a success and exposes it; reset returns to boot', () => {
    resetDbSuccess()
    expect(lastDbSuccessAt()).toBeNull()
    recordDbSuccess(123)
    expect(lastDbSuccessAt()).toBe(123)
    resetDbSuccess()
    expect(lastDbSuccessAt()).toBeNull()
  })

  it('a reading from the future is not "recent" (a clock step back forces the query)', async () => {
    const now = 1_000_000
    const a = await app(() => 'ok', () => now, () => now + 5_000)
    expect((await a.health()).statusCode).toBe(200)
    expect(a.calls.transactions).toBe(1)
  })
})
