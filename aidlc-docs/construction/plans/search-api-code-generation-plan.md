# U1 `search-api`: Code Generation plan (2026-10-28)

Design: `construction/search-api/functional-design/` (approved 2026-10-28). Branch `feat/search-api` from `main`
`832ce43`. One PR, api path only; merge → staging → comparison script → promote; U2 after. No database migration.
Nothing in `apps/app` or `apps/web` changes in this unit (the old routes keep serving until U2).

## Steps

1. [x] **Shared values** (`packages/schemas/src/data/serviceSlugs.ts`): the slug → category-name map
   (`SERVICE_SLUG_NAMES`, `as const`), exported; the app route keeps its copy until U2 deletes the route (one
   source after U2, CS-3).
2. [x] **Contract** (`packages/api-contract/src/search.contract.ts`, exported from `index.ts`): `clientWorkerQuerySchema`,
   `publicWorkerQuerySchema` (E1, E2 bounds), `clientWorkerCardSchema`, `publicWorkerCardSchema` (E4, E5), one
   `searchPaginationSchema` reused from the admin paging shape if it matches `{ total, page, pageSize, totalPages,
   hasNext, hasPrev }`, else declared once here. Entries `searchWorkersForClient` (`GET /v1/client/workers`, roles
   CLIENT + COORDINATOR, `WORKER_SEARCH_LIMITS`, `privateCacheSeconds: 60`) and `searchPublicWorkers`
   (`GET /v1/public/workers`, public, `bot: 'none'`, 600/min per IP + 3000/min global, `cacheSeconds: 60`).
   `public-endpoints.json` + its line; `openapi.json` regenerated (additions only).
3. [x] **Shared PostGIS terms** (`apps/api/src/modules/locations/persistence/home-sql.ts`): `HOME_JOIN`,
   `withinTerm(point, km)`, `distanceTerm(point)`, `localityPoint(id)`, `pointOf(lat, lng)`. The admin search's
   `FROM`, `locationTerm` and distance expression rewritten on them (same SQL text produced; its tests unchanged).
4. [x] **The place** (`modules/locations/domain/place.ts`, pure): `resolvePlace(text, lookup)` → `Place | null`,
   BR-P1..P4, using `matchLegacyLocation`, `normalisePostcode`, `normaliseState`; the lookup port's reader
   (`modules/locations/place-lookup.ts`): candidates by postcode (reusing `localityCandidates`), the centre of a
   postcode's current suburbs (`ST_Centroid(ST_Collect(point::geometry))`), current suburbs by search name (+ state).
5. [x] **Keywords** (`modules/search/domain/keywords.ts`, pure): `tokenize`, `isServiceToken`, the stop words, ported
   unchanged from `apps/app/src/app/api/client/workers/route.ts`; the service-name reader with a 1 h in-memory cache
   (`modules/search/application/service-terms.ts`), degrading to an empty set (BR-K5).
6. [x] **The statement** (`modules/search/persistence/worker-search-sql.ts`): one builder from a `SearchSpec`
   (eligibility, tokens, services, place, within, page) for both entries; the token conditions as `ILIKE` with
   escaped wildcards and `= ANY(...)` for the two arrays; order BR-O1/O2; `COUNT(*) OVER()`; the past-the-end total;
   the 5 s statement timeout in one short transaction (the admin search's pattern, shared if the lines are the same).
7. [x] **Application + handlers** (`modules/search/application/search-workers.ts`, `search.handlers.ts`): fill the
   spec from E1/E2, map rows to E4/E5; bound in `main.ts` beside the other handler sets (deps: `db`). One log line
   per request (place kind, token count, total, ms), as the admin search.
8. [x] **Comparison script** (`apps/api/scripts/search-compare.ts`): calls the old app routes (a staging preview URL
   + a client session cookie, given on the command line) and the new entries (staging api + a client token) over the
   NFR-2 grid; prints a table; exit code 1 on an unexplained difference. Reads explanations from the database
   (worker without HOME row; legacy point ≠ HOME point).
9. [x] **Tests**: unit and PBT for `resolvePlace` (P1), `tokenize`/`isServiceToken` (P2, plus today's examples from
   the route's comments as fixed cases), the spec filling and card mapping; the contract checks; database tests (CI):
   eligibility per entry, each token field, services, the radius at the boundary, FR-4, the order with ties
   (BR-O2), paging (P3), distances non-decreasing (P4), the admin search's existing tests still green after step 3.
10. [x] **Docs**: `docs/search/README.md` (the two entries, parameters, rules, limits); a line in CLAUDE.md's "Reach";
    the code summary in the record with a duplicate check (CS-1..CS-5).

Every gate for the touched packages (schemas, api-contract, api, infra render check unchanged) before pushing.

## Reused, not added

`matchLegacyLocation`, `localityCandidates`, `normalisePostcode`/`normaliseState`, the admin search's HOME join and
PostGIS terms (moved, step 3), `WORKER_SEARCH_LIMITS`, `defineContract`/`defineHandlers`, the pipeline's caching,
limits and 503 on timeout, the statement-timeout transaction pattern, `LISTABLE_WORKER`'s rule (same columns, in SQL).

## Before the merge

Nothing for the user: no secret, no migration, no infra change. After the merge: staging deploys; the comparison
script needs a client test account on the staging copy (an existing staging-only user, or one created there).
