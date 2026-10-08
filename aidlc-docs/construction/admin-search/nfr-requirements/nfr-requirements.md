# NFR Requirements -- unit `admin-search` (U2)

**Decisions:** NFR plan Q1 A (`EXPLAIN ANALYZE` + the timed parity replay), Q2 A (pool stays at 5), Q3 A (seeded
fixture, properties over the query space); approved 2026-10-08. Traced to the cycle's requirements (NFR-01, -02,
-05, -08, -10, -11, -15, -16, -17), the business rules (R#), the properties (G#) and the stories (US-AS-#).

## Performance

| ID | Requirement | Trace |
|---|---|---|
| U2-PERF-01 | A cache-missing search answers in under 500 ms at p95 on staging's production copy (about 2,000 workers), with and without a locality, measured by the parity script's `--time` mode (10 runs per case, `no-cache`) and recorded in the construction notes before PR 3 merges | NFR-01, Q1 A |
| U2-PERF-02 | The radius predicate uses the GiST index on `worker_locations.point`: the `EXPLAIN ANALYZE` of the slowest geo case shows an index scan on it, recorded once | FR-GEO-03, R4 |
| U2-PERF-03 | A memo hit answers in under 20 ms at the api (no statement); a browser-cache hit costs no request; a 304 carries no body | NFR-15, R8 |
| U2-PERF-04 | The users and suspended lists answer in under 300 ms at p95 (Prisma, indexed columns) | FR-ADM-06/07 |
| U2-PERF-05 | A page of 20 rows is about 20 KB of JSON; no compression is added in this unit (revisit if pages of 100 become the norm) | plan note |

## Scalability and capacity

| ID | Requirement | Trace |
|---|---|---|
| U2-SCAL-01 | Limits per entry: search 120/min per user + 300/min per IP; users and suspended 60 + 120; 429 with `Retry-After` before the handler | U1-SCAL-01 |
| U2-SCAL-02 | One pooled connection per search for at most 5 s (`SET LOCAL statement_timeout = 5000`); the pool stays at 5 per instance; a sixth concurrent search on one instance waits up to the pool timeout then answers 503 (`Retry-After: 2`), the designed degraded mode | Q2 A, NFR-10 |
| U2-SCAL-03 | The memo is bounded at 500 entries and 60 s per instance (under 50 MB worst case); the LRU bound, not the estimate, is the guarantee | D16, R8.3 |
| U2-SCAL-04 | The statement scales with the GiST index for the radius and with the single-column indexes for the filters; array containment (`subcategoryIds`) and the JSON path (`workerType`) scan only the rows that pass the other predicates; at 2,000 workers this is immaterial, and the `EXPLAIN` of U2-PERF-02 is the evidence; indexes for them are follow-up 15's companion (no migration in this cycle, D13) | plan note |
| U2-SCAL-05 | Page size capped at 100; `withinKm` capped at 500; arrays capped at 20 items of 40 chars; `search` at 100 chars: no request can make the statement unbounded | NFR-05, R1.1 |

## Availability and resiliency

| ID | Requirement | Trace |
|---|---|---|
| U2-AVAIL-01 | A statement timeout (Postgres `57014`) or a pool timeout (`P2024`) answers 503 with `Retry-After: 2`, never 500: `isOverloadedDatabase` recognises both | NFR-08, plan note |
| U2-AVAIL-02 | Degraded mode on the page: 429, 503 and network failures show a notice and keep the last results; 429 retries automatically after the wait; a refresh button always exists | NFR-11, R11.6, US-AS-11 |
| U2-AVAIL-03 | The caches are additive: a memo miss or a cold browser cache is simply a normal search; a memo bug can be disabled by unbinding `memo: true` without a contract change; `privateCacheSeconds` can be removed in one contract edit | D15, D16 |
| U2-AVAIL-04 | Staleness is bounded to 60 s; an admin's own action reloads fresh (`no-cache`); the freshness line tells the admin the bound | NFR-17, R11.5, R11.7 |
| U2-AVAIL-05 | Rollback: PR 2's image can be replaced by the previous one (the entries disappear; nothing calls them yet); PR 3 by a Vercel promote while the old routes exist; PR 4 only after the agreed production window | NFR-13 |
| U2-AVAIL-06 | The health probe is unchanged; the search's database dependency is the api's existing one | RESILIENCY-06 |

## Security and privacy

| ID | Requirement | Trace |
|---|---|---|
| U2-SEC-01 | Every parameter is validated by the strict contract schema (unknown keys 400); every SQL value is a bound parameter through `Prisma.sql`; `$queryRawUnsafe` is forbidden by Semgrep; `%` and `_` in the name search are escaped | NFR-05, SECURITY-05, R3.1 |
| U2-SEC-02 | The three entries are `access: {roles: ['ADMIN']}`; the pipeline's 401/403 precede the handler; impersonating tokens are refused (U1) | NFR-04, SECURITY-08 |
| U2-SEC-03 | Caching never crosses a boundary: `Cache-Control: private` (no shared cache may store a response), `Vary: Authorization`, `privateCacheSeconds` refused on public entries by the contract check; the memo key excludes the caller because the result does not depend on who asks, and only ADMIN principals reach the memo | NFR-16, R8.1, R8.4 |
| U2-SEC-04 | Personal data (names, mobiles, emails) travels only in the response body over TLS to an authenticated admin; the search log line carries counts and durations, never filter values or rows; `abn` and `dateOfBirth` never leave the service | NFR-07, R6.1, G10 |
| U2-SEC-05 | Abuse bound: the per-user ceiling (12,000 rows a minute) is below the value of one unfiltered page sequence an admin can legitimately read; the users list exposes emails only to admins; no endpoint returns documents or bank details | NFR-06 |
| U2-SEC-06 | The browser cache holds personal data for 60 s in the admin's own profile cache; it is `private`, not persisted beyond the browser's HTTP cache, and cleared with the browser's cache | D15 |

## Reliability, observability

| ID | Requirement | Trace |
|---|---|---|
| U2-REL-01 | One info line per search `{entry, durationMs, total, memo: 'hit'|'miss', locality: boolean, withinKm?}` plus the attributed request line (U1) | plan note |
| U2-REL-02 | The parity script's report (id sets and totals per case, differences explained) and the timing report are recorded in the construction notes before PR 3 merges | NFR-02, US-AS-16 |
| U2-REL-03 | The existing policies cover the new entries: `5xx-ratio`, `request-failed` (500s), `latency-p95`; no new policy in this unit | RESILIENCY-05 |

## Maintainability and testability

| ID | Requirement | Trace |
|---|---|---|
| U2-MAINT-01 | The filter registry is a table (`FILTERS`), one row per filter, each row its own fragment: adding a filter is one row, one contract field, one test | FR-ADM-03, G4 |
| U2-MAINT-02 | `canonicalQueryOf` lives once in the contract package and is used by the api (memo key, ETag basis) and the app (URLs), with one round-trip property (G6) covering both | R8.5 |
| U2-MAINT-03 | Geo and paging properties (G1-G3) run in CI on PostGIS against a seeded 300-worker fixture inserted once per file, `fast-check` over the query space (about 100 runs each), a TypeScript oracle; skipped without `TEST_DATABASE_URL` and reported as skipped | Q3 A, PBT-05, -08 |
| U2-MAINT-04 | Pure properties (G4-G10) and the example tests run without a database; the memo and ETag step have model-based and example tests in the platform suite | PBT-10 |
| U2-MAINT-05 | `docs/admin/README.md` documents the three entries (parameters, canonical values, responses, errors, limits, the caches) and the parity procedure | FR-PLT-04 |

## Compliance at this stage

### Security (blocking)

| Rule | Status | Note |
|---|---|---|
| SECURITY-05 | Compliant | U2-SEC-01 |
| SECURITY-08 | Compliant | U2-SEC-02, -03 |
| SECURITY-09 | Compliant | generic errors; `private` caching documented |
| SECURITY-03, -14 | Compliant | U2-REL-01, the existing policies |
| SECURITY-11 | Compliant | limits in `meta()`; abuse bound U2-SEC-05 |
| SECURITY-15 | Compliant | U2-AVAIL-01, -02 |
| SECURITY-10 | Compliant | no new dependency |
| SECURITY-01, -02, -04, -06, -07, -12, -13 | N/A or inherited | no new store, intermediary, headers change, IAM, network, credential or data change |

### Resiliency (blocking)

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-04 | Compliant | U2-AVAIL-05 |
| RESILIENCY-05, -07 | Compliant | U2-REL-01..03 |
| RESILIENCY-06 | Compliant | U2-AVAIL-06 |
| RESILIENCY-09 | Compliant | U2-SCAL-01..05 |
| RESILIENCY-10 | Compliant | U2-SCAL-02, U2-AVAIL-01, -02 |
| RESILIENCY-14 | At NFR Design | scenarios: statement timeout, pool exhaustion, memo disabled, stale cache after a change |
| Others | Inherited | requirements section 5 |

### PBT

| Rule | Status | Note |
|---|---|---|
| PBT-01 | Compliant | G1-G10 |
| PBT-09 | Compliant | `fast-check` + `vitest` |
| PBT-05 | Planned | the Haversine and in-memory oracles (G1-G3), today's age function (G9) |
