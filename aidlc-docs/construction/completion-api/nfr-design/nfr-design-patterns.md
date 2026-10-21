# C1 `completion-api`: NFR design patterns (2026-10-21)

Answer: `construction/plans/completion-api-nfr-design-plan.md` Q1 A (an alert). The proposed design stood.

| # | Pattern | Detail | Rule |
|---|---|---|---|
| CP1 | **Reviewed switch** | `COMPLETION_MODEL` (`legacy`/`groups`) and `COMPLETION_SYNC_INTERVAL_MS` in `infra/lib/stages.ts` `environment` (both stages `legacy`, `300000`), rendered into `service.<stage>.yaml`; validated by the api's config at boot (anything else refuses to start). The switch is a one-line PR + the promotion of an image that runs on staging | NFR-C1, RESILIENCY-04 |
| CP2 | **Bounded, resumable job** | lease = timeout = 4 min; batches of 200; one transaction per batch, write statement timeout 5 s; stop at the timeout; the watermark (incremental) or a cursor in `lastResult` (the daily pass) is kept at the last finished batch, so the next run resumes | NFR-C3, RESILIENCY-09, -10 |
| CP3 | **Single runner** | the scheduler's lease row: two instances never run it at once | NFR-C3 |
| CP4 | **Off-peak full pass** | the first run after 03:00 Australia/Sydney does every profile (about 1,900 today, about 10 batches) | RESILIENCY-09 |
| CP5 | **Safe backfill** | dry run by default; `--apply` refuses without a dry-run report of the same model written in the last hour; writes only differing rows; idempotent | FR-STO-04 |
| CP6 | **Reversible meaning** | rollback: the PR back to `legacy`, a promotion, `backfill --model=legacy --apply`; the app by Vercel promote | RESILIENCY-04 |
| CP7 | **Alerting (Q1 A)** | on a failed run the job logs `alert: "completion-sync-failed"` (besides the scheduler's own error line); a log-based metric `remonta-api-completion-sync-failed`; a policy `infra/cloudrun/monitoring/completion-sync-failing.json`: ≥ 3 in 15 minutes (three runs in a row at the 5-minute interval) → support@, as the other policies (`apply-alerts.sh <stage>`) | RESILIENCY-07, SECURITY-14 |
| CP8 | **Logs carry counts** | the summary `{ checked, changed, byFlag, fullPass }`; no ids or values in logs; ids only in the backfill's report file (never committed) | SECURITY-03 |
| CP9 | **Access** | `GET /v1/worker/completion` WORKER-only, own data, the worker read limits, private cache 60 s + ETag | NFR-C4 |

## Testing scenarios (RESILIENCY-14)

| # | Scenario | Expected |
|---|---|---|
| CT1 | A batch's statement times out | the run stops, logs the failure, nothing half written (the batch's transaction rolled back); the next run resumes at that batch |
| CT2 | Two instances tick together | one holds the lease; the other skips |
| CT3 | The database is down | the run fails (alert after three); the next run retries from the same watermark |
| CT4 | The backfill run twice | the second changes nothing |
| CT5 | `COMPLETION_MODEL` unset or misspelt | the api refuses to boot (config test) |
| CT6 | Switch `legacy` → `groups` → `legacy` | the stored flags return to today's values exactly (property under `legacy`) |

## Property tests (PBT)

The functional design's five, plus: **resumability** -- for any cut points across runs (the timeout hit after any
batch), the union of the processed profiles equals one full pass, and no profile is written twice with different values.
