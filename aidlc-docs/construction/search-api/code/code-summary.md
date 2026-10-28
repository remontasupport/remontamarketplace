# U1 `search-api`: code summary (2026-10-28)

Branch `feat/search-api` (`272827d`, 5 commits on `main` `832ce43`, 27 files, +1928 / -8). Pushed; PR to be opened
by the user. No migration, secret or infra change.

| Commit | What |
|---|---|
| `2321362` | `packages/schemas/src/data/serviceSlugs.ts`; `packages/api-contract/src/search.contract.ts` (the two entries, E1/E2 query schemas, E4/E5 cards), index, `public-endpoints.json` (+1), `openapi.json` (additions), tests |
| `201e0b3` | `apps/api/src/modules/locations/persistence/home-sql.ts` (`HOME_JOIN`, `localityPoint`, `pointOf`, `withinTerm`, `distanceTerm`); the admin search rewritten on them (same SQL) |
| `5977551` | `locations/domain/place.ts` (`resolvePlace`, `splitState`), `locations/place-lookup.ts`; `modules/search/` (keywords, service terms, the statement, application, handlers); `main.ts` (bound; both entries in the memo); tests |
| `7981b7e` | `apps/api/scripts/parity-search.ts` + `parity-search.json`, `parity:search` (refuses the production host) |
| `272827d` | `docs/search/README.md`; CLAUDE.md "Reach" |

## Deviations from the plan, and findings

- **Place, BR-P1:** the matcher's pattern needs the suggestion's comma; text without it ("Harris Park NSW 2150") failed
  a test. `resolvePlace` first takes the exact name (+ state) inside the postcode, then the matcher.
- **Place, BR-P3:** a suburb has a row per postcode at one centre (Parramatta 2150 / 2124); several rows at one point
  count as one place.
- **Statement timeout:** `readTransaction` (platform) already existed; reused, no new helper.
- **Memo:** both entries use the api's response memo (keyed by entry + query, not the caller), replacing the routes'
  Redis caches.
- `paginationOf` reused from `admin/domain/pagination.ts`; `paginationSchema`, `WITHIN_KM_MAX`, `WORKER_SEARCH_LIMITS`
  from the admin contract.

## Duplicate check (CS-1..CS-5)

- One statement and one spec for both entries; the handlers differ only in filling it and the card (CS-1).
- No PostGIS text duplicated: the admin search and the new search use `home-sql.ts` (CS-2). The keyword rules exist
  twice until U2 deletes the app route (stated; CS-3); the slug map likewise.
- No new abstraction beyond the `PlaceLookup` port (two readers: production, tests) (CS-4).

## Gates (local)

schemas 98 tests; api-contract lint, tsc, 138 tests (8 new), openapi drift clean; api lint, strict tsc, 1054 passed /
256 skipped (database-gated, Docker down here; 6 new in `test/search/search.int.test.ts` run in CI's API Quality).
New unit tests: place 13 (incl. 2 properties), keywords 15 (incl. P2), search-workers 12, access 2.
