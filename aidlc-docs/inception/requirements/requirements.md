# Requirements -- the worker profile on `apps/api` (cycle `worker-profile-api`)

**Depth:** Comprehensive. The cycle creates the first non-admin authenticated area of the api, moves every read and
write of a live dashboard used by about 2,000 workers (53 server actions, 14 routes, 3 Prisma-reading pages), adds
two columns and a document-upload path, changes the navigation, and sets a capacity target with a load test; three
blocking extensions are on. **Sources:** `cycle-start-questions.md` (the goal), `worker-profile-inventory.md` and
`worker-profile-routes.md` (2026-10-09), the archived reverse-engineering pass (2026-10-08, api/contract/form
engine/infra), `requirement-verification-questions.md` (Q1-Q17) and `requirement-clarification-questions.md`
(CQ1-CQ6, all A).

## 1. Intent analysis

| | |
|---|---|
| **User request** | "I want to migrate all the legacy api on the workers profile to the new api backend, and reorder the side bar navigation as well. Let us start with the Edit Profile. Along with this changes, I want the api also handles multiple requests at the same time. It can handle 10,000+ users at the same time, so I think we can use a worker servers for this (not sure for the term). The system should also be easy to maintain, as well as the code and file structure, review first the current api structure" |
| **Request type** | Migration + enhancement: the worker dashboard's data layer (server actions, route handlers, Prisma-reading pages) moves to contract entries on `apps/api`; the pages are rebuilt on the form engine; a home address is added; the sidebar is re-declared; a capacity target is set and proven |
| **Scope estimate** | Multiple components: `packages/api-contract` (a new `worker` area), `apps/api` (a worker module, upload tickets reused, an outbox handler for n8n), `apps/app` (13 dashboard pages, the sidebar, the form definitions, the server actions and routes deleted), `packages/db` (one migration: the home address), `infra/` (instance ceiling, pool, a secret for n8n), `packages/form-engine` (field kinds the sections need), docs, CI |
| **Complexity estimate** | Complex: the largest surface moved so far (about 11,000 lines of app code replaced), personal and financial data behind ownership rules, a document-upload path, a live cut-over page by page, and a capacity claim that must be measured |

## 2. Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **No hotfix before the cycle.** The two routes that send per-user document lists under `Cache-Control: public, s-maxage` (`/api/worker/requirements`, `/api/worker/other-requirements`) are replaced by the Mandatory/Trainings unit; until then the exposure is an accepted open item of the Security Baseline, named with its fix | Q1 B |
| D2 | **The archive plus the inventory is the cycle's picture of the code**; no further reverse-engineering pass | Q2 A |
| D3 | **The first unit is the whole profile**: Personal Info (`/account/setup`: name, photo, bio, address, personal info) and Edit profile (`/profile-building`: preferred hours, experience, the additional-details sections), one contract area, two pages switched | Q3 A |
| D4 | **Logic lives in `apps/api` only.** Every worker read and write is a contract entry; the token carries the worker's identity, no entry takes a user id; the server actions, the Prisma reads in server components and the Upstash caching of the worker dashboard are deleted as each page moves | Q4 A |
| D5 | **The pages are form definitions on the form engine**, one per section, validation from the contract entry, the on-device draft, retries; the hand-built `useState` pages go section by section | Q5 A |
| D6 | **Capacity target: 10,000 workers signed in and active over the same hour**, met by the present stateless shape (a raised instance ceiling, the pool and Neon's pooler sized to it, one statement per page, private caching on reads) and **proven by a load test on staging before promotion** | Q6 A |
| D7 | **"Worker servers" = horizontal scaling of the same api**: more Cloud Run instances, tuned concurrency, pool and shedding; no separate background service, no Node cluster | Q7 A |
| D8 | **Two addresses.** The **service area** is the sign-up suburb (`worker_locations` kind `HOME`, `travelRadiusKm`), the only search input, editable from Edit Profile through the api's `placeHome` path, which dual-writes the legacy columns. The **home address** is new, private (the worker and admins; never clients, never a search), a street line plus a suburb picked from `au_localities`, stored on the profile, not geocoded, and it never touches the legacy columns | Q8 Other, CQ1-CQ3 A |
| D9 | **Uploads move to the Cloud Storage ticket/confirm pattern** of the sign-up photo (ticket, direct POST, confirm, an outbox clean copy); the Blob routes go when their last caller moves | Q9 A |
| D10 | **No impersonation rule**: an impersonating admin reads and writes as the worker; `impersonatorId` is already on every log line | Q10, CQ4 A |
| D11 | **The sidebar**: Dashboard; Edit Profile (a dropdown: Your name, Profile photo, Your bio, Address, Other personal info, then Preferred hours, Experience, and the additional-details group); Edit Services; Mandatory; Trainings; My Services; Additional Credentials; My Jobs; Account. One declaration, rendered | Q11 Other, CQ5-CQ6 A |
| D12 | **Cut-over per page group**: entry PR (api, promoted after the preview checklist), page PR (the app switches), clean-up PR (server actions and routes deleted). Rollback is a Vercel promote at every step | Q12 a |
| D13 | **Shared routes stay** (`/api/suburbs`, `/api/categories`, `/api/upload/worker-photo`, `/api/share/*`, `/api/contractors*`, `/api/geocode`) for their client, coordinator, admin and `apps/web` callers; the worker pages stop using them | Q13 a |
| D14 | **The n8n call becomes an outbox handler** in the api (an allow-listed host through `SafeHttpClient`, the URL a secret), which also gives sign-ups their CRM notification (follow-up 2) | Q14 a |
| D15 | Extensions: Security baseline (blocking), Resiliency baseline (blocking, S1 targets), Property-Based Testing (full) | Q15-Q17 a |
| D16 | Assumptions accepted by silence (the questions' preamble and inventory section 7): the data a page shows today it shows after the move; a section's validation is at least as strict as today's hand checks; dead code found by the inventory (`update-step` steps 7, 103+, 300; the routes with no caller) is deleted, not ported; the worker's `verificationStatus`, `setupProgress` and `profileCompleted` keep today's meaning and are computed by the api | preamble |

## 3. Functional requirements

### 3.1 The worker area on the api (FR-WRK)

| ID | Requirement | Pri |
|---|---|---|
| FR-WRK-01 | A new area `worker` in `packages/api-contract` (`/v1/worker/...`), every entry `access: {roles: ['WORKER']}`, per-user and per-IP rate limits, `maxBodyKb` set per entry, no `cacheSeconds`; reads carry `privateCacheSeconds` (60) with ETag/304 as the admin entries do; writes are `no-store`. None is in `public-endpoints.json`. `openapi.json` regenerated | Must |
| FR-WRK-02 | **Ownership by token.** Every entry acts on the profile of the token's `sub`; no path or body carries a user id or a profile id of another worker; a worker without a profile row answers 404 with the envelope. Rows of child tables are addressed by their own id and checked to belong to the principal's profile (object-level access control) | Must |
| FR-WRK-03 | **One module** `apps/api/src/modules/worker/` in the api's layering (`<area>.handlers.ts`, `application/`, `domain/`, `persistence/`), bound in `main.ts`; the test harnesses bind the area; the boot refuses an unbound entry | Must |
| FR-WRK-04 | **The profile read** is one entry returning what the sidebar, the home page and the preview need in one body: names, photo urls, bio, personal info, the service area (`localityLabel`, `travelRadiusKm`, `precision`), the home address, the completion status (`accountDetails`, `compliance`, `trainings`, `services`, `profileCompleted`, the percentage the badge shows), `displayRole`, `verificationStatus`. One statement (or one transaction) per request | Must |
| FR-WRK-05 | **Writes are whole-section replacements** (PUT semantics) with strict Zod bodies; each returns the updated section so the client needs no second read; each is idempotent (the same body twice leaves the same row); list sections (availability, job history, education, experience) are replaced in one transaction, `sortOrder` from array position | Must |
| FR-WRK-06 | **Completion status** (today `setupProgress.service.ts`, 1,300+ lines in the app) is computed in the api from the rows, in one place, and returned by FR-WRK-04; the flags are written to `worker_profiles.setupProgress`/`profileCompleted` with today's meaning so the admin screens and the client search keep reading them | Must |
| FR-WRK-07 | **The client adapter** reuses `lib/api/` (the token source, the mint route, the refresh-once-on-401); the worker pages call through `createClient(workerContract)`; no hand-written `fetch` to the api (Semgrep) | Must |
| FR-WRK-08 | **Audit on writes:** every write entry declares its audit action; the pipeline's audit check enforces it; the audit row carries the principal and the impersonator (D10) | Must |

### 3.2 Personal Info (FR-PI)

| ID | Requirement | Pri |
|---|---|---|
| FR-PI-01 | **Name**: first, middle (optional), last; trimmed, 1-100 characters, letters/space/hyphen/apostrophe | Must |
| FR-PI-02 | **Photo**: the main photo and up to the current number of additional photos; the file goes by ticket to Cloud Storage (FR-UPL), the confirm entry links it to the profile; a "make main" entry swaps; the outbox clean copy and thumbnail as the sign-up has; `photos`/`additionalPhotos` on `worker_profiles` keep their format so every reader (admin, client, share page) is unchanged | Must |
| FR-PI-03 | **Bio** (`introduction`): 1-2,000 characters, plain text | Must |
| FR-PI-04 | **Home address** (D8): `streetLine` (1-120 characters) + `localityId` (an existing `au_localities` row; the suburb, state and postcode are derived, never typed). Two new columns on `worker_profiles` (`homeStreetLine`, `homeLocalityId` with a foreign key, `Restrict`), one migration; returned to the worker and on the admin worker page; **never** in the client search, the public list, the share page or the search cards; **never** written to `location/city/state/postalCode/latitude/longitude` | Must |
| FR-PI-05 | **Service area** (D8): `localityId` + `travelRadiusKm` (1-500) through `placeHome` with `source = 'ONBOARDING'` (an existing enum value: the worker placed themselves after sign-up), updating the HOME row in place and dual-writing the legacy columns as the sign-up does; the api's reconciler never moves a row the worker set. An unplaced worker who saves this becomes placed | Must |
| FR-PI-06 | **Other personal info**: date of birth (ISO date, 16-100 years), gender (an enumerated list), has vehicle (yes/no), languages (from one shared list) -- stored as today's columns with today's values so the admin filters keep working (follow-up 13's normalisation is not this cycle) | Must |
| FR-PI-07 | **ABN only** (amendment 2026-10-09): every worker is engaged as a contractor with an ABN; the form offers no TFN. The ABN is 11 digits with the ATO checksum; stored in the `abn` JSON with today's shape (`workerEngagementType: {type: 'abn', value, signed, ...}`) so the contract page and the admin's worker-type filter keep working. Existing `type: 'tfn'` records are left as data (not migrated, not deleted); a worker on TFN who opens the step sees the ABN form and must enter an ABN to save; the TFN contract route and template stay readable for existing signed contracts and are not offered to anyone. No TFN is ever written again | Must |
| FR-PI-08 | The Personal Info steps are form definitions; the old server actions `updateWorkerName/Photo/AdditionalPhotos/swapMainPhoto/Bio/Address/PersonalInfo/ABN` and the `update-step` route are deleted in the clean-up PR; the emergency-contact step (7) is deleted (it never worked) | Must |

### 3.3 Edit profile sections (FR-EP)

| ID | Requirement | Pri |
|---|---|---|
| FR-EP-01 | **Preferred hours** (`worker_availability`): a list of {day, startMinute, endMinute}, no overlap within a day, start < end, at most N slots per day (N = today's UI limit); whole-list replace | Must |
| FR-EP-02 | **Experience** (`worker_experience`): per care domain {isProfessional, isPersonal, specificAreas (from `@remonta/schemas/data/experienceAreas`, the domain's list), otherAreas, description}; the admin search's `experienceAreas` filter keeps matching | Must |
| FR-EP-03 | **Work history** (`worker_job_history`) and **Education** (`worker_education`): ordered lists with today's fields; dates as month/year; `currentlyWorking`/`currentlyStudying` excludes an end date | Must |
| FR-EP-04 | **Additional details** on `worker_additional_info`: good to know (`lgbtqiaSupport`, `nonSmoker`, `petFriendly`), languages, cultural background, religion, interests, about me (`funFact`, `uniqueService`), preferences (`workPreferences`), personality -- each its own entry or one entry per group, decided at design; list values from the shared lists | Must |
| FR-EP-05 | **Bank account** (`bankAccount` JSON): account name, BSB (6 digits), account number (6-10 digits); **returned masked** (last 3 digits) on every read including the admin page; the full value is written only; logged never. Stored as today (the column exists); whether it is encrypted at the application level is an open item (OI-3) | Must |
| FR-EP-06 | Each section is a form definition; the sections rendered today are the sections after the move (Locations, Rates and NDIS sections, unrendered today, are not built); the 13 server actions and `getWorkerAdditionalInfo` are deleted in the clean-up PR | Must |

### 3.4 Services, documents, uploads (FR-SVC, FR-DOC, FR-UPL)

| ID | Requirement | Pri |
|---|---|---|
| FR-SVC-01 | **Edit services**: the worker's services as {categoryId, subcategoryIds[]} against the api's catalogue (`GET /v1/service-categories`), whole-list replace in one transaction (today's step 101); the nursing and therapeutic registration details as part of the service they belong to | Must |
| FR-SVC-02 | **Per-service requirements** (the documents a service needs) are read from the api (today `/api/worker/requirements`, the public-cache leak of D1 closes here) | Must |
| FR-DOC-01 | **Documents** (`verification_requirements`): list by type group (mandatory, trainings, identity, other, per service); create/replace a document for a `requirementType` the worker's services or the base set allow (**never an arbitrary type**: the allowed set comes from the catalogue, closing today's copy-reference and PATCH holes); metadata as a typed object per document kind (expiry date, citizenship flag, licence fields), not free JSON; delete removes the row and its object; `verificationStatus` set to `PENDING_REVIEW` as today | Must |
| FR-DOC-02 | A document's status transitions remain the admin's (`SUBMITTED` → approved/rejected via the existing admin routes); the worker's entries never set approved states | Must |
| FR-UPL-01 | **Uploads**: the sign-up's ticket/confirm pattern generalised to the worker's photo and documents: a ticket entry (file kind, size limit per kind, content types per kind: images for photos; PDF/JPEG/PNG for documents) returns a signed POST to the private bucket under a per-worker prefix; a confirm entry verifies the object exists, records the row, enqueues the clean copy (photos) or an antivirus/size check (documents, if available; else size and content-type only); unconfirmed objects are purged by the existing job | Must |
| FR-UPL-02 | Documents are **served by short-lived signed read URLs** from the api (the worker's own; the admin's existing document views through a matching admin entry or, until then, the Blob url for pre-cycle documents) -- `documentUrl` keeps holding a location that both the old and the new reader understand (design) | Must |
| FR-UPL-03 | The Blob-writing routes (`upload/*`, `compliance/upload`, `blob/upload-token`, the `put`/`del` in the actions) are deleted when their last caller moves; `/api/upload/worker-photo` stays for the admin picker (D13) but gains session authentication and a rate limit in its own small PR (it is unauthenticated today) | Must |

### 3.5 The home page, jobs and the CRM (FR-HOME, FR-JOB)

| ID | Requirement | Pri |
|---|---|---|
| FR-HOME-01 | The home page and `my-jobs` become client pages reading the profile (FR-WRK-04), the active jobs list (public to workers: `GET /v1/worker/jobs?state&city`, bounded page) and the worker's applications; no Prisma in server components; Upstash keys `worker_profile`, `completion_status`, `active_jobs`, `worker_profile_base` go with them | Must |
| FR-JOB-01 | **Apply / withdraw**: `POST /v1/worker/job-applications` {jobId} (upsert, idempotent) and withdraw; `job_applications.workerId` keeps holding the user id as today (the search and admin readers depend on it) | Must |
| FR-JOB-02 | **CRM notification** (D14): applying enqueues an outbox event; a handler posts {fullName, userId, zohoId} to the n8n webhook through `SafeHttpClient` (host allow-listed, `N8N_JOB_APPLICATION_WEBHOOK_URL` a secret per stage; staging posts to a staging webhook or a sink); retries and dead-lettering as the outbox provides; the browser never calls n8n. The same handler shape serves `WorkerRegistered` (the config's unused `N8N_REGISTRATION_WEBHOOK_URL` gets its consumer) | Must |
| FR-HOME-02 | The geocode-by-text used by the jobs slider (`/api/geocode`, Nominatim) is replaced by the locality the worker already has (state from the service area); no external geocoder from the worker dashboard | Should |

### 3.6 Navigation (FR-NAV)

| ID | Requirement | Pri |
|---|---|---|
| FR-NAV-01 | The sidebar is **one declaration** (`features/navigation/workerMenu.ts` or similar): an ordered array of items {id, label, icon, href or children, badge rule}; `Sidebar` renders it; the dynamic groups (Mandatory, Trainings, My Services) are children produced by one function each from the profile read; no item is hard-coded JSX | Must |
| FR-NAV-02 | The order is D11's; the Edit Profile dropdown lists the five Personal Info steps, then Preferred hours, Experience, and the additional-details group; the completion badge stays on Edit Profile | Must |
| FR-NAV-03 | A test asserts the declared order and that every href resolves to an existing page | Must |

### 3.7 Platform, capacity, documentation (FR-PLT)

| ID | Requirement | Pri |
|---|---|---|
| FR-PLT-01 | **Capacity (D6, D7)**: `infra/lib/stages.ts` prod `maxInstances` raised (design proposes 10-20), `MAX_IN_FLIGHT` set below `concurrency` so shedding can fire, `DB_POOL_SIZE` and Neon's pooler sized for max instances × pool; the pooled URL's transaction-mode requirement (`pgbouncer=true`) verified on both stages before the first write entry ships | Must |
| FR-PLT-02 | **Load test**: a repeatable script (`apps/api/scripts/load-worker.ts`, `autocannon` or `k6`) drives staging with a worker token mix at the D6 rate for 10 minutes; the acceptance numbers are in NFR-01; the run is recorded in the construction notes before the production promotion of each unit that adds entries | Must |
| FR-PLT-03 | **Secrets**: the n8n webhook URL per stage in `SECRET_NAMES`, bootstrap, YAML, README; nothing else new | Must |
| FR-PLT-04 | **Documentation in the same PRs**: `docs/worker/README.md` (an index like `docs/signup/`: the entries, the token, the tables, the uploads, the outbox events), CLAUDE.md's reach line, `docs/admin/` where the admin reads the home address | Must |
| FR-PLT-05 | **Clean-up per unit**: the matching server actions, routes, hooks, Upstash keys and `revalidatePath` calls deleted; the state file's follow-ups updated (2 CRM done; 11 uploads done; 17 the worker can self-place; 1 unchanged: the client search still reads the legacy columns) | Must |
| FR-PLT-06 | **Maintainability items from the review folded in where touched**: `DenyAllAuthenticator` deleted; OpenAPI lists 304/503 where the pipeline can return them; the health entry exempt from the rate limiter; the Semgrep raw-SQL rule covers `Prisma.raw`; `MAX_IN_FLIGHT` vs `concurrency` (FR-PLT-01) | Should |

## 4. Non-functional requirements

| ID | Requirement | Rule |
|---|---|---|
| NFR-01 | **Capacity and latency.** On staging (one instance, pool 5) a load test at the per-instance share of D6's rate (design states the number from 10,000 active workers/hour × calls per page) holds p95 under 300 ms for the profile read and 500 ms for section writes, 0 shedding (503) at that rate, and no pool-timeout errors; a second run at 3× the rate shows shedding as 503 + `Retry-After`, never 5xx of another kind, and recovery within 30 s after the burst. Production numbers are derived (instances × that), stated in the infrastructure design | RESILIENCY-05, -09 |
| NFR-02 | **One statement per page.** The profile read is one statement or one transaction; a section write is one transaction; no N+1 (today's update-step loop); the admin and client readers' statements are unchanged | RESILIENCY-05 |
| NFR-03 | **Ownership and access.** Every worker entry reads the profile of the token's subject; child rows are checked against it; cross-worker access is 404, tested per entry by a property (random other principal → never 200); the admin page's reads of the home address and the masked bank account go through admin entries or the existing admin route, never a worker entry | SECURITY-08 |
| NFR-04 | **Input validation.** Strict Zod bodies on every entry (unknown keys rejected, strings bounded, enumerations for every list value, ids as positive integers or cuids, dates as ISO); file kinds and sizes enumerated per upload kind; no free JSON stored from a request | SECURITY-05 |
| NFR-05 | **Personal data handling.** Bank account masked on read, never logged; the home address never in client-facing responses; `authorization`, bodies of writes and document urls redacted in logs; responses `private` or `no-store`; **no `public` cache header on any authenticated response** (a contract check rejects `cacheSeconds` on a non-public entry already; the app's remaining routes are grepped for `s-maxage` in the clean-up PR) | SECURITY-03, -09 |
| NFR-06 | **Abuse cases.** A stolen worker token is valid for at most 5 minutes and only for that worker; per-user limits bound writes (design: 60/min) and uploads (10 tickets/min); ticket objects are bounded in size and purged if unconfirmed; the n8n handler cannot be made to post to another host; apply/withdraw are idempotent | SECURITY-11 |
| NFR-07 | **Fail closed and degraded mode.** A limiter outage, a pool timeout or shedding gives 503 with `Retry-After`; the form engine's retry honours it and keeps the draft on the device; an unreachable api shows a notice on the dashboard and never loses typed data; a failed outbox event dead-letters with the alert | SECURITY-15, RESILIENCY-10 |
| NFR-08 | **Supply chain.** New dependencies (a load tool, dev only) pinned; no new runtime dependency expected beyond what the sign-up photo path uses | SECURITY-10 |
| NFR-09 | **Data.** One migration (two home-address columns with a foreign key to `au_localities`); expand-only, no column dropped in this cycle; the legacy location columns keep their dual write; Neon backups unchanged (RPO ≤ 5 min) | RESILIENCY-12 |
| NFR-10 | **Rollback.** Api: promote the previous image (new entries disappear; the app's pages show the notice until the app is promoted back). App: Vercel promote restores the old pages while their actions and routes still exist (the clean-up PR follows production verification). The migration is backward compatible so a rollback never needs a down migration | RESILIENCY-04 |
| NFR-11 | **Timeouts and isolation.** Statement timeouts on the profile read and on the section writes (design: 5 s); the n8n post bounded (SafeHttpClient's 10 s) and never on the request path; uploads never pass through the api or the app | RESILIENCY-10 |
| NFR-12 | **Consistency across instances.** Nothing a worker entry depends on is instance-local except the response memo (not used for worker entries: per-user bodies) -- the private browser cache + ETag is the only read cache; writes invalidate by the client re-fetching with `no-cache` | RESILIENCY-09 |
| NFR-13 | **Gates.** Every quality gate stays green; baselines may not grow; the api's database-gated tests run in CI's PostGIS; property-based tests use `fast-check`; the form-engine's "what the form accepts, the contract accepts" test covers every new definition | PBT-08, -09 |
| NFR-14 | **Maintainability.** The module follows the admin module's layout; no file over 300 lines without a reason stated in the construction notes; the form definitions hold no rendering; the sidebar is data; the api's contract is the single source of the worker's field rules (the app repeats none) | -- |

## 5. Resiliency decisions carried forward (RESILIENCY-02, -03, -04, -08, -15)

| Decision | Value carried forward | Applied to this cycle |
|---|---|---|
| Availability and recovery targets | SLA 99.9 % monthly for the api; RTO ≤ 30 min, RPO ≤ 5 min for a zone failure; regional failure out of scope | The worker dashboard becomes a **Critical** workload of the api (every worker's profile edits and documents); D6's capacity target is an acceptance gate of this cycle, not a change to these targets (Q16 A) |
| Regional topology | Single region, multiple zones, Sydney | Unchanged |
| Change management | Branch, PR, CI, preview checklist on staging, merge, promotion | Unchanged; the checklist gains the worker steps (section 6) |
| CI/CD | GitHub Actions | `deploy-api` unchanged; `API Quality` gains the worker tests |
| Rollback | Previous pinned image (api), Vercel promote (app) | NFR-10 |
| Deployment style | Staging-first promotion of the same image | Unchanged; the load test runs on staging before each promotion that adds entries |
| Incident response | Alerts to support@, post-incident reviews | The outbox dead-letter alert now covers the CRM handler |
| Resiliency testing | Decided at NFR Design | Scenarios: shedding under the 3× burst; a pool exhausted; n8n down (dead letters, no user impact); the api down from the dashboard (draft kept) |

## 6. Verification protocol

1. **Gates:** api, api-contract, form-engine, app, infra, schemas, db quality; `turbo run build`; both Vercel
   previews; the api's tests against PostGIS in CI (ownership properties, section round-trips, completion-status
   oracle against today's function on fixtures, upload ticket/confirm).
2. **Staging, before each page PR merges** (CLAUDE.md's checklist, extended): sign in as a staging worker; a token
   is minted; the profile read answers 200 and 401 without a token, 404 for a worker without a profile, 403 for an
   admin token on a worker entry; each section writes and reads back identically; a photo and a document go by ticket,
   confirm, and appear; the home address saves and is absent from the client search and the share page; the service
   area saves, the legacy columns follow, and the admin search finds the worker at the new suburb; the load test
   (FR-PLT-02) run and recorded; health 200; the production domain unchanged meanwhile.
3. **Production promotion of the api** (secrets set first): health 200; the worker entries answer 401 without a
   token; nothing changes for users until the page PR.
4. **Page PR on a preview (against staging), then merged:** the page works end to end on the preview; after the
   merge, one real worker (an internal account) edits each section on production; the rollback deployment id
   re-recorded in CLAUDE.md.
5. **Clean-up PR** after production verification: actions and routes deleted; the Upstash keys gone; the grep for
   `s-maxage` on authenticated routes empty.

## 7. Extension compliance (Requirements stage)

### Security (blocking)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 encryption | Compliant | Neon TLS and disk encryption; Cloud Storage encrypted at rest; the bank account's application-level encryption is OI-3 |
| SECURITY-02 intermediary logging | N/A | No intermediary added |
| SECURITY-03 application logging | Compliant | NFR-05; `impersonatorId` on every line |
| SECURITY-04 security headers | N/A | The api's header set exists; the app's pages unchanged |
| SECURITY-05 input validation | Compliant | NFR-04, FR-DOC-01 (no free JSON), FR-UPL-01 (kinds and sizes) |
| SECURITY-06 least privilege | Compliant | The runtime account's bucket rights exist from the sign-up; one new secret |
| SECURITY-07 network | N/A | No change |
| SECURITY-08 access control | Compliant | FR-WRK-02, NFR-03: ownership by token, object-level checks, 404 on others' rows |
| SECURITY-09 hardening | Compliant with **one accepted open item** | D1: the public-cache exposure on two routes stays until the Mandatory/Trainings unit (FR-SVC-02, FR-DOC-01) replaces them; the user chose B on Q1. **Also pre-existing, out of scope and recorded:** the unauthenticated `/api/sms/send-verification` (Twilio) and `/api/contractors` exposing email and phone -- follow-ups for a client-side cycle |
| SECURITY-10 supply chain | Compliant | NFR-08 |
| SECURITY-11 secure design | Compliant | NFR-06; the worker module is one bounded area |
| SECURITY-12 authentication | Compliant for what this cycle builds | The worker token path exists (5-minute HS256 JWT); MFA for workers and admins remains follow-up 12 |
| SECURITY-13 integrity | Compliant | Audit on every write (FR-WRK-08); uploads confirmed by object existence and content type |
| SECURITY-14 alerting | Compliant | The outbox dead-letter and auth-failure alerts exist |
| SECURITY-15 fail safe | Compliant | NFR-07 |

### Resiliency (blocking)

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01 criticality | Compliant | The worker dashboard = Critical; dependencies: Neon, Cloud Storage, the app's session, n8n (non-critical, outbox) |
| RESILIENCY-02 targets | Compliant | Section 5 |
| RESILIENCY-03 change management | Compliant | Section 5 |
| RESILIENCY-04 deployment and rollback | Compliant | D12, NFR-10, the expand-only migration |
| RESILIENCY-05 monitoring | Compliant | NFR-01 measured; existing latency and error policies |
| RESILIENCY-06 health checks | Compliant; FR-PLT-06 improves | The probe stops paying a rate-limit upsert |
| RESILIENCY-07 resiliency monitoring | Compliant | Existing policies; the dead-letter alert |
| RESILIENCY-08 topology | Compliant | Section 5 |
| RESILIENCY-09 scaling | Compliant | D7, FR-PLT-01, NFR-01, NFR-12 |
| RESILIENCY-10 isolation | Compliant | NFR-07, NFR-11 |
| RESILIENCY-11..13 DR | Compliant | NFR-09; the bucket's objects are re-creatable by the worker (no backup policy change) |
| RESILIENCY-14 testing | Deferred to NFR Design | Section 5 last row |
| RESILIENCY-15 incident response | Compliant | Section 5 |

### Property-based testing (full)

| Rule | Status | Note |
|---|---|---|
| PBT-01 property identification | At Functional Design | Candidates: section write-then-read round-trips for every section (round-trip); ownership (random other principal never sees the row: invariant); completion status against today's function on generated profiles (oracle); availability slots never overlap after a write (invariant); apply/withdraw idempotent (idempotency); the sidebar declaration's order and resolvability (invariant); the masked bank account never contains more than three digits of the original (invariant); the home address never appears in the client search or share responses (invariant); ticket/confirm as a stateful model (PBT-06) |
| PBT-09 framework | Compliant | `fast-check` everywhere |
| PBT-02..08, -10 | At Code Generation | |

## 8. Out of scope

The client, coordinator and admin dashboards' own routes (D13); `apps/web`; the client search's move off the legacy
columns (follow-up 1 stays); column normalisation (follow-up 13); MFA (follow-up 12); a separate background-work
service (Q7 B declined); 10,000 simultaneous requests (Q6 B declined); the unrendered Locations/Rates/NDIS sections;
the SMS verification routes and the public contractors route (recorded, not fixed here); `coordinator/profile`;
the admin's document review routes (they stay; FR-DOC-02); the Account page's email and password changes (they are
NextAuth account operations, not profile; they stay as actions unless design finds them trivial to move).

## 9. Open items for design

| # | Item |
|---|---|
| OI-1 | Entry list and paths (`/v1/worker/profile`, `/v1/worker/profile/{name,bio,home-address,service-area,personal-info,abn}`, `/v1/worker/availability`, `/v1/worker/experience`, `/v1/worker/job-history`, `/v1/worker/education`, `/v1/worker/additional-info/{group}`, `/v1/worker/bank-account`, `/v1/worker/services`, `/v1/worker/documents...`, `/v1/worker/uploads/tickets`, `/v1/worker/uploads/confirmations`, `/v1/worker/jobs`, `/v1/worker/job-applications`); one entry per section vs grouped |
| OI-2 | How `documentUrl` holds both the pre-cycle Blob urls and the new bucket object names so the admin's existing views keep working (a prefix scheme, or a second column) |
| OI-3 | The bank account: application-level encryption (a key in Secret Manager, `aes-256-gcm`) vs the column as today; and whether the admin page needs the full value (payroll) or the masked one |
| OI-4 | The capacity arithmetic: calls per page after the move (target: 1 profile read per page, 1 write per save), the per-instance rate for NFR-01, prod `maxInstances`, pool size, Neon pooler limit, and the `pgbouncer=true` verification |
| OI-5 | The form-engine field kinds the sections need beyond the sign-up's (time ranges, month/year, ordered lists, masked bank fields, a locality picker reused) and the engine's PUT semantics (today it POSTs a registration) |
| OI-6 | The unit cut: U1 identity-free worker area + profile read + Personal Info + Edit profile + the sidebar; U2 services; U3 documents and uploads (closes D1); U4 home page, jobs, the CRM handler; U5 capacity (stages table, load test, probe exemption) -- proposed, decided at Units Generation |
| OI-7 | Whether the load test belongs to the preview checklist of every unit or only to those that add entries (FR-PLT-02 says the latter) |

## Amendment 2026-10-09 (ABN only)

Source: the user's approval of the stories: "Approved, but there is no TFN for now, the company decided to require
ABN only". **D17 -- ABN only.** The engagement step offers one type, contractor with an ABN (FR-PI-07 rewritten).
Existing TFN records stay as data and keep their signed contract; the admin's worker-type filter keeps both values
for history; US-WP-05 rewritten. Assumption stated, to correct if wrong: "require" means the only option, not that
the ABN becomes a new condition of profile completion beyond today's rule.
