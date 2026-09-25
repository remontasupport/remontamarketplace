// The outbox (S1-design 2.4, US-NOT-03). Events are written in the same transaction
// as the change that caused them, so a side effect never happens for a change that
// rolled back and is never lost for one that committed.
import { randomUUID } from 'node:crypto'
import type { Prisma, Tx } from '../persistence/db'

export interface OutboxEventInput {
  type: string
  payload: Prisma.InputJsonValue
}

/**
 * Enqueue inside the caller's transaction. Returns the event id (the idempotency key).
 *
 * nextAttemptAt is set from the app clock, not the column default: the dispatcher
 * compares against the app clock, and mixing the database's clock in made a new
 * event "not yet due" whenever the database ran ahead (measured ~60 ms locally).
 */
export async function enqueue(tx: Tx, event: OutboxEventInput, now: Date = new Date()): Promise<string> {
  const id = randomUUID()
  await tx.outboxEvent.create({ data: { id, type: event.type, payload: event.payload, nextAttemptAt: now } })
  return id
}

export interface OutboxEvent {
  id: string
  type: string
  payload: unknown
  attempts: number
}

/** A handler must be idempotent on event.id: it can run more than once. */
export type OutboxHandler = (event: OutboxEvent, signal: AbortSignal) => Promise<void>

export const MAX_ATTEMPTS = 6

/**
 * Delay after failed attempt n (1-based): 2, 4, 8, 16, 32 min. The 6th failure is
 * final (DEAD), so an event is tried 6 times over about 62 min (S1-design: "6
 * attempts over about 1 h").
 */
export function backoffMs(attempt: number): number {
  return 60_000 * 2 ** Math.min(Math.max(attempt, 1), MAX_ATTEMPTS - 1)
}
