# NFR Design Patterns -- unit `admin-search` (U2)

**Decisions:** NFR design plan Q1 B (the light resiliency testing plan, clarified 2026-10-08), Q2 A (per-instance
memo staleness accepted within 60 s); approved 2026-10-08. Each pattern names the requirement it satisfies and the
rule it implements.

## P1 One bounded statement, one short transaction

The search runs inside `db.$transaction` with `SET LOCAL statement_timeout = 5000` as its first statement; the
page statement and the unplaced count follow; nothing else happens inside. A connection is held for at most 5 s.
Postgres `57014` (cancelled by the timeout) and Prisma `P2024` (no pooled connection in 5 s) both map to 503 with
`Retry-After: 2` through `isOverloadedDatabase`. (U2-SCAL-02, U2-AVAIL-01, R5.5)

## P2 No retry in the api, retries owned by the page

The api never re-runs a statement for the same request. The page retries a 429 once after `Retry-After`
(automatically) and everything else through the refresh button or the next Apply. A slow database is therefore
never hit twice for one admin action. No circuit breaker: the database is the only dependency, the pool timeout and
the load shedder already turn sustained slowness into fast 503s. (U2-AVAIL-02, NFR-10)

## P3 Index-backed predicate, one round trip for page and total

`ST_DWithin(wl.point, pt, metres)` uses the GiST index; `COUNT(*) OVER()` returns the total with the page; the
unplaced count is the second statement of the same transaction. Shaping happens in TypeScript on at most 100
rows. (U2-PERF-01, -02, R4, R5.2)

## P4 Two additive caches, each switchable without a contract change

Browser: `Cache-Control: private, max-age=60`, `Vary: Authorization`, strong `ETag`, 304 on `If-None-Match`,
declared by `privateCacheSeconds` on the entry. Api: the `ResponseMemo` (LRU 500, 60 s, per instance) bound to the
search handler with `memo: true`. Turning either off is one edit (`memo: false`; delete the meta field), and the
behaviour degrades to a normal search. Errors are never cached; `Cache-Control: no-cache` on a request bypasses
both. (D15, D16, R8, U2-AVAIL-03)

## P5 Time-bounded staleness, visible and escapable

Sixty seconds from the last change on any path: the browser cache, the memo on every instance (Q2 A). The page
shows "results may be up to a minute old" and a refresh button that sends `no-cache`; after an admin's own
action the page reloads with `no-cache`, so the actor sees the change at once. (NFR-17, R11.5, R11.7)

## P6 Bounded inputs, bounded work

Page size <= 100, radius <= 500 km, arrays <= 20 x 40 chars, search <= 100 chars, strict schema: no request can
widen the statement. Per-user 120/min and per-IP 300/min on the search (60/120 on the lists). (U2-SCAL-01, -05)

## P7 Private by construction

Only ADMIN principals reach the handlers; responses are `private` (shared caches excluded) with `Vary:
Authorization`; `privateCacheSeconds` is refused on public entries by `checkContracts`; the memo key excludes the
caller because the body does not depend on who asks; the response schema strips anything undeclared; the search
log line carries counts and durations only. (U2-SEC-01..04, NFR-16)

## P8 One canonical form for three uses

`canonicalQueryOf` (contract package) builds the page's URLs, the memo key and the ETag basis, so a repeat is a
repeat everywhere; one round-trip property (G6) covers all three. (R8.5, U2-MAINT-02)

## P9 Degraded mode on the page

Every outcome has a notice and keeps the last results on screen; `unauthenticated` redirects to sign-in; nothing
else in the admin area depends on the api. (U2-AVAIL-02, U1's outcome contract)

## P10 Observability

One info line per search `{entry, durationMs, total, memo, locality, withinKm}` under the attributed request line;
the existing `5xx-ratio`, `request-failed` and `latency-p95` policies cover the entries; the parity and timing
reports are recorded in the construction notes. (U2-REL-01..03)

## Resiliency test scenarios (Q1 B, RESILIENCY-14)

| # | Scenario | Where | Expected |
|---|---|---|---|
| S1 | Statement timeout: a test statement with `pg_sleep(6)` under the same `SET LOCAL` | CI on PostGIS | 503, `Retry-After: 2`, one error line with the request id |
| S2 | Pool exhaustion: a fake `Db` whose `$transaction` throws `P2024` | CI | 503, `Retry-After: 2` |
| S3 | Unknown locality id | CI | 400 `fields.localityId` |
| S4 | Memo disabled (`memo: false`) | CI | every request runs the statement; headers unchanged |
| S5 | Memo model (G7): random (key, time, no-cache) sequences | CI | the returned body equals the most recent fill within 60 s; size <= 500 |
| S6 | `Cache-Control: no-cache` on the request | CI | memo bypassed and refilled; 200 with fresh headers |
| S7 | `If-None-Match` matching / not matching | CI | 304 without body / 200 with body |
| S8 | The page receives each outcome from a fake client | CI (app) | the matching notice; last results kept; `unauthenticated` redirects |
| S9 | Twelve concurrent distinct searches at one staging instance (the parity cases) | staging drill, per release touching this code | some 503s with `Retry-After`; the page's notice; automatic recovery; the timed replay then meets p95 |
| S10 | Suspend a test worker from the dashboard; a second browser watches the list | staging drill | the actor's list reflects it at once; the second within 60 s |
| S11 | Parity and timing replay (`parity-admin-search.ts`, `--time`) | staging, before PR 3 | id sets and totals equal; p95 under 500 ms; `EXPLAIN ANALYZE` shows the GiST index; recorded |
| S12 | Rollback rehearsal: promote the previous api image on staging after PR 2 | staging drill | the entries answer 404; the page (not yet switched) is unaffected |

No DR runbook change: the unit holds no state.
