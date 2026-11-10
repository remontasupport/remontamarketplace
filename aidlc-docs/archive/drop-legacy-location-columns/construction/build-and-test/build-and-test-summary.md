# drop-legacy-location-columns -- build and test summary

## Pre-flight
- Code: generated clients (app auth-client, app client, web client) without the fields; every SQL template in apps/api,
  apps/app, packages/db scanned (only au_localities / worker_locations / service_requests columns of the same names).
- Database, read only: developer copy (assistant) and production (the user ran `scratchpad/u7.sh`: the assistant may not
  read production): the five indexes are the only dependents; no view, function, publication; Neon's own slots;
  production 1,934 profiles, 7 with legacy values and no HOME row.
- Outside readers: one n8n workflow ("Query workers", every 3 min) selected the columns; rewritten (tested read only on
  the copy: same 17 output names, one row per worker) and switched by the user; no other workflow on the credential.

## Rehearsal (developer copy `ep-royal-night`)
- `migrate deploy` applied the migration; the local api's location paths 11/11 PASS (admin radius/unplaced/state,
  users, suspended, public and client search, profile read, service-area write); completion-sync 610 checked 0 failed;
  onboarding-reconciler 0 failed; `down.sql` restored 6 columns + 5 indexes; the migration re-applied and is idempotent.

## CI and release
- #160: all checks green (API Quality Node 20/22 on a fresh PostGIS with the new database test).
- Staging: deploy 42768266060, migration step success; staging database without the columns; no WARNING/ERROR;
  jobs 0 failed; the user's preview checklist passed.
- Production: dispatch 42799399569; migration 10:28:49Z; health success; 00031-9h4 serving 200s, no ERROR/5xx, jobs
  0 failed; the user's production check shows the columns, indexes and dependents gone.

## Deviations
- The production read-only checks were run by the user (permission layer: no production reads by the assistant).
- The promotion was run by the user before the assistant's go-ahead message; the backup branch had been taken before
  it (confirmed after: `city` present in the branch).
- The schema comment edit was reverted (it would have made the committed generated clients drift).
