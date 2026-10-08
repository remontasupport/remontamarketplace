// The admin area: one handler per entry of admin.contract.ts (U2). The pipeline has
// already verified the token, checked the ADMIN role, applied the per-user limits and
// parsed the query; the memo and the private-cache headers are its job too.
import { adminContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import type { Db } from '../../platform/persistence/db'
import { listSuspendedWorkers, listUsers } from './application/lists'
import { searchWorkers } from './application/search-workers'

export interface AdminModuleDeps {
  db: Db
  clock: Clock
}

export function adminHandlers(deps: AdminModuleDeps) {
  return defineHandlers(adminContract, {
    searchWorkers: async (req, ctx) => {
      const started = Date.now()
      const body = await searchWorkers(deps, req.query)
      // One line per search (U2-REL-01): counts and timing, never filter values or rows.
      ctx.log.info({ entry: 'admin.searchWorkers', durationMs: Date.now() - started, total: body.pagination.total, locality: body.appliedFilters.locality !== undefined, withinKm: body.appliedFilters.withinKm ?? null, unplaced: body.appliedFilters.unplaced === true }, 'admin search')
      return { status: 200, body }
    },

    listUsers: async (req) => ({ status: 200, body: await listUsers(deps, req.query) }),

    listSuspendedWorkers: async (req) => ({ status: 200, body: await listSuspendedWorkers(deps, req.query) }),
  })
}
