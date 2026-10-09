# Domain Entities -- unit `admin-search` (U2)

Nothing is persisted by this unit: no table, no column, no migration (D13). The entities are a query, a filter
specification, two row shapes, a memo entry and the page's state. The tables read are the existing ones
(`reverse-engineering/api-documentation.md`, Data Models).

## E1 WorkerSearchQuery (contract, the wire shape) and SearchQuery (api, normalised)

| Field | Wire (`workerSearchQuerySchema`) | Normalised (`SearchQuery`) |
|---|---|---|
| page, pageSize | int, defaults 1 / 20, max 100 | same |
| sortBy, sortOrder | enums, optional | defaulted (R1.2) |
| search | string <= 100 | trimmed, collapsed; `parts: string[]` |
| localityId, withinKm | int > 0; int 1..500 | same; invariants checked (R1.3) |
| unplaced | boolean | boolean; when true, locality fields dropped |
| typeOfSupport | category id | same |
| gender, hasVehicle, workerType | enums | same |
| age | one of four ranges | `{minAge, maxAge, minBirth, maxBirth}` |
| languages, therapeuticSubcategories | csv -> string[] | Title-Cased / as is; deduplicated, sorted |
| experienceWith | csv -> CareDomain[] | same |

## E2 FilterSpec (api, data)

| Field | Meaning |
|---|---|
| `name` | the filter's name (also the `appliedFilters` key) |
| `applies(q)` | whether the query activates it |
| `sql(q)` | the parameterised `Prisma.Sql` fragment (R3) |

`FILTERS` is the ordered table of ten specs (search, typeOfSupport, therapeuticSubcategories, gender, hasVehicle,
age, workerType, languages, experienceWith) plus the always-on active condition.

## E3 RawWorkerRow (api, from the statement) and WorkerRow (contract, the response)

| Raw column | -> Row field | Rule |
|---|---|---|
| p.* (id, userId, names, mobile, gender, age, dateOfBirth, languages, city, state, postalCode, photos, experience, introduction, createdAt, updatedAt, abn) | id, userId, firstName, lastName, mobile, gender, age (computed), languages (with fallback), city, state, postalCode, photos, experience, introduction, createdAt, updatedAt | R6.2, R6.3; `abn`, `dateOfBirth` dropped |
| u.email, u.status | email, isActive | |
| infoLanguages | (fallback source) | R6.3 |
| serviceNames, serviceIds | services, serviceIds | R6.6 |
| homeSuburb, homeState, homePostcode, precision, travelRadiusKm | location {localityLabel, precision, travelRadiusKm} | R6.5 |
| distance_m | distanceKm | R6.4 |
| total | (pagination.total) | R5.2 |

## E4 WorkerSearchResponse (contract)

`{ data: WorkerRow[], pagination: {total, page, pageSize, totalPages, hasNext, hasPrev}, appliedFilters:
AppliedFilters, unplacedCount: int }` with `AppliedFilters = { sortBy, sortOrder, locality?: {id, label},
withinKm?, unplaced?, search?, typeOfSupport?, gender?, hasVehicle?, workerType?, age?, languages?,
therapeuticSubcategories?, experienceWith? }`.

## E5 UserRow and SuspendedRow (contract)

`UserRow = { id, email, role, status, createdAt, firstName?, lastName?, mobile? }` (R9.3).
`SuspendedRow` = today's inactive-list fields with `isActive: false` (R10.2).

## E6 MemoEntry (api, in memory)

| Field | Meaning |
|---|---|
| `key` | `<entry id>|<canonical query>` |
| `body` | the 200 response body (the shaped object, not the JSON string) |
| `storedAt` | epoch ms; valid for 60 s |
| LRU order | at most 500 entries |

## E7 The page's filter state (app, URL-synced)

`{ page, pageSize, sortBy, sortOrder, search, locality?: {id, label}, withinKm?, unplaced, typeOfSupport (category
id), gender, hasVehicle, workerType, age, languages[], therapeuticSubcategories[], experienceWith[] (CareDomain) }`
plus UI-only: `pendingFilters` (the panel before "Apply"), `suburbSearch` text, `lastResults`, `lastFetchedAt`,
`outcome`.

## Relationships

```
page state --toQuery (R11.1)--> WorkerSearchQuery --strict parse--> SearchQuery --FILTERS (E2)--> statement
statement --> RawWorkerRow[] --shapeRow--> WorkerRow[] --> WorkerSearchResponse --ETag/memo (E6)--> browser cache
au_localities (id) --> search point, label;  worker_locations HOME --> wl.point, precision, travelRadiusKm
```

## Configuration

| Name | Value |
|---|---|
| statement timeout | 5,000 ms (Q2 A) |
| `privateCacheSeconds` | 60 (all three entries) |
| memo | 60 s, 500 entries (search only) |
| page size max | 100 |
| `withinKm` max | 500 |
