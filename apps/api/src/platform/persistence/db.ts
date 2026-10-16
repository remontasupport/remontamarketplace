// Database access (S1-design 2.6). The client is generated from packages/db's
// schema into apps/api/generated/db (scripts/prisma-schema.mjs) and imported as #db.
// Same database as apps/app, its own pool.
import { Prisma, PrismaClient } from '#db'

export type Db = PrismaClient

/**
 * How long an interactive transaction waits for a pool connection before P2028. Prisma's
 * default is 2 s, which a cold Neon connection can exceed (seen from the backfill, 2026-10-12);
 * aligned with the pool wait (DB_POOL_TIMEOUT_S, 5 s on both stages). errors.ts maps P2028 and
 * P2024 alike to 503 + Retry-After (reason: pool).
 */
export const TRANSACTION_MAX_WAIT_MS = 5_000
/**
 * Every transaction runs at the database's default isolation, READ COMMITTED (Postgres' default; checked on Neon,
 * `default_transaction_isolation`, 2026-10-15). It is not passed to Prisma: an explicit level costs a
 * `SET TRANSACTION ISOLATION LEVEL` statement, a round trip, on every transaction (audit P2).
 */
/** A transaction handle: what a unit of work passes to writers. */
export type Tx = Prisma.TransactionClient

/**
 * Bounded pool: at most poolSize connections, and a query waits at most
 * poolTimeoutS for one -- then fails with P2024, which the error mapping turns into
 * a 503 with Retry-After instead of a request that hangs.
 */
export function createDb(url: string, pool: { poolSize: number; poolTimeoutS: number } = { poolSize: 10, poolTimeoutS: 5 }, opts: { queryEvents?: boolean } = {}): Db {
  const u = new URL(url)
  u.searchParams.set('connection_limit', String(pool.poolSize))
  u.searchParams.set('pool_timeout', String(pool.poolTimeoutS))
  // queryEvents (tests only): every statement as a 'query' event, so a test can count them (U1-PRF-01).
  const log: Prisma.LogDefinition[] = [{ level: 'warn', emit: 'event' }, { level: 'error', emit: 'event' }, ...(opts.queryEvents ? [{ level: 'query' as const, emit: 'event' as const }] : [])]
  return new PrismaClient({ datasourceUrl: u.toString(), log })
}

/**
 * One unit of work: the handler's writes, its audit record and its outbox events
 * commit together or not at all (NFR-ARCH-03).
 */
export async function unitOfWork<T>(db: Db, work: (tx: Tx) => Promise<T>): Promise<T> {
  const result = await db.$transaction(work, { timeout: 10_000, maxWait: TRANSACTION_MAX_WAIT_MS })
  recordDbSuccess()
  return result
}

/**
 * A bounded read (U1 worker-area, NFR pattern P1): ReadCommitted, a statement timeout
 * set as the transaction's first statement, at most 5 s on one connection. The
 * timeout is a clamped integer constant from the caller, never input; a statement it
 * cancels surfaces as Postgres 57014, which errors.ts maps to 503 + Retry-After.
 */
export async function readTransaction<T>(db: Db, statementTimeoutMs: number, work: (tx: Tx) => Promise<T>, opts: { transactionTimeoutMs?: number } = {}): Promise<T> {
  const timeout = statementTimeoutSetting(statementTimeoutMs)
  // The whole transaction's deadline: 10 s for a request; a backfill page (many statements, each a
  // round trip from wherever the script runs) may ask for more, never above two minutes.
  const transactionTimeout = Math.max(1_000, Math.min(120_000, Math.trunc(opts.transactionTimeoutMs ?? 10_000)))
  const result = await db.$transaction(
    async (tx) => {
      // set_config(..., true) is SET LOCAL with a bind parameter (SET itself takes none), so the
      // statement stays a tagged template: no Prisma.raw anywhere in the service (Semgrep rule).
      await tx.$executeRaw`SELECT set_config('statement_timeout', ${timeout}, true)`
      return work(tx)
    },
    { timeout: transactionTimeout, maxWait: TRANSACTION_MAX_WAIT_MS },
  )
  recordDbSuccess()
  return result
}

/** The statement timeout as set_config takes it: a clamped integer constant from the caller (never input), as a string. */
export function statementTimeoutSetting(ms: number): string {
  return String(Math.max(100, Math.min(60_000, Math.trunc(ms))))
}

/**
 * A section write (worker-profile-api U2, R1.2): unitOfWork with the statement timeout set
 * first, as readTransaction does for reads. 5 s per statement, 10 s for the transaction.
 */
export async function writeTransaction<T>(db: Db, work: (tx: Tx) => Promise<T>, statementTimeoutMs = 5000): Promise<T> {
  const timeout = statementTimeoutSetting(statementTimeoutMs)
  return unitOfWork(db, async (tx) => {
    await tx.$executeRaw`SELECT set_config('statement_timeout', ${timeout}, true)`
    return work(tx)
  })
}

// ---- Recent-success health (U1 worker-area, NFR pattern P4) -------------------------
// The instant a transaction last committed through this module. The health handler
// answers without a query while this is recent: a busy instance whose pool is
// saturated by real work is alive; one whose database is gone goes stale and fails.

let lastSuccessAt: number | null = null

export function recordDbSuccess(now: number = Date.now()): void {
  lastSuccessAt = now
}

/** Milliseconds since the epoch of the last committed transaction, or null since boot. */
export function lastDbSuccessAt(): number | null {
  return lastSuccessAt
}

/** Tests only: back to the boot state. */
export function resetDbSuccess(): void {
  lastSuccessAt = null
}

export { Prisma }
