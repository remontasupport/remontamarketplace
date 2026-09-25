// OnboardingReconciler (S1-data-model 3.4): every 5 minutes, recomputes the
// onboarding marker for workers whose facts changed in apps/app, which still owns
// documents, reviews and sign-in in S1. The same deriveStage as the API; writes a
// transition with source RECONCILER; never touches apps/app's own tables.
//
// Which workers:
//   A. changed since the watermark: worker_profiles.updatedAt; a requirement's
//      updatedAt / submittedAt / reviewedAt; a requirement whose expiresAt has just
//      passed (time alone changes the stage); users.lastLoginAt;
//   B. workers with no marker yet -- signed up through the legacy page, or not yet
//      backfilled. They are picked up regardless of the watermark.
// The watermark moves only as far as A was fully processed, minus an overlap, so a
// row committed late is still seen; recomputing is idempotent.
import type { FastifyBaseLogger } from 'fastify'
import type { Job } from '../../platform/jobs/scheduler'
import type { Db, Tx } from '../../platform/persistence/db'
import { unitOfWork } from '../../platform/persistence/db'
import { placeHome, type Locality } from '../locations/domain/home'
import { matchLegacyLocation, type Candidate } from '../locations/domain/legacy-match'
import { countsOf, deriveStage, type Obligation, type Stage } from './domain/stage'
import { changeOf } from './domain/transitions'

export const OVERLAP_MS = 60_000

type RequirementStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export interface LegacyRequirement {
  requirementType: string
  status: RequirementStatus
  documentUrl: string | null
  documentUploadedAt: Date | null
  approvedAt: Date | null
  expiresAt: Date | null
  updatedAt: Date
}

/**
 * verification_requirements (isRequired rows) as deriveStage obligations. One per
 * requirementType -- the most recently updated row wins if there are several.
 */
export function obligationsFrom(reqs: readonly LegacyRequirement[]): Obligation[] {
  const latest = new Map<string, LegacyRequirement>()
  for (const r of reqs) {
    const prev = latest.get(r.requirementType)
    if (!prev || r.updatedAt > prev.updatedAt) latest.set(r.requirementType, r)
  }
  return [...latest.values()].map((r): Obligation => {
    switch (r.status) {
      case 'PENDING': // created by the catalogue; uploaded only if a document is attached
        return { id: r.requirementType, status: r.documentUrl || r.documentUploadedAt ? 'UPLOADED' : 'MISSING', expiresAt: null }
      case 'SUBMITTED':
        return { id: r.requirementType, status: 'UPLOADED', expiresAt: null }
      case 'APPROVED':
        return { id: r.requirementType, status: 'APPROVED', expiresAt: r.expiresAt }
      case 'EXPIRED': // an approval that lapsed
        return { id: r.requirementType, status: 'APPROVED', expiresAt: r.expiresAt ?? new Date(0) }
      case 'REJECTED':
        return { id: r.requirementType, status: 'REJECTED', expiresAt: null }
    }
  })
}

const maxDate = (...ds: (Date | null | undefined)[]) => ds.filter((d): d is Date => !!d).reduce<Date | null>((a, b) => (!a || b > a ? b : a), null)
const minDate = (...ds: (Date | null | undefined)[]) => ds.filter((d): d is Date => !!d).reduce<Date | null>((a, b) => (!a || b < a ? b : a), null)

export interface ReconcileOutcome {
  created: boolean
  changed: { from: Stage | null; to: Stage; singleStep: boolean } | null
  home: 'created' | 'moved' | 'unchanged' | 'unmatched' | 'ambiguous'
}

/** Recomputes one worker in one transaction. */
export async function reconcileWorker(tx: Tx, workerProfileId: string, now: Date, candidatesFor: (postcode: string) => Promise<Candidate[]>): Promise<ReconcileOutcome | null> {
  const p = await tx.workerProfile.findUnique({
    where: { id: workerProfileId },
    select: {
      id: true, isPublished: true, createdAt: true, updatedAt: true, location: true, city: true, state: true, postalCode: true,
      user: { select: { lastLoginAt: true } },
      verificationRequirements: {
        where: { isRequired: true },
        select: { requirementType: true, status: true, documentUrl: true, documentUploadedAt: true, approvedAt: true, expiresAt: true, updatedAt: true },
      },
    },
  })
  if (!p) return null
  const reqs = p.verificationRequirements as LegacyRequirement[]
  const obligations = obligationsFrom(reqs)
  const facts = { obligations, published: p.isPublished, now }
  const stage = deriveStage(facts)
  const counts = countsOf(facts)
  const marker = await tx.workerOnboarding.findUnique({ where: { workerProfileId } })

  const reached = (s: Stage[]) => s.includes(stage)
  const milestones = {
    firstSignInAt: marker?.firstSignInAt ?? p.user.lastLoginAt ?? null,
    firstDocumentAt: marker?.firstDocumentAt ?? (counts.mandatoryUploaded > 0 ? (minDate(...reqs.map((r) => r.documentUploadedAt)) ?? now) : null),
    documentsSubmittedAt: marker?.documentsSubmittedAt ?? (reached(['DOCUMENTS_SUBMITTED', 'VERIFIED', 'PUBLISHED']) ? now : null),
    verifiedAt: marker?.verifiedAt ?? (reached(['VERIFIED', 'PUBLISHED']) ? (maxDate(...reqs.map((r) => r.approvedAt)) ?? now) : null),
    publishedAt: marker?.publishedAt ?? (stage === 'PUBLISHED' ? now : null),
  }
  const lastActivityAt = maxDate(marker?.lastActivityAt, p.updatedAt, p.user.lastLoginAt, ...reqs.map((r) => r.updatedAt)) ?? now

  let changed: ReconcileOutcome['changed'] = null
  if (!marker) {
    await tx.workerOnboarding.create({
      data: { workerProfileId, stage, stageEnteredAt: now, signedUpAt: p.createdAt, lastActivityAt, ...milestones, ...counts, updatedAt: now },
    })
    changed = { from: null, to: stage, singleStep: stage === 'SIGNED_UP' }
  } else {
    const c = changeOf(marker.stage, stage, 'reconciled')
    // Optimistic lock: if the API changed the marker meanwhile, leave it for the next run.
    const upd = await tx.workerOnboarding.updateMany({
      where: { workerProfileId, version: marker.version },
      data: { stage, ...(c ? { stageEnteredAt: now } : {}), lastActivityAt, ...milestones, ...counts, version: { increment: 1 }, updatedAt: now },
    })
    if (upd.count === 0) return { created: false, changed: null, home: 'unchanged' }
    if (c) changed = { from: c.from, to: c.to, singleStep: c.singleStep }
  }
  if (changed) {
    await tx.workerOnboardingTransition.create({
      data: { workerProfileId, fromStage: changed.from, toStage: changed.to, at: now, cause: changed.singleStep ? 'reconciled' : 'reconciled (several changes at once)', source: 'RECONCILER' },
    })
  }

  return { created: !marker, changed, home: await reconcileHome(tx, p, now, candidatesFor) }
}

async function reconcileHome(
  tx: Tx,
  p: { id: string; location: string | null; city: string | null; state: string | null; postalCode: string | null },
  now: Date,
  candidatesFor: (postcode: string) => Promise<Candidate[]>,
): Promise<ReconcileOutcome['home']> {
  // The legacy page and legacy onboarding still write these columns in S1, so they
  // are the source of truth for where the worker is.
  const postcodes = new Set<string>()
  const fromLocation = p.location ? /(\d{4})\s*$/.exec(p.location)?.[1] : undefined
  if (fromLocation) postcodes.add(fromLocation)
  if (p.postalCode && /^\d{4}$/.test(p.postalCode.trim())) postcodes.add(p.postalCode.trim())
  const pool = new Map<string, Candidate[]>()
  for (const pc of postcodes) pool.set(pc, await candidatesFor(pc))
  const match = matchLegacyLocation(p, (pc) => pool.get(pc) ?? [])
  if (match.status !== 'matched') return match.status

  const home = await tx.workerLocation.findFirst({ where: { workerProfileId: p.id, kind: 'HOME' } })
  if (home?.localityId === match.localityId) return 'unchanged'
  const locality = await tx.auLocality.findUniqueOrThrow({ where: { id: match.localityId } })
  const placed = placeHome(locality as Locality, 'RECONCILER', home?.travelRadiusKm ?? undefined)
  if (!placed.ok) return 'unmatched'
  if (home) {
    await tx.workerLocation.update({ where: { id: home.id }, data: { localityId: locality.id, latitude: locality.latitude, longitude: locality.longitude, precision: 'LOCALITY', source: 'RECONCILER', updatedAt: now } })
    return 'moved'
  }
  await tx.workerLocation.create({ data: { id: crypto.randomUUID(), workerProfileId: p.id, ...placed.home, updatedAt: now } })
  return 'created'
}

export function onboardingReconcilerJob(db: Db, log: FastifyBaseLogger, opts: { everyMs: number; batch?: number }): Job {
  const batch = opts.batch ?? 500
  return {
    name: 'onboarding-reconciler',
    everyMs: opts.everyMs,
    timeoutMs: 4 * 60_000,
    async run({ watermark, now, signal }) {
      const since = watermark ?? new Date(0)
      const changedRows = await db.$queryRaw<{ pid: string; t: Date }[]>`
        WITH changes AS (
          SELECT id AS pid, "updatedAt" AS t FROM worker_profiles WHERE "updatedAt" > ${since}
          UNION ALL
          SELECT "workerProfileId", GREATEST("updatedAt", COALESCE("submittedAt", "updatedAt"), COALESCE("reviewedAt", "updatedAt"))
            FROM verification_requirements WHERE "updatedAt" > ${since} OR "submittedAt" > ${since} OR "reviewedAt" > ${since}
          UNION ALL
          SELECT "workerProfileId", "expiresAt" FROM verification_requirements WHERE "expiresAt" > ${since} AND "expiresAt" <= ${now}
          UNION ALL
          SELECT p.id, u."lastLoginAt" FROM users u JOIN worker_profiles p ON p."userId" = u.id WHERE u."lastLoginAt" > ${since}
        )
        SELECT pid, MAX(t) AS t FROM changes WHERE t <= ${now} GROUP BY pid ORDER BY MAX(t) LIMIT ${batch}`
      const unmarked = await db.$queryRaw<{ pid: string }[]>`
        SELECT p.id AS pid FROM worker_profiles p LEFT JOIN worker_onboarding o ON o."workerProfileId" = p.id
         WHERE o."workerProfileId" IS NULL ORDER BY p."createdAt" LIMIT ${batch}`

      const cache = new Map<string, Candidate[]>()
      const candidatesFor = async (postcode: string) => {
        let c = cache.get(postcode)
        if (!c) {
          c = await db.auLocality.findMany({ where: { postcode, retiredAt: null }, select: { id: true, searchName: true, state: true, postcode: true } })
          cache.set(postcode, c)
        }
        return c
      }

      const summary = { examined: 0, created: 0, stageChanges: 0, jumps: 0, home: { created: 0, moved: 0, unchanged: 0, unmatched: 0, ambiguous: 0 }, failed: 0 }
      let processedUpTo: Date | null = null
      let stoppedEarly = false
      const ids = [...new Set([...unmarked.map((r) => r.pid), ...changedRows.map((r) => r.pid)])]
      const changedAt = new Map(changedRows.map((r) => [r.pid, r.t]))
      for (const pid of ids) {
        if (signal.aborted) {
          stoppedEarly = true
          break
        }
        try {
          const o = await unitOfWork(db, (tx) => reconcileWorker(tx, pid, now, candidatesFor))
          summary.examined++
          if (o?.created) summary.created++
          if (o?.changed && o.changed.from !== null) {
            summary.stageChanges++
            if (!o.changed.singleStep) summary.jumps++
          }
          if (o) summary.home[o.home]++
        } catch (err) {
          summary.failed++
          log.error({ err, workerProfileId: pid }, 'reconcile failed; retried next run')
          stoppedEarly = true // do not move the watermark past a failure
          break
        }
        const t = changedAt.get(pid)
        if (t && (!processedUpTo || t > processedUpTo)) processedUpTo = t
      }

      // Everything changed up to `now` was seen unless the batch was full or we stopped.
      const complete = !stoppedEarly && changedRows.length < batch
      const next = complete ? new Date(now.getTime() - OVERLAP_MS) : processedUpTo ? new Date(processedUpTo.getTime() - OVERLAP_MS) : undefined
      return { summary, ...(next && next > since ? { watermark: next } : {}) }
    },
  }
}
