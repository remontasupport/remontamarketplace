# drop-legacy-location-columns -- execution plan and pre-flight record (2026-11-10)

One unit, U7, branch `feat/drop-legacy-location-columns` (`37c65ed`): migration `20261110120000_drop_worker_profiles_legacy_location`
(+ down.sql), the database test `apps/api/test/locations/legacy-columns-dropped.int.test.ts`, the bench seed, docs/signup/03.

## Pre-flight (done)
1. Code: all three generated Prisma clients lack the six fields; every SQL template in apps/api, apps/app, packages/db
   scanned: the only same-named columns are au_localities (`al.state`, `al.suburb AS city`), worker_locations and
   service_requests (`sr.location`). The api guard test (locations/legacy-columns) and the app guard (workerPlace) stay.
2. Running images: prod api `167bc28` and every rollback target (`fc194e8`, `6551489`) are U6 or later; the app's
   live and rollback builds (`972ff6b`, `2f8dcf1`) are U6 or later.
3. Database (developer copy `ep-royal-night`, read only): dependents = the five indexes only; no view, function,
   rule, publication; one generic trigger (`touch_updated_at`); 1,897 profiles, 7 with legacy values and no HOME row;
   3.6 MB (DROP COLUMN is catalogue-only).
4. Rehearsal on the copy: migrate deploy OK; local api location paths 11/11 PASS (incl. a service-area write);
   down.sql restores 6 columns + 5 indexes; the migration re-applies and is idempotent; the local api kept serving.

## Needed from the user before the merge
- The same read-only check on PRODUCTION (the assistant may not read production).
- Whether anything outside the code (n8n Postgres nodes, BI tools, exports) reads these columns.

## Release
1. PR -> CI (fresh PostGIS: every migration + the new test) -> merge -> staging deploy migrates rehearse-w1 -> checklist.
2. Just before the promotion: Neon console -> production project -> Branches -> New branch from main
   (`backup-before-u7-2026-11-10`), kept 30+ days.
3. Promote the merge sha (the deploy migrates production, then deploys the same image). Verify: columns gone, health,
   admin search, public search, a worker save, no ERROR.
4. Rollback: code needs none (no reader); the structure by down.sql; the values from the backup branch.
