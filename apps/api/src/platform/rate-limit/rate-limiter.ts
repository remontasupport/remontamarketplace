// Pipeline step 3: fixed-window counters, failing closed (S1-design 2.3, P8).
// A port, so Redis can replace Postgres once OI-08 is decided.
import { RATE_WINDOWS, type RateWindow } from '@remonta/api-contract'
import type { Db } from '../persistence/db'

export interface RateDecision {
  allowed: boolean
  /** Seconds until the window resets, for Retry-After. */
  retryAfter: number
}

export interface RateLimiter {
  /** Counts one hit against `key` and decides. Throws if the store is unreachable. */
  hit(key: string, limit: number, window: RateWindow, now?: Date): Promise<RateDecision>
}

export function windowStart(now: Date, window: RateWindow): Date {
  const ms = RATE_WINDOWS[window] * 1000
  return new Date(Math.floor(now.getTime() / ms) * ms)
}

/** rate_limit_buckets: one row per (key, window start), incremented atomically. */
export class PostgresRateLimiter implements RateLimiter {
  constructor(private readonly db: Db) {}

  async hit(key: string, limit: number, window: RateWindow, now = new Date()): Promise<RateDecision> {
    const start = windowStart(now, window)
    const expires = new Date(start.getTime() + RATE_WINDOWS[window] * 1000)
    const rows = await this.db.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limit_buckets (key, "windowStart", count, "expiresAt")
      VALUES (${key}, ${start}, 1, ${expires})
      ON CONFLICT (key, "windowStart") DO UPDATE SET count = rate_limit_buckets.count + 1
      RETURNING count`
    const count = rows[0]?.count ?? Number.POSITIVE_INFINITY
    return { allowed: count <= limit, retryAfter: Math.max(1, Math.ceil((expires.getTime() - now.getTime()) / 1000)) }
  }

  /** Deletes expired buckets. Run periodically; returns the number removed. */
  async purgeExpired(now = new Date()): Promise<number> {
    return this.db.$executeRaw`DELETE FROM rate_limit_buckets WHERE "expiresAt" < ${now}`
  }
}
