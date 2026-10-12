// The worker area: one handler per entry of worker.contract.ts (U1 worker-area). The
// pipeline has already verified the token, checked the WORKER role, applied the
// per-user and per-IP limits; the private-cache headers and the 304 are its job too.
// One info line per request with ids and timing, never a name or a row (U1-SEC-06).
import { workerContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import type { Db } from '../../platform/persistence/db'
import { getProfile, type GetProfileDeps } from './application/get-profile'

export interface WorkerModuleDeps {
  db: Db
  clock: Clock
  /** Test seam: the read used instead of the transaction. */
  read?: GetProfileDeps['read']
}

export function workerHandlers(deps: WorkerModuleDeps) {
  return defineHandlers(workerContract, {
    getProfile: async (_req, ctx) => {
      const started = Date.now()
      // The pipeline admits WORKER principals only (R1.5); ctx.principal is never null here.
      const body = await getProfile({ db: deps.db, read: deps.read }, ctx.principal!, ctx.log)
      ctx.log.info({ entry: 'worker.getProfile', durationMs: Date.now() - started, userId: ctx.principal!.userId, percent: body.completion.percent }, 'worker profile read')
      return { status: 200, body }
    },
  })
}
