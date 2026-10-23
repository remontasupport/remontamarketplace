'use client'

// The worker's account and visibility on their admin page (worker-activation U2, A5). Suspension (no sign-in) lives
// here since the search card's switch became the activation flag (FR-7): Suspend asks first, Restore does not. Outside
// .profile-card, so never in the downloaded JPEG.
import { useState } from 'react'
import { adminApi } from '@/lib/api/admin'

export interface AccountState {
  /** users.status: ACTIVE, SUSPENDED, LOCKED or PENDING_VERIFICATION. */
  status: string
  /** worker_profiles.isActivated: shown in the public worker list (signed-in clients see every unsuspended worker). */
  isActivated: boolean
}

/** The block's words and its one action (pure, tested). */
export function accountViewOf(s: AccountState): { account: string; visible: string; action: 'suspend' | 'restore' } {
  const suspended = s.status !== 'ACTIVE'
  return {
    account: s.status === 'ACTIVE' ? 'Active' : s.status === 'SUSPENDED' ? 'Suspended' : s.status === 'LOCKED' ? 'Locked' : 'Pending verification',
    visible: s.isActivated ? 'Yes' : 'No',
    action: suspended ? 'restore' : 'suspend',
  }
}

export default function WorkerAccountStatus({ workerId, initial }: { workerId: string; initial: AccountState }) {
  const [state, setState] = useState(initial)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const view = accountViewOf(state)

  const write = async (suspended: boolean) => {
    setBusy(true)
    setError(null)
    const result = await adminApi.setWorkerSuspension(workerId, suspended)
    setBusy(false)
    setConfirming(false)
    if (result.kind === 'ok') setState((s) => ({ ...s, status: result.body.suspended ? 'SUSPENDED' : 'ACTIVE' }))
    else setError(suspended ? 'The account could not be suspended. Please try again.' : 'The account could not be restored. Please try again.')
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-6">
          <p>
            <span className="text-gray-500">Account: </span>
            <span className={`font-medium ${view.account === 'Active' ? 'text-green-700' : 'text-red-700'}`}>{view.account}</span>
          </p>
          <p>
            <span className="text-gray-500">In the public worker list: </span>
            <span className="font-medium text-gray-900">{view.visible}</span>
            <span className="ml-1 text-xs text-gray-500">(the Active switch on the search card)</span>
          </p>
        </div>
        {view.action === 'restore' ? (
          <button type="button" disabled={busy} onClick={() => void write(false)} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? 'Restoring...' : 'Restore account'}
          </button>
        ) : !confirming ? (
          <button type="button" disabled={busy} onClick={() => setConfirming(true)} className="rounded-md border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
            Suspend account
          </button>
        ) : null}
      </div>
      {confirming && (
        <div role="alertdialog" aria-label="Suspend this account?" className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-red-900">Suspend this account? The worker won&apos;t be able to sign in until it is restored.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={() => setConfirming(false)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="button" disabled={busy} onClick={() => void write(true)} className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {busy ? 'Suspending...' : 'Suspend'}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-red-700">{error}</p>}
    </div>
  )
}
