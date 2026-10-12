// The service's own entries. The health check (U1 worker-area, NFR pattern P4): 200
// without a query while a transaction committed within RECENT_SUCCESS_MS; otherwise
// one SELECT 1 under a 2 s statement timeout, 200 on success, 503 on anything else.
// The startup probe always runs the query (nothing is recent at boot).
import { platformContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import { ApiError } from '../../platform/errors'
import { lastDbSuccessAt, readTransaction, type Db } from '../../platform/persistence/db'

export const RECENT_SUCCESS_MS = 30_000
export const HEALTH_QUERY_TIMEOUT_MS = 2000

export interface PlatformModuleDeps {
  db: Db
  clock: Clock
  /** Test seam: the recent-success reading (default: the persistence module's). */
  lastSuccessAt?: () => number | null
}

export function platformHandlers(deps: PlatformModuleDeps) {
  const last = deps.lastSuccessAt ?? lastDbSuccessAt
  return defineHandlers(platformContract, {
    health: async (_req, ctx) => {
      const since = last()
      const now = deps.clock().getTime()
      if (since !== null && now - since >= 0 && now - since <= RECENT_SUCCESS_MS) return { status: 200, body: { status: 'ok' } }
      try {
        await readTransaction(deps.db, HEALTH_QUERY_TIMEOUT_MS, async (tx) => {
          await tx.$queryRaw`SELECT 1`
        })
      } catch (err) {
        ctx.log.error({ err, reason: 'db' }, 'health query failed')
        throw new ApiError(503, 'database unreachable', undefined, undefined, 'db')
      }
      return { status: 200, body: { status: 'ok' } }
    },
  })
}
