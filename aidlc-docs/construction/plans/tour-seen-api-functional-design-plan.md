# U1 `tour-seen-api`: functional design plan (2026-10-21)

Unit (execution plan): one "tour seen" timestamp per worker, with its own read and save in the worker contract; the
profile read is not changed (OI-1, settled: `profileSchema` is strict). Branch `feat/tour-seen-api` from `main`.
Requirements: FR-SEEN-01..03, NFR-01..05, NFR-08, NFR-10 (`inception/requirements/requirements.md`).

What `main` already has, read for this plan:
- `packages/api-contract/src/worker.contract.ts`: `workerRead()` (roles WORKER, 120/min per user, 300/min per IP,
  **private cache 60 s by default**) and `workerWrite(audit)` (60/min per user, 120/min per IP, a mandatory audit
  action). Every section write uses `PROFILE_UPDATE` with the section in the audit row's metadata.
- A worker without a `worker_profiles` row gets 404 from the profile read.
- Without `privateCacheSeconds` the api answers `cache-control: no-store` (`apps/api/src/app.ts`).
- Migrations are named `YYYYMMDDHHMMSS_<unit>_<what>` with a header comment and a `down.sql`
  (`20261016120000_u5d_users_password_changed_at`).

## Plan

- [ ] 1. Domain entity: the column (table, name, type, null meaning) -- Q1
- [ ] 2. The two entries: paths, methods, request and response shapes, status codes -- Q2, Q4
- [ ] 3. Business rules: first time kept, server clock, ownership, a worker without a profile -- Q4
- [ ] 4. The audit row -- Q3
- [ ] 5. Caching of the read -- Q5
- [ ] 6. Error cases and what the app does with each (NFR-01)
- [ ] 7. Property candidates for NFR Design (idempotency; another worker's token never changes this worker's value)
- [ ] 8. Artifacts: `construction/tour-seen-api/functional-design/{domain-entities,business-rules,business-logic-model}.md`

## Questions

Fill in each `[Answer]:` with a letter, or X and your own words.

## Question 1
Where should the "tour seen" time be stored?

A) On the worker's profile row (`worker_profiles.tourSeenAt`): it is worker data, and every worker entry already finds
the profile from the sign-in (recommended)

B) On the account row (`users.tourSeenAt`), next to the other account settings such as the password change time

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
The two entries' paths:

A) `GET /v1/worker/tour` answers `{ "seenAt": <time or null> }`; `PUT /v1/worker/tour/seen` (no body) saves it and
answers the same shape (recommended: matches the worker area's PUT-per-thing style)

B) `GET /v1/worker/onboarding` and `PUT /v1/worker/onboarding/tour`, leaving room for other onboarding flags later

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
Every write in the worker area writes an audit row. Which action should the save use?

A) The existing `PROFILE_UPDATE`, with `"section": "tour"` in the row's details, as every profile write does: no
change to the database's list of actions (recommended)

B) A new action `TOUR_SEEN`: clearer in the audit list, but it adds a value to the database's action list (a second
migration step)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 4
A worker account with no profile row (rare: an account the sign-up did not finish). What should the entries do?

A) Answer 404, as the profile read does; the app treats it as "no tour" and shows nothing (recommended)

B) The read answers `{ "seenAt": null }` and the save answers 404

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 5
Other worker reads may be kept by the browser for 60 seconds. For this one:

A) Never kept (`no-store`): after Not now or Finish, a reload never shows the card again; the read is tiny and only on
the dashboard home (recommended)

B) Kept 60 seconds like the other worker reads; the app clears it after a save

X) Other (please describe after [Answer]: tag below)

[Answer]: 
