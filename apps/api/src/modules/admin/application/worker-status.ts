// worker-activation U1: the two admin switches on one worker (functional design BR-1..BR-4, BR-7, BR-8). Activation is
// the admin-set flag clients and the public list will read; suspension is the account's sign-in (users.status), which
// the card's switch wrote through the app's own route until now. Each changes its own column only, so neither ever
// moves the other (FR-7). The target state is in the body: a repeat answers the same and writes nothing new.
import type { WorkerActivation, WorkerSuspension } from '@remonta/api-contract'
import type { Clock } from '../../../platform/clock'
import { ApiError } from '../../../platform/errors'
import type { Db } from '../../../platform/persistence/db'

const notFound = () => new ApiError(404, 'worker not found')

/** BR-1, BR-2, BR-4: the flag only. `updatedAt` is left alone: being switched on is not a profile change (as the tour's time). */
export async function setWorkerActivation(deps: { db: Db }, workerId: string, activated: boolean): Promise<WorkerActivation> {
  const { count } = await deps.db.workerProfile.updateMany({ where: { id: workerId }, data: { isActivated: activated } })
  if (count === 0) throw notFound()
  return { workerId, activated }
}

/**
 * BR-7, BR-8: SUSPENDED or ACTIVE, on a WORKER account only (an admin's account is never reached through a worker id);
 * restoring sets ACTIVE from any other state, as the app's route did. No write when the status is already that one.
 */
export async function setWorkerSuspension(deps: { db: Db; clock: Clock }, workerId: string, suspended: boolean): Promise<WorkerSuspension> {
  const profile = await deps.db.workerProfile.findUnique({ where: { id: workerId }, select: { userId: true, user: { select: { role: true, status: true } } } })
  if (!profile || profile.user.role !== 'WORKER') throw notFound()
  const status = suspended ? 'SUSPENDED' : 'ACTIVE'
  if (profile.user.status !== status) {
    await deps.db.user.update({ where: { id: profile.userId }, data: { status, updatedAt: deps.clock() }, select: { id: true } })
  }
  return { workerId, suspended }
}
