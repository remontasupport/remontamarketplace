# Code Generation Plan -- unit `alert-policy` (U1)

**Single source of truth for this unit.** Design: `../alert-policy/infrastructure-design/`. Stories US-PH-17,
US-PH-18. Requirements FR-14, FR-15. Code branch **`fix/alert-latency-policy` from `main`** (code only; the
AI-DLC documents stay on `aidlc/signup-photo-gcs`, as previous cycles did). One PR. CI: `Infra Quality` runs on any
change under `infra/`.

## Unit context

- **Implements**: the corrected latency policy and a repeatable apply step; a test that pins the policy's shape.
- **Depends on**: nothing in the other units. U3 does not depend on it either; it goes first because it stops the
  emails.
- **Touches**: `infra/cloudrun/monitoring/latency-p95.json`, `infra/cloudrun/bootstrap.sh`, new
  `infra/cloudrun/lib.sh` and `infra/cloudrun/apply-alerts.sh`, new `infra/test/monitoring.test.ts`,
  `infra/README.md`, `CLAUDE.md` (one line). No api image change, no deploy.
- **Owns**: no data; the live policy `remonta-api latency-p95` in Cloud Monitoring.

## Guiding rules

- The JSON file is the source of truth; the script applies it, never the other way round.
- One table of stages and policy names, read by both scripts (`lib.sh`), so bootstrap and apply cannot drift.
- The script never deletes a policy and exits non-zero on any gcloud failure.
- Nothing in this unit needs credentials in CI: tests parse files only.

## Steps

### Part A -- the policy

- [ ] **A1 `infra/cloudrun/monitoring/latency-p95.json`**: replace the single condition with the two of the design:
  `p95 latency > 2000 ms` (`request_latencies`, `ALIGN_DELTA` + `REDUCE_PERCENTILE_95`, group by service, `> 2000`,
  `600s`, missing data inactive) and `requests per 5 min >= 60` (`request_count`, `ALIGN_DELTA` + `REDUCE_SUM`,
  group by service, `> 59`, `600s`, missing data inactive); `combiner: AND`; the new documentation text; everything
  else unchanged. (US-PH-17)

### Part B -- the scripts

- [ ] **B1 new `infra/cloudrun/lib.sh`**: `STAGES=(staging prod)`, `service_for`, `alerts_for` (moved verbatim
  from bootstrap), `say`, `exists`, `resolve_channel <email>` (find-or-create, moved from step 9),
  `render_policy <file> <service> <stage> <channel> <project>` (the sed line). Comment: "sourced by bootstrap.sh and
  apply-alerts.sh; the test suite reads the two tables from here".
- [ ] **B2 new `infra/cloudrun/apply-alerts.sh`**: usage `apply-alerts.sh <staging|prod> [--project <id>]
  [--email <address>] [--only <policy>] [--dry-run]`; defaults: the active gcloud project, the bootstrap email.
  For each policy of the stage: render; list by display name; absent → `create --policy-from-file=-` (or print
  `would create` in dry run); present → `describe --format=json`, normalise both sides with `node -e` (drop
  `name`, `creationRecord`, `mutationRecord`, `enabled`, condition `name`s; sort keys), equal → `unchanged`;
  different → print a unified diff of the two normalised documents, then `update <name> --policy-from-file=-` (or
  `would update` in dry run). Summary line at the end; `set -euo pipefail`. (US-PH-18)
- [ ] **B3 `infra/cloudrun/bootstrap.sh`**: `source "$here/lib.sh"`; delete the local copies of the tables and
  helpers; step 9 becomes `resolve_channel`, then `"$here/apply-alerts.sh" "$STAGE" --project "$PROJECT" --email
  "$EMAIL"` per stage; the header comment's step 9 line mentions the apply script. `bash -n` both scripts.

### Part C -- the test

- [ ] **C1 new `infra/test/monitoring.test.ts`**: (a) every `cloudrun/monitoring/*.json` parses, has
  `displayName` starting `__SERVICE__`, uses only the four placeholders, `notificationChannels == ["__CHANNEL__"]`;
  (b) `lib.sh`'s `alerts_for` names for each stage match files on disk (read the file, regex the two `case` arms);
  (c) `latency-p95.json`: two conditions, combiner `AND`, condition 1 and 2 exactly as A1 (metric types, aligners,
  reducers, thresholds, durations, `EVALUATION_MISSING_DATA_INACTIVE`), and the documentation mentions "60 requests".
  Also assert prod's list contains `latency-p95` and staging's does not.

### Part D -- documentation

- [ ] **D1 `infra/README.md`**: add the row "Apply alert policies | `cloudrun/apply-alerts.sh` | …" to the table
  and one sentence under the bootstrap row (bootstrap calls it; run it alone after editing a policy JSON;
  `--dry-run` shows the diff).
- [ ] **D2 `CLAUDE.md`**: in the Cloud Run block, the `Alerts:` line gains "change a policy: edit
  `infra/cloudrun/monitoring/<name>.json`, merge, then `bash infra/cloudrun/apply-alerts.sh prod`".

### Part E -- gates (before the PR)

- [ ] **E1** `pnpm --filter @remonta/infra run quality` green (lint, tsc, the new and existing tests, render:check).
- [ ] **E2** `bash -n infra/cloudrun/bootstrap.sh infra/cloudrun/apply-alerts.sh infra/cloudrun/lib.sh`; then
  `bash infra/cloudrun/apply-alerts.sh prod --dry-run` from this machine (read-only: lists and describes) must print
  `would update: remonta-api latency-p95` with the diff and `unchanged` for the other five, and
  `apply-alerts.sh staging --dry-run` must print `unchanged` for both of staging's policies.
- [ ] **E3** `aidlc-docs/construction/alert-policy/code/alert-policy-summary.md`: files changed, the dry-run
  output, what Build and Test will do.

## Build and Test (after approval of the generated code)

1. Push `fix/alert-latency-policy`, open the PR (compare URL with the encoded slash), wait for `Infra Quality`
   and the other checks.
2. Merge with "Merge pull request". No deploy follows (no api path change; the lockfile is untouched).
3. **With your go**: `bash infra/cloudrun/apply-alerts.sh prod` from this machine; paste the output into the summary;
   `describe` the live policy and compare with the file.
4. Verification over the next day: no `latency-p95` email; the production request-count series stays under 60 per
   window (Monitoring API query); record in the summary.
5. Rollback if ever needed: apply the previous JSON (`git show <sha>:…`) with `--only latency-p95`.

## Story traceability

| Story | Steps |
|---|---|
| US-PH-17 An alert that means saturation | A1, C1, Build and Test 3-4 |
| US-PH-18 Apply a policy change to the live project | B1, B2, B3, D1, D2, E2, Build and Test 3 |
