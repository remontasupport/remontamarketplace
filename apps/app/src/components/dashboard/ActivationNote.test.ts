// worker-activation U2 (A8): the line shows only for a definite "not activated".
import { describe, expect, it } from 'vitest'
import { AWAITING_APPROVAL, showActivationNote } from './ActivationNote'

describe('showActivationNote', () => {
  it('only an ok answer with activated false shows it; loading, errors and activated hide it', () => {
    expect(showActivationNote({ kind: 'ok', body: { activated: false } })).toBe(true)
    expect(showActivationNote({ kind: 'ok', body: { activated: true } })).toBe(false)
    expect(showActivationNote(null)).toBe(false)
    expect(showActivationNote({ kind: 'unavailable' })).toBe(false)
    expect(showActivationNote({ kind: 'unauthenticated' })).toBe(false)
  })

  it('the wording the user chose', () => {
    expect(AWAITING_APPROVAL).toBe('Your profile is awaiting approval by Remonta.')
  })
})
