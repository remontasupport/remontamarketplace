# Code Generation Plan -- unit `admin-search` (U2)

**Single source of truth for this unit.** Design: `../admin-search/{functional-design,nfr-requirements,nfr-design}/`
(rules R1-R11, properties G1-G10, patterns P1-P10, scenarios S1-S12). Stories US-AS-01..07, 11, 13, 15..20 and the
app side of U1 (US-AS-08, 09; plan `api-identity-code-generation-plan.md` Part E). Requirements FR-ADM, FR-GEO,
FR-UI, FR-PLT-03..05, FR-CACHE, NFR-01/02/05/08/10/11/15..17.

Three PRs, each on its own code branch from `main`, in this order, each merged before the next is cut:

| PR | Branch | Parts | Merges after |
|---|---|---|---|
| **2** admin, api side | `feat/admin-search-api` | A contract, B platform (cache step, memo, error mapping), C the admin module, D tests, E the parity script, F docs | PR 1 is merged (so staging has the verifier) |
| **3** app switch | `feat/admin-search-app` | G the app's token side (U1 Part E), H the admin client, I the pages, J tests, K docs | PRs 1 and 2 promoted to production |
| **4** clean-up | `feat/admin-search-cleanup` | L deletions, M docs and state | production verified on the new path |

## Unit context

- **Implements**: the three admin entries, the filter registry as data, the one PostGIS statement, the two lists,
  the cache step and the memo, the canonical-query function, the parity and timing script, the app's token plumbing
  and admin client, the three screens on it, the deletions.
- **Depends on**: U1 (PR 1): `JwtAuthenticator`, `Principal.impersonatorId`, `auth.ts` constants. U2's api tests
  use the test-only `FakeAuthenticator`; the app tests use a fake token source.
- **Touches**: `packages/api-contract/src/{admin.contract.ts (new), canonical.ts (new), meta.ts, checks.ts,
  openapi.ts, index.ts}`, `openapi.json`, tests; `apps/api/src/platform/{pipeline/pipeline.ts, cache/response-memo.ts
  (new), errors.ts}`, `apps/api/src/modules/admin/** (new)`, `apps/api/src/main.ts`, `apps/api/scripts/
  parity-admin-search.ts (new)`, `parity-cases.json (new)`, `apps/api/package.json` (script), tests; `apps/app/src/
  app/api/auth/api-token/route.ts (new)`, `apps/app/src/lib/api/{token,admin}.ts (new)`, `apps/app/src/app/admin/
  AdminDashboardClient.tsx`, `apps/app/src/app/admin/impersonate/page.tsx`, `apps/app/package.json` (`jose`),
  tests; `docs/admin/README.md`, `docs/signup/03-data-model.md`, CLAUDE.md; PR 4: four routes,
  `lib/worker-search.ts`, the Redis key use.
- **Owns**: no data; the memo (process memory); the `admin` contract area.

## Guiding rules

- No schema change, no migration (D13). No `$queryRawUnsafe`. Every SQL value a bound parameter (`Prisma.sql`,
  `Prisma.join`).
- The filter table is data: one `FilterSpec` per filter; the statement composes fragments. Adding a filter later is
  one row, one contract field, one test.
- The page maps display values to canonical ones (Q1 A); the api never sees `all`, `none`, display names.
- Modify in place; the four old routes stay until PR 4.
- Tests cite rules and properties by id.

## PR 2 -- api side (`feat/admin-search-api`)

### Part A -- the contract (`packages/api-contract`)

- [x] **A1 `src/meta.ts`**: `privateCacheSeconds?: number` (int 1..3600) in `Meta` and the Zod schema, doc comment:
  "`Cache-Control: private, max-age=N` + ETag/304 on a role-restricted GET; never with `cacheSeconds`".
- [x] **A2 `src/checks.ts`**: `privateCacheSeconds` only on a GET whose `access` is not `'public'`; refused together
  with `cacheSeconds` (R8.4). `src/openapi.ts`: nothing to change (`x-remonta-security` carries the whole meta).
- [x] **A3 new `src/canonical.ts`**: `canonicalQueryOf(entry, input)` = `serializeCanonical(entry.query.parse(input))`;
  `serializeCanonical(parsed)`: keys sorted, `undefined`/`null`/empty arrays dropped, arrays sorted and joined with
  `,`, booleans and numbers stringified, `URLSearchParams` encoding (R8.5, G6). Exported from `index.ts`.
- [x] **A4 new `src/admin.contract.ts`**: `csv` helper (`z.preprocess(split/trim/dedupe/sort, z.array(...).max(20))`);
  `workerSearchQuerySchema` (R1.1 exactly: page, pageSize, sortBy, sortOrder, search, localityId, withinKm,
  unplaced, typeOfSupport, gender, hasVehicle, workerType, age, languages, therapeuticSubcategories,
  experienceWith with `CareDomain` values -- declared locally as the five literals, matching `packages/db`'s enum);
  `workerRowSchema`, `appliedFiltersSchema`, `workerSearchResponseSchema`, `userSearchQuerySchema`,
  `userRowSchema`, `userListResponseSchema`, `suspendedListQuerySchema`, `suspendedRowSchema`,
  `suspendedListResponseSchema`; constants `WITHIN_KM_MAX = 500`, `PAGE_SIZE_MAX = 100`, `AGE_RANGES`,
  `SORT_FIELDS`; the three entries with `meta({ access: { roles: ['ADMIN'] }, bot: 'none', rateLimit: [{ per: 'user',
  limit: 120, window: '1m' }, { per: 'ip', limit: 300, window: '1m' }], maxBodyKb: 1, privateCacheSeconds: 60 })` (60/120
  on the two lists). `index.ts`: export, `contracts` gains `adminContract`.
- [x] **A5 `pnpm --filter @remonta/api-contract openapi`**: `openapi.json` regenerated (three operations with a
  bearer `security` and `x-remonta-security`).
- [x] **A6 tests**: `test/contract.test.ts` (the three entries exist; the checks pass; a `privateCacheSeconds` on a
  public entry and with `cacheSeconds` are refused: two more rejecting rows); new `test/canonical.test.ts` (G6
  property with `fast-check`: round trip and order-independence over generated queries; csv parsing: split, trim,
  dedupe, sort, the 20-item cap); `test/openapi.test.ts` (drift). `pnpm --filter @remonta/api-contract run quality`.

### Part B -- the platform (`apps/api/src/platform`)

- [x] **B1 new `cache/response-memo.ts`**: `class ResponseMemo { constructor({ maxEntries = 500, ttlMs = 60_000,
  clock }) ; get(key, now?) ; set(key, body, now?) ; readonly size }` -- a `Map` in insertion order used as LRU
  (delete + re-insert on hit), expiry on read, eviction on set (R8.3).
- [x] **B2 `pipeline/pipeline.ts`**: `PipelineDeps.memo?: { store: ResponseMemo; entries: ReadonlySet<string> }`.
  After step 7 (the query is valid): `memoKey = memo && memo.entries.has(id) ? \`${id}|${serializeCanonical(query)}\` :
  undefined`; `bypass = /\bno-cache\b|\bmax-age=0\b/.test(request.headers['cache-control'] ?? '')`; if a key and not
  bypass and `store.get(key)` hits: `body = hit`, skip the handler and the response-schema check (the body was
  checked when stored). After the schema check on a 200: if a key, `store.set(key, out.data)`. Then, if
  `m.privateCacheSeconds` and status 200: `etag = '"sha256-' + base64url(sha256(JSON.stringify(body))) + '"'`;
  headers `etag`, `cache-control: private, max-age=N`, `vary: Authorization`; if `request.headers['if-none-match']
  === etag`: `reply.status(304).send()` (R8.1, R8.2). Keep `cacheSeconds`'s existing branch. The search log line of
  U2-REL-01 is the handler's (C8), the memo outcome is logged here: `request.log.info({ entry: id, memo: 'hit' })`
  on a hit.
- [x] **B3 `errors.ts`**: `isOverloadedDatabase` also true for a Prisma raw-query error whose `meta.code` is `'57014'`
  (statement timeout) or whose message contains `canceling statement due to statement timeout` (U2-AVAIL-01).
- [x] **B4 tests**: new `test/cache/response-memo.test.ts` (G7 model-based with `fast-check`: sequences of
  get/set/time; the bound; expiry), new `test/cache/pipeline-cache.test.ts` (`testApp` with a private GET entry
  carrying `privateCacheSeconds`: the three headers on 200; 304 on a matching `If-None-Match`; no headers on 400/401;
  memo hit skips the handler (a counter); `Cache-Control: no-cache` bypasses and refills; a 200 of another entry not
  memoised; G8); `test/pipeline.test.ts` unchanged; an `isOverloadedDatabase` case for 57014.

### Part C -- the admin module (`apps/api/src/modules/admin`)

- [x] **C1 new `domain/search-query.ts`**: `SearchQuery`, `normaliseQuery(raw, now)` (R1.2-R1.5; the age window
  R3.6; `ApiError(400, ..., { field: [...] })` for the invariants), `appliedFiltersOf`, `birthWindowOf`, `titleCase`,
  `escapeLike`.
- [x] **C2 new `application/filters.ts`**: `FilterSpec`, `FILTERS` (R3.1-R3.9 as `Prisma.sql` fragments), `whereOf(q)`
  (AND of the active fragments and R3.10).
- [x] **C3 new `persistence/worker-search-sql.ts`**: `searchStatement(q, localityId)`, `unplacedCountStatement(q)`
  (L3 verbatim: the joins, the scalar-subquery point, `ST_DWithin`, `ST_Distance ... AS distance_m`, `COUNT(*) OVER()
  AS total`, the sort map R5.1 with `p.id`, `LIMIT/OFFSET`), `runSearch(db, q, localityId, { statementTimeoutMs:
  5000 })` (one `$transaction` with `SET LOCAL statement_timeout`; the two statements; the empty-page total via a
  `COUNT(*)` when `page > 1` and no rows) and `RawWorkerRow`.
- [x] **C4 new `application/search-workers.ts`**: `searchWorkers(deps, raw)` (L1), `shapeRow` (L5, R6), `calculateAge`
  (today's function, ported), `localityLabelOf`.
- [x] **C5 new `application/list-users.ts`, `application/list-suspended.ts`** (L7, R9, R10).
- [x] **C6 new `admin.handlers.ts`**: `adminHandlers({ db, clock })` with the three handlers; the search handler logs
  `{ entry, durationMs, total, locality: boolean, withinKm }` at info (U2-REL-01).
- [x] **C7 `main.ts`**: `adminHandlers({ db, clock: systemClock })` in `handlerSets`; `deps.memo = { store: new
  ResponseMemo({ clock }), entries: new Set(['admin.searchWorkers']) }`.
- [x] **C8 `pnpm --filter @remonta/api run lint && typecheck`** green before the tests.

### Part D -- tests (`apps/api/test/admin`)

- [x] **D1 new `search-query.test.ts`**: R1.2-R1.5 examples; G5 (idempotence, `appliedFilters` round trip); the four
  age ranges at year boundaries (G9 oracle: today's `age` registry function ported into the test file).
- [x] **D2 new `filters.test.ts`**: G4 (one fragment per active filter, AND, nothing dropped: inspect the
  `Prisma.Sql` `strings`/`values`); each filter's fragment and parameters; `escapeLike`.
- [x] **D3 new `search-workers.test.ts`**: `shapeRow` (G10: never `abn`/`dateOfBirth`; the fallbacks; `distanceKm`
  rounding; `location` presence); `searchWorkers` with a fake `runSearch` and a fake locality read (400 on unknown;
  `appliedFilters.locality`; pagination maths R5.3).
- [x] **D4 new `harness.ts` + `search.int.test.ts`** (`describe.skipIf(!local)`): a domain-isolated fixture (the
  registration harness's pattern): 300 workers with users, profiles, services, experience, additional info, HOME rows
  at real `au_localities` points (30 % unplaced), deterministic from a seed; G1 (`fast-check` over locality + radius +
  a filter subset, 100 runs, Haversine oracle with a 0.5 % band, non-decreasing distances), G2 (pages partition,
  totals agree), G3 (placed + unplaced = all; disjoint); example cases: each filter alone, "Test Terson" both orders,
  `withinKm` without a locality (400), `sortBy=distance` without a locality (400), unknown locality (400), a page
  past the end, the unplaced list, city/state sort from the HOME locality; S1 (a `pg_sleep(6)` statement under the
  same `SET LOCAL` answers 503 with `Retry-After`); S3.
- [x] **D5 new `lists.int.test.ts`** (gated): the users picker (email, three profile names, role, 50 cap) and the
  suspended list (order, pagination), on the fixture.
- [ ] **D6 `pnpm --filter @remonta/api run quality`** green locally (gated suites skipped) and with
  `TEST_DATABASE_URL` + the containers (gated suites run) before pushing.

### Part E -- the parity and timing script

- [x] **E1 new `scripts/parity-cases.json`**: the 45 cases of the functional design plan Q3 A, each `{ name, old:
  "<today's query string>", new: { ...canonical query } }` (the old URL values mapped: category name -> id,
  display experience -> domain, `male` -> `Male`, `location`+`within` -> `localityId`+`withinKm`).
- [x] **E2 new `scripts/parity-admin-search.ts`**: flags `--old`, `--cookie`, `--new`, `--token`, `--cases`,
  `--time`; per case: old route (fetch with the cookie; `data[].id` sorted, `pagination.total`) vs the new entry
  (`createClient(adminContract)` with the bearer; `cache-control: no-cache`); report table; exit 1 on a difference
  without a suburb or an unexplained one with a suburb; `--time`: 10 runs each, p50/p95 per case and overall.
  `package.json` script `parity:admin-search`.

### Part F -- docs and summary

- [x] **F1 `docs/admin/README.md`** section 2: the three entries (parameters with canonical values, responses,
  errors, limits, the caches and `no-cache`, the parity procedure).
- [x] **F2 `aidlc-docs/construction/admin-search/code/pr2-summary.md`** and `pr2-verification.md` (staging checklist
  rows: the three entries with a token, `EXPLAIN ANALYZE`, parity, timing, S9, S12, then the joint promotion).
- [x] **F3** `npx turbo run build`; Prisma-noise check; commits per part; push; the compare link for the user.

## PR 3 -- the app switch (`feat/admin-search-app`)

### Part G -- the token side (U1 Part E)

- [x] **G1 `apps/app/package.json`**: `"jose": "^6.2.12"` (the lockfile gains the importer entry only, as PR 1).
- [x] **G2 new `src/app/api/auth/api-token/route.ts`**: L1/R2 (session; the account read through `withRetry`; 503
  on a db error; 401 inactive/role-changed; `checkServerActionRateLimit(userId, strictApiRateLimit)` fail-open with a
  warn; `SignJWT` with `kid: 'current'`, claims from `@remonta/api-contract`; `no-store`); `API_TOKEN_SECRET` read from
  the env (32+ bytes; a clear 500 + log if missing).
- [x] **G3 new `src/lib/api/token.ts`**: `createTokenSource` (L4, R5.1-R5.5), `Unauthenticated`, `Unavailable`.
- [x] **G4 tests**: `api-token.route.test.ts` (fake session/db/limiter: each branch, the claims shape, `no-store`),
  `token.test.ts` (P5 model-based; the retry table).

### Part H -- the admin client

- [x] **H1 new `src/lib/api/admin.ts`**: `adminApi` (L5/R5.6: the bearer header, one 401 retry, outcomes; canonical
  URLs by passing the parsed query through `serializeCanonical` so the URL the browser caches equals the memo key;
  `cache: 'default' | 'reload'`); `apiToken` exported for other screens later.
- [x] **H2 tests**: `admin.test.ts` (the 401 retry once; outcome mapping; `reload` sends `cache-control: no-cache`).

### Part I -- the screens

- [x] **I1 `AdminDashboardClient.tsx`**: R11.1-R11.8 and the frontend design: the suburb pick keeps `{id, label}`;
  "Within" gated; URL state (`localityId`, `localityLabel`, `withinKm`, `unplaced`, canonical filters); `toQuery`
  (display -> canonical; `category.id`; the `CareDomain` map); `fetchContractors` replaced by `adminApi.searchWorkers`;
  the distance column with its hint; the unmapped line and `unplaced` mode; the freshness line and refresh;
  notices per outcome (U1's contract); post-action reload; the document-filter state and the options fetch
  removed; `data-testid` on the new controls (`admin-search-suburb-input`, `admin-search-within-select`,
  `admin-search-apply-button`, `admin-search-refresh-button`, `admin-search-unmapped-link`, `admin-search-notice`).
- [x] **I2 `impersonate/page.tsx`**: `adminApi.listUsers`; the suspended panel: `adminApi.listSuspendedWorkers`.
- [x] **I3** `pnpm --filter @remonta/app run quality` green (baselines must not grow).

### Part J -- tests and checklist

- [x] **J1** `features`-level tests for `toQuery` (display -> canonical) and the URL state round trip through
  `canonicalQueryOf` (G6 on the app side).
- [x] **J2** `aidlc-docs/construction/admin-search/code/pr3-preview-checklist.md`: the preview checklist (integration
  scenario 3) with its rows; the Vercel rollback id re-recorded in CLAUDE.md before the merge (follow-up 3).

### Part K -- docs

- [x] **K1** CLAUDE.md "Reach" line (the admin lists are called on the api); `docs/signup/03-data-model.md` note
  (who reads `worker_locations`: the admin search); `docs/admin/README.md` (the app side); `pr3-summary.md`.

## PR 4 -- clean-up (`feat/admin-search-cleanup`)

- [x] **L1** delete `apps/app/src/app/api/admin/contractors/route.ts`, `api/admin/filters/route.ts`,
  `api/admin/users/route.ts`, `api/admin/contractors/inactive/route.ts`, `src/lib/worker-search.ts`; remove the
  `admin:contractors:v1` cache-key use; `pnpm --filter @remonta/app run quality` (the lint baseline may shrink, never
  grow); Semgrep/CodeQL unaffected.
- [x] **M1** `docs/admin/README.md` (the old routes gone), the state file's follow-up 1 (the admin reader moved; the
  client and public readers remain; the dual write stays), `pr4-summary.md`.

## Story coverage

| Story | Steps |
|---|---|
| US-AS-01 suburb by id | A4, I1 |
| US-AS-02 within X km nearest first | C2, C3, C4, D4 (G1), I1 |
| US-AS-03 any distance | C1, C3, D4 |
| US-AS-04 what the distance measures | C4 (`location`), I1 |
| US-AS-05 unmapped workers | C3 (unplaced count/list), D4 (G3), I1 |
| US-AS-06 every filter combined | C2, D2 (G4), D4, E1/E2 (parity) |
| US-AS-07 sort and page | C3, D4 (G2) |
| US-AS-08, 09 token (U1 app side) | G1-G4, H1 |
| US-AS-11 notices | H1, I1 |
| US-AS-13 the other lists | C5, D5, I2 |
| US-AS-15 one statement | C3, D4 (`EXPLAIN` in pr2-verification) |
| US-AS-16 parity | E1, E2, pr2-verification |
| US-AS-17 log and limits (U2 part) | A4 (limits), C6 (the line) |
| US-AS-19 the same search again | B2, H1 (canonical URLs, `reload`), I1 (freshness line) |
| US-AS-20 serve repeats from memory | B1, B2, B4 |
| US-AS-18 cut over (PRs 2-4) | F2, F3, J2, K1, L1, M1 |
