// Ownership (U1 worker-area, R1, L1, NFR pattern P7). The principal is the worker
// (the token's `sub`); the profile is the one whose userId equals it; there is no
// path from a request value to a profile id. A WORKER principal with no profile row
// is a data fault: 404 WORKER_PROFILE_NOT_FOUND with the envelope, one warn line
// with the user id (R1.2). Foreign child rows are 404, never 403 (R1.3).
import type { FastifyBaseLogger } from 'fastify'
import type { Principal } from '../../../platform/auth/authenticator'
import { ApiError } from '../../../platform/errors'

export const WORKER_PROFILE_NOT_FOUND = 'WORKER_PROFILE_NOT_FOUND'

/** L1 step 2: served by the read's rows in U1 (the lookup is folded into the transaction, P1). */
export function profileNotFound(principal: Principal, log: FastifyBaseLogger): ApiError {
  log.warn({ userId: principal.userId, reason: WORKER_PROFILE_NOT_FOUND }, 'worker principal without a profile')
  return new ApiError(404, WORKER_PROFILE_NOT_FOUND)
}

/** What later units name by id in a path (R1.3); `jobApplication` is owned by `workerId = principal.userId`. */
export type OwnedKind = 'document' | 'photo' | 'jobApplication'

/**
 * R1.3: a child row's owner must be the principal's profile (or user, for job
 * applications). A mismatch -- or a missing row -- is 404; existence is never revealed.
 * U2+ pass the row they loaded; U1 ships the rule.
 */
export function assertOwned(kind: OwnedKind, row: { workerProfileId?: string; workerId?: string } | null, owner: { profileId: string; userId: string }): void {
  const ownerId = kind === 'jobApplication' ? row?.workerId : row?.workerProfileId
  const expected = kind === 'jobApplication' ? owner.userId : owner.profileId
  if (!row || ownerId !== expected) throw new ApiError(404, `${kind} not owned by the principal`)
}
