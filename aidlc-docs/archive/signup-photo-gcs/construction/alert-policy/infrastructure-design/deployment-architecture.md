# Deployment Architecture -- unit `alert-policy` (U1)

## Where things live

| Thing | Location |
|---|---|
| The policy's source of truth | `infra/cloudrun/monitoring/latency-p95.json` (git) |
| The live policy | Cloud Monitoring, project `remonta-api-510206`, `projects/…/alertPolicies/9917060865515580205` (display name `remonta-api latency-p95`) |
| The apply step | `infra/cloudrun/apply-alerts.sh` (git); run by a person with `gcloud` |
| The shape test | `infra/test/monitoring.test.ts`, part of `pnpm --filter @remonta/infra run quality` and CI's infra checks |

Staging has no latency policy (its alert set is `instance-down`, `outbox-dead-letter`); nothing changes there.

## How a change is deployed

```
edit latency-p95.json ──> PR (infra quality: JSON shape test) ──> merge to main
                                                                      │
                 operator: bash infra/cloudrun/apply-alerts.sh prod ──┘  (prints updated / unchanged / created)
                 verify: gcloud alpha monitoring policies describe <name> --format=json  == file (conditions, combiner)
```

Merging to `main` deploys nothing for this unit: `deploy-api` only reacts to api, packages, infra **and** lockfile
paths for the image build, and a monitoring JSON change does not alter the image. The apply step is the deployment.
It is run after the merge so the live policy never runs ahead of the reviewed file.

## Verification

1. `apply-alerts.sh prod` prints `updated` for `latency-p95` and `unchanged` for the other five.
2. `describe` of the live policy shows two conditions, combiner `AND`, both durations `600s`,
   `EVALUATION_MISSING_DATA_INACTIVE`.
3. Metrics Explorer (or the Monitoring API query used on 2026-10-05): the request-count series for `remonta-api`
   stays under 60 per window at current traffic, so the policy is silent; the latency series still shows the p95.
4. The following day passes without a `latency-p95` email (requirements §6.3). Record the run in
   `aidlc-docs/construction/alert-policy/code/` with the timestamps.

## Rollback

Re-apply the previous JSON: `git show <previous sha>:infra/cloudrun/monitoring/latency-p95.json > /tmp/p.json`
then the apply step with that file (the script accepts `--file` for one policy), or `git revert` and apply.
Nothing else depends on the policy.
