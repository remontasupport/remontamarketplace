# Worker profile: targeted inventory (2026-10-09, `main` `c51d430`)

Read from the code; nothing changed, no production read. Three read-only passes (the worker dashboard and its
sidebar; the legacy route handlers; the api structure against the archived 2026-10-08 reverse-engineering pass),
cross-checked by the session on the claims the questions rest on (the sidebar order, the legacy location write, the
public cache headers, the server-action volume, the api's existing entries).

## 1. The finding that shapes the cycle

**The worker dashboard has almost no HTTP api to migrate.** Its writes are Next.js **server actions** (`"use server"`
functions in `apps/app/src/services/worker/*.service.ts` and `services/user/account.service.ts`: 9 files,
**6,962 lines, 53 exported actions**) that call Prisma directly with the NextAuth session. On top of that sit
**14 route handlers** under `app/api/worker/*` (1,713 lines), the upload routes (815 lines), and **three server
components that read Prisma directly** (the home page, `NewsSliderAsync`, `my-jobs`). Nothing on the dashboard calls
`apps/api`; no worker entry exists in `packages/api-contract`; the api admits only `ADMIN` today (the token path works
for every role; `route-security.test.ts:75` asserts a WORKER gets 403).

So "migrate the legacy api" means: give every worker read and write an entry in a new `worker.contract.ts`, bind the
handlers in `apps/api/src/modules/worker/`, and make the dashboard a client of the api (the admin search pattern:
`lib/api/admin.ts` + `features/admin-search/query.ts`); the server actions and the Prisma reads in the app go away.

## 2. The sidebar (`components/dashboard/Sidebar.tsx`, 467 lines)

Rendered by `components/dashboard/DashboardLayout.tsx`, which every worker page wraps itself in (the route layout
only gates auth). Current order:

| # | Item | Href | Built as |
|---|---|---|---|
| 1 | Edit profile (badge when completion < 80 %) | `/dashboard/worker/profile-building` | JSX (`:301`) |
| 2 | Edit services | `/dashboard/worker/services/manage` | JSX (`:311`) |
| 3 | Dashboard | `/dashboard/worker` | JSX (`:324`) |
| 4 | Personal Info (Your name, Profile photo, Your bio, Address, Other personal info) | `/dashboard/worker/account/setup?step=...` | `menuSections` array (`:148-179`), steps from `config/accountSetupSteps.ts` |
| 5 | Mandatory (dynamic from the worker's requirements) | `/dashboard/worker/requirements/setup?step=<docId>` | array |
| 6 | Trainings (dynamic) | `/dashboard/worker/trainings/setup?step=<docId>` | array |
| 7 | My Services (one per selected service) | `/dashboard/worker/services/setup?step=<slug>` | array |
| 8 | Additional Credentials (Additional Documents) | `/dashboard/worker/additional-documents` | array |
| 9 | My Jobs | `/dashboard/worker/my-jobs` | JSX (`:387`) |
| 10 | Account | `/dashboard/worker/account` | JSX (`:394`) |

The order is half data (items 4-8 from one array) and half hard-coded JSX (1-3, 9, 10). A reorder is best done by
making the whole menu one declaration (the codebase's "declare it once" rule) and rendering it. No separate mobile
nav: the same component slides in as a drawer. The sidebar itself fetches `GET /api/worker/profile/[userId]`
(re-fetched on every visit to `/dashboard/worker`), the profile preview (a server action) and the requirements.

## 3. The pages and what each one calls

| Page | Lines | Data path today |
|---|---|---|
| `/dashboard/worker` (home) | 145 | **Server component: Prisma** (`authPrisma.workerProfile`, completion status, jobs and pending applications via `NewsSliderAsync`), Upstash-cached; client: the profile route (polled every 2 s at first), `GET /api/geocode` (Nominatim), `POST /api/worker/jobs/apply`, then a **hard-coded n8n webhook called from the browser** (`ApplyModal.tsx:13`) |
| `/profile-building` ("Edit profile") | 152 | sections by `?section=`: Preferred hours, Experience (sub-areas from `@remonta/schemas`), Bank account, Work history, Education, Good to know, Languages, Cultural background, Religion, Interests, About me, Preferences, Personality. **13 server actions** (`availability`, `experience`, `additionalInfo` services); reads `getWorkerAdditionalInfo`. Locations, Rates and NDIS sections exist but are not rendered |
| `/account/setup?step=` ("Personal Info") | 572 | 5 steps: name, photo, bio, address, personal info. **Server actions** `updateWorkerName/Photo/AdditionalPhotos/swapMainPhoto/Bio/Address/PersonalInfo/ABN` (`profile.service.ts`); photo via `POST /api/upload/worker-photo` (Vercel Blob, **no auth**); address via `GET /api/suburbs` then **Google geocode** and a write of the legacy columns `location/city/state/postalCode/latitude/longitude` (`profile.service.ts:535-563`), the only dashboard writer of those columns; unknown steps go to `POST /api/worker/profile/update-step` |
| `/services/manage` ("Edit services") | 184 | `POST /api/worker/profile/update-step` step 101 (rewrites `worker_services` in a transaction), `deleteWorkerService`, `GET /api/categories` |
| `/services/setup` | 739 | `GET /api/worker/services`, `/api/worker/service-documents`, `/api/subcategories`; actions `toggleWorkerSubcategory`, nursing and therapeutic registrations, `uploadServiceDocument` (Blob); update-step 100+n (**saves nothing** for n >= 3: the route's `default: break`) |
| `/services/[serviceName]/documents` | 498 | `POST /api/upload/service-documents`, `DELETE /api/worker/service-documents`, requirements by service |
| `/requirements/setup` (Mandatory) | 521 | `GET /api/worker/requirements`, `/api/worker/compliance-documents` (+PATCH), `/api/worker/identity-documents` (+DELETE), `/api/worker/other-requirements` (+DELETE `[id]`), `POST /api/compliance/upload` through a background queue (Blob, 20/min per user), actions `updateWorkerABN`, `uploadComplianceDocument`, `deleteComplianceDocument`, `autoUpdateComplianceCompletion` |
| `/trainings/setup` | 316 | the same hooks; `autoUpdateTrainingsCompletion` |
| `/additional-documents` | 165 | update-step 300 (**saves nothing**), `uploadServiceDocument`, identity documents |
| `/profile-preview` | 246 | `getProfilePreviewData` (action); photo change = upload route + `updateWorkerPhoto` + a full reload |
| `/contract/[type]` | 34 | `updateWorkerABN`, `uploadComplianceDocument` |
| `/my-jobs` | 343 | **Server component: Prisma** (profile + applications); withdraw via `PATCH /api/worker/jobs/apply` |
| `/account` | 12 | `updateUserEmail`, `updateUserPassword` (actions, then sign-out) |

Hand-built throughout: `useState` + React Query, no react-hook-form, no form engine (the registration wizard is its
only user). Two React Query hooks share the `['worker-profile']` key prefix with different payloads; two pages mount
their own `QueryClient`. Caches to replace: Upstash keys `worker_profile`, `completion_status`, `active_jobs`,
`worker_profile_base` (invalidated inconsistently: the profile actions clear one key, the upload routes another);
`revalidatePath`/`revalidateTag` in the actions.

## 4. The route handlers (33 files in scope, 4,234 lines)

Full per-route detail (methods, auth, tables, callers, risks) is in `worker-profile-routes.md`; the facts that matter:

- **Tables**: everything is the auth database (`packages/db/prisma/schema.prisma`, 33 models): `worker_profiles`
  (47 columns), `verification_requirements`, `worker_services`, `Category`/`Subcategory`/`Document` (+ join tables),
  `jobs`, `job_applications`, `worker_additional_info`, `worker_job_history`, `worker_education`, `worker_experience`,
  `worker_availability`, `au_localities`. The api's Prisma client is generated from the same schema, so every table is
  already reachable from `apps/api`.
- **No validation library in any route**; `any`-typed bodies; `update-step` step 7 writes columns that do not exist
  (always 500); impersonation is never distinguished from the worker (`session.user.impersonatedBy` is set but unread).
- **Shared with other callers, so they stay until their callers move**: `/api/suburbs` (client, coordinator, admin,
  and `apps/web` through a proxy), `/api/categories` (client, coordinator), `/api/upload/worker-photo` (the admin
  photo picker), `/api/share/*` (admin + the public share page), `/api/contractors*` (public search), `/api/geocode`.
  The api already serves two of these needs publicly: `GET /v1/localities` and `GET /v1/service-categories`
  (the registration wizard uses them).
- **No caller found (candidates for deletion, not migration)**: `identity-documents/copy-reference`,
  `worker/vehicle-photo`, `upload/{vehicle-photo,certificates,identity-documents,other-requirements}`,
  `blob/upload-token`, `worker/jobs` GET.
- **Documents live on Vercel Blob** (put/del in routes and actions); the sign-up photo alone is on Cloud Storage.
  Deletes orphan blobs (identity, service documents) or delete a blob another row may share (other-requirements).

### Risks found that do not wait for the cycle

1. **Per-user data under a public CDN cache header.** `app/api/worker/requirements/route.ts:188` sends
   `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` and `app/api/worker/other-requirements/route.ts:65`
   `public, s-maxage=60`. Both are session-authenticated and the URL carries no user id, so Vercel's edge can serve
   one worker's requirements to the next worker for 30-60 s. One line each to fix.
2. **`POST /api/upload/worker-photo` has no authentication and no rate limit**: anyone can fill the Blob store.
3. **`POST /api/sms/send-verification` has no authentication and no rate limit** (Twilio cost), and the verify step
   cannot succeed: the two routes keep separate in-memory maps. Whether any live flow depends on it was not traced.
4. `/api/contractors` exposes contractor email and phone publicly and accepts `limit=all`.

## 5. The api as it stands (the structure review the goal asked for)

`apps/api/src`: 66 files, 5,008 lines (the 2026-10-08 pass counted 4,109; 14 commits since: the JWT authenticator,
the admin module, private caching with ETag, the response memo). `packages/api-contract/src`: 12 files, 1,003 lines.

**Adding a worker area costs exactly:** `worker.contract.ts` (entries with `meta()`, every one with `access` and
`rateLimit`), its export in `index.ts`, `modules/worker/worker.handlers.ts` in `main.ts`'s handler sets, a line per
public entry in `public-endpoints.json`, the regenerated `openapi.json`, and `unreachableHandlers(workerContract)` in
each test harness (`d943f96` had to do this for admin). The boot refuses an unbound entry; the pipeline supplies
request id, security headers, shedding, HTTPS, CORS, body limit, rate limits (Postgres buckets, consistent across
instances), CAPTCHA, auth (HS256 JWT, `kid` rotation, `act` impersonation as `impersonatorId` in every log line),
roles, strict validation, memo, output shaping, audit, ETag/304, the error envelope. Handlers get `{db, clock}` and
`unitOfWork` (ReadCommitted, 10 s).

**Concurrency model, measured from the table (`infra/lib/stages.ts`) and the code:**

| | staging | prod |
|---|---|---|
| instances min / max | 1 / 1 | 1 / **4** |
| requests per instance (Cloud Run `containerConcurrency`) | 80 | 80 |
| vCPU / memory | 1 / 512Mi | 1 / 1Gi |
| `MAX_IN_FLIGHT` (shedder) | 64 | **128 (unreachable above 80)** |
| event-loop shed threshold | 200 ms p99 | 200 ms p99 |
| Prisma pool per instance | 5 | 5 (**20 connections at full scale**, shared with the outbox, jobs, probes) |
| process model | one Node process; `worker_threads` only for bcrypt; no `cluster` | same |

So prod serves at most **320 requests in flight** (4 x 80) and holds at most 20 database connections. Horizontal
scaling is already the model: the instances are stateless for correctness (rate limits, outbox claims with
`FOR UPDATE SKIP LOCKED`, and scheduler leases live in Postgres), and only caches are instance-local (the 500-entry
response memo, the locality directory). "Worker servers" in the user's words maps to **more Cloud Run instances of
the same stateless service** (raise `maxInstances`, keep `concurrency`, size the pool and Neon's pooler to match), not
to a different kind of server; the background work (the outbox dispatcher every 2 s, four scheduled jobs) already runs
on every instance behind database leases. Not found in the repository: whether the pooled Neon URL carries
`pgbouncer=true` (the app's client adds it; the api's does not), which matters for the api's interactive transactions
and `SET LOCAL` once writes multiply.

**What "10,000 users at the same time" needs, in numbers.** 10,000 workers signed in and active in the same hour,
each dashboard page making 3-6 calls, is in the order of 10-30 requests per second averaged and a few hundred at
a burst; 10,000 **simultaneous requests** is a different target (about 125 instances at 80 each). The first is within
reach of the present shape with a raised instance ceiling, a pool sized for it, and the worker reads made cheap (one
statement per page, private caching + ETag as the admin list has). The second needs the number stated and a load test
to prove it. The question file asks which is meant.

**Maintainability, open from the 2026-10-08 assessment and new:** the deploy gate runs the api tests without a
database (`deploy-api.yml:75`); rate-limit keys store raw IPs; `IP_HASH_SECRET` doubles as the email-code key;
`DenyAllAuthenticator` is dead; OpenAPI omits the 304 and 503 the admin entries return; `Prisma.raw` slips past the
raw-SQL Semgrep rule; the worker row is selected twice (raw SQL in the search, Prisma in the lists); `MAX_IN_FLIGHT`
above `concurrency` on prod; the health entry is rate-limited, so every probe does a database upsert first.

## 6. What "Edit Profile" is

Two pages edit the profile and both are hand-built: the sidebar's **Edit profile** (`/profile-building`: experience,
hours, and the 11 "additional details" sections, 13 server actions on four tables) and **Personal Info**
(`/account/setup`: name, photo, bio, address, personal info, 8 server actions on `worker_profiles`, the legacy
location write and the Blob photo). The question file asks which one the first unit is.

## 7. Boundaries the inventory suggests (for the requirements, not decided)

- A new contract area `worker` (`/v1/worker/...`, `access: {roles: ['WORKER']}`, the principal's own profile only:
  the user id comes from the token, never from the request); per-user rate limits; private caching + ETag on reads.
- Form definitions on the form engine for the edited sections (validation from the contract entry, the on-device
  draft, retries) instead of `useState` pages, one section per definition.
- The address edit picks a suburb from `au_localities` (`GET /v1/localities`) and the api places the HOME row with
  `placeHome` (`source` to decide) and dual-writes the legacy columns as the sign-up does: no Google geocode, and the
  same code path as the admin set-suburb control (follow-up 17).
- The three Prisma-reading server components become client reads of worker entries (the home page summary, the
  applications list), and Upstash disappears from the worker dashboard: the api's private caching replaces it.
- Uploads: either the sign-up's ticket/confirm pattern on Cloud Storage (follow-up 11) or the Blob routes left in the
  app for now. The question file asks.
- The n8n webhook called from the browser becomes an outbox handler (follow-up 2's pattern) or stays, by decision.
