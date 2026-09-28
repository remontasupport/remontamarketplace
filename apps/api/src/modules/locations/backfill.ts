// Step 10 backfill: a HOME row in worker_locations for every worker who has none,
// from the legacy worker_profiles columns (S1-data-model 2.2 item 4). Matching is
// legacy-match.ts's, on the `location` string and the postcode, never the city
// column alone (apps/app's parseLocation corrupts 23 suburbs). Nothing is guessed:
// an ambiguous or unknown address is listed for review and left without a HOME.
// Dry run unless `apply`; idempotent: a worker with a HOME is never touched.
import type { Db } from '../../platform/persistence/db'
import { unitOfWork } from '../../platform/persistence/db'
import { candidatePool, localityCandidates } from '../onboarding/reconciler'
import { placeHome, type Locality } from './domain/home'
import { matchLegacyLocation, type MatchResult } from './domain/legacy-match'

export interface ReviewRow {
  workerProfileId: string
  location: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  /** 'ambiguous: 3 candidates', 'unmatched: no-candidate', ... */
  why: string
}

export interface LocationBackfillReport {
  apply: boolean
  now: Date
  /** Workers who already had a HOME row (untouched). */
  alreadyPlaced: number
  /** Workers without a HOME row. */
  examined: number
  matched: { location: number; columns: number; postcode: number }
  written: number
  ambiguous: ReviewRow[]
  unmatched: ReviewRow[]
  /** Workers whose write failed (apply only); the run continues past them. */
  failed: { workerProfileId: string; error: string }[]
}

export interface BackfillOptions {
  apply: boolean
  now?: Date
  batch?: number
  onProgress?: (done: number) => void
}

const why = (m: MatchResult): string => (m.status === 'ambiguous' ? `ambiguous: ${m.candidates} candidates` : m.status === 'unmatched' ? `unmatched: ${m.reason}` : m.status)

export async function backfillWorkerLocations(db: Db, opts: BackfillOptions): Promise<LocationBackfillReport> {
  const now = opts.now ?? new Date()
  const batch = opts.batch ?? 500
  const candidatesFor = localityCandidates(db)
  const report: LocationBackfillReport = {
    apply: opts.apply,
    now,
    alreadyPlaced: await db.workerLocation.count({ where: { kind: 'HOME' } }),
    examined: 0,
    matched: { location: 0, columns: 0, postcode: 0 },
    written: 0,
    ambiguous: [],
    unmatched: [],
    failed: [],
  }

  // Keyset paging on id: the filter shrinks as rows are written, so a Prisma cursor
  // (which must itself match the filter) would skip pages under --apply.
  let after = ''
  for (;;) {
    const page = await db.workerProfile.findMany({
      where: { locations: { none: { kind: 'HOME' } }, id: { gt: after } },
      select: { id: true, location: true, city: true, state: true, postalCode: true },
      orderBy: { id: 'asc' },
      take: batch,
    })
    if (page.length === 0) break
    after = page.at(-1)!.id

    for (const p of page) {
      report.examined++
      const match = matchLegacyLocation(p, await candidatePool(p, candidatesFor))
      const row = { workerProfileId: p.id, location: p.location, city: p.city, state: p.state, postalCode: p.postalCode, why: why(match) }
      if (match.status === 'ambiguous') {
        report.ambiguous.push(row)
        continue
      }
      if (match.status === 'unmatched') {
        report.unmatched.push(row)
        continue
      }
      report.matched[match.via]++
      if (!opts.apply) continue
      try {
        const written = await unitOfWork(db, async (tx) => {
          // Re-checked inside the transaction: the reconciler may have got there first.
          if (await tx.workerLocation.findFirst({ where: { workerProfileId: p.id, kind: 'HOME' }, select: { id: true } })) return false
          const locality = await tx.auLocality.findUniqueOrThrow({ where: { id: match.localityId } })
          const placed = placeHome(locality as Locality, 'BACKFILL')
          if (!placed.ok) throw new Error(`locality ${locality.id} retired since it was matched`)
          await tx.workerLocation.create({ data: { id: crypto.randomUUID(), workerProfileId: p.id, ...placed.home, updatedAt: now } })
          return true
        })
        if (written) report.written++
        else report.alreadyPlaced++
      } catch (err) {
        report.failed.push({ workerProfileId: p.id, error: err instanceof Error ? err.message : String(err) })
      }
    }
    opts.onProgress?.(report.examined)
    if (page.length < batch) break
  }
  return report
}

export function formatLocationReport(r: LocationBackfillReport, limit = 25): string {
  const list = (rows: ReviewRow[]) => [
    ...rows.slice(0, limit).map((x) => `    ${x.workerProfileId}  location=${JSON.stringify(x.location)} city=${JSON.stringify(x.city)} state=${JSON.stringify(x.state)} postcode=${JSON.stringify(x.postalCode)}  ${x.why}`),
    ...(rows.length > limit ? [`    ... ${rows.length - limit} more (see --report)`] : []),
  ]
  const m = r.matched
  const lines = [
    `${r.apply ? 'APPLIED' : 'DRY RUN (nothing written)'} at ${r.now.toISOString()}`,
    `  already placed (HOME exists)  ${r.alreadyPlaced}`,
    `  without a HOME                ${r.examined}`,
    `    matched    ${m.location + m.columns + m.postcode}  (by location string ${m.location}, by columns ${m.columns}, by single-suburb postcode ${m.postcode})${r.apply ? `  written: ${r.written}` : ''}`,
    `    ambiguous  ${r.ambiguous.length}  -- review, never guessed`,
    ...list(r.ambiguous),
    `    unmatched  ${r.unmatched.length}  -- review, never guessed`,
    ...list(r.unmatched),
  ]
  if (r.failed.length) lines.push(`  FAILED ${r.failed.length}`, ...r.failed.slice(0, limit).map((f) => `    ${f.workerProfileId}  ${f.error}`))
  return lines.join('\n')
}
