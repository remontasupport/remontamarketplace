# Inventory -- the admin dashboard's worker search (2026-10-08)

**Request (Q1 of `cycle-start-questions.md`, verbatim):** "Let us create a new API backend for the admin dashboard,
specifically the search API's. With the new schema and structure of the database, analyze how can we return accurate
results especially on the radius".

This file is the targeted reverse-engineering artifact for the cycle: every fact below was read from the code on
2026-10-08 (branch `aidlc/admin-search-api` from `main` `949cf2b`). Nothing has been changed. Production data was not
queried; the counts quoted come from the S1 production run of 2026-10-02.

## 1. The admin search screen today

```
/admin  (AdminDashboardClient.tsx, 1,400 lines)
   +-- suburb box  --> GET /api/suburbs?q=        (lib/suburbs: au_localities, 10 rows; the pick becomes the
   |                                               STRING "Parramatta, NSW 2150"; free text is accepted too,
   |                                               placeholder "e.g. Queensland, NSW")
   +-- Within      --> none | 5 | 10 | 20 | 50 km
   +-- filters     --> GET /api/admin/filters     (document categories/statuses/types, counts)
   +-- Apply       --> GET /api/admin/contractors?page&pageSize&sortBy&sortOrder&search&location&within
                                                  &typeOfSupport&gender&hasVehicle&workerType&age
                                                  &languages&therapeuticSubcategories&documentCategories
                                                  &documentStatuses&requirementTypes&experienceWith
```

| Endpoint (apps/app, Next.js route handlers) | Lines | Auth | What it does |
|---|---|---|---|
| `GET /api/admin/contractors` | 855 | `requireRole(ADMIN)` | The search. A filter registry (one function per filter) composed into a Prisma `where` on `worker_profiles` (`user.status = ACTIVE` always); two paths: **standard** (count + page in SQL, sort by `createdAt/firstName/lastName/city/state`) and **with distance** (section 2). Response `{ success, data[], pagination, appliedFilters }`, cached in Upstash Redis 60 s under the sorted query string. Every error is a 500 with the message. |
| `GET /api/admin/filters` | 185 | ADMIN | Distinct document categories and statuses, the `documents` master list, five document-submission counts (one raw SQL). |
| `GET /api/admin/contractors/inactive` | 108 | ADMIN or the phantom `SUPER_ADMIN` | Suspended workers, paged. |
| `GET /api/admin/users` | 113 | ADMIN | Impersonation picker: `contains` on email and the three profile names, 50 rows. |
| `POST /api/admin/ai-search` | 27 | ADMIN | Pass-through to the n8n webhook `AI_SEARCH_WEBHOOK`. Not a database search. |
| `GET /api/admin/contractors/[id]` | -- | ADMIN | Detail; opened from a result row. Not a search. |

**The filters, as the registry implements them** (all ported unchanged if the search moves): gender (Title Case),
hasVehicle (`Yes`/`No`), workerType (JSON path `abn.workerEngagementType.type` = `tfn`/`abn`), age (date-of-birth
range with the `age` column as fallback), services (`worker_services.categoryName`, kebab-case map), languages
(`worker_additional_info.languages` or `worker_profiles.languages`), text (first/last name `contains` insensitive,
mobile, two-word full-name forms), therapeutic sub-categories (`worker_services.subcategoryIds` under
`therapeutic-supports`), document categories / statuses / requirement types (`verification_requirements`), experience
(`worker_experience.domain`, all selected must match). `.brd` J7.1 calls this route "the best-engineered route in the
codebase".

## 2. How the radius works today, and where accuracy is lost

`searchWithDistance` runs when `location` is non-empty:

1. **Geocode the string with Google** (`lib/geocoding.ts`, key `GEOMAP_API`, "<string>, Australia"), Redis-cached
   24 h per string. **If it fails or the key is missing, the search silently runs without any distance filter** and
   the admin sees an unfiltered list with no notice.
2. `within = none` with a location means **radius 500 km** (a hidden cap: "Any distance" is not any distance).
3. A bounding box (`radiusKm / 111.32` degrees; a second, different formula exists in `lib/geocoding.ts`) on the
   composite index `worker_profiles(latitude, longitude)`, plus every other filter, fetches `{id, lat, lng}` of all
   candidates.
4. **Haversine in JavaScript** (sphere, R = 6371 km) filters to the exact radius and sorts; the page is sliced in
   memory; the page's ids are fetched again with the full select and re-ordered.
5. Workers with `latitude`/`longitude` null are silently absent from any distance search.

Where the result stops being accurate, in order of effect:

| # | Loss | Why it happens | Evidence |
|---|---|---|---|
| L1 | **Two different "Parramatta" points.** The admin picks a suburb from `au_localities`, but the search point is Google's geocode of the *label*, while every S1 worker is placed at the `au_localities` centroid. The two can differ by kilometres, and for an ambiguous label ("Richmond", "Springfield") Google may pick another state. | the route geocodes the string instead of using the picked row's id | `AdminDashboardClient.tsx:802`, `contractors/route.ts` `geocodeLocation` |
| L2 | **Silent fallback.** A geocoding miss or an exhausted/missing `GEOMAP_API` turns a 10 km search into "everyone". | `if (!coords) return searchStandard(...)` | `contractors/route.ts` `searchWithDistance` |
| L3 | **"Any distance" = 500 km.** Workers 501+ km away vanish although no radius was chosen; `appliedFilters` does not say so. | `radiusKm = within === 'none' ? 500 : ...` | same |
| L4 | **Mixed-provenance worker coordinates.** Legacy sign-ups (before 2026-10-02) were geocoded by Google from whatever the person typed (street addresses, "TA" for Tasmania, 3-digit NT postcodes, metro names); S1 sign-ups are locality centroids. Same column, different meanings; 70 workers could not be matched to any suburb by the backfill and keep those legacy numbers. | `docs/signup/03-data-model.md` section 5; `S1-production-run.md` | `worker_profiles.latitude/longitude` |
| L5 | **Free text reaches the distance path.** "Queensland" (the placeholder's own example) geocodes to the state's centre and searches 500 km around it. | the box accepts any string | `AdminDashboardClient.tsx:745` |
| L6 | **Centroid precision.** Every S1 placement is `precision = LOCALITY`: distance is centroid-to-centroid. For a Sydney suburb that is within 1-2 km; for a large rural locality it can be 20 km off. Nothing writes `precision = ADDRESS` yet (schema only). | S1-data-model 2.2 | `worker_locations.precision` |
| L7 | **The worker's own travel radius is ignored.** `worker_locations.travelRadiusKm` exists for every placed worker (50 by default, nobody edits it yet) and is never read by any search. "Within 10 km" answers *who lives near*, not *who will travel here*. | no reader | `locations/domain/home.ts` |
| L8 | **Four copies of the distance code**, two formulas, JS pagination. Correct today at about 2,000 workers; the two-pass design exists only because the distance is computed outside the database. | `.brd/phase-4` line 315 (STR-02) | `contractors/route.ts`, `client/workers/route.ts`, `public/workers/route.ts`, `lib/geocoding.ts` |

Note on the maths itself: Haversine on a sphere differs from a spheroid distance by at most about 0.3 % at these
latitudes (tens of metres at 10 km). The formula is not the problem; the inputs (L1-L5) and the missing semantics (L7)
are.

## 3. What the new schema gives (live in production since 2026-10-02)

| Object | Facts |
|---|---|
| `au_localities` | 15,467 suburb-postcode pairs from G-NAF with centroids; `point geography(Point,4326)` generated from lat/lng, GiST index; `retiredAt` for dropped rows (never deleted); refreshed every six months by a reviewed script. The admin's suburb box already reads it (`/api/suburbs`), as does the api's `GET /v1/localities`. |
| `worker_locations` | One `HOME` row per worker (partial unique index), `localityId` FK, lat/lng + generated `point` (GiST), `travelRadiusKm` 1-500 (NOT NULL on HOME; 50 by default), `precision` `LOCALITY`/`ADDRESS`, `source` (REGISTRATION / ONBOARDING / ADMIN / RECONCILER / BACKFILL). 1,751 HOME rows backfilled 2026-10-02 plus every api sign-up since. `SERVICE_AREA` kind reserved, unused. Check constraints keep coordinates inside Australia. |
| Unplaced workers | 70 at the backfill (unmatched suburb text), listed for review, never guessed; the reconciler places a worker the moment they fix their address in onboarding. **Nothing in `apps/app` reads `worker_locations` yet** (only the generated client mentions it). |
| Dual write | The api writes `worker_profiles.location/city/state/postalCode/latitude/longitude` from the locality in the same transaction (`placeHome` to `LegacyLocationColumns`) **because the search readers still read them** (follow-up 1). It stops only when every reader has moved. |
| One query | With PostGIS the whole search becomes one indexed statement: `ST_DWithin(wl.point, :p, :metres)` for the radius, `ST_Distance(wl.point, :p)` for the sort (spheroid, metres), a window or second count for the total, `LIMIT/OFFSET` for the page. The search point is the picked locality's own `point`, so worker and search share one coordinate source (fixes L1, L2, L5). The worker's reach is `ST_DWithin(wl.point, :p, wl."travelRadiusKm" * 1000)` (gives L7). |

## 4. The api side (`apps/api`): what exists and what an admin endpoint needs

| Fact | Where |
|---|---|
| Every entry is a contract entry with `meta({ access, bot, rateLimit, maxBodyKb, audit?, cacheSeconds? })`; `access` is `'public'` or `{ roles: [...] }` over `ROLES = WORKER / CLIENT / COORDINATOR / ADMIN` (no `SUPER_ADMIN`; the database enum has none either). | `packages/api-contract/src/meta.ts` |
| The pipeline authenticates every non-public entry (401, then 403 on role, then per-user rate limits) through an `Authenticator`. **The only implementation is `DenyAllAuthenticator`**: "Authentication arrives in slice 2 (Identity)". So today no caller can reach a role-restricted entry at all. | `apps/api/src/platform/auth/authenticator.ts`, `pipeline.ts:51-56` |
| S1's requirements already define the intended mechanism: **FR-ID-02** a short-lived signed token issued by `apps/app` after NextAuth sign-in (subject, role, audience, issuer, expiry, session id), validated by the api on every request; **FR-ID-03** a server-side session record so logout and suspension invalidate immediately. Neither is built. | `archive/s1-worker-registration/inception/requirements/requirements.md` section 5.1 |
| The app's session is a NextAuth **JWT cookie** (`__Secure-next-auth.session-token`, `SameSite=Lax`, domain = the app host), 24 h or 7 d, carrying `id`, `role`, `email`, `impersonatedBy`. The api lives on `*.run.app`, a different site: **the browser will never send this cookie to the api.** The contract client sends no credentials; it accepts extra headers per call (`init.headers`) and per client (`opts.headers`). | `apps/app/src/lib/auth.config.ts:229-320`; `packages/api-contract/src/client.ts:18-57` |
| CORS: production allows the app's exact origin; staging allows `https://*.vercel.app`. The api can read every table the search needs (its Prisma client comes from `packages/db`, full schema). No Redis in the api; the rate limiter and outbox use Postgres. | `infra/lib/stages.ts`, `apps/api/src/config/hosts.ts` |
| Existing read-only entries to mirror: `listServiceCategories` (public, cached 300 s) and `searchLocalities` (public, 10 rows). | `packages/api-contract/src/registration.contract.ts` |

Two ways to let an admin reach the api, both compatible with the pipeline:

- **(a) A token the browser carries.** `apps/app` adds one route that turns the NextAuth session into a short-lived
  JWT (minutes) signed with a secret the api also holds; the admin page calls the api through `createClient` with the
  `Authorization` header; the api's authenticator verifies signature, audience, issuer and expiry, and maps the claims
  to a `Principal`. This is FR-ID-02's shape and becomes the foundation every later authenticated entry reuses.
  Suspension lags by the token lifetime unless a session check (FR-ID-03) is added.
- **(b) The app's route proxies.** `GET /api/admin/contractors` keeps checking the session and calls the api
  server-to-server with a service credential. No browser change, no CORS, but the Next.js route per endpoint stays
  (the pattern CLAUDE.md asks not to add to) and the api never learns who the admin is unless the proxy forwards it.

## 5. The other readers of the legacy columns (not admin; listed because follow-up 1 names them)

| Reader | Lines | Radius logic | Notes |
|---|---|---|---|
| `GET /api/client/workers` (client and coordinator find-worker) | 697 | same geocode + bbox + Haversine, default 50 km, `within` uncapped | `.brd` J4.1-4.3: does not filter `isPublished`/`verificationStatus` |
| `GET /api/public/workers` (marketing feed) | 348 | same; `within` uncapped (XC-04) | unauthenticated |
| `GET /api/contractors` (app) and `apps/web` `api/contractors` | 458 / 460 | CRM-sourced `contractor_profiles`, a different table | `.brd` J4.8 |
| `lib/worker-search.ts` | 363 | bbox + Haversine | **zero callers** (`.brd` J4.10); deletable |

Moving the admin search alone fixes the admin's results and proves the PostGIS query; the dual write and the legacy
columns stay until the client and public readers follow.

## 6. Not verifiable from here

- How many workers today have a HOME row vs only legacy coordinates vs neither (a production read; the S1 figures
  above are from 2026-10-02).
- Whether any admin relies on free-text location searches ("Queensland"); the Redis cache keys would show it; not
  read.
- `GEOMAP_API` quota and failure rate in production (would show as L2, silently).
