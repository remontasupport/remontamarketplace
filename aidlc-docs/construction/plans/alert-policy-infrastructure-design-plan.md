# Infrastructure Design Plan -- unit `alert-policy` (U1)

**Inputs:** requirements FR-14, FR-15; stories US-PH-17, US-PH-18; application design C20 and flow S-H;
`infra/cloudrun/monitoring/latency-p95.json`, `bootstrap.sh` step 9, the sibling policies (`5xx-ratio`,
`request-failed`), and two measurements taken on 2026-10-05 against production's metric (7 days):

| Aggregation | Points | Top values |
|---|---|---|
| Today's (`ALIGN_PERCENTILE_95` per series, `REDUCE_MAX` across) | 35 | 4034, 3667, 2277, 2070 ms |
| Service-wide (`ALIGN_DELTA`, `REDUCE_PERCENTILE_95`) | 35 | 3997, 3534, 2256, 1985 ms |

At today's volume (busiest 5-minute window: 25 requests; 7 windows with 10 or more in 5 days) the service-wide p95
is still the single photo upload, so the aggregation change alone would not stop the emails. The metric's `route`
label exists but is empty on every series, so the photo route cannot be excluded by filter. The control that works
is a request-volume floor: p95 over N requests is the k-th slowest with k = ceil(0.05 N), so N >= 60 means at least
three requests must be slow before the alert can fire.

Two questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done").

## Question 1
How the policy decides "saturation".

A) **Service-wide p95 with a volume floor, no new metric.** Condition 1: `request_latencies` aligned `ALIGN_DELTA`,
reduced `REDUCE_PERCENTILE_95`, grouped by service, `> 2000 ms`, duration 600 s (two windows). Condition 2:
`request_count` aligned `ALIGN_DELTA`, reduced `REDUCE_SUM`, grouped by service, `> 59` per 300 s window, duration
600 s. Combiner `AND`; `evaluationMissingData: EVALUATION_MISSING_DATA_INACTIVE` so quiet periods never evaluate as
failing. At today's traffic the policy cannot fire, which is correct for a saturation alert; it becomes active as
traffic grows, and U3 removes the slow route anyway. Recommended.

B) **A logs-based latency distribution that excludes the photo route.** A new log metric (bootstrap `metric`
helper) over `httpRequest.latency` for `remonta-api` with the photo URL and `/v1/health` excluded, then the same
p95 and floor on it with a lower floor (N >= 20). Meaningful at today's traffic, but one more metric to maintain and
a filter that must change again when the photo route moves (U3 PRs 3b and 3c).

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
How policy changes reach Google Cloud (FR-15).

A) **A new `infra/cloudrun/apply-alerts.sh <stage>`**, called by bootstrap step 9 and runnable alone: for each
policy of the stage, render the placeholders exactly as bootstrap does, look the policy up by display name, `update`
it in place with `--policy-from-file=-` when it exists (the whole policy is replaced; notification channel and
labels come from the file), `create` it otherwise; print `updated` / `created` / `unchanged` per policy, where
"unchanged" is decided by comparing the rendered JSON with the live policy's conditions and documentation. Bootstrap
keeps its idempotent shape. Recommended.

B) **Inline in bootstrap only** (replace the `exists` branch with an update); no standalone script. Fewer files;
applying one policy change means re-running the whole bootstrap.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Fixed by the requirements (not questions)

- The documentation text of the policy describes the service-wide p95, the floor and the duration, and keeps the
  runbook pointers (instance count and CPU, the pooler, the `shed:` lines).
- Severity stays `WARNING`; `autoClose` stays 1800 s; staging keeps its minimal alert set (no latency policy).
- The `infra` quality gate gains a test that parses every policy JSON, checks the placeholders and, for
  `latency-p95`, asserts the two conditions, the `AND` combiner and the missing-data setting, so a future hand edit
  cannot regress the shape silently.
- Verification (requirements §6.3): after `apply-alerts.sh prod`, the live policy's conditions match the file; a
  deliberately slow single request on staging cannot fire it (staging has no latency policy; the check is the
  Metrics Explorer reading for production's next windows); the next day passes without a single-upload email.

## Execution checklist

- [ ] 1. Confirm the two answers; resolve ambiguity in a clarification file
- [ ] 2. `aidlc-docs/construction/alert-policy/infrastructure-design/infrastructure-design.md`: the policy's
  conditions, thresholds, durations, missing-data behaviour and documentation text; the apply step's behaviour;
  IAM needed (the operator's own account, as for bootstrap)
- [ ] 3. `deployment-architecture.md`: where the policy lives, how it is applied per stage, how it is verified and
  rolled back (re-apply the previous JSON)
- [ ] 4. Present for approval
