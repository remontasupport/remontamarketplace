# Requirements: worker search on worker_locations (cycle search-locations, 2026-10-28)

**Request (user, verbatim):** "let's do this" (option 3 / follow-up 1: "move the client search and the public list to
`worker_locations` + PostGIS, then stop the dual write, then drop the columns").

Answers: `requirement-verification-questions.md`: Q1 A, Q2 A, Q3 A, Q4 A, **Q5 A ("TAKE NOTE OF THIS")**, Q6 A,
Q7 A, Q8 A.

## Intent analysis

| | |
|---|---|
| Request type | Migration (data source of two reads) + refactoring (move to `apps/api`) |
| Scope | Multiple components: `packages/api-contract`, `apps/api`, `apps/app` (client dashboard), `apps/web` (`/search`) |
| Complexity | Moderate: behaviour must be preserved; two callers across two apps; a public endpoint on the api |
| Depth | Standard |

## Scope boundary (Q5 A: take note)

**This cycle moves the two searches and nothing else.** It does **not** stop the api's dual write, does **not**
change any display reader of the legacy columns, does **not** touch the reconciler, and drops **no column**. Those
become a **later cycle**, opened only after the new searches have run in production for a while. Recorded as
follow-up 39 in the state file, so the remainder of follow-up 1 is not lost. Every legacy column stays written and
readable at this cycle's close.

## Today (inventory `../search-locations-inventory.md`, `main` `832ce43`)

- `GET /api/client/workers` (apps/app): signed-in CLIENT/COORDINATOR; workers whose account is ACTIVE with a first and
  last name (not `isActivated`: user 2026-10-23); keyword search (stop words, ≤ 5 tokens, service tokens vs text
  tokens), `services` filter, `location` + `within` (default 50 km). With no search, place or service: only workers
  with an introduction. No place: newest first. Place: nearest first. A place that cannot be geocoded falls back to the
  search without a place. Card: name, photo, primary service, skills, bio, `"city, state"` (else "Australia"), NDIS
  compliant (any APPROVED requirement). Redis 5 min.
- `GET /api/public/workers` (apps/app, called by `apps/web` through its own `/api/public/workers` proxy and the
  `/search` page, server side, `REMONTA_API_URL`): `LISTABLE_WORKER` (activated, ACTIVE); `typeOfSupport` slug; `location`
  + `within` (default 500 km when absent or `none`); newest first, or nearest first with `distanceKm`. Card: name, bio,
  photo, city, state, services. Redis 60 s + `s-maxage=60`.
- Both search bars fill `location` from the app's `/api/suburbs` (a static list: name, postcode, state), as
  `"Suburb STATE postcode"`; both geocode it with Google.

## Functional requirements

- **FR-1 Two api entries.** `GET /v1/client/workers` (CLIENT or COORDINATOR, the bearer token minted at
  `/api/auth/api-token`) and `GET /v1/public/workers` (public), declared in the contract and bound one handler each
  (Q1 A). When both callers have moved, the two Next routes are removed.
- **FR-2 The place.** `location` is matched on the server to one `au_localities` row (suburb + state + postcode from the
  autocomplete text; a looser match for old links and the area pages). No Google geocoding (Q2 A). Text that matches no
  suburb behaves as today's failed geocode: the search runs without a place.
- **FR-3 Distance.** Workers with a HOME row within `within` km of the matched suburb's centre (PostGIS `ST_DWithin`
  on `worker_locations.point`), nearest first by `ST_Distance`; counting and paging in SQL. The searcher's radius only
  (Q4 A). Defaults kept: 50 km (client), 500 km (public).
- **FR-4 Workers without a HOME row** do not appear in a search with a place (Q3 A); they still appear without one.
  Follow-up 17 places them.
- **FR-5 Everything else unchanged** (Q6 A): the eligibility rules, the keyword search and its token rules, the service
  filters, the "has an introduction" default listing, the order without a place, the page sizes and limits, the card
  fields and the response shapes the two pages read. City and state on the cards come from the HOME locality, falling
  back to the legacy columns (as the admin search does).
- **FR-6 Out of scope:** `/api/contractors`, `/api/contractors-by-area` (the jobs database, Q7 A); the suburb
  autocomplete's source; the dual write, display readers, reconciler and column drop (Q5 A).

## Non-functional requirements

- **NFR-1 Preview before production** (CLAUDE.md): the api entries go to staging first and are promoted before the app
  and web changes that call them merge (follow-up 32's order).
- **NFR-2 Equivalence check.** Before the switch, the old and new searches are compared on the staging copy for a set
  of suburbs and radii: same workers (apart from FR-4's), same order where distances differ by more than rounding.
- **NFR-3 Performance.** p95 at or under today's routes; no full load of the candidates into memory.
- **NFR-4 Caching and limits.** The public entry: a per-IP rate limit, cacheable 60 s; the client entry: a per-user rate
  limit, private caching. No Redis dependency on the api.
- **NFR-5 Security baseline (blocking):** the public entry returns only today's public card fields (no ids beyond the
  worker id, no coordinates, no contact data); input validated by the contract schema; the client entry audited per
  the baseline's rules for reads.
- **NFR-6 Resiliency baseline:** a failure of the place match degrades to the search without a place, never a 500.
- **NFR-7 Property-based tests (full):** the place matcher, the token rules carried over, and paging (no worker twice or
  missed across pages).

## Extensions

Security Baseline (blocking), Resiliency Baseline (99.9 %, RTO ≤ 30 min, RPO ≤ 5 min), Property-Based Testing (full):
kept (Q8 A).
