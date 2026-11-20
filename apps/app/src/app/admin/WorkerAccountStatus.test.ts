// worker-activation U2 (A5): the account button's one action.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { accountActionOf } from './WorkerAccountStatus'

describe('accountActionOf', () => {
  it('an active account offers Suspend; any other state Restore (the api restores from any of them)', () => {
    fc.assert(
      fc.property(fc.constantFrom('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION'), (status) => {
        expect(accountActionOf({ status })).toBe(status === 'ACTIVE' ? 'suspend' : 'restore')
      }),
    )
  })
})
