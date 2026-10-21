// The dashboard tour's "seen" time (onboarding-tour U1; E1, BR-1..BR-10, L1-L2). A column of its own on
// worker_profiles, read and written apart from the profile read: the deployed app parses that response strictly,
// so a new field there would break it before the app that understands it ships.
import type { TourView } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import type { Principal } from '../../../../platform/auth/authenticator'
import { ApiError } from '../../../../platform/errors'
import { readTransaction, type Db, type Tx } from '../../../../platform/persistence/db'
import { PROFILE_READ_STATEMENT_TIMEOUT_MS } from '../../persistence/profile-read'
import { profileNotFound } from '../own-profile'

/** BR-10: the tour is the worker's own first visit; an admin looking on the worker's behalf must not use it up. */
export const TOUR_NOT_WHILE_IMPERSONATING = 'The tour is recorded only for the worker themselves, not while impersonating.'

const view = (seenAt: Date | null): TourView => ({ seenAt: seenAt ? seenAt.toISOString() : null })

/** L1: one statement by the profile's unique userId; no row is the profile read's 404 (BR-1). */
export async function readTour(db: Db, principal: Principal, log: FastifyBaseLogger): Promise<TourView> {
  const row = await readTransaction(db, PROFILE_READ_STATEMENT_TIMEOUT_MS, (tx) =>
    tx.workerProfile.findUnique({ where: { userId: principal.userId }, select: { tourSeenAt: true } }),
  )
  if (!row) throw profileNotFound(principal, log)
  return view(row.tourSeenAt)
}

/** BR-10, before any write: 403 while an admin impersonates the worker. */
export function assertNotImpersonating(principal: Principal): void {
  if (principal.impersonatorId) throw new ApiError(403, 'tour save while impersonating', { general: [TOUR_NOT_WHILE_IMPERSONATING] })
}

/**
 * L2 (inside replaceSection's transaction): the first time is kept (BR-3) in one statement, so two saves at once still
 * store one time; `now` is the api's clock, never a client value (BR-4). Raw SQL: `updatedAt` is left alone (seeing
 * the tour is not a profile change, E1).
 */
export async function markTourSeen(tx: Tx, profileId: string, now: Date): Promise<TourView> {
  const [row] = await tx.$queryRaw<{ tourSeenAt: Date | null }[]>`
    UPDATE worker_profiles SET "tourSeenAt" = COALESCE("tourSeenAt", ${now}) WHERE id = ${profileId} RETURNING "tourSeenAt"`
  return view(row?.tourSeenAt ?? null)
}
