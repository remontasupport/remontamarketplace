# Logical Components -- unit `admin-search` (U2)

Each component with the non-functional responsibilities it carries and the platform pieces it reuses. Code
components are the application design's C2, C5-C10, C13, C14, C16, C17, C18.

## Contract (`packages/api-contract`)

| Component | NFR responsibilities | Reuses |
|---|---|---|
| `admin.contract.ts` (C2) | strict query schemas with every cap (P6); `meta()` with roles ADMIN, the limits, `privateCacheSeconds: 60`, `maxBodyKb: 1`; strict response schemas (P7) | `define.ts`, `meta.ts`, zod |
| `meta.ts` + `checks.ts` (C17) | `privateCacheSeconds` (1..3600) allowed only on a non-public GET and never with `cacheSeconds` (P7); one rejecting test per rule | the existing check table |
| `canonical.ts` (C17, new file) | `canonicalQueryOf(entry, query)`: sorted keys, defaults, sorted comma-joined arrays, encoding (P8); property G6 | zod schemas |

## Api (Cloud Run)

| Component | NFR responsibilities | Reuses |
|---|---|---|
| Pipeline cache step (C18) | ETag (sha-256), `Cache-Control: private`, `Vary`, 304; memo lookup before the handler for `memo: true` bindings; `no-cache` bypass; never on errors (P4, P7) | `pipeline.ts` step order; `node:crypto` |
| `ResponseMemo` (C18) | LRU 500 / 60 s per instance; `Clock`-driven expiry; model-tested (S5) | `Clock` |
| `search-query.ts` (C5) | pure normalisation; the invariants as 400s before any database work (P6) | `ApiError` |
| `filters.ts` (C6) | one parameterised fragment per filter; `%`/`_` escaped in `ILIKE` patterns (P7) | `Prisma.sql` |
| `worker-search-sql.ts` (C7) | the transaction with `SET LOCAL statement_timeout = 5000`; the two statements; `COUNT(*) OVER()` (P1, P3) | `db.$transaction`, `$queryRaw` |
| `search-workers.ts` (C8) | locality resolution (400 on unknown); shaping within the strict schema; the search log line (P7, P10) | Prisma `auLocality`; pino |
| `list-users.ts`, `list-suspended.ts` (C9) | Prisma `findMany` with today's `where`; bounded (50 / page size) | Prisma |
| `admin.handlers.ts` (C10) | binds the three handlers; `memo: true` on the search only | `defineHandlers` |
| `errors.ts` (platform) | `isOverloadedDatabase` grows to `57014` (P1) | existing mapping |
| Load shedder, limiter (existing) | unchanged: shedding before everything; per-user/IP limits before the handler | `LoadShedder`, `PostgresRateLimiter` |

## App (Vercel)

| Component | NFR responsibilities | Reuses |
|---|---|---|
| `lib/api/admin.ts` (C13) | canonical URLs through `canonicalQueryOf`; `cache: 'default'` for repeats, `'reload'` for refresh and post-action; the outcome mapping (P5, P8, P9) | `createClient`; U1's token source |
| `AdminDashboardClient.tsx` (C14) | keeps last results on failure; the freshness line and refresh; automatic 429 retry; the unmapped line; URL state; no document-filter state or options fetch (P5, P9) | existing page state |
| `impersonate/page.tsx`, the suspended panel (C14) | the same client and notices | |

## Scripts and verification

| Component | NFR responsibilities |
|---|---|
| `parity-admin-search.ts` + `parity-cases.json` (C16) | 45 cases; id sets and totals; `--time` (10 runs, `no-cache`, p50/p95); exit codes; the reports recorded (S11) |
| `test/admin/*.int.test.ts` | the seeded 300-worker fixture; G1-G3 with the Haversine and in-memory oracles; S1 |
| `test/admin/*.test.ts`, `test/pipeline-cache.test.ts` | G4-G10; S2-S7 |
| app tests | S8; the URL round trip through the shared function |

## What is deliberately absent

| Not built | Why |
|---|---|
| A shared cache (Redis) or cross-instance invalidation | Q2 A: per-instance memos within a 60 s bound; no new dependency |
| A circuit breaker | one dependency, already failing fast through the pool timeout and the shedder |
| Retries in the api | the page owns them (P2) |
| New indexes or columns | D13 (no schema change); the existing indexes carry the statement at today's size |
| Compression | pages of 20 rows; revisit if needed |
| A new alert | the existing 5xx, request-failed and latency policies cover the entries |
