// completion-sync (onboarding-tour C1; L4, CR-11, CP2-CP4, CP7): keeps the stored completion flags true where no api
// write recomputes them -- an admin's review of a document (the app's own routes), a document expiring, a catalogue
// change. Every 5 minutes it recomputes the workers whose documents changed since its watermark; once a day (the first
// run after 03:00 Australia/Sydney) it walks every worker, resuming across runs with a cursor kept in its summary. It
// writes only what differs (persistCompletion), under the stage's COMPLETION_MODEL. A worker's own saves already
// recompute inside their transaction (replaceSection), so they need no watermark here.
import type { FastifyBaseLogger } from 'fastify'
import type { Job, JobContext } from '../../platform/jobs/scheduler'
import { unitOfWork, type Db } from '../../platform/persistence/db'
import { storedCompletion, type CompletionModel } from './application/completion-items'
import { persistCompletion } from './domain/persist-completion'
import { readProfileRows, readProfileRowsPage, type ProfileRows } from './persistence/profile-read'

export const COMPLETION_SYNC_JOB = 'completion-sync'
export const COMPLETION_SYNC_ALERT = 'completion-sync-failed'
export const BATCH = 200
const OVERLAP_MS = 60_000
const FULL_PASS_HOUR = 3

export interface FullPassState {
  /** The Sydney date (YYYY-MM-DD) of the pass. */
  day: string
  /** The last profile id written, or null before the first page. */
  cursor: string | null
  done: boolean
}

export interface SyncSummary {
  checked: number
  changed: number
  failed: number
  fullPass: FullPassState | null
}

/** The Sydney calendar date and hour of an instant (the pass runs after 03:00 local, daylight saving included). */
export function sydneyClock(now: Date): { day: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) }
}

/** Whether this run continues or starts the day's full pass, and from where. */
export function fullPassFor(now: Date, last: unknown): FullPassState | null {
  const { day, hour } = sydneyClock(now)
  const prev = (last as { fullPass?: FullPassState | null } | null)?.fullPass ?? null
  if (prev && prev.day === day) return prev.done ? null : prev
  return hour >= FULL_PASS_HOUR ? { day, cursor: null, done: false } : null
}

export interface CompletionSyncDeps {
  db: Db
  log: FastifyBaseLogger
  model: CompletionModel
  everyMs: number
  /** Test seams. */
  changedSince?: (db: Db, since: Date, now: Date, take: number) => Promise<{ userId: string; t: Date }[]>
  page?: (db: Db, afterId: string, take: number) => Promise<ProfileRows[]>
  read?: (db: Db, userId: string) => Promise<ProfileRows | null>
  persist?: (rows: ProfileRows, model: CompletionModel) => Promise<boolean>
}

/** The workers whose documents changed (submitted, reviewed, updated) or expired since `since`. */
export async function documentsChangedSince(db: Db, since: Date, now: Date, take: number): Promise<{ userId: string; t: Date }[]> {
  return db.$queryRaw<{ userId: string; t: Date }[]>`
    WITH changes AS (
      SELECT "workerProfileId" AS pid, GREATEST("updatedAt", COALESCE("submittedAt", "updatedAt"), COALESCE("reviewedAt", "updatedAt")) AS t
        FROM verification_requirements WHERE "updatedAt" > ${since} OR "submittedAt" > ${since} OR "reviewedAt" > ${since}
      UNION ALL
      SELECT "workerProfileId", "expiresAt" FROM verification_requirements WHERE "expiresAt" > ${since} AND "expiresAt" <= ${now}
    )
    SELECT p."userId" AS "userId", MAX(c.t) AS t FROM changes c JOIN worker_profiles p ON p.id = c.pid
     WHERE c.t <= ${now} GROUP BY p."userId" ORDER BY MAX(c.t) LIMIT ${take}`
}

/** One worker: recompute under the model and write when it differs. Returns whether it changed. */
async function persistOne(db: Db, rows: ProfileRows, model: CompletionModel): Promise<boolean> {
  const out = await unitOfWork(db, (tx) => persistCompletion(tx, rows.profile.id, storedCompletion(rows, model), rows.profile))
  return out.changed
}

export function completionSyncJob(deps: CompletionSyncDeps): Job {
  const changedSince = deps.changedSince ?? documentsChangedSince
  const page = deps.page ?? readProfileRowsPage
  const read = deps.read ?? readProfileRows
  const persist = deps.persist ?? ((rows, model) => persistOne(deps.db, rows, model))
  return {
    name: COMPLETION_SYNC_JOB,
    everyMs: deps.everyMs,
    timeoutMs: 4 * 60_000,
    async run({ watermark, lastResult, now, signal }: JobContext) {
      const summary: SyncSummary = { checked: 0, changed: 0, failed: 0, fullPass: null }
      const one = async (rows: ProfileRows) => {
        summary.checked++
        if (await persist(rows, deps.model)) summary.changed++
      }
      try {
        // 1. The incremental part: documents changed since the watermark.
        const since = watermark ?? new Date(now.getTime() - deps.everyMs)
        const changed = await changedSince(deps.db, since, now, BATCH)
        let processedUpTo: Date | null = null
        let stopped = false
        for (const c of changed) {
          if (signal.aborted) {
            stopped = true
            break
          }
          const rows = await read(deps.db, c.userId)
          if (rows) await one(rows)
          if (!processedUpTo || c.t > processedUpTo) processedUpTo = c.t
        }
        const complete = !stopped && changed.length < BATCH
        const next = complete ? new Date(now.getTime() - OVERLAP_MS) : processedUpTo ? new Date(processedUpTo.getTime() - OVERLAP_MS) : undefined

        // 2. The day's full pass, a page at a time, resumable.
        let pass = fullPassFor(now, lastResult)
        while (pass && !pass.done && !signal.aborted) {
          const rowsPage = await page(deps.db, pass.cursor ?? '', BATCH)
          for (const rows of rowsPage) await one(rows)
          pass = rowsPage.length < BATCH ? { ...pass, cursor: rowsPage.at(-1)?.profile.id ?? pass.cursor, done: true } : { ...pass, cursor: rowsPage.at(-1)!.profile.id }
        }
        summary.fullPass = pass

        return { summary: summary as never, ...(next && next > since ? { watermark: next } : {}) }
      } catch (err) {
        summary.failed++
        // CP7: one tagged line per failed run; three in 15 minutes raise "completion-sync failing".
        deps.log.error({ err, job: COMPLETION_SYNC_JOB, alert: COMPLETION_SYNC_ALERT, checked: summary.checked, changed: summary.changed }, 'completion-sync failed')
        throw err
      }
    },
  }
}
