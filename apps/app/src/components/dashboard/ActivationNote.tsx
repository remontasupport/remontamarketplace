'use client'

// The worker's "awaiting approval" line on the dashboard home (worker-activation U2, A8, FR-10): shown while an admin
// has not switched the worker on, so clients cannot find them yet. One read of the worker's own state, never cached by
// the api; nothing while it loads or if it fails (a missing note is safer than a wrong one).
import { useEffect, useState } from 'react'
import type { ApiOutcome } from '@/lib/api/outcome'
import { workerApi } from '@/features/worker/api'

export const AWAITING_APPROVAL = 'Your profile is awaiting approval by Remonta.'

/** Show the line only for a definite "not activated" answer. */
export function showActivationNote(outcome: ApiOutcome<{ activated: boolean }> | null): boolean {
  return outcome?.kind === 'ok' && outcome.body.activated === false
}

export default function ActivationNote() {
  const [outcome, setOutcome] = useState<ApiOutcome<{ activated: boolean }> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    workerApi
      .getActivation({ signal: controller.signal })
      .then(setOutcome)
      .catch(() => {
        /* aborted on unmount, or failed: no note */
      })
    return () => controller.abort()
  }, [])

  if (!showActivationNote(outcome)) return null
  return (
    <p role="status" className="mx-auto mt-4 max-w-5xl rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      {AWAITING_APPROVAL}
    </p>
  )
}
