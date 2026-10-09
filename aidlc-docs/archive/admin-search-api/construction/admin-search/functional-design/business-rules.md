# Business Rules -- unit `admin-search` (U2)

Numbered so code and tests can cite them. "400 with the field" = the contract's 400 envelope with `fields.<name>`.

## R1 The query (contract `workerSearchQuerySchema`, strict)

| # | Rule |
|---|---|
| R1.1 | Parameters: `page` int >= 1 (default 1); `pageSize` int 1..100 (default 20); `sortBy` in {createdAt, firstName, lastName, city, state, distance}; `sortOrder` in {asc, desc}; `search` string <= 100 after trim; `localityId` int > 0; `withinKm` int 1..500; `unplaced` boolean; `typeOfSupport` string (a category id, <= 60); `gender` in {Male, Female}; `hasVehicle` in {Yes, No}; `workerType` in {Employee, Contractor}; `age` in {20-30, 31-45, 46-60, 60+}; `languages`, `therapeuticSubcategories` comma-separated strings (each <= 40, at most 20 items); `experienceWith` comma-separated `CareDomain` values. Any other parameter: 400 (strict). No `all`/`none` sentinels: absent = no filter. |
| R1.2 | Defaults: `sortBy` = `distance` when `localityId` is given, else `createdAt`; `sortOrder` = `asc` for `distance`, else `desc`. |
| R1.3 | `withinKm` without `localityId`: 400 `fields.withinKm`. `sortBy=distance` without `localityId`: 400 `fields.sortBy`. |
| R1.4 | `unplaced=true` ignores `localityId` and `withinKm` (they are dropped from `appliedFilters`, not an error). |
| R1.5 | Arrays are split on `,`, trimmed, empty items dropped, duplicates removed, order irrelevant. |

## R2 The locality

| # | Rule |
|---|---|
| R2.1 | `localityId` must name an existing `au_localities` row (retired rows allowed: they keep their point); otherwise 400 `fields.localityId` "unknown suburb". |
| R2.2 | The search point is that row's `point` (geography); the label is `"<suburb> <STATE> <postcode>"` (`localityLabel` with a space, as the autocomplete shows). |

## R3 Filters: one fragment each, all combined with AND (plus `u.status = 'ACTIVE'`)

| # | Filter | Fragment (parameterised) | Semantics |
|---|---|---|---|
| R3.1 | search | one word w: `(p."firstName" ILIKE '%'||$w||'%' OR p."lastName" ILIKE ... OR p.mobile LIKE '%'||$w||'%')`; two or more words: the same for the whole string OR (`firstName ILIKE %first% AND lastName ILIKE %rest%`) OR (`lastName ILIKE %first% AND firstName ILIKE %rest%`) | today's rule; `%` and `_` in the input escaped |
| R3.2 | typeOfSupport | `EXISTS (SELECT 1 FROM worker_services ws WHERE ws."workerProfileId" = p.id AND ws."categoryId" = $id)` | by id (Q1 A); the parity script maps today's names to ids |
| R3.3 | therapeuticSubcategories | `EXISTS (... ws."categoryId" = 'therapeutic-supports' AND ws."subcategoryIds" && $ids)` | any of |
| R3.4 | gender | `p.gender = $gender` | exact (`Male`/`Female`) |
| R3.5 | hasVehicle | `p."hasVehicle" = $v` | exact |
| R3.6 | age | `((p."dateOfBirth" IS NOT NULL AND p."dateOfBirth" >= $minBirth AND p."dateOfBirth" <= $maxBirth) OR (p."dateOfBirth" IS NULL AND p.age BETWEEN $minAge AND $maxAge))` with `minBirth = (year - maxAge)-01-01`, `maxBirth = (year - minAge)-12-31`, `60+` = 60..120 | today's year-granular rule, text comparison (D13 parity); known imprecision = follow-up 15 |
| R3.7 | workerType | `p.abn #>> '{workerEngagementType,type}' = $t` with Employee -> `tfn`, Contractor -> `abn` | today's rule |
| R3.8 | languages | `(COALESCE(array_length(wai.languages, 1), 0) > 0 AND wai.languages && $arr) OR (COALESCE(array_length(wai.languages, 1), 0) = 0 AND p.languages && $arr)` with `$arr` Title-Cased | today's primary-then-fallback, any of |
| R3.9 | experienceWith | one `EXISTS (SELECT 1 FROM worker_experience we WHERE we."workerProfileId" = p.id AND we.domain = $d)` per selected domain, ANDed | all of |
| R3.10 | (always) | `u.status = 'ACTIVE'` | the base condition |

## R4 The location term

| # | Rule |
|---|---|
| R4.1 | With `localityId` and `withinKm`: `wl.point IS NOT NULL AND ST_DWithin(wl.point, pt.point, $withinKm * 1000)`; a worker exactly at the distance is included. |
| R4.2 | With `localityId` and no `withinKm`: `wl.point IS NOT NULL` (every placed worker). |
| R4.3 | With `unplaced=true`: `wl.id IS NULL` and no location term. |
| R4.4 | `unplacedCount` = the count of workers matching R3 with `wl.id IS NULL`, in every response. |
| R4.5 | Without `localityId` (and not `unplaced`): no location term; unplaced workers are listed like the others; no distance. |
| R4.6 | Distances are `ST_Distance` on geography (spheroid metres); nothing in application code compares coordinates. |

## R5 Sorting, paging, timing

| # | Rule |
|---|---|
| R5.1 | Sort keys: `createdAt` -> `p."createdAt"`; `firstName`/`lastName` -> the column; `city` -> `COALESCE(al.suburb, p.city)`; `state` -> `COALESCE(al.state, p.state)`; `distance` -> `distance_m`; always followed by `p.id ASC` (stable). |
| R5.2 | `LIMIT pageSize OFFSET (page-1)*pageSize`; `total` from `COUNT(*) OVER()`; a page past the end answers an empty `data` with the correct `pagination`. |
| R5.3 | `totalPages = ceil(total / pageSize)` (0 when total 0); `hasNext = page < totalPages`; `hasPrev = page > 1`. |
| R5.4 | The same request answers the same page twice (determinism follows from R5.1 and ReadCommitted within one statement). |
| R5.5 | `SET LOCAL statement_timeout = 5000` in the search transaction; a timeout or pool exhaustion answers 503 with `Retry-After: 2`. |

## R6 The row

| # | Rule |
|---|---|
| R6.1 | Fields: today's (id, userId, firstName, lastName, mobile, email, gender, age, languages, services, city, state, postalCode, photos, experience, introduction, createdAt, updatedAt, isActive) plus `serviceIds`, `distanceKm?`, `location?`. Strict schema: nothing else leaves. |
| R6.2 | `age` = computed from `dateOfBirth` with today's month/day-aware function when parseable, else the integer `age` column, else null. |
| R6.3 | `languages` = `worker_additional_info.languages` when non-empty, else `worker_profiles.languages`. |
| R6.4 | `distanceKm` present iff a locality was given and the worker is placed; `round(distance_m / 1000, 1)`. |
| R6.5 | `location` present iff the worker has a HOME row: `{ localityLabel, precision, travelRadiusKm }`. |
| R6.6 | `services` = distinct category names (display), `serviceIds` = distinct category ids. |

## R7 `appliedFilters`

| # | Rule |
|---|---|
| R7.1 | Echoes the canonical query: every present filter with its canonical value; `locality: {id, label}` when given; `withinKm` when given; `unplaced` when true; `sortBy`, `sortOrder` always. Absent filters are omitted. |

## R8 The caches (contract field, pipeline step, memo)

| # | Rule |
|---|---|
| R8.1 | Entries with `privateCacheSeconds: N` (the three admin entries, N = 60) get, on a 200: `ETag: "sha256-<base64url(sha256(body JSON))>"`, `Cache-Control: private, max-age=N`, `Vary: Authorization`. Never on a non-200. |
| R8.2 | `If-None-Match` equal to the computed ETag: 304, no body, the same three headers. |
| R8.3 | The memo (search entry only): key `<entry id>|<canonical query>`; a hit within 60 s returns the stored body without running the handler; `Cache-Control: no-cache` (or `max-age=0`) on the request skips the lookup; after the handler a 200 body is stored; at most 500 entries, least-recently-used evicted; per instance; cleared at start. |
| R8.4 | `checkContracts`: `privateCacheSeconds` only on a GET with `access` not `'public'`, and never together with `cacheSeconds`; value 1..3600. |
| R8.5 | `canonicalQueryOf` is one shared function (contract package): sorted keys, defaults applied, arrays sorted and comma-joined, absent omitted, encoded; the page builds its URLs with it (R11.2). |

## R9 List users

| # | Rule |
|---|---|
| R9.1 | `search` 2..100 chars; `role` optional in `ROLES`. |
| R9.2 | Match: email, or any of worker/client/coordinator first or last name, `contains` case-insensitive; `role` exact. |
| R9.3 | At most 50, newest first; row = `{id, email, role, status, createdAt, firstName?, lastName?, mobile?}` from the first profile found (worker, client, coordinator). |

## R10 List suspended workers

| # | Rule |
|---|---|
| R10.1 | `page`, `pageSize` as R1.1; `where user.status = 'SUSPENDED'`; order `updatedAt desc`, then id. |
| R10.2 | Row = today's fields (`isActive` false); `pagination` as R5.3. |

## R11 The page

| # | Rule |
|---|---|
| R11.1 | Display -> canonical: `gender` lower -> `Male`/`Female`; `typeOfSupport` = `category.id`; `experienceWith` display name -> `CareDomain` by one map; `all` -> absent; `none` -> absent. |
| R11.2 | URLs are built with `canonicalQueryOf`; the URL state carries `localityId`, `localityLabel`, `withinKm`, `unplaced` and the canonical filters; loading a URL restores the state. |
| R11.3 | A suburb pick stores `{id, label}`; an id of null or a cleared box = no locality; "Within" disabled without a locality and reset to "Any distance" when the locality clears. |
| R11.4 | The line "N active workers have no mapped suburb" uses `unplacedCount`; its link sets `unplaced=true` (the suburb and distance controls disabled in that mode). |
| R11.5 | "Results may be up to a minute old" with a refresh button; refresh calls with `cache: 'reload'` (the browser sends `Cache-Control: no-cache`). |
| R11.6 | Outcomes other than `ok` show U1's notices; the last results stay on screen. |
| R11.7 | After suspend, reactivate or publish, the list is reloaded with `cache: 'reload'`. |
| R11.8 | The document-filter state, the options fetch and `filterOptions` are removed; `sortBy=distance` is offered only when a locality is set. |

## Properties (PBT-01)

| Property | Category | Where |
|---|---|---|
| G1 For generated Australian points and radii, the set of workers returned by `ST_DWithin` equals the set a Haversine oracle returns, allowing a 0.5 % band at the boundary; distances are non-decreasing across the page sequence | oracle, invariant | CI on PostGIS with generated workers and localities |
| G2 Concatenating all pages for any (filters, pageSize) equals the full ordered list: no duplicates, no gaps; `total` equal on every page | invariant | CI on PostGIS |
| G3 Placed-matching + unplaced-matching = all matching for any filters; the unplaced list and any distance list are disjoint | invariant | CI on PostGIS |
| G4 For any generated `SearchQuery`, `whereOf(q)` contains exactly one fragment per active filter, joined with AND, plus the active condition; no fragment dropped | invariant | unit (string/AST inspection of `Prisma.Sql`) |
| G5 `normaliseQuery` is idempotent and `appliedFiltersOf(normaliseQuery(raw))` round-trips to the same canonical query string | idempotence, round-trip | unit |
| G6 `canonicalQueryOf(entry, parse(canonicalQueryOf(entry, q))) == canonicalQueryOf(entry, q)` for any q; key order and array order do not change it | round-trip, invariant | contract package |
| G7 Memo model: for any sequence of (key, time, no-cache?) requests, the body returned equals the handler's body at the most recent fill within 60 s; size <= 500 | oracle, invariant | unit |
| G8 ETag: equal bodies give equal ETags; any change to the body changes it; a matching `If-None-Match` yields 304 with no body | invariant | unit |
| G9 The age rule: for any date of birth and today, the row matches exactly the ranges today's registry matches (oracle: today's function ported into the test) | oracle | unit |
| G10 `shapeRow` never emits a field outside the response schema and never emits `abn` or `dateOfBirth` | invariant | unit |

Example-based tests pin: each filter alone on a seeded set; "Test Terson" both orders; the four age ranges at the
year boundaries; `withinKm` without a locality (400); `sortBy=distance` without a locality (400); an unknown
locality (400); a page past the end; the unplaced list; the `no-cache` bypass; the 304 path; the users and suspended
lists.
