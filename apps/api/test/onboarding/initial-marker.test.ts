// initialMarker: a worker's first marker from apps/app's rows, with the best
// available timestamps (S1-data-model 3.4). Shared by the backfill and the
// reconciler, so what it claims is checked as properties.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { initialMarker, obligationsFrom, type LegacyRequirement, type LegacyWorkerFacts, type RequirementStatus } from '../../src/modules/onboarding/domain/initial-marker'
import { countsOf, deriveStage, type Stage } from '../../src/modules/onboarding/domain/stage'

const NOW = new Date('2026-09-28T00:00:00Z')
const DAY = 86_400_000
const daysAgo = (d: number) => new Date(NOW.getTime() - d * DAY)

const req = (type: string, status: RequirementStatus, patch: Partial<LegacyRequirement> = {}): LegacyRequirement => ({
  requirementType: type,
  status,
  documentUrl: null,
  documentUploadedAt: null,
  submittedAt: null,
  reviewedAt: null,
  approvedAt: null,
  rejectedAt: null,
  expiresAt: null,
  createdAt: daysAgo(30),
  updatedAt: daysAgo(30),
  ...patch,
})
const worker = (patch: Partial<LegacyWorkerFacts> = {}): LegacyWorkerFacts => ({
  isPublished: false,
  createdAt: daysAgo(30),
  updatedAt: daysAgo(30),
  lastLoginAt: null,
  requirements: [],
  ...patch,
})

describe('initialMarker: the dates come from the rows', () => {
  it('a sign-up that never came back: SIGNED_UP since the day they registered, nothing estimated', () => {
    const m = initialMarker(worker(), NOW)
    expect(m).toMatchObject({ stage: 'SIGNED_UP', stageEnteredAt: daysAgo(30), signedUpAt: daysAgo(30), lastActivityAt: daysAgo(30), mandatoryTotal: 0, approximations: [] })
    expect(m.firstDocumentAt).toBeNull()
  })

  it('one of two uploaded: DOCUMENTS_IN_PROGRESS since that upload', () => {
    const m = initialMarker(
      worker({
        requirements: [
          req('police-check', 'SUBMITTED', { documentUploadedAt: daysAgo(20), submittedAt: daysAgo(20), updatedAt: daysAgo(20) }),
          req('wwcc', 'PENDING'),
        ],
      }),
      NOW,
    )
    expect(m).toMatchObject({ stage: 'DOCUMENTS_IN_PROGRESS', stageEnteredAt: daysAgo(20), firstDocumentAt: daysAgo(20), documentsSubmittedAt: null, lastActivityAt: daysAgo(20), mandatoryUploaded: 1 })
  })

  it('a new obligation after the uploads reopens the stage from the day it appeared', () => {
    const m = initialMarker(
      worker({
        requirements: [
          req('police-check', 'APPROVED', { documentUploadedAt: daysAgo(20), approvedAt: daysAgo(15), updatedAt: daysAgo(15) }),
          req('first-aid', 'PENDING', { createdAt: daysAgo(2), updatedAt: daysAgo(2) }),
        ],
      }),
      NOW,
    )
    expect(m).toMatchObject({ stage: 'DOCUMENTS_IN_PROGRESS', stageEnteredAt: daysAgo(2), firstDocumentAt: daysAgo(20) })
  })

  it('everything approved and published: the funnel dates, with publication estimated from the profile', () => {
    const m = initialMarker(
      worker({
        isPublished: true,
        updatedAt: daysAgo(3),
        lastLoginAt: daysAgo(1),
        requirements: [
          req('police-check', 'APPROVED', { documentUploadedAt: daysAgo(20), approvedAt: daysAgo(10), expiresAt: daysAgo(-300), updatedAt: daysAgo(10) }),
          req('wwcc', 'APPROVED', { documentUploadedAt: daysAgo(18), approvedAt: daysAgo(8), updatedAt: daysAgo(8) }),
        ],
      }),
      NOW,
    )
    expect(m).toMatchObject({
      stage: 'PUBLISHED',
      firstDocumentAt: daysAgo(20),
      documentsSubmittedAt: daysAgo(18),
      verifiedAt: daysAgo(8),
      publishedAt: daysAgo(3),
      stageEnteredAt: daysAgo(3),
      firstSignInAt: daysAgo(1),
      lastActivityAt: daysAgo(1),
      mandatoryApproved: 2,
    })
    expect(m.approximations).toEqual(['publishedAt = profile updatedAt (apps/app does not record publication)', 'firstSignInAt = last sign-in (apps/app keeps only the last)'])
  })

  it('a rejection: ACTION_REQUIRED since the review', () => {
    const m = initialMarker(
      worker({
        requirements: [
          req('police-check', 'REJECTED', { documentUploadedAt: daysAgo(20), reviewedAt: daysAgo(12), rejectedAt: daysAgo(12), updatedAt: daysAgo(12) }),
          req('wwcc', 'APPROVED', { documentUploadedAt: daysAgo(18), approvedAt: daysAgo(8), updatedAt: daysAgo(8) }),
        ],
      }),
      NOW,
    )
    expect(m).toMatchObject({ stage: 'ACTION_REQUIRED', stageEnteredAt: daysAgo(12), verifiedAt: null })
  })

  it('an approval that lapsed: ACTION_REQUIRED since the expiry, even though no row changed', () => {
    const m = initialMarker(worker({ requirements: [req('police-check', 'APPROVED', { documentUploadedAt: daysAgo(400), approvedAt: daysAgo(390), expiresAt: daysAgo(25), updatedAt: daysAgo(390) })] }), NOW)
    expect(m).toMatchObject({ stage: 'ACTION_REQUIRED', stageEnteredAt: daysAgo(25) })
  })

  it('an upload apps/app left undated falls back to the row updatedAt, not to now', () => {
    const m = initialMarker(worker({ requirements: [req('police-check', 'PENDING', { documentUrl: 'https://x/p.pdf' })] }), NOW)
    // updatedAt is the last resort for an upload date before `now`.
    expect(m).toMatchObject({ stage: 'DOCUMENTS_SUBMITTED', firstDocumentAt: daysAgo(30), documentsSubmittedAt: daysAgo(30), approximations: [] })
  })
})

// ---- properties ---------------------------------------------------------------
const past = fc.date({ min: new Date('2024-01-01'), max: new Date('2026-09-27T23:59:59Z'), noInvalidDate: true })
const optPast = fc.option(past, { nil: null })
const status = fc.constantFrom<RequirementStatus>('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED')
const anyRequirement: fc.Arbitrary<LegacyRequirement> = fc.record({
  requirementType: fc.constantFrom('a', 'b', 'c', 'd', 'e'),
  status,
  documentUrl: fc.option(fc.constant('https://x/doc.pdf'), { nil: null }),
  documentUploadedAt: optPast,
  submittedAt: optPast,
  reviewedAt: optPast,
  approvedAt: optPast,
  rejectedAt: optPast,
  expiresAt: fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2028-01-01'), noInvalidDate: true }), { nil: null }),
  createdAt: past,
  updatedAt: past,
})
const anyWorker: fc.Arbitrary<LegacyWorkerFacts> = fc.record({
  isPublished: fc.boolean(),
  createdAt: past,
  updatedAt: past,
  lastLoginAt: optPast,
  requirements: fc.array(anyRequirement, { maxLength: 8 }),
})

const inputDates = (w: LegacyWorkerFacts): Set<number> => {
  const s = new Set<number>([w.createdAt.getTime(), w.updatedAt.getTime()])
  if (w.lastLoginAt) s.add(w.lastLoginAt.getTime())
  for (const r of w.requirements) {
    for (const d of [r.documentUploadedAt, r.submittedAt, r.reviewedAt, r.approvedAt, r.rejectedAt, r.expiresAt, r.createdAt, r.updatedAt]) if (d) s.add(d.getTime())
  }
  return s
}

describe('initialMarker: properties', () => {
  it('the stage and counts are exactly deriveStage/countsOf over the same rows -- never anything else', () => {
    fc.assert(
      fc.property(anyWorker, (w) => {
        const facts = { obligations: obligationsFrom(w.requirements), published: w.isPublished, now: NOW }
        const m = initialMarker(w, NOW)
        expect(m.stage).toBe(deriveStage(facts))
        expect({ mandatoryTotal: m.mandatoryTotal, mandatoryUploaded: m.mandatoryUploaded, mandatoryApproved: m.mandatoryApproved }).toEqual(countsOf(facts))
      }),
      { numRuns: 500 },
    )
  })

  it('every timestamp is a date from the rows, or `now` -- and `now` is always declared as an estimate', () => {
    fc.assert(
      fc.property(anyWorker, (w) => {
        const m = initialMarker(w, NOW)
        const known = inputDates(w)
        const fields = ['stageEnteredAt', 'signedUpAt', 'firstSignInAt', 'firstDocumentAt', 'documentsSubmittedAt', 'verifiedAt', 'publishedAt', 'lastActivityAt'] as const
        for (const f of fields) {
          const d = m[f]
          if (!d) continue
          if (d.getTime() === NOW.getTime()) {
            expect(m.approximations.some((a) => a.startsWith(`${f} = now`)), `${f} is now but not declared`).toBe(true)
          } else {
            expect(known.has(d.getTime()), `${f} ${d.toISOString()} is not a date from the rows`).toBe(true)
          }
        }
      }),
      { numRuns: 500 },
    )
  })

  it('a milestone is set exactly when the stage reached it', () => {
    const at = (s: Stage, ...list: Stage[]) => list.includes(s)
    fc.assert(
      fc.property(anyWorker, (w) => {
        const m = initialMarker(w, NOW)
        expect(m.firstDocumentAt !== null).toBe(m.mandatoryUploaded > 0)
        expect(m.documentsSubmittedAt !== null).toBe(at(m.stage, 'DOCUMENTS_SUBMITTED', 'VERIFIED', 'PUBLISHED'))
        expect(m.verifiedAt !== null).toBe(at(m.stage, 'VERIFIED', 'PUBLISHED'))
        expect(m.publishedAt !== null).toBe(m.stage === 'PUBLISHED')
        expect(m.signedUpAt).toEqual(w.createdAt)
      }),
      { numRuns: 500 },
    )
  })

  it('is a pure function of the rows: the same rows give the same marker', () => {
    fc.assert(
      fc.property(anyWorker, (w) => {
        expect(initialMarker(w, NOW)).toEqual(initialMarker(structuredClone(w), NOW))
      }),
      { numRuns: 200 },
    )
  })
})
