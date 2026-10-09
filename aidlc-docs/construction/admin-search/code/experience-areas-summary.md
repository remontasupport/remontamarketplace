# Experience sub-areas on the admin search (2026-10-09)

**Ask (user, 2026-10-09):** under "Experience with", when a domain (Aged Care, Disability, ...) is selected, a
section shows that domain's specific areas (`worker_experience.specificAreas`, the list the worker's edit-profile
page offers) and the admin narrows the search by them.

## What was built

| PR | Branch | Head | Content |
|---|---|---|---|
| A (api) | `feat/admin-search-experience-areas-api` | `fe499c3` | `packages/schemas/src/data/experienceAreas.ts`: the five domains, slugs, labels and 39 areas, one list (+ test, in `tsconfig.strict.json`). `admin.contract.ts`: `experienceAreas`, csv of `DOMAIN:Area` pairs from that list (closed enum, up to all 39); `appliedFilters.experienceAreas`. `search-query.ts`: pairs grouped per domain; a pair whose domain is not in `experienceWith` -> 400 `fields.experienceAreas` ("Choose the experience type first"). `filters.ts`: one registry row, `EXISTS (... we.domain = $d AND we."specificAreas" && $areas::text[])` per domain, ANDed. Tests: contract (canonical), query (unit + G5 property), filters (fragment + G4 property), integration case on the harness (which now seeds areas). `openapi.json` regenerated. `docs/admin/README.md` row. |
| B (app) | `feat/admin-search-experience-areas-app` (stacked on A) | `1be0a46` | `features/admin-search/query.ts`: `experienceAreas: Partial<Record<CareDomain, string[]>>` in the state; `toQuery` sends pairs for searched domains only, vocabulary only; `filtersFromURL` regroups them under their domain; `experienceAreasOfLabel`, `domainOf` exported. `AdminDashboardClient.tsx`: one section per selected domain (chips, "Any area" when none chosen); deselecting the domain forgets its areas. `ExperienceSection.tsx` (the worker's edit-profile page) derives its lists from the shared vocabulary: no behaviour change, one source. `docs/admin/README.md` §5 rows. |

Gates run locally 2026-10-09: schemas 63 tests; api-contract 49; api lint + strict tsc + 368 unit tests (the 143
database tests skipped: no local PostGIS on this machine; CI runs them, the new integration case included); app
142 type / 471 lint known / 119 tests; `apps/app` production build compiled. The build regenerated the Prisma
client (the known trap); discarded, not committed.

## Semantics, stated

- Within a domain the chosen areas are **any of** (the worker's row for that domain overlaps the set); across
  domains **all of**, as `experienceWith` already is. No area chosen under a selected domain = any area.
- Only `specificAreas` is matched (the user's ask). `otherAreas` ("areas you know about") is not read.
- One meaning, one URL: an area without its domain in `experienceWith` is refused (400), never implied; the page
  never produces such a query.
- The vocabulary is the page's list, by label. A stored value that is not in the list (possible: the rows were
  migrated from the old JSON) cannot be selected and does not match. **Check on production before relying on it**
  (read-only; the permission layer refused the AI's run):
  `SELECT domain, a AS area, COUNT(*) FROM worker_experience, unnest("specificAreas") a GROUP BY 1,2 ORDER BY 1,3 DESC;`

## Order of operations (the rule: nothing live changes before the api is on prod)

1. Open PR A from `feat/admin-search-experience-areas-api` -> `main`. CI (the API gate runs the integration case
   on its PostGIS container). Merge. The automatic deploy puts the image on **staging**.
2. Staging check with an admin token (docs/admin/README.md §1): `GET /v1/admin/workers?experienceWith=AGED_CARE&experienceAreas=AGED_CARE%3ADementia`
   -> 200, `appliedFilters.experienceAreas` echoed, total <= the same query without areas;
   `...?experienceWith=DISABILITY&experienceAreas=AGED_CARE%3ADementia` -> 400 `fields.experienceAreas`;
   `experienceAreas=AGED_CARE%3ANope` -> 400. The Vercel preview of PR B (below) against staging is the
   end-to-end check: tick Aged Care, tick Dementia, Apply, the list narrows; reload keeps the chips.
3. Promote: Actions -> deploy-api -> stage=prod, imageTag=`fe499c3`'s image (the sha of the merge). Verify
   `/v1/health` 200 and the 200/400 trio on prod.
4. Only then open and merge PR B (`feat/admin-search-experience-areas-app` -> `main`; after A's merge the compare
   shows PR B's one commit). Before that, the prod api would answer 400 to a dashboard that sends areas.
5. Verify on production: the panel, a narrowed search, a reload. Re-record the Vercel rollback ids.
