// Delivered outbox events are kept 30 days (for tracing a complaint back to a
// send), then deleted daily. DEAD events are kept until someone looks at them.
import type { Job } from '../jobs/scheduler'
import type { Db } from '../persistence/db'

export const OUTBOX_RETENTION_DAYS = 30

export function outboxRetentionJob(db: Db): Job {
  return {
    name: 'outbox-retention',
    everyMs: 24 * 3_600_000,
    timeoutMs: 5 * 60_000,
    async run({ now }) {
      const before = new Date(now.getTime() - OUTBOX_RETENTION_DAYS * 86_400_000)
      const deleted = await db.$executeRaw`DELETE FROM outbox_events WHERE status = 'DONE' AND "processedAt" < ${before}`
      return { summary: { deleted } }
    },
  }
}
