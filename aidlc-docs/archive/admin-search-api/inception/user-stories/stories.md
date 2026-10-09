# User Stories -- admin worker search on `apps/api`

**Sources:** `../requirements/requirements.md` (approved 2026-10-08); `../plans/story-generation-plan.md`
(Q1 A format, Q2 A personas, Q3 A journey-based with a system epic); `personas.md`.
**Format:** "As a / I want / so that" + Given/When/Then; each story tagged with persona, MoSCoW priority and
requirement ids; **PBT** names the property-based-testing property where one applies.

**Shared rules that hold for every story** (stated once):
- **R-AUTH:** every admin entry is reachable only with a valid token whose role is `ADMIN`; the pipeline answers
  401 or 403 before any handler runs (FR-ID-02/03).
- **R-POINT:** a worker's point is their HOME row's `point`; a suburb's point is its `au_localities` row's `point`;
  both are geography, distances are spheroid metres shown as km with one decimal (FR-GEO-02).
- **R-ACTIVE:** the search lists workers whose user is `ACTIVE`; the suspended list those whose user is
  `SUSPENDED` (FR-ADM-03, FR-ADM-07).
- **R-STRICT:** every query parameter is validated by the contract; an unknown parameter or a bad value is 400
  with the field named (NFR-05).
- **R-GATE:** nothing in E4 or E5 reaches production before it ran on staging through the checklist (CLAUDE.md).

**Epics**

| Epic | Title | Persona | Requirements | Stories |
|---|---|---|---|---|
| E1 | Find workers near a suburb | P2 Administrator (V1, V2) | FR-GEO-01..07, FR-ADM-02..04, FR-ADM-08, FR-UI-01/02 | 7 |
| E2 | Stay signed in to the api | P2 Administrator, S1 `apps/app` | FR-ID-01/03/04/06, FR-UI-03 | 4 |
| E3 | The other admin lists | P2 Administrator (V2) | FR-ADM-06/07, FR-UI-04 | 1 |
| E4 | The api behind the search | S4 `apps/api` | FR-ID-02/05, FR-GEO-01..05, FR-PLT-02/03, NFR-01..08, 10 | 4 |
| E5 | Cut over without a gap | S5 Operator | FR-UI-05, FR-PLT-01/04/05, NFR-13 | 1 |
| | | | **Total** | **17** |

**Amendment 2026-10-08:** every filter combines with the location in one query (D12); the document filters and the
filter-options entry are dropped (D14); no schema change (D13). US-AS-06 rewritten, US-AS-12 withdrawn.

---

## E1 -- Find workers near a suburb

### US-AS-01 -- Pick a suburb from our list and keep it
**Persona:** P2 Administrator (V1) · **Priority:** M · **Reqs:** FR-UI-01, FR-GEO-01, D5

As an administrator, I want to pick the suburb from the suggestions and have the search use exactly that suburb, so that "Parramatta" never means somewhere else.

- **Given** I type two or more characters in the suburb box, **when** suggestions appear (from our own suburb table, as today), **then** picking one fills the box with "Suburb, ST postcode" and keeps that suburb's id behind it.
- **Given** I typed text and did not pick a suggestion, **when** I apply the filters, **then** no suburb is set, "Within" stays disabled, and the text is not sent to the api; the name/mobile search box is the only free text.
- **Given** a suburb is picked, **then** the "Within" dropdown becomes enabled with its options Any distance, 5, 10, 20, 50 km.
- **Given** I reload the page or share its URL, **then** the suburb (its id and label) and the distance are restored from the URL.
- **Given** I clear the suburb, **then** "Within" resets to Any distance and is disabled again.
- **PBT:** the page's filter state survives a round trip through the URL (filters -> URL -> filters), for any generated combination of filters including a suburb id and a distance (round-trip).

### US-AS-02 -- Workers within the chosen distance, nearest first
**Persona:** P2 Administrator (V1) · **Priority:** M · **Reqs:** FR-GEO-02, FR-GEO-03, FR-ADM-02, FR-ADM-04, D4

As an administrator matching a participant, I want "within 10 km" to return every active worker whose home suburb is within 10 km of the picked suburb, nearest first, with the distance shown, so that I can call the closest suitable people first.

- **Given** a suburb and a distance of X km, **when** I apply, **then** every active worker whose HOME point is within X km of the suburb's point (R-POINT) and who matches every other filter is in the results, and nobody else is.
- **Given** the results, **then** they are ordered by distance ascending, and each row shows the distance in km with one decimal.
- **Given** a worker whose distance is exactly X km, **then** they are included (within means at most).
- **Given** a worker placed in the picked suburb itself, **then** their distance is 0.0 km and they come first.
- **Given** a worker with no HOME row, **then** they are not in a distance search (US-AS-05 counts them).
- **Given** the other filters (US-AS-06), **then** they apply in addition: within 10 km AND speaks Mandarin AND has a vehicle.
- **PBT:** for generated Australian points and radii, the set returned by the database predicate equals the set a Haversine oracle computes, allowing a 0.5 % tolerance band at the boundary (oracle); the returned distances are non-decreasing down the page and across pages (invariant).

### US-AS-03 -- Any distance means any distance
**Persona:** P2 Administrator (V1) · **Priority:** M · **Reqs:** FR-GEO-04, FR-GEO-06, D6

As an administrator, I want "Any distance" with a suburb picked to show every placed worker nearest first, so that a rural search is not silently capped.

- **Given** a suburb and "Any distance", **when** I apply, **then** every active worker with a HOME row who matches the other filters is listed, nearest first, with the distance shown; there is no hidden 500 km cap.
- **Given** the same filters with no suburb, **then** the list is sorted by the chosen column (newest first by default) and no distance is shown.
- **Given** the total shown, **then** it equals the count of placed workers matching the filters.

### US-AS-04 -- Know what the distance measures
**Persona:** P2 Administrator (V1) · **Priority:** S · **Reqs:** FR-GEO-07, FR-ADM-04

As an administrator, I want to see that a distance is from the suburb's centre and what the worker's own travel radius is, so that I read 12.3 km as "about 12 km, suburb to suburb".

- **Given** a placed worker in the results, **then** the row carries their home suburb's label, the precision of their point (LOCALITY today) and their travel radius in km.
- **Given** a distance is shown, **then** the column header or a hint says it is measured between suburb centres.
- **Given** a worker's precision is ADDRESS (once onboarding writes one), **then** the hint changes accordingly; nothing else in this cycle depends on it.

### US-AS-05 -- Find workers whose suburb is not mapped
**Persona:** P2 Administrator (V2) · **Priority:** M · **Reqs:** FR-GEO-05, FR-UI-02, D7

As an administrator tidying the list, I want to know how many active workers have no mapped suburb and to list them, so that I can fix them and they start appearing in distance searches.

- **Given** any search, **then** the response and the page show "N active workers have no mapped suburb" where N counts the workers matching the non-location filters who have no HOME row.
- **Given** I follow that line, **when** the page applies "unmapped only", **then** exactly those N workers are listed, the suburb and distance controls are ignored for this list, and each row's existing suburb text (city, state, postcode as typed long ago) is shown so I can see what to fix.
- **Given** no suburb is picked, **then** unmapped workers appear in the normal list like everyone else.
- **Given** a suburb is picked, **then** unmapped workers never appear in that list.
- **Given** a worker's suburb gets fixed (today through onboarding, which the reconciler places within five minutes), **then** the count falls on the next search.
- **PBT:** for any generated population of placed and unplaced workers and any filters, placed-matching + unplaced-matching = all matching, and the unmapped list and the distance list are disjoint (invariant).

### US-AS-06 -- Every filter combines with the suburb and distance, and works as before
**Persona:** P2 Administrator (V1) · **Priority:** M · **Reqs:** FR-ADM-03 (amended), NFR-02, D12

As an administrator, I want gender, age, vehicle, worker type, type of support, languages, therapeutic sub-categories, experience and the name/mobile search to combine with the suburb and distance in one search, each meaning what it means today, so that "female workers with a vehicle within 10 km of Parramatta" is one list.

- **Given** Gender = Female, a suburb and 10 km, **when** I apply, **then** every row is a female active worker whose home suburb is within 10 km, nearest first; nobody who fails any one of the three is listed.
- **Given** any combination of the filters in the requirements table (FR-ADM-03), **then** every selected filter applies (AND), and within a multi-select the rule is today's: languages any of, experience all of, therapeutic sub-categories any of.
- **Given** any combination without a suburb, **when** the parity script runs it through today's route and the new entry on the same data, **then** the id sets and totals are identical.
- **Given** "Test Terson" in the search box, **then** first-name/last-name and last-name/first-name matches both work, as today.
- **Given** a value today's route ignores (for example `gender=all`), **then** the new entry treats it the same way (no filter), and the contract documents each default.
- **Given** the document filters that only the URL could set today, **then** they no longer exist: the entry rejects them as unknown parameters (R-STRICT), and the page no longer carries them.
- **PBT:** for any generated filter combination, the statement the registry builds contains one clause per active filter composed with AND, plus the location term when a suburb is given, and no clause is dropped or overwritten (invariant; oracle against today's registry for the non-location part).

### US-AS-07 -- Sort and page predictably
**Persona:** P2 Administrator (V1) · **Priority:** M · **Reqs:** FR-ADM-02, FR-ADM-08, FR-GEO-06

As an administrator, I want pages to be stable and complete, so that paging through 300 workers shows each once.

- **Given** a page size of 1 to 100, **then** pages partition the result set in order; a page past the end is empty with the correct `total` and `totalPages`.
- **Given** two workers at the same distance (or the same sort value), **then** their relative order is the same on every request (ties broken by id).
- **Given** `sortBy=distance` with no suburb, **then** the api answers 400 and the page does not offer it.
- **Given** a page size over 100 or a page below 1, **then** 400 (R-STRICT).
- **PBT:** for any generated result set and page size, concatenating all pages equals the full ordered list, with no duplicates and no gaps (invariant).

---

## E2 -- Stay signed in to the api

### US-AS-08 -- I never see the token
**Persona:** P2 Administrator, S1 `apps/app` · **Priority:** M · **Reqs:** FR-ID-01, FR-ID-04, NFR-03

As an administrator, I want the admin screens to talk to the api without any extra sign-in, so that the move is invisible to me.

- **Given** I am signed in as an admin and open the admin dashboard, **when** the page first needs the api, **then** the app obtains a token for the api from my session (a route of the app, no user action) and uses it for every call.
- **Given** the token is about to expire (its lifetime is at most 10 minutes), **then** the app fetches a new one before the next call; I notice nothing.
- **Given** a call answers 401 (the token expired during a long pause), **then** the app fetches a fresh token once and retries the call; only if that fails am I sent to sign in (US-AS-09).
- **Given** the token, **then** it travels only in the `Authorization` header, never in the URL, never in a cookie, never in the browser's storage beyond memory.
- **PBT:** for any sequence of calls and clock advances, the adapter never sends an expired token and never requests more than one new token per expiry (invariant, model-based).

### US-AS-09 -- When my session is gone I am sent to sign in
**Persona:** P2 Administrator · **Priority:** M · **Reqs:** FR-ID-06, FR-UI-03

As an administrator, I want a clear sign-in prompt when my session is no longer valid, so that I do not stare at an empty list.

- **Given** my app session has expired or I signed out in another tab, **when** the app tries to obtain a token, **then** the token route answers 401 and the page sends me to sign in, returning to the same URL afterwards.
- **Given** my account was suspended or my role changed, **then** the api refuses my calls within the token's lifetime at the latest, and the app behaves as above.
- **Given** I sign out, **then** the app stops minting tokens; a token already issued is honoured by the api only until its expiry, which the design records as the accepted lag.

### US-AS-10 -- Impersonating a worker does not open the admin api
**Persona:** P2 Administrator (impersonating) · **Priority:** M · **Reqs:** FR-ID-03, FR-ID-01

As an administrator impersonating a worker, I want the api to treat me as that worker, so that impersonation cannot widen what the worker could do.

- **Given** I am impersonating a worker, **when** the app mints a token, **then** the token carries the worker as subject, role `WORKER`, and me as the impersonator.
- **Given** such a token reaches an admin entry, **then** the api answers 403 and logs both ids.
- **Given** I end the impersonation, **then** the next token is mine again and the admin screens work.

### US-AS-11 -- Api trouble is a notice, not a blank screen
**Persona:** P2 Administrator · **Priority:** M · **Reqs:** FR-UI-03, NFR-08, NFR-11

As an administrator, I want a plain message when the api cannot answer, so that I know whether to wait or to report it.

- **Given** the api answers 429, **then** the page shows "Too many requests, try again in N seconds" using `Retry-After`, keeps the last results on screen, and retries by itself after that time.
- **Given** the api answers 503 or cannot be reached, **then** the page shows "The search service is unavailable right now" with a retry button and keeps the last results.
- **Given** the api answers 500 or a response that does not match the contract, **then** the page shows a generic error with the request id for support, and nothing about the cause.
- **Given** any of these, **then** nothing else in the admin area is affected (the detail pages, compliance and reports still work).

---

## E3 -- The other admin lists

### US-AS-12 -- (withdrawn 2026-10-08)
The filter options entry was dropped with the document filters (D14): the page fetched the options on every load
and never displayed them. The removal of that fetch is part of US-AS-18 (PR 3) and the route's deletion is in PR 4.

### US-AS-13 -- The impersonation picker and the suspended list
**Persona:** P2 Administrator (V2) · **Priority:** M · **Reqs:** FR-ADM-06, FR-ADM-07, FR-UI-04

As an administrator, I want the user picker and the suspended-workers list to work as today through the api, so that every admin list has one backend.

- **Given** I type two or more characters in the impersonation picker, **then** up to 50 users newest first match on email or any profile name, with the role filter, as today.
- **Given** the suspended list, **then** it pages workers whose user is `SUSPENDED`, most recently changed first, with today's columns.
- **Given** either list, **then** R-AUTH applies: a non-admin token is 403.

---

## E4 -- The api behind the search

### US-AS-14 -- Verify every token, refuse every doubt
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-ID-02, FR-ID-05, NFR-03, NFR-04

As the api, I want to accept only tokens my counterpart minted for me, recently, for a known role, so that no one else can call an admin entry.

- **Given** a request to a role-restricted entry, **when** it carries `Authorization: Bearer <token>`, **then** the api verifies the signature with the shared secret and the one allowed algorithm, the issuer, the audience, the expiry and not-before (with a small skew), and that the role is one of the contract's roles; on success the principal (user id, role, impersonator) reaches the pipeline's role check and the handler.
- **Given** a missing header, a malformed token, a wrong algorithm, a wrong issuer or audience, an expired or not-yet-valid token, a bad signature, or an unknown role, **then** 401 with the generic envelope; the reason is logged at warn with the entry id, never returned.
- **Given** a token in a query string or a cookie, **then** it is ignored (401).
- **Given** the secret is missing or shorter than 32 bytes at boot, **then** the service refuses to start and names the variable.
- **PBT:** for any generated valid claims, mint-then-verify yields the same principal (round-trip); for any single-field corruption (each claim, the signature, the algorithm header) verification fails (invariant); the verifier's decision does not depend on the order of claims (invariant).

### US-AS-15 -- Resolve the suburb and rank in one statement
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-GEO-01, FR-GEO-02, FR-GEO-03, FR-GEO-05, NFR-01, NFR-10

As the api, I want one parameterised statement to filter, rank by distance, count and page, so that the result is exact and the database does the geometry.

- **Given** a `localityId`, **when** the search runs, **then** the api loads that `au_localities` row (an unknown id is 400 `fields.localityId`) and uses its `point` as the search point.
- **Given** a radius, **then** the statement uses `ST_DWithin` on the geography points with the radius in metres, orders by `ST_Distance`, limits and offsets for the page, and returns the total and the unplaced count alongside; no coordinates are compared in application code.
- **Given** the statement on staging's production copy, **then** `EXPLAIN` shows the GiST index on `worker_locations.point` for the radius predicate, and the p95 over the checklist's searches is under 500 ms.
- **Given** a slow plan or a locked table, **then** the statement times out (design: at most 5 s) and the api answers 503, never holding the pool.
- **Given** any user input, **then** it reaches the statement only as a bound parameter (`$queryRawUnsafe` is forbidden).
- **PBT:** as US-AS-02's oracle, run in CI against PostGIS with generated workers and localities; pagination as US-AS-07's partition property.

### US-AS-16 -- Match the old route's results
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** NFR-02, FR-ADM-03

As the api, I want proof that the ported filters find what the old route found, so that the page can switch without a change in who appears.

- **Given** the parity script and a list of at least 20 filter combinations without a suburb, **when** it calls the old route on a preview and the new entry on staging against the same database, **then** it reports identical id sets and totals for each, and fails otherwise.
- **Given** combinations with a suburb, **then** it reports the differing ids and, for each, which known loss explains it (L1 geocode vs centroid, L2 silent fallback, L3 the 500 km cap, L4 legacy coordinates, L5 free text, L7 not applicable) or marks it unexplained; an unexplained difference blocks the switch.
- **Given** the report, **then** it is recorded in the construction notes before PR 3 merges.

### US-AS-17 -- Log who asked, limit how often, alert on abuse
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-ID-05, FR-PLT-02, NFR-06, NFR-07

As the api, I want every admin request attributed and bounded, so that misuse is visible and cheap.

- **Given** any admin request, **then** the request log carries the principal's user id, the impersonator if any, the entry id, the request id and the duration; personal fields and the `authorization` header are redacted.
- **Given** more than the per-user limit of requests in a minute (value decided at design) or the per-IP limit, **then** 429 with `Retry-After`, counted per user id, before the handler.
- **Given** 401 or 403 outcomes above the threshold in a 5-minute window on production, **then** the auth-failure policy emails support, with the policy applied by `apply-alerts.sh` and listed in the stage table.
- **Given** a search result, **then** its contents (names, mobiles, emails) never appear in logs.

---

## E5 -- Cut over without a gap

### US-AS-18 -- Api first, then the page, then the deletions
**Persona:** S5 Operator · **Priority:** M · **Reqs:** FR-PLT-01, FR-PLT-04, FR-PLT-05, FR-UI-05, NFR-13, D8

As the operator, I want each step to be a promote and each rollback a promote, so that no step can leave admins without a search.

- **Given** PR 1 (identity, api side) and PR 2 (admin, api side) are merged, **then** staging runs them and nothing changes for anyone: no caller uses the new entries yet; the old routes keep serving the dashboard.
- **Given** the token secret is set in Secret Manager for both stages and in Vercel's Production and Preview scopes **before** the promotion, **then** the promotion passes the staging checklist (health 200, a staging admin's token accepted, a tampered one 401, the four entries answering, `EXPLAIN`, the parity report) and the image runs on production.
- **Given** PR 3 (the page) on a preview against staging, **then** the full checklist incl. forced 401/429/503 passes; merging it switches the production dashboard to the api, whose image already serves the entries.
- **Given** a problem after PR 3, **then** a Vercel promote of the previous deployment restores the old routes, which still exist; after PR 4 (deletions) a rollback requires re-adding them, which is why PR 4 waits for the production verification.
- **Given** PR 3 is merged, **then** the page no longer calls the options endpoint and carries no document-filter state.
- **Given** PR 4 is merged, **then** the four routes (search, filters, users, inactive), `lib/worker-search.ts` and the admin Redis cache key are gone, the docs (`docs/admin/`, `docs/signup/03`, CLAUDE.md) describe the api path, and the state file's follow-up 1 names the remaining readers.

---

## Traceability

| Requirement | Stories |
|---|---|
| FR-ID-01..06 | US-AS-08, 09, 10, 14, 17 |
| FR-ADM-01 | US-AS-14, 18 (the entries exist and are role-restricted) |
| FR-ADM-02..04, 08 | US-AS-01, 02, 03, 04, 06, 07 |
| FR-ADM-06, 07 | US-AS-13 (FR-ADM-05 withdrawn) |
| FR-GEO-01..07 | US-AS-01, 02, 03, 04, 05, 07, 15 |
| FR-UI-01..05 | US-AS-01, 05, 06, 09, 11, 13, 18 |
| FR-PLT-01..05 | US-AS-15, 17, 18 |
| NFR-01..14 | US-AS-02, 08, 11, 14, 15, 16, 17, 18 |
| Verification protocol section 6 | steps 1-2: US-AS-14, 15, 16; step 3: US-AS-18; step 4: US-AS-08, 09, 11; step 5: US-AS-18 |

---

## Amendment 2026-10-08 -- instant repeats (D15-D17)

### US-AS-19 -- The same search again is instant
**Persona:** P2 Administrator (V1) · **Priority:** M · **Reqs:** FR-CACHE-01, FR-CACHE-03, FR-CACHE-04, NFR-15, NFR-17

As an administrator, I want a search I just ran to come back instantly when I run it again, so that flicking between my usual filters costs nothing.

- **Given** I ran a search less than a minute ago, **when** I run exactly the same filters again (same suburb, distance, filters, page), **then** the results appear at once from my browser's cache and no request leaves the page.
- **Given** the same search more than a minute later, **when** nothing changed on the server, **then** the page receives a 304 and keeps showing the results; the round trip is a few bytes.
- **Given** the page, **then** a line says the results may be up to a minute old, with a refresh button that always fetches fresh data.
- **Given** I suspend, reactivate or publish a worker, **then** the next list I see is fetched fresh, so my change is visible immediately.
- **Given** the URL of a search, **then** it is the same URL for the same filters whatever order I set them in (sorted, defaulted), so the cache can hit.
- **PBT:** for any generated filter state, building the URL twice (and after any reordering of the inputs) yields the same string, and parsing it back yields the same state (round-trip, invariant).

### US-AS-20 -- Serve repeats from memory
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-CACHE-01, FR-CACHE-02, NFR-15, NFR-16

As the api, I want to answer a repeated search from memory and tell the browser how long it may keep the answer, so that the database sees each distinct question at most once a minute per instance.

- **Given** a search response, **then** it carries `Cache-Control: private, max-age=60`, `Vary: Authorization` and an `ETag` computed from the body; a public entry never carries `private` caching and an admin entry never carries `public` caching (the contract check refuses both).
- **Given** a request with `If-None-Match` equal to the current body's `ETag`, **then** 304 with no body.
- **Given** the same normalised query from any admin within 60 s, **then** the memoised body is returned and no statement runs; the memo holds at most 500 entries and evicts the least recently used.
- **Given** a request with `Cache-Control: no-cache`, **then** the memo is bypassed, the statement runs, and the fresh body replaces the memo entry.
- **Given** a 4xx or 5xx, **then** nothing is memoised and no cache headers are added.
- **Given** a new deploy, **then** the memo starts empty; two instances may hold different entries for up to 60 s.
- **PBT:** model-based: for any sequence of (query, time) requests against the memo, the body returned equals what the database would have returned at the most recent fill within 60 s, and the memo never exceeds its bound (invariant, oracle).
