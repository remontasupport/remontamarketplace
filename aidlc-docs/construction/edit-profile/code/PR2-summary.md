# U2 `edit-profile` -- PR 2 summary (the migration and the section entries)

Branch **`feat/edit-profile-api`** from `main` `1d11963` (U1's clean-up merged), pushed 2026-10-12, `8a66496`,
4 commits, 37 files, +5,488 / -25. Compare:
`https://github.com/remontasupport/remontamarketplace/compare/main...feat%2Fedit-profile-api?expand=1`.
Plan: `../../plans/edit-profile-code-generation-plan.md` PR 2 (Parts 0-E done; F is Build and Test).

## What it contains

| Part | Files |
|---|---|
| A db | `schema.prisma` (`homeStreetLine`, `homeLocalityId` + relation + index); `migrations/20261012120000_u2_worker_home_address/{migration,down}.sql` |
| B schemas | `data/profileOptions.ts` (11 lists copied from the components, test), `validations/abn.ts` (normalise, ATO checksum, test with P8) |
| C contract | `worker.sections.ts` (every body, refinements R2-R7), `worker.contract.ts` (16 entries; `workerWrite` gains `limit`; `PROFILE_UPDATE`), `checks.ts` (a union of strict objects counts as strict, with an accept and a reject test), `openapi.json`, `test/worker.sections.test.ts` |
| D api | `application/replace-section.ts` (L1), `sections/{profile,lists,additional-info}.ts`, `addresses.ts`, `photos.ts`; `worker.handlers.ts` (17 handlers), `main.ts` (photo deps), `db.ts` (`writeTransaction`), `profile-read.ts` (a tx variant; the home address selected), `get-profile.ts` (returns it), `photo-process.ts` (`repoint`), `logging.ts` (`abn` redacted), `scripts/worker-check.ts` (`--writes`); tests `worker/sections.test.ts`, `worker/sections.int.test.ts`, `route-security.test.ts` (valid enum path values) |
| infra / CI | `.github/scripts/api-migrate.sh` + two steps in `deploy-api.yml` (option A: migrate before replacing the service, per stage, over the direct endpoint); `bootstrap.sh` grants the deploy account read on each stage's `AUTH_DATABASE_URL` |
| docs | `docs/worker/README.md` (the section writes table; the read's home address) |

## Deviations

1. **One audit action for every section write: `PROFILE_UPDATE`** (an existing `AuditAction` value), with the section
   and the profile id in the metadata. The design's sixteen `WORKER_*_CHANGED` names would each need an enum value
   (a migration that cannot be cleanly reversed); the metadata keeps the same information.
2. **A photo confirmed into the additional slot while there is no main photo becomes the main.** Found by the photo
   property test: otherwise additional photos could stand without a main, which R4.4 forbids.
3. **The photo ticket stores nothing** (the sign-up's rule), so ownership is by first claim: `confirmPhoto` creates the
   upload row, then claims it for the caller's profile; anyone else's confirm of that id is 404. The design's
   "owner at ticket time" needed a column the sign-up path does not have.
4. **The reconciler does not look at `source`**: it follows the legacy location columns. A worker-set HOME row stays
   because the service-area write sets those columns to the same suburb (agreement), not because the reconciler skips
   `ONBOARDING` rows. Until PR 4 deletes the old address step, a worker who saves an address there still moves the
   HOME row through the legacy columns -- consistent, and recorded.
5. **Languages and interests accept a worker's own label** beside the listed ones (the pages allow it today);
   every other list is a strict enumeration.
6. **Job history/education responses carry `id`** (new on each replace); the bodies do not.

## Privacy check done now (not left to PR 3)

Every client-facing read of `worker_profiles` in `apps/app` (`/api/client/workers*`, the share and contractor paths,
the reports) selects named columns, and no client route includes whole profile rows, so `homeStreetLine` /
`homeLocalityId` cannot reach a client once PR 2 is live. PR 3 adds the automated negative test.

## Gates (this machine, 2026-10-12)

| Gate | Result |
|---|---|
| schemas | 80 tests |
| db | 50 passed, 7 database-gated skipped |
| api-contract | 78 tests (incl. the union check's reject case) |
| api | lint, tsc; 561 passed, 167 skipped (database-gated, incl. the new `sections.int.test.ts`: CI proves them) |
| app | 142 type / 471 lint known, 122 tests |
| `turbo run build` | 3/3 |

## Before the merge (operator) -- required

The deploy account must read the two database secrets, or the new migrate step fails and the staging deploy stops
(safely: before the service is replaced). The session's attempt was refused by the permission layer:

```
for S in remonta-api-staging-AUTH_DATABASE_URL remonta-api-AUTH_DATABASE_URL; do
  gcloud secrets add-iam-policy-binding "$S" --project remonta-api-510206 \
    --member="serviceAccount:github-deploy@remonta-api-510206.iam.gserviceaccount.com" --role=roles/secretmanager.secretAccessor
done
```

## Build and Test (F2-F3)

CI (the migration applies in API Quality's PostGIS; the int suites run); merge → staging migrates then deploys;
`check:worker --writes` on staging; a service-area save moves a staging worker in the admin search; a photo through
ticket/confirm; the load test with writes; promote the full sha (the promote step migrates prod first); production
checks read-only.
