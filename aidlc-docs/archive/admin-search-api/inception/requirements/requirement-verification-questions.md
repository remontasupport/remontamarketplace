# Requirements Verification Questions -- admin worker search on `apps/api`

Cycle started 2026-10-08. Goal, in your words: "create a new API backend for the admin dashboard, specifically the
search API's. With the new schema and structure of the database, analyze how can we return accurate results
especially on the radius".

Please answer each question by writing the letter after the `[Answer]:` tag. Choose the last option (Other) and
describe if nothing fits. Say "done" when finished. The facts behind the questions are in
`admin-search-inventory.md` next to this file; the radius losses it names (L1-L8) are referenced below.

**Assumptions I will make unless you say otherwise:** every non-location filter of today's admin search (gender,
age, vehicle, worker type, services, languages, text, therapeutic sub-categories, document categories / statuses /
types, experience) keeps exactly its current meaning; the response keeps the same shape (`data`, `pagination`,
`appliedFilters`) so the admin page changes as little as possible; the page size stays at most 100; the distance is
computed in PostGIS (`ST_DWithin` / `ST_Distance` on the geography `point`, spheroid metres) in one indexed query that
also counts and pages, so no two-pass JavaScript; the search point is a row of `au_localities`; the count and the
page are always consistent; the result still carries each worker's distance in km; the `ADMIN` role only (the
database has no `SUPER_ADMIN`); the admin search is proven against staging data with a side-by-side comparison of
the old and new results for the same filters before the page switches over.

## Question 1
Reverse Engineering. `admin-search-inventory.md` was written from this session's reading of the admin search path
(page, routes, filter registry, geocoding, the S1 tables, the api's pipeline and authentication). Is that enough as
the cycle's picture of the code?

A) **Yes** -- the targeted inventory is the reverse-engineering artifact; the archives stay the reference for the
rest (the previous cycles' approach).

B) **No** -- run a full reverse-engineering pass over `apps/api`, `packages/api-contract`, `packages/form-engine`
and `infra/` first.

C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2
Which admin endpoints move to `apps/api` in this cycle? The search screen calls two; the other "search-like" admin
routes are listed in the inventory section 1.

A) **The search and its filter options**: `GET /api/admin/contractors` (the list with every filter and the radius)
and `GET /api/admin/filters` (the option lists and counts the screen loads). Recommended: one screen, one PR pair,
rollback stays a Vercel promote.

B) **A plus the two other admin lists**: `GET /api/admin/users` (the impersonation picker) and
`GET /api/admin/contractors/inactive` (suspended workers). Same machinery, two more contract entries and handlers.

C) **The search only** (`GET /api/admin/contractors`); the filter options stay on the Next.js route for now.

D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
Authentication on the api. Today the api denies every non-public entry (`DenyAllAuthenticator`); the admin's NextAuth
cookie is never sent to the api's `run.app` origin. Something has to carry the admin's identity (inventory section 4).

A) **A short-lived signed token** (FR-ID-02 from S1): `apps/app` adds one route that turns the admin's session into a
JWT of a few minutes (subject, role, audience, issuer, expiry, impersonator if any) signed with a secret both sides
hold in Secret Manager / Vercel; the admin page calls the api directly through the contract client with an
`Authorization` header; the api's authenticator verifies it and the pipeline applies roles and per-user limits.
Recommended: it is the identity foundation every later authenticated entry reuses. Suspension takes effect within
the token's lifetime.

B) **The app's route proxies**: the existing Next.js route keeps the session check and calls the api server-to-server
with a service credential, forwarding the admin's id. No browser or CORS change, smaller; but a Next.js route per
endpoint stays and the token mechanism is still to build later.

C) **A plus immediate revocation** (FR-ID-03): a session record or version the api checks on every request so
logout and suspension cut access immediately. Largest; touches sign-in and the suspend route.

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
What should "within X km" mean? Today it is proximity: the worker's point within X km of the search point (L7 says
the worker's own travel radius is never read; it is 50 km for everyone until someone edits it).

A) **Proximity, as today**, but computed from `worker_locations` with PostGIS: the worker's HOME point within X km of
the chosen suburb's centroid, sorted nearest first, each result showing the distance. Recommended as the minimum.

B) **Proximity plus a "can travel here" filter**: A, and one extra optional filter that keeps only workers whose own
`travelRadiusKm` reaches the chosen suburb (`ST_DWithin(point, search, travelRadiusKm * 1000)`). One more checkbox on
the page; the data already exists.

C) **Coverage only**: replace "within" by the worker's own travel radius (the admin picks a suburb and sees who would
travel to it, nearest first). Changes what the admin's dropdown means.

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
The search point (L1, L2, L5). Today the picked suburb becomes a string that Google geocodes; a miss silently drops
the radius; free text like "Queensland" is accepted.

A) **A locality from our own table, by id.** The suburb box must pick from the autocomplete (it already reads
`au_localities`); the request carries `localityId`, the api uses that row's centroid, the same source every worker is
placed by. No Google call in the search, no silent fallback, a clear error if the id is unknown or retired. Free text
no longer reaches the distance filter (it can still be used by the name/mobile text search). Recommended.

B) **Keep free text with Google geocoding**, moved into the api (needs the Google key in the api, an outbound call,
and a decision on what to do on a miss: fail loudly rather than silently).

C) Other (please describe after [Answer]: tag below)

[Answer]: i STILL WANT A FREE TEXT BUT WILL USE OUR WORKER LOCATIONS

## Question 6
"Any distance" with a suburb chosen (L3). Today it is a hidden 500 km radius.

A) **No radius at all**: every placed worker, nearest first, with the distance shown. Recommended: "any" means any.

B) **Keep a cap**, stated in the response's `appliedFilters` (name the number after the tag if not 500 km).

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
Workers without a `worker_locations` row (the 70 the backfill could not match, plus any since). Today they appear in
a distance search if their legacy coordinates happen to exist, wherever Google put them (L4).

A) **Excluded from any distance search, and counted**: the response says how many active workers have no mapped
location, and a filter (`unplaced`) lists them so an admin can fix their suburb. Recommended: a wrong point is
worse than an honest gap, and it stops the admin search reading the legacy columns at all.

B) **Fall back to the legacy coordinates** for those rows during the transition (keeps today's behaviour for them,
keeps the admin search reading `worker_profiles.latitude/longitude` for a subset).

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
Cut-over of the admin page. The page calls the Next.js route today.

A) **The page switches to the api in its own PR** after the api PR is on staging and the side-by-side comparison
passes; the old Next.js route is deleted in a later PR once production is verified (rollback = Vercel promote).
Recommended.

B) **Switch and delete in the same PR** (smaller history, no rollback by promote for the route).

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9
The other readers of the legacy location columns (inventory section 5: the client/coordinator find-worker and the
public marketing feed share the same geocode + Haversine code). Follow-up 1 names them.

A) **Admin only in this cycle.** The api's dual write of the legacy columns continues; the client and public readers
are a later cycle on the same contract entry pattern. Recommended: one reader per cycle, the admin one proves the
query.

B) **Admin now, and the client find-worker in the same cycle** as a second unit (it needs the CLIENT and
COORDINATOR roles on the token too, and its own semantics review: it does not filter published or verified workers
today).

C) **All three readers**, so the dual write can stop and the columns be dropped at the end of the cycle (largest;
the public feed is unauthenticated and uncapped today).

D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 10: Security Extensions
Should security extension rules be enforced for this project?

A) Yes -- enforce all SECURITY rules as blocking constraints (recommended for production-grade applications; the
previous cycles' choice)

B) No -- skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 11: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building
resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review
guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and
recoverability, covering 15 practice areas across business goals, change management, observability, high
availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or
guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions
early; it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate, not a
finished, production-certified result.

A) Yes -- apply the resiliency baseline as directional best practices and design-time guidance (the previous
cycles' choice, with S1's targets carried forward: SLA 99.9 %, RTO 30 min, RPO 5 min, single region)

B) No -- skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid
iteration matters more than reliability)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 12: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes -- enforce all PBT rules as blocking constraints (recommended for projects with business logic, data
transformations, serialization, or stateful components; the previous cycles' choice. Here: the filter composition,
the distance query against generated points, and the token round-trip)

B) Partial -- enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with
limited algorithmic complexity)

C) No -- skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers
with no significant business logic)

D) Other (please describe after [Answer]: tag below)

[Answer]: A
