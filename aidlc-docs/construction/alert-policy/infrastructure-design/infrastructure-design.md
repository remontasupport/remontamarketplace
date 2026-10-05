# Infrastructure Design -- unit `alert-policy` (U1)

**Decisions:** plan Q1 A (service-wide p95 with a volume floor), Q2 A (standalone apply script); approved
2026-10-05. Stories US-PH-17, US-PH-18. Requirements FR-14, FR-15.

## 1. The policy `remonta-api latency-p95` (file `infra/cloudrun/monitoring/latency-p95.json`)

| Field | Value | Why |
|---|---|---|
| `displayName` | `__SERVICE__ latency-p95` | unchanged; the apply step finds the live policy by this name |
| `combiner` | `AND` | both conditions must hold at the same time |
| Condition 1 `p95 latency > 2000 ms` | filter: `cloud_run_revision`, service `__SERVICE__`, metric `run.googleapis.com/request_latencies`; aggregation: `alignmentPeriod 300s`, `perSeriesAligner ALIGN_DELTA`, `crossSeriesReducer REDUCE_PERCENTILE_95`, `groupByFields [resource.labels.service_name]`; `COMPARISON_GT 2000`; `duration 600s`; `trigger.count 1`; `evaluationMissingData EVALUATION_MISSING_DATA_INACTIVE` | one series per service holding the p95 of all requests in the window (measured 2026-10-05: 3997 ms for the 4034 ms window, i.e. the same information as today once volume is present); two consecutive windows |
| Condition 2 `requests per 5 min >= 60` | filter: same resource and service, metric `run.googleapis.com/request_count`; aggregation: `300s`, `ALIGN_DELTA`, `REDUCE_SUM`, group by service; `COMPARISON_GT 59`; `duration 600s`; `trigger.count 1`; `evaluationMissingData EVALUATION_MISSING_DATA_INACTIVE` | the floor: p95 over 60 requests is the third slowest, so one upload cannot fire it; quiet windows evaluate as not failing |
| `documentation.content` | "p95 request latency of __SERVICE__ (__STAGE__) above 2 s for two consecutive 5-minute windows while the service handled at least 60 requests per window: saturation, not one slow request (a single upload cannot trip this). Check instance count and CPU in Cloud Run → __SERVICE__ → Metrics; the database's pooler; the load-shedding log lines (`shed:`). Edit `infra/cloudrun/monitoring/latency-p95.json` and run `infra/cloudrun/apply-alerts.sh prod` to change it." | the runbook as before, plus what the policy now means and how to change it |
| `notificationChannels` | `["__CHANNEL__"]` | unchanged |
| `alertStrategy.autoClose` | `1800s` | unchanged |
| `severity` | `WARNING` | unchanged |
| `userLabels` | unchanged | |

Numbers behind the floor (production sample, 5 days, 2026-10-05): 212 requests; busiest window 25; windows with
10 or more: 7. The policy is therefore silent until traffic is at least several sign-ups per five minutes, and the
emails caused by single uploads stop at once.

## 2. The apply step (`infra/cloudrun/apply-alerts.sh`)

```
usage: apply-alerts.sh <staging|prod> [--project <id>] [--email <address>]
```

Behaviour, per policy of the stage (the stage's list is the same `alerts_for` table bootstrap uses; both scripts
read it from one place so they cannot drift):

1. Resolve the notification channel exactly as bootstrap step 9 does (find by email; create if missing).
2. Render the JSON: `__SERVICE__`, `__STAGE__`, `__CHANNEL__`, `__PROJECT_ID__`.
3. Look up the live policy by display name (`gcloud alpha monitoring policies list --filter='displayName="…"'`).
4. If absent: `gcloud alpha monitoring policies create --policy-from-file=-` → prints `created`.
5. If present: fetch it (`describe --format=json`), compare `conditions`, `combiner`, `documentation`,
   `alertStrategy`, `severity`, `notificationChannels` and `userLabels` with the rendered JSON after normalising
   (server-assigned `name` fields on conditions, `creationRecord`, `mutationRecord`, `enabled` ignored). Equal →
   prints `unchanged`. Different → `gcloud alpha monitoring policies update <name> --policy-from-file=-` (whole
   policy replaced from the file, as the command documents) → prints `updated`.
6. Exit non-zero on any gcloud failure; never deletes a policy.

Bootstrap step 9 becomes: resolve the channel, then call `apply-alerts.sh` for each stage. The `exists`/`create`
loop in bootstrap is removed, so there is one code path.

Comparison is done with `node -e` (Node is on every machine that runs this repository) or `jq` if present; the
normalisation strips the fields listed above and sorts keys before comparing.

## 3. The infra test (`infra/test/monitoring.test.ts`)

- Parses every `cloudrun/monitoring/*.json`: valid JSON; `displayName` starts with `__SERVICE__`; every string
  placeholder used is one of the four known; `notificationChannels` is `["__CHANNEL__"]`.
- For `latency-p95.json`: exactly two conditions; combiner `AND`; condition 1 on `request_latencies` with
  `ALIGN_DELTA` + `REDUCE_PERCENTILE_95`, threshold 2000, duration `600s`; condition 2 on `request_count` with
  `ALIGN_DELTA` + `REDUCE_SUM`, threshold 59, duration `600s`; both `EVALUATION_MISSING_DATA_INACTIVE`.
- The names in `alerts_for` (bootstrap) match files on disk (the existing name test extends to this).

## 4. Access

The apply step runs with the operator's own `gcloud` login (Monitoring Editor on the project), as bootstrap does.
No service account, no CI credential: policies change by a person, from a reviewed file.

## 5. Extension compliance (Infrastructure Design, U1)

| Rule | Status | Note |
|---|---|---|
| SECURITY-14 alerting | Compliant | the policy still alerts on real saturation; the 5xx, request-failed, instance-down, will-not-start and dead-letter policies are untouched |
| SECURITY-06 least privilege | Compliant | no new principal; operator-run |
| RESILIENCY-05 monitoring | Compliant | the latency signal keeps existing; the floor removes false positives |
| RESILIENCY-07 resiliency alarms | Compliant | unchanged set |
| RESILIENCY-15 incident response | Compliant | same channel, same runbook pointers, plus how to change the policy |
| others | N/A | configuration only |
