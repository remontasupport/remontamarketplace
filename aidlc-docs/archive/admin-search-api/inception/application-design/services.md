# Services -- admin worker search on `apps/api`

Orchestration only; the rules inside each step belong to Functional Design.

## S1 Mint a token (apps/app, U1)

1. The screen's client (C13) asks the token source (C12) for a token.
2. C12 returns the cached one if more than 60 s remain; otherwise calls `GET /api/auth/api-token` (C11), sharing
   one in-flight request.
3. C11 reads the NextAuth session; no session = 401 (the screen sends the admin to sign in); otherwise builds the
   claims from the session (user id, role, impersonator), signs with `jose` and the app's `API_TOKEN_SECRET`,
   answers `{token, expiresAt}` with `no-store`.
4. C12 caches token and expiry in memory only.

## S2 Verify a request (apps/api, U1; the existing pipeline)

1. Steps 1-4 of the pipeline as today (headers, shedding, HTTPS, CORS, body limit, per-IP and global limits, no
   captcha on admin entries).
2. Step 5: `JwtAuthenticator.authenticate(headers)` (C3): header present and `Bearer`; `jose.jwtVerify` (secret,
   algorithm, issuer, audience, exp/nbf with skew); claims parsed by C1's schema; `Principal` returned. Any failure:
   one warn line `{auth: 'rejected', reason}` and 401.
3. Step 6: the entry's roles (`ADMIN`) against the principal's role: 403 otherwise (an impersonating admin carries
   `WORKER`).
4. Per-user limits keyed on `principal.userId`; the request log gains `userId`/`impersonatorId`.
5. Steps 7-11 as today: strict query validation, handler, response schema, cache headers (`no-store`).

## S3 Search workers (apps/api, U2)

```
handler(req.query) -> normaliseQuery (C5) -> [localityId? -> auLocality.findUnique -> Point | 400]
  -> runSearch (C7): BEGIN; SET LOCAL statement_timeout; SELECT ... COUNT(*) OVER() ...; SELECT unplaced count; COMMIT
  -> shapeRow x page (C8) -> { data, pagination, appliedFilters, unplacedCount } -> 200
```

- `whereOf(q)` (C6) contributes one fragment per active filter and the active condition.
- With a locality: `wl.point IS NOT NULL`, optionally `ST_DWithin(wl.point, $point, $metres)`, `distance_m`
  selected, default sort `distance_m ASC, p.id ASC`.
- Without a locality: no location term; sort by the chosen column (`createdAt DESC` default) then `p.id`.
- `unplaced = true`: `wl.point IS NULL`, the location term ignored, `appliedFilters.unplaced = true`.
- `city`/`state` sort: `COALESCE(al.suburb, p.city)`, `COALESCE(al.state, p.state)`.
- A statement timeout (value at NFR Requirements) maps to 503 through the existing error mapping.

## S4 List users and S5 list suspended workers (apps/api, U2)

Thin: validate (contract), Prisma `findMany` with today's `where`, shape, 200. No raw SQL.

## S6 Call from the screen (apps/app, U2)

1. `adminApi.searchWorkers(query)` (C13): `getToken()` -> `createClient` call with the `authorization` header.
2. 401 -> `invalidate()` -> one retry; a second 401 -> `unauthenticated` -> the page redirects to sign-in with the
   return URL.
3. 403 -> `forbidden` notice; 429 -> `rateLimited(retryAfterSeconds)` notice, last results kept, automatic retry
   after the wait; 503 or network -> `unavailable` notice with a retry button; 500 or a contract mismatch ->
   `failed` with the request id.
4. `ok` -> the page renders `data`, the distance column (when `appliedFilters.locality` is set), the unmapped line
   from `unplacedCount`, and `pagination`.

## S7 Cut over (U1 + U2, the four PRs)

| PR | What runs where | Checklist before the next step |
|---|---|---|
| 1 identity, api side | C1, C3, C4, the pipeline log change, C15 (secret in the table, YAML, bootstrap, README; the metric and alert) on staging | secret set in Secret Manager (both stages); health 200; every public entry unchanged; a hand-minted token accepted on a test-only role-restricted probe (or on PR 2's entries once merged); a tampered token 401; the warn line visible in Cloud Logging |
| 2 admin, api side | C2, C5-C10, C16 on staging | the three entries with a staging admin's token; `EXPLAIN ANALYZE` of the statement showing the GiST index; the parity report green; p95 under 500 ms; then **promote** (one image with PRs 1 and 2) |
| 3 app switch | C11, C12, C13, C14 on a preview against staging, then production (secret set in Vercel Production and Preview first) | the preview checklist incl. forced 401/403/429/503; after merge, one production search with and without a suburb |
| 4 clean-up | the four routes, `lib/worker-search.ts`, the Redis key, docs, state follow-up 1 | production verified for the agreed window; no caller of the old routes in the logs |

Rollback: PR 3 by Vercel promote; PRs 1-2 by promoting the previous api image (then PR 3's app must be promoted
back too); PR 4 only after the window.

## Amendment 2026-10-08 -- S3 and S6 with the caches (Q1 C)

**S3 search (api), amended:**

```
pipeline steps 1-7 -> canonical key -> memo.get(key)?  yes -> body (no statement)
                                                        no  -> handler (C8: resolve, run, shape) -> memo.set
   -> response schema -> ETag; If-None-Match matches? 304 : 200 + Cache-Control: private, max-age=60, Vary: Authorization
request header Cache-Control: no-cache -> skip memo.get, still memo.set
```

**S6 call from the screen (app), amended:** the client canonicalises the query (sorted keys, defaults) and calls
with the browser's default cache mode: a repeat within 60 s is served by the browser without a request; after 60 s
the browser revalidates with `If-None-Match`; the refresh button and post-action reloads use `cache: 'reload'`.
