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

---

## Addendum (2026-10-29): follow-up 39 stage 1, the legacy location columns

Scope extended by the user 2026-10-28 ("do not close this, you can do it here"). Map:
`../legacy-columns-inventory.md`; answers: `legacy-columns-questions.md` (1 A, 2 B then follow-up A, 3 A, 4 A, 5 C).
Columns: `worker_profiles.location, city, state, postalCode, latitude, longitude`. **No column is dropped** (stage 2,
later, after a soak and the user's check of outside readers).

- **FR-7 One place rule for every reader.** A worker's place is their HOME `worker_locations` row's locality (suburb,
  state, postcode; label "Suburb, ST 1234"); with no HOME row, the legacy columns as today (Q1 A). Readers: the
  assigned-worker cards (by-ids), the profile preview, the shared profile page, the admin contractor page and PDF
  (apps/app); `GET /v1/worker/profile`, the admin users / suspended lists and the admin worker search's row (apps/api).
  The rule is written once and shared (CS-1).
- **FR-8 Completion.** The "location" part of account details is met when the worker has a HOME row **or**
  `city`, `state`, `postalCode` are all non-empty (Q2 follow-up A): today's result for every existing worker; a new
  worker completes once they pick a suburb.
- **FR-9 The reconciler only creates.** It places a HOME row from the legacy columns for a worker who has none; it
  never moves an existing one (Q3 A; finding F1). Its `moved` outcome goes.
- **FR-10 The double write stops.** Sign-up and the service-area save write `worker_locations` only; the six columns
  are no longer written (frozen at today's values for workers who move; empty for new workers).
- **FR-11 Order (Q4 A, F1, F4).** U3 `legacy-readers-app` (FR-7, apps/app) merges and is live first. U4
  `legacy-readers-api` (FR-7 api readers, FR-8, FR-9, FR-10) goes to staging after U3, and is promoted after the
  preview checklist; within U4 the reconciler stops moving before or with the write stopping (one image).
- **NFR-8 Reversible.** Rollback of U4 = the previous image: it resumes the double write; workers who moved in between
  keep the right HOME row (the old image's reconciler would move them back to the stale columns -- noted for the
  rollback: roll back only within the soak, and re-save is the fix for any moved worker).
- **NFR-9 Equivalence.** Before U4's promotion, on the staging copy: every reader shows the same place as today for
  every worker whose HOME row matches the legacy columns (all placed workers today), and the unplaced keep their
  legacy text.
