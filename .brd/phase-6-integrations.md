# Phase 6 — Integrations as business processes

For each system: the business process it automates, who depends on it, and what happens to
the business if it stops.

## 6.1 Zoho CRM — the system of record for everything commercial

Remonta's CRM is not a peripheral integration. It is where the business actually operates.
Three distinct flows:

### (a) Inbound — recruitment demand becomes vacancies
**Business process:** a Remonta staff member creates a lead in Zoho and moves it to the
recruitment stage. An hourly job mirrors every lead in that stage into the vacancy table,
and deactivates any that has left it. Workers then see those vacancies and apply.

**Who depends on it:** the recruitment team, for filling roles; workers, for whom
vacancies are the only reason to keep the dashboard open.

**If it stops:** vacancy listings freeze at whatever was last synced and no new role is
ever advertised, with **no visible signal** — the Redis entry for the vacancy list has a
7 200-second TTL that simply refills from the stale table (audit API-07). Workers see an
apparently working, permanently out-of-date job board.

**Current state: it cannot run.** The cron handler HTTP-calls
`process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'` from inside a serverless
function, and `NEXT_PUBLIC_BASE_URL` is set in neither env file (audit API-07). The manual
admin trigger has the identical defect. Note also that `docs/Zoho_Jobs_To_DB.md:618`
documents the schedule as daily at 11:30 pm UTC while `vercel.json:5` says hourly, and the
doc describes the Zoho *Deals* module while the shipped code queries *Leads* — the
documentation has drifted from the code.

### (b) Outbound — registrations and requests become CRM records
**Business process:** every registration and every service-request event is pushed to
Zoho, via n8n, so that sales and service delivery can act on it.

**What is synced reveals what the business tracks commercially.** From
`api/client/service-request/route.ts:107-127` and `.../[id]/route.ts:238-256`, the CRM
receives, per request: the requester's user id, the service categories and specialisations,
the location, the full free-form details blob (which contains scheduling preferences,
preferred worker gender, special requirements, and the NDIS plan management type, plan
manager name, invoice email, CC email, **NDIS number** and plan dates), the status, and
about the participant — first name, last name, date of birth, gender, relationship to the
client, funding type, **health conditions array**, and additional information.

From the registration pushes: for a worker, name, email, mobile, location, chosen services
and specialisations, geocoded city/state/postcode/latitude/longitude, and their initial
verification, completion and publication flags
(`src/lib/workers/workerRegistrationProcessor.ts:222-241`); for a client or coordinator,
name, email, mobile, funding type, relationship, organisation, client types, and which of
the three forks they took (`register/client/route.ts:113-122`;
`register/coordinator/route.ts:168-177`).

**Read plainly: Zoho holds the participant's health data, NDIS number and billing contact.
The product is the collection surface; the CRM is the record.** Any question about data
retention, access control or breach exposure has to be answered about Zoho, not about this
application.

**If it stops:** no lead reaches the sales pipeline automatically and no service request
reaches the people who fulfil it. Because every push is fire-and-forget with no retry and
no dead-letter queue (audit XC-02), a failure is indistinguishable from success and there
is no replay path. The most likely business symptom is a customer who registered, submitted
a request, and was never contacted — with nothing in any log to explain it.

**Current state:** the worker-registration push is **live** and hardcodes its n8n URL in
source (`api/auth/register-async/route.ts:112`), so it fires regardless of environment
configuration. This **corrects the audit's conclusion (XC-02)** that registrations may
never reach the CRM — that applies only to the dead legacy route. The five
service-request webhooks depend on five mixed-case environment variables that are present
in `.env.local`; whether they are set in production is not derivable.

### (c) Inbound — the CRM writes fulfilment state back into the product database
**Business process:** Remonta staff match a worker to a request in the CRM. The
assignment, the CRM record id, and the `MATCHED` / `ACTIVE` / `COMPLETED` statuses appear
in the product database.

**No code in this repository performs those writes.** `ServiceRequest.assignedWorker` and
`ServiceRequest.zohoRecordId` are read in twelve places and written in none (Phase 3 §3.3).
The writer is the n8n layer, which is not in this repository, writing directly to
production Postgres.

**If it stops:** the client and coordinator dashboards silently stop progressing. Requests
sit at `PENDING` forever, the assigned-worker panel stays empty, and the completed-requests
list never populates — while the product reports no error, because from its point of view
nothing has gone wrong.

**This is the single biggest architectural fact about the business:** the core transaction
is completed by an automation layer outside the codebase, with no validation, no ownership
check and no audit trail on its writes.

### (d) Client intake by Zoho Form — bypassing the product entirely
The site header's **"Find support"** link points at `/registration/client` (singular),
which is a full-page iframe of a Zoho public form titled *"Referral & Service Request
Form"* (`src/app/registration/client/page.tsx:35-38`;
`src/components/ui/layout/Header.tsx:22-23`). The in-app client wizard lives at
`/registration/clients` (plural). **There are therefore two parallel demand-intake
channels, and the one the navigation promotes creates no product account at all.** Anyone
reasoning about demand-side conversion or client counts must know which channel a given
client came through; the product database only knows about one of them.

## 6.2 n8n — the automation layer that is actually the business logic

**Business process:** n8n sits between the product and Zoho for every outbound flow, and
(inferred from §6.1c, high confidence) writes fulfilment state back. It also powers two
admin AI features.

**Who depends on it:** everyone. Registration→CRM, service request→CRM, recruitment
application→CRM, admin AI search, admin chat, and almost certainly the assignment
write-back.

**If it stops:** the business stops. Registrations and requests are captured but nobody is
told; matches are never written back; AI search returns an error.

**Configuration state:** one n8n URL is **hardcoded in application source**
(`api/auth/register-async/route.ts:112`) — it cannot be rotated without a deploy.
`APPLY_WEBHOOK_URL` and `AI_SEARCH_WEBHOOK` are set in `.env.local`. `N8N_WEBHOOK_URL` is
referenced by the dead legacy register route and by the admin chat route and is set in
**neither** env file — the chat route consequently falls back to the placeholder
`https://your-n8n-instance.com/webhook/chat` (`api/admin/chat/route.ts:26`).

**INFERRED (high confidence):** n8n contains business logic of comparable importance to
this repository, and it is entirely undocumented here. Sizing the engineering risk of the
product means sizing n8n too, and nobody reading this repository can.

## 6.3 Resend — transactional email

**Business process:** delivering a signup verification code and a password-reset link.
That is the whole scope (Phase 5 §5.1).

**Who depends on it:** anyone who forgets a password; clients and coordinators completing
registration. Workers do not depend on it at all.

**If it stops:** nobody can recover an account, and client/coordinator registration is
blocked at the OTP step. Worker registration is unaffected.

**Business consequence of how little it does:** the absence is the finding. A registered
NDIS provider verifying identity documents has no channel to tell a worker that their
police check was rejected.

## 6.4 Twilio — SMS

**Business process:** verifying a worker's mobile number at signup.

**Current state: dead.** The feature is not mounted in the signup wizard, its hooks have
no consumers, and its two endpoints cannot interoperate because they store codes in
separate in-module maps (audit XC-03). Both endpoints remain **unauthenticated and
unrate-limited**, so each is a live Twilio-credit drain (audit XC-04). The code is
generated with `Math.random()` rather than a cryptographic source.

**If Twilio were disconnected today:** nothing would change for any user, and one cost
line and one abuse vector would disappear.

## 6.5 Google Geocoding and Nominatim / OpenStreetMap — turning addresses into coordinates

**Business process:** converting a worker's suburb into coordinates at registration so
that distance search works, and converting a client's search location the same way. This is
what makes "find a support worker near me" possible — the core demand-side action.

**Who depends on it:** every client and coordinator who searches by location; every worker
who wants to be findable.

**If it stops:** a worker registering during the outage is stored **with null
coordinates** and is silently invisible to every distance search thereafter, permanently,
with no retry and nothing in any log — registration deliberately does not fail on a
geocoding error (`workerRegistrationProcessor.ts:69-76`). On the search side,
`src/lib/geocoding.ts:118-119` does not check `response.ok` before parsing, so a Google
rate-limit response is caught by an empty catch and is indistinguishable from "address not
found" (audit API-05).

Two separate providers are used: Google Geocoding for registration and worker search;
Nominatim/OSM behind `GET /api/geocode`, which the worker dashboard's job-area filter
calls. That endpoint is unauthenticated, unrate-limited, and sends a hardcoded Remonta
User-Agent — so an abuse spike gets Remonta banned by OpenStreetMap, after which the job
area filter fails silently (audit XC-03, XC-04).

## 6.6 Vercel Blob — document storage

**Business process:** storing every compliance and identity document a worker uploads —
passports, birth certificates, driver's licences, Medicare cards, bank statements, police
checks, NDIS screening clearances, training certificates, insurance certificates — plus
profile and vehicle photos.

**Who depends on it:** the entire verification process, which is the business's only
quality control.

**If it stops:** no worker can be onboarded and no administrator can verify anyone.

**The business risk is not availability, it is access control.** Every write uses
`access: 'public'` (audit XC-05), so every identity document is served from an
unauthenticated URL. Two code paths orphan those files permanently — a re-upload
overwrites the database URL without deleting the old blob, and deleting an identity
document leaves the file with the deletion `// TODO`-ed out
(`api/worker/identity-documents/route.ts:172-178`). An orphaned blob is a permanently
public identity document whose URL appears in no database, so it cannot be found, audited
or revoked. Combined with the three admin routes that return `documentUrl` before
authenticating (audit API-01), this is the sharpest compliance exposure in the system.

## 6.7 Upstash Redis — cache and rate limiting

**Business process:** keeping the product responsive, and limiting abuse of ten endpoints.

**If it stops:** caching **and** rate limiting disappear together, because both helpers
return `null` when Upstash is unreachable and the rate limiter then fails open from an
empty catch (audit API-06). Every request falls onto the cold path with no limiter, against
a database connection pool of one. The failure direction is *more* load.

**Business consequence:** an Upstash incident is not a degraded-performance event, it is a
plausible total-outage event.

## 6.8 Sanity CMS — provisioned, never built

`NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set, and
`cdn.sanity.io` is allow-listed in the committed production image config (audit FE-06). No
Sanity client is installed. The two article routes that would have served CMS content are
bare 301 redirects to `www.remontaservices.com.au/newsroom`. **A content programme was
provisioned and abandoned; content now lives on the marketing site.**

## 6.9 Pusher — provisioned, never built

Six `PUSHER_*` environment variables are configured; `pusher` and `pusher-js` are installed
with **zero import sites**; `@chatscope/chat-ui-kit-react` — a chat UI kit — is likewise
installed and never imported. **Client–worker messaging was budgeted for, provisioned, and
never started.** `docs/structure.md:2` names "real-time messaging" as a core requirement of
the original conception. The business consequence today: there is no channel of any kind
between a client and a worker inside the product; all contact is brokered by Remonta staff.

## 6.10 What the integration map says about the business

Reading the integrations rather than the code:

1. **Remonta is not a self-service marketplace.** Every transaction crosses into the CRM
   and comes back, or does not come back. The product is a data-capture and compliance
   front end for a staffed operation.
2. **Zoho is the system of record for the regulated data**, not this application.
3. **n8n is an unversioned, undocumented, single-point-of-failure business-logic layer**
   with at least one URL hardcoded into application source.
4. **The three most business-critical automations are broken or unverifiable:** the
   vacancy sync cannot run, the CRM write-back is invisible to this repository, and every
   outbound webhook is fire-and-forget with no retry and no detection.
5. **Two integrations were paid for and never built** (Pusher, Sanity), and one is dead but
   still spending (Twilio).
