# S1 production run — the database side (runbook)

**Status:** rehearsed end to end on the Neon branch `rehearse-w1` (a reset copy of production of 2026-09-28) on 2026-09-28. Every step below ran there with the results shown. **Not yet run on production; needs the user's approval.**

**What it changes for the live apps the moment it is done:** `apps/app`'s suburb search (`/api/suburbs`) starts reading `au_localities` instead of calling Google (it falls back to Google only while the table is absent). Nothing else in the live apps changes: the sign-up stays on the legacy route until the api is deployed and the switch is flipped.

## Preconditions

- The branch's commits with the matcher rules and the batched backfills are in `main` (PR after `81f5bf6`). The production run must use that code.
- `apps/api/.env` holds the production **direct** connection string under a name that is NOT `AUTH_DATABASE_URL` (e.g. `PRODUCTION_DIRECT_DATABASE_URL`) so nothing reads it by accident; the runner compares it against the rehearsal endpoint and refuses to continue if they are the same.
- Nobody is deploying `apps/app` during the run (a deploy re-generates nothing on the database, but keep the window quiet).
- Record, before anything: `SELECT extversion FROM pg_extension WHERE extname = 'postgis'` (rehearsal: none installed → the `s1_postgis` reverse script applies) and `SELECT count(*) FROM audit_logs WHERE action::text = 'ACCOUNT_REGISTERED'` (must be 0 for the `s1_registration` reverse script to run).

## The sequence (rehearsed timings)

| # | Step | Command (from the repo root, `URL` = the production direct string) | Rehearsal result |
|---|---|---|---|
| 1 | Status, read-only | `AUTH_DATABASE_URL=$URL DIRECT_DATABASE_URL=$URL pnpm --filter @remonta/db run migrate:status` | 12 S1 migrations pending; 3 pre-baseline names known only to the database (expected) |
| 2 | Row counts, read-only | users / worker_profiles / verification_requirements counts | 1,865 / 1,789 / 10,112 |
| 3 | Migrate | `... pnpm --filter @remonta/db run migrate:deploy` | seconds; 9 tables, PostGIS, 7 indexes; counts unchanged |
| 4 | Suburb list | `DIRECT_DATABASE_URL=$URL pnpm --filter @remonta/db localities:refresh` then `--apply --expect=<hash> --by=<name>` | plan `074d18238f0f0465`, 15,467 rows |
| 5 | Backfill dry runs | `cd apps/api && DIRECT_DATABASE_URL=$URL node --import tsx scripts/backfill-worker-locations.ts --report=<file>` and `.../backfill-worker-onboarding.ts --report=<file>` | locations 1,719 matched / 59 ambiguous / 11 unmatched; onboarding 925 / 19 / 729 / 105 / 11 / 0 |
| 6 | **Review** the two reports (the ambiguous and unmatched lists; the stage distribution) — the user approves | approved on the rehearsal 2026-09-28 |
| 7 | Backfill apply | the same two commands with `--apply` | locations ~4 min, onboarding ~3 min (batched); every HOME has its `point` |
| 8 | Prove idempotence | the same two commands with `--apply` again | written 0 and 0 |
| 9 | Verify | `/api/suburbs?q=parra` on production returns ids (not `null`); a dashboard loads; sign-in works | — |

## Rollback

- **Backfills only:** the rows are additive. `DELETE FROM worker_onboarding_transitions WHERE source = 'BACKFILL'; DELETE FROM worker_onboarding; DELETE FROM worker_locations WHERE source = 'BACKFILL';` leaves production exactly as before step 7 (nothing in the live apps reads these tables yet).
- **Migrations:** run each `down.sql` newest first (`packages/db/prisma/migrations/20260925*/down.sql`), then `DELETE FROM _prisma_migrations WHERE migration_name LIKE '20260925%'`. Rehearsed: the diff against the pre-S1 schema is empty afterwards. Skip the `s1_postgis` reverse script if PostGIS was already installed before the run.
- **Last resort:** Neon point-in-time restore of the main branch to just before step 3.

## What the rehearsal taught (already in the code)

- Legacy rows: NT postcodes stored with three digits; "TA" for Tasmania; street addresses and metro names around the suburb; Australia Post centre names — handled by exact rules in `legacy-match.ts`; a metro name with a suburb's postcode and misspelt suburbs stay unplaced (70 workers), and the reconciler places them the moment they fix their address.
- One transaction per page of workers, not per worker: the per-worker form took ~1 s/worker against a remote database.
- Production has exactly one published worker (with a lapsed/rejected document → ACTION_REQUIRED) and 729 workers with every document uploaded awaiting review.
