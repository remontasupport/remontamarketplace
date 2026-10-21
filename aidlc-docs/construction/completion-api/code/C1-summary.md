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
