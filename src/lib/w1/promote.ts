/**
 * W1 — promoting the worker Json columns into typed tables.
 *
 * This is the CANONICAL mapping. `scripts/w1/backfill.js` holds a JavaScript
 * copy used for the initial production load; once dual-write is live the
 * reconcile pass runs through this module instead, so this becomes the single
 * implementation and the script retires.
 *
 * Contract while W1 is in progress (phases P4-P6):
 *   - the Json columns remain the SOURCE OF TRUTH
 *   - these tables are a derived copy, rebuilt from the Json on every write
 *   - so rebuilding from source is always safe, and always correct
 *
 * Every function here must be called inside the same transaction as the Json
 * write. Half a save is worse than none.
 */

import type { Prisma } from '@/generated/auth-client'

export type PromoteResult = {
  written: number
  skipped: string[]
}

/**
 * Transaction options for every dual-write path.
 *
 * Prisma closes an interactive transaction after 5s by default. A save now does
 * the Json write plus a delete and an insert, and if that ever exceeds the
 * default the whole save fails with "Transaction not found" — a message that
 * reads like a bug rather than a timeout. This was not hypothetical: the
 * pre-deploy reconcile hit exactly that against real data.
 *
 * 15s is a ceiling, not a target. The typical path is well under a second; this
 * only stops a slow moment from turning into a failed profile save.
 */
export const W1_TX = { timeout: 15_000, maxWait: 5_000 } as const

const DAYS = new Set([
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
])

const DOMAIN: Record<string, string> = {
  'disability': 'DISABILITY',
  'aged-care': 'AGED_CARE',
  'working-with-children': 'WORKING_WITH_CHILDREN',
  'mental-health': 'MENTAL_HEALTH',
  'chronic-medical': 'CHRONIC_MEDICAL',
}

/**
 * The reverse map, derived from DOMAIN rather than written out again, so the two
 * directions cannot drift. Reads need it: the UI keys experience by the original
 * slug, and treats the presence of a key as "this area is selected".
 */
export const DOMAIN_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(DOMAIN).map(([slug, enumValue]) => [enumValue, slug]),
)

/**
 * "HH:MM" to minutes from midnight. Null for anything else, so a bad value is
 * reported rather than silently becoming 0 — which would read as midnight.
 */
export function toMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/**
 * The inverse of toMinutes, kept beside it so the pair cannot drift.
 *
 * Zero-padding is not cosmetic. The availability UI parses the value as
 * `dayjs('2000-01-01T' + startTime)`, so "09:00" resolves and "9:00" does not,
 * and the save-side validation requires `^([0-1][0-9]|2[0-3]):[0-5][0-9]$`.
 *
 * Note the asymmetry this exposes: the column can hold an overnight span
 * (endMinute <= startMinute), which is why minutes replaced "HH:MM" strings in
 * the first place — but the UI rejects one, both in validateTimes and in the
 * zod refinement. No overnight spans exist in production today (measured: 0),
 * so nothing round-trips wrongly. Supporting them is follow-on UI work.
 */
export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const asObject = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null

const str = (v: unknown): string | null =>
  v === null || v === undefined ? null : String(v)

const bool = (v: unknown): boolean => v === true || v === 'true'

/**
 * Month fields hold month NAMES — "January" through "December", measured as
 * string in 100% of entries in round 9. An earlier version typed them as Int,
 * so Number("March") produced NaN and every month was written as null.
 *
 * endMonth is an empty string in 274 entries, meaning the worker is still there.
 * Empty and absent mean the same thing, so empty becomes null.
 */
const monthOrNull = (v: unknown): string | null => {
  const s = str(v)
  return s && s.trim() ? s.trim() : null
}

/** specificAreas and otherAreas are both arrays — 3,168 elements across 853 domains. */
const stringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((a): a is string => typeof a === 'string') : []

const intOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

/** jobHistory Json -> worker_job_history. Array order becomes sortOrder. */
export async function rebuildJobHistory(
  tx: Prisma.TransactionClient,
  workerProfileId: string,
  json: unknown,
): Promise<PromoteResult> {
  const skipped: string[] = []
  const rows: Prisma.WorkerJobHistoryCreateManyInput[] = []

  if (Array.isArray(json)) {
    json.forEach((raw, i) => {
      const e = asObject(raw)
      if (!e) return skipped.push(`entry ${i}: not an object`)
      const jobTitle = str(e.jobTitle)
      const company = str(e.company)
      // Both are NOT NULL. Skip rather than invent an empty string.
      if (!jobTitle || !company) {
        return skipped.push(`entry ${i}: missing ${!jobTitle ? 'jobTitle' : 'company'}`)
      }
      rows.push({
        workerProfileId,
        jobTitle,
        company,
        startMonth: monthOrNull(e.startMonth),
        startYear: intOrNull(e.startYear),
        endMonth: monthOrNull(e.endMonth),
        endYear: intOrNull(e.endYear),
        currentlyWorking: bool(e.currentlyWorking),
        sortOrder: i,
      })
    })
  }

  await tx.workerJobHistory.deleteMany({ where: { workerProfileId } })
  if (rows.length) await tx.workerJobHistory.createMany({ data: rows })
  return { written: rows.length, skipped }
}

/** education Json -> worker_education. Array order becomes sortOrder. */
export async function rebuildEducation(
  tx: Prisma.TransactionClient,
  workerProfileId: string,
  json: unknown,
): Promise<PromoteResult> {
  const skipped: string[] = []
  const rows: Prisma.WorkerEducationCreateManyInput[] = []

  if (Array.isArray(json)) {
    json.forEach((raw, i) => {
      const e = asObject(raw)
      if (!e) return skipped.push(`entry ${i}: not an object`)
      const institution = str(e.institution)
      const qualification = str(e.qualification)
      if (!institution || !qualification) {
        return skipped.push(`entry ${i}: missing ${!institution ? 'institution' : 'qualification'}`)
      }
      rows.push({
        workerProfileId,
        institution,
        qualification,
        startMonth: monthOrNull(e.startMonth),
        startYear: intOrNull(e.startYear),
        endMonth: monthOrNull(e.endMonth),
        endYear: intOrNull(e.endYear),
        currentlyStudying: bool(e.currentlyStudying),
        sortOrder: i,
      })
    })
  }

  await tx.workerEducation.deleteMany({ where: { workerProfileId } })
  if (rows.length) await tx.workerEducation.createMany({ data: rows })
  return { written: rows.length, skipped }
}

/**
 * availability Json -> worker_availability.
 *
 * A day holds either one slot object or an array of them, because
 * availability.service.ts collapses a single-element array to a bare object.
 * Both shapes are current and both must be handled.
 *
 * Unique on (worker, day, startMinute, endMinute): two slots sharing only a
 * start are legitimate — production holds Saturday 00:00-07:00 beside
 * 00:00-23:00 — so only an exact repeat is a duplicate.
 */
export async function rebuildAvailability(
  tx: Prisma.TransactionClient,
  workerProfileId: string,
  json: unknown,
): Promise<PromoteResult> {
  const skipped: string[] = []
  const rows: Prisma.WorkerAvailabilityCreateManyInput[] = []
  const obj = asObject(json)

  if (obj) {
    const seen = new Set<string>()
    for (const [day, value] of Object.entries(obj)) {
      if (!DAYS.has(day)) {
        skipped.push(`unknown day key "${day}"`)
        continue
      }
      const slots = Array.isArray(value) ? value : [value]
      slots.forEach((raw, i) => {
        const s = asObject(raw)
        if (!s) return skipped.push(`${day}: slot is not an object`)
        const startMinute = toMinutes(s.startTime)
        const endMinute = toMinutes(s.endTime)
        if (startMinute === null || endMinute === null) {
          return skipped.push(
            `${day}: unparseable ${startMinute === null ? 'startTime' : 'endTime'}`,
          )
        }
        const key = `${day}:${startMinute}:${endMinute}`
        if (seen.has(key)) {
          return skipped.push(`${day}: exact duplicate slot ${s.startTime}-${s.endTime}`)
        }
        seen.add(key)
        rows.push({
          workerProfileId,
          dayOfWeek: day as Prisma.WorkerAvailabilityCreateManyInput['dayOfWeek'],
          startMinute,
          endMinute,
          sortOrder: i,
        })
      })
    }
  } else if (Array.isArray(json)) {
    skipped.push('top level is an array, expected an object keyed by weekday')
  }

  await tx.workerAvailability.deleteMany({ where: { workerProfileId } })
  if (rows.length) await tx.workerAvailability.createMany({ data: rows })
  return { written: rows.length, skipped }
}

/** experience Json -> worker_experience. One row per care domain, max five. */
export async function rebuildExperience(
  tx: Prisma.TransactionClient,
  workerProfileId: string,
  json: unknown,
): Promise<PromoteResult> {
  const skipped: string[] = []
  const rows: Prisma.WorkerExperienceCreateManyInput[] = []
  const obj = asObject(json)

  if (obj) {
    for (const [slug, value] of Object.entries(obj)) {
      const domain = DOMAIN[slug]
      if (!domain) {
        skipped.push(`unknown domain key "${slug}"`)
        continue
      }
      const v = asObject(value)
      if (!v) {
        skipped.push(`${slug}: value is not an object`)
        continue
      }
      rows.push({
        workerProfileId,
        domain: domain as Prisma.WorkerExperienceCreateManyInput['domain'],
        isProfessional: bool(v.isProfessional),
        isPersonal: bool(v.isPersonal),
        specificAreas: stringArray(v.specificAreas),
        otherAreas: stringArray(v.otherAreas),
        description: str(v.description),
      })
    }
  }

  await tx.workerExperience.deleteMany({ where: { workerProfileId } })
  if (rows.length) await tx.workerExperience.createMany({ data: rows })
  return { written: rows.length, skipped }
}

/**
 * Skips are not errors. The Json write is the source of truth and must succeed;
 * a malformed slot should not block a worker from saving their profile. Log it
 * so the parity checks have something to correlate against.
 */
export function logSkips(scope: string, workerId: string, result: PromoteResult): void {
  if (!result.skipped.length) return
  console.warn(
    `[w1:${scope}] worker ${workerId}: ${result.skipped.length} item(s) not promoted — ` +
      result.skipped.join('; '),
  )
}

/**
 * Run a rebuild so that its failure cannot break the worker's save.
 *
 * During phases P4 to P6 NOTHING READS these tables — the Json columns are
 * still the source of truth and still serve every read. So a rebuild failing
 * costs one worker a briefly stale derived copy, which the reconcile pass
 * repairs. A rebuild failing *inside* the save transaction would instead cost
 * that worker their profile save. The second is far worse, and the atomicity
 * it buys is worth nothing until reads move.
 *
 * Revisit at P5: once reads switch to these tables, staleness becomes visible
 * and atomicity starts earning its keep again.
 */
export async function safeRebuild(
  scope: string,
  workerId: string,
  run: () => Promise<PromoteResult>,
): Promise<void> {
  try {
    logSkips(scope, workerId, await run())
  } catch (err) {
    // Deliberately swallowed. The Json write has already committed and remains
    // authoritative; `npm run w1:reconcile` restores this worker's rows.
    console.error(
      `[w1:${scope}] worker ${workerId}: rebuild FAILED, derived rows are stale — ` +
        `${(err as Error).message}`,
    )
  }
}
