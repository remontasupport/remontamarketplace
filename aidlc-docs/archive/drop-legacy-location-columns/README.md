# Drop the legacy location columns -- search-locations U7 (cycle closed 2026-11-10)

**Goal (user, 2026-11-10):** "Yes let's do the U7 but make sure double check and production won't compromise".

## What shipped (live)

| PR | Content |
|---|---|
| #160 `1e4d74e` | Migration `20261110120000_drop_worker_profiles_legacy_location`: one ALTER dropping `worker_profiles.location, city, state, postalCode, latitude, longitude` (and with them the indexes `city`, `state`, `postalCode`, `latitude+longitude`, `isPublished+city`) under `lock_timeout 5s`; `down.sql` restores the structure empty; database test `legacy-columns-dropped.int.test.ts`; bench seed and docs/signup/03 updated |
| outside the repo | The n8n workflow "Query workers" (credential "Postgres account") moved by the user to `worker_locations` HOME + `au_localities` before the merge (it read the columns every 3 min) |

Production at the close: api `remonta-api-00031-9h4` = `1e4d74e7d2e46cb8b1d3df8f107b7bcc7f6bfe01` (dispatch
42799399569, 10:28Z; migration applied 10:28:49Z); app/web code unchanged. Backup: Neon branch
`backup-before-u7-2026-11-10` of production, taken before the drop (user confirmed `city` present), keep until 2026-12-10.

## Deviations

See `construction/build-and-test/build-and-test-summary.md`.

## Layout

`inception/` (requirements, execution plan with the pre-flight record), `construction/build-and-test/`,
`aidlc-state-at-close.md`. Audit: `aidlc-docs/audit.md` (2026-11-10 entries).
