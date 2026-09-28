// The outbox dispatcher (S1-design 2.4). Inside apps/api for now; it can become its
// own process later, and SQS/BullMQ can replace claim() without touching modules.
//
// Claim: due PENDING events, plus PROCESSING events whose lease expired (a crashed
// dispatcher). No double delivery comes from the claim itself: it sets PROCESSING
// with a lease, and PostgreSQL re-checks that condition on any row it waited for.
// SKIP LOCKED makes concurrent dispatchers pass over rows being claimed instead of
// waiting on them (throughput, not correctness). Each claimed event runs with a timeout; success -> DONE, failure ->
// PENDING with exponential back-off, and after MAX_ATTEMPTS -> DEAD plus an alert log.
import type { FastifyBaseLogger } from 'fastify'
import type { Db } from '../persistence/db'
import { afterFailure, PermanentFailure, type OutboxEvent, type OutboxHandler } from './outbox'

export interface DispatcherOptions {
  batchSize?: number
  /** Per-event handler timeout; also the claim lease (plus a margin). */
  handlerTimeoutMs?: number
  now?: () => Date
}

export class OutboxDispatcher {
  private timer: NodeJS.Timeout | undefined
  private running: Promise<unknown> | undefined
  private readonly batchSize: number
  private readonly timeoutMs: number
  private readonly now: () => Date

  constructor(
    private readonly db: Db,
    private readonly handlers: ReadonlyMap<string, OutboxHandler>,
    private readonly log: FastifyBaseLogger,
    opts: DispatcherOptions = {},
  ) {
    this.batchSize = opts.batchSize ?? 20
    this.timeoutMs = opts.handlerTimeoutMs ?? 15_000
    this.now = opts.now ?? (() => new Date())
  }

  /** Claims and runs one batch. Returns how many events it processed. */
  async runOnce(): Promise<number> {
    const events = await this.claim()
    await Promise.all(events.map((e) => this.process(e)))
    return events.length
  }

  start(intervalMs: number): void {
    const tick = () => {
      this.running = this.runOnce()
        .catch((err) => this.log.error({ err }, 'outbox dispatch failed'))
        .finally(() => {
          if (this.timer !== undefined) this.timer = setTimeout(tick, intervalMs)
        })
    }
    this.timer = setTimeout(tick, intervalMs)
  }

  async stop(): Promise<void> {
    const t = this.timer
    this.timer = undefined
    if (t) clearTimeout(t)
    await this.running
  }

  private async claim(): Promise<OutboxEvent[]> {
    const now = this.now()
    const lease = new Date(now.getTime() + this.timeoutMs + 30_000)
    return this.db.$queryRaw<OutboxEvent[]>`
      UPDATE outbox_events SET status = 'PROCESSING', "lockedUntil" = ${lease}, attempts = attempts + 1
       WHERE id IN (
         SELECT id FROM outbox_events
          WHERE (status = 'PENDING' AND "nextAttemptAt" <= ${now})
             OR (status = 'PROCESSING' AND "lockedUntil" < ${now})
          ORDER BY "nextAttemptAt"
          LIMIT ${this.batchSize}
          FOR UPDATE SKIP LOCKED)
      RETURNING id, type, payload, attempts`
  }

  private async process(event: OutboxEvent): Promise<void> {
    const handler = this.handlers.get(event.type)
    try {
      if (!handler) throw new Error(`no handler for outbox event type ${event.type}`)
      const signal = AbortSignal.timeout(this.timeoutMs)
      await Promise.race([
        handler(event, signal),
        new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('handler timed out')), { once: true })),
      ])
      await this.db.$executeRaw`
        UPDATE outbox_events SET status = 'DONE', "processedAt" = ${this.now()}, "lockedUntil" = NULL, "lastError" = NULL
         WHERE id = ${event.id}::uuid`
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 1000)
      const { status, retryInMs } = afterFailure(event.attempts, !handler || err instanceof PermanentFailure)
      const dead = status === 'DEAD'
      const next = new Date(this.now().getTime() + retryInMs)
      await this.db.$executeRaw`
        UPDATE outbox_events
           SET status = ${dead ? 'DEAD' : 'PENDING'}::"OutboxStatus", "lockedUntil" = NULL,
               "lastError" = ${message}, "nextAttemptAt" = ${next}
         WHERE id = ${event.id}::uuid`
      if (dead) this.log.error({ outboxEventId: event.id, type: event.type, attempts: event.attempts, alert: 'outbox-dead-letter' }, 'outbox event is DEAD')
      else this.log.warn({ outboxEventId: event.id, type: event.type, attempts: event.attempts }, 'outbox event failed; will retry')
    }
  }
}
