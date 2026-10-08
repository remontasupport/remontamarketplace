# Business Logic Model -- unit `admin-search` (U2)

Algorithms step by step; rules cited as R# (`business-rules.md`). Decisions: plan Q1 A (canonical filter values,
the page maps), Q2 A (5 s statement timeout), Q3 A (the 45-case parity matrix); approved 2026-10-08. The principal
and the outcomes come from U1.

## L1 `searchWorkers(deps, rawQuery)` -- the search service (C8)

```
1. q = normaliseQuery(rawQuery, now)                                        (R1; 400 with fields on an invariant breach)
2. locality = q.localityId ? db.auLocality.findUnique({ id }) : null          -- null when an id was given -> 400 fields.localityId (R2.1)
3. { rows, total, unplacedCount } = runSearch(db, q, locality?.id, { statementTimeoutMs: 5000 })   (L2)
4. data = rows.map(r => shapeRow(r, now, locality != null))                   (R6)
5. pagination = { total, page, pageSize, totalPages: ceil(total/pageSize), hasNext: page < totalPages, hasPrev: page > 1 }
6. appliedFilters = appliedFiltersOf(q, locality && { id, label: localityLabel(locality) })          (R7)
7. return { status: 200, body: { data, pagination, appliedFilters, unplacedCount } }
```

## L2 `runSearch(db, q, localityId, opts)` -- one transaction, two statements (C7)

```
BEGIN (ReadCommitted)
  SET LOCAL statement_timeout = 5000                                            (R5.5)
  rows = $queryRaw(searchStatement(q, localityId))                              (L3)
  unplacedCount = $queryRaw(unplacedCountStatement(q))[0].count                  (R4.4)
COMMIT
total = rows[0]?.total ?? (page > 1 ? countOnly(q, localityId) : 0)             -- an empty page past the end still needs the total (R5.3)
```

A statement timeout or a pool timeout maps to 503 with `Retry-After: 2` through the existing error mapping (P2024
and `57014` both -> `isOverloadedDatabase`).

## L3 `searchStatement(q, localityId)` -- the statement (C7, C6)

```sql
WITH pt AS (SELECT point FROM au_localities WHERE id = $localityId)            -- only when a locality is given
SELECT p.id, p."userId", p."firstName", p."lastName", p.mobile, p.gender, p.age, p."dateOfBirth",
       p.languages, p.city, p.state, p."postalCode", p.photos, p.experience, p.introduction,
       p."createdAt", p."updatedAt", p.abn,
       u.email, u.status AS "userStatus",
       wai.languages AS "infoLanguages",
       (SELECT array_agg(DISTINCT ws."categoryName") FROM worker_services ws WHERE ws."workerProfileId" = p.id) AS "serviceNames",
       (SELECT array_agg(DISTINCT ws."categoryId")   FROM worker_services ws WHERE ws."workerProfileId" = p.id) AS "serviceIds",
       al.suburb AS "homeSuburb", al.state AS "homeState", al.postcode AS "homePostcode",
       wl.precision, wl."travelRadiusKm",
       ST_Distance(wl.point, (SELECT point FROM pt)) AS distance_m,            -- only with a locality
       COUNT(*) OVER() AS total
FROM worker_profiles p
JOIN users u ON u.id = p."userId"
LEFT JOIN worker_additional_info wai ON wai."workerProfileId" = p.id
LEFT JOIN worker_locations wl ON wl."workerProfileId" = p.id AND wl.kind = 'HOME'
LEFT JOIN au_localities al ON al.id = wl."localityId"
WHERE u.status = 'ACTIVE'
  AND <one fragment per active filter, R3>
  AND <location term, R4>
ORDER BY <sort, R5.1>, p.id
LIMIT $pageSize OFFSET $skip
```

Every `$` is a bound parameter (`Prisma.sql` fragments joined with `Prisma.join`); no string concatenation of user
input. `unplacedCountStatement` is `SELECT COUNT(*) FROM ... WHERE u.status = 'ACTIVE' AND <filters> AND wl.id IS
NULL` (no location term).

## L4 `normaliseQuery(raw, now)` -- pure (C5)

```
1. page = raw.page ?? 1; pageSize = raw.pageSize ?? 20                           (contract bounds: 1..100)
2. sortBy = raw.sortBy ?? (raw.localityId ? 'distance' : 'createdAt'); sortOrder = raw.sortOrder ?? (sortBy == 'distance' ? 'asc' : 'desc')
3. invariants (400 with the field named):
   - withinKm without localityId          -> fields.withinKm
   - sortBy = 'distance' without localityId -> fields.sortBy
   - unplaced = true: localityId and withinKm are ignored (not an error; appliedFilters says unplaced)
4. age: '60+' -> { minAge 60, maxAge 120 }; 'a-b' -> { minAge a, maxAge b };
        minBirth = `${year(now) - maxAge}-01-01`, maxBirth = `${year(now) - minAge}-12-31`     (today's rule, R3.6)
5. search = trim, collapse spaces; parts = split on whitespace
6. arrays: already split, trimmed, deduplicated by the contract; empty = absent
7. return SearchQuery
```

## L5 `shapeRow(raw, now, withDistance)` (C8)

```
age        = calculateAge(raw.dateOfBirth) ?? raw.age              -- today's function (month/day aware) (R6.2)
languages  = raw.infoLanguages?.length ? raw.infoLanguages : raw.languages        (R6.3)
services   = raw.serviceNames ?? []; serviceIds = raw.serviceIds ?? []
isActive   = raw.userStatus == 'ACTIVE'
distanceKm = withDistance && raw.distance_m != null ? round1(raw.distance_m / 1000) : undefined   (R6.4)
location   = raw.homeSuburb ? { localityLabel: `${homeSuburb} ${homeState} ${homePostcode}`, precision, travelRadiusKm } : undefined
row        = { id, userId, firstName, lastName, mobile, email, gender, age, languages, services, serviceIds, city, state, postalCode, photos, experience, introduction, createdAt, updatedAt, isActive, distanceKm?, location? }
```

`abn`, `dateOfBirth`, `userStatus` and the raw arrays never leave the service (the response schema is strict).

## L6 The pipeline's cache step (C18) -- for entries with `privateCacheSeconds`

```
before the handler (entries bound with memo: true):
  key = `${id}|${canonicalQueryOf(entry, query)}`                               (R8.3)
  if request.headers['cache-control'] does not include 'no-cache' and memo.get(key, now) -> body = hit; skip handler
after the response schema check (status 200 only):
  if memo bound and not a hit: memo.set(key, out.data, now)
  etag = `"sha256-${base64url(sha256(JSON.stringify(out.data)))}"`              (R8.1)
  if request.headers['if-none-match'] == etag -> reply 304, no body, same cache headers
  reply.header('cache-control', `private, max-age=${m.privateCacheSeconds}`); reply.header('vary', 'Authorization'); reply.header('etag', etag)
errors (any status >= 400): no memo, no cache headers (the existing path)
```

`canonicalQueryOf`: the parsed query's keys sorted, defaults applied, arrays sorted and joined with `,`, absent
keys omitted, URL-encoded; the same function the app's client uses to build URLs (shared through the contract
package so the two cannot drift).

## L7 `listUsers(deps, q)` and `listSuspendedWorkers(deps, q)` (C9)

```
listUsers:    where = { ...(q.search.length >= 2 && OR[email contains, worker/client/coordinator first/last name contains] insensitive),
                        ...(q.role && { role: q.role }) }; take 50; orderBy createdAt desc; flatten the profile  (R9)
listSuspended: where = { user: { status: 'SUSPENDED' } }; count + findMany(skip, take, orderBy updatedAt desc); today's select; isActive false  (R10)
```

## L8 The page: a search (C14, C13)

```
1. filters state (URL-synced): { page, pageSize, sortBy, sortOrder, search, locality?: {id, label}, withinKm?, unplaced, typeOfSupport (category id), gender, hasVehicle, workerType, age, languages[], therapeuticSubcategories[], experienceWith[] (CareDomain) }
2. apply: query = toQuery(filters)  (display -> canonical, R11.1); url = canonicalQueryOf(entry, query) (R11.2)
3. outcome = adminApi.searchWorkers(query, { cache: reload ? 'reload' : 'default' })   (U1's wrapper)
4. ok -> render rows; distance column when appliedFilters.locality; the unmapped line from unplacedCount (R11.4); "results may be up to a minute old" with the refresh button (R11.5)
   other outcomes -> the notices of U1's contract; last results kept (R11.6)
5. after suspend/reactivate/publish -> re-run step 3 with reload = true (R11.7)
```

## Sequence: a search with a suburb and 10 km

```mermaid
sequenceDiagram
    participant UI as Admin page
    participant C as adminApi
    participant P as pipeline (+ memo)
    participant S as searchWorkers
    participant D as Neon/PostGIS
    UI->>C: searchWorkers({localityId: 1234, withinKm: 10, gender: 'Female', page: 1})
    C->>P: GET /v1/admin/workers?gender=Female&localityId=1234&page=1&pageSize=20&withinKm=10  (Bearer)
    P->>P: auth, role, limits, strict parse; memo miss
    P->>S: searchWorkers(query)
    S->>D: auLocality.findUnique(1234)
    S->>D: BEGIN; SET LOCAL statement_timeout=5000; SELECT ... ST_DWithin(wl.point, pt, 10000) ... ORDER BY distance_m, p.id LIMIT 20; SELECT COUNT(*) ... wl.id IS NULL; COMMIT
    D-->>S: rows (with total), unplacedCount
    S-->>P: {data, pagination, appliedFilters{locality{1234,"Parramatta NSW 2150"}, withinKm 10, gender Female}, unplacedCount}
    P->>P: memo.set; ETag; Cache-Control private, max-age=60
    P-->>C: 200
    C-->>UI: ok -> rows nearest first with distanceKm
    UI->>C: same filters again within 60 s
    C-->>UI: (browser cache) no request
```
