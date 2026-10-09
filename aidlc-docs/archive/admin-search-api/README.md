# Admin worker search on `apps/api` (cycle closed 2026-10-09)

**Goal (user, 2026-10-08):** a new api backend for the admin dashboard's search, with the radius computed accurately
on the new schema (`worker_locations` + `au_localities` + PostGIS); then (user, 2026-10-09) narrowing an experience
domain by its specific areas.

## What shipped

| PR | Merged | Content |
|---|---|---|
| #41 `c95435c` | 2026-10-08 | U1 api-identity: the api token (HS256 JWT the app mints from the session; `kid` rotation; impersonation carried as `act`) |
| #42 `b09a9c1` | 2026-10-08 | U2 admin api: `GET /v1/admin/workers` (one statement, PostGIS `ST_DWithin`, the filter registry), `/v1/admin/users`, `/v1/admin/workers/suspended`; private caching (ETag/304) and the response memo; promoted to prod `remonta-api-00006-tj5` |
| #43 `64508be` | 2026-10-08 | the app side: the token route and source, the admin client, the dashboard and the user picker on the api |
| #44 `36b25e6` | 2026-10-08 | clean-up: the four old admin routes and `lib/worker-search.ts` deleted |
| #45 `c590a1d` | 2026-10-09 | the AI-DLC record of PRs 1-4 |
| #46 `024596f` | 2026-10-09 | experience sub-areas, api: the shared vocabulary in `packages/schemas`, `experienceAreas` on the search entry, the filter row; promoted to prod by dispatch 02:41Z |
| #47 `48a8a7e` | 2026-10-09 | experience sub-areas, app: one section per selected domain on the dashboard; the edit-profile page on the shared list; `scripts/local/` (the new code locally against the staging copy) |

Reference for operators: `docs/admin/README.md` (the token, the entries, caching, the parity and checklist scripts,
the app side).

## Deviations, stated

- PR #43 was merged without its preview checklist run; verified on production afterwards (first attributed search).
- Both stages' `API_TOKEN_SECRET` version 1 carried a line ending (added through a Windows pipe); every token was
  `bad-signature` until version 2 (`printf '%s' | gcloud secrets versions add --data-file=-`).
- The experience sub-areas were built on a confirmed flow without a separate inception; the construction summary
  (`construction/admin-search/code/experience-areas-summary.md`) holds the semantics and the merge order.
- A local client-side "Application error" seen once on this machine (the local app against the staging copy) was not
  reproduced headlessly, on the Vercel preview or on production; left unexplained.

## Layout

`inception/` (reverse engineering, requirements, stories, application design, plans), `construction/` (api-identity
and admin-search: functional design, NFR requirements and design, infrastructure design, the PR summaries and
verification records, the experience-areas summary; `build-and-test/`; `plans/`), `aidlc-state-at-close.md` (the
state file as it stood at the close). The audit trail stays in `aidlc-docs/audit.md`.
