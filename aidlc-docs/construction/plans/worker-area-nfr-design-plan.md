# NFR Design Plan -- unit `worker-area` (U1)

**Inputs:** `../worker-area/nfr-requirements/` (U1-SCL/PRF/AVL/SEC/REL/MNT/USA, T1-T10), the functional design
(R1-R8, L1-L7, P1-P7), the api's platform pieces (`LoadShedder` in-flight + event-loop p99, `Bulkhead`, the Postgres
`RateLimiter` failing closed, `createDb` with `connection_limit`/`pool_timeout`, the pipeline's private-cache step,
the error mapping P2024/57014 → 503, pino with redaction, the alert set), Cloud Run's probes (startup 2 s/3 s ×20;
liveness every 15 s, 5 s timeout, 3 failures → restart), Neon's pooled connection.

Three questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done"). Every
category the rule names is then either a question here or a fixed pattern in the design with its justification.

## Question 1 (RESILIENCY-14): Resiliency Testing Approach
How will resiliency mechanisms (shedding, pool exhaustion, limiter outage, probe behaviour) be validated for this
unit?

A) Use our existing DR testing / game day / chaos engineering practice -- provide the reference. AI-DLC will
document test scenarios that fit it.

B) **No practice exists -- AI-DLC proposes a light plan**: (1) automated failure-injection tests in CI against the
PostGIS service: `DB_POOL_SIZE=1` with two concurrent profile reads (one 503 + `Retry-After`, zero 500, the probe
still 200); a statement timeout forced by `SET LOCAL statement_timeout = 1` in a test hook (503, one error line);
the limiter's table dropped mid-test (503, fail closed, probe unaffected per R6); the shedder saturated with
`MAX_IN_FLIGHT=2` (the third request 503 + `Retry-After: 2`, released on completion); a 304 under a changed body
(200 again); (2) **the load test's burst phase is the staging drill**: 60 s at 125 req/s on one instance while
Cloud Run's revision events are watched for liveness restarts (expected: none) and the 503 share is read from the
report; then a second drill with `MAX_EVENT_LOOP_DELAY_MS=50` on staging for five minutes at the sustained rate to
see the event-loop signal shed and recover; both recorded in the construction notes; (3) the DR runbook inherited
from S1 gains one line: U1 adds no state; the backfill is re-runnable. Recommended.

C) Defer to the Operations phase -- capture test scenarios now, execute during Operations.

X) Other (describe after [Answer]: tag below)

[Answer]: B -- proposed

## Question 2
The liveness probe under pool pressure (U1-AVL-03). The probe's `SELECT 1` goes through the same 5-connection pool
with a 5 s `pool_timeout`, and Cloud Run's probe timeout is also 5 s: during a burst that saturates the pool for a
few seconds, three consecutive probe failures (45 s) would restart a busy instance, amplifying the burst.

A) **"Recent success" health.** The health handler answers 200 without touching the database when any request
completed a successful database statement within the last 30 s (a timestamp the persistence layer updates); only
when nothing recent exists does it run `SELECT 1`, with its own 2 s timeout. A saturated-but-working instance stays
alive; a dead database still fails the probe within 30 s + 2 s. No extra connection. Recommended.

B) **A reserved connection for the probe**: a second Prisma client with `connection_limit=1` used only by health
(+1 pooled connection per instance, 60 at full scale). Simple; costs pooler capacity.

C) **Keep `SELECT 1` through the shared pool** and rely on the burst drill (Q1) to show no restarts; change only if
it does.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
How the ETag is derived (U1-PRF-02). A strong ETag of the body means a 304 still costs the read's statements; a
cheaper ETag needs a version the api can read without assembling the body.

A) **Body-hash ETag, computed after the read** (the existing pipeline step; a 304 saves bandwidth, not statements).
At 25 req/s with 304s this is within budget; revisited if the load test shows the read dominating. Recommended for
U1: no schema change, exact.

B) **A `profile_version` column** bumped by every write to the profile or its child tables (U2-U4 would have to
bump it in every section write; a trigger would bump it from the database); the ETag is the version and a 304 costs
one indexed read. Cheaper per 304; a new column and a rule every write must honour.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Execution checklist

- [x] 1. Confirm the three answers; resolve any ambiguity in a clarification file
- [x] 2. `nfr-design-patterns.md`: the patterns with the requirement each satisfies -- one bounded transaction
  (read), shedding before work (two signals, both reachable), limiter fail-closed and probe exemption, pool
  exhaustion as 503, recent-success health, private caching with a strong ETag, ownership resolved first and
  cheaply, masking and redaction at the boundary, pure completion with oracles, load generation as a tool with
  guards, horizontal scaling by table values, no instance-local correctness, logging and the existing alerts, the
  resiliency test plan (Q1), and the backfill as a re-runnable job
- [x] 3. `logical-components.md`: each component (shedder, limiter, pool, cache step, health path, the worker
  module's read path, the completion domain, the load generator, the backfill script, the stages table, logging and
  alerts) with its configuration values, its failure mode and what observes it; a sequence of the read under normal,
  shed and pool-exhausted conditions
- [x] 4. Cross-check against U1-AVL-02/03, U1-PRF-02/03, U1-SCL-03/04, U1-REL-01
- [x] 5. Present for approval
