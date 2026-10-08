# PR 3 -- admin-search, the app switch (generated 2026-10-08)

Branch `feat/admin-search-app` from `main` `b09a9c1` (PR 2 merged, PRs 1 and 2 promoted to prod `remonta-api-00006-tj5`).
Commits: `522bf54` the api scripts (the staging checklist runner, the paced replay), `d32fd0b` the token route and
the token source (U1 Part E), `ca80386` the admin client and the filter mappings (Parts H, J1), `d381e42` the two
screens (Part I), `e07abdc` docs (Part K). PR: #PR3_NUMBER (opened by the user from the compare link). Plan:
`../../plans/admin-search-code-generation-plan.md` (Parts G-K ticked; `api-identity` Part E ticked).

## Files

**Created**
- `apps/app/src/app/api/auth/api-token/route.ts` (thin), `src/lib/api/mint.ts` (L1/R2: session, the account
  re-read through `withRetry`, 503 on a database error, 401 inactive / role-changed, the strict limiter, `SignJWT`
  with `kid: current`, `no-store`), `src/lib/api/mint.test.ts` (every branch, P6, interop with jose, S4, S8)
- `src/lib/api/token.ts` (`createTokenSource`: L4, R5.1-R5.5, R5.7), `src/lib/api/token.test.ts` (the retry
  table S3, the shared fetch, invalidate, P5 model-based)
- `src/lib/api/admin.ts` (`adminApi`, `createAdminApi`: L5, R5.6, outcomes, canonical URLs, `cache: 'reload'`),
  `src/lib/api/admin.test.ts` (the 401 retry once, outcome mapping, reload mode, local validation)
- `src/features/admin-search/query.ts` (E7 `AdminFilters`, `toQuery` R11.1, `urlFromFilters` / `filtersFromURL`
  R11.2), `query.test.ts` (the mappings; the URL round trip as a property, G6 on the app side)
- `apps/api/scripts/staging-admin-check.ts` (the PR 2 checklist in one command)
- `aidlc-docs/construction/admin-search/code/pr3-preview-checklist.md`

**Modified**
- `apps/app/src/app/admin/AdminDashboardClient.tsx` (R11.1-R11.8; the markup kept, the data layer replaced; the
  document-filter state, the `/api/admin/filters` fetch and `formatTravelTime` removed; `data-testid` on the new
  controls), `src/app/admin/impersonate/page.tsx` (`adminApi.listUsers`)
- `apps/app/package.json` (`jose ^6.2.12`), `pnpm-lock.yaml` (the importer entry only)
- `apps/api/scripts/parity-admin-search.ts` (`--pace`, 550 ms default)
- `CLAUDE.md` (the Reach line), `docs/admin/README.md` (section 3 corrected, section 4 extended, section 5 the
  app side), `docs/signup/03-data-model.md` (who reads `worker_locations`)

## Decisions taken during generation

| # | Decision | Why |
|---|---|---|
| H1 | The dashboard is `apps/app/src/app/admin/AdminDashboardClient.tsx` (a card list, no props, loaded by `admin/manage` with `ssr: false`); the suspended workers are a modal inside it, not part of the impersonate page; there is no delete action | the code map corrected the plan's assumptions; the plan's I1/I2 rows were applied to the files as they are |
| H2 | `cache: 'reload'` only, no `Cache-Control` request header set by the page | the api's CORS allow-list holds `content-type`, `x-request-id`, `authorization`; an author header would need a preflight change on the api. The browser adds `Cache-Control: no-cache` itself for the `reload` mode, which the api's memo bypass matches, and UA-added headers do not enter the preflight |
| H3 | `adminApi` creates a contract client per call with a wrapping `fetch` | `createClient` has no cache option and its result carries no headers; the wrapper sets `cache` and `credentials: 'omit'` per call without changing the package |
| H4 | The canonical URL is produced by parsing the input with the entry's own schema and passing `serializeCanonical`'s entries, in order, to the client | the client builds its query string with `URLSearchParams` in insertion order, so the URL equals the memo key |
| H5 | `withinKm` without a locality is left to the api (400 `fields.withinKm`), not re-validated locally; `toQuery` never produces it | one rule, one place (R1.3 is the api's invariant); the page's controls cannot produce the case |
| H6 | The page's default page size stays 6 (today's card density); `filtersFromURL` defaults a URL without `pageSize` to 6, not the contract's 20 | the frontend design said "20 (unchanged UI)" but the UI requests 6; the UI is what was kept |
| H7 | `sortBy` is sent only when the admin chose one | otherwise the api's default (`distance` with a suburb, `createdAt` without) could never apply (R1.2) |
| H8 | A suburb row without an id (a Google fallback from `/api/suburbs`) is shown disabled with a hint | R11.3: the api measures only from our own localities |
| H9 | The user picker requires two characters; a role alone no longer lists | the contract's `search` is required (R9.1); the empty-state text says so |
| H10 | The route's rate limiter fail-open is the existing helper's (`checkServerActionRateLimit` swallows Upstash errors); no separate warn line | P3 of the NFR design named today's app behaviour; adding a log would mean changing the shared helper |
| H11 | No component tests: the app's vitest runs in node without jsdom or testing-library | the config says that is a separate decision; the logic was pulled into node-testable modules (`query.ts`, `admin.ts`, `token.ts`, `mint.ts`) and the screens are covered by the preview checklist (S8 as a manual row) |
| H12 | Old route behaviours not carried over: the Redis response cache (`admin:contractors:v1`), the Google geocoding of a free-text location, the 500 km cap of "Any distance", the travel-time estimate | the approved design (caches via the api and the browser; our localities; no cap; distance in km) |

## Gates (local, 2026-10-08)

| Gate | Result |
|---|---|
| `@remonta/app` quality | type-check baseline, lint baseline, 118 passed / 12 skipped (32 new) |
| `turbo run build --filter=@remonta/app` | success (1m24s); the regenerated Prisma clients discarded |
| `@remonta/api` quality (the two script files) | see the audit (run after the push) |

## Behaviour changes an admin will notice

- The suburb must be picked from the list (ours); typing a place name without picking searches nothing by location.
- "Within" is greyed out until a suburb is picked; "Any distance" lists every placed worker nearest first, without
  the old 500 km cap.
- The distance reads "x km from the suburb centre" instead of a travel-time estimate.
- A new line counts the workers with no mapped suburb and lists them on demand.
- "Results may be up to a minute old" with a Refresh button; after suspending or reactivating a worker the list is
  fresh at once.
- The user picker needs two characters of search; the role filter narrows it.
