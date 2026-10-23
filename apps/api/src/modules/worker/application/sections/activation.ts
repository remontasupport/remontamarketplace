// worker-activation U1 (BR-9): whether an admin has switched the worker on, for the dashboard's "awaiting approval"
// note. Its own read, apart from the profile read: the deployed app parses that response strictly, so a new field
// there would break it before the app that understands it ships (as the tour's). Read only; only an admin writes it.
import type { ActivationView } from '@remonta/api-contract'
import type { FastifyBaseLogger } from 'fastify'
import type { Principal } from '../../../../platform/auth/authenticator'
import { readTransaction, type Db } from '../../../../platform/persistence/db'
import { PROFILE_READ_STATEMENT_TIMEOUT_MS } from '../../persistence/profile-read'
import { profileNotFound } from '../own-profile'

/** One statement by the profile's unique userId; no row is the profile read's 404. */
export async function readActivation(db: Db, principal: Principal, log: FastifyBaseLogger): Promise<ActivationView> {
  const row = await readTransaction(db, PROFILE_READ_STATEMENT_TIMEOUT_MS, (tx) =>
    tx.workerProfile.findUnique({ where: { userId: principal.userId }, select: { isActivated: true } }),
  )
  if (!row) throw profileNotFound(principal, log)
  return { activated: row.isActivated }
}
