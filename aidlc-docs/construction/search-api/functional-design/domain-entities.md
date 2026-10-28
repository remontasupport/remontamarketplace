# U1 `search-api`: domain entities (2026-10-28)

Answers: FD-Q1 A, FD-Q2 A. Everything the two pages read is kept as it is (FR-5).

## E1 `ClientWorkerQuery` (`GET /v1/client/workers`, roles CLIENT, COORDINATOR)

| Field | Type | Default / bound | Today |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | same |
| `pageSize` | int 1..50 | 20 | same |
| `search` | string, trimmed, ≤ 200 | absent | same (no bound today) |
| `location` | string, trimmed, ≤ 120 | absent | same (no bound today) |
| `services` | comma list of category names, ≤ 10 | absent | same |
| `within` | int 1..500 km | 50 | `max(1, n)`, no upper bound today |

## E2 `PublicWorkerQuery` (`GET /v1/public/workers`, public)

| Field | Type | Default / bound | Today |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | same |
| `pageSize` | int 1..50 | 12 | same |
| `location` | string, trimmed, ≤ 120 | absent | same |
| `typeOfSupport` | a service slug or `all` | absent | same; the slug → category-name map moves to `packages/schemas` (CS-3) |
| `within` | int 1..500 km, or `none` | 500 when absent or `none` | same |

## E3 `Place` (internal)

`{ lat, lng }` and how it was found (`suburb` | `postcode` | `name`), or none. A point, not a locality id, because a
postcode alone is the centre of several suburbs (BR-P2).

## E4 `ClientWorkerCard` (unchanged shape)

`id, firstName, lastName, photo (string|null), role (first service, else "Support Worker"), bio ('' when none),
skills (distinct sub-category names of up to 5 services), location ("Suburb, ST" else "Australia"), isNdisCompliant
(any APPROVED verification requirement)`. Response: `{ success: true, data, pagination: { total, page, pageSize,
totalPages, hasNext, hasPrev } }`. The `cached` flag of today's Redis hit goes (the page does not read it; checked in
U2).

## E5 `PublicWorkerCard` (unchanged shape)

`id, firstName, lastName, bio (string|null), photo (string|null), city, state, services (distinct category names),
distanceKm? (1 decimal, only with a place)`. Same envelope as E4.

City and state in E4 and E5: the HOME locality's suburb and state, else the legacy columns (as the admin search).
