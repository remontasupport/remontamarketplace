// The search area: one handler per entry of search.contract.ts (search-locations U1). The pipeline has already
// checked the caller (CLIENT or COORDINATOR, or none for the public list), applied the limits and parsed the query;
// the memo and the cache headers are its job too.
import { searchContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import type { Db } from '../../platform/persistence/db'
import { placeLookup } from '../locations/place-lookup'
import { searchForClient, searchPublic, type SearchDeps, type SearchNotes } from './application/search-workers'
import { serviceTerms } from './application/service-terms'

export interface SearchModuleDeps {
  db: Db
  clock: Clock
}

export function searchHandlers(deps: SearchModuleDeps) {
  const search: SearchDeps = { db: deps.db, places: placeLookup(deps.db), serviceTerms: serviceTerms(deps.db, deps.clock) }
  return defineHandlers(searchContract, {
    // One line per search: how the place was read, what degraded, counts and timing; never the text or the rows.
    searchWorkersForClient: async (req, ctx) => {
      const started = Date.now()
      const notes: SearchNotes = { place: 'none', keywordNamesFailed: false }
      const body = await searchForClient(search, req.query, notes)
      ctx.log.info({ entry: 'search.searchWorkersForClient', durationMs: Date.now() - started, total: body.pagination.total, place: notes.place, keywords: req.query.search !== undefined, keywordNamesFailed: notes.keywordNamesFailed, services: req.query.services?.length ?? 0, withinKm: req.query.within }, 'client worker search')
      return { status: 200, body }
    },

    searchPublicWorkers: async (req, ctx) => {
      const started = Date.now()
      const notes: SearchNotes = { place: 'none', keywordNamesFailed: false }
      const body = await searchPublic(search, req.query, notes)
      ctx.log.info({ entry: 'search.searchPublicWorkers', durationMs: Date.now() - started, total: body.pagination.total, place: notes.place, typeOfSupport: req.query.typeOfSupport ?? null, withinKm: req.query.within }, 'public worker search')
      return { status: 200, body }
    },
  })
}
