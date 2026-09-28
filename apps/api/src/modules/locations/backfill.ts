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
import { matchLegacyLocation, type MatchResult, type MatchVia } from './domain/legacy-match'

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
  matched: Record<MatchVia, number>
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
    matched: { location: 0, columns: 0, postcode: 0, 'suburb-in-text': 0, 'suburb-and-postcode': 0 },
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

    const pending: { workerProfileId: string; localityId: number }[] = []
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
      if (opts.apply) pending.push({ workerProfileId: p.id, localityId: match.localityId })
    }
    if (pending.length) await writeHomes(db, pending, now, report)
    opts.onProgress?.(report.examined)
    if (page.length < batch) break
  }
  return report
}

/**
 * One transaction per page: workers placed by now are skipped (the reconciler may
 * have got there first), the rest get their HOME in one createMany. If the page
 * fails as a whole, each worker is retried alone so the one bad row is reported
 * and the others still land.
 */
async function writeHomes(db: Db, items: readonly { workerProfileId: string; localityId: number }[], now: Date, report: LocationBackfillReport, perWorker = false): Promise<void> {
  try {
    const { written, skipped } = await unitOfWork(db, async (tx) => {
      const ids = items.map((i) => i.workerProfileId)
      const placedAlready = new Set((await tx.workerLocation.findMany({ where: { workerProfileId: { in: ids }, kind: 'HOME' }, select: { workerProfileId: true } })).map((r) => r.workerProfileId))
      const fresh = items.filter((i) => !placedAlready.has(i.workerProfileId))
      const localities = new Map((await tx.auLocality.findMany({ where: { id: { in: [...new Set(fresh.map((i) => i.localityId))] } } })).map((l) => [l.id, l as Locality]))
      const rows = fresh.map((i) => {
        const locality = localities.get(i.localityId)
        if (!locality) throw new Error(`locality ${i.localityId} missing`)
        const placed = placeHome(locality, 'BACKFILL')
        if (!placed.ok) throw new Error(`locality ${i.localityId} retired since it was matched`)
        return { id: crypto.randomUUID(), workerProfileId: i.workerProfileId, ...placed.home, updatedAt: now }
      })
      if (rows.length) await tx.workerLocation.createMany({ data: rows })
      return { written: rows.length, skipped: items.length - fresh.length }
    })
    report.written += written
    report.alreadyPlaced += skipped
  } catch (err) {
    if (!perWorker && items.length > 1) {
      for (const i of items) await writeHomes(db, [i], now, report, true)
      return
    }
    report.failed.push({ workerProfileId: items[0]!.workerProfileId, error: err instanceof Error ? err.message : String(err) })
  }
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
    `    matched    ${Object.values(m).reduce((a, x) => a + x, 0)}${r.apply ? `  written: ${r.written}` : ''}`,
    `      by the form's own string ${m.location} · by the columns ${m.columns} · suburb named inside a longer text ${m['suburb-in-text']} · suburb + postcode with a wrong state ${m['suburb-and-postcode']} · single-suburb postcode ${m.postcode}`,
    `    ambiguous  ${r.ambiguous.length}  -- review, never guessed`,
    ...list(r.ambiguous),
    `    unmatched  ${r.unmatched.length}  -- review, never guessed`,
    ...list(r.unmatched),
  ]
  if (r.failed.length) lines.push(`  FAILED ${r.failed.length}`, ...r.failed.slice(0, limit).map((f) => `    ${f.workerProfileId}  ${f.error}`))
  return lines.join('\n')
}
