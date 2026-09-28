// Step 10 backfill: a first onboarding marker for every worker who has none
// (S1-data-model 3.4). Dated from the facts (initialMarker), source BACKFILL.
// Dry run unless `apply`; idempotent: a worker who already has a marker is never
// touched, so a second run writes nothing.
import type { Db } from '../../platform/persistence/db'
import { unitOfWork } from '../../platform/persistence/db'
import { initialMarker, type Approximation, type LegacyRequirement } from './domain/initial-marker'
import { STAGES, type Stage } from './domain/stage'
import { createInitialMarker, REQUIREMENT_SELECT } from './reconciler'

export interface OnboardingBackfillReport {
  apply: boolean
  now: Date
  /** Workers who already had a marker (untouched). */
  alreadyMarked: number
  /** Workers without a marker: what they would get, or got. */
  examined: number
  written: number
  byStage: Record<Stage, number>
  /** How many markers used each estimate, so the funnel's precision is known. */
  approximations: Record<Approximation, number>
  /** Workers whose write failed (apply only); the run continues past them. */
  failed: { workerProfileId: string; error: string }[]
}

export interface BackfillOptions {
  apply: boolean
  now?: Date
  batch?: number
  onProgress?: (done: number) => void
}

export async function backfillWorkerOnboarding(db: Db, opts: BackfillOptions): Promise<OnboardingBackfillReport> {
  const now = opts.now ?? new Date()
  const batch = opts.batch ?? 500
  const report: OnboardingBackfillReport = {
    apply: opts.apply,
    now,
    alreadyMarked: await db.workerOnboarding.count(),
    examined: 0,
    written: 0,
    byStage: Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>,
    approximations: {} as Record<Approximation, number>,
    failed: [],
  }

  // Keyset paging on id: the filter shrinks as rows are written, so a Prisma cursor
  // (which must itself match the filter) would skip pages under --apply.
  let after = ''
  for (;;) {
    const page = await db.workerProfile.findMany({
      where: { onboarding: null, id: { gt: after } },
      select: {
        id: true, isPublished: true, createdAt: true, updatedAt: true,
        user: { select: { lastLoginAt: true } },
        verificationRequirements: { where: { isRequired: true }, select: REQUIREMENT_SELECT },
      },
      orderBy: { id: 'asc' },
      take: batch,
    })
    if (page.length === 0) break
    after = page.at(-1)!.id

    for (const p of page) {
      const w = { workerProfileId: p.id, isPublished: p.isPublished, createdAt: p.createdAt, updatedAt: p.updatedAt, lastLoginAt: p.user.lastLoginAt, requirements: p.verificationRequirements as LegacyRequirement[] }
      const m = initialMarker(w, now)
      report.examined++
      report.byStage[m.stage]++
      for (const a of m.approximations) report.approximations[a] = (report.approximations[a] ?? 0) + 1
      if (!opts.apply) continue
      try {
        const written = await unitOfWork(db, async (tx) => {
          // Re-checked inside the transaction: the reconciler may have got there first.
          if (await tx.workerOnboarding.findUnique({ where: { workerProfileId: p.id }, select: { workerProfileId: true } })) return false
          await createInitialMarker(tx, w, now, 'BACKFILL', 'backfill')
          return true
        })
        if (written) report.written++
        else report.alreadyMarked++
      } catch (err) {
        report.failed.push({ workerProfileId: p.id, error: err instanceof Error ? err.message : String(err) })
      }
    }
    opts.onProgress?.(report.examined)
    if (page.length < batch) break
  }
  return report
}

export function formatOnboardingReport(r: OnboardingBackfillReport): string {
  const lines = [
    `${r.apply ? 'APPLIED' : 'DRY RUN (nothing written)'} at ${r.now.toISOString()}`,
    `  already had a marker  ${r.alreadyMarked}`,
    `  without a marker      ${r.examined}${r.apply ? `  (written: ${r.written})` : ''}`,
    ...STAGES.map((s) => `    ${s.padEnd(22)} ${r.byStage[s]}`),
    `  estimated timestamps`,
    ...(Object.entries(r.approximations) as [Approximation, number][]).map(([a, n]) => `    ${n.toString().padStart(6)}  ${a}`),
  ]
  if (Object.keys(r.approximations).length === 0) lines.push('    none')
  if (r.failed.length) lines.push(`  FAILED ${r.failed.length}`, ...r.failed.slice(0, 25).map((f) => `    ${f.workerProfileId}  ${f.error}`))
  return lines.join('\n')
}
