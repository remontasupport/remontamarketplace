// A worker's FIRST onboarding marker, from the facts apps/app holds today (S1-data-model
// 3.4, "the backfill ... using the best available timestamps"). Pure. Used by the
// step 10 backfill (source BACKFILL) and by the reconciler when it meets a worker
// without a marker (source RECONCILER), so the two never disagree.
//
// The stage is deriveStage's, never anything else. The timestamps are the dates on
// the source rows; where a date does not exist (apps/app never recorded when a
// profile was published), the fallback is named in `approximations` so a report can
// say how much of the funnel is estimated.
import { countsOf, deriveStage, type Obligation, type Stage } from './stage'

export type RequirementStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

/** A verification_requirements row (isRequired), as the reconciler selects it. */
export interface LegacyRequirement {
  requirementType: string
  status: RequirementStatus
  documentUrl: string | null
  documentUploadedAt: Date | null
  submittedAt: Date | null
  reviewedAt: Date | null
  approvedAt: Date | null
  rejectedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface LegacyWorkerFacts {
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  /** isRequired rows only. */
  requirements: readonly LegacyRequirement[]
}

/**
 * verification_requirements (isRequired rows) as deriveStage obligations. One per
 * requirementType -- the most recently updated row wins if there are several.
 */
export function obligationsFrom(reqs: readonly LegacyRequirement[]): Obligation[] {
  return latestPerType(reqs).map((r): Obligation => {
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

export function latestPerType(reqs: readonly LegacyRequirement[]): LegacyRequirement[] {
  const latest = new Map<string, LegacyRequirement>()
  for (const r of reqs) {
    const prev = latest.get(r.requirementType)
    if (!prev || r.updatedAt > prev.updatedAt) latest.set(r.requirementType, r)
  }
  return [...latest.values()]
}

export type Approximation =
  | 'firstSignInAt = last sign-in (apps/app keeps only the last)'
  | 'firstDocumentAt = now (uploaded documents without a date)'
  | 'documentsSubmittedAt = now (uploaded documents without a date)'
  | 'verifiedAt = now (approvals without a date)'
  | 'publishedAt = profile updatedAt (apps/app does not record publication)'
  | 'stageEnteredAt = now (no dated fact for the stage)'

export interface InitialMarker {
  stage: Stage
  stageEnteredAt: Date
  signedUpAt: Date
  firstSignInAt: Date | null
  firstDocumentAt: Date | null
  documentsSubmittedAt: Date | null
  verifiedAt: Date | null
  publishedAt: Date | null
  lastActivityAt: Date
  mandatoryTotal: number
  mandatoryUploaded: number
  mandatoryApproved: number
  approximations: Approximation[]
}

export const maxDate = (...ds: (Date | null | undefined)[]) => ds.filter((d): d is Date => !!d).reduce<Date | null>((a, b) => (!a || b > a ? b : a), null)
export const minDate = (...ds: (Date | null | undefined)[]) => ds.filter((d): d is Date => !!d).reduce<Date | null>((a, b) => (!a || b < a ? b : a), null)

/** When a document was uploaded, as best the row says. null = nothing uploaded. */
const uploadedAt = (r: LegacyRequirement): Date | null => {
  const uploaded = r.status !== 'PENDING' || !!r.documentUrl || !!r.documentUploadedAt
  return uploaded ? (r.documentUploadedAt ?? r.submittedAt ?? r.updatedAt) : null
}

export function initialMarker(w: LegacyWorkerFacts, now: Date): InitialMarker {
  const rows = latestPerType(w.requirements)
  const obligations = obligationsFrom(w.requirements)
  const facts = { obligations, published: w.isPublished, now }
  const stage = deriveStage(facts)
  const counts = countsOf(facts)
  const approximations: Approximation[] = []
  const approx = <T>(value: T, note: Approximation): T => {
    approximations.push(note)
    return value
  }
  const reached = (...s: Stage[]) => s.includes(stage)

  const uploads = rows.map(uploadedAt)
  const firstDocumentAt = counts.mandatoryUploaded > 0 ? (minDate(...uploads) ?? approx(now, 'firstDocumentAt = now (uploaded documents without a date)')) : null
  const documentsSubmittedAt = reached('DOCUMENTS_SUBMITTED', 'VERIFIED', 'PUBLISHED')
    ? (maxDate(...uploads) ?? approx(now, 'documentsSubmittedAt = now (uploaded documents without a date)'))
    : null
  const verifiedAt = reached('VERIFIED', 'PUBLISHED')
    ? (maxDate(...rows.filter((r) => r.status === 'APPROVED' || r.status === 'EXPIRED').map((r) => r.approvedAt ?? r.reviewedAt)) ??
      approx(now, 'verifiedAt = now (approvals without a date)'))
    : null
  const publishedAt = stage === 'PUBLISHED' ? approx(w.updatedAt, 'publishedAt = profile updatedAt (apps/app does not record publication)') : null
  const firstSignInAt = w.lastLoginAt ? approx(w.lastLoginAt, 'firstSignInAt = last sign-in (apps/app keeps only the last)') : null

  const byStatus = (s: Obligation['status']) => rows.filter((r) => obligations.find((o) => o.id === r.requirementType)?.status === s)
  const lapsedAt = rows.filter((r) => r.status === 'EXPIRED' || (r.status === 'APPROVED' && r.expiresAt && r.expiresAt <= now)).map((r) => r.expiresAt ?? r.updatedAt)
  const entered: Date | null = (() => {
    switch (stage) {
      case 'SIGNED_UP':
        return w.createdAt
      case 'DOCUMENTS_IN_PROGRESS': // the first upload, or a later obligation that reopened the stage
        return maxDate(firstDocumentAt, ...byStatus('MISSING').map((r) => r.createdAt))
      case 'DOCUMENTS_SUBMITTED':
        return documentsSubmittedAt
      case 'VERIFIED':
        return verifiedAt
      case 'PUBLISHED':
        return publishedAt
      case 'ACTION_REQUIRED': {
        const rejectedAt = byStatus('REJECTED').map((r) => r.rejectedAt ?? r.reviewedAt ?? r.updatedAt)
        if (rejectedAt.length || lapsedAt.length) return maxDate(...rejectedAt, ...lapsedAt)
        // Published with an obligation missing (or none at all).
        return maxDate(...byStatus('MISSING').map((r) => r.createdAt)) ?? w.updatedAt
      }
    }
  })()

  return {
    stage,
    stageEnteredAt: entered ?? approx(now, 'stageEnteredAt = now (no dated fact for the stage)'),
    signedUpAt: w.createdAt,
    firstSignInAt,
    firstDocumentAt,
    documentsSubmittedAt,
    verifiedAt,
    publishedAt,
    lastActivityAt: maxDate(w.updatedAt, w.lastLoginAt, ...w.requirements.map((r) => r.updatedAt)) ?? now,
    ...counts,
    approximations,
  }
}
