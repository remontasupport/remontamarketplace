# NFR Design Patterns -- unit `worker-area` (U1)

**Decisions:** NFR design plan Q1 B (light resiliency testing plan), Q2 A (recent-success health), Q3 A (body-hash
ETag); approved 2026-10-09. Each pattern names the requirement it satisfies and the rule it implements.

## P1 One bounded transaction per read

`getProfile` opens one interactive transaction (ReadCommitted), sets `statement_timeout = 5000` as its first
statement, runs `profileIdOf`'s lookup (folded in), the nested profile select, the sections, the catalogue, and
commits. One pool connection for at most 5 s; a timeout surfaces as Postgres 57014, mapped to 503 + `Retry-After`
by the existing error path. Nothing is awaited outside the transaction. (U1-PRF-01, U1-PRF-05, R2.1)

## P2 Shed before work, on two reachable signals

The `LoadShedder` admits a request only when the instance's in-flight count is below `MAX_IN_FLIGHT` and the
event-loop p99 (1 s window) is below 200 ms; refusal is 503 + `Retry-After: 2` before the body is read. With prod's
`MAX_IN_FLIGHT` set to 64 (below Cloud Run's 80) both signals can fire; Cloud Run spreads the remainder to other
instances or queues at its own layer. Probes are exempt (existing). (U1-AVL-02, U1-SCL-03)

## P3 Limiter fails closed; probes never pay it

The Postgres limiter counts every worker request per user and per IP in one atomic upsert; if it cannot count, the
request is 503 (existing, fail closed). The pipeline skips both limiter stages for `probe` entries, so the liveness
path has no database dependency of its own beyond P4. (U1-SEC-04, U1-AVL-04, R6)

## P4 Recent-success health (Q2 A)

The persistence layer records `lastDbSuccessAt` (a module-level timestamp, updated on every committed transaction
and successful query through a lightweight Prisma `$extends` query hook or in `unitOfWork`/the read wrapper). The
health handler: if `now - lastDbSuccessAt ≤ 30 s` → `{status: 'ok'}` without a query; else `SELECT 1` with a 2 s
timeout (a second, tiny Prisma transaction with `statement_timeout = 2000`), 200 on success, 503 otherwise. A busy
instance whose pool is saturated by real work stays alive (it just succeeded); an instance whose database is gone
fails within 32 s, i.e. by the third probe. Startup probe unchanged (the first health call runs `SELECT 1` because
nothing recent exists). (U1-AVL-03)

## P5 Pool exhaustion is a 503, not a 500, and the pool is sized by the table

`connection_limit = DB_POOL_SIZE` (5), `pool_timeout = 5`; a wait beyond that is Prisma P2024 → 503 + `Retry-After`
with one error line `{err, entry, pool: 'timeout'}` (existing mapping, one added log field). At full scale 10 × 5 =
50 pooled connections, verified against Neon's pooler limit by the operator before PR 1 (U1-SCL-05). The outbox
dispatcher, the scheduler and the locality reload share the pool; their statements are short. (U1-AVL-03, U1-SCL-03)

## P6 Private caching with a strong ETag (Q3 A)

The pipeline's existing step: `Cache-Control: private, max-age=60`, `Vary: Authorization`, `ETag: "<sha256 of the
canonical JSON body>"`; `If-None-Match` equal → 304 with no body. The body is computed first (the read runs), so a
304 saves bandwidth and client work, not statements; the load report's 304 share and read latency decide whether a
version column (Q3 B) is worth a later unit. The response memo is not used: the body is per user. (U1-PRF-02,
U1-SEC-05, U1-USA-02)

## P7 Ownership first, cheap, and only one way

Every handler's first act is `profileIdOf(principal)`: one indexed lookup inside the read's transaction (P1).
There is no path from a request value to a profile id; foreign rows are 404 (R1.3). The pipeline has already done
401/403. (U1-SEC-01, R1)

## P8 Masking and redaction at the boundary

`maskBankAccount` runs in the shaping step of the read, never later; the logger's redaction list (`pino` `redact`
paths) gains `*.bankAccount`, `*.streetLine`, `*.storageKey`, `*.url` under signed-link fields; the output schema is
strict so nothing unlisted leaves. (U1-SEC-02, U1-SEC-03, R2.3)

## P9 Pure domain with oracles

`completionOf` and `SERVICE_REQUIREMENTS` are pure; the test folder holds today's functions as oracles; `fast-check`
arbitraries generate profiles, requirement rows and catalogue rows, partitioned by whether a [fix] case is hit
(R3.12). The arbitraries are exported for U2-U4. (U1-PRF-04, U1-MNT-02, P2)

## P10 Load generation as a guarded tool

`scripts/load-worker.ts`: host guards (staging only), staging secrets only, a token bucket for the rate, per-worker
back-off on 429/503 honouring `Retry-After` (never retrying inside the window: the test measures shedding, it does
not fight it), a JSON report, exit codes; autocannon underneath. (U1-PRF-03, U1-SEC-07, R7)

## P11 Horizontal scaling by table values; no instance-local correctness

The stages table is the only place capacity is set; rendering and the drift test keep the YAML honest. Nothing a
worker entry depends on lives in one instance's memory (limits, completion persistence and outbox claims are in
Postgres; the locality directory is a cache of immutable rows). (U1-SCL-03, U1-SCL-04)

## P12 Observe with what exists

One structured line per request (`reqId`, `userId`, `impersonatorId?`, `entry`, `status`, `durationMs`); the 503s
carry `reason: 'shed' | 'pool' | 'timeout' | 'limiter'` so the saved query can split them; the existing seven
policies cover the service; no new policy. (U1-SEC-06, U1-REL-01, U1-REL-02)

## P13 Resiliency testing (Q1 B)

**CI (every PR):** (a) `DB_POOL_SIZE=1`, two concurrent `getProfile` → one 200, one 503 + `Retry-After`, zero 500,
health 200 (P4's recent-success path); (b) a test hook that sets `statement_timeout = 1` for the read → 503, one
error line with `reason: 'timeout'`; (c) the limiter table dropped → 503 `reason: 'limiter'`, health still 200;
(d) `MAX_IN_FLIGHT=2`, three concurrent → the third 503 `reason: 'shed'`, admitted again after completion; (e) a 304
then a changed row → 200 with a new ETag; (f) health with a stale `lastDbSuccessAt` and a dead database → 503
within 2 s. **Staging drills (before PR 1's promotion):** (g) the burst phase of the load test on one instance
while Cloud Run revision events are watched: expected zero liveness restarts, 503 share reported; (h) five minutes
at the sustained rate with `MAX_EVENT_LOOP_DELAY_MS=50` (a temporary env override on the staging service): the
event-loop signal sheds and the service recovers when the override is removed; both recorded in the construction
notes. **Runbook:** U1 adds no state; the backfill is re-runnable; nothing to restore. (RESILIENCY-14)

## P14 The backfill as a re-runnable, guarded job

`scripts/backfill-completion.ts`: dry run prints per-flag change counts; `--apply` writes in batches of 200 inside
short transactions; idempotent (a second run changes nothing); production needs `--allow-production --apply`;
`--report` writes the JSON. Run on staging before promotion and on prod right after, as a checklist line.
(U1-SEC-08, R3.9, T7)
