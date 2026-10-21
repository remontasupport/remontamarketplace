// U5d: which sessions a password change signs out.
import { describe, expect, it } from 'vitest'
import { sessionAfterPasswordCheck } from './sessionRevocation'

describe('sessionAfterPasswordCheck', () => {
  const changed = 1_800_000_000
  it('a session that signed in before the change is refused; at or after it is kept', () => {
    expect(sessionAfterPasswordCheck({ authAt: changed - 1 }, changed, changed + 100)).toEqual({ authAt: changed - 1, revoked: true })
    expect(sessionAfterPasswordCheck({ authAt: changed }, changed, changed + 100)).toEqual({ authAt: changed, revoked: false })
    expect(sessionAfterPasswordCheck({ authAt: changed + 5 }, changed, changed + 100)).toEqual({ authAt: changed + 5, revoked: false })
  })
  it('never changed: every session is kept; one without a sign-in time is given "now"', () => {
    expect(sessionAfterPasswordCheck({ authAt: 5 }, null, 99)).toEqual({ authAt: 5, revoked: false })
    expect(sessionAfterPasswordCheck({}, null, 99)).toEqual({ authAt: 99, revoked: false })
  })
  it('a session from before the check existed, after a change: refused', () => {
    expect(sessionAfterPasswordCheck({}, changed, changed + 100)).toEqual({ authAt: 0, revoked: true })
  })
})
