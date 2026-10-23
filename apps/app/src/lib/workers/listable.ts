// Who the public list may show (worker-activation U2, FR-5, BR-U3): a worker an admin has switched on whose account is
// not suspended. Used by `/api/public/workers` (the marketing site), which adds its own conditions beside it. Not by
// the signed-in client search (`/api/client/workers`: every unsuspended worker, user 2026-10-23) nor a client's
// assigned workers (`/api/client/workers/by-ids`, BR-U4).
import type { Prisma } from '@/generated/auth-client'

export const LISTABLE_WORKER = {
  isActivated: true,
  user: { status: 'ACTIVE' },
} as const satisfies Prisma.WorkerProfileWhereInput

/** The same rule as a predicate, for the tests (P6). */
export function isListable(w: { isActivated: boolean; status: string }): boolean {
  return w.isActivated === LISTABLE_WORKER.isActivated && w.status === LISTABLE_WORKER.user.status
}
