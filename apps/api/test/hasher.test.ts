import bcrypt from 'bcryptjs'
import { afterAll, describe, expect, it } from 'vitest'
import { statusOf } from '../src/platform/errors'
import { BulkheadFullError } from '../src/platform/load/bulkhead'
import { BCRYPT_COST, WorkerPoolHasher } from '../src/platform/security/password-hasher'

const pool = new WorkerPoolHasher({ threads: 2, maxQueue: 2, queueTimeoutMs: 5000 })
afterAll(() => pool.close())

describe('WorkerPoolHasher', () => {
  it('produces cost-12 bcrypt hashes that apps/app (bcryptjs.compare) accepts', async () => {
    const h = await pool.hash('Str0ng!pass')
    expect(BCRYPT_COST).toBe(12)
    expect(h).toMatch(/^\$2[aby]\$12\$/)
    expect(await bcrypt.compare('Str0ng!pass', h)).toBe(true)
    expect(await bcrypt.compare('wrong', h)).toBe(false)
  })

  it('verifies hashes made by apps/app today', async () => {
    const legacy = bcrypt.hashSync('Legacy#1pass', 4) // cost kept low only to keep the test fast
    expect(await pool.verify('Legacy#1pass', legacy)).toBe(true)
    expect(await pool.verify('nope', legacy)).toBe(false)
  })

  it('keeps the event loop free while hashing', async () => {
    let worstGap = 0
    let last = Date.now()
    const timer = setInterval(() => {
      const now = Date.now()
      worstGap = Math.max(worstGap, now - last)
      last = now
    }, 10)
    await Promise.all([pool.hash('a1!Aaaaa'), pool.hash('b1!Bbbbb')])
    clearInterval(timer)
    // On the main thread one cost-12 hash blocks for ~250 ms; here ticks keep coming.
    expect(worstGap).toBeLessThan(100)
  })

  it('refuses overflow with a fast 503 instead of queueing without bound', async () => {
    const results = await Promise.allSettled(Array.from({ length: 6 }, (_, i) => pool.hash(`P${i}!aaaaa`)))
    const refused = results.filter((r) => r.status === 'rejected').map((r) => (r as PromiseRejectedResult).reason)
    expect(refused).toHaveLength(2) // 2 threads + 2 queued admitted
    for (const e of refused) {
      expect(e).toBeInstanceOf(BulkheadFullError)
      expect(statusOf(e)).toBe(503)
    }
  })
}, 30_000)
