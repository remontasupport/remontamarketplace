# Requirements -- admin worker search on `apps/api`

**Depth:** Comprehensive. The cycle adds the first authenticated path to the api (an identity foundation every later
endpoint reuses), moves four admin endpoints that return personal data, and writes the first PostGIS query; three
blocking extensions are on. **Sources:** `cycle-start-questions.md` (the goal), `admin-search-inventory.md`,
`reverse-engineering/` (2026-10-08), `requirement-verification-questions.md` (Q1-Q12) and
`requirement-clarification-questions.md` (CQ1 withdrew the free-text location: "use the new localities we have").

## 1. Intent analysis

| | |
|---|---|
| **User request** | "Let us create a new API backend for the admin dashboard, specifically the search API's. With the new schema and structure of the database, analyze how can we return accurate results especially on the radius" |
| **Request type** | Migration + enhancement: the admin dashboard's four list/search endpoints move from Next.js route handlers in `apps/app` to contract entries on `apps/api`; the radius search is rebuilt on `worker_locations` + PostGIS; authentication of admins on the api is built for the first time |
| **Scope estimate** | Multiple components: `packages/api-contract` (a new `admin` area), `apps/api` (authenticator, admin module, the geo query, config), `apps/app` (token route, the admin page onto the contract client, the suburb box sends an id, four routes deleted later), `infra/` (a new secret per stage, an auth-failure alert), `packages/db` (no migration expected), docs, CI |
| **Complexity estimate** | Complex: a cross-site authentication mechanism, parameterised SQL mixing a 15-filter registry with geography predicates, a result-parity cut-over of a live admin screen, and the first per-user rate limits |

## 2. Decisions

| # | Decision | Source |
|---|---|---|
| D1 | A full reverse-engineering pass over the four post-S1 areas is the cycle's picture of the code; the S1 archive and `.brd` cover the rest | Q1 B |
| D2 | **Four endpoints move**: the worker search, its filter options, the user picker (impersonation) and the suspended-workers list. The AI search webhook pass-through and the detail/PDF/status routes stay in `apps/app` | Q2 B |
| D3 | **Authentication = a short-lived signed token** minted by `apps/app` from the NextAuth session and verified by the api on every request (S1 FR-ID-02). No server-side session record in this cycle: suspension, logout and role change take effect within the token's lifetime | Q3 A |
| D4 | **"Within X km" means proximity**: the worker's HOME point within X km of the chosen suburb's centroid, nearest first, distance shown. The worker's own travel radius is not a filter in this cycle | Q4 A |
| D5 | **The search point is a locality of ours, by id.** The admin picks from the autocomplete (already backed by `au_localities`); the request carries `localityId`; no Google call, no free text in the distance path | Q5 A, confirmed by CQ1 |
| D6 | **"Any distance" with a suburb = no radius**: every placed worker, nearest first | Q6 A |
| D7 | **Unplaced workers are excluded from distance searches and counted**; a filter lists them for fixing. The admin search never reads `worker_profiles.latitude/longitude` | Q7 A |
| D8 | **Cut-over in steps**: api first (staging, then promoted), the page in its own PR, the old routes deleted in a later PR after production verification | Q8 A |
| D9 | **Admin only.** The client/coordinator and public searches stay; the api's legacy-column dual write continues | Q9 A |
| D10 | Extensions: Security baseline (blocking), Resiliency baseline (blocking), Property-Based Testing (full) | Q10-Q12 A |
| D11 | Assumptions accepted by silence (questions preamble): every non-location filter keeps its meaning; the response keeps `data` / `pagination` / `appliedFilters`; page size at most 100; distance computed in PostGIS in one statement that also counts and pages; `ADMIN` role only; a side-by-side comparison of old and new results on staging before the page switches | preamble |

## 3. Functional requirements

### 3.1 Identity on the api (FR-ID)

| ID | Requirement | Pri |
|---|---|---|
| FR-ID-01 | **Token minting.** `apps/app` exposes one route for signed-in users that returns a token for the api: subject = user id, role, impersonator (if the session is an impersonation), issuer `apps/app`'s identifier, audience the api's identifier, issued-at, expiry **at most 10 minutes** (5 proposed), a unique id. Signed with a **dedicated secret** (new; never `NEXTAUTH_SECRET`) held in Vercel (Production and Preview scopes, different values) and in Secret Manager `remonta-api[-staging]-<NAME>`. The route needs an active session and answers 401 otherwise; it is rate-limited like the app's other session routes | Must |
| FR-ID-02 | **Token verification.** The api replaces `DenyAllAuthenticator` with an authenticator that reads `Authorization: Bearer`, verifies signature, algorithm (one allowed), issuer, audience, expiry and not-before with a small clock skew, requires a role in the contract's `ROLES`, and returns the `Principal` (user id, role, impersonator). Anything else is 401 with the generic envelope; the reason is logged, never returned. Tokens are never accepted from a query string or a cookie. The secret is required at boot (`loadConfig`) | Must |
| FR-ID-03 | **Role policy.** The four admin entries declare `access: {roles: ['ADMIN']}`; the pipeline's existing 403 applies. A session that is impersonating a worker carries the worker's role and is refused on admin entries | Must |
| FR-ID-04 | **Client adapter.** `apps/app` gets one adapter that obtains a token, caches it until shortly before expiry, passes it as the `authorization` header to `createClient`, and on a 401 refreshes once and retries. No hand-written `fetch` to the api (Semgrep rule) | Must |
| FR-ID-05 | **Per-user limits and logging.** Admin entries carry per-user and per-IP rate limits; every admin request is logged with the principal's user id (the impersonator too) and the request id; 401/403 outcomes are logged at warn with the entry id | Must |
| FR-ID-06 | **Revocation lag is explicit.** The design documents that suspension, logout and role change reach the api within the token lifetime; the app stops minting at logout; `requireRole` in the app still gates the page itself | Must |

### 3.2 The admin contract (FR-ADM)

| ID | Requirement | Pri |
|---|---|---|
| FR-ADM-01 | A new area `admin` in `packages/api-contract` with four GET entries: **search workers**, **filter options**, **list users**, **list suspended workers**. Each declares `meta()` fully (roles, no bot, per-user + per-IP limits, `maxBodyKb` 1, no `cacheSeconds`: personal data is `no-store`). None is in `public-endpoints.json`. `openapi.json` is regenerated | Must |
| FR-ADM-02 | **Search workers** takes, as a strict query: `page`, `pageSize` (1-100), `sortBy` (createdAt, firstName, lastName, city, state, distance), `sortOrder`, `search` (name or mobile, at most 100 chars), `localityId` (positive int), `withinKm` (5, 10, 20, 50; only with `localityId`), `unplaced` (boolean), and the existing filters: `typeOfSupport`, `gender`, `hasVehicle`, `workerType`, `age`, `languages`, `therapeuticSubcategories`, `documentCategories`, `documentStatuses`, `requirementTypes`, `experienceWith` (arrays as comma-separated or repeated params; decided at design). Unknown parameters are 400 | Must |
| FR-ADM-03 | **Every non-location filter keeps exactly today's meaning** (inventory section 1: Title Case normalisation, the kebab-case service map, date-of-birth with the `age` fallback, the two language sources, the two-word name forms, `experienceWith` = all selected, the base condition `user.status = ACTIVE`). The filter registry is ported as data, one entry per filter, composed with AND | Must |
| FR-ADM-04 | **The response** is `{data, pagination{total, page, pageSize, totalPages, hasNext, hasPrev}, appliedFilters, unplacedCount}`. Each row carries what today's row carries (id, userId, names, mobile, email, gender, age computed from date of birth, languages with the same fallback, services, city/state/postalCode, photos, experience, introduction, createdAt, updatedAt, isActive) plus, when a locality was given, `distanceKm` (one decimal), and for every placed worker `location{localityLabel, precision, travelRadiusKm}`. `appliedFilters` names the locality used (`{id, label}`) | Must |
| FR-ADM-05 | **Filter options** returns what `/api/admin/filters` returns today (document categories, statuses, requirement types from the `documents` table, the five submission counts) with the same labels | Must |
| FR-ADM-06 | **List users** takes `search` (2-100 chars) and `role`; returns up to 50 users newest first with the flattened profile fields, as today | Must |
| FR-ADM-07 | **List suspended workers** is the paged list of profiles whose user is `SUSPENDED`, newest change first, with today's fields | Must |
| FR-ADM-08 | **Sorting** is stable: ties broken by id; the same request answers the same page twice | Must |

### 3.3 The radius (FR-GEO)

| ID | Requirement | Pri |
|---|---|---|
| FR-GEO-01 | With `localityId` the api loads that `au_localities` row (any existing row; a retired one still has a point) and uses **its `point`** as the search point. An unknown id is 400 with `fields.localityId` | Must |
| FR-GEO-02 | **Proximity** = `ST_DWithin(worker HOME point, locality point, withinKm × 1000)` on the geography type (spheroid metres), and the distance returned = `ST_Distance` of the same two points. No bounding box in application code, no Haversine, no post-filtering in JavaScript | Must |
| FR-GEO-03 | **One statement** returns the page and the total: filters, the geo predicate, the sort, `LIMIT/OFFSET` and the count run in the database, parameterised (tagged-template `$queryRaw` or `Prisma.sql` fragments; `$queryRawUnsafe` is forbidden by Semgrep). The GiST index on `worker_locations.point` is used (verified with `EXPLAIN` on staging) | Must |
| FR-GEO-04 | `localityId` without `withinKm` = **no radius**: every placed worker that matches the other filters, nearest first, with the distance. `withinKm` without `localityId` = 400 | Must |
| FR-GEO-05 | **Unplaced workers** (no HOME row) are excluded whenever `localityId` is given; `unplacedCount` = the number of workers matching the other filters with no HOME row, present in every search response; `unplaced=true` lists exactly those workers (ignoring `localityId`/`withinKm`) so an admin can fix their suburb. Without `localityId`, unplaced workers are listed like everyone else | Must |
| FR-GEO-06 | The default sort with a locality is `distance`; without one it is `createdAt` desc as today; `sortBy=distance` without a locality is 400 | Must |
| FR-GEO-07 | **Precision is visible, not hidden.** Each placed row says `precision` (LOCALITY today) so the UI can label the distance "from the suburb centre"; the design records that a locality's centroid is the worker's point until onboarding writes an address-precision row | Should |

### 3.4 The admin page (FR-UI)

| ID | Requirement | Pri |
|---|---|---|
| FR-UI-01 | The suburb box keeps its autocomplete and now **keeps the locality id** of the pick (the `/api/suburbs` response already carries it); the URL state carries `localityId` (and the label for display) instead of the free string; typing without picking does not set a locality, and the "Within" select is disabled until one is picked | Must |
| FR-UI-02 | The page calls the four entries through the contract client with the token adapter; the result rendering is unchanged except: the distance column shows `distanceKm`, a line shows "N active workers have no mapped suburb" with a link that applies `unplaced=true`, and `appliedFilters` shows the locality label used | Must |
| FR-UI-03 | Errors from the api (401 after a refresh, 403, 429 with `retry-after`, 503) are shown as a notice; a 401 sends the admin to sign in | Must |
| FR-UI-04 | The impersonation page and the suspended list use the new entries the same way | Must |
| FR-UI-05 | After production verification a later PR deletes `api/admin/contractors/route.ts`, `api/admin/filters/route.ts`, `api/admin/users/route.ts`, `api/admin/contractors/inactive/route.ts`, the zero-caller `lib/worker-search.ts`, and the `admin:contractors:v1:*` Redis cache usage | Must |

### 3.5 Platform, infrastructure, documentation (FR-PLT)

| ID | Requirement | Pri |
|---|---|---|
| FR-PLT-01 | `infra/lib/stages.ts` adds the token secret to `SECRET_NAMES`; `bootstrap.sh` creates it; the generated YAML mounts it; `README.md` says how to set it on both sides. The deploy gate (`render:check`) stays | Must |
| FR-PLT-02 | A log-based alert for repeated authentication failures on the api (401/403 above a threshold per 5 minutes, production) joins the monitoring set, applied with `apply-alerts.sh` | Must |
| FR-PLT-03 | CI's `API Quality` job already runs PostGIS; the new geo tests run there against seeded localities and generated workers; without `TEST_DATABASE_URL` they skip and say so | Must |
| FR-PLT-04 | Documentation in the same PRs: a `docs/admin/` reference for the four entries (parameters, responses, errors, limits, the token), CLAUDE.md's reach line (the app now calls the api for the admin lists), `docs/signup/03-data-model.md`'s note on who reads `worker_locations` | Must |
| FR-PLT-05 | The state file's follow-up 1 is updated: the admin reader has moved; the client and public readers remain, and the dual write stays until they move | Must |

## 4. Non-functional requirements

| ID | Requirement | Rule |
|---|---|---|
| NFR-01 | **Latency.** Search p95 under 500 ms on production data (about 2,000 workers) measured on staging's copy, with and without a locality; filter options under 300 ms; users and suspended under 300 ms. Cold-path note: the first geo query after a deploy may plan slower; no response cache in the api | RESILIENCY-05 |
| NFR-02 | **Correctness parity.** Before the page switches, a script runs the same 20+ filter combinations (no location) against the old route on a preview and the new entry on staging and reports identical id sets and totals; with a location it reports the differences and each is explained by a known loss (L1-L5, L7) or is a bug | PBT-05 (oracle) |
| NFR-03 | **Token security.** HS256 (or stronger) with a 32+ byte secret per stage; lifetime at most 10 minutes; audience and issuer checked; no token in URLs, logs or error bodies (`authorization` is already a redaction path); the secret never appears in the repository, the image or the YAML (Secret Manager only) | SECURITY-08, -12 |
| NFR-04 | **Access control.** Deny by default stays (an entry without `access` does not compile); admin entries check the role server-side; CORS stays exact per stage with `credentials: false` (the token travels in a header, not a cookie); object-level checks are not needed (lists, no ids in paths) | SECURITY-08 |
| NFR-05 | **Input validation.** Strict Zod query schemas (P9: unknown keys rejected), bounded strings, enum radii, integer ids; every SQL parameter bound; no string concatenation of user input into SQL | SECURITY-05 |
| NFR-06 | **Abuse cases.** A stolen token is valid for at most its lifetime and only for its role; per-user limits bound scraping of the worker list (a page of 100, N requests per minute); the search cannot be made to scan without bounds (page size capped, radius enumerated, no free text geocoding); the users list reveals emails only to admins | SECURITY-11 |
| NFR-07 | **Logging and alerting.** Structured logs with request id and principal; `authorization` and personal fields redacted; the new auth-failure alert; log retention 90 days as configured | SECURITY-03, -14 |
| NFR-08 | **Fail closed.** A missing or bad token, a limiter outage (503), a database timeout (503) or a schema drift in the response (500) never leaks data; the page shows a notice | SECURITY-15 |
| NFR-09 | **Supply chain.** If a JWT library is added it is pinned in the lockfile and vetted (prefer `jose`, already used by NextAuth in `apps/app`, or Node's `crypto` HMAC with no new dependency); no `latest` | SECURITY-10 |
| NFR-10 | **Timeouts and isolation.** The search query carries a statement timeout (design: at most 5 s) so a slow plan cannot hold the pool; the token route in the app has no external call | RESILIENCY-10 |
| NFR-11 | **Degraded mode.** If the api is unreachable the admin page shows the notice and keeps the last results on screen; nothing else in the admin area depends on the api | RESILIENCY-10 |
| NFR-12 | **Data.** No migration; no new column; the only new persistent state is the secret. The geo query reads existing GiST-indexed columns | RESILIENCY-12 |
| NFR-13 | **Rollback.** Api: promote the previous image (the admin entries disappear; the page then shows the notice until the app is promoted back too). App: Vercel promote of the pre-switch deployment restores the old routes while they still exist (FR-UI-05 deletes them only after verification) | RESILIENCY-04 |
| NFR-14 | **Gates.** Every quality gate stays green; baselines may not grow; new tests run in CI; property-based tests use `fast-check` | PBT-08, -09 |

## 5. Resiliency decisions carried forward from S1 (RESILIENCY-02, -03, -04, -08, -15)

As in the two previous cycles, these user decisions are inherited unchanged unless you say otherwise at this review:

| Decision | Value carried forward | Applied to this cycle |
|---|---|---|
| Availability and recovery targets | SLA 99.9 % monthly for the api; RTO <= 30 min, RPO <= 5 min for a zone failure; regional failure out of scope | The admin search is a High (not Critical) workload: an outage blocks staff, not sign-ups; no new state |
| Regional topology | Single region, multiple zones, Sydney | Unchanged |
| Change management | CLAUDE.md: branch, PR, CI, preview checklist on staging, merge, promotion | Unchanged; the checklist gains the admin steps (section 6) |
| CI/CD | GitHub Actions | `deploy-api` unchanged; `API Quality` gains the geo tests |
| Rollback | Previous pinned image (api), Vercel promote (app) | NFR-13; the order of PRs keeps a promote possible at each step |
| Deployment style | Staging-first promotion of the same image | Unchanged |
| Incident response | Lightweight process, alerts to support@, post-incident reviews | The new auth-failure alert routes there |
| Resiliency testing | Decided at NFR Design | Scenarios to specify: api down from the admin page; token secret rotated; database slow (statement timeout) |

## 6. Verification protocol

1. **Gates:** api, api-contract, form-engine, app, infra, schemas quality; `turbo run build`; both Vercel previews;
   the api's tests against PostGIS in CI (geo properties against generated workers, token properties, filter parity).
2. **Staging, before the page PR merges** (CLAUDE.md checklist, extended): sign in as the staging admin; a token is
   minted and the api answers 200 for the search and 401 without a token, 403 with a worker's token; health 200;
   suburb search returns ids; the four entries answer with the expected shapes; `EXPLAIN` on the geo query shows the
   GiST index; the parity script (NFR-02) passes; a search with "Parramatta NSW 2150" within 10 km returns workers
   ordered by distance with `distanceKm` monotonic; "any distance" returns every placed worker; the unplaced count
   and list are consistent; the production domain unchanged meanwhile.
3. **Production promotion of the api** (the secret set in Secret Manager and Vercel Production first): health 200;
   the admin entries answer 401 without a token; nothing else changes for users.
4. **Page PR on a preview (against staging), then merged:** the admin dashboard searches through the api; the
   notice paths (401, 429, 503) checked by forcing them on the preview; Vercel rollback deployment id re-recorded.
5. **Production after the page merge:** one admin searches with and without a suburb and compares a few rows with
   the previous day's expectations; the auth-failure alert is silent; then the routes-deletion PR.

## 7. Extension compliance (Requirements stage)

### Security (blocking)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 encryption | Compliant | Neon TLS, Cloud Run TLS, no new store |
| SECURITY-02 intermediary logging | N/A | No intermediary added; Cloud Run request logs exist |
| SECURITY-03 application logging | Compliant | FR-ID-05, NFR-07 |
| SECURITY-04 security headers | N/A | The api serves JSON with the full header set already; the app's pages unchanged |
| SECURITY-05 input validation | Compliant | NFR-05, FR-GEO-03 |
| SECURITY-06 least privilege | Compliant | One new secret, readable by the runtime account only (existing pattern) |
| SECURITY-07 network | N/A | No network change |
| SECURITY-08 access control | Compliant | FR-ID-02/03, NFR-04 |
| SECURITY-09 hardening | Compliant | Generic errors; no public storage change |
| SECURITY-10 supply chain | Compliant | NFR-09 |
| SECURITY-11 secure design | Compliant | The authenticator is one module; NFR-06 abuse cases |
| SECURITY-12 authentication | Compliant for what this cycle builds; **pre-existing gap recorded** | The token is short-lived with server-side expiry; sessions remain NextAuth's (secure, httpOnly, sameSite). **MFA for admin accounts does not exist in `apps/app` today**; it is outside this cycle (the app's login is unchanged) and is recorded as follow-up 14 for the identity slice. Not introduced here; flagged for your decision |
| SECURITY-13 integrity | Compliant | Token signature verified every request; reads only, no data change to audit |
| SECURITY-14 alerting | Compliant | FR-PLT-02 |
| SECURITY-15 fail safe | Compliant | NFR-08 |

### Resiliency (blocking)

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01 criticality | Compliant | Admin search = High; identity token = Critical for the admin area only; dependencies: Neon, the app's session |
| RESILIENCY-02 targets | Compliant | Section 5 |
| RESILIENCY-03 change management | Compliant | Section 5 |
| RESILIENCY-04 deployment and rollback | Compliant | Section 5, NFR-13, D8 |
| RESILIENCY-05 monitoring | Compliant | Existing metrics and logs; NFR-01 measured |
| RESILIENCY-06 health checks | Compliant | Unchanged |
| RESILIENCY-07 resiliency monitoring | Compliant | Existing policies + the auth-failure alert; no new quota |
| RESILIENCY-08 topology | Compliant | Section 5 |
| RESILIENCY-09 scaling | Compliant | Cloud Run limits unchanged; per-user limits bound load |
| RESILIENCY-10 isolation | Compliant | NFR-10, NFR-11 |
| RESILIENCY-11..13 DR | Compliant | No new state; NFR-12 |
| RESILIENCY-14 testing | Deferred to NFR Design | Section 5 last row |
| RESILIENCY-15 incident response | Compliant | Section 5 |

### Property-based testing (full)

| Rule | Status | Note |
|---|---|---|
| PBT-01 property identification | At Functional Design | Candidates: the geo query against a Haversine oracle over generated Australian points (oracle, within tolerance); pages partition the ranked set and totals agree (invariant); filter composition never drops a clause (invariant, oracle against today's registry); token mint-then-verify round-trip and every single-claim corruption rejected (round-trip, invariant); locality id resolution; `appliedFilters` reflects exactly the parsed query (round-trip) |
| PBT-09 framework | Compliant | `fast-check` in `apps/api`, `packages/api-contract`, `packages/form-engine`, `apps/app` |
| PBT-02..08, -10 | At Code Generation | |

## 8. Out of scope

The client/coordinator find-worker and the public feed (Q9 A; they keep the legacy columns, so the dual write and
the columns stay); a server-side session record and immediate revocation (Q3 C, declined); the worker's travel
radius as a filter (Q4 B/C, declined; the value is returned per row); free-text locations (CQ1); address-precision
placement (onboarding); MFA for admins (follow-up 14); the AI search webhook; the worker detail, PDF and status
routes; `SUPER_ADMIN` (phantom, not a database role); any `apps/web` change.

## 9. Open items for design

| # | Item |
|---|---|
| OI-1 | The query builder: how the Prisma-style filter registry becomes parameterised SQL fragments alongside the geo predicate in one statement (a typed fragment per filter, or Prisma `findMany` for ids followed by the geo statement on those ids, at the cost of a second round trip) |
| OI-2 | Token library: `jose` (already in the app's dependency tree through NextAuth) on both sides, or Node `crypto` HMAC with a tiny shared encoder in a package; and where the shared claims schema lives (`packages/api-contract` as the natural home: both sides import it) |
| OI-3 | Entry names and paths (`/v1/admin/workers`, `/v1/admin/workers/filter-options`, `/v1/admin/users`, `/v1/admin/workers/suspended` proposed) and the array-parameter encoding |
| OI-4 | The auth-failure alert's threshold and the `distanceKm` rounding |
| OI-5 | Whether `withinKm` accepts any integer 1-500 (future UI freedom) or only the four UI values |

## Amendment 2026-10-08 (every filter combined with the location; document filters dropped; no schema change)

Source: the user's redesign request of 2026-10-08 and `requirement-redesign-questions.md` (Q1 moot, Q2 A, Q3 A).

**D12 -- one query, every filter.** The search entry takes every filter as a query parameter and answers one
intersection, ranked by distance and paged in the database. There is no api per filter; a filter never has to be
combined by the client. "Gender = Female, within 10 km of Parramatta 2150" is one request and one statement.

**D13 -- no schema change in this cycle (Q2 A).** The search reads today's columns with today's normalisation so
parity stays provable. The five normalisations (gender and vehicle as typed values, date of birth as a date, the
worker type out of the `abn` JSON, one language list) are follow-up 15 for an onboarding cycle.

**D14 -- the document filters are dropped (Q3 A).** They were reachable only by editing the URL (no control on the
screen, "Apply" never set them) and the options endpoint's answer was never read. The search entry does not take
them; there is no filter-options entry; the page's dead fetch and dead state are removed in PR 3. A document-filter
screen, if wanted later, gets its entry designed with it, with the same-document semantics (follow-up 16).

**FR-ADM-01 (amended):** **three** entries in the `admin` area: search workers, list users, list suspended workers.

**FR-ADM-03 (replaced): the filters, each combined with the location by AND.** Within one filter the semantics are
today's; between filters, AND; the location (suburb + within) is one more AND term. Each row reads:

| Filter | Parameter | Reads | Semantics | With the location |
|---|---|---|---|---|
| Name or mobile | `search` | `worker_profiles.firstName`, `lastName`, `mobile` | case-insensitive substring; two words match first/last in either order | AND |
| Type of support | `typeOfSupport` | `worker_services.categoryId` (the UI's value is the category id; today's route maps it to the name, the id is the stable key and is indexed) | has that service | AND |
| Therapeutic sub-categories | `therapeuticSubcategories[]` | `worker_services.subcategoryIds` where `categoryId = therapeutic-supports` | any of the selected | AND |
| Gender | `gender` | `worker_profiles.gender` | equals, Title Case; `all` = no filter | AND |
| Has vehicle | `hasVehicle` | `worker_profiles.hasVehicle` | equals `Yes`/`No`; `all` = no filter | AND |
| Worker type | `workerType` | `worker_profiles.abn -> workerEngagementType -> type` | Employee = `tfn`, Contractor = `abn`; `all` = no filter | AND |
| Age | `age` | `worker_profiles.dateOfBirth` (text, ISO guard) with `worker_profiles.age` as the fallback when the date is null | range `18-24`, `25-34`, ..., `60+`; a non-ISO date with no age falls out, as today | AND |
| Languages | `languages[]` | `worker_additional_info.languages` first, else `worker_profiles.languages` | any of the selected, Title Case | AND |
| Experience | `experienceWith[]` | `worker_experience.domain` | **all** of the selected | AND |
| Active | (always) | `users.status = ACTIVE` | | AND |
| Unmapped only | `unplaced` | no HOME row in `worker_locations` | lists the unplaced; ignores the location | replaces |
| Suburb and distance | `localityId`, `withinKm` | `worker_locations` HOME `point` vs `au_localities.point` | `ST_DWithin`; no `withinKm` = no radius | the term itself |

Sorting by `city` or `state` reads the HOME locality's suburb and state (one source), falling back to the legacy
columns for unplaced workers. **FR-ADM-05 is withdrawn.** **FR-UI-02 (added):** the page's call to the options
endpoint and its unused state are removed. **FR-UI-05 (amended):** the deletion PR also removes
`api/admin/filters/route.ts`. **NFR-02 (amended):** the parity set covers every filter in the table above, alone
and combined with each other and with a suburb.

**Follow-ups added to the state file:** 15 (the five normalisations), 16 (a document-filter screen with its entry).

## Amendment 2026-10-08 (instant repeats: caches, the PostGIS search kept)

Source: the user's instruction of 2026-10-08 ("I don't want the admin to call the api every request, or query every
request; if the most common filter is called, I want the return to be instant") and
`requirement-instant-search-questions.md`: Q1 **C** (caches only; the browser snapshot and the in-memory directory
are not built), Q2 A (freshness about a minute), Q3 A and Q4 A read, under C, as: response rows carry the list's
columns and filter attributes, and the search entry is kept.

**D15 -- private HTTP caching on the admin GETs.** Every admin GET response carries `Cache-Control: private,
max-age=60`, `Vary: Authorization` and a content `ETag`. The browser's own HTTP cache then answers a repeated
identical search within 60 s **without a request** (instant, zero api calls, zero queries); after 60 s the browser
sends `If-None-Match` and the api answers 304 when the result has not changed (a few bytes, and no query when the
memo of D16 still holds it). The contract gains a `privateCacheSeconds` meta field allowed only on role-restricted
GETs (never together with `cacheSeconds`, never on a public entry); the pipeline sets the headers and handles
`If-None-Match`.

**D16 -- an api-side memo of recent results.** The api keeps, per instance, a bounded in-memory memo (at most 500
entries, 60 s) of search responses keyed by the **normalised** query (sorted parameters, defaults applied), never by
the caller: a second admin asking the same question within the minute gets the memoised body and no statement
runs. 4xx and 5xx are never memoised. A request carrying `Cache-Control: no-cache` bypasses the memo and the
browser cache (used by the page right after an admin action). The memo is cleared on deploy (new instance) and
is not shared across instances (prod runs 1-4), which is acceptable at a 60 s horizon.

**D17 -- canonical URLs from the page.** The admin client builds every search URL with sorted, defaulted
parameters so the same filters always produce the same URL (the key of both caches); the page shows "results may be
up to a minute old" with a refresh button that sends `no-cache`; after suspend/reactivate/publish it refreshes
with `no-cache`.

**What stays.** FR-GEO-02/03: the radius is still computed by PostGIS in one statement when a query is not in a
cache; the token, the registry, the parity script, the three entries and the PR order are unchanged.

**New requirements.**

| ID | Requirement | Pri |
|---|---|---|
| FR-CACHE-01 | The three admin GET entries declare `privateCacheSeconds: 60`; the pipeline emits `Cache-Control: private, max-age=60`, `Vary: Authorization` and a strong `ETag` derived from the response body, and answers 304 to a matching `If-None-Match` | Must |
| FR-CACHE-02 | The api memoises successful search responses per normalised query for 60 s, bounded to 500 entries (LRU), per instance; a `Cache-Control: no-cache` request bypasses it; errors are never memoised | Must |
| FR-CACHE-03 | The admin client builds canonical URLs (sorted keys, defaults applied, empty arrays omitted) and uses the browser's default cache mode so repeats are served locally; refresh and post-action reloads use `cache: 'reload'` | Must |
| FR-CACHE-04 | The page shows how old the displayed results may be ("up to a minute") and offers a refresh; the users and suspended lists behave the same | Must |
| NFR-15 | A repeated identical search within 60 s costs no request (browser cache) or, from another admin, no database statement (memo); the first search of a combination keeps NFR-01's 500 ms p95; a memo hit answers under 20 ms at the api | RESILIENCY-05 |
| NFR-16 | Caching never crosses a role boundary: only ADMIN entries carry `privateCacheSeconds`; responses are `private` (no shared cache may store them); the memo key excludes the caller because the result does not depend on who asks | SECURITY-08, -09 |
| NFR-17 | Staleness is bounded to 60 s from the last change; an admin's own action is followed by a `no-cache` reload so they see their change immediately | RESILIENCY-05 |

**Stories added:** US-AS-19 (the same search again is instant), US-AS-20 (serve repeats from memory).
