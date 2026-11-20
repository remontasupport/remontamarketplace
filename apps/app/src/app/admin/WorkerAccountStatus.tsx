'use client'

// Suspend / Restore the worker's account (no sign-in) (worker-activation U2, A5). On each admin dashboard card
// (user, 2026-11-20: was the worker's Edit Profile page). Suspend asks first, Restore does not. The dashboard lists
// ACTIVE accounts only, so a card offers Suspend and `onChange` takes the card off the list; Restore stays in
// "Suspended accounts".
import { useState } from 'react'
import { adminApi } from '@/lib/api/admin'

export interface AccountState {
  /** users.status: ACTIVE, SUSPENDED, LOCKED or PENDING_VERIFICATION. */
  status: string
}

/** The one action the button offers (pure, tested): any state other than ACTIVE can be restored. */
export function accountActionOf(s: Pick<AccountState, 'status'>): 'suspend' | 'restore' {
  return s.status === 'ACTIVE' ? 'suspend' : 'restore'
}

const BUTTON = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50'

export default function WorkerAccountStatus({
  workerId,
  initial,
  onChange,
}: {
  workerId: string
  initial: AccountState
  onChange?: (suspended: boolean) => void
}) {
  const [status, setStatus] = useState(initial.status)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const action = accountActionOf({ status })

  const write = async (suspended: boolean) => {
    setBusy(true)
    setError(null)
    const result = await adminApi.setWorkerSuspension(workerId, suspended)
    setBusy(false)
    setConfirming(false)
    if (result.kind === 'ok') {
      setStatus(result.body.suspended ? 'SUSPENDED' : 'ACTIVE')
      onChange?.(result.body.suspended)
    } else setError(suspended ? 'The account could not be suspended. Please try again.' : 'The account could not be restored. Please try again.')
  }

  return (
    // The card is clickable; the button and its confirmation are not part of that click.
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {action === 'restore' ? (
        <button type="button" disabled={busy} onClick={() => void write(false)} className={`${BUTTON} bg-indigo-600 text-white hover:bg-indigo-700`}>
          {busy ? 'Restoring...' : 'Restore account'}
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => setConfirming(true)} className={`${BUTTON} border border-red-300 bg-white text-red-700 hover:bg-red-50`}>
          Suspend account
        </button>
      )}
      {confirming && (
        <div role="alertdialog" aria-label="Suspend this account?" className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-red-200 bg-white p-3 text-sm shadow-lg">
          <p className="text-red-900">Suspend this account? The worker won&apos;t be able to sign in until it is restored.</p>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => setConfirming(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" disabled={busy} onClick={() => void write(true)} className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {busy ? 'Suspending...' : 'Suspend'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="absolute right-0 z-20 mt-2 w-72 rounded-md bg-white text-sm text-red-700">{error}</p>}
    </div>
  )
}
