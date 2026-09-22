# Phase 3 — Feature inventory, grouped by user journey

Classification: **Live** (reachable from the UI, complete handler, no dead config
dependency) · **Partial** (built but gated, unreachable, or missing a step) ·
**Dead** (code exists, nothing calls it) · **Phantom** (config, dependencies or types
exist for a capability never built).

## J1 — Worker acquisition and registration

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 1.1 | Four-step worker signup: location → personal info → services & specialisations → photo + consent | Anon | **Live** | `src/app/registration/worker/page.tsx:292-357`, `TOTAL_STEPS = 4` (`src/constants/index.ts`) |
| 1.2 | Suburb autocomplete during signup | Anon | **Live** | `src/components/forms/workerRegistration/Step1Location.tsx` → `GET /api/suburbs` |
| 1.3 | Service-line and specialisation picker driven by the live catalogue, falling back to hardcoded options | Anon | **Live** | `src/app/registration/worker/page.tsx:42` — `if (!categories) return SERVICE_OPTIONS` |
| 1.4 | reCAPTCHA on signup | — | **Partial** | Verified only `if (recaptchaToken)` is present (`api/auth/register-async/route.ts:57`) — a caller that omits the field skips the check entirely |
| 1.5 | Account creation, geocoding, and worker-service records | Anon | **Live** | `src/lib/workers/workerRegistrationProcessor.ts:59-198` |
| 1.6 | Registration pushed to the CRM via n8n | System | **Live** | `api/auth/register-async/route.ts:112` — the n8n URL is **hardcoded** in source, so this fires regardless of `N8N_WEBHOOK_URL`. **Corrects audit XC-02**, which concluded registrations may never reach the CRM |
| 1.7 | Signup arriving from a recruitment lead (`zohoLeadId` passthrough) | Anon | **Partial** | Accepted and forwarded (`api/auth/register-async/route.ts:52,124`) but **never stored** — no column exists, so attribution lives only in n8n |
| 1.8 | The original worker-registration endpoint | — | **Dead, and broken** | `POST /api/auth/register` references an undeclared variable `photos` at `route.ts:150`; it is never destructured (`:82-99`). Any call throws `ReferenceError` into the inner catch (`:450`) and returns HTTP 500. **Zero UI callers** — the live path is `register-async`. The only reference is a doc comment in `src/utils/apiRetry.ts:48` |
| 1.9 | Mobile-number verification by SMS during signup | Worker | **Dead** | `Step7Verification.tsx` is **not mounted** in the 4-step wizard; `src/hooks/usePhoneVerification.ts` and `src/utils/phoneVerificationUtils.ts` have zero consumers; the two `/api/sms/*` routes store codes in **two different in-module `Map`s** and can never agree (audit XC-03) |
| 1.10 | Email verification of a worker's address | — | **Phantom** | `AccountStatus.PENDING_VERIFICATION` (`prisma/auth-schema.prisma:460`) is never written; `AuditAction.EMAIL_VERIFIED` never written; `sendWelcomeEmail` ("🎉 Email Verified!") has zero callers (`src/lib/email.ts:186`); `/auth/verify-email` calls `POST /api/auth/verify-email`, **which does not exist**, and links to `/auth/resend-verification`, **which does not exist** (`src/app/auth/verify-email/page.tsx:39,128`). Yet `register-async` tells the user "Please check your email to verify your account" (`api/auth/register-async/route.ts:135`) |
| 1.11 | Worker registration success page | Anon | **Live** | `src/app/registration/worker/success/page.tsx` |

## J2 — Worker onboarding (profile, compliance, services)

The sidebar defines five sections in this order (`src/components/dashboard/Sidebar.tsx:147-178`):
**Personal Info → Mandatory → Trainings → My Services → Additional Credentials.**

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 2.1 | Account setup wizard: name → photo → bio → address → other personal info | Worker | **Live** | `src/config/accountSetupSteps.ts:21-27` |
| 2.2 | Profile-building sections: work history, education, languages, cultural background, religion, interests, about me, personality, good-to-know, locations, preferences, preferred hours, experience, NDIS screening, bank account | Worker | **Live** (15 of 16 sections) | `src/components/profile-building/sections/` |
| 2.3 | **Indicative hourly rates** — weekday, Saturday, Sunday, public holiday | Worker | **Dead** | `IndicativeRatesSection.tsx` is a complete form with `handleSave` **an empty function body** (`:20-22`), **zero consumers**, and no rate column anywhere in either schema. See §3.1 |
| 2.4 | Requirements engine: derives each worker's document obligations from their chosen services, grouped into base compliance / trainings / qualifications / insurance / transport | Worker | **Live** | `api/worker/requirements/route.ts:16-90` |
| 2.5 | Mandatory-requirements wizard: worker screening → police check → working with children → NDIS orientation → NDIS training → infection control → other requirements | Worker | **Live** | `src/config/mandatoryRequirementsSetupSteps.ts:27-70` |
| 2.6 | Document upload with type/size validation, streamed to blob storage | Worker | **Live** | `api/compliance/upload/route.ts:94-290` |
| 2.7 | Background upload queue (concurrent uploads without blocking the wizard) | Worker | **Live** | `src/lib/backgroundUploadQueue.ts` (added 2026-03-26, `b3133d7`) |
| 2.8 | 100-point identity document set, plus copy-a-reference-document | Worker | **Live** | `api/worker/identity-documents`, `.../copy-reference` |
| 2.9 | Right-to-work evidence with conditional upload | Worker | **Live** | `StepRightToWork` (`src/config/complianceDocumentMapping.ts:130-134`) |
| 2.10 | ABN / TFN engagement election and contract signature | Worker | **Live** | `Step6ABN` (`:54-58`); `src/schema/workerProfileSchema.ts:173-183`; `src/config/contractContent.ts` |
| 2.11 | Code of Conduct, two parts with an internal stepper | Worker | **Live** | `StepCodeOfConduct` (`:141-146`); `src/config/codeOfConductContent.ts` |
| 2.12 | Service-specific qualification and document steps, generated per selected service | Worker | **Live** | `src/config/servicesSetupSteps.ts:38-56` |
| 2.13 | Skill and service-offering selection | Worker | **Partial** | Taxonomies exist for four service lines only (`src/config/serviceSkills.ts:22,370,637,842`); `getServiceOfferings` returns offerings **only** for Support Worker lines (`src/config/serviceOfferings.ts:73-83`). Therapeutic Supports, Home Modifications, Fitness and Rehabilitation and Personal Trainer have neither |
| 2.14 | Vehicle photo and certificates upload | Worker | **Live** | `api/upload/vehicle-photo`, `api/upload/certificates` |
| 2.15 | Bank-account capture | Worker | **Live** (stored) / **Dead** (used) | `src/schema/workerProfileSchema.ts:198-216`; stored as unencrypted `Json?` (`prisma/auth-schema.prisma:431`); **no code reads it for any purpose** |
| 2.16 | Availability and preferred hours | Worker | **Live** | `src/services/worker/availability.service.ts`; `PreferredHoursSection.tsx` |
| 2.17 | Setup-progress tracking and completion percentage | Worker | **Partial** | Live but **recomputed from scratch on every read** because the stored value is untrusted (audit FE-01, DB-07); the underlying `setupProgress` blob races itself |
| 2.18 | Profile preview ("how clients see you") | Worker | **Live** | `/dashboard/worker/profile-preview`; `src/services/worker/profilePreview.service.ts` |
| 2.19 | Direct upload via a client-side blob token | — | **Dead** | `POST /api/blob/upload-token` has **zero callers** |

## J3 — Worker compliance verification (the core control)

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 3.1 | Pending-verification queue | Admin | **Live** | `GET /api/admin/compliance/pending`; **no pagination parameter exists** (audit DB-05) |
| 3.2 | Verified-worker list | Admin | **Live** | `GET /api/admin/compliance/compliant` — defined as `isPublished: true` (`route.ts:16-19`) |
| 3.3 | Per-worker compliance detail with all documents and file links | Admin | **Live** | `GET /api/admin/compliance/[id]`; `/admin/compliance/[id]` page |
| 3.4 | Approve a document | Admin | **Live** | `.../approve/route.ts` — but authorises **after** reading and returning the record (audit API-01) |
| 3.5 | Reject a document with a mandatory reason | Admin | **Live** | `.../reject/route.ts:28-31,79-84` |
| 3.6 | Reset a reviewed document back to review, appending an audit note to `notes` | Admin | **Live** | `.../reset/route.ts:39-67` |
| 3.7 | Set or clear a document's expiry date | Admin | **Live** | `.../update-expiry/route.ts:29-46` |
| 3.8 | Publish / unpublish a worker profile | Admin | **Live** | `.../publish/route.ts:38-52`. Writes `verificationStatus: 'Verified'` — **a value absent from the `VerificationStatus` enum**; no other code recognises it |
| 3.9 | **Automatic document expiry** | System | **Phantom** | `RequirementStatus.EXPIRED` (`prisma/auth-schema.prisma:492`) is **never written by any code**. No cron, no read-time check. The admin UI merely renders a past date in red (`src/app/admin/compliance/[id]/page.tsx:409`). An expired police check has no effect on anything |
| 3.10 | Whole-profile approve/reject workflow with audit trail | Admin | **Dead, and non-functional** | `src/lib/verification.ts:120-200` writes `verificationSubmittedAt`, `verificationReviewedAt`, `verificationApprovedAt`, `verificationNotes` — **none of which exist on `WorkerProfile`**. Its only importer, `GET/POST /api/admin/verification`, has **zero UI callers**. This is the abandoned first design |
| 3.11 | One-off bulk rename of non-mandatory document names | Anon(!) | **Dead** | `POST /api/admin/fix-qualifications` — no auth, zero callers (audit API-12) |
| 3.12 | Notify a worker that a document was approved, rejected or expired | System | **Phantom** | No email, SMS or in-app notification exists for any compliance outcome. See Phase 5 |

## J4 — Demand-side: finding a worker

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 4.1 | Authenticated worker search: keyword, service filter, location + radius | Client, Coordinator | **Live** | `GET /api/client/workers`; `/dashboard/{client,supportcoordinators}/find-worker` |
| 4.2 | Semantic token classification — a token is routed to *services* or to *bio/hobbies/personality*, never both | Client, Coordinator | **Live** | `api/client/workers/route.ts:299-337,374-382` |
| 4.3 | **Restricting search results to verified, published workers** | — | **Phantom** | `buildWhereClause` filters on `user.status === 'ACTIVE'`, non-empty names, and (default browse only) a non-null bio — **`isPublished` and `verificationStatus` appear nowhere in the filter** (`api/client/workers/route.ts:352-396`). See §3.2 |
| 4.4 | Public worker feed for the marketing site | Anon | **Live**, unprotected | `GET /api/public/workers` — no auth, no rate limit, `within` uncapped (audit XC-04). Its docblock claims "Only published (`isPublished: true`) … are returned" (`route.ts:291`); the **only** occurrence of `isPublished` in the file is that comment (`buildWhereClause` at `:109-122`) |
| 4.5 | Search-radius correctness | Client, Coordinator | **Partial** | The result cache key omits `within`, so a 5 km and a 100 km search share one entry (audit API-11) |
| 4.6 | Full worker profile view | Client, Coordinator | **Live** | `/workers/[id]/profile`; `src/components/profile/WorkerProfileView.tsx` |
| 4.7 | Shareable profile link for someone without an account | Admin → Anon | **Live** | `POST /api/share/generate` (admin only) → `/share/profile/[token]` → `GET /api/share/profile`; AES-256-GCM token (`src/lib/shareToken.ts`) with a **hardcoded key fallback** (audit API-03) |
| 4.8 | CRM-sourced contractor directory | **Anon** | **Partial** | `/remontaadmin/findsupport` + `SearchSupport.tsx` + `GET /api/contractors` are all live, but the page is titled "Admin access only" and has **no authentication** (Phase 2 §2.4). Nothing in the repository ever *writes* `contractor_profiles`, so the data source is external and unverifiable from here |
| 4.9 | Denormalised "workers by area" directory | — | **Dead** | `ContractorsbyArea` (`prisma/schema.prisma:56-66`) — zero references in `src/` |
| 4.10 | Fourth worker-search implementation | — | **Dead** | `src/lib/worker-search.ts` — zero callers; notably it *does* filter `verificationStatus: 'APPROVED'` (`:95,284,316,350`), which no live search does |

## J5 — Demand-side: requesting support

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 5.1 | Add and edit participants | Client, Coordinator | **Live** | `api/client/participants`, `.../[id]` |
| 5.2 | Multi-step service-request builder: participant → services → where → when → funding/NDIS details | Client, Coordinator | **Live** | `/dashboard/{client,supportcoordinators}/request-service`; `RequestServiceContext.tsx` |
| 5.3 | Create a service request against a participant, with ownership check | Client, Coordinator | **Live** | `POST /api/client/service-request:60-88` |
| 5.4 | Push the request (with the participant's health conditions) to the CRM | System | **Partial** | `Request_Service_Webhook`, fire-and-forget, no retry, no dead-letter (`route.ts:105-127`). Set in `.env.local`; production presence unverifiable |
| 5.5 | Edit a request — **only while PENDING** | Client, Coordinator | **Live** | `api/client/service-request/[id]/route.ts:159-166` |
| 5.6 | Shortlist / deselect workers on a request | Client, Coordinator | **Live** | `.../select-worker/route.ts` (POST replaces the whole list; DELETE removes one) |
| 5.7 | Cancel a request, with a reason when it was active | Client, Coordinator | **Live** | `.../[id]/route.ts:102-133`; fires `Active_Request_Cancellation` or `Cancel_Archive_Webhook` |
| 5.8 | Archive a request; soft-delete an archived one via a `details._hidden` JSON flag | Client, Coordinator | **Live** | `.../[id]/route.ts:91-99,299-315` |
| 5.9 | Reactivate a cancelled request | Client, Coordinator | **Live** | `.../reactivate/route.ts:45-59` |
| 5.10 | Fire an arbitrary Cancel/Archive action to the CRM for **any** request id | Any signed-in user | **Live, and unowned** | `api/client/service-request/action-webhook/route.ts:6-27` — session required, **no ownership check, no role check** |
| 5.11 | Manage-requests table, archived list, completed list | Client, Coordinator | **Live** | `/dashboard/*/manage-request`, `/archived`; `/completed` exists for coordinators only |
| 5.12 | **Matching a worker to a request; marking a request MATCHED, ACTIVE or COMPLETED; recording the assigned worker; linking the request to its CRM record** | — | **Phantom in-product** | `MATCHED`, `ACTIVE` and `COMPLETED` are never written by product code; `assignedWorker` and `zohoRecordId` are **read in 12 places and written in none**. See §3.3 |
| 5.13 | Client intake by embedded Zoho form | Anon | **Live**, parallel to 5.1-5.3 | `/registration/client` (singular) is a full-page iframe of a Zoho public "Referral & Service Request Form" (`src/app/registration/client/page.tsx:35-38`), and it is where the site header's **"Find support"** points (`src/components/ui/layout/Header.tsx:22-23`) — not to the in-app wizard at `/registration/clients` |

## J6 — Recruitment (Zoho leads → vacancies → applications)

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 6.1 | Hourly sync of Zoho recruitment leads into the vacancy table | Cron | **Partial — cannot run** | `api/cron/sync-jobs/route.ts:15-22` HTTP-calls `localhost` from a serverless function; `CRON_SECRET` and `NEXT_PUBLIC_BASE_URL` set in neither env file (audit API-07) |
| 6.2 | Manual admin sync trigger | Secret holder | **Partial** | `POST /api/refresh-jobs` has the identical `localhost` fallback (audit API-07) |
| 6.3 | Core sync: fetch leads, upsert vacancies, deactivate those that left the stage | Secret holder | **Live** if called directly | `api/sync-jobs/route.ts` — in-process mutex, unbounded parallel upserts, errors tallied and never logged (audit API-08) |
| 6.4 | Public vacancy feed | Anon | **Live** | `GET /api/jobs` |
| 6.5 | Vacancy carousel on the worker dashboard | Worker | **Live**, unbounded | `NewsSliderAsync.tsx:16-30` ships the **entire** active-vacancy table to every worker on every render (audit DB-05) |
| 6.6 | Filter vacancies by area using a geocoded suburb | Worker | **Partial** | `NewsSlider.tsx:101` → `GET /api/geocode`, whose catch returns `{state: null}` so the filter fails silently (audit XC-03) |
| 6.7 | Apply to a vacancy / withdraw | Worker | **Live** | `POST`/`PATCH /api/worker/jobs/apply` |
| 6.8 | Profile-completeness gate on applying (experience, fun fact, languages, interests, about me; Cleaning and Yard Maintenance exempt) | Worker | **Partial — client-side only** | Enforced in `ApplyModal.tsx:93-95` and `src/utils/profileSections.ts:30-41`; the API applies **no** completeness, publication or verification check (`api/worker/jobs/apply/route.ts:17-66`) |
| 6.9 | "My Jobs" — applications list | Worker | **Live** | `/dashboard/worker/my-jobs`; `GET /api/worker/jobs` |
| 6.10 | **Recording the outcome of an application** | — | **Phantom** | `JobApplicationStatus` has exactly two values: `PENDING`, `WITHDRAWN` (`prisma/auth-schema.prisma:409-412`). No accept, shortlist or reject. Outcomes exist only in Zoho |
| 6.11 | Standalone recruitment application form, forwarded to Zoho via n8n, no database involved | Worker | **Partial** | `/apply?recruitmentId=…` + `POST /api/apply`; returns HTTP 500 if `APPLY_WEBHOOK_URL` is unset (`route.ts:44-49`). Built 2026-07-09, a single commit, during the development slowdown — **a second, parallel application mechanism** to 6.7 |
| 6.12 | Zoho leads passthrough endpoint | — | **Dead** | `GET /api/zoho/leads` — zero in-repo callers |

## J7 — Administration and reporting

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 7.1 | Contractor list with advanced filters (age, gender, location, distance, language, document type/status/category) | Admin | **Live** | `GET /api/admin/contractors` (843 LOC — the best-engineered route in the codebase, audit XC-07) |
| 7.2 | Contractor detail, editable by an admin | Admin | **Live** | `/admin/contractors/[id]`, `.../profile`; `GET/PATCH /api/admin/contractors/[id]` |
| 7.3 | Contractor profile PDF export | Admin | **Live** | `GET /api/admin/contractors/[id]/pdf` |
| 7.4 | Suspend / reactivate an account | Admin | **Partial** | `PATCH /api/admin/contractors/[id]/status` writes `users.status` but **does not invalidate the 60-minute login cache**, so a suspended worker keeps signing in for up to an hour (audit XC-06) |
| 7.5 | Inactive-contractor list | Admin | **Live** | `GET /api/admin/contractors/inactive` |
| 7.6 | Filter option lists for the admin console | Admin | **Live** | `GET /api/admin/filters` |
| 7.7 | Impersonate any active user; end impersonation and restore the admin session; impersonation banner | Admin | **Live** | `api/admin/impersonate/route.ts`; `ImpersonationBanner` mounted in both dashboard layouts. One-time token, 60-second expiry, both sides audited |
| 7.8 | Daily and weekly activity reports | Admin | **Live** | `GET /api/admin/reports/{daily,weekly}` |
| 7.9 | Worker-statistics report, rendered to PDF server-side | Admin | **Live**, degrading | `GET /api/admin/reports/worker-statistics` — 34 sequential `count(*)` today, +52/year (audit §7) |
| 7.10 | Signed-agreement report by contract type | Admin | **Live** | `GET /api/admin/reports/agreement/[type]` (built 2026-04-23) |
| 7.11 | Natural-language worker search via an n8n/AI webhook | Admin | **Live**, externally dependent | `admin/manage/page.tsx:114-160` (the component is misleadingly named `SearchByAIPlaceholder` — it is fully implemented) → `POST /api/admin/ai-search` → `AI_SEARCH_WEBHOOK`. Returns HTTP 500 if unset |
| 7.12 | Admin AI chat assistant | Admin | **Partial — deliberately disabled** | `AdminChatbot.tsx` + `FloatingChatbot.tsx` are complete; the mount is **commented out** at `src/app/admin/layout.tsx:57`. Its endpoint falls back to the placeholder URL `https://your-n8n-instance.com/webhook/chat` (`api/admin/chat/route.ts:26`) |
| 7.13 | Admin management of clients and support coordinators | Admin | **Phantom** | Both admin nav tabs exist (`AdminSidebar.tsx:24-33`) and both render "coming soon" placeholders (`admin/manage/page.tsx:69-97`) |
| 7.14 | Compliance check console | Admin | **Live** | `admin/manage/page.tsx:55` → `CheckComplianceContent.tsx` |
| 7.15 | User list | Admin | **Live** | `GET /api/admin/users` |
| 7.16 | Admin account creation / role change | — | **Phantom** | No route, no UI. Only `scripts/create-admin-user.ts` and `scripts/promote-to-admin.ts`. `AuditAction.ROLE_CHANGE` never written |

## J8 — Account and access

| # | Capability | Actor | Status | Evidence |
|---|---|---|---|---|
| 8.1 | Email + password login, remember-me (24 h vs 7 d token) | All | **Live** | `src/lib/auth.config.ts:75-158,192-202` |
| 8.2 | Account lockout after 3 failed attempts, 30 seconds | All | **Partial** | Non-atomic Redis read-modify-write; N parallel attempts all read the same counter (audit DB-07) |
| 8.3 | Forgot password → emailed reset link, 1-hour token | All | **Live** | `api/auth/forgot-password/route.ts:79-101`; `api/auth/reset-password` |
| 8.4 | Set an initial password (invited-user flow) | All | **Live** | `POST /api/auth/setup-password`; `/setup-password` |
| 8.5 | Email OTP during **client** registration | Anon | **Partial** | `/api/auth/send-otp` + `/verify-otp` are stateless: the client is handed the signing token and can verify offline; no rate limit; no attempt counter (audit API-03). Used only by `Step5AccountSetup.tsx:71,136` — the worker wizard has no equivalent |
| 8.6 | Email-availability check | Anon | **Live**, an enumeration oracle | `POST /api/auth/check-email` — no auth, no rate limit |
| 8.7 | Coordinator profile self-service edit | Coordinator | **Live** | `GET/PATCH /api/coordinator/profile` |
| 8.8 | Client profile self-service edit | Client | **Partial** | `/dashboard/client/account` exists; there is **no** `/api/client/profile` route |
| 8.9 | Account deletion / data export by the user | — | **Phantom** | No route, no UI. `Participant.userId onDelete: SetNull` (`prisma/auth-schema.prisma:101`) shows deletion was contemplated |
| 8.10 | Logout audit event | — | **Phantom** | `AuditAction.LOGOUT` declared, never written |

## J9 — Content and platform surface

| # | Capability | Status | Evidence |
|---|---|---|---|
| 9.1 | Application root | **Live** | `/` redirects to `/login` (`src/app/page.tsx:3-5`). This deployment is the application only; marketing lives at `www.remontaservices.com.au` |
| 9.2 | Newsroom / articles | **Partial (a redirect shim)** | `/api/articles` and `/api/articles/[slug]` are bare 301 redirects to `www.remontaservices.com.au/newsroom` |
| 9.3 | Headless CMS | **Phantom** | `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set; `cdn.sanity.io` is allow-listed in `next.config.ts`; **no Sanity client is installed** |
| 9.4 | Public site header nav | **Partial** | `Header.tsx:32-38` links `/support-coordinators` and `/services` — **neither page exists in this application** |
| 9.5 | Site footer | **Dead** | `Footer.tsx` has zero live mounts (only a commented-out reference at `src/app/registration/client/page.tsx:41`). Its "Pricing" menu item is a `href: '#'` template placeholder, **not** evidence of a pricing page |
| 9.6 | Real-time messaging between clients and workers | **Phantom** | Six `PUSHER_*` env vars; `pusher` + `pusher-js` installed with **0 imports**; `@chatscope/chat-ui-kit-react` (a chat UI kit) installed with **0 imports**. Nothing was built |
| 9.7 | Structured logging and observability | **Dead** | `src/lib/logger.ts` — every method body empty, zero importers (audit XC-01) |
| 9.8 | Cache-pattern invalidation | **Dead** | `invalidateCachePattern` is an exported function with an empty body (audit STR-03) |
| 9.9 | Feature-access gating by verification status | **Dead** | `src/lib/feature-access.ts` — zero references; it is the only module that would have gated features on `verificationStatus === 'APPROVED'` |

---

## §3.1 The pricing artefacts — the clearest evidence of the original business model

Three artefacts describe a priced marketplace. None was built.

1. **`IndicativeRatesSection.tsx`** — a finished form for weekday, Saturday, Sunday and
   public-holiday hourly rates, with the customer-facing line: *"Enter your preferred
   hourly rates. These are indicative only and can be negotiated with participants."*
   `handleSave` is `{ }` (`:20-22`). Zero consumers. No rate column exists in either
   schema.
2. **`src/types/index.ts`** — an entire unbuilt domain: `SupportWorker.hourlyRate`,
   `Client.planBudget`, `Client.ndisNumber`, `Match.matchScore`, and
   `MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'` (`:5,32-58`). Every
   one of those identifiers has **zero consumers outside that file**. `hourlyRate`,
   `planBudget` and `matchScore` appear nowhere else in the repository.
3. **`src/constants/index.ts`** — `NDIS_CATEGORIES` (Core Supports, Capacity Building,
   Capital Supports — the NDIS plan budget categories) and `MATCH_STATUS`, both with zero
   consumers; and `TITLE_ROLE_OPTIONS` (`:~200`), an 18-role list including
   Accommodation Provider, Employment Support Provider, Interpreter/Translator and
   Assistive Technology Provider — service lines the shipped catalogue never carried.

Taken together with `docs/structure.md:1-2` ("For a job portal like Upwork … real-time
messaging, payments"), the original design was: workers publish rates, clients spend a
plan budget, a scored match is offered and accepted or rejected, and the two parties
message each other. **What shipped instead is a compliance and profile system feeding a
CRM-operated matching process run by Remonta staff.** That is a different business.

## §3.2 The verification gate does not gate search

`WorkerProfile.isPublished` is described everywhere as the control that makes a worker
visible, and the admin publish action is the only writer of it. But of the three live
worker searches, **none filters on it**:

| Route | Consumer | Filters applied | `isPublished`? |
|---|---|---|---|
| `GET /api/client/workers` | Client & coordinator find-worker | `user.status='ACTIVE'`, non-empty names, non-null bio on default browse only (`:352-364`) | **No** |
| `GET /api/public/workers` | External marketing site | `user.status='ACTIVE'` only (`:109-113`) | **No** — despite the docblock at `:291` |
| `GET /api/admin/contractors` | Admin console | `user.status='ACTIVE'` (`:404`) | No — correct for an admin view |
| `src/lib/worker-search.ts` | **nothing** | `verificationStatus='APPROVED'` (`:95,284,316,350`) | Implicitly yes — and it is dead |

The single implementation that enforced the rule is the dead one. The consequence, stated
plainly: **an unverified worker who has entered a name and a bio is discoverable by clients
and coordinators inside the product, and by anyone at all through the public feed.** For a
business whose proposition is verified care workers, this is the most consequential
finding in the exercise. Whether it matches production behaviour requires checking whether
the deployed code matches the repository — but the repository is unambiguous.

## §3.3 The demand-side loop closes outside the product

`ServiceRequest.assignedWorker`, `ServiceRequest.zohoRecordId`, and the statuses
`MATCHED`, `ACTIVE` and `COMPLETED` are **read throughout the product and written by none
of it** (Phase 2 evidence; 12 read sites, 0 write sites). The client/coordinator
dashboards render assigned workers (`dashboard/client/manage-request/page.tsx:44-56`) and
a completed-requests list (`supportcoordinators/completed/page.tsx:57`) from values the
product never sets.

The only plausible writer is the n8n automation layer, writing directly into the
production database — it is not in this repository. Therefore:

- **Fulfilment is not a product capability.** The product captures demand and publishes
  supply; the match, the assignment and the completion happen in the CRM and are written
  back out of band.
- There is **no audit trail, validation, or ownership check** on those writes, because
  they do not pass through any code here.
- One route lets any signed-in user fire a Cancel or Archive action to the CRM against
  **any** request id (`action-webhook/route.ts:6-27`, no ownership check).

Additionally, `updateServiceRequestSchema` accepts `status` as any of the six values
(`src/schema/serviceRequestSchema.ts:117`) and the general PATCH passes it straight
through (`api/client/service-request/[id]/route.ts:211`). A client editing their own
PENDING request can therefore set it to `MATCHED`, `ACTIVE` or `COMPLETED` directly.
