// A test model of the real events that change a worker's onboarding facts
// (upload, review, expiry, obligations changing, publication). The property tests
// drive deriveStage with random sequences of them. Production code does not use
// this: it reads the facts from the rows (reconciler, backfill) or changes them
// through its own use cases.
import { deriveStage, type Obligation, type OnboardingFacts } from '../../src/modules/onboarding/domain/stage'

export type OnboardingEvent =
  | { kind: 'upload'; obligation: number }
  | { kind: 'approve'; obligation: number; validForDays: number | null }
  | { kind: 'reject'; obligation: number }
  | { kind: 'timePasses'; days: number }
  | { kind: 'obligationAdded'; id: string }
  | { kind: 'obligationRemoved'; obligation: number }
  | { kind: 'publish' }
  | { kind: 'unpublish' }

const DAY = 86_400_000

/**
 * Applies one event. Returns the same facts when the event does not apply (e.g.
 * approving a document that was not uploaded, publishing a worker who is not
 * VERIFIED) -- admins and workers cannot do those things.
 */
export function applyEvent(f: OnboardingFacts, e: OnboardingEvent): OnboardingFacts {
  const at = (i: number) => (f.obligations.length ? i % f.obligations.length : -1)
  const withObligation = (i: number, change: (o: Obligation) => Obligation | null): OnboardingFacts => {
    const idx = at(i)
    if (idx < 0) return f
    const o = change(f.obligations[idx]!)
    if (!o) return f
    return { ...f, obligations: f.obligations.map((x, k) => (k === idx ? o : x)) }
  }
  let next: OnboardingFacts
  switch (e.kind) {
    case 'upload': // a first upload, a replacement, or an early renewal: all go back to review
      next = withObligation(e.obligation, (o) => ({ ...o, status: 'UPLOADED', expiresAt: null }))
      break
    case 'approve':
      next = withObligation(e.obligation, (o) =>
        o.status === 'UPLOADED' ? { ...o, status: 'APPROVED', expiresAt: e.validForDays === null ? null : new Date(f.now.getTime() + e.validForDays * DAY) } : null,
      )
      break
    case 'reject':
      next = withObligation(e.obligation, (o) => (o.status === 'UPLOADED' ? { ...o, status: 'REJECTED', expiresAt: null } : null))
      break
    case 'timePasses':
      next = { ...f, now: new Date(f.now.getTime() + e.days * DAY) }
      break
    case 'obligationAdded':
      next = f.obligations.some((o) => o.id === e.id) ? f : { ...f, obligations: [...f.obligations, { id: e.id, status: 'MISSING', expiresAt: null }] }
      break
    case 'obligationRemoved': {
      const idx = at(e.obligation)
      next = idx < 0 ? f : { ...f, obligations: f.obligations.filter((_, k) => k !== idx) }
      break
    }
    case 'publish':
      next = !f.published && deriveStage(f) === 'VERIFIED' ? { ...f, published: true } : f
      break
    case 'unpublish':
      next = f.published ? { ...f, published: false } : f
      break
  }
  return next
}
