# Infrastructure Design -- unit `worker-area` (U1)

**Decisions:** plan Q1 A (the load test from the operator's machine against staging), Q2 A (`maxInstances` 10 plus a
billing budget), Q3 A (a temporary live override for the event-loop drill, restored by redeploy); approved
2026-10-09. Everything else maps to what exists.

## 1. The stages table (`infra/lib/stages.ts`)

| Field | prod today | prod after U1 | staging | Why |
|---|---|---|---|---|
| `maxInstances` | 4 | **10** | 1 | U1-SCL-03, Q2 A |
| `MAX_IN_FLIGHT` | 128 | **64** | 64 | below `concurrency` 80 so the in-flight signal can fire (P2) |
| `minInstances`, `concurrency`, `cpu`, `memory` | 1, 80, 1, 1Gi | unchanged | 1, 80, 1, 512Mi | |
| `DB_POOL_SIZE`, `DB_POOL_TIMEOUT_S` | 5, 5 | unchanged | 5, 5 | 50 connections at full scale (P5) |
| `MAX_EVENT_LOOP_DELAY_MS` | 200 | unchanged | 200 | |

Code changes: the two values; `infra/test/cloudrun.test.ts` asserts `[1, 10]` for prod and keeps the set of
differing env names (`MAX_IN_FLIGHT` no longer differs → it leaves the list); `pnpm --filter @remonta/infra run
render` regenerates `service.prod.yaml` (`maxScale: "10"`, `MAX_IN_FLIGHT: "64"`); `render:check` passes.
Rollback: dispatching `deploy-api` with the previous image re-applies that image's YAML (the table is read at
render time, so the previous image carries the previous values); Cloud Run also keeps the previous revision.

## 2. Neon verification (U1-SCL-05), by the operator before PR 1 merges

In the Neon console (project Sydney):
1. **Connection strings**: for the role the api uses, copy the pooled string; confirm the host carries `-pooler`
   and that the secret versions `remonta-api-AUTH_DATABASE_URL` (latest) and `remonta-api-staging-AUTH_DATABASE_URL`
   (latest) hold that host **and** `?pgbouncer=true` (add the parameter as a new secret version if missing:
   `printf '%s' '<url>' | gcloud secrets versions add ... --data-file=-`, then redeploy the stage).
2. **Compute**: note the compute size (CU) and autoscaling range of the production branch and of `rehearse-w1`;
   Neon's `max_connections` for that size and the pooler's `default_pool_size`; confirm the pooler limit exceeds
   50 (api) + the app's Prisma pool (its `connection_limit`, from `apps/app/.env`'s URL) with margin.
3. Record the four values and the date in `infra/README.md` → a new section "Database connections (U1
   worker-area)"; the PR carries it.

The session cannot read the console; the checklist line in US-WP-32 is "Neon values recorded in the README".

## 3. Billing budget (Q2 A), once, by console

Cloud Billing → Budgets → create: scope the project `remonta-api-510206`, amount A$300 a month, thresholds 50 %,
90 %, 100 % (actual), email to `support@remontaservices.com.au`. Recorded in `infra/README.md`'s cost section with
the arithmetic (one always-on instance ≈ A$80-100; ten instances all month ≈ A$900-1,000 only under sustained
overload, which the 5xx-ratio alert reports first). Not code: budgets are not in the table.

## 4. The load-test runbook (U1-PRF-03, P10, Q1 A)

Environment (operator's machine, Australia): `STAGING_API_TOKEN_SECRET`, `STAGING_AUTH_DATABASE_URL` exported for
the shell session only (as for `staging-admin-check.ts`); `pnpm install` done.

```
cd apps/api
pnpm exec tsx scripts/load-worker.ts \
  --base-url https://remonta-api-staging-<project-number>.australia-southeast1.run.app \
  --workers 200 --rate 25 --minutes 10 --burst 5 \
  --report ../../aidlc-docs/construction/worker-area/code/load-<YYYY-MM-DD>.json
```
The script refuses any base URL whose host lacks `staging` and any database host that is production's. It warms
for 60 s (not counted), runs phase A (10 min at 25 req/s), phase B (60 s at 125 req/s), then a 60 s recovery
window, and prints the thresholds table with PASS/FAIL per row (U1-PRF-03); exit 0 only on all PASS. The JSON
report is committed with the construction notes; the summary lines go into the PR's verification record.

## 5. The drills' runbook (P13 g, h; Q3 A)

**(g) Burst** = phase B above, with a second terminal watching restarts:
```
gcloud run revisions list --service remonta-api-staging --region australia-southeast1 --limit 3
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api-staging" AND (textPayload:"liveness" OR severity>=ERROR)' --freshness=15m --limit 50
```
Expected: no liveness failure, no restart; the report's 503 share for phase B is noted.

**(h) Event-loop signal**:
```
gcloud run services update remonta-api-staging --region australia-southeast1 --update-env-vars MAX_EVENT_LOOP_DELAY_MS=50
pnpm exec tsx scripts/load-worker.ts ... --rate 25 --minutes 5 --burst 1 --report .../load-<date>-eventloop.json
# restore the rendered configuration:
Actions → deploy-api → Run workflow → stage=staging, imageTag=<the same sha>
```
Expected: 503 `reason: 'shed'` lines appear during the run and stop after the restore; health stays 200
throughout. Both drills are recorded in the construction notes. Never on prod.

## 6. The backfill runbook (P14)

```
# staging, before promotion (reads STAGING_AUTH_DATABASE_URL)
pnpm exec tsx scripts/backfill-completion.ts --report ../../aidlc-docs/construction/worker-area/code/backfill-staging-dry.json
pnpm exec tsx scripts/backfill-completion.ts --apply --report .../backfill-staging.json
# prod, right after promotion (reads apps/api/.env's production URL; the guard requires the flag)
pnpm exec tsx scripts/backfill-completion.ts --report .../backfill-prod-dry.json
pnpm exec tsx scripts/backfill-completion.ts --allow-production --apply --report .../backfill-prod.json
```
Idempotent: a second `--apply` reports zero changes. The dry-run counts per flag are in the construction notes.

## 7. What is not provisioned

No new service, bucket, secret, queue, DNS name, policy or dashboard. The worker entry rides on the api's existing
URL, CORS, TLS, logging and alerting. Vercel is untouched in U1.

## 8. Cross-check

| Requirement | Section |
|---|---|
| U1-SCL-03 | 1 |
| U1-SCL-05 | 2 |
| U1-PRF-03 | 4 |
| U1-REL-03 | 4 (the report's home) |
| P13 g, h | 5 |
| P14 | 6 |
| US-WP-30, US-WP-32 | 1, 2, 4, 5, 6 |
