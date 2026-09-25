// Database access (S1-design 2.6). The client is generated from packages/db's
// schema into apps/api/generated/db (scripts/prisma-schema.mjs) and imported as #db.
// Same database as apps/app, its own pool.
import { Prisma, PrismaClient } from '#db'

export type Db = PrismaClient
/** A transaction handle: what a unit of work passes to writers. */
export type Tx = Prisma.TransactionClient

export function createDb(url: string): Db {
  return new PrismaClient({ datasourceUrl: url, log: [{ level: 'warn', emit: 'event' }, { level: 'error', emit: 'event' }] })
}

/**
 * One unit of work: the handler's writes, its audit record and its outbox events
 * commit together or not at all (NFR-ARCH-03).
 */
export function unitOfWork<T>(db: Db, work: (tx: Tx) => Promise<T>): Promise<T> {
  return db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000 })
}

export { Prisma }
