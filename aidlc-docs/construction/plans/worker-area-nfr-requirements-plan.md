# NFR Requirements Plan -- unit `worker-area` (U1)

**Inputs:** the functional design (`../worker-area/functional-design/`, R1-R8, L1-L7, P1-P7), the cycle's D6/D7,
FR-PLT-01/02, NFR-01/02/06/11/12, requirements OI-4; the api's runtime as measured in the inventory (Cloud Run
`australia-southeast1`, prod 1-4 instances × 80 concurrency, 1 vCPU / 1 GiB, `MAX_IN_FLIGHT` 128, pool 5 per
instance, event-loop shed at 200 ms p99, the Postgres rate limiter, the alert set: 5xx-ratio > 2 %, latency-p95 >
2,000 ms over 10 min with ≥ 60 requests, request-failed, instance-down, auth-failed, outbox-dead-letter,
will-not-start); Neon Sydney through the pooled connection string (`DB_POOL_SIZE=5` per instance, "Neon's pooler
allows far more" per the S1 infrastructure design; the compute size and `pgbouncer=true` not recorded in the
repository).

Six decisions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done").

## Question 1
The capacity target in numbers (D6: 10,000 workers active over the same hour; OI-4). The arithmetic: after the
move a dashboard page costs one profile read (often a 304) and a save one PUT; a worker session is about 6 page
views and 3 saves; 10,000 sessions an hour ≈ 90,000 requests an hour ≈ **25 requests/s averaged**; traffic is not
even, so a peak of **5×, 125 requests/s**, is the design burst.

A) **Sustained 25 req/s, burst 125 req/s, proven on staging's single instance.** One instance handling the whole
sustained rate alone, and shedding cleanly at the burst, shows production (several instances) has headroom.
Recommended.

B) **Sustained 50 req/s, burst 250 req/s** (a 2× margin on the arithmetic), same method.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
Acceptance thresholds for the load test (NFR-01, R7.4), on staging (one instance, pool 5, the `rehearse-w1` copy of
production data), after the api has warmed for 60 s.

A) **At the sustained rate for 10 minutes:** p95 ≤ 300 ms and p99 ≤ 800 ms for `getProfile` (200 and 304 counted
together), 0 responses of 503 or 429, 0 other 5xx, 0 pool timeouts in the logs. **At the burst for 60 seconds:**
503 with `Retry-After` allowed, 0 other 5xx, p95 of the admitted requests ≤ 1,000 ms, and within 30 s after the
burst a 60-second window meets the sustained thresholds again. Recommended.

B) **Looser**: p95 ≤ 500 ms sustained; the burst only requires no 5xx other than 503.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
The production stages table (FR-PLT-01, D7). Today: 1-4 instances, `MAX_IN_FLIGHT` 128 (unreachable above
`concurrency` 80), pool 5 → 20 connections at full scale.

A) **`maxInstances` 10, `MAX_IN_FLIGHT` 64, `DB_POOL_SIZE` 5, `concurrency` 80, `cpu` 1, `memory` 1Gi.** Up to 50
pooled connections and 800 admitted requests in flight; shedding engages at 64 per instance, below Cloud Run's
80, so the event-loop signal is no longer the only one. Staging stays 1-1 with `MAX_IN_FLIGHT` 64 (already below
80). Cloud Run's regional default quota covers 10 instances. Recommended: 2-3× the burst's need with the measured
per-instance capacity, without a cost surprise (instances above the minimum scale to zero cost only while used;
`minInstances` stays 1).

B) **`maxInstances` 20, pool 4** (80 connections); more headroom, more to size on the pooler.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 4
The Neon side (NFR-01, the inventory's unverified item). The api's pooled URL must be in transaction mode for
`SET LOCAL` and interactive transactions to behave; the pooler's capacity depends on the compute size; neither is
in the repository.

A) **Verify before PR 1 merges and record in `infra/README.md`:** (1) on both stages the secret's URL carries
`-pooler` and `pgbouncer=true`; (2) the production compute size and its `max_connections`, and that Neon's pooler
limit comfortably exceeds `maxInstances × DB_POOL_SIZE` (50) plus the app's own pool; (3) autoscaling on, if the
plan has it. Done by the operator in the Neon console (the session cannot read it); the checklist line is part of
US-WP-32. Recommended.

B) **Assume the S1 note** ("the pooler allows far more") and verify only if the load test shows pool timeouts.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 5
Rate limits on the worker entries (NFR-06, R8.1; the admin entries use 120/300 reads and 60/120 lists).

A) **Reads: per user 120/min, per IP 300/min. Writes: per user 60/min, per IP 120/min. Upload tickets (U3): per
user 10/min.** A worker saving every second for a minute is within limits; a script is capped at one profile a
second per user. The per-IP limit tolerates a shared office NAT (several workers behind one address) at the read
rate. Recommended.

B) **Reads 60/min per user, 120/min per IP; writes 30/min per user, 60/min per IP**: tighter; a shared NAT with a few
active workers could see 429s on reads.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 6
The load tool (C18, R7).

A) **`autocannon`** (npm, dev dependency of `apps/api`, pinned), driven from a TypeScript script that mints the
tokens, builds the request mix and reads autocannon's per-request results to produce the report; runs anywhere
`pnpm` runs (a developer machine or a CI job). Recommended: no binary to install, one language.

B) **k6** (a separate binary; its own JavaScript runtime; richer scenarios and thresholds built in); the script
mints tokens into a JSON file k6 reads; the binary must be installed where the test runs.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Execution checklist

- [ ] 1. Confirm the six answers; resolve any ambiguity in a clarification file
- [ ] 2. `nfr-requirements.md`: scalability (the arithmetic, the per-instance expectation, the table), performance
  (the thresholds per entry, statement timeouts, caching behaviour, the one-read-per-page budget), availability (the
  S1 targets applied; what shedding and pool exhaustion look like; degraded mode), security (ownership, masking,
  redaction, limits, the token's lifetime), reliability (what is logged per request; which existing alerts cover the
  worker entries; the dead-letter path for U4), maintainability (module layout, file-size rule, the oracle tests, the
  backfill script), usability (the sidebar's one read; 304s), each with a verification criterion
- [ ] 3. `tech-stack-decisions.md`: autocannon; Prisma `$transaction` with `SET LOCAL statement_timeout`; the
  `privateCacheSeconds` mechanism reused; `fast-check` generators for profiles and catalogue rows; no new runtime
  dependency; the stages table values
- [ ] 4. Cross-check against NFR-01..07, 11, 12 and US-WP-30
- [ ] 5. Present for approval
