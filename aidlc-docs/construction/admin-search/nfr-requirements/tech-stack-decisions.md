# Tech Stack Decisions -- unit `admin-search` (U2)

| # | Decision | Chosen | Alternatives considered | Why |
|---|---|---|---|---|
| T1 | Geometry | PostGIS geography (`ST_DWithin`, `ST_Distance` on the generated `point` columns, GiST) in one statement | Haversine in application code over a bounding box (today); a browser snapshot (declined, Q1 C) | the index does the work; one count and one page in the database; spheroid metres; the oracle test keeps it honest |
| T2 | Query construction | `Prisma.sql` tagged fragments joined with `Prisma.join`, run with `$queryRaw` | Prisma's query builder (cannot express the predicate); a query builder library (Kysely, Knex) | no new dependency; parameterised by construction; `$queryRawUnsafe` forbidden by Semgrep |
| T3 | Search point | a scalar subquery on `au_localities.point` by id (the row read by Prisma first for the 400 and the label) | passing lat/lng and building the point in SQL | the same geography column on both sides of the predicate; no float round-trip |
| T4 | Transaction | `db.$transaction` (ReadCommitted) with `SET LOCAL statement_timeout = 5000`, two statements | one statement with a CTE for the unplaced count | the second count has different predicates; one short transaction keeps them consistent and bounded |
| T5 | Error mapping | `isOverloadedDatabase` extended to Postgres `57014` | a new error class | the existing 503 + `Retry-After` path; one line |
| T6 | Caching, browser | `Cache-Control: private, max-age=60`, `Vary: Authorization`, strong `ETag` (sha-256 of the body), 304 on `If-None-Match`; a new contract field `privateCacheSeconds` | `public` caching (forbidden: personal data); `Expires`; no caching | the browser's HTTP cache answers repeats with no request; `private` keeps shared caches out; the contract check keeps it off public entries |
| T7 | Caching, api | an in-process LRU `ResponseMemo` (500 entries, 60 s) keyed by entry + canonical query, bound per handler | Redis (the app's Upstash); a shared cache service | the api has no Redis and needs none at a 60 s horizon; per instance is acceptable (D16); no new dependency |
| T8 | Canonical query | one `canonicalQueryOf(entry, query)` in `packages/api-contract` (sorted keys, defaults, sorted arrays, comma-joined) used by the api's memo key and the app's URLs | two implementations | one function, one round-trip property (G6) |
| T9 | Hashing | `node:crypto` `createHash('sha256')` in the api's pipeline step | a hashing library | built in |
| T10 | Lists | Prisma `findMany`/`count` for users and suspended | raw SQL | no geometry, today's `where` |
| T11 | Property tests | `fast-check` 4 + `vitest` 2; geo properties on a seeded PostGIS fixture with a TypeScript Haversine oracle; pure properties without a database | an external geodesic library as the oracle | Haversine is a sufficient oracle at a 0.5 % band; no dependency |
| T12 | Parity and timing | `apps/api/scripts/parity-admin-search.ts` with `parity-cases.json` (45 cases), `--time` mode (10 runs, `no-cache`, p50/p95) | a separate load tool | one tool for both proofs; the cases are the documentation of what parity means |
| T13 | Page integration | `createClient(adminContract)` through `lib/api/admin.ts` (U1's wrapper); `fetch` default cache mode, `cache: 'reload'` for refresh and post-action | react-query/SWR | the browser's cache is the cache; the page already manages its own state; no new dependency |
| T14 | Suburb source on the page | `/api/suburbs` (app route, `au_localities`) unchanged; the pick keeps `id` | the api's `GET /v1/localities` | identical data; the app route already exists and is cached by the CDN for an hour; switching is a later clean-up |
| T15 | Configuration | none new: timeout, memo size and TTL, `privateCacheSeconds` are constants in code and the contract | environment variables | nothing stage-specific |

## Versions

| Package | Where | Version policy |
|---|---|---|
| `@prisma/client`, `fastify`, `zod`, `fast-check`, `vitest` | present | unchanged |
| PostGIS | Neon 3.5 (prod/staging), `postgis/postgis:16-3.4` (CI, local) | unchanged; `ST_DWithin`/`ST_Distance` on geography are stable across both |

No new runtime dependency in this unit.

## Configuration summary

| Item | Value | Where |
|---|---|---|
| statement timeout | 5,000 ms | `worker-search-sql.ts` constant |
| memo | 60 s, 500 entries | `ResponseMemo` constants; bound per handler in `main.ts` |
| `privateCacheSeconds` | 60 | the three entries' `meta()` |
| limits | 120/300, 60/120 per minute | the entries' `meta()` |
| page size, radius, array caps | 100, 500 km, 20 x 40 chars | the contract schema |
