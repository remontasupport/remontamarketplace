# C1 `completion-api`: NFR design plan (2026-10-21)

Inputs: NFR-C1..C5 (`inception/requirements/completion-requirements.md`), the functional design
(`construction/completion-api/functional-design/`, approved 2026-10-21), the resiliency targets carried forward.

## Read on `main` for this plan

- Per-stage plain settings live in `infra/lib/stages.ts` `environment` (e.g. `RECONCILER_INTERVAL_MS: '300000'`),
  rendered into `service.<stage>.yaml`; the rule is "edit the table, not the YAML".
- Alerts (`infra/cloudrun/monitoring/`): 5xx ratio, auth failed, instance down, latency p95, outbox dead letter,
  request failed, will not start. **None for a scheduled job that fails.**
- The scheduler: a lease per job (its timeout), a watermark, a `lastResult` summary in `scheduled_jobs`.

## Proposed design (no question needed)

1. **The switch is reviewed, not typed**: `COMPLETION_MODEL` and `COMPLETION_SYNC_INTERVAL_MS` in `stages.ts` (staging
   and prod both `legacy`, `300000`); the release switch = a one-line PR setting prod to `groups`, merged, then the
   usual promotion of an image that already runs on staging. The config refuses any other value at boot.
2. **The job's bounds**: lease and timeout 4 minutes; batches of 200 profiles; one transaction per batch with the
   write statement timeout (5 s); stops cleanly at the timeout with the watermark at the last finished batch; the
   daily full pass resumes across runs the same way (a cursor in the summary).
3. **Load**: the 5-minute run reads only changed profiles (usually a handful); the daily pass reads every profile once
   (about 1,900 today) in about 10 batches, outside business hours (after 03:00 Australia/Sydney).
4. **The backfill's safety**: dry run by default; `--apply` refuses without a dry-run report of the same model from the
   last hour; writes only differing rows; idempotent.
5. **Rollback of the meaning**: the PR back to `legacy`, a promotion, the backfill `--model=legacy --apply`; the
   previous app by Vercel promote.
6. **Security**: the entry is WORKER-only, own data; the job and the backfill log counts only (no ids in logs; ids
   only in the backfill's report file, never committed).
7. **Testing scenarios (RESILIENCY-14)**: a batch's statement times out (the run stops, the next resumes, nothing half
   written); two instances tick at once (one wins the lease); the database is down (the run fails, the next retries);
   the backfill run twice (no change the second time); `COMPLETION_MODEL` unset or wrong (boot refuses).
8. **Property tests (PBT)**: those listed in the functional design, plus the job's resumability (any cut point, the
   union of the runs = one full pass).

## Plan

- [ ] 1. The setting and its release switch
- [ ] 2. The job's bounds, resumption and load
- [ ] 3. The backfill's safety and rollback
- [ ] 4. Observability and alerting -- Q1
- [ ] 5. Testing scenarios and properties
- [ ] 6. Artifacts: `construction/completion-api/nfr-design/{nfr-design-patterns,logical-components}.md`

## Question 1
If `completion-sync` keeps failing (the database unreachable, a bug), the stored flags the admin screens read go stale
without anyone knowing. Should there be an alert?

A) Yes: a Cloud Monitoring policy "completion-sync failing" when the job fails 3 runs in a row (about 15 minutes),
emailing support@ like the other alerts (recommended)

B) No alert: the worker's own screens are always right (they compute on read); the admin's views can lag

X) Other (please describe after [Answer]: tag below)

[Answer]: 
