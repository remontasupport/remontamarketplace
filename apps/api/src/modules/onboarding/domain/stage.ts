// The onboarding marker's one rule (S1-data-model 3.3): the stage is DERIVED from
// facts, never set by a client (P1) or by hand. Pure: the same facts always give
// the same stage, whether the caller is the API (in the transaction that changed a
// fact), the reconciler, or the backfill.
//
// The facts are only what the source rows hold NOW -- documents, expiry,
// publication -- never the marker's own history. An earlier version used "was
// verified before"; a property test showed the reconciler (5-minute samples) and
// the backfill could then disagree with the API for the same worker (counterexample:
// upload, approve, new obligation). So a verified, unpublished worker given a new
// obligation is DOCUMENTS_IN_PROGRESS, not ACTION_REQUIRED (step 6, 2026-09-25).

export const STAGES = ['SIGNED_UP', 'DOCUMENTS_IN_PROGRESS', 'DOCUMENTS_SUBMITTED', 'ACTION_REQUIRED', 'VERIFIED', 'PUBLISHED'] as const
export type Stage = (typeof STAGES)[number]

/** A mandatory obligation's document, as today's verification_requirements has it. */
export type DocumentStatus = 'MISSING' | 'UPLOADED' | 'APPROVED' | 'REJECTED'

export interface Obligation {
  /** requirementType, e.g. 'police-check'. */
  id: string
  status: DocumentStatus
  /** Approval stops counting at this instant. null = does not expire. */
  expiresAt: Date | null
}

export interface OnboardingFacts {
  /** The worker's MANDATORY obligations only. */
  obligations: readonly Obligation[]
  published: boolean
  now: Date
}

const isCurrent = (o: Obligation, now: Date) => o.status === 'APPROVED' && (o.expiresAt === null || o.expiresAt.getTime() > now.getTime())
const isLapsed = (o: Obligation, now: Date) => o.status === 'APPROVED' && !isCurrent(o, now)

/**
 * The stage for these facts. Precedence, first match wins:
 *   1. a rejected or lapsed (expired) document         -> ACTION_REQUIRED
 *   2. published: a document missing (or none at all)  -> ACTION_REQUIRED,
 *      otherwise PUBLISHED -- including while a replacement awaits review, so a
 *      worker who renews early is not flagged as "waiting on the worker"
 *   3. every obligation approved and current           -> VERIFIED
 *   4. nothing uploaded                                -> SIGNED_UP
 *   5. some uploaded, some missing                     -> DOCUMENTS_IN_PROGRESS
 *   6. all uploaded, some awaiting review              -> DOCUMENTS_SUBMITTED
 * A worker with NO mandatory obligations is never VERIFIED or PUBLISHED by this
 * rule: "nothing to check" is not "checked" (decided 2026-09-25, step 6).
 */
export function deriveStage(f: OnboardingFacts): Stage {
  const obs = f.obligations
  if (obs.some((o) => o.status === 'REJECTED' || isLapsed(o, f.now))) return 'ACTION_REQUIRED'
  if (f.published) return obs.length === 0 || obs.some((o) => o.status === 'MISSING') ? 'ACTION_REQUIRED' : 'PUBLISHED'
  if (obs.length > 0 && obs.every((o) => isCurrent(o, f.now))) return 'VERIFIED'

  const missing = obs.filter((o) => o.status === 'MISSING').length
  const uploaded = obs.length - missing
  if (uploaded === 0) return 'SIGNED_UP'
  if (missing > 0) return 'DOCUMENTS_IN_PROGRESS'
  return 'DOCUMENTS_SUBMITTED'
}

/** Counts stored on worker_onboarding alongside the stage. */
export function countsOf(f: Pick<OnboardingFacts, 'obligations' | 'now'>) {
  return {
    mandatoryTotal: f.obligations.length,
    mandatoryUploaded: f.obligations.filter((o) => o.status !== 'MISSING').length,
    mandatoryApproved: f.obligations.filter((o) => isCurrent(o, f.now)).length,
  }
}
