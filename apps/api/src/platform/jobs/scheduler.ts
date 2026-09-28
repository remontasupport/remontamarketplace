// Scheduled jobs (S1-design 3.5: photo purge; S1-data-model 3.4: reconciler).
//
// Every instance ticks, but a job runs on one instance at a time: it must win a
// lease row in scheduled_jobs, the same pattern as the outbox claim. A crashed run
// releases itself when its lease expires. "Due" is judged from the job's last
// start, so adding instances does not run jobs more often.
import type { FastifyBaseLogger } from 'fastify'
import type { Db, Prisma } from '../persistence/db'

export interface JobContext {
  /** The previous run's watermark (reconciler), or null on the first run. */
  watermark: Date | null
  now: Date
  signal: AbortSignal
}

export interface JobResult {
  /** Stored as the next run's watermark when given. */
  watermark?: Date
  /** Counts and notes, stored as lastResult for inspection. */
  summary: Prisma.InputJsonValue
}

export interface Job {
  name: string
  everyMs: number
  /** Longest a run may take; also its lease. */
  timeoutMs: number
  run(ctx: JobContext): Promise<JobResult>
}

export class Scheduler {
  private timer: NodeJS.Timeout | undefined
  private running = new Set<Promise<unknown>>()

  constructor(
    private readonly db: Db,
    private readonly jobs: readonly Job[],
    private readonly log: FastifyBaseLogger,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  start(tickMs = 30_000): void {
    const tick = () => {
      for (const job of this.jobs) {
        const p = this.runIfDue(job)
          .catch((err) => this.log.error({ err, job: job.name }, 'scheduled job failed'))
          .finally(() => this.running.delete(p))
        this.running.add(p)
      }
      this.timer = setTimeout(tick, tickMs)
      this.timer.unref()
    }
    this.timer = setTimeout(tick, 1000)
    this.timer.unref()
  }

  async stop(): Promise<void> {
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    await Promise.allSettled([...this.running])
  }

  /** Runs `job` if it is due and this instance wins the lease. Returns whether it ran. */
  async runIfDue(job: Job): Promise<boolean> {
    const now = this.clock()
    await this.db.$executeRaw`INSERT INTO scheduled_jobs (name) VALUES (${job.name}) ON CONFLICT (name) DO NOTHING`
    const dueBefore = new Date(now.getTime() - job.everyMs)
    const lease = new Date(now.getTime() + job.timeoutMs)
    const won = await this.db.$queryRaw<{ watermark: Date | null }[]>`
      UPDATE scheduled_jobs SET "lockedUntil" = ${lease}, "lastStartedAt" = ${now}
       WHERE name = ${job.name}
         AND ("lockedUntil" IS NULL OR "lockedUntil" < ${now})
         AND ("lastStartedAt" IS NULL OR "lastStartedAt" <= ${dueBefore})
      RETURNING watermark`
    if (won.length === 0) return false

    const signal = AbortSignal.timeout(job.timeoutMs)
    try {
      const result = await job.run({ watermark: won[0]!.watermark, now, signal })
      await this.db.scheduledJob.update({
        where: { name: job.name },
        data: { lockedUntil: null, lastFinishedAt: this.clock(), lastResult: result.summary, ...(result.watermark ? { watermark: result.watermark } : {}) },
      })
      this.log.info({ job: job.name, result: result.summary }, 'scheduled job finished')
    } catch (err) {
      // Release the lease but keep the watermark: the next run retries the same window.
      await this.db.scheduledJob.update({
        where: { name: job.name },
        data: { lockedUntil: null, lastFinishedAt: this.clock(), lastResult: { error: err instanceof Error ? err.message.slice(0, 500) : String(err) } },
      })
      throw err
    }
    return true
  }
}
