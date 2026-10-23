'use client'

// Suspend / Restore the worker's account (no sign-in) from the worker's admin page (worker-activation U2, A5), in the
// page's header actions (user, 2026-10-23: the button only, no status lines). Suspend asks first, Restore does not.
// Outside .profile-card, so never in the downloaded JPEG.
import { useState } from 'react'
import { adminApi } from '@/lib/api/admin'

export interface AccountState {
  /** users.status: ACTIVE, SUSPENDED, LOCKED or PENDING_VERIFICATION. */
  status: string
  /** worker_profiles.isActivated (the search card's Active switch); not shown here. */
  isActivated: boolean
}

/** The one action the button offers (pure, tested): any state other than ACTIVE can be restored. */
export function accountActionOf(s: Pick<AccountState, 'status'>): 'suspend' | 'restore' {
  return s.status === 'ACTIVE' ? 'suspend' : 'restore'
}

export default function WorkerAccountStatus({ workerId, initial }: { workerId: string; initial: AccountState }) {
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
    if (result.kind === 'ok') setStatus(result.body.suspended ? 'SUSPENDED' : 'ACTIVE')
    else setError(suspended ? 'The account could not be suspended. Please try again.' : 'The account could not be restored. Please try again.')
  }

  return (
    <div className="relative">
      {action === 'restore' ? (
        <button type="button" disabled={busy} onClick={() => void write(false)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Restoring...' : 'Restore account'}
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => setConfirming(true)} className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
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
      {error && <p className="absolute right-0 mt-2 w-72 text-sm text-red-700">{error}</p>}
    </div>
  )
}
