# Targeted inventory: worker search on the legacy location columns (2026-10-28, `main` `832ce43`)

Cycle goal (follow-up 1): move the remaining worker searches from `worker_profiles.latitude/longitude` to
`worker_locations` + PostGIS, then stop the api's dual write, then drop the legacy columns.

## The two searches in scope (apps/app, Next routes, auth database)

| Route | Caller | Auth | Location input | Distance | Output location | Cache |
|---|---|---|---|---|---|---|
| `GET /api/client/workers` (698 lines) | client/coordinator dashboard: `hooks/queries/useWorkers.ts` → `WorkerSearchResults.tsx`, `WorkerSearchBar.tsx` (suburb autocomplete) | session, CLIENT or COORDINATOR; `publicApiRateLimit` | `location` text from the autocomplete, geocoded by Google (`lib/geocoding.ts`) | bounding box on the legacy columns, then Haversine in JS; `within` default 50 km | `"city, state"` from the legacy columns | Redis 5 min |
| `GET /api/public/workers` (350 lines) | marketing `/search` page (`apps/web/src/app/search/page.tsx`, server fetch to `REMONTA_API_URL`), `SearchBarSection` (suburb autocomplete via the app's `/api/suburbs`) | none | `"Queenscliff NSW 2096"`, geocoded by Google (geocode cached 24 h in Redis) | bounding box + Haversine; `within` default 500 km when absent; sorted by distance | `city`, `state`, `distanceKm` | Redis 60 s + `s-maxage=60` |

Both filter `LISTABLE_WORKER` (activated, not suspended) and a service; the client route also does a keyword/token
search (`tokenizeQuery`, service terms). Both load every candidate in the box into memory, then sort and page in JS.

## Already on the new model

- The admin search (`apps/api` `GET /v1/admin/workers`, `worker-search-sql.ts`): `worker_locations` HOME +
  `au_localities`, `ST_DWithin(wl.point, locality.point, km)`, `ST_Distance` for the sort; the location is a
  **locality id** from the suburb picker (no geocoding). City/state from the HOME locality, falling back to the
  legacy columns for unplaced workers.
- The api's suburb autocomplete returns locality ids.

## The legacy columns: who still writes and reads them

- **Write:** only the api, in the same transaction as the HOME row (`locations/domain/home.ts` `placeHome` →
  `LegacyLocationColumns`; registration, onboarding, admin, reconciler, backfill).
- **Read (search, this cycle):** the two routes above.
- **Read (display, not search):** `services/worker/profilePreview.service.ts`, `lib/profileData.ts`,
  `features/worker/preview.ts`, `components/profile/WorkerProfileView.tsx` (city/state/postcode); the api's
  `worker/domain/completion.ts`, `worker/persistence/profile-read.ts`, `admin/application/lists.ts` and the admin
  search's fallback.
- **Read (placement):** the api's reconciler (`onboarding/reconciler.ts`, `locations/domain/legacy-match.ts`) places
  an unplaced worker when the legacy `city/state/postalCode` match one suburb. Dropping those columns removes that path.

## Out of scope (different table)

`/api/contractors` and `/api/contractors-by-area` (app and web) and `sync-contractors` read `contractor_profiles` in
the **jobs** database (synced from Zoho), not `worker_profiles`. The app's `components/SearchSupport.tsx` and the
web landing search call them.

## Risks found

- **Unplaced workers (69 active, no HOME row)** may still have legacy coordinates: today they appear in a location
  search; on `worker_locations` alone they would not.
- **Google geocoding** is a paid external call per uncached search; a locality id removes it, but the public page's
  URL carries free text (`?location=Queenscliff NSW 2096`) that old links and the area pages use.
- The client route is a full-table-in-box load; PostGIS with paging in SQL is cheaper but changes the order
  semantics of ties.
