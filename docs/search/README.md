# The worker search api

The two worker searches that are not the admin's: the client and coordinator dashboard's, and the marketing site's
`/search` page. Both run on `apps/api` over `worker_locations` + PostGIS. Written from the code; when an entry, a
rule or a limit changes, update this file in the same PR. Design record: `aidlc-docs/construction/search-api/` (cycle
search-locations, 2026-10-28). The admin search is in `docs/admin/README.md`.

Until U2 of that cycle moves the pages, they still call the Next routes `apps/app` `/api/client/workers` and
`/api/public/workers`. The entries below answer the same parameters with the same bodies.

## 1. The entries

| | `GET /v1/client/workers` | `GET /v1/public/workers` |
|---|---|---|
| Caller | CLIENT or COORDINATOR, `Authorization: Bearer <token>` from the app's `GET /api/auth/api-token` (`docs/admin/README.md` §1) | anyone (`public-endpoints.json`) |
| Who is listed | every worker whose account is ACTIVE and whose profile has a first and last name (activated or not: user 2026-10-23) | activated workers whose account is ACTIVE |
| `page` | 1.. (default 1) | same |
| `pageSize` | 1..50 (default 20) | 1..50 (default 12) |
| `search` | keywords, ≤ 200 characters (§3) | not accepted |
| `services` | category names, comma separated, ≤ 10: any of them | not accepted |
| `typeOfSupport` | not accepted | a slug (`packages/schemas/src/data/serviceSlugs.ts`), `all`, or a category name |
| `location` | the place, ≤ 120 characters (§2) | same |
| `within` | km, 1..500 (default 50) | km 1..500, or `none` / absent = 500 |
| Card | `id, firstName, lastName, photo, role` (first service, else "Support Worker"), `bio` ('' if none), `skills` (sub-categories of the first five services), `location` ("Suburb, ST", else "Australia"), `isNdisCompliant` (any APPROVED requirement) | `id, firstName, lastName, bio, photo, city, state, services` (category names), `distanceKm` (only with a place, 1 decimal) |
| Body | `{ success: true, data, pagination: { total, page, pageSize, totalPages, hasNext, hasPrev } }` | same |
| Limits | 120/min per user, 300/min per IP | 600/min per IP, 3000/min global (the marketing page calls from Vercel's servers: one IP for every visitor) |
| Caching | `private, max-age=60` + ETag; the api's 60 s memo | `public, max-age=60`; the api's 60 s memo |

A bad parameter is a 400 with the field named. City and state come from the worker's HOME suburb, else from the
legacy `worker_profiles` columns.

## 2. The place (`location`)

The text is matched to our suburbs (`au_localities`, current rows); no Google call. The first rule that applies
decides (`apps/api/src/modules/locations/domain/place.ts`):

1. **Ends in a postcode** (`"Parramatta, NSW 2150"`, what both search bars send; the comma is optional): the suburb of
   that name (and state) in that postcode; else the reconciler's matcher (`legacy-match.ts`: a street address or a
   metro name around the suburb, a wrong state). One suburb or no place.
2. **A postcode alone** (`"2150"`, 3 or 4 digits): the centre of that postcode's suburbs.
3. **A name, optionally with a state** (`"Parramatta"`, `"Richmond VIC"`): the suburb when only one place has that
   name (a suburb's several postcodes count as one place).
4. **Anything else** (`"Gold Coast"`, `"Richmond"`): no place.

**No place** means the search runs without one: no radius, newest first, no `distanceKm`. So does a failure to read
the suburbs. The log line says which (`place: suburb | postcode | name | unmatched | failed | none`).

**With a place**, only workers with a HOME row within `within` km of it are listed (`ST_DWithin`), nearest first, then
newest, then id. Workers without a HOME row (69 active at 2026-10-09) are not listed in a search with a place
(follow-up 17 places them).

## 3. Keywords (client only)

Ported unchanged from the app route (`apps/api/src/modules/search/domain/keywords.ts`):

- Split on spaces and commas; letters and digits kept; lower case; words under 2 characters and stop words
  ("loves", "the", "with"...) dropped; at most 5. A query of stop words only is one keyword as typed.
- A keyword is a **service** keyword when a category or sub-category name equals it or (4+ characters) contains it
  ("nurse" → "Nursing Services"). It matches a service's category name, the qualifications or the unique-service text.
- Any other keyword matches the first or last name, introduction, hobbies, fun fact, the additional-info personality or
  fun fact (all containing it, any case), or equals one of the interests or work preferences.
- Every keyword must match. The service names are read once an hour per instance; if they cannot be read, every
  keyword is a text keyword (logged as `keywordNamesFailed`).

With no keywords, no place and no services, the client search lists only workers with an introduction.

## 4. Checking parity on staging

`pnpm --filter @remonta/api parity:search -- --old=<preview url> --cookie="<client session cookie>" --new=<staging api
url> --token=<client token>` with `REHEARSAL_DATABASE_URL` in `apps/api/.env`. It compares every page of the old routes
and the new entries over the places in `apps/api/scripts/parity-search.json`, and explains each difference from the
database (no HOME row, legacy point ≠ HOME point, radius edge, text that pins no suburb). It exits 1 on an
unexplained difference. It refuses the production database.
