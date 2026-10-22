# C1 `completion-api`: code generation plan (2026-10-21)

**The single source of truth for C1's code generation.** Design: `construction/completion-api/functional-design/`
(E1-E6, CR-1..CR-14, L1-L6) and `nfr-design/` (CP1-CP9, CT1-CT6). Requirements FR-CMP-01..07, FR-STO-01..05,
NFR-C1..C5.

- **Branch:** `feat/completion-api` from `main` (in `remontamarketplace`). Code only.
- **Invisible until C2**: both stages stay `COMPLETION_MODEL=legacy`; the new entry has no caller until C2.
- **Read on `main`:** the existing `backfill:completion` script (`scripts/backfill-completion.ts`, U1 worker-area:
  dry run, `--apply`, `--report`, the production guard) is **extended**, not duplicated; log-based metrics are created
  in `infra/cloudrun/bootstrap.sh` (`metric remonta-api-<name> ...`), the per-stage alert lists in `infra/cloudrun/lib.sh`
  `alerts_for`, tested by `infra/test/monitoring.test.ts`; settings in `apps/api/src/config/config.ts` +
  `infra/lib/stages.ts`.

## Steps

- [x] **Step 1 -- Branch** from `origin/main`.
- [x] **Step 2 -- The declaration** `apps/api/src/modules/worker/domain/completion-items.ts`: the My Profile table
  (E2), `servicesItems` (E3), `complianceItems` (E4 from `requirementGroups`), `completionView` (E5, CR-2..CR-7,
  CR-14), `storedFlags(view, input, model)` (E6). `get-profile.ts` `completionInputOf` extended with the optional
  pages' values and the home address (no new query: the read already selects them).
- [x] **Step 3 -- Domain tests** `apps/api/test/worker/completion-items.test.ts`: the 18-row table case by case; the
  Services and Compliance items; the five on-purpose differences as named cases; **properties**: percent = done
  required items; My Profile complete ⇔ 100; profile complete ⇔ the three groups; `storedFlags(legacy)` = today's
  `completionOf` exactly; where the rules agree, the groups = today's flags; a pure function of the rows.
- [x] **Step 4 -- The contract**: `completionViewSchema` (strict, bounded) and `getCompletion` (`GET
  /v1/worker/completion`, `workerRead()`: limits, private cache 60 s) in `worker.contract.ts`; `openapi.json`; contract
  tests (the entry, the schema, the 18 slugs listed); the entry count test 42 → 43.
- [x] **Step 5 -- The handler** `application/completion-view.ts` + `getCompletion` in `worker.handlers.ts` (L2; 404
  without a profile row). Tests `test/worker/completion.http.test.ts` (fake read: 200 shape, 401, 403, 404,
  `private, max-age=60` + ETag).
- [x] **Step 6 -- The setting** `COMPLETION_MODEL` (`legacy` | `groups`, default `legacy`) and
  `COMPLETION_SYNC_INTERVAL_MS` (default 300000) in `config/config.ts` (CT5: anything else refuses to boot);
  `infra/lib/stages.ts` both stages `legacy` / `300000`; `pnpm --filter @remonta/infra run render` regenerates the two
  YAMLs. Config tests.
- [x] **Step 7 -- The writes** pass `storedFlags(…, config.COMPLETION_MODEL)` to `persistCompletion`
  (`replace-section.ts` and the other callers); under `legacy` the stored values are byte-for-byte today's (test).
- [x] **Step 8 -- The job** `modules/worker/completion-sync.job.ts` (L4, CP2-CP4, CP7): changed profiles since the
  watermark, the daily full pass with a cursor, batches of 200, the timeout stop, the summary, the `alert` log line on
  failure; registered in `main.ts` next to the reconciler. Tests: CT1-CT3 with fakes; the **resumability property**;
  a PostGIS test (CI) for the change query and a full pass.
- [x] **Step 9 -- The backfill** `scripts/backfill-completion.ts` + `modules/worker/backfill.ts`: `--model=legacy|groups`
  (default: the stage's), counts per flag in the dry run, `--apply` refusing without a matching dry-run report from the
  last hour (CP5). Tests (the existing backfill tests extended).
- [x] **Step 10 -- The alert**: `infra/cloudrun/monitoring/completion-sync-failing.json` (≥ 3 in 15 minutes);
  `bootstrap.sh` `metric remonta-api-completion-sync-failed ... jsonPayload.alert="completion-sync-failed"`; `lib.sh`
  `alerts_for prod` gains it; `infra/test/monitoring.test.ts` updated.
- [x] **Step 11 -- Docs**: `docs/worker/README.md` §4 (the groups model, the entry, the job, the setting and the switch
  runbook), §7 (the backfill's `--model`); `infra/README.md` (the new alert).
- [x] **Step 12 -- Gates**: api-contract, api, infra quality; app quality (it imports the contract); `turbo run build`.
  Regenerated Prisma clients not committed.
- [x] **Step 13 -- Commit per layer, push**; the PR by the user; after the merge, the staging checks (below) and
  `bash infra/cloudrun/apply-alerts.sh staging --dry-run` / the bootstrap's metric on prod at the promotion (the user,
  with gcloud).
- [x] **Step 14 -- Construction notes** `construction/completion-api/code/C1-summary.md`.

## The staging checks after the merge

1. `GET /v1/worker/completion` with the staging worker's token: 200, the shape, `private, max-age=60`; 401 / 403.
2. The staging worker's view against the screens' expectations (the 11 required pages, the groups).
3. `scheduled_jobs` row `completion-sync`: runs every 5 minutes, `lastResult` counts; `changed = 0` under `legacy`
   after the first full pass (today's flags already stored) -- or the count of workers whose stored flags were stale
   (F5), which is the job doing its work.
4. The backfill dry run `--model=groups` on the staging copy: the report (how many workers change, per flag) for the
   user, as the forecast of C2's switch.
5. Today's production app against staging unchanged.
