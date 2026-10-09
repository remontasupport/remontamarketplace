# Application Design -- admin worker search on `apps/api` (consolidated)

**Approved inputs:** requirements (2026-10-08, with the amendment: one query for every filter, no schema change,
three entries), 17 stories, the execution plan (U1 `api-identity`, U2 `admin-search`, PRs 1-4), the design plan's
four answers (Q1 A one statement from typed fragments; Q2 A `jose` with the claims in api-contract; Q3 A
`/v1/admin/*` with comma-separated arrays; Q4 A `withinKm` 1-500). The detailed files beside this one:
`components.md`, `component-methods.md`, `services.md`, `component-dependency.md`.

## 1. The shape in one picture

```
apps/app (Vercel)                                   apps/api (Cloud Run)                       Neon + PostGIS
--------------------------------                    ------------------------------------       --------------
AdminDashboardClient.tsx  ──►  lib/api/admin.ts ──HTTPS Bearer──►  pipeline ──► JwtAuthenticator (C3)
impersonate/page.tsx           (C13)                                 │  role ADMIN, per-user limit
suspended list                   │                                   ▼
                          lib/api/token.ts (C12)             admin.handlers.ts (C10)
                                 │                                   │
                          GET /api/auth/api-token (C11)      search-workers.ts (C8) ──► auLocality.findUnique
                            NextAuth session ──► jose.sign           │                  runSearch (C7): one statement
                                                              filters.ts (C6)  ◄── search-query.ts (C5, pure)
packages/api-contract: auth.ts (C1, claims) · admin.contract.ts (C2, three entries) · createClient
infra: API_TOKEN_SECRET per stage (C15) · auth-failed alert · parity script (C16)
```

## 2. Components (16)

| # | Component | Unit | One line |
|---|---|---|---|
| C1 | `packages/api-contract/src/auth.ts` | U1 | The token's claims schema and constants, imported by both sides |
| C2 | `packages/api-contract/src/admin.contract.ts` | U2 | `searchWorkers`, `listUsers`, `listSuspendedWorkers`; strict queries; `meta()` roles ADMIN, per-user + per-IP limits |
| C3 | `apps/api/src/platform/auth/jwt-authenticator.ts` | U1 | `jose.jwtVerify` -> `Principal`; one warn line on rejection |
| C4 | `apps/api/src/config/config.ts` | U1 | `API_TOKEN_SECRET` required, 32+ bytes |
| C5 | `apps/api/src/modules/admin/domain/search-query.ts` | U2 | Pure normalisation and invariants of a search |
| C6 | `apps/api/src/modules/admin/application/filters.ts` | U2 | The registry as data: one `FilterSpec` per filter, a `Prisma.Sql` fragment each |
| C7 | `apps/api/src/modules/admin/persistence/worker-search-sql.ts` | U2 | The one statement: joins, location term, sort, page, `COUNT(*) OVER()`; the unplaced count; statement timeout |
| C8 | `apps/api/src/modules/admin/application/search-workers.ts` | U2 | Resolve the locality, run, shape rows and `appliedFilters` |
| C9 | `.../application/list-users.ts`, `list-suspended.ts` | U2 | Today's two lists through Prisma |
| C10 | `apps/api/src/modules/admin/admin.handlers.ts` | U2 | `defineHandlers(adminContract, ...)`; wired in `main.ts` |
| C11 | `apps/app/src/app/api/auth/api-token/route.ts` | U1 | Mints the token from the NextAuth session with `jose` |
| C12 | `apps/app/src/lib/api/token.ts` | U1 | In-memory token source: cache, renew before expiry, invalidate |
| C13 | `apps/app/src/lib/api/admin.ts` | U2 | `createClient(adminContract)` with the token header, one 401 retry, typed outcomes |
| C14 | admin screens | U2 | Suburb id, "Within" gating, unmapped line, notices, the two lists |
| C15 | `infra/lib/stages.ts`, `bootstrap.sh`, `monitoring/auth-failed.json`, README | U1 | The secret per stage; the auth-failure metric and alert |
| C16 | `apps/api/scripts/parity-admin-search.ts` | U2 | Old route vs new entry, id sets and totals |

Platform touch (U1): `pipeline.ts` binds `userId`/`impersonatorId` into the request log after authentication;
`Principal` gains `impersonatorId?`.

## 3. Key signatures

```ts
apiTokenClaimsSchema = { sub, role, act?, iss: 'remonta-app', aud: 'remonta-api', iat, exp, jti }   // C1; TTL 300 s, HS256
class JwtAuthenticator implements Authenticator { authenticate(headers): Promise<Principal | null> }  // C3
normaliseQuery(raw: WorkerSearchQuery, now: Date): SearchQuery                                        // C5
FILTERS: FilterSpec[]; whereOf(q): Prisma.Sql                                                          // C6
searchStatement(q, point | null): Prisma.Sql; runSearch(db, q, point, {statementTimeoutMs})            // C7
searchWorkers(deps, query): Promise<WorkerSearchResponse>                                              // C8
createTokenSource(): { getToken(): Promise<string>; invalidate(): void }                               // C12
adminApi.searchWorkers(query): Promise<ApiOutcome<WorkerSearchResponse>>                               // C13
```

## 4. Services

- **S1 mint** (app): session -> claims -> `jose.SignJWT` -> `{token, expiresAt}`; cached in memory, renewed 60 s
  before expiry, one in-flight fetch.
- **S2 verify** (api pipeline step 5): `jwtVerify` with secret, algorithm, issuer, audience, exp/nbf (30 s skew);
  claims schema; role check; per-user limits; attributed logs.
- **S3 search** (api): normalise -> resolve locality (400 if unknown) -> one transaction (`SET LOCAL
  statement_timeout`; the statement with `ST_DWithin`/`ST_Distance`, `COUNT(*) OVER()`; the unplaced count) ->
  shape -> 200. Default sort by distance with a locality, `createdAt DESC` without; `city`/`state` from the HOME
  locality with `COALESCE` to the legacy columns; `unplaced` lists the HOME-less and ignores the location.
- **S4/S5 lists** (api): Prisma, today's `where`.
- **S6 call from the screen** (app): token -> call -> outcome -> notice or render; a second 401 sends to sign-in.
- **S7 cut over**: PR 1 (C1, C3, C4, C15, pipeline log) -> PR 2 (C2, C5-C10, C16) -> promote -> PR 3 (C11-C14,
  Vercel secret first) -> PR 4 (deletions). Rollback by promote at each step.

## 5. Dependencies and boundaries

Contract <- zod only (P-6: `jose` lives in the two apps). Api: C3 <- `jose`, C1; C5 pure; C6 <- C5; C7 <- C5, C6,
`$queryRaw`; C8 <- C5, C7, Prisma; C10 <- C2, C8, C9. App: C11 <- `jose`, C1, `getSession`; C12 <- C11; C13 <-
C2, C12; C14 <- C13. Both apps declare `jose` directly (today it is transitive through NextAuth). No `fetch` to the
api outside `createClient`; no `$queryRawUnsafe`; no Nest controller; `packages/form-engine`, `packages/db` and
`apps/web` untouched.

## 6. Decisions deferred to construction

| To | Decision |
|---|---|
| U1 Functional Design | the exact rejection reasons and their log wording; skew; `jti` generation; impersonation claim name |
| U1 NFR Requirements / Design | secret rotation procedure (two secrets accepted during a window, or a cut); the alert threshold (OI-4); token route rate limit |
| U2 Functional Design | the SQL fragment per filter (the requirements table made exact); `shapeRow` rules; the age window; `appliedFilters` shape; the properties (oracle, partition, composition) |
| U2 NFR Requirements / Design | per-user and per-IP limit values; the statement timeout; the parity case list; `EXPLAIN` acceptance; degraded-mode wording on the page |
| U1 Infrastructure Design | the secret's creation and the YAML; the log metric filter; `lib.sh` and the tests that mirror the table |

## 7. Compliance at this stage

- **Security:** SECURITY-08 (token validated server-side on every request: signature, expiry, audience, issuer;
  roles server-side; CORS exact, no credentials) designed in C3/S2; SECURITY-05 strict queries and bound SQL
  parameters (C2, C6, C7); SECURITY-11 the authenticator is one module, limits in `meta()`; SECURITY-03/14 the
  attributed log and the auth-failure metric (C10, C15); SECURITY-12 the token's lifetime and header-only
  transport (C1, C12); the MFA gap stays follow-up 14. No new finding.
- **Resiliency:** RESILIENCY-10 a statement timeout and typed outcomes with degraded mode on the screen (C7, C13,
  S6); RESILIENCY-04 the PR order keeps every step a promote (S7). No new finding.
- **PBT:** the pure components (C5, C6, C7's builder, C1's schema, C12's cache) are the property targets named in the
  stories; `fast-check` is in every affected package. No new finding.

## Amendment 2026-10-08 -- instant repeats (Q1 C: caches, the PostGIS search kept)

Two components added (C17 the `privateCacheSeconds` contract field; C18 the pipeline cache step with a bounded
`ResponseMemo`), two amended (C13 canonical URLs and `cache: 'reload'`; C14 the freshness line). S3 gains the memo
lookup before the handler and the ETag/304 after the schema check; S6 relies on the browser's HTTP cache. The
PostGIS statement, the token, the registry and the PR order are unchanged. Requirements FR-CACHE-01..04,
NFR-15..17; stories US-AS-19, US-AS-20. Compliance: NFR-16 keeps caching private and role-bound (SECURITY-08/09);
no new finding.
