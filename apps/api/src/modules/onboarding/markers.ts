// Writing a worker's FIRST onboarding marker and its opening transition. Three
// writers share this so they cannot disagree:
//   - the sign-up (openOnboarding): a brand-new worker, SIGNED_UP with no
//     obligations known yet -- the reconciler fills them in from the catalogue;
//   - the reconciler, when it meets a legacy worker without a marker;
//   - the step 10 backfill, in pages.
// The stage is always deriveStage's (domain/stage.ts); the dates come from the
// facts (domain/initial-marker.ts) or, for a sign-up, from the request clock.
import type { Tx } from '../../platform/persistence/db'
import { initialMarker, type LegacyRequirement } from './domain/initial-marker'
import { countsOf, deriveStage } from './domain/stage'

/** The verification_requirements columns the marker is derived from. */
export const REQUIREMENT_SELECT = {
  requirementType: true,
  status: true,
  documentUrl: true,
  documentUploadedAt: true,
  submittedAt: true,
  reviewedAt: true,
  approvedAt: true,
  rejectedAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Who wrote a marker or transition (worker_onboarding_transitions.source). */
export type MarkerSource = 'API' | 'RECONCILER' | 'BACKFILL'

/**
 * The marker a worker gets at sign-up: SIGNED_UP with zero counts. Obligations
 * come from the document catalogue (not in apps/api yet), so none are known here.
 */
export async function openOnboarding(tx: Tx, workerProfileId: string, now: Date, cause: string): Promise<void> {
  const facts = { obligations: [], published: false, now }
  const stage = deriveStage(facts)
  await tx.workerOnboarding.create({
    data: { workerProfileId, stage, stageEnteredAt: now, signedUpAt: now, lastActivityAt: now, ...countsOf(facts), updatedAt: now },
  })
  await tx.workerOnboardingTransition.create({ data: { workerProfileId, fromStage: null, toStage: stage, at: now, cause, source: 'API' } })
}

/** A worker who signed up through apps/app, as the reconciler and the backfill read them. */
export interface LegacyWorker {
  workerProfileId: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  requirements: readonly LegacyRequirement[]
}

/**
 * Writes a legacy worker's first marker and its opening transition (from nothing to
 * the derived stage), dated from the facts.
 */
export async function createInitialMarker(tx: Tx, w: LegacyWorker, now: Date, source: Exclude<MarkerSource, 'API'>, cause: string) {
  return (await createInitialMarkers(tx, [w], now, source, cause))[0]!
}

/**
 * The batched form the backfill uses: one createMany for the markers and one for
 * the opening transitions, whatever the page size -- a round trip per worker was
 * a second each against a remote database (rehearsal, 2026-09-28).
 */
export async function createInitialMarkers(tx: Tx, workers: readonly LegacyWorker[], now: Date, source: Exclude<MarkerSource, 'API'>, cause: string) {
  const markers = workers.map((w) => ({ workerProfileId: w.workerProfileId, ...initialMarker(w, now) }))
  if (markers.length === 0) return []
  await tx.workerOnboarding.createMany({ data: markers.map(({ approximations: _a, ...m }) => ({ ...m, updatedAt: now })) })
  await tx.workerOnboardingTransition.createMany({
    data: markers.map((m) => ({ workerProfileId: m.workerProfileId, fromStage: null, toStage: m.stage, at: m.stageEnteredAt, cause, source })),
  })
  return markers.map(({ workerProfileId: _id, ...m }) => m)
}
