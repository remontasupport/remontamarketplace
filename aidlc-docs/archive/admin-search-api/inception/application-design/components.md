# Components -- admin worker search on `apps/api`

**Sources:** `../plans/application-design-plan.md` (Q1 A one statement from typed fragments, Q2 A `jose` with the
claims in api-contract, Q3 A `/v1/admin/*` with comma-separated arrays, Q4 A `withinKm` 1-500; approved
2026-10-08); requirements with the 2026-10-08 amendment; stories US-AS-01..18.

Units: **U1 `api-identity`** = C1, C3, C4, C11, C12, C15 (and C13's token wiring). **U2 `admin-search`** = C2,
C5-C10, C13, C14, C16.

## Contract (packages/api-contract)

### C1 `auth.ts` -- the api token's claims (U1)
- **Purpose**: the one definition of what a token for the api contains, shared by the minter (`apps/app`) and the
  verifier (`apps/api`).
- **Responsibilities**: a strict Zod schema of the claims; the constants (issuer, audience, lifetime, allowed
  algorithm); the `Principal` shape derived from the claims. No signing here (P-6: Zod only).
- **Interface**: `apiTokenClaimsSchema`, `ApiTokenClaims`, `API_TOKEN_ISSUER`, `API_TOKEN_AUDIENCE`,
  `API_TOKEN_TTL_S`, `API_TOKEN_ALG`, `principalOf(claims)`.

### C2 `admin.contract.ts` -- three entries (U2)
- **Purpose**: declare the admin area once: paths, strict query schemas, response schemas, `meta()`.
- **Responsibilities**: `searchWorkers` GET `/v1/admin/workers`; `listUsers` GET `/v1/admin/users`;
  `listSuspendedWorkers` GET `/v1/admin/workers/suspended`; every entry `access: {roles: ['ADMIN']}`, `bot: 'none'`,
  per-user and per-IP limits (values at NFR Requirements), `maxBodyKb: 1`, no `cacheSeconds`. The query schemas
  parse the comma-separated arrays and the defaults the page sends (`all`, `none`). `contracts` in `index.ts`
  gains `adminContract`; `openapi.json` is regenerated; nothing is added to `public-endpoints.json`.
- **Interface**: `adminContract`, `workerSearchQuerySchema`, `workerSearchResponseSchema`, `workerRowSchema`,
  `userSearchQuerySchema`, `userListResponseSchema`, `suspendedListQuerySchema`, `suspendedListResponseSchema`,
  `WITHIN_KM_MAX = 500`, `PAGE_SIZE_MAX = 100`.

## Api (apps/api)

### C3 `JwtAuthenticator` -- the first real authenticator (U1)
- **Purpose**: turn an `Authorization: Bearer` header into a `Principal`, or refuse.
- **Responsibilities**: `jose.jwtVerify` with the shared secret, the one allowed algorithm, issuer, audience,
  expiry and not-before with a 30 s skew; parse the payload with `apiTokenClaimsSchema`; map to `Principal`;
  on any failure return `null` after one warn log line `{auth: 'rejected', reason, entry}` (the input for the
  auth-failure metric). Reads nothing from cookies or query strings.
- **Interface**: `class JwtAuthenticator implements Authenticator { constructor(opts: {secret: Uint8Array; clock?:
  Clock; log: Logger}); authenticate(headers): Promise<Principal | null> }`. `Principal` gains `impersonatorId?`.
- **Where**: `src/platform/auth/jwt-authenticator.ts`; wired in `main.ts`; `DenyAllAuthenticator` stays for tests.

### C4 `config.ts` -- the secret (U1)
- **Responsibilities**: `API_TOKEN_SECRET` required, at least 32 bytes after trimming, never echoed; the boot
  message names the variable when missing.

### C5 `search-query.ts` -- the pure query model (U2)
- **Purpose**: the parsed, normalised search request, independent of HTTP and SQL.
- **Responsibilities**: the age range to a birth-date window and an integer age window (today's rule); Title
  Case; the service id; sentinel defaults (`all`, `none`); the sort rules (`distance` only with a locality); the
  invariants (`withinKm` only with `localityId`; `unplaced` ignores the location). Pure: property-tested.
- **Interface**: `SearchQuery` type, `normaliseQuery(raw: WorkerSearchQuery, now: Date): SearchQuery`,
  `appliedFiltersOf(q: SearchQuery, locality?: LocalityRef): AppliedFilters`.
- **Where**: `src/modules/admin/domain/search-query.ts`.

### C6 `filters.ts` -- the registry as data (U2)
- **Purpose**: one row per filter: which column it reads and the SQL fragment it contributes.
- **Responsibilities**: the table of `FilterSpec` for name/mobile, type of support (by `categoryId`), therapeutic
  sub-categories, gender, vehicle, worker type (JSON path), age (date window with the integer fallback), languages
  (two sources), experience (all of), the always-on active condition; each returns a parameterised `Prisma.Sql`
  fragment or `null` when inactive. No filter knows about the others.
- **Interface**: `FilterSpec = { name; applies(q): boolean; sql(q): Prisma.Sql }`, `FILTERS: readonly FilterSpec[]`,
  `whereOf(q): Prisma.Sql` (AND of the active fragments plus the active condition).
- **Where**: `src/modules/admin/application/filters.ts`.

### C7 `worker-search-sql.ts` -- the statement (U2)
- **Purpose**: assemble and run the one statement: filters, the location term, the sort, the page, the counts.
- **Responsibilities**: the `FROM worker_profiles p JOIN users u ... LEFT JOIN worker_locations wl ON wl."workerProfileId" = p.id AND wl.kind = 'HOME' LEFT JOIN au_localities al ON al.id = wl."localityId"`
  skeleton; the search point from the locality's coordinates (`ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography`);
  `ST_DWithin(wl.point, $point, $metres)` when a radius is given; `wl.point IS NOT NULL` when a locality is given;
  `wl.point IS NULL` when `unplaced`; `ST_Distance(wl.point, $point)` as `distance_m`; `ORDER BY ... , p.id`;
  `LIMIT/OFFSET`; `COUNT(*) OVER()` as `total`; the unplaced count as a second statement in the same transaction
  (same filters, `wl.point IS NULL`); a statement timeout set per transaction. Only `$queryRaw` with tagged
  templates and `Prisma.sql`/`Prisma.join` fragments; `$queryRawUnsafe` is forbidden.
- **Interface**: `searchStatement(q: SearchQuery, point: Point | null): Prisma.Sql`,
  `unplacedCountStatement(q): Prisma.Sql`, `runSearch(db, q, point): Promise<{rows: RawRow[]; total: number;
  unplacedCount: number}>`.
- **Where**: `src/modules/admin/persistence/worker-search-sql.ts`.

### C8 `search-workers.ts` -- the search service (U2)
- **Purpose**: orchestrate one search: resolve, build, run, shape.
- **Responsibilities**: resolve `localityId` through Prisma (`auLocality.findUnique`; unknown = 400
  `fields.localityId`); call C7; shape each raw row into the contract's `workerRow` (computed age with the fallback,
  languages with the fallback, services, `isActive`, `distanceKm` to one decimal, `location{localityLabel,
  precision, travelRadiusKm}`); build `pagination` and `appliedFilters`.
- **Interface**: `searchWorkers(deps: {db; clock}, query: WorkerSearchQuery): Promise<WorkerSearchResponse>`.

### C9 `list-users.ts`, `list-suspended.ts` -- the two lists (U2)
- **Purpose**: today's behaviour behind the contract: the impersonation picker (Prisma `findMany`, `contains`
  insensitive on email and the three profile names, 50 newest) and the suspended page (`user.status =
  SUSPENDED`, `updatedAt` desc, paged).
- **Interface**: `listUsers(deps, query)`, `listSuspendedWorkers(deps, query)`.

### C10 `admin.handlers.ts` -- the binding (U2)
- **Purpose**: one handler per entry, as `registration.handlers.ts` does.
- **Responsibilities**: `defineHandlers(adminContract, { searchWorkers, listUsers, listSuspendedWorkers })`;
  each handler passes `req.query` to its service and returns `{status: 200, body}`; the pipeline has already
  authenticated, checked the role and the limits. **Pipeline change (U1):** after authentication the request log
  gains `userId` and `impersonatorId` bindings so every admin line is attributed (FR-ID-05).

## App (apps/app)

### C11 `api-token` route -- the minter (U1)
- **Purpose**: turn the signed-in session into a token for the api.
- **Responsibilities**: `GET /api/auth/api-token`; `getSession()`; 401 without a session; claims from the session
  (`sub` = user id, `role`, `act` = `impersonatedBy` when present) plus issuer, audience, `iat`, `exp` = now +
  `API_TOKEN_TTL_S`, `jti`; signed with `jose.SignJWT` (HS256) and `API_TOKEN_SECRET`; `cache-control: no-store`;
  rate-limited with the app's existing limiter.
- **Interface**: `GET -> 200 {token, expiresAt}` | 401.
- **Where**: `src/app/api/auth/api-token/route.ts`. `jose` becomes a direct dependency of both apps (today only
  transitive through NextAuth).

### C12 `lib/api/token.ts` -- the token source (U1)
- **Purpose**: one place that holds the current token in memory and renews it.
- **Responsibilities**: `getToken()` returns a cached token while more than 60 s of life remain, else fetches
  C11; `invalidate()` drops it; a single in-flight fetch is shared; nothing is written to storage.
- **Interface**: `createTokenSource(fetchImpl?): {getToken(): Promise<string>; invalidate(): void}`.

### C13 `lib/api/admin.ts` -- the admin client (U2, token wiring U1)
- **Purpose**: the only way the app's admin screens call the api.
- **Responsibilities**: `createClient(adminContract, {baseUrl: NEXT_PUBLIC_API_URL})` wrapped so every call sets
  `authorization: Bearer <token>`; on 401, `invalidate()` and retry once; a typed outcome the screens map to
  notices (`ok`, `unauthenticated`, `forbidden`, `rateLimited(retryAfterSeconds)`, `unavailable`, `failed`).
- **Interface**: `adminApi.searchWorkers(query)`, `adminApi.listUsers(query)`, `adminApi.listSuspendedWorkers(query)`.

### C14 the admin screens (U2)
- **Purpose**: the dashboard, the impersonation page and the suspended list on the new client.
- **Responsibilities**: `AdminDashboardClient.tsx`: the suburb pick keeps `{id, label}`; "Within" disabled until
  a suburb is picked; `fetchContractors` replaced by `adminApi.searchWorkers`; URL state carries `localityId`,
  `localityLabel`, `withinKm`; the document-filter state and the options fetch removed; the unmapped line and the
  `unplaced` mode; notices for the outcomes; the distance column with its hint. `impersonate/page.tsx` and the
  suspended list call C13. `requireRole` keeps guarding the pages.

## Infra and scripts

### C15 stage table, bootstrap, alert (U1)
- **Responsibilities**: `SECRET_NAMES` gains `API_TOKEN_SECRET` (`stages.ts`), `bootstrap.sh` creates it per stage,
  `service.*.yaml` regenerated, `README.md` (set it in Secret Manager and in Vercel Production and Preview); a log
  metric `remonta-api-auth-failed` and `monitoring/auth-failed.json` (prod) applied by `apply-alerts.sh`;
  `lib.sh`'s copy of the table and the tests that cross-check it updated.

### C16 `parity-admin-search.ts` (U2)
- **Responsibilities**: replay a list of today's dashboard URLs against the old route (preview, session cookie)
  and the new entry (staging, token); compare id sets and totals; print a report; exit non-zero on an unexplained
  difference. Run by hand; output recorded in the construction notes.

## Amendment 2026-10-08 -- instant repeats (Q1 C: caches, the PostGIS search kept)

### C17 `privateCacheSeconds` -- the contract field (U2)
- **Purpose**: let a role-restricted GET declare how long a browser may keep its answer.
- **Responsibilities**: `meta.ts` gains `privateCacheSeconds?: int 1..3600`; `checks.ts` refuses it on public
  entries, on non-GET entries and together with `cacheSeconds`; `openapi.ts` records it under `x-remonta-security`.
- **Interface**: `Meta.privateCacheSeconds?`.

### C18 pipeline cache step (U2, platform)
- **Purpose**: the headers and the 304 for entries with `privateCacheSeconds`, and the memo for the search.
- **Responsibilities**: after the response schema check: compute a strong `ETag` (`"sha256-<base64url>"` of the
  body); set `Cache-Control: private, max-age=N` and `Vary: Authorization`; if `If-None-Match` matches, answer 304
  with no body. Before the handler, for entries that opt in (`memo: {seconds, maxEntries}` on the handler
  binding, not in the contract): look up the memo by the canonical query string; on hit, skip the handler; on
  miss, run it and store a 200 body; `Cache-Control: no-cache` on the request bypasses and refills. Errors are never
  stored. One `ResponseMemo` class (`platform/cache/response-memo.ts`), LRU, bounded, with a `Clock`.
- **Interface**: `class ResponseMemo { get(key, now): Body | undefined; set(key, body, now): void; size }`;
  `canonicalQueryOf(entry, query): string` (sorted keys, defaults applied, arrays joined).

### C13 (amended) -- canonical URLs and reloads
- The admin client sorts and defaults the query before calling `createClient` so identical filters give identical
  URLs; `cache: 'reload'` is passed for the refresh button and after an admin action; the default cache mode
  otherwise, so the browser serves repeats itself.

### C14 (amended) -- the freshness line
- "Results may be up to a minute old" with a refresh button; after suspend/reactivate/publish the list reloads
  with `cache: 'reload'`.
