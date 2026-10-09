# Logical Components -- unit `worker-area` (U1)

| Component | Where | Configuration (prod / staging) | Failure mode | Observed by |
|---|---|---|---|---|
| Load shedder | `platform/load/load-shedder.ts`, `app.ts` onRequest | `MAX_IN_FLIGHT` 64 / 64; `MAX_EVENT_LOOP_DELAY_MS` 200 / 200; `Retry-After: 2` | refuses with 503 before the body is read; probes exempt | the 503 `reason: 'shed'` lines; the 5xx-ratio policy does **not** count 503 as failure (it counts 5xx/all: 503s do count -- the burst drill confirms the ratio stays under 2 % averaged over the policy's window at the sustained rate) |
| Rate limiter | `platform/rate-limit` (Postgres buckets) | reads 120/min user + 300/min IP; writes 60/120; tickets 10 (U3); purge every 10 min | 429 + `Retry-After`; on counter failure 503 `reason: 'limiter'`; probes skip it | the 429/503 lines; the `rate_limit_buckets` size |
| Database pool | `platform/persistence/db.ts` (Prisma, pooled Neon URL) | `DB_POOL_SIZE` 5, `DB_POOL_TIMEOUT_S` 5 per instance; 50 connections at 10 instances; `pgbouncer=true` verified | P2024 → 503 `reason: 'pool'`; 57014 → 503 `reason: 'timeout'` | the 503 lines; Neon's connection graph (operator) |
| Read transaction | `modules/worker/persistence/profile-read.ts` | `statement_timeout` 5 s; ReadCommitted; ≤ 8 statements | 503 on timeout; 404 on no profile | the query-count test; `EXPLAIN` on staging |
| Health path | `modules/platform/platform.handlers.ts` + `platform/persistence` success timestamp | recent window 30 s; fallback `SELECT 1` with 2 s timeout; Cloud Run liveness 15 s / 5 s / 3 failures | 503 when no recent success and the query fails | Cloud Run revision events (restarts); the instance-down policy |
| Private cache step | `platform/pipeline/pipeline.ts` (existing) | `privateCacheSeconds` 60 on `getProfile`; strong ETag (sha256 of canonical JSON); memo excluded | none (a hash mismatch is a 200) | the 304 share in the load report |
| Worker module read path | `modules/worker/{worker.handlers, application/get-profile, application/own-profile, domain/completion, domain/service-requirements}` | pure completion; masking in shaping | 404 / 503 / 500 (output schema) | one line per request; P1/P2 property tests |
| Completion persistence | `domain/completion.ts` `persistCompletion` (called by writes in U2-U4; by the backfill in U1) | writes only on change; `NOT_STARTED → IN_PROGRESS` | none beyond the transaction's | the backfill report |
| Load generator | `apps/api/scripts/load-worker.ts` (autocannon) | `--rate 25 --minutes 10`, `--burst 5`; staging only; `STAGING_*` secrets | exit 1 on thresholds, 2 on guards | the JSON report in the construction notes |
| Backfill | `apps/api/scripts/backfill-completion.ts` | dry run; `--apply`; batches of 200; `--allow-production` | refuses production without the flag | the report |
| Stages table | `infra/lib/stages.ts` → `service.*.yaml` | prod `maxInstances` 10, `MAX_IN_FLIGHT` 64, pool 5; staging 1 instance | `render:check` fails on drift | CI |
| Logging and alerts | pino with redaction; Cloud Logging; seven policies | redaction paths + bank/street/storage key; `reason` on 503s | -- | the two saved queries (U1-REL-02) |

## Sequences

**Normal read**
```
browser --GET /v1/worker/profile (If-None-Match?)--> shedder: admit --> limiter ip --> auth (JWT) --> role WORKER
  --> limiter user --> parse (no input) --> handler: tx { SET LOCAL statement_timeout=5000; profileIdOf; profile select;
  sections; catalogue } --> completionOf --> shape (mask) --> output check --> ETag; If-None-Match equal? 304 : 200
  --> lastDbSuccessAt = now --> log line {entry, status, durationMs, userId}
```

**Shed**
```
browser --GET--> shedder: inFlight >= 64 or loop p99 > 200 ms --> 503 Retry-After: 2 {reason: 'shed'}  (no auth, no db)
```

**Pool exhausted**
```
... handler: tx open waits > 5 s --> P2024 --> 503 Retry-After {reason: 'pool'} --> log error {pool: 'timeout'}
probe meanwhile: lastDbSuccessAt within 30 s --> 200 without a query
```

**Database down**
```
requests: tx fails to connect --> 503 {reason: 'pool' | 'init'}; lastDbSuccessAt ages
probe at +15 s: recent --> 200; at +30 s: stale --> SELECT 1 (2 s) fails --> 503; third failure at ~+60 s --> restart
```

## Cross-check

| Requirement | Component / pattern |
|---|---|
| U1-AVL-02 | shedder, P2 |
| U1-AVL-03 | pool, health path, P4, P5 |
| U1-PRF-02 | private cache step, P6 |
| U1-PRF-03 | load generator, P10, P13 (g) |
| U1-SCL-03 | stages table, P11 |
| U1-SCL-04 | P11; the memo exclusion test |
| U1-REL-01 | logging and alerts, P12 |

**Note on the 5xx-ratio policy:** it counts every 5xx including 503; a burst that sheds heavily for a minute will
not trip a 2 % ratio over the policy's window at normal traffic, but a sustained overload will, which is the
intended signal (the service is at its ceiling: raise the table). Recorded for the operator in `docs/worker/`.
