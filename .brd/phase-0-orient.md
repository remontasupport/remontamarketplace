# Phase 0 — Orient

## A. What the team said the product was (stated intent, verbatim sources)

### 1. `README.md` — nothing
`README.md:1-37` is the unmodified `create-next-app` template. It has never been
edited to describe the product. **Zero product intent recorded in the repository's
front door.**

### 2. `docs/structure.md` — the original conception
`docs/structure.md:1-2`:
> "Core Architecture Overview
> For a job portal like Upwork, you'll need to handle complex user interactions,
> real-time messaging, payments, file uploads, and search functionality."

This is a generic AI-authored architecture recommendation, not a spec for Remonta. It is
significant as evidence: the product was **originally framed as a two-sided freelance
marketplace on the Upwork model**, with messaging and payments as first-class concerns.
Neither messaging nor payments exists in the shipped system (Phases 3, 10). It also
recommends Elasticsearch/Algolia for search — the system uses `ILIKE` (audit DB-04).

### 3. `docs/FILE_ORGANIZATION.md` — the intended role structure
`docs/FILE_ORGANIZATION.md:3`:
> "the organized file structure for the Remonta NDIS platform, designed to support
> multiple user types (Workers, Clients, Coordinators) with reusable components"

Confirms the three-role domain independently of the audit. Note the directory plan at
`docs/FILE_ORGANIZATION.md` marks `client/` and `coordinator/` as **"(future)"** — at the
time of writing, only the worker side existed. Both now exist (Phase 3), and the
coordinator side is a near-verbatim copy of the client side (audit STR-02).

### 4. `docs/Zoho_Jobs_To_DB.md` — the only true feature spec in the repo
A complete 745-line technical reference for the Zoho→jobs pipeline. Its plain-English
flow (`docs/Zoho_Jobs_To_DB.md:27-32`) reveals the operating model:
> "1. A coordinator creates a Deal in Zoho CRM and sets its Stage to `"Recruitment End"`.
> 2. A scheduled cron job ... fetches all Deals in that stage, and upserts them into the DB.
> 3. The `/provide-support` page renders a `JobsSection` ... 4. Jobs are displayed as cards"

**This is the single most business-revealing document in the repository.** It shows that
job demand does not originate in the product — it originates in **Zoho CRM, entered by
Remonta staff**, and the product is a publishing surface for it. See Phase 6.

Three discrepancies against the code, worth noting now:
- The doc says "Module Used: **Leads**" (`:77`) while its own code sample calls
  `/Deals/search` (`:177`) and the shipped `src/lib/zoho.ts` calls `Leads/search`
  (audit API-05). The doc has drifted from the code.
- The doc states the cron schedule as `30 23 * * *` (daily, 9:30am AEST) (`:618`);
  `vercel.json:5` actually says `0 * * * *` — **hourly**.
- The doc documents `NEXT_PUBLIC_BASE_URL=https://www.remontaservices.com.au` (`:57`) as a
  required production variable. It is set in neither env file (audit API-07/XC-08).

**Security note carried forward as a business risk, not restated in the deliverables:**
`docs/Zoho_Jobs_To_DB.md:41-57,388,447,457,722` commits live Zoho OAuth client secret,
refresh token, `SYNC_API_SECRET` and `CRON_SECRET` values in **tracked source**. The
audit's "no secrets are committed" positive finding (audit XC-08) is true of `.env*`
only and does not hold for `docs/`. Logged in the gap register for compliance/ops.

### 5. `docs/README.md` — a documentation index pointing at deleted files
`docs/README.md:11-12,22-35` links to seven documents that do not exist on disk:
`SETUP_GUIDE_NON_TECHNICAL.md`, `ZOHO_SYNC_COMPLETE.md`, `API_SYNC_CONTRACTORS.md`,
`WEBHOOK_TESTING_GUIDE.md`, `apiGuidelines.md`, `PRODUCTION_READINESS.md`.
Only `structure.md` of the linked set survives. Evidence of a documentation effort that
was rolled back or lost. The named-but-missing `PRODUCTION_READINESS.md` and
`API_SYNC_CONTRACTORS.md` imply a contractor-sync process and a go-live checklist that
are no longer described anywhere.

### 6. `data.json` (repo root, 3 413 B) — an unbuilt data model
A hand-written sample payload for a coordinator and a client. It contains fields that
**exist nowhere in the Prisma schema**:
- `ndisNumber` (`data.json`, both participant blocks) — the NDIS participant number.
  The schema's `Participant` model (`prisma/auth-schema.prisma:82-108`) has no such field.
- `planManager: {name, email, phone}` — plan-management contact. Not in the schema.
- `emergencyContact: {name, relationship, mobile}` on the participant — not in the schema
  (and the worker-side equivalent is a **drifted client type**, audit FE-05).
- `coordinatorProfileId` / `clientProfileId` on the participant — the shipped schema
  attaches participants to `User`, not to a profile (`:101`).
- `representativeType: "SELF"` — matches the orphan `RepresentativeType` enum
  (`prisma/auth-schema.prisma:510-517`), which **no model references**.
- `streetAddress` / `suburb` / `postalCode` on client and coordinator profiles — the
  shipped `ClientProfile` (`:48-63`) and `CoordinatorProfile` (`:65-80`) store no address
  at all.

This is a designed-but-not-shipped participant record. Its absence of `ndisNumber` in the
live schema is the sharpest single fact in Phase 0: **the system does not record the NDIS
participant number.** Carried into Phase 10's compliance section and the gap register.

### 7. `.env` / `.env.local` — capability declarations (names only; no values read)
`.env` (36 names) and `.env.local` (23 names) declare capabilities the code does not use:
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`,
  `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` — six variables for real-time.
  `pusher` + `pusher-js` are installed with **0 import sites** (audit §3). Combined with
  `@chatscope/chat-ui-kit-react` (`package.json:31`, a chat UI kit) this is a **messaging
  product line that was provisioned and never built.** Phantom.
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` — a headless CMS. No
  Sanity client is installed; `next.config.ts` still allowlists `cdn.sanity.io`
  (audit FE-06). Pairs with the live `/api/articles` and `/api/articles/[slug]` routes.
- `AI_SEARCH_WEBHOOK` (`.env.local`) — pairs with the live route `/api/admin/ai-search`.
  **Not mentioned anywhere in the audit.** New finding to classify in Phase 3.
- `APPLY_WEBHOOK_URL` (`.env.local`) — pairs with `/api/apply`.
- `REMONTA_API_URL` (`.env.local`) — an outbound call to another Remonta system.
- Five mixed-case Zoho webhook URLs: `Select_Cancelling_Request_Webhook`,
  `Cancel_Archive_Webhook`, `Client_Registration_Webhook`, `Request_Service_Webhook`,
  `Active_Request_Cancellation`. **Each name is a business event** — the naming alone
  reconstructs the service-request lifecycle (Phase 4).
- `SMS_DEV_MODE` — SMS was never taken out of development mode as a concept.
- `GEOMAP_API`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`,
  `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `TWILIO_*`, `UPSTASH_*` — all in use.
- `N8N_WEBHOOK_URL`, `ACCELERATE_DATABASE_URL`, `CRON_SECRET`, `NEXT_PUBLIC_BASE_URL` are
  **read by code and set in neither file** (audit XC-08). `DIRECT_DATABASE_URL` is
  declared and read by nothing.

### 8. `vercel.json` and `package.json`
- Package name is `remonta` (`package.json:2`), version `0.1.0`, `private: true`.
- Cron: one entry, `/api/cron/sync-jobs`, `0 * * * *` (`vercel.json:5`).
- `app/api/upload/**` gets `maxDuration: 30` (`vercel.json:16`) — the only per-function
  override, i.e. document upload is the one operation the team knew was slow.
- Two Prisma clients generated at build (`vercel.json:2`, `package.json:8`).

## B. Carried forward from the audit (do not re-derive)

Component map: 86 API routes, 54 pages, 10 `"use server"` service files + 1 action file,
2 Prisma clients over 1 Neon Postgres, Upstash Redis, Vercel Blob, and 7 external systems
(Zoho CRM, n8n, 3 Zoho service-request webhooks, Google Geocoding, Nominatim/OSM, Resend,
Twilio). Audit §4.

Already marked broken or unused by the audit — treat as pre-established evidence:
| Thing | Audit finding | Business-relevant status |
|---|---|---|
| Hourly Zoho job sync | API-07 | Cannot run: fetches `localhost` from a Lambda |
| n8n → Zoho registration push | XC-02 | `N8N_WEBHOOK_URL` unset in both env files |
| Real-time / Pusher | §3 | Installed, 0 imports — never built |
| Phone verification (`/api/sms/*`) | STR-03, XC-03 | Two `Map`s in two modules; can never work |
| `src/lib/logger.ts` | XC-01 | Every method body empty, 0 importers |
| `invalidateCachePattern` | STR-03 | Exported function with an empty body |
| `src/lib/worker-search.ts` | STR-02/03 | 4th search implementation, 0 callers |
| `src/lib/feature-access.ts` | STR-03 | 0 references |
| `POST /api/admin/fix-qualifications` | API-12 | One-off migration, unauthenticated, 0 callers |
| `sessions` / `accounts` tables | STR-03 | Can never be written (`strategy: 'jwt'`) |
| `worker_services_backup_20260108` | DB-02 | Dated backup table in the production schema |
| Prisma Accelerate | §3 | `ACCELERATE_DATABASE_URL` unset — inert, and misroutes a client |
| `swr`, `styled-components`, `nodemailer`, `pg`, `@auth/prisma-adapter`, `@react-email/render` | §3 | 0 import sites each |

**The audit's structural caveat, adopted for this exercise:** development has effectively
stopped — 14 commits in the last five months against 389 in the preceding seven
(audit §2). Anything first committed inside that window is presumed **Partial** until
proven reachable end to end. Phase 8 tests this.

## C. What I will conclude independently (flagged now, argued later)

The audit's one-line summary — "an NDIS care marketplace: support workers upload identity
and compliance documents, administrators verify them, and clients and support
coordinators search for workers" — is accurate but **incomplete in three ways** that
change the business reading. Each is derived in later phases:

1. **There are two demand-side products, not one.** A client/coordinator can (a) search
   published workers directly, and (b) raise a structured *service request* against a
   named participant, which is pushed to Zoho and matched by Remonta staff
   (`prisma/auth-schema.prisma:528-548`, five webhook env vars). (b) is the higher-value
   transaction and is largely invisible in the audit's engineering framing.
2. **There is a third, non-marketplace product surface: recruitment.** Zoho recruitment
   leads become public job listings that workers apply to
   (`prisma/auth-schema.prisma:349-407`, `docs/Zoho_Jobs_To_DB.md`). This is a staffing
   funnel for Remonta's own service delivery, not marketplace matching.
3. **Remonta is not a neutral platform.** Every transaction routes through Remonta staff:
   admins verify every document, admins publish every profile, service requests are
   fulfilled from the CRM, and job demand is authored in the CRM. Phase 10's operating
   model treats each of these as a headcount line.

Deferred to Phase 1: whether `ContractorProfile` / `ContractorsbyArea`
(`prisma/schema.prisma:11-66`) constitute a **second, earlier product concept** — a
CRM-sourced directory of contractors — that the `WorkerProfile` model replaced.
