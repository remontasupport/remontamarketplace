// Against a real, migrated PostGIS database. Runs only when TEST_DATABASE_URL points
// at localhost (it deletes rows from outbox_events, rate_limit_buckets, audit_logs).
import fc from 'fast-check'
import pino from 'pino'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { RequestAudit } from '../src/platform/audit'
import { OutboxDispatcher } from '../src/platform/outbox/dispatcher'
import { backoffMs, enqueue, MAX_ATTEMPTS, type OutboxHandler } from '../src/platform/outbox/outbox'
import { createDb, unitOfWork, type Db } from '../src/platform/persistence/db'
import { PostgresRateLimiter, windowStart } from '../src/platform/rate-limit/rate-limiter'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false
if (url && !local) throw new Error('TEST_DATABASE_URL must point at localhost: this test deletes rows')
const log = pino({ level: 'silent' })

describe('pure rules', () => {
  it('back-off doubles from 2 min and tries 6 times over about an hour', () => {
    const delays = Array.from({ length: MAX_ATTEMPTS - 1 }, (_, i) => backoffMs(i + 1) / 60_000)
    expect(delays).toEqual([2, 4, 8, 16, 32])
    fc.assert(fc.property(fc.integer({ min: -5, max: 50 }), (n) => backoffMs(n) >= backoffMs(n - 1) && backoffMs(n) <= 32 * 60_000))
  })

  it('a rate window contains its instant and is aligned', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2020-01-01'), max: new Date('2040-01-01'), noInvalidDate: true }), fc.constantFrom('1m', '10m', '1h', '1d' as const), (now, w) => {
        const s = windowStart(now, w).getTime()
        const len = { '1m': 60e3, '10m': 600e3, '1h': 3600e3, '1d': 86400e3 }[w]
        return s <= now.getTime() && now.getTime() < s + len && s % len === 0
      }),
    )
  })
})

describe.skipIf(!local)('on PostGIS', () => {
  let db: Db
  beforeAll(async () => {
    db = createDb(url!)
  })
  afterAll(async () => {
    await db.$executeRawUnsafe(`DELETE FROM outbox_events WHERE type LIKE 'test.%'`)
    await db.$executeRawUnsafe(`DELETE FROM rate_limit_buckets WHERE key LIKE 'test:%'`)
    await db.$disconnect()
  })
  beforeEach(async () => {
    await db.$executeRawUnsafe(`DELETE FROM outbox_events WHERE type LIKE 'test.%'`)
  })

  describe('PostgresRateLimiter', () => {
    it('allows exactly `limit` of many concurrent hits in one window', async () => {
      const rl = new PostgresRateLimiter(db)
      const key = `test:${Date.now()}:concurrent`
      const now = new Date()
      const decisions = await Promise.all(Array.from({ length: 30 }, () => rl.hit(key, 7, '1h', now)))
      expect(decisions.filter((d) => d.allowed)).toHaveLength(7)
      expect(decisions.every((d) => d.retryAfter > 0 && d.retryAfter <= 3600)).toBe(true)
    })

    it('starts counting again in the next window, and purges expired buckets', async () => {
      const rl = new PostgresRateLimiter(db)
      const key = `test:${Date.now()}:windows`
      const t0 = new Date('2030-01-01T10:00:30Z')
      expect((await rl.hit(key, 1, '1m', t0)).allowed).toBe(true)
      expect((await rl.hit(key, 1, '1m', t0)).allowed).toBe(false)
      expect((await rl.hit(key, 1, '1m', new Date('2030-01-01T10:01:05Z'))).allowed).toBe(true)
      expect(await rl.purgeExpired(new Date('2030-01-02T00:00:00Z'))).toBeGreaterThanOrEqual(2)
    })
  })

  describe('outbox', () => {
    it('an event enqueued in a transaction that rolls back never exists', async () => {
      await expect(
        unitOfWork(db, async (tx) => {
          await enqueue(tx, { type: 'test.rollback', payload: { n: 1 } })
          throw new Error('business rule failed')
        }),
      ).rejects.toThrow('business rule failed')
      expect(await db.outboxEvent.count({ where: { type: 'test.rollback' } })).toBe(0)
    })

    it('a committed event is delivered once and marked DONE', async () => {
      const id = await unitOfWork(db, (tx) => enqueue(tx, { type: 'test.ok', payload: { n: 1 } }))
      const seen: string[] = []
      const d = new OutboxDispatcher(db, new Map<string, OutboxHandler>([['test.ok', async (e) => void seen.push(e.id)]]), log)
      await d.runOnce()
      await d.runOnce()
      expect(seen).toEqual([id])
      expect(await db.outboxEvent.findUnique({ where: { id } })).toMatchObject({ status: 'DONE', attempts: 1, lockedUntil: null })
    })

    it('retries with back-off and goes DEAD after the last attempt', async () => {
      const id = await unitOfWork(db, (tx) => enqueue(tx, { type: 'test.fail', payload: {} }))
      let clock = Date.now()
      const d = new OutboxDispatcher(db, new Map<string, OutboxHandler>([['test.fail', async () => { throw new Error('provider 500') }]]), log, { now: () => new Date(clock) })
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        expect(await d.runOnce()).toBe(1)
        const row = await db.outboxEvent.findUniqueOrThrow({ where: { id } })
        expect(row.attempts).toBe(attempt)
        expect(row.lastError).toBe('provider 500')
        if (attempt < MAX_ATTEMPTS) {
          expect(row.status).toBe('PENDING')
          expect(row.nextAttemptAt.getTime() - clock).toBe(backoffMs(attempt))
          expect(await d.runOnce()).toBe(0) // not due yet
          clock = row.nextAttemptAt.getTime()
        } else {
          expect(row.status).toBe('DEAD')
        }
      }
      clock += 24 * 3600e3
      expect(await d.runOnce()).toBe(0) // DEAD is final
    })

    it('an event type with no handler goes straight to DEAD', async () => {
      const id = await unitOfWork(db, (tx) => enqueue(tx, { type: 'test.unknown', payload: {} }))
      await new OutboxDispatcher(db, new Map(), log).runOnce()
      expect(await db.outboxEvent.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: 'DEAD', attempts: 1 })
    })

    it('a timed-out handler is a failure, retried later', async () => {
      const id = await unitOfWork(db, (tx) => enqueue(tx, { type: 'test.slow', payload: {} }))
      const d = new OutboxDispatcher(db, new Map<string, OutboxHandler>([['test.slow', () => new Promise(() => {})]]), log, { handlerTimeoutMs: 50 })
      await d.runOnce()
      expect(await db.outboxEvent.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: 'PENDING', lastError: 'handler timed out' })
    })

    it('reclaims an event whose dispatcher died mid-claim', async () => {
      const id = await unitOfWork(db, (tx) => enqueue(tx, { type: 'test.orphan', payload: {} }))
      await db.$executeRaw`UPDATE outbox_events SET status='PROCESSING', attempts=1, "lockedUntil"=now() - interval '1 minute' WHERE id=${id}::uuid`
      const seen: string[] = []
      await new OutboxDispatcher(db, new Map<string, OutboxHandler>([['test.orphan', async (e) => void seen.push(e.id)]]), log).runOnce()
      expect(seen).toEqual([id])
      expect(await db.outboxEvent.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: 'DONE', attempts: 2 })
    })

    it('an event in flight on one dispatcher is not claimed by another (the lease)', async () => {
      const ids = await unitOfWork(db, async (tx) => Promise.all([1, 2, 3].map((n) => enqueue(tx, { type: 'test.inflight', payload: { n } }))))
      let release!: () => void
      const gate = new Promise<void>((r) => (release = r))
      let started = 0
      const deliveries: string[] = []
      const held: OutboxHandler = async (e) => {
        started++
        await gate
        deliveries.push(e.id)
      }
      const a = new OutboxDispatcher(db, new Map([['test.inflight', held]]), log)
      const b = new OutboxDispatcher(db, new Map([['test.inflight', held]]), log)
      const running = a.runOnce()
      while (started < 3) await new Promise((r) => setTimeout(r, 5))
      expect(await b.runOnce()).toBe(0) // a's claims are PROCESSING with a live lease
      release()
      await running
      expect(deliveries.sort()).toEqual([...ids].sort())
    })

    it('two dispatchers running at once never deliver the same event twice', async () => {
      const ids = await unitOfWork(db, async (tx) => Promise.all(Array.from({ length: 40 }, (_, n) => enqueue(tx, { type: 'test.race', payload: { n } }))))
      const deliveries: string[] = []
      const slow: OutboxHandler = async (e) => {
        await new Promise((r) => setTimeout(r, 5))
        deliveries.push(e.id)
      }
      const make = () => new OutboxDispatcher(db, new Map([['test.race', slow]]), log, { batchSize: 7 })
      const [a, b] = [make(), make()]
      for (let i = 0; i < 10; i++) await Promise.all([a.runOnce(), b.runOnce()])
      expect(deliveries.sort()).toEqual([...ids].sort())
      expect(await db.outboxEvent.count({ where: { type: 'test.race', status: 'DONE' } })).toBe(40)
    })
  })

  describe('unit of work + audit', () => {
    it('the audit row commits with the change, and rolls back with it', async () => {
      const audit = new RequestAudit({ ip: '203.0.113.9', userAgent: 'vitest', requestId: `req-${Date.now()}` })
      await unitOfWork(db, (tx) => audit.record(tx, { action: 'ACCOUNT_REGISTERED', metadata: { test: true } }))
      const failing = new RequestAudit({ ip: '203.0.113.9', userAgent: 'vitest', requestId: `req-rb-${Date.now()}` })
      await expect(
        unitOfWork(db, async (tx) => {
          await failing.record(tx, { action: 'ACCOUNT_REGISTERED' })
          throw new Error('abort')
        }),
      ).rejects.toThrow('abort')
      const rows = await db.$queryRaw<{ rid: string }[]>`SELECT metadata->>'requestId' AS rid FROM audit_logs WHERE "ipAddress"='203.0.113.9'`
      const rids = rows.map((r) => r.rid)
      expect(rids).toContain((audit as unknown as { request: { requestId: string } }).request.requestId)
      expect(rids.some((r) => r.startsWith('req-rb-'))).toBe(false)
      expect(audit.satisfies('ACCOUNT_REGISTERED')).toBe(true)
      await db.$executeRaw`DELETE FROM audit_logs WHERE "ipAddress"='203.0.113.9'`
    })

    it('the database refuses an audit action that is not in the enum', async () => {
      const audit = new RequestAudit({ ip: '203.0.113.9', userAgent: undefined, requestId: 'r' })
      await expect(unitOfWork(db, (tx) => audit.record(tx, { action: 'MADE_UP' }))).rejects.toThrow()
    })
  })
})
