# NFR Design Plan -- unit `admin-search` (U2)

**Inputs:** `../admin-search/nfr-requirements/` (U2-PERF/SCAL/AVAIL/SEC/REL/MAINT, T1-T15), the functional design
(R1-R11, G1-G10), U1's NFR design (the outcome contract, fail-open/closed split), the api's platform pieces
(`unitOfWork`, `isOverloadedDatabase`, `LoadShedder`, pipeline step order, pino), the app's page.

Two questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done"). Every
category the rule names is then either a question here or a fixed pattern below with its justification.

## Question 1 (RESILIENCY-14): Resiliency Testing Approach
How will resiliency mechanisms (timeouts, degraded mode, the caches) be validated for this unit?

A) Use our existing DR testing / game day / chaos engineering practice -- provide the reference. AI-DLC will
document test scenarios that fit it.

B) **No practice exists -- AI-DLC proposes a light plan**: (1) automated failure-injection tests in CI: the
statement timeout (a `pg_sleep` fragment injected into a test statement under the same `SET LOCAL`, expecting 503
with `Retry-After`), pool exhaustion (a fake `Db` throwing `P2024`, expecting 503), an unknown locality (400 with
the field), the memo disabled (`memo: false`, every request runs the statement), a stale memo entry after a change
(the model-based property G7 covers it), the `no-cache` bypass, the page's outcome handling (a fake client
returning each outcome, expecting the notice and the kept results); (2) one staging drill per release touching
this code: fire 12 concurrent distinct searches (the parity cases) at one staging instance to exhaust the pool,
observe the 503s and the page's notice and automatic recovery, then the timed replay to confirm p95 after recovery;
suspend a test worker from the dashboard and confirm the list reflects it at once (the `no-cache` reload) while a
second browser sees it within 60 s; recorded in the construction notes; (3) the DR runbook needs nothing new (no
state). Recommended.

C) Defer to the Operations phase -- capture test scenarios now, execute during Operations.

X) Other (describe after [Answer]: tag below)

[Answer]: B (clarified 2026-10-08: "choose B instead")

## Question 2
Cross-instance staleness of the memo. Production runs 1-4 instances; each has its own memo. An admin's action
reloads with `no-cache`, which refills the memo on the instance that served the reload; another instance may hand
a different admin the previous body for up to 60 s.

A) **Accept it (time-bounded, as D16 states).** Sixty seconds is the agreed staleness; prod runs one instance most
of the time; the freshness line tells every admin the bound; the refresh button bypasses every cache. No shared
state, no new dependency. Recommended.

B) **Broadcast invalidation**: the api clears every instance's memo on an admin action through a shared channel
(a Postgres `NOTIFY`, listened to by each instance). Immediate consistency across instances at the cost of a
listener connection per instance and a new platform piece; the browser cache would still hold the old body for
up to 60 s unless the page always reloads with `no-cache`, which would defeat the browser cache.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Fixed by earlier decisions (not questions)

- **Resilience patterns:** a bounded statement (5 s `SET LOCAL statement_timeout` inside one short transaction;
  `57014` and `P2024` both 503 + `Retry-After: 2`); no retry inside the api (the page retries 429 automatically and
  everything else by the refresh button, so a slow database is never hit twice by the same request); no circuit
  breaker (justification: the database is the api's single dependency and the pool timeout plus the load shedder
  already convert sustained slowness into fast 503s); additive caches that can be turned off without a contract
  change (`memo: false`; remove `privateCacheSeconds`).
- **Scalability patterns:** per-user and per-IP limits in `meta()`; every input capped by the contract; the pool
  kept at 5 with the degraded mode designed; the memo bounded by count and age; stateless handlers, so instances
  scale independently (Q2 A accepts per-instance memos).
- **Performance patterns:** the index-backed predicate; one round trip for page and total (window count) plus one
  for the unplaced count in the same transaction; shaping in the api (not in SQL functions) kept linear in the
  page size; the browser cache for repeats (no request), the memo for other admins' repeats (no statement); no
  compression in this unit.
- **Security patterns:** strict parse before the handler; parameterised fragments; `private` + `Vary:
  Authorization` + no caching of errors; the memo keyed without the caller; the response schema stripping anything
  not declared; the search log line without values.
- **Logical components:** no queue, no breaker, no shared cache, no new storage; the `ResponseMemo` and the cache
  step are the only new platform pieces, both in-process; the existing limiter, shedder, logger, error mapping.

## Execution checklist

- [x] 1. Confirm the two answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/admin-search/nfr-design/nfr-design-patterns.md`: each pattern with the requirement
  it satisfies and the rule it implements; the resiliency scenarios per Q1
- [x] 3. `logical-components.md`: the components with their non-functional responsibilities and what they reuse,
  on the api, the contract and the app
- [x] 4. Present for approval
