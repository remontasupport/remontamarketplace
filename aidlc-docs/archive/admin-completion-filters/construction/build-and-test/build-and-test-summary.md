# Build and Test summary: admin-completion-filters (closed 2026-11-09)

## Units and evidence

| Unit | PR | Gates (local) | CI | Preview / staging | Production |
|---|---|---|---|---|---|
| U1 `completion-filters-api` | #154 `fc194e8` | api-contract 138; api lint, tsc, 1155 unit (252 DB-gated skipped locally); app baselines, 740 | green, incl. API Quality on PostGIS (`completion-filters.int.test.ts`) | staging `remonta-api-staging-00076-zrm` = `fc194e8`, health 200, no errors | promoted: `remonta-api-00029-xw2` (01:43Z) |
| U2 `completion-filters-app` | #156 `ca84c22` (3 commits) | app baselines (tsc 54), 745 tests; build | green | preview on staging | live from 01:45:09Z: admin searches carry `withCompletion=true`, 200 |
| fix: Download results | #155 | app baselines, 740 tests | green | preview | live |

## Tests added

- api: `test/admin/completion-filters.test.ts` (PBT: one SQL fragment per flag and choice, the echo, the row's
  `completion` present iff asked and equal to `parseStoredFlags` over any JSON); `completion-filters.int.test.ts`
  (PostGIS PBT against a model, CI only); `activation.test.ts` updated.
- api-contract: the N1 compatibility test covers the new optional keys.
- app: `features/admin-search/query.test.ts` (toggle PBT, chips, URL round trip, `unfinishedOf`);
  `features/admin-export/contactsCsv.test.ts` (extra columns).

## Deviations and findings

- **Merge order (follow-up 32, realised):** U2 merged before U1's promotion. The production api's strict query would
  have refused `withCompletion`; the user promoted U1 within minutes and the logs show no 400 on `/v1/admin/workers`
  in between. A guard is still worth having.
- The user's UI changes during U2 (one dropdown; "Profile Creation") changed labels and layout only: the query, URL
  and api parameters stayed as built.
- "Download all" already followed the search; the change was its name and the removed freshness line.
- `/api/documents` "not public" (outside the cycle): by design (private bucket, 5-minute signed links, session
  checked; a non-owner worker gets 404). Not changed; the user withdrew the report.
- Docker remains broken on this machine: the database tests ran in CI only.

## Left open

- **U7 `drop-columns-migration`** (pending; recommend at every AI-DLC start).
- Follow-up 32 (merge-order guard), now with a real near-miss.
- Docs PR `docs/rollback-rows-2026-11-09` (supersedes `docs/rollback-rows-2026-10-29`), to merge.
- The user's `_u2-staging-writes.ts` is in `../aside/`; `apps/api/scripts/_admin-clients-local-check.ts` untracked.
