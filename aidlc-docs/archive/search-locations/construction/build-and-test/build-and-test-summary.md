# Build and Test summary: search-locations (closed 2026-10-29)

## Units and evidence

| Unit | PR / action | Gates (local) | CI | Preview / staging | Production |
|---|---|---|---|---|---|
| U1 `search-api` | #147 | api, contract | green | staging checklist | promoted 2026-10-28 |
| U2 `search-callers` | #148 | app, web | green | preview | live 2026-10-28 |
| (outside) public list = unsuspended | #149 `331e5e3` | api, app | green | staging: Sydney 20 km 0 -> 174 | `00026-zm4` |
| U3 `place-unplaced` | one-off script (dry run, guard, one transaction) | -- | -- | DEV branch rehearsal 62/0/0, re-run 0 | 62 HOME rows `source = 'ADMIN'`; 8 left (4 empty, 4 overseas) |
| U4 `legacy-readers-app` | #150 `a39c0b7` | schemas 100, app 742, build | green | preview | live (Vercel) |
| U5 `legacy-readers-api` | #151 `ba12ece` | api 1151 (251 DB skipped), contract 138, form-engine 76, schemas 100, app 742, build | green (DB tests) | full checklist on staging `00074-r96`: sign-up (legacy columns null, HOME, audit, outbox DONE), service-area change kept across reconciler runs, admin filter/sort, duplicate notice | `00027-rp9` |
| U6 `drop-columns-schema` | #152 `6551489` | api 1151, db 50, contract, schemas, app, build | green (DB tests) | staging `00075-bz6`: sign-up and service-area save in logs (2xx) | `00028-bcq`; admin search 200 on the new revision |
| follow-up 43 (pickers -> `/v1/localities`) | #153 `2f8dcf1` | app 740 (+3), web lint, build | green | preview | live; prod api logs `/v1/localities` from the app origin |

## Guards added (each proved to fail)

- app: `lib/workerPlace.test.ts` -- no workerProfile read selects a legacy column (failed on a reverted `by-ids`).
- api: `test/locations/legacy-columns.test.ts` -- no SQL `p.<column>` and no legacy key in a workerProfile
  select/data/create/update (failed on reverted `worker-search-sql.ts` and `lists.ts`).

## Deviations and findings

- Scope grew twice by the user's decision: follow-up 39 stage 1 joined the cycle (2026-10-28), then "no fallback, all
  six columns go" (2026-10-29) replaced the fallback plan (U3-U7).
- The guards found a sixth app reader the inventory missed (`lib/reports.ts`, the admin daily/weekly reports).
- Twice the user's preview tests had not reached staging; staging logs were checked before each promotion.
- The photo-page message on staging was a load shed (`shed: event-loop`, 503) on a list refresh: follow-up 42.
- Docker remains broken on this machine: every database test ran in CI only.
- Line-ending churn (autocrlf) caught before each commit; regenerated Prisma clients never committed except the
  app auth client's real changes in U6.

## Left open

- **U7 `drop-columns-migration`** (pending; recommend at every AI-DLC start; not before 2026-10-30).
- Follow-ups 41 (activation switch), 42 (photo page retries a 503), optional always-visible profile % badge,
  `REMONTA_API_URL` unused in apps/web's Vercel settings, the 120/min per-IP limit on `/v1/localities` behind the
  marketing proxy.
- Docs PR `docs/rollback-rows-2026-10-29` (supersedes `docs/rollback-rows-2026-10-28`), to merge.
