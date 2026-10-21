# C1 `completion-api`: construction notes (2026-10-21)

Plan: `construction/plans/completion-api-code-generation-plan.md` (approved 2026-10-21). Branch `feat/completion-api`
from `main` `f00a3cb`, pushed `c4e4505` (7 commits, 29 files, +1,243 −26).

## Commits

| Commit | Layer |
|---|---|
| `15be7e0` | contract: `MY_PROFILE_PAGES` (18 slugs, 11 required), `completionViewSchema`, `getCompletion`; `openapi.json`; tests (entry count 42 → 43) |
| `4956bc1` | `application/completion-items.ts` (the items, the view, `storedCompletion`, the handler's read); `serviceDocumentsDone` extracted from `servicesOf` (no change); the handler; 44 + 3 tests |
| `c97a5e6` | `COMPLETION_MODEL` / `COMPLETION_SYNC_INTERVAL_MS` (config, both stages `legacy` / `300000`, the YAMLs rendered); `replaceSection` writes under the model |
| `e5bd84d` | `completion-sync.job.ts`; the scheduler hands a job its last summary (`lastResult`, optional); registered in `main.ts`; 16 unit tests + 2 PostGIS (CI) |
| `c679aaa` | `backfill:completion --model`, `--apply` needs `--dry-run-report` (`applyGuard`) |
| `6cfd526` | the `completion-sync-failing` alert, its log metric in the bootstrap, prod's alert list |
| `c4e4505` | `docs/worker/README.md` §4 (the groups model, the entry, the switch runbook, the job), §7; `infra/README.md` |

## Deviations from the design

1. **The declaration is in `application/`, not `domain/`** (`completion-items.ts`): it reads the profile read's rows;
   no domain file imports upward. `CompletionInput` is unchanged (the oracle's input); the optional pages are read
   from the rows.
2. **The page list lives in the contract** (`MY_PROFILE_PAGES`), the api's rules keyed on it (a slug without a rule
   does not compile), so C2 can assert the sidebar's slugs against it.
3. **Compliance with no services** has no items; its next step is `services-chosen` (found by the property test).
4. **An empty `COMPLETION_MODEL` means `legacy`** (the loader treats an empty value as unset for every setting); a
   misspelt value refuses to boot.
5. **The incremental part watches documents only** (submitted, reviewed, updated, expired): every worker save already
   recomputes in its transaction, and `worker_profiles.updatedAt` is not bumped automatically; the daily pass covers
   catalogue changes and anything else.
6. **One transaction per worker** in the job (as the reconciler), batches of 200 as the page size.
7. **`JobContext.lastResult`** added to the scheduler (optional), for the daily pass's cursor.

## Verification

- **Two guards proved to fail**: the resumability property fails when the cursor does not advance (restored); the
  first property run found the no-services edge (fixed).
- **Gates** (this machine; database tests skipped, CI runs them): api-contract 108; api 878 passed / 215 skipped (82
  new; 2 new PostGIS tests among the skipped); infra 43, render check clean; app 142 type / 470 lint known, 127 tests;
  `turbo run build` 3/3. Regenerated Prisma clients restored.

## After the merge: the staging checks

1. `GET /v1/worker/completion` with the staging worker's token: 200, the shape, `private, max-age=60`, ETag; 401, 403.
2. The staging worker's view: the 11 required pages, the three groups and their next steps.
3. `scheduled_jobs` row `completion-sync`: a run every 5 minutes, `lastResult` counts, the day's full pass after 03:00
   Sydney (the first may report changes: workers whose stored flags were stale, F5).
4. **The forecast of C2's switch**: `backfill:completion -- --model=groups --report=<file>` (dry run) on the staging
   copy: how many workers' stored flags change, per flag.
5. Today's production app against staging unchanged.
6. At the promotion: the metric (`bootstrap.sh` line, or the whole idempotent bootstrap) and
   `bash infra/cloudrun/apply-alerts.sh prod` (the user, with gcloud).

## Merged and on staging (2026-10-21)

- **PR #89** merged by the user: `main` `1eda05ac2c6682b9fe34d2f09dcb06ca78962a06`; CI on `c4e4505` 14/14 green (API
  Quality Node 20 and 22 with the PostGIS tests, Infra Quality, App, Web, CodeQL, Semgrep, Supply chain, Vercel).
- **Staging:** revision `remonta-api-staging-00055-j29` = image `1eda05a...`, 100 % traffic (04:18Z).
- **Checks 10/10** (tokens from the staging secret, never printed; the staging worker `cmm7aoivq002sjo04iwn6d8km`):
  health 200; the entry 401 / 403 (admin) / 404 (no profile) / 200 with `private, max-age=60` and an ETag, 304 on
  the same ETag; 18 My Profile items (11 required); the groups in menu order; `serviceDocuments` per service. The
  worker: percent 100, My Profile 11/11, Services 3/4 (next `service-documents:support-worker`), Compliance 10/11
  (next `compliance:identity-points-100`).
- **completion-sync's first run** did the day's full pass: **1,790 checked, 0 changed** under `legacy` (no stale
  stored flags on the staging copy); `failed 0`.
- **The forecast of C2's switch** (`backfill:completion -- --model=groups`, dry run on the staging copy, nothing
  written): `accountDetails` off for **942**, `services` off for 4, `profileCompleted` off for **83**. Totals only
  (read-only script): of 1,790 workers, **205** complete My Profile under the 11 required pages, **65** are profile
  complete under the groups; the 83 who are complete today but not under the groups miss: Language 62, Education 58,
  Experience 52, Work History 51, Preferred Hours 49.
- **Nothing gates on `profileCompleted`** (no reader outside the completion code); the stored flags are shown on the
  admin's contractor profile and the share page only. A decision for C2: accept these numbers, or change which pages
  are required.
- **Not run by Claude:** today's production app against staging in a browser (NFR-C1).

## The language data (user: "c, check the language data first", 2026-10-21)

Read-only aggregates on the staging copy (`rehearse-w1`, 1,790 workers):

| Where a worker's languages are | Workers |
|---|---|
| nowhere, and no additional-info row at all | 1,096 |
| only the legacy `worker_profiles.languages` (the rule falls back to it: counts as done) | 283 |
| only the additional-info list | 245 |
| an additional-info row, its list empty, no legacy value | 106 |
| both | 38 |
| legacy value, additional-info row with an empty list (counts as done) | 22 |

- **No language anywhere: 1,202, all signed up before S1** (2026-10-02). The sign-up has never asked for languages
  (it writes `[]`); only the profile pages do (the legacy column on the old pages, the additional-info list on the new).
- **No blank-only values** in either list (0): nothing is stored in a shape the rule misses.
- **Of the 148 workers "complete" today, 62 have no language anywhere**: today's rules never asked for one.
- For comparison, of the 411 additional-info rows: interests 318, cultural background 308, personality 315.

**Conclusion: not a data gap.** The rule already reads both places; the 62 never answered the question. Nothing to
migrate. The choice for C2 remains: keep Language required (they see one short page to do), or make it optional.

## Language optional: merged and on staging (2026-10-21)

- **PR #91** merged by the user: `main` `0fbd3d443da54a29b24a88aeaf9abacfc652312e` (CI 13/13 green); the stray
  script is not in `main`. **PR #90** (the rollback rows, `00012-gts`) merged too.
- **Staging:** revision `remonta-api-staging-00056-rgt`, 100 % traffic (04:45Z). Checks 10/10 again: 18 My Profile
  items, **10 required**; the staging worker My Profile 10/10.
- **The image to promote is `0fbd3d443da54a29b24a88aeaf9abacfc652312e`** (not `1eda05a`).

## Promoted to production (2026-10-21)

- deploy-api `workflow_dispatch` of `0fbd3d4` at 04:48Z, success: **`remonta-api-00013-rl7`**, 100 % traffic
  (previous `remonta-api-00012-gts` = `f00a3cb`). Production checks: health 200; `/v1/worker/completion` and
  `/v1/worker/tour` 401 without a token. `COMPLETION_MODEL=legacy`: nothing visible changes.
- **completion-sync's first production run** (04:49:49Z, Cloud Logging): the day's full pass, **1,878 checked, 8
  changed, 0 failed** -- eight workers whose stored flags had gone stale under today's own rules (F5), now true.
- **Not yet done:** the log metric `remonta-api-completion-sync-failed` does not exist on the project (checked), so
  the `completion-sync-failing` policy is not applied either.
- Rollback row: branch `docs/rollback-rows-2026-10-21-completion` `cf0f1b0` (one line; the user's PR).

## The alert applied (2026-10-21, the user: "yes run it")

- `gcloud logging metrics create remonta-api-completion-sync-failed` (the bootstrap's line: filter
  `resource.type="cloud_run_revision" AND jsonPayload.alert="completion-sync-failed"`): created.
- `apply-alerts.sh prod --dry-run`: 1 to create, 0 to update, 7 unchanged; then `--only completion-sync-failing`:
  created `projects/remonta-api-510206/alertPolicies/17950320262560625485`, enabled, one notification channel
  (support@).
