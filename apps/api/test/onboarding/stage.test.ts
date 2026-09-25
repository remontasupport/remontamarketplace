// deriveStage and the stage machine (S1-data-model 3.3). Each property below was
// also run against a deliberately broken rule and failed (see the step 6 notes).
import fc from 'fast-check'
import { describe, expect, it, vi } from 'vitest'
import { applyEvent, type OnboardingEvent } from './events'
import { countsOf, deriveStage, STAGES, type DocumentStatus, type Obligation, type OnboardingFacts } from '../../src/modules/onboarding/domain/stage'
import { changeOf, EDGES, isEdge } from '../../src/modules/onboarding/domain/transitions'

const NOW = new Date('2026-09-25T00:00:00Z')
const DAY = 86_400_000
const ob = (id: string, status: DocumentStatus, expiresInDays: number | null = null): Obligation => ({
  id,
  status,
  expiresAt: expiresInDays === null ? null : new Date(NOW.getTime() + expiresInDays * DAY),
})
const facts = (obligations: Obligation[], published = false): OnboardingFacts => ({ obligations, published, now: NOW })

describe('deriveStage: the rule, case by case', () => {
  it.each([
    ['just registered', facts([ob('a', 'MISSING'), ob('b', 'MISSING')]), 'SIGNED_UP'],
    ['no obligations evaluated yet', facts([]), 'SIGNED_UP'],
    ['one of two uploaded', facts([ob('a', 'UPLOADED'), ob('b', 'MISSING')]), 'DOCUMENTS_IN_PROGRESS'],
    ['one approved, one missing', facts([ob('a', 'APPROVED'), ob('b', 'MISSING')]), 'DOCUMENTS_IN_PROGRESS'],
    ['all uploaded, awaiting review', facts([ob('a', 'UPLOADED'), ob('b', 'APPROVED')]), 'DOCUMENTS_SUBMITTED'],
    ['one rejected', facts([ob('a', 'REJECTED'), ob('b', 'APPROVED')]), 'ACTION_REQUIRED'],
    ['one approved but expired', facts([ob('a', 'APPROVED', -1), ob('b', 'APPROVED')]), 'ACTION_REQUIRED'],
    ['all approved and current', facts([ob('a', 'APPROVED', 30), ob('b', 'APPROVED')]), 'VERIFIED'],
    ['expiring exactly now counts as expired', facts([ob('a', 'APPROVED', 0)]), 'ACTION_REQUIRED'],
    ['published and all current', facts([ob('a', 'APPROVED')], true), 'PUBLISHED'],
    ['published, renewal awaiting review', facts([ob('a', 'UPLOADED'), ob('b', 'APPROVED')], true), 'PUBLISHED'],
    ['published, a document expired', facts([ob('a', 'APPROVED', -1)], true), 'ACTION_REQUIRED'],
    ['published, a new obligation missing', facts([ob('a', 'APPROVED'), ob('b', 'MISSING')], true), 'ACTION_REQUIRED'],
    ['published with nothing to check', facts([], true), 'ACTION_REQUIRED'],
  ] as const)('%s -> %s', (_label, f, stage) => {
    expect(deriveStage(f)).toBe(stage)
  })
})

// ---- generators ----------------------------------------------------------------
// Biased towards uploaded/approved, so large all-uploaded sets (the late stages) occur often.
const status = fc.oneof(
  { weight: 1, arbitrary: fc.constant<DocumentStatus>('MISSING') },
  { weight: 3, arbitrary: fc.constant<DocumentStatus>('UPLOADED') },
  { weight: 4, arbitrary: fc.constant<DocumentStatus>('APPROVED') },
  { weight: 1, arbitrary: fc.constant<DocumentStatus>('REJECTED') },
)
const anyObligation = fc.record({
  id: fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'),
  status,
  expiresAt: fc.option(fc.date({ min: new Date('2025-01-01'), max: new Date('2028-01-01'), noInvalidDate: true }), { nil: null }),
})
const anyFacts: fc.Arbitrary<OnboardingFacts> = fc.record({
  obligations: fc.uniqueArray(anyObligation, { selector: (o) => o.id, maxLength: 10 }),
  published: fc.boolean(),
  now: fc.date({ min: new Date('2025-01-01'), max: new Date('2028-01-01'), noInvalidDate: true }),
})
const event: fc.Arbitrary<OnboardingEvent> = fc.oneof(
  fc.record({ kind: fc.constant('upload' as const), obligation: fc.nat(5) }),
  fc.record({ kind: fc.constant('approve' as const), obligation: fc.nat(5), validForDays: fc.option(fc.integer({ min: 1, max: 400 }), { nil: null }) }),
  fc.record({ kind: fc.constant('reject' as const), obligation: fc.nat(5) }),
  fc.record({ kind: fc.constant('timePasses' as const), days: fc.integer({ min: 1, max: 400 }) }),
  fc.record({ kind: fc.constant('obligationAdded' as const), id: fc.constantFrom('a', 'b', 'c', 'd', 'e') }),
  fc.record({ kind: fc.constant('obligationRemoved' as const), obligation: fc.nat(5) }),
  fc.constant({ kind: 'publish' as const }),
  fc.constant({ kind: 'unpublish' as const }),
)
/** A worker at registration: some mandatory obligations, nothing uploaded. */
const registered = fc
  .uniqueArray(fc.constantFrom('a', 'b', 'c'), { maxLength: 3 })
  .map((ids): OnboardingFacts => ({ obligations: ids.map((id) => ob(id, 'MISSING')), published: false, now: NOW }))

function run(start: OnboardingFacts, events: OnboardingEvent[], onChange: (before: string, after: string, e: OnboardingEvent) => void) {
  let f = start
  for (const e of events) {
    const before = deriveStage(f)
    f = applyEvent(f, e)
    const after = deriveStage(f)
    if (before !== after) onChange(before, after, e)
  }
  return f
}

describe('deriveStage properties', () => {
  it('is total: every possible set of facts has exactly one stage', () => {
    fc.assert(fc.property(anyFacts, (f) => STAGES.includes(deriveStage(f))), { numRuns: 5000 })
  })

  // What each stage MEANS, independent of how the rule is written.
  const current = (o: Obligation, now: Date) => o.status === 'APPROVED' && (o.expiresAt === null || o.expiresAt > now)
  it('a rejected or expired document always means ACTION_REQUIRED', () => {
    fc.assert(
      fc.property(anyFacts, (f) => {
        const problem = f.obligations.some((o) => o.status === 'REJECTED' || (o.status === 'APPROVED' && !current(o, f.now)))
        return !problem || deriveStage(f) === 'ACTION_REQUIRED'
      }),
      { numRuns: 3000 },
    )
  })
  it('VERIFIED and PUBLISHED mean every obligation is approved and current -- or, if live, under review', () => {
    fc.assert(
      fc.property(anyFacts, (f) => {
        const s = deriveStage(f)
        if (s === 'VERIFIED') return !f.published && f.obligations.length > 0 && f.obligations.every((o) => current(o, f.now))
        if (s === 'PUBLISHED') return f.published && f.obligations.length > 0 && f.obligations.every((o) => current(o, f.now) || o.status === 'UPLOADED')
        return true
      }),
      { numRuns: 3000 },
    )
  })
  it('a published worker is PUBLISHED or ACTION_REQUIRED, never back in a document stage', () => {
    fc.assert(fc.property(anyFacts, (f) => !f.published || ['PUBLISHED', 'ACTION_REQUIRED'].includes(deriveStage(f))), { numRuns: 3000 })
  })
  it('SIGNED_UP, IN_PROGRESS and SUBMITTED match the upload counts exactly', () => {
    fc.assert(
      fc.property(anyFacts, (f) => {
        const s = deriveStage(f)
        const missing = f.obligations.filter((o) => o.status === 'MISSING').length
        const uploaded = f.obligations.length - missing
        if (s === 'SIGNED_UP') return uploaded === 0
        if (s === 'DOCUMENTS_IN_PROGRESS') return uploaded > 0 && missing > 0
        if (s === 'DOCUMENTS_SUBMITTED') return missing === 0 && f.obligations.some((o) => o.status === 'UPLOADED')
        return true
      }),
      { numRuns: 3000 },
    )
  })
  it('depends on facts.now, never on the real clock', () => {
    fc.assert(
      fc.property(anyFacts, fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01'), noInvalidDate: true }), (f, wallClock) => {
        const before = deriveStage(f)
        vi.useFakeTimers()
        vi.setSystemTime(wallClock)
        try {
          return deriveStage(f) === before
        } finally {
          vi.useRealTimers()
        }
      }),
      { numRuns: 500 },
    )
  })

  it('is deterministic and ignores the order obligations are listed in', () => {
    fc.assert(
      fc.property(anyFacts, (f) => {
        const reversed = { ...f, obligations: [...f.obligations].reverse() }
        return deriveStage(f) === deriveStage({ ...f }) && deriveStage(f) === deriveStage(reversed)
      }),
    )
  })

  it('a newly registered worker is SIGNED_UP', () => {
    fc.assert(fc.property(registered, (f) => deriveStage(f) === 'SIGNED_UP'))
  })

  it('every change a single event causes is an edge of the stage machine', () => {
    fc.assert(
      fc.property(registered, fc.array(event, { maxLength: 40 }), (start, events) => {
        run(start, events, (before, after, e) => {
          if (!isEdge(before as never, after as never)) throw new Error(`${e.kind} caused ${before} -> ${after}, which is not an edge`)
        })
      }),
      { numRuns: 3000 },
    )
  })

  it('every listed edge has a witness: one real event that produces exactly it', () => {
    const M = (id: string) => ob(id, 'MISSING')
    const U = (id: string) => ob(id, 'UPLOADED')
    const A = (id: string, days: number | null = null) => ob(id, 'APPROVED', days)
    const R = (id: string) => ob(id, 'REJECTED')
    const witnesses: [string, OnboardingFacts, OnboardingEvent][] = [
      ['SIGNED_UP -> DOCUMENTS_IN_PROGRESS', facts([M('a'), M('b')]), { kind: 'upload', obligation: 0 }],
      ['SIGNED_UP -> DOCUMENTS_SUBMITTED', facts([M('a')]), { kind: 'upload', obligation: 0 }],
      ['DOCUMENTS_IN_PROGRESS -> DOCUMENTS_SUBMITTED', facts([U('a'), M('b')]), { kind: 'upload', obligation: 1 }],
      ['DOCUMENTS_IN_PROGRESS -> ACTION_REQUIRED', facts([U('a'), M('b')]), { kind: 'reject', obligation: 0 }],
      ['DOCUMENTS_IN_PROGRESS -> VERIFIED', facts([A('a'), M('b')]), { kind: 'obligationRemoved', obligation: 1 }],
      ['DOCUMENTS_IN_PROGRESS -> SIGNED_UP', facts([U('a'), M('b')]), { kind: 'obligationRemoved', obligation: 0 }],
      ['DOCUMENTS_SUBMITTED -> ACTION_REQUIRED', facts([U('a')]), { kind: 'reject', obligation: 0 }],
      ['DOCUMENTS_SUBMITTED -> VERIFIED', facts([U('a'), A('b')]), { kind: 'approve', obligation: 0, validForDays: null }],
      ['DOCUMENTS_SUBMITTED -> DOCUMENTS_IN_PROGRESS', facts([U('a')]), { kind: 'obligationAdded', id: 'b' }],
      ['DOCUMENTS_SUBMITTED -> SIGNED_UP', facts([U('a')]), { kind: 'obligationRemoved', obligation: 0 }],
      ['ACTION_REQUIRED -> DOCUMENTS_SUBMITTED', facts([R('a')]), { kind: 'upload', obligation: 0 }],
      ['ACTION_REQUIRED -> DOCUMENTS_IN_PROGRESS', facts([R('a'), M('b')]), { kind: 'upload', obligation: 0 }],
      ['ACTION_REQUIRED -> VERIFIED', facts([R('a'), A('b')]), { kind: 'obligationRemoved', obligation: 0 }],
      ['ACTION_REQUIRED -> PUBLISHED', facts([A('a', -1)], true), { kind: 'upload', obligation: 0 }],
      ['ACTION_REQUIRED -> SIGNED_UP', facts([R('a'), M('b')]), { kind: 'obligationRemoved', obligation: 0 }],
      ['VERIFIED -> PUBLISHED', facts([A('a')]), { kind: 'publish' }],
      ['VERIFIED -> ACTION_REQUIRED', facts([A('a', 10)]), { kind: 'timePasses', days: 11 }],
      ['VERIFIED -> DOCUMENTS_IN_PROGRESS', facts([A('a')]), { kind: 'obligationAdded', id: 'b' }],
      ['VERIFIED -> DOCUMENTS_SUBMITTED', facts([A('a')]), { kind: 'upload', obligation: 0 }],
      ['VERIFIED -> SIGNED_UP', facts([A('a')]), { kind: 'obligationRemoved', obligation: 0 }],
      ['PUBLISHED -> ACTION_REQUIRED', facts([A('a', 10)], true), { kind: 'timePasses', days: 11 }],
      ['PUBLISHED -> VERIFIED', facts([A('a')], true), { kind: 'unpublish' }],
      ['PUBLISHED -> DOCUMENTS_SUBMITTED', facts([U('a'), A('b')], true), { kind: 'unpublish' }],
    ]
    for (const [edge, f, e] of witnesses) expect(`${deriveStage(f)} -> ${deriveStage(applyEvent(f, e))}`, edge).toBe(edge)
    expect(witnesses.map(([edge]) => edge).sort()).toEqual(Object.keys(EDGES).sort())
  })

  it('the API, the reconciler and the backfill agree: replaying events = computing from the final facts', () => {
    fc.assert(
      fc.property(registered, fc.array(event, { maxLength: 40 }), fc.array(fc.boolean(), { maxLength: 40 }), (start, events, sampled) => {
        // API: recomputes after every event. Reconciler: only at sampled points, then its next run.
        let f = start
        let apiStage = deriveStage(f)
        let reconcilerStage = apiStage
        events.forEach((e, i) => {
          f = applyEvent(f, e)
          apiStage = deriveStage(f)
          if (sampled[i]) reconcilerStage = deriveStage(f)
        })
        reconcilerStage = deriveStage(f)
        // Backfill: only what the source rows hold.
        const backfill = deriveStage({ obligations: f.obligations.map((o) => ({ ...o })), published: f.published, now: f.now })
        expect(apiStage).toBe(backfill)
        expect(reconcilerStage).toBe(backfill)
      }),
    )
  })

  it('counts satisfy the worker_onboarding CHECK constraint', () => {
    fc.assert(
      fc.property(anyFacts, (f) => {
        const c = countsOf(f)
        return c.mandatoryTotal >= 0 && c.mandatoryUploaded <= c.mandatoryTotal && c.mandatoryApproved <= c.mandatoryUploaded
      }),
    )
  })
})

describe('changeOf', () => {
  it('records registration as the first step, and no change as nothing', () => {
    expect(changeOf(null, 'SIGNED_UP', 'WorkerRegistered')).toEqual({ from: null, to: 'SIGNED_UP', singleStep: true, cause: 'WorkerRegistered' })
    expect(changeOf('VERIFIED', 'VERIFIED', 'x')).toBeNull()
  })
  it('marks a reconciler jump that is not an edge', () => {
    expect(changeOf('SIGNED_UP', 'VERIFIED', 'reconciler')?.singleStep).toBe(false)
    expect(changeOf('SIGNED_UP', 'DOCUMENTS_IN_PROGRESS', 'reconciler')?.singleStep).toBe(true)
  })
})
