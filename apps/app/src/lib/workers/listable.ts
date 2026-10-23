// Who clients and the public may find (worker-activation U2, FR-5, BR-U3): a worker an admin has switched on whose
// account is not suspended. One declaration for the client search (`/api/client/workers`) and the public list
// (`/api/public/workers`); each adds its own conditions (names, bio, filters) beside it. Not applied to a client's
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
