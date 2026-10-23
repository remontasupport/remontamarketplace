// worker-activation U2 (A5): the account block's words and its one action.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { accountViewOf } from './WorkerAccountStatus'

describe('accountViewOf', () => {
  it('an active account offers Suspend; a suspended one Restore; visibility is the flag', () => {
    expect(accountViewOf({ status: 'ACTIVE', isActivated: false })).toEqual({ account: 'Active', visible: 'No', action: 'suspend' })
    expect(accountViewOf({ status: 'SUSPENDED', isActivated: true })).toEqual({ account: 'Suspended', visible: 'Yes', action: 'restore' })
  })

  it('any state other than ACTIVE offers Restore (the api restores from any of them), and the flag never decides it', () => {
    fc.assert(
      fc.property(fc.constantFrom('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION'), fc.boolean(), (status, isActivated) => {
        const v = accountViewOf({ status, isActivated })
        expect(v.action).toBe(status === 'ACTIVE' ? 'suspend' : 'restore')
        expect(v.visible).toBe(isActivated ? 'Yes' : 'No')
      }),
    )
  })
})
