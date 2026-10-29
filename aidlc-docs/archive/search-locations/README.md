# Search on worker_locations, and the legacy location columns (cycle closed 2026-10-29)

**Goal:** follow-up 1 -- the client search and the public list on `worker_locations` + PostGIS; extended by the user
(2026-10-28, "do not close this, you can do it here") to follow-up 39 (every reader on the HOME location, the double
write stopped), then (2026-10-29, "I want to clean up the columns in database") to no fallback and the six legacy
`worker_profiles` columns removed.

## What shipped (live)

| PR / action | Content |
|---|---|
| #147 | U1 `search-api`: `GET /v1/client/workers`, `GET /v1/public/workers` on PostGIS |
| #148 | U2 `search-callers`: the dashboard and the marketing site call them; the Next routes removed |
| #149 `331e5e3` | the public list = every unsuspended worker (user decision) |
| script, 2026-10-29 | U3 `place-unplaced`: 62 workers placed from a user-reviewed list (`source = 'ADMIN'`); 8 left (4 empty, 4 overseas) |
| #150 `a39c0b7` | U4 `legacy-readers-app`: every app screen reads the HOME suburb (`lib/workerPlace`); `localityLabel` in `@remonta/schemas` |
| #151 `ba12ece` | U5 `legacy-readers-api`: api readers HOME-only, completion's location = HOME, the reconciler places nobody, sign-up and the service-area save stop writing the six columns |
| #152 `6551489` | U6 `drop-columns-schema`: the six fields and five indexes out of the Prisma schema (columns kept) |
| #153 `2f8dcf1` | follow-up 43: every suburb picker on `GET /v1/localities` (`lib/api/localities`); the app's `/api/suburbs` and `lib/suburbs` removed |

Production at the close: api `remonta-api-00028-bcq` = `6551489`; app and web `main` `2f8dcf1`.

**Pending:** U7 `drop-columns-migration` (the DROP of the six columns and five indexes) -- recommended at every AI-DLC
start, not before 2026-10-30; plan in `construction/plans/drop-columns-schema-code-generation-plan.md` (§U7).

## Deviations

See `construction/build-and-test/build-and-test-summary.md`.

## Layout

`inception/` (requirements with the 2026-10-29 revision, questions, inventories, execution plan), `construction/`
(designs and code summaries for U1/U2, plans for every unit, build-and-test), `aidlc-state-at-close.md`. The audit trail
stays in `aidlc-docs/audit.md`.
