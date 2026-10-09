# NFR Requirements Plan -- unit `admin-search` (U2)

**Inputs:** the functional design (`../admin-search/functional-design/`, R1-R11, G1-G10), the cycle's NFR-01/02/05/
08/10/11/15/16/17, U1's NFR requirements (the limits 120/300 and 60/120 are declared on U2's entries), the api's
runtime (Cloud Run 1 vCPU, prod 1 GiB / staging 512 Mi, concurrency 80, `DB_POOL_SIZE 5`, `DB_POOL_TIMEOUT_S 5`,
`MAX_IN_FLIGHT` 128/64; `isOverloadedDatabase` maps Prisma `P2024` and initialisation errors to 503), CI's `API
Quality` job (PostGIS service container, the suburb list loaded), the load harness in `apps/api/load`.

Three questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done").

## Question 1
How NFR-01 (search p95 under 500 ms on production-sized data) is measured before the page switches.

A) **`EXPLAIN ANALYZE` plus a timed replay of the parity cases on staging.** The parity script (Q3 A of the
functional design) already calls every case against staging; it gains a `--time` mode that repeats each case 10
times with `no-cache` and prints p50/p95 per case and overall, and the `EXPLAIN ANALYZE` of the slowest geo
case is captured once and pasted into the construction notes (it must show the GiST index on
`worker_locations.point`). Recommended: one tool, the same cases, no new harness.

B) **Extend the load harness** (`apps/api/load`) with an authenticated admin scenario at a sustained rate. More
realistic concurrency, more to build and a token to inject into the harness.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
Database connections. A search holds one pooled connection for up to 5 s (the statement timeout); the pool is 5
per instance; the sixth concurrent search waits up to 5 s for a connection, then the api answers 503 with
`Retry-After` (today's `P2024` mapping). Admin traffic is a handful of people.

A) **Keep the pool at 5.** With the browser cache and the memo most repeats never reach the database; a burst of
six distinct searches in the same second on one instance is improbable, and the degraded mode (503, the page keeps
its results and retries) is the designed behaviour. No stage-table change in this unit. Recommended.

B) **Raise prod's `DB_POOL_SIZE` to 10** in the stage table (an infra change inside PR 2, YAML regenerated).
More headroom; Neon's connection budget is shared with the app, so the gain is bounded.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
How the geo properties (G1-G3) run in CI against PostGIS without making the suite slow.

A) **A seeded fixture, properties over the query space.** One test file inserts a deterministic fixture once
(about 300 workers at pseudo-random Australian points drawn from real `au_localities` rows, a share of them
unplaced, with varied attributes) and then runs `fast-check` over query parameters only (locality, radius, filter
combinations, page size): each property run is one statement against the fixture and compares with a TypeScript
oracle (Haversine, in-memory filtering, in-memory paging). About 100 runs per property, a few seconds in total.
Recommended.

B) **Generate and insert workers per property run.** Stronger generation, far slower (an insert batch per run),
and harder to keep the suite under CI's time budget.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Decisions that are not questions (stated so they can be objected to)

- **Statement-timeout mapping:** `isOverloadedDatabase` grows to recognise Postgres `57014` (`query_canceled`,
  surfaced by Prisma as a raw-query error with that code in `meta`), so a search that hits `SET LOCAL
  statement_timeout` answers 503 with `Retry-After: 2` like a pool timeout, not 500.
- **No new indexes, no migration (D13):** the GiST indexes on `worker_locations.point` and `au_localities.point`,
  the `worker_services` indexes on `categoryId` and `workerProfileId`, the `worker_experience` `(workerProfileId,
  domain)` unique and `domain` index, `users.status`, and the `worker_profiles` single-column indexes serve the
  statement; `subcategoryIds` array containment and the JSON path scan the matching workers (about 2,000 rows), which
  the `EXPLAIN` of Q1 confirms is immaterial today; the missing GIN index is follow-up 15's companion.
- **Memory:** the memo holds at most 500 bodies of at most 100 rows (about 1 KB per row): under 50 MB worst case,
  within prod's 1 GiB and staging's 512 Mi; the LRU bound is the guarantee, not the estimate.
- **Response size:** a page of 100 rows is about 100 KB uncompressed; Cloud Run compresses nothing itself, so
  the api enables Fastify's gzip/br compression only if measured necessary (not planned: pages of 20 are the norm).
- **Caching headers reach the browser unchanged:** Cloud Run adds no shared cache and `private` forbids one;
  Vercel is not in the api's path.
- **Tests and gates (PBT-09):** `vitest` + `fast-check` as everywhere; the geo and paging properties live in
  `apps/api/test/admin/*.int.test.ts` (skipped without `TEST_DATABASE_URL`, run in CI); the pure properties (G4-G10)
  in `apps/api/test/admin/*.test.ts` and `packages/api-contract/test`; the page's URL round-trip (G6, the shared
  function) in the contract package so both sides are covered by one test.
- **Parity on staging, not CI:** the parity script needs today's route (a preview) and the new entry (staging) on
  one database; it is a checklist step, recorded in the construction notes, not a CI gate.
- **Observability:** the search handler logs one info line per request `{entry, durationMs, total, memo: hit|miss,
  locality: bool, withinKm}` (no filter values, no names); the existing request line carries the principal (U1).

## Execution checklist

- [x] 1. Confirm the three answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/admin-search/nfr-requirements/nfr-requirements.md`: performance, scalability,
  availability, security, reliability, maintainability, traced to the cycle's NFRs, the rules and the stories; the
  compliance tables at this stage
- [x] 3. `tech-stack-decisions.md`: the table of decisions with alternatives and reasons; versions; configuration
- [x] 4. Present for approval
