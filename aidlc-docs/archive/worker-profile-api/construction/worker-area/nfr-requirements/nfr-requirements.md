# NFR Requirements -- unit `worker-area` (U1)

Decisions: the plan's Q1-Q6, all A (approved 2026-10-09). Each requirement names its verification. "Staging" = the
single-instance `remonta-api-staging` on the `rehearse-w1` copy; "prod" = `remonta-api` after the table change.

## 1. Scalability (RESILIENCY-09, D6, D7)

| ID | Requirement | Verification |
|---|---|---|
| U1-SCL-01 | **Target**: 10,000 worker sessions in one hour ≈ 90,000 requests/hour ≈ **25 req/s sustained**, design burst **125 req/s** (Q1 A). | The arithmetic is recorded here and in `docs/worker/README.md`; the load test (U1-PRF-03) runs at these rates. |
| U1-SCL-02 | **One instance must carry the sustained rate alone**, so prod's several instances have headroom by construction (Q1 A). | The staging run at 25 req/s meets U1-PRF-03 with `maxInstances = 1`. |
| U1-SCL-03 | **Prod table** (Q3 A): `maxInstances` 10, `minInstances` 1, `concurrency` 80, `MAX_IN_FLIGHT` 64, `DB_POOL_SIZE` 5, `cpu` 1, `memory` 1Gi; staging unchanged except `MAX_IN_FLIGHT` 64 (already). Capacity ceiling: 800 admitted requests in flight, 50 pooled connections. | `infra/lib/stages.ts` + `render:check`; the drift test; the deployed revision's env in Cloud Run matches. |
| U1-SCL-04 | **Nothing instance-local decides correctness**: ownership, limits, completion persistence and the outbox are database-backed; the only per-instance state the worker entries touch is none (the memo is not used for them). | A test asserts `memo.entries` excludes every `worker.*` entry; the inventory's table of instance-local state is re-checked at NFR Design. |
| U1-SCL-05 | **Neon** (Q4 A): before PR 1 merges the operator records in `infra/README.md`: both stages' `AUTH_DATABASE_URL` hosts carry `-pooler` and the string carries `pgbouncer=true`; prod's compute size, its `max_connections` and pooler limit; that the limit exceeds 50 (api) + the app's pool; autoscaling status. | The README section exists with the values; US-WP-32's checklist line ticked. |

## 2. Performance (RESILIENCY-05, NFR-01, NFR-02)

| ID | Requirement | Verification |
|---|---|---|
| U1-PRF-01 | **One statement budget**: `getProfile` = one transaction (ReadCommitted, `SET LOCAL statement_timeout = 5000`) containing the profile read and the catalogue read; `profileIdOf` is folded into that transaction as its first statement (no separate round trip). No N+1. | A query-count test (Prisma `$on('query')` in the harness) asserts ≤ 8 statements per read; `EXPLAIN` of the main statement on staging shows index use on `worker_profiles(userId)`, `worker_locations(workerProfileId)`, `verification_requirements(workerProfileId)`. |
| U1-PRF-02 | **Caching**: `privateCacheSeconds: 60`, ETag strong, 304 on match; a 304 costs the same statements as a 200 in U1 (the body is computed to compare; acceptable at these rates, revisited if the load test shows the read dominating). | `cache/pipeline-cache` tests extended for the worker entry; the load report's 304 share. |
| U1-PRF-03 | **Load thresholds** (Q2 A), on staging after 60 s warm-up: sustained 25 req/s for 10 min → `getProfile` p95 ≤ 300 ms, p99 ≤ 800 ms (200 and 304 together), zero 429, zero 503, zero other 5xx, zero pool-timeout log lines; burst 125 req/s for 60 s → only 503 + `Retry-After` beyond 200/304, zero other 5xx, p95 of admitted ≤ 1,000 ms; recovery: within 30 s after the burst, a 60 s window meets the sustained thresholds. | `scripts/load-worker.ts` exits 0 only when every threshold holds; the JSON report is committed to the construction notes before the promotion (R7). |
| U1-PRF-04 | **Completion is cheap**: `completionOf` is pure and O(rows); no catalogue query inside; the catalogue rows come from the read's transaction. | A micro-benchmark in the test suite: 10,000 calls on a generated profile under 1 s. |
| U1-PRF-05 | **Timeouts**: statement timeout 5 s on the read; the backfill script 30 s per statement; the load script's per-request timeout 10 s. | Config constants with tests; the backfill's dry run on staging reports its own timing. |

## 3. Availability (RESILIENCY-02, -10; NFR-07)

| ID | Requirement | Verification |
|---|---|---|
| U1-AVL-01 | The S1 targets apply unchanged (SLA 99.9 % monthly, RTO ≤ 30 min, RPO ≤ 5 min, single region). U1 adds no state. | The resiliency decisions table in the requirements. |
| U1-AVL-02 | **Shedding is visible and clean**: beyond `MAX_IN_FLIGHT` or at an event-loop p99 above 200 ms the api answers 503 + `Retry-After: 2`; never a hang, never a 500. | The burst phase of U1-PRF-03; the existing `load.test.ts` cases. |
| U1-AVL-03 | **Pool exhaustion degrades to 503**: a `P2024` pool timeout maps to 503 with `Retry-After` (existing mapping) and one error log line; the health probe keeps answering while the pool is busy (its `SELECT 1` has priority by being short; if the load test shows probe failures, NFR Design reserves a connection). | A harness test with `DB_POOL_SIZE=1` and two concurrent reads sees one 503, zero 500; the load run shows zero liveness restarts (Cloud Run revision events). |
| U1-AVL-04 | **The probe never pays the limiter** (R6); shedding exempts probes already. | P6; the pipeline test. |
| U1-AVL-05 | **Rollback**: PR 1 adds one entry and changes the table; rolling the image back removes the entry (nothing calls it yet) and the table change is reverted by promoting the previous revision (Cloud Run keeps the previous env). | The rollback row in CLAUDE.md re-recorded after PR 1's promotion. |

## 4. Security (SECURITY-03, -05, -08, -09, -11, -15; NFR-03..06)

| ID | Requirement | Verification |
|---|---|---|
| U1-SEC-01 | **Ownership by token only** (R1): no user or profile id in any request; a foreign row is 404; another role 403; no token 401. | P1; `route-security.test.ts` extended: a WORKER token reaches `getProfile` (200), ADMIN/CLIENT/COORDINATOR get 403. |
| U1-SEC-02 | **Masking from day one** (R2.3): `bankAccount` never leaves the api unmasked; the redaction list gains `bankAccount`, `streetLine`, `storageKey`. | A test that a stored full account is returned masked; the logger's redaction test lists the paths. |
| U1-SEC-03 | **Strict output**: `profileSchema` is a strict object; a field not in the schema fails the pipeline's output check (500, logged), never leaks. | The contract's P10 check; a test with an extra property in the handler's return. |
| U1-SEC-04 | **Limits** (Q5 A): reads per user 120/min + per IP 300/min; writes per user 60/min + per IP 120/min; tickets per user 10/min (U3). `workerRead()`/`workerWrite()` set them; no entry can omit them. | R8.1's test; a limiter test on `getProfile`. |
| U1-SEC-05 | **Caching is private**: `Cache-Control: private, max-age=60`, `Vary: Authorization`; the contract check forbids `cacheSeconds` on a non-public entry (existing). | The pipeline-cache tests. |
| U1-SEC-06 | **Logs**: one line per request with `reqId`, `userId`, `impersonatorId?`, `entry`, `durationMs`, `status`; never field values, never the body. | A log-capture test on `getProfile`. |
| U1-SEC-07 | **The load script** never runs against production (host guard), never prints a token, reads only staging secrets (R7.1). | A unit test of the guard; the script's `--help`. |
| U1-SEC-08 | **The backfill script** is dry-run by default, refuses production hosts unless `--allow-production` is given together with `--apply`, and writes a report. | Its tests, as the S1 backfills have. |

## 5. Reliability and observability (SECURITY-14, RESILIENCY-05, -07)

| ID | Requirement | Verification |
|---|---|---|
| U1-REL-01 | The existing alert set covers the worker entries without change: 5xx-ratio > 2 %, latency-p95 > 2 s over 10 min, request-failed ≥ 5/5 min, auth-failed > 20/5 min, instance-down, will-not-start. No new policy in U1. | The policies' filters are service-wide (checked in `infra/cloudrun/monitoring/*.json`). |
| U1-REL-02 | Two saved Cloud Logging queries documented in `docs/worker/README.md`: worker requests by `userId`; 503s by reason (`shed` vs `pool`) over 24 h. | The README section. |
| U1-REL-03 | The load run's report is kept in `aidlc-docs/construction/worker-area/code/load-<date>.json` with the summary in the construction notes. | Present before the promotion dispatch. |

## 6. Maintainability (NFR-14, FR-PLT-06)

| ID | Requirement | Verification |
|---|---|---|
| U1-MNT-01 | Module layout as the admin module: `worker.handlers.ts`, `application/`, `domain/`, `persistence/`; no file over 300 lines without a note in the construction summary. | `wc -l` in the summary. |
| U1-MNT-02 | The completion oracle (today's function, ported to rows) and the services-table oracle live under `apps/api/test/worker/oracles/` and are deleted from the app in U2's PR 4 (not from the test folder). | The files exist; PR 4's deletion list names the app copies only. |
| U1-MNT-03 | `DenyAllAuthenticator` deleted; `openapi.ts` lists 304 for `privateCacheSeconds` entries and 503 for every entry; the Semgrep raw-SQL rule gains `Prisma.raw(` with a `ruleid:` line in `.semgrep/remonta.ts`. | The gates; `semgrep --test`. |
| U1-MNT-04 | `docs/worker/README.md` created (index: the entry, the token, the tables read, the completion rules with the [fix] list, the load test, the saved queries); CLAUDE.md's reach line mentions the worker profile. | The files in PR 1. |

## 7. Usability

| ID | Requirement | Verification |
|---|---|---|
| U1-USA-01 | One read serves the sidebar, the home page and the preview (E1 covers their needs; `frontend-components.md`). | U2's PR 3 switches them without a second entry. |
| U1-USA-02 | A repeat visit within a minute costs no request (browser cache) or a 304. | The pipeline-cache tests; the load report's 304 share. |

## Cross-check

| Cycle NFR | U1 coverage |
|---|---|
| NFR-01 capacity and latency | U1-SCL-01/02, U1-PRF-03 |
| NFR-02 one statement per page | U1-PRF-01 |
| NFR-03 ownership | U1-SEC-01 |
| NFR-04 validation | the strict schemas (no body in U1); U1-SEC-03 |
| NFR-05 personal data | U1-SEC-02, -05, -06 |
| NFR-06 abuse | U1-SEC-04, -07 |
| NFR-07 fail closed | U1-AVL-02, -03 |
| NFR-11 timeouts | U1-PRF-05 |
| NFR-12 consistency | U1-SCL-04 |
| US-WP-30 | U1-SCL-01..03, U1-PRF-03, U1-SEC-04 |
