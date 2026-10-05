# NFR Design Plan -- unit `photo-gcs` (U3)

**Inputs:** `../photo-gcs/nfr-requirements/` (U3-PERF/SCAL/AVAIL/SEC/REL/MAINT/USE, T1-T15), the functional
design, the api's existing platform pieces (`Bulkhead`, `LoadShedder`, `SafeHttpClient`, outbox dispatcher,
scheduler, pino logging, rate-limit buckets).

Two questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done").

## Question 1 (RESILIENCY-14): Resiliency Testing Approach
How will resiliency mechanisms (failover, recovery) be validated?

A) Use our existing DR testing / game day / chaos engineering practice -- provide the reference. AI-DLC will
document test scenarios that fit it.

B) **No practice exists -- AI-DLC proposes a light plan**: (1) automated failure-injection tests in CI against
the fake storage server and a modelled api: bucket unreachable at ticket (503, engine retries then field error),
at confirm (503, nothing written), during processing (outbox retry, then dead-letter after 6), signing unavailable
(503), staging object missing at processing (permanent failure path), undecodable bytes (as-is fallback), bulkhead
full (outbox retry), purge with one store's adapter missing (skipped and counted); (2) one staging drill per
release that touches the bucket code: revoke the staging runtime account's bucket role for ten minutes, observe
ticket 503s, the engine's retries and messages, the dead-letter alert if an event was in flight, then restore
and confirm recovery, recorded in the construction notes; (3) the DR runbook inherited from S1 gains the bucket
(soft delete restore, re-run of dead-lettered processing). Recommended.

C) Defer to the Operations phase -- capture test scenarios now, execute during Operations.

X) Other (describe after [Answer]: tag below)

[Answer]: B -- proposed

## Question 2
A circuit breaker on the bucket client (RESILIENCY-10 "should").

A) **No breaker in this unit.** Each request makes at most two bucket calls, each bounded by a 5 s timeout; the
load shedder already turns sustained slowness into fast 503s by event-loop delay; the outbox and the scheduler
retry with back-off; a regional managed store fails rarely and briefly. A breaker would add state and a new
failure mode (a tripped breaker refusing a healthy bucket) for little. Revisit if the `photo-ticket` 503 count
ever shows a pattern. Recommended.

B) **A simple breaker** in the adapter: open after 5 consecutive failures, half-open after 30 s; while open,
ticket and confirm answer 503 immediately with `Retry-After`.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Fixed by earlier decisions (not questions)

- Timeouts: 5 s per bucket call; 15 s per outbox handler; 10 min per purge run; the engine's 20 s per api attempt.
- Retries: the engine's budget (R6); the outbox's 6 attempts with back-off; no retry inside the adapter (one call,
  one timeout; the caller decides).
- Bulkhead of 2 around processing; when full, the handler waits up to the handler timeout, then the outbox
  retries (no 503: there is no request).
- Fail closed everywhere: an error in ticket or confirm writes nothing; an error in processing leaves the profile
  untouched; an error in purge leaves the row.
- Least privilege, public-read exception, CORS, audit logs, log hygiene: as the NFR requirements state.
- Signing credential: the client library caches the IAM access token; each ticket is one `signBlob` call
  (tens of milliseconds, in-region); no caching of policies (each is unique by key).

## Execution checklist

- [ ] 1. Confirm the two answers; resolve ambiguity in a clarification file
- [ ] 2. `aidlc-docs/construction/photo-gcs/nfr-design/nfr-design-patterns.md`: the patterns applied (timeouts,
  bounded retries, bulkhead, idempotent handlers, fail-closed, single-purpose credentials, immutable keys,
  lifecycle as backstop, observability per stage, degraded modes), each tied to the requirement it satisfies, plus
  the resiliency test scenarios
- [ ] 3. `logical-components.md`: every component with its NFR responsibilities and the platform pieces it uses;
  the CI topology (PostGIS + fake storage); configuration surface
- [ ] 4. Present for approval
