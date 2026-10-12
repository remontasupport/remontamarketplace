// The completion backfill (U1 worker-area, R3.9, NFR pattern P14): for every worker
// profile, today's rows through completionOf, then persistCompletion. Dry run unless
// `apply`; idempotent (a second run changes nothing); re-runnable. Each worker is its
// own short transaction, so a failure skips one worker, never the batch.
import type { Db } from '../../platform/persistence/db'
import { unitOfWork } from '../../platform/persistence/db'
import { completionInputOf } from './application/get-profile'
import { completionOf, flagsOf, type CompletionFlags } from './domain/completion'
import { parseStoredFlags, persistCompletion, sameFlags } from './domain/persist-completion'
import { readProfileRowsPage } from './persistence/profile-read'

export interface CompletionBackfillReport {
  apply: boolean
  now: Date
  examined: number
  /** Profiles whose stored flags or profileCompleted differ from the computed value (written under --apply). */
  changed: number
  unchanged: number
  /** Per flag: how many turn on and how many turn off. */
  byFlag: Record<keyof CompletionFlags | 'profileCompleted', { on: number; off: number }>
  /** verificationStatus moved NOT_STARTED -> IN_PROGRESS. */
  verificationMoved: number
  /** The first few changes, for the eye (ids only). */
  sample: { workerProfileId: string; from: CompletionFlags; to: CompletionFlags; profileCompleted: boolean }[]
  failed: { workerProfileId: string; error: string }[]
}

export interface CompletionBackfillOptions {
  apply: boolean
  now?: Date
  batch?: number
  onProgress?: (done: number) => void
}

const FLAGS = ['accountDetails', 'compliance', 'trainings', 'services', 'profileCompleted'] as const

export async function backfillCompletion(db: Db, opts: CompletionBackfillOptions): Promise<CompletionBackfillReport> {
  const report: CompletionBackfillReport = {
    apply: opts.apply,
    now: opts.now ?? new Date(),
    examined: 0,
    changed: 0,
    unchanged: 0,
    byFlag: Object.fromEntries(FLAGS.map((f) => [f, { on: 0, off: 0 }])) as CompletionBackfillReport['byFlag'],
    verificationMoved: 0,
    sample: [],
    failed: [],
  }
  const batch = opts.batch ?? 200
  let after = ''
  for (;;) {
    // One transaction per page (a statement per relation for the whole page), not one per worker.
    const page = await readProfileRowsPage(db, after, batch)
    if (page.length === 0) break
    for (const rows of page) {
      const p = rows.profile
      report.examined++
      try {
        const completion = completionOf(completionInputOf(rows))
        const from = parseStoredFlags(p.setupProgress)
        const to = flagsOf(completion)
        const differs = !sameFlags(from, to) || completion.profileCompleted !== p.profileCompleted
        if (!differs) {
          report.unchanged++
          continue
        }
        report.changed++
        for (const f of FLAGS) {
          const before = f === 'profileCompleted' ? p.profileCompleted : from[f]
          const afterValue = f === 'profileCompleted' ? completion.profileCompleted : to[f]
          if (before !== afterValue) report.byFlag[f][afterValue ? 'on' : 'off']++
        }
        const anyTrue = FLAGS.some((f) => f !== 'profileCompleted' && to[f as keyof CompletionFlags])
        if (p.verificationStatus === 'NOT_STARTED' && anyTrue) report.verificationMoved++
        if (report.sample.length < 10) report.sample.push({ workerProfileId: p.id, from, to, profileCompleted: completion.profileCompleted })
        if (opts.apply) await unitOfWork(db, (tx) => persistCompletion(tx, p.id, completion))
      } catch (err) {
        report.failed.push({ workerProfileId: p.id, error: err instanceof Error ? err.message : String(err) })
      }
    }
    opts.onProgress?.(report.examined)
    after = page[page.length - 1]!.profile.id
  }
  return report
}

export function formatCompletionReport(r: CompletionBackfillReport): string {
  const lines = [
    `backfill-completion (${r.apply ? 'APPLIED' : 'dry run'}) at ${r.now.toISOString()}`,
    `  examined ${r.examined}: ${r.changed} would ${r.apply ? 'change (written)' : 'change'}, ${r.unchanged} unchanged, ${r.failed.length} failed`,
    `  verificationStatus NOT_STARTED -> IN_PROGRESS: ${r.verificationMoved}`,
    ...FLAGS.map((f) => `  ${f.padEnd(16)} on ${String(r.byFlag[f].on).padStart(5)}   off ${String(r.byFlag[f].off).padStart(5)}`),
  ]
  if (r.sample.length) lines.push('  sample:', ...r.sample.map((s) => `    ${s.workerProfileId}: ${JSON.stringify(s.from)} -> ${JSON.stringify(s.to)} profileCompleted=${s.profileCompleted}`))
  if (r.failed.length) lines.push('  failed:', ...r.failed.slice(0, 10).map((f) => `    ${f.workerProfileId}: ${f.error}`))
  return lines.join('\n')
}
