// Database access (S1-design 2.6). The client is generated from packages/db's
// schema into apps/api/generated/db (scripts/prisma-schema.mjs) and imported as #db.
// Same database as apps/app, its own pool.
import { Prisma, PrismaClient } from '#db'

export type Db = PrismaClient
/** A transaction handle: what a unit of work passes to writers. */
export type Tx = Prisma.TransactionClient

/**
 * Bounded pool: at most poolSize connections, and a query waits at most
 * poolTimeoutS for one -- then fails with P2024, which the error mapping turns into
 * a 503 with Retry-After instead of a request that hangs.
 */
export function createDb(url: string, pool: { poolSize: number; poolTimeoutS: number } = { poolSize: 10, poolTimeoutS: 5 }): Db {
  const u = new URL(url)
  u.searchParams.set('connection_limit', String(pool.poolSize))
  u.searchParams.set('pool_timeout', String(pool.poolTimeoutS))
  return new PrismaClient({ datasourceUrl: u.toString(), log: [{ level: 'warn', emit: 'event' }, { level: 'error', emit: 'event' }] })
}

/**
 * One unit of work: the handler's writes, its audit record and its outbox events
 * commit together or not at all (NFR-ARCH-03).
 */
export async function unitOfWork<T>(db: Db, work: (tx: Tx) => Promise<T>): Promise<T> {
  const result = await db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 })
  recordDbSuccess()
  return result
}

/**
 * A bounded read (U1 worker-area, NFR pattern P1): ReadCommitted, a statement timeout
 * set as the transaction's first statement, at most 5 s on one connection. The
 * timeout is a clamped integer constant from the caller, never input; a statement it
 * cancels surfaces as Postgres 57014, which errors.ts maps to 503 + Retry-After.
 */
export async function readTransaction<T>(db: Db, statementTimeoutMs: number, work: (tx: Tx) => Promise<T>): Promise<T> {
  const timeout = Math.max(100, Math.min(60_000, Math.trunc(statementTimeoutMs)))
  const result = await db.$transaction(
    async (tx) => {
      // SET takes no bind parameter; the value is a bounded integer constant (see above).
      await tx.$executeRaw(Prisma.raw(`SET LOCAL statement_timeout = ${timeout}`))
      return work(tx)
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 },
  )
  recordDbSuccess()
  return result
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
