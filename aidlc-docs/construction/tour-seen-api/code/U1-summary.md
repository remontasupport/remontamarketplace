# U1 `tour-seen-api`: construction notes (2026-10-21)

Plan: `construction/plans/tour-seen-api-code-generation-plan.md` (approved 2026-10-21). Branch `feat/tour-seen-api`
from `main` `b4d48c1`.

## Files

| | File |
|---|---|
| Modified | `packages/db/prisma/schema.prisma` (`tourSeenAt DateTime?` on `WorkerProfile`) |
| Created | `packages/db/prisma/migrations/20261021120000_tour_worker_profiles_tour_seen_at/{migration.sql,down.sql}` |
| Modified | `packages/api-contract/src/worker.contract.ts` (`workerRead({ noCache: true })`, `tourViewSchema` / `TourView`, entries `getTour`, `putTourSeen`) |
| Modified | `packages/api-contract/openapi.json` (regenerated) |
| Modified | `packages/api-contract/test/worker.test.ts` (6 tests incl. the round-trip property), `test/worker.sections.test.ts` (entry count 40 → 42) |
| Created | `apps/api/src/modules/worker/application/sections/tour.ts` (`readTour`, `markTourSeen`, `assertNotImpersonating`, `TOUR_NOT_WHILE_IMPERSONATING`) |
| Modified | `apps/api/src/modules/worker/worker.handlers.ts` (the two handlers) |
| Created | `apps/api/test/worker/tour.test.ts` (10 tests, pipeline + an in-memory stand-in; 2 properties) |
| Created | `apps/api/test/worker/tour.int.test.ts` (5 tests on PostGIS incl. a property and a concurrent-save test; CI only) |
| Modified | `docs/worker/README.md` (the entries, the caching exception, the column) |

Not committed: the regenerated app Prisma client (`apps/app/src/generated/auth-client/`, restored with
`git checkout`; the app never reads the column). The untracked `apps/api/scripts/_u2-staging-writes.ts` stays untracked.

## Deviations from the design

1. **`tourViewSchema` lives in `worker.contract.ts`**, not `worker.sections.ts` (the plan's Step 3): the view schemas
   and the offset-datetime primitive `isoDate` are there; `worker.sections.ts` holds the write bodies.
2. **The impersonation message is the tour's own** (`TOUR_NOT_WHILE_IMPERSONATING`), not the account area's
   `NOT_WHILE_IMPERSONATING`: that text says "Sign-in details can only be changed…", wrong for the tour. Same pattern
   (403, the reason in `fields.general`), as BR-10 asks.
3. **The read runs in `readTransaction`** with the profile read's statement timeout (BR-9's "the read path's timeout").

## Verification

- **`down.sql` tested on the developer's Neon branch** (`DEV_DATABASE_URL`, host `ep-royal-night-a70rehk3`; the
  production host refused by the script), inside one transaction rolled back at the end: column absent → forward adds
  it (1,852 rows, all null) → down removes it → forward adds it again → rollback leaves the branch as it was.
- **A guard proved to fail:** with `assertNotImpersonating` removed from the handler, the BR-10 test fails (1 of 10);
  restored.
- **Gates** (this machine; the database tests are skipped here because Docker is down, CI's API Quality runs them):
  `@remonta/api-contract` quality: exit 0, 104 tests (6 new). `@remonta/api` quality: exit 0, lint + strict tsc,
  796 passed / 213 skipped (the database tests, the new `tour.int.test.ts` among them). `@remonta/db` quality: exit
  0, 50 passed / 7 skipped. `@remonta/app` quality: exit 0, 142 type / 470 lint findings all known, 127 passed / 12
  skipped. `npx turbo run build`: 3 of 3. The regenerated Prisma clients in `apps/app` and `apps/web` restored after
  the build.
- **Pushed:** `feat/tour-seen-api` `d25c9ce` (4 commits: `4bfea82` db, `cad51cb` contract, `c303ba8` api, `d25c9ce`
  docs; 11 files).

## After the merge: the staging checklist (requirements §6.2)

Staging deploys on the merge (`deploy-api`). With a staging worker's token (`docs/admin/README.md` §1):

1. `GET /v1/worker/tour` without a token → 401; with the worker's → 200 `{"seenAt":null}`, `cache-control: no-store`.
2. `PUT /v1/worker/tour/seen` → 200 with a time; again → 200 with **the same** time.
3. The same PUT with an admin token → 403; with an impersonation token → 403 and the value unchanged.
4. `audit_logs`: a `PROFILE_UPDATE` row with `metadata.section = 'putTourSeen'`.
5. **Today's production app (`main` build) against staging**: the worker dashboard and the profile pages load
   (NFR-02: the profile read is unchanged).
6. Reset the staging worker (`UPDATE worker_profiles SET "tourSeenAt" = NULL ...`) for U2's preview.

Then the promotion (later, on the user's word): deploy-api, stage=prod, imageTag = the full sha of this PR's merge.
