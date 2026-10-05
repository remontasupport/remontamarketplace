# Code summary -- unit `alert-policy` (U1)

**Branch** `fix/alert-latency-policy` from `main` `635273b`, one commit `8893230`, pushed 2026-10-05.
**PR**: https://github.com/remontasupport/remontamarketplace/compare/main...fix%2Falert-latency-policy?expand=1
(9 files, +318 / -33). Plan: `../../plans/alert-policy-code-generation-plan.md` (A1-E2 done).

## Files

| File | Change |
|---|---|
| `infra/cloudrun/monitoring/latency-p95.json` | Modified: two conditions (service-wide p95 > 2000 ms; request count > 59 per 300 s), `AND`, `600s` each, `EVALUATION_MISSING_DATA_INACTIVE`, new documentation text |
| `infra/cloudrun/monitoring/5xx-ratio.json`, `instance-down.json` | Modified: the `→` in the documentation became `->` (ASCII; see below) |
| `infra/cloudrun/lib.sh` | Created: `STAGES`, `service_for`, `alerts_for`, `say`, `exists`, `find_channel`, `create_channel`, `render_policy` -- sourced by both scripts |
| `infra/cloudrun/apply-alerts.sh` | Created: `apply-alerts.sh <stage> [--project] [--email] [--only] [--dry-run]`; render, look up by display name, create / compare / update, never delete; the comparison ignores server-assigned fields and proto defaults; prints the differing paths |
| `infra/cloudrun/bootstrap.sh` | Modified: sources `lib.sh`; step 9 calls `apply-alerts.sh` per stage; header line |
| `infra/test/monitoring.test.ts` | Created: 12 tests -- every policy file's placeholders and labels; `lib.sh`'s tables against `lib/stages.ts` and the files on disk; `latency-p95`'s exact shape |
| `infra/README.md` | Modified: bootstrap row; new "Apply alert policies" row |
| `CLAUDE.md` | Modified: the `Alerts:` line says how to change a policy |

## Gates (2026-10-05, this machine)

- `pnpm --filter @remonta/infra run quality`: lint, tsc, **35 tests passed** (12 new), render drift check clean.
- `bash -n` on the three scripts: ok.
- `apply-alerts.sh prod --dry-run` (read-only):

```
would update: remonta-api instance-down        (documentation text: "?" -> "->")
unchanged:    remonta-api outbox-dead-letter
would update: remonta-api 5xx-ratio            (documentation text: "?" -> "->")
would update: remonta-api latency-p95          (documentation; combiner OR -> AND; conditions: the two of the design)
unchanged:    remonta-api request-failed
unchanged:    remonta-api will-not-start
dry run: 0 to create, 3 to update, 3 unchanged (prod)
```

- `apply-alerts.sh staging --dry-run`: `instance-down` would update (same text fix), `outbox-dead-letter` unchanged.

Two things the first dry run taught, both fixed before the commit: Cloud Monitoring omits a `thresholdValue` of 0
from what it returns (the comparison now treats absent as the proto default), and the `→` in three policy texts
had reached the live policies as `?` when bootstrap piped them through gcloud on Windows (the files are ASCII now;
applying corrects the live text, which is why `instance-down` and `5xx-ratio` show as updates).

Side effect: the dry run installed gcloud's `beta` component on this machine (bootstrap already used
`gcloud beta monitoring channels`).

## Build and Test (to do)

1. Open the PR from the link above (commit count 1, files 9); wait for `Infra Quality` and the other checks.
2. Merge with "Merge pull request". No deploy follows.
3. With the user's go: `bash infra/cloudrun/apply-alerts.sh prod` (and `staging` for the text fix); paste the
   output here; `gcloud alpha monitoring policies describe projects/remonta-api-510206/alertPolicies/9917060865515580205 --format=json`
   must show two conditions, `AND`, `600s`, missing data inactive.
4. Next day: no `latency-p95` email; request-count series under 60 per window. Record here.

## Build and Test -- done 2026-10-05

1. PR #36 opened by the user and merged into `main` as `e20dee4` (verified by `git merge-base --is-ancestor` on
   `origin/main`). Checks on the merge commit: CI (infra), CodeQL, Semgrep, CI (supply chain) green; `deploy-api`
   started (the `infra/` path triggers it; it rebuilds the same api code for staging; production untouched).
2. `bash infra/cloudrun/apply-alerts.sh prod` (from `main` `e20dee4`, this machine, 03:45Z):

```
updated:   remonta-api instance-down        (text: "?" -> "->")
unchanged: remonta-api outbox-dead-letter
updated:   remonta-api 5xx-ratio            (text)
updated:   remonta-api latency-p95          (text; OR -> AND; the two conditions)
unchanged: remonta-api request-failed
unchanged: remonta-api will-not-start
done: 0 created, 3 updated, 3 unchanged (prod)
```

   `apply-alerts.sh staging`: `instance-down` updated (text), `outbox-dead-letter` unchanged. A second
   `prod --dry-run` afterwards: 6 unchanged, so the comparison is stable.
3. Live policy `projects/remonta-api-510206/alertPolicies/9917060865515580205` read back: enabled, combiner `AND`,
   two conditions -- `request_latencies` `ALIGN_DELTA` + `REDUCE_PERCENTILE_95` > 2000 for `600s`, and
   `request_count` `ALIGN_DELTA` + `REDUCE_SUM` > 59 for `600s`, both `EVALUATION_MISSING_DATA_INACTIVE`;
   `mutationRecord.mutateTime` 2026-10-05T03:45:20Z. Health: staging 200, production 200.
4. **Still open (next day):** no `latency-p95` email arrives, and the production request-count series stays under
   60 per window. To record here by the user or the next session.

Rollback, if ever: `git show 635273b:infra/cloudrun/monitoring/latency-p95.json` into a file and
`apply-alerts.sh prod --only latency-p95` with the previous content (the script reads from `monitoring/`, so put
the old JSON there on a branch), or revert the merge and apply.
