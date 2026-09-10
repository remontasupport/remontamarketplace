# Phase 2 — Actors and permissions

## 2.1 Human actors

Derived from `UserRole` (`prisma/auth-schema.prisma:495-500`), `src/types/auth.ts:10-15`,
`middleware.ts:33-55`, per-route gates, and page-level guards.

### Worker — the supply side
- **Enters by:** self-service signup at `/registration/worker`, which posts to
  `POST /api/auth/register-async` (`src/app/registration/worker/page.tsx:212`). Account is
  created `status: 'ACTIVE'` immediately, with `isPublished: false`,
  `verificationStatus: 'NOT_STARTED'`, `profileCompleted: false`
  (`src/lib/workers/workerRegistrationProcessor.ts:86,102-105`). **No email verification,
  no admin approval, no waitlist** — the gate is publication, not registration.
  A worker can also arrive from a recruitment link carrying `zohoLeadId`
  (`src/app/api/auth/register-async/route.ts:52`).
- **Can see:** their own profile and onboarding wizards (`/dashboard/worker/*`), the full
  list of active recruitment vacancies (`/dashboard/worker/my-jobs`, and the whole active
  jobs table is sent to every worker on every dashboard render — audit DB-05), their own
  compliance document statuses, the worker contract and code of conduct
  (`/dashboard/worker/contract/[type]`), and a preview of how their public profile looks
  (`/dashboard/worker/profile-preview`).
- **Can do:** build a profile across four wizard sections; upload compliance documents;
  declare service lines, specialisations, skills and offerings; elect ABN or TFN
  engagement and sign; enter bank account details; set availability and preferred hours;
  apply to and withdraw from vacancies; submit a recruitment application to Zoho
  (`/apply?recruitmentId=…`).
- **Cannot do:** publish themselves (`isPublished` is admin-only,
  `api/admin/compliance/[id]/publish`); approve their own documents; see any client,
  coordinator, participant or service request; see other workers; set a rate or a price
  (no such field exists anywhere); message anyone.

### Client — the demand side, arranging support for themselves or a relative
- **Enters by:** self-service signup at `/registration/clients` →
  `POST /api/auth/register/client` (`src/app/registration/clients/page.tsx:176`). Creates
  `User` + `ClientProfile` + **one `Participant`** in a single nested write
  (`src/app/api/auth/register/client/route.ts:60-91`). `status: 'ACTIVE'` immediately.
- **Declares at signup:** `completingFormAs` — `'self' | 'client' | 'coordinator'`
  (`src/schema/registrationSchema.ts:116`). On `'self'`, the registrant *is* the
  participant and `isSelfManaged` is set true on both records (`:72,83`).
- **Can see:** their own participants and service requests, worker search results
  (published workers only), and a worker's full public profile.
- **Can do:** add and edit participants; raise, edit, cancel, reactivate and archive
  service requests; shortlist and deselect workers on a request.
- **Cannot do:** see a worker's compliance documents or identity documents; see another
  client's participants (ownership is checked per route); assign a worker (assignment is
  `assignedWorker Json?` written by staff/webhook, not by a client route); pay for
  anything.

### Support coordinator — the demand side, acting professionally for several participants
- **Enters by:** self-service signup at `/registration/clients` (the *same* page, branching
  on a choice) → `POST /api/auth/register/coordinator`
  (`src/app/registration/clients/page.tsx:162`). Creates `User` + `CoordinatorProfile`
  only.
- **Declares at signup:** `organization` (optional) and `clientTypes: string[]` — the kinds
  of participants they support (`src/schema/registrationSchema.ts:61,64`).
- **Functionally identical to a client.** The coordinator dashboard
  (`/dashboard/supportcoordinators/*`) is a near-verbatim copy of the client dashboard
  (audit STR-02, ~4 000 duplicated lines), and every demand-side API route accepts both
  roles interchangeably (`api/client/*` gates on `CLIENT` **or** `COORDINATOR`).
  **INFERRED, high confidence:** the two roles exist to differentiate reporting and CRM
  routing, not capability. Nothing in the code gives a coordinator a power a client lacks.
- **Notable defect worth business attention:** the coordinator signup route's own docblock
  says it creates "User + CoordinatorProfile + Participant + ServiceRequest"
  (`src/app/api/auth/register/coordinator/route.ts:4-7`) and documents inbound
  `clientFirstName`, `clientLastName`, `clientDateOfBirth`, `servicesRequested`,
  `location` (`:18-23`). The zod schema that actually validates the body
  (`src/schema/registrationSchema.ts:56-75`) **declares none of those fields**, so zod
  strips them and the code creates only the user and profile (`:104-126`). **Any
  participant or service-need information a coordinator enters at signup is silently
  discarded.** The client route retains its participant creation; the coordinator route
  lost it.

### Administrator — Remonta staff
- **Enters by:** **no self-service path exists.** Admins are created by running
  `scripts/create-admin-user.ts` or `scripts/promote-to-admin.ts` against the database.
  There is no invite flow, no admin-creates-admin route.
- **Can see:** every worker profile and every compliance document including the file URLs
  (`/admin/contractors`, `/admin/compliance/[id]`); every user
  (`GET /api/admin/users`); daily, weekly and worker-statistics reports; signed agreement
  reports (`GET /api/admin/reports/agreement/[type]`).
- **Can do:** approve, reject and reset individual compliance documents; set a document's
  expiry date; publish a worker profile; suspend or reactivate an account
  (`PATCH /api/admin/contractors/[id]/status`); **sign in as any active user**
  (`POST /api/admin/impersonate`); generate a shareable link to a worker profile
  (`POST /api/share/generate`); run a natural-language worker search
  (`POST /api/admin/ai-search`).
- **Cannot do (no code path):** create or edit a service request; assign a worker to a
  request; edit a worker's profile content; create another admin; delete a user; change
  a user's role.
- **There is no `SUPER_ADMIN`.** Four routes gate on one anyway — two write
  `UserRole.SUPER_ADMIN`, which is `undefined` at runtime
  (`api/admin/contractors/[id]/status/route.ts:18`,
  `api/admin/contractors/inactive/route.ts`), and two write the string cast
  `'SUPER_ADMIN' as UserRole` (`api/admin/compliance/compliant/route.ts:13`,
  `api/admin/compliance/[id]/publish/route.ts`). Net effect: these four gates admit only
  `ADMIN`, as intended, but the *intent* was a two-tier admin model that was never built.

## 2.2 Non-human actors

| Actor | How it authenticates | What it does | State |
|---|---|---|---|
| **Vercel Cron** | `Authorization: Bearer ${CRON_SECRET}` (`api/cron/sync-jobs/route.ts:15`) | Hourly (`vercel.json:5`), triggers the Zoho recruitment-lead sync | **Broken** — HTTP-calls `localhost` from a Lambda (audit API-07) |
| **Internal sync caller** | `x-api-secret: ${SYNC_API_SECRET}` | `POST /api/sync-jobs`, `POST /api/refresh-jobs`, `GET /api/zoho/leads` | `/api/sync-jobs` and `/api/refresh-jobs` reachable; `/api/zoho/leads` has **0 in-repo callers** |
| **n8n** | none inbound; outbound only | Receives worker registrations (`api/auth/register-async/route.ts:112` — **hardcoded URL**), recruitment applications (`api/apply`), admin chat messages (`api/admin/chat`) | Registration push is live; chat is not configured |
| **Zoho CRM** | OAuth refresh-token grant (`src/lib/zoho.ts`) | Source of truth for recruitment vacancies; destination for registrations and service-request events | Inbound sync broken; outbound webhooks fire-and-forget |
| **Zoho service-request webhooks** | none — five URL env vars | Notified on service-request create, cancel, archive, worker-cancellation and reactivation | Fire-and-forget, no retry, no dead-letter (audit XC-02) |
| **External marketing site** | none | Consumes `GET /api/public/workers` — **0 in-repo callers**, no auth, no rate limit (audit XC-04) | Live and unprotected |
| **Anonymous share-link holder** | encrypted token in the URL (`src/lib/shareToken.ts`) | Views one worker's profile at `/share/profile/[token]` via `GET /api/share/profile` | Live |
| **Anonymous internet** | none | Can reach: `/api/upload/worker-photo` (50 MB, public blob), `/api/admin/fix-qualifications` (full-table rewrite), `/api/sms/send-verification` (Twilio spend), `/api/auth/send-otp` (email spend), `/api/geocode`, `/api/contractors`, `/api/contractors/[id]`, `/api/jobs`, `/api/public/workers`, `/api/categories`, `/api/subcategories`, `/api/suburbs` | See §2.4 |

## 2.3 Permissions matrix

Rows are actors; columns are business operations. **A** = allowed, **A(own)** = allowed on
own records only, **—** = no code path, **⚠** = allowed but the UI implies otherwise.
Every cell is cited in §2.5 or in the route matrix below.

| Operation | Anon | Worker | Client | Coordinator | Admin | Cron/secret |
|---|---|---|---|---|---|---|
| Create own account | A | A | A | A | — (script only) | — |
| Edit own profile | — | A(own) | A(own) | A(own) | — | — |
| Upload a compliance document | — | A(own) | ⚠ A | ⚠ A | — | — |
| Read a worker's compliance document record | ⚠ A | A(own) | — | — | A | — |
| Approve / reject / reset a document | — | — | — | — | A | — |
| Set a document's expiry date | — | — | — | — | A | — |
| Publish a worker profile | — | — | — | — | A | — |
| Suspend / reactivate an account | — | — | — | — | A | — |
| Search published workers (authenticated) | — | — | A | A | A | — |
| Search published workers (public feed) | A | A | A | A | A | — |
| Search CRM contractor directory | A | A | A | A | A | — |
| View a worker's full public profile | A (token) | — | A | A | A | — |
| Create / edit a participant | — | — | A(own) | A(own) | — | — |
| Create / edit a service request | — | — | A(own) | A(own) | — | — |
| Shortlist workers on a request | — | — | A(own) | A(own) | — | — |
| Assign a worker to a request | — | — | — | — | — | A (webhook) |
| Cancel / archive / reactivate a request | — | — | A(own) | A(own) | — | A (webhook) |
| List active vacancies | A | A | A | A | A | — |
| Apply to / withdraw from a vacancy | — | A | — | — | — | — |
| Submit a recruitment application to Zoho | — | A | — | — | — | — |
| Impersonate a user | — | — | — | — | A | — |
| Generate a profile share link | — | — | — | — | A | — |
| Run natural-language worker search | — | — | — | — | A | — |
| Run reports | — | — | — | — | A | — |
| Trigger the Zoho vacancy sync | — | — | — | — | — | A |
| Rewrite all qualification names | ⚠ A | ⚠ A | ⚠ A | ⚠ A | A | — |
| Upload an arbitrary 50 MB public file | ⚠ A | A | A | A | A | — |
| Send an SMS / an OTP email | ⚠ A | A | A | A | A | — |

## 2.4 Where the UI's intention and the API's actual rule disagree

The UI hiding a button is a product intention. What the API permits is the rule. Six
disagreements, each a business risk statement rather than a bug report:

1. **The "admin only" contractor directory is open to the internet.**
   `/remontaadmin/findsupport` sets `title: 'Find Support - Admin | Remonta Services'` and
   `description: '… Admin access only'` (`src/app/remontaadmin/findsupport/page.tsx:5-6`),
   but the path is not in the middleware matcher (`middleware.ts:65-69`) and the page
   performs no session check. Its data endpoint `GET /api/contractors` has rate limiting
   and **no authentication** (`src/app/api/contractors/route.ts:47-52`); the
   single-contractor endpoint `GET /api/contractors/[id]` has **neither**. Anyone who
   knows the URL can browse and page through the CRM-sourced contractor directory
   including name, email, phone, city, gender and profile picture
   (`prisma/schema.prisma:14-34`).

2. **A worker's identity documents can be read before any authentication runs.**
   Three of the five admin compliance mutation routes read the document record and return
   it — including `documentUrl`, the public blob URL of a passport, birth certificate,
   police check or NDIS screening check — *before* calling `requireRole`
   (`api/admin/compliance/[id]/[documentId]/approve/route.ts:25-46` vs `:57`; same in
   `reject/route.ts:36,52` vs `:68` and `reset/route.ts:25,41` vs `:48`). The admin UI
   correctly shows these actions only to admins; the API does not enforce it.

3. **Every authorisation failure on ~18 admin routes returns HTTP 500, not 403.**
   `requireRole`/`requireAnyRole` throw (`src/lib/auth.ts:70-90`) into the handler's
   generic `catch`. The business consequence: a permission denial is
   indistinguishable from an outage in any log or alert, and one route decides
   authorisation by string-matching an error message
   (`api/admin/users/route.ts:109`).

4. **Coordinator dashboard pages are role-checked in the page, not in the middleware.**
   `middleware.ts:41-46` checks the COORDINATOR role on `/dashboard/coordinator` — a path
   that does not exist. The real path is `/dashboard/supportcoordinators`
   (`src/types/auth.ts:97`), which falls through the middleware with authentication only.
   Seven of the nine coordinator pages re-check the role themselves (e.g.
   `src/app/dashboard/supportcoordinators/page.tsx:24-26`), but the two
   `request-service/edit/[participantId]` pages are `"use client"` and carry **no
   server-side role guard** — any authenticated user can load that page shell. Data
   access is still gated by the API's ownership checks.

5. **Compliance document upload is not restricted to workers.**
   `POST /api/compliance/upload` checks only that a session exists — no role gate
   (route matrix, §2.5). In practice a client or coordinator has no `WorkerProfile` so the
   write has nowhere to land, but the rule is "any authenticated user", not "workers".

6. **A one-off data migration is exposed as an unauthenticated endpoint.**
   `POST /api/admin/fix-qualifications` sits under `/api/admin/` — which reads as
   protected and is not, because middleware never covers `/api/*`
   (`middleware.ts:65-69`) and the handler has no gate. It rewrites every
   non-mandatory compliance document name in the table (audit API-12). Zero in-repo
   callers.

Two positive findings worth recording, since they are the checks protecting regulated
data: `GET /api/worker/profile/[userId]` enforces `session.user.id !== userId → 403`
(audit §6 Path B step 3), and every `api/client/*` route filters participants and service
requests by the session user. Those ownership checks are the only barrier between one
client's participant health data and another's — and they have **zero test coverage**
(audit XC-07).

## 2.5 Route-level authentication inventory (all 86 routes)

Method → gate → roles admitted. `NONE` means no authentication of any kind.

**Admin (23 routes)** — all `requireRole(ADMIN)` except as noted:
`/admin/ai-search` · `/admin/chat` · `/admin/compliance/[id]` ·
`/admin/compliance/[id]/[documentId]/{approve,reject,reset,update-expiry}` ·
`/admin/compliance/pending` · `/admin/contractors` · `/admin/contractors/[id]` ·
`/admin/contractors/[id]/pdf` · `/admin/filters` · `/admin/impersonate` (POST + DELETE) ·
`/admin/reports/{daily,weekly,worker-statistics,agreement/[type]}` · `/admin/users` ·
`/admin/verification`.
`requireAnyRole([ADMIN, SUPER_ADMIN])` — admits ADMIN only: `/admin/compliance/publish` ·
`/admin/compliance/compliant` · `/admin/contractors/[id]/status` ·
`/admin/contractors/inactive`.
**`NONE`: `/admin/fix-qualifications`.**

**Worker (16 routes)** — session required; ownership resolved from the session:
`/worker/profile/[userId]` (explicit ownership check) · `/worker/profile/update-step` ·
`/worker/requirements` · `/worker/services` · `/worker/service-documents` ·
`/worker/compliance-documents` · `/worker/identity-documents` (+ `/copy-reference`) ·
`/worker/other-requirements` (+ `/[id]`) · `/worker/vehicle-photo` · `/worker/jobs` ·
`/worker/jobs/apply` (both gate on `WORKER`) · `/compliance/upload` (session only) ·
`/apply` (session + `WORKER`) · `/blob/upload-token` (session, **0 callers**).

**Uploads (6 routes)** — session required: `/upload/{certificates,identity-documents,
other-requirements,service-documents,vehicle-photo}`. **`NONE`: `/upload/worker-photo`.**

**Demand side (8 routes)** — session + `CLIENT` or `COORDINATOR`:
`/client/participants` (+ `/[id]`) · `/client/service-request` (+ `/[id]`,
`/[id]/select-worker`, `/[id]/reactivate`) · `/client/workers` · `/client/workers/by-ids`.
Session-only (no role gate): `/client/service-request/action-webhook`.
`COORDINATOR` only: `/coordinator/profile`.

**Auth (10 routes)** — rate-limited, unauthenticated by design:
`/auth/[...nextauth]` · `/auth/register` · `/auth/register-async` ·
`/auth/register/{client,coordinator}` · `/auth/forgot-password` · `/auth/reset-password` ·
`/auth/setup-password`.
**`NONE` and unrate-limited: `/auth/send-otp` · `/auth/verify-otp` · `/auth/check-email`.**

**Public / reference (10 routes)**, all `NONE`:
`/jobs` · `/public/workers` · `/categories` ·
`/categories/therapeutic-supports/subcategories` · `/subcategories` · `/suburbs` ·
`/geocode` · `/share/profile` (token-gated) · `/articles` · `/articles/[slug]`.
`/contractors` has rate limiting only; `/contractors/[id]` has nothing.

**Machine (4 routes)** — shared-secret header:
`/cron/sync-jobs` (`CRON_SECRET`) · `/sync-jobs` POST + `/refresh-jobs`
(`SYNC_API_SECRET`) · `/zoho/leads` (`SYNC_API_SECRET`, **0 callers**).
`GET /sync-jobs` returns per-instance sync state with **no auth** (audit API-08).

**Dead / disconnected: `/sms/send-verification` · `/sms/verify-code`** — no auth, and
their only consumers are two files with zero consumers of their own
(`src/hooks/usePhoneVerification.ts`, `src/utils/phoneVerificationUtils.ts`).

## 2.6 Correction to the audit — audit trail coverage

The audit states the `AuditAction` enum's 14 values are used for only 3 actions
(audit XC-02). Re-derived from every `auditLog.create` site, **7 of 14 are written**:
`LOGIN_SUCCESS` (`src/lib/auth.config.ts:147`, and reused for registration in all three
signup paths, e.g. `workerRegistrationProcessor.ts:210`), `LOGIN_FAILED`
(`auth.config.ts:118`), `PASSWORD_RESET_REQUEST` (`api/auth/forgot-password/route.ts:118`),
`PASSWORD_RESET_SUCCESS` (`api/auth/reset-password/route.ts:104`,
`api/auth/setup-password/route.ts:150`), `PROFILE_UPDATE` (7 sites across participants and
service requests), `IMPERSONATION_START` and `IMPERSONATION_END`
(`api/admin/impersonate/route.ts:72,87,181,194`).

Never written: `LOGOUT`, `PASSWORD_CHANGE`, `EMAIL_CHANGE`, `ACCOUNT_LOCKED`,
`ACCOUNT_UNLOCKED`, `EMAIL_VERIFIED`, `ROLE_CHANGE`.

**The business-critical gap is not the enum coverage — it is which decisions go
unrecorded.** `src/app/api/admin/` contains exactly one file that writes an audit log:
`impersonate/route.ts`. **No audit record is created when an administrator approves a
compliance document, rejects one, resets one, changes its expiry date, publishes a worker
profile, or suspends an account.** For a business whose entire control model is
"an administrator checked this", there is no record that any administrator checked
anything.

The only code that *would* audit a verification decision —
`approveWorkerVerification` / `rejectWorkerVerification` in `src/lib/verification.ts:120-160`
— is **dead and non-functional**: it writes `verificationSubmittedAt`,
`verificationReviewedAt`, `verificationApprovedAt` and `verificationNotes`, none of which
exist on `WorkerProfile` (`prisma/auth-schema.prisma:203-260`). Its only importer is
`GET/POST /api/admin/verification`, which has zero UI callers. This is an abandoned
first design of the verification workflow, superseded by the per-document
`/api/admin/compliance/*` routes — which do the job without the audit trail.
