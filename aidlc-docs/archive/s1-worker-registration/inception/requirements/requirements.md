# Requirements — Remonta Backend (`apps/api`)

**Depth:** Comprehensive. The system holds regulated data (NDIS participant and worker identity/compliance records), touches a live production system, and has three blocking extensions enabled.
**Sources:** `requirement-verification-questions.md` (Q1–Q23), `requirements-clarification-questions.md` (Clarifications 1–11, Resiliency 1–7), `requirements-clarification-questions-2.md` (2.1–2.3), and the `.brd/` reverse engineering (phases 0–8). Answers are cited as `Q4`, `C5`, `R1`, `C2.1`.

---

## 1. Intent analysis

| | |
|---|---|
| **User request** | "let us start new AI DLC, i am creating a new backend system" — a backend for the existing Remonta product, where "we will optimize the system architecture of the backend as well and improve each code logic" (Q1) |
| **Request type** | Migration + Enhancement. Business logic moves out of the Next.js app into a dedicated backend service, and the defects documented in `.brd/` get fixed on the way |
| **Scope estimate** | Cross-system: a new service (`apps/api`), changes to `apps/app` (switching over one domain at a time, auth hardening), `packages/db` (schema cleanup), new infrastructure (AWS), CI/CD |
| **Complexity estimate** | Complex: a shared live database, incremental migration, regulated data, three blocking extensions, and a 1–2 month timeline |

---

## 2. Decisions already made

| Area | Decision | Source |
|---|---|---|
| Purpose | Backend for the existing product's journeys, with the architecture and logic improved | Q1 A |
| Relationship to `apps/app` | A separate service and deployment that **shares** the existing database, auth and users. `apps/app` calls it; domains move over one at a time | C1 A, Q5 A, Q15 A |
| Framework | **NestJS** (TypeScript, Node.js), on the Fastify adapter | Q7 A, C2 |
| Code location | `apps/api` in this monorepo, sharing `packages/db` and `packages/schemas`, under the same Turborepo build and CI quality gates | C2 A |
| API style | **REST + OpenAPI**, with a typed TypeScript client generated for `apps/app` | C3 A |
| Database | The existing Neon Postgres (Sydney) and Prisma schema, cleaned up in place using **expand/contract**. `packages/db` is the only source of migrations | Q9, C4 A |
| Authentication | NextAuth login stays in `apps/app`, hardened. `apps/app` sends the backend short-lived signed tokens that include an audience and issuer. The backend owns users, roles and account status | Q10 A, C5 A |
| Hosting | **AWS ECS Fargate, `ap-southeast-2` (Sydney)** | Q11, C9 A |
| Background work | A proper job queue, with retries and visibility | Q12 A |
| Zoho CRM | The backend becomes the system of record (long term). **The first release makes no new Zoho integration** | Q13 B, C6 B |
| n8n | Decided workflow by workflow during design | Q14 C |
| Migration | Strangler: old and new run side by side, and domains move over one at a time | Q15 A |
| Scale | Medium: thousands of active users, moderate concurrency | Q16 B |
| Compliance | Australian Privacy Act/APPs, NDIS obligations, a full audit trail of views and changes to sensitive records, AU data residency | Q17, C7 A |
| Data residency | Database, files, backups, cache and queue in Australia. Observability SaaS may be offshore if personal data is removed from what it receives | C8 A |
| Observability | Structured logs + error tracking + metrics + tracing + alerting | Q18 B |
| Delivery | 1–2 months, 1–2 developers. **The date is fixed; the first-release scope is narrowed to fit** | Q19 A, C10 A |
| Regional topology | Single region, multiple availability zones (Sydney). Cross-region recovery (Melbourne) is deferred to a later release | R2 → C2.1 A |
| Recovery target | Recovery within minutes of an availability-zone failure (see NFR-RES-02) | R1 C, C2.1 A |
| Change management | The existing `CLAUDE.md` process: branch → PR → CI → verify the preview → merge → verify production | R3 A |
| CI/CD | GitHub Actions (existing), open to improvement | R4 A |
| Rollback | Forward-only migrations + redeploying the previous container image. The "contract" step (removing old columns) gets its own reviewed deploy, with a backup taken first | R5 → C2.2 A |
| Deployment style | Canary: traffic shifts gradually, with automatic rollback | R6 D |
| Incident response | None exists; AI-DLC will propose a lightweight process with post-incident reviews | R7 → C2.3 B |
| Extensions | Security Baseline (blocking), Resiliency Baseline (blocking), Property-Based Testing (full) | Q21–Q23 A |
| Previous AI-DLC cycle | Archived at `aidlc-docs/archive/monorepo-migration/` | Q20 A |

---

## 3. Scope

### 3.1 In scope — first release (C10 A, C11 A)
- **Identity, accounts and roles** (Q4 A, per C5 A): users, roles, account status, session revocation, token exchange with `apps/app`
- **Worker registration** — `.brd` J1
- **Worker onboarding** — `.brd` J2
- **Worker compliance verification** — `.brd` J3
- **Account and access** — `.brd` J8, within the boundary set by C5 A (see FR-ACC)
- **Actors and permissions** — `.brd/phase-2`, including fixing every UI/API disagreement in §2.4 that touches an in-scope domain
- **Business rules** — `.brd/phase-4` §4.1–4.3, §4.7, §4.8, §4.10, §4.11
- **State machines** — `.brd/phase-4` §4.9: worker verification, compliance document, worker publication, account status
- **Worker-lifecycle communications** — `.brd/phase-5` §5.3–5.4 (worker lifecycle)
- **Platform:** the `apps/api` service, infrastructure, CI/CD, observability, the audit trail, and the job queue

### 3.2 Out of scope — first release
- J4 worker search and J5 service requests (demand side), including participants
- J6 recruitment (Zoho vacancies, applications)
- J7 administration and reporting, **except** the J3 compliance console actions and J7.4 suspend/reactivate (account status belongs to identity)
- J9 content and platform surface
- The pricing artefacts (`.brd/phase-3` §3.1), which were never built and are not revived
- **New** Zoho CRM integration (C6 B), and moving n8n workflows beyond what FR-INT-01 requires
- Cross-region disaster recovery (C2.1 A — later release)
- Moving login and password screens out of `apps/app` (C5 A — later phase)

Out-of-scope domains stay on their current `apps/app` implementation, unchanged, during the first release.

---

## 4. Actors (first release)

| Actor | Description | Source |
|---|---|---|
| **Worker** | Supply side. Registers, completes onboarding, uploads compliance documents | `.brd/phase-2` §2.1 |
| **Administrator** | Remonta staff. Reviews documents, publishes profiles, suspends and reactivates accounts | `.brd/phase-2` §2.1 |
| **Client / Coordinator** | Hold accounts; in the first release they touch the backend only through identity (session revocation, account status) | `.brd/phase-2` §2.1 |
| **`apps/app`** | The Next.js application. It calls the backend on behalf of a signed-in user, using a short-lived token | C1 A, C5 A |
| **Scheduler / queue workers** | Run expiry checks, notification sends and outbound calls | Q12 A |
| **Anonymous** | May only reach the worker registration endpoints (rate-limited, CAPTCHA-protected) | `.brd/phase-2` §2.2 |

---

## 5. Functional requirements

Priority uses MoSCoW: **M** = must have for the first release, **S** = should have (in the first release if time allows; otherwise it goes first in the next), **C** = could have.

### 5.1 Identity, accounts and roles (FR-ID)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-ID-01 | The backend owns the user, role and account-status records for all four roles (Worker, Client, Coordinator, Admin). One account holds exactly one role | M | `.brd` §4.1; C5 A |
| FR-ID-02 | Every backend request is authenticated with a **short-lived signed token** issued by `apps/app` after NextAuth sign-in. The token carries the subject, role, audience, issuer, expiry and a session identifier. The backend validates the signature, expiry, audience and issuer on **every** request | M | C5 A; SECURITY-08 |
| FR-ID-03 | A **server-side session record** (or session version) is kept for every sign-in. Logout, password change and account suspension invalidate it, and the backend and `apps/app` both reject invalidated sessions **immediately**. This replaces the 60-minute stale login cache | M | C5 A; `.brd` J7.4, §4.1; SECURITY-12 |
| FR-ID-04 | Session lifetime is shortened from the current 24 h / 7 d / 30-day cookie to a lifetime set in NFR Requirements, with expiry enforced server-side | M | C5 A; SECURITY-12 |
| FR-ID-05 | An admin can suspend and reactivate an account. Suspension takes effect on the next request (FR-ID-03), and the account holder is notified (FR-NOT-06) | M | `.brd` J7.4, §5.4 #9 |
| FR-ID-06 | The account-status state machine allows only `ACTIVE ⇄ SUSPENDED` plus the lockout states defined in Functional Design. Unused enum values (`PENDING_VERIFICATION`, `LOCKED`) are either given a meaning or removed through expand/contract | M | `.brd` §4.9 (account status) |
| FR-ID-07 | Admin impersonation keeps working. Tokens issued during impersonation carry **both** the impersonating admin and the impersonated user, and every audit record written during impersonation names both | M | `.brd` J7.7, §4.1 |
| FR-ID-08 | The phantom `SUPER_ADMIN` checks are removed; the first release has a single admin tier | M | `.brd/phase-2` §2.1 |
| FR-ID-09 | Admin accounts are created and role changes made only through a controlled, audited path, replacing the ad-hoc scripts (the mechanism is decided in design) | S | `.brd` J7.16 |

### 5.2 Worker registration (FR-REG) — `.brd` J1

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-REG-01 | The backend provides worker registration covering the current four-step signup data: location, personal info, services and specialisations, photo + consent | M | `.brd` J1.1, J1.5 |
| FR-REG-02 | **All** registration input is validated server-side with the same rules as client/coordinator signup: password policy (≥ 8 characters, upper, lower, digit, plus a breached-password check), Australian mobile format, email normalised and unique | M | `.brd` §4.1, §4.11; SECURITY-05, SECURITY-12 |
| FR-REG-03 | CAPTCHA verification is **mandatory**. A request without a token is rejected, not waved through | M | `.brd` J1.4 |
| FR-REG-04 | Consent to profile sharing is recorded with a timestamp and the wording version that was shown | M | `.brd` §4.1, §5.5 |
| FR-REG-05 | A recruitment-lead identifier (`zohoLeadId`) arriving with a signup is **stored** for attribution | S | `.brd` J1.7 |
| FR-REG-06 | The registration response states truthfully what happens next. The false "check your email to verify" message is removed | M | `.brd` J1.10, §5.1 |
| FR-REG-07 | Geocoding the worker's location happens asynchronously through the queue, with retries. A geocoding failure must not fail the registration | M | `.brd` J1.5; RESILIENCY-10 |
| FR-REG-08 | Email-address checks during signup must not let callers discover which emails are registered (no enumeration oracle) | M | `.brd` J8.6, §4.1 |

### 5.3 Worker onboarding (FR-ONB) — `.brd` J2

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-ONB-01 | The backend provides read and write access for the worker's own profile sections: account setup (name, photo, bio, address, other personal info) and the profile-building sections (work history, education, languages, cultural background, religion, interests, about me, personality, good-to-know, locations, preferences, preferred hours, experience, NDIS screening, bank account) | M | `.brd` J2.1, J2.2 |
| FR-ONB-02 | Every profile-content rule in `.brd` §4.2 is enforced **on the server** (e.g. bio 200–2000 characters, fun fact 50–1000, age ≥ 18, postal code format, photo limits, one record per service category) | M | `.brd` §4.2, §4.11 |
| FR-ONB-03 | Date of birth is stored as a real date type (expand/contract migration from text) | M | `.brd` §4.2 (DB-08) |
| FR-ONB-04 | **Requirements engine:** the backend works out each worker's document obligations from their selected services and specialisations, grouped into base compliance / trainings / qualifications / insurance / transport, with duplicates removed | M | `.brd` J2.4, §4.3, §4.10 |
| FR-ONB-05 | Document upload accepts PDF, JPEG, PNG, WebP and HEIC/HEIF up to 50 MB, validated by content type **and** file signature. Files are stored in **Australian-region, private** object storage (no public URLs) and served through short-lived authorised links | M | `.brd` §4.3, J2.6; C8 A; SECURITY-01, SECURITY-09 |
| FR-ONB-06 | Identity documents are classified as PRIMARY / SECONDARY / WORKING_RIGHTS evidence (the 100-point check), including copy-a-reference-document | M | `.brd` J2.8, §4.3 |
| FR-ONB-07 | Right-to-work evidence, ABN/TFN engagement election + signature flag (the ABN/TFN value itself is **not** stored), and Code of Conduct Parts 1 and 2 are captured | M | `.brd` J2.9–2.11, §4.2 |
| FR-ONB-08 | Service-specific qualification steps are generated per selected service | M | `.brd` J2.12 |
| FR-ONB-09 | Bank details (BSB 6 digits, account number 6–10 digits, names ≤ 100 characters, acknowledgement) are stored **encrypted at the field level**. In the first release no user or endpoint reads them unmasked; the worker sees a masked version of their own (OI-04). The payroll integration that will read them is deferred (OI-10) | M | `.brd` J2.15, §4.2; C7 A; SECURITY-01; OI-04 |
| FR-ONB-10 | Availability and preferred hours are captured | M | `.brd` J2.16 |
| FR-ONB-11 | **Onboarding progress** (five section flags + completion percentage) has a single trustworthy source. It is kept consistent when requirements, documents or profile fields change, and is not recomputed from scratch on every read | M | `.brd` J2.17, §4.10 (FE-01, DB-07) |
| FR-ONB-12 | Profile preview data ("how clients see you") is available to the worker | S | `.brd` J2.18 |
| FR-ONB-13 | Skill and service-offering taxonomies cover **every** service line the catalogue offers, or the gaps are recorded as a business decision | S | `.brd` J2.13 |
| FR-ONB-14 | Dead capabilities are not carried over: indicative rates (J2.3) and the unused upload-token route (J2.19) | M | `.brd` J2.3, J2.19 |

### 5.4 Compliance verification (FR-CMP) — `.brd` J3

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-CMP-01 | An admin can list workers pending verification, **paginated** and filterable | M | `.brd` J3.1 |
| FR-CMP-02 | An admin can view one worker's full compliance detail and open each document through a short-lived authorised link. Every view is audited | M | `.brd` J3.3; C7 A |
| FR-CMP-03 | An admin can approve, reject (a reason is required), reset to review, and set or clear the expiry date of a document. The **authorization check runs before any record is read** | M | `.brd` J3.4–3.7, §2.4 #2 |
| FR-CMP-04 | The document state machine (`PENDING → SUBMITTED → APPROVED/REJECTED`, reset, re-upload clears the review, **`EXPIRED`**) is enforced in one place on the server; illegal transitions are refused | M | `.brd` §4.9 (compliance document) |
| FR-CMP-05 | **Automatic expiry:** a scheduled job marks documents whose expiry date has passed as `EXPIRED`, warns the worker in advance of expiry, and notifies them on expiry (FR-NOT-04) | M | `.brd` J3.9, §4.3, §5.4 #3 |
| FR-CMP-06 | Worker verification status uses **one valid set of values**. The out-of-enum `'Verified'` is removed, unreachable states are either used or removed, and the status is derived consistently from document states and publication | M | `.brd` §4.9 (worker verification), J3.8 |
| FR-CMP-07 | An admin can publish or unpublish a worker profile. **Publication preconditions** are enforced by the server: always-required documents must be approved and current; other outstanding documents need an audited admin override (OI-02, resolved) | M | `.brd` J3.8, §4.3; OI-02 |
| FR-CMP-08 | A worker can hold at most one active requirement row per document type, enforced by a database unique constraint (expand/contract) | M | `.brd` §4.3 (DB-07) |
| FR-CMP-09 | Deleting or replacing a document removes or retires the stored file, so no file stays reachable after its record is gone | M | `.brd` §4.3 (XC-05) |
| FR-CMP-10 | **Every** admin compliance decision (approve, reject, reset, re-date, publish, unpublish, suspend, reactivate) writes an audit record: actor, timestamp, before and after values, reason | M | `.brd/phase-2` §2.6; C7 A; SECURITY-13 |
| FR-CMP-11 | Dead or unsafe endpoints are not carried over: the unauthenticated `fix-qualifications` rewrite (J3.11) and the abandoned whole-profile verification flow (J3.10) | M | `.brd` J3.10, J3.11 |
| FR-CMP-12 | One **authoritative document catalogue** (document types, document sets, service-category requirements, expiry flags) is stored and versioned. The contradiction between the TypeScript config and the recovered catalogue is resolved — see OI-01 | M | `.brd` §4.3 |

### 5.5 Account and access (FR-ACC) — `.brd` J8, bounded by C5 A

Under C5 A, the sign-in screens and NextAuth stay in `apps/app` for the first release. The requirements below apply wherever that logic lives. Design decides whether each one is met by a backend endpoint that `apps/app` calls, or by a minimal hardening fix inside `apps/app`.

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-ACC-01 | Brute-force protection on sign-in is **atomic** (no read-modify-write race) and meets SECURITY-12 | M | `.brd` J8.2 |
| FR-ACC-02 | Password reset (1-hour single-use link) and initial password setup keep working, with no way to discover which accounts exist, and the password policy is enforced | M | `.brd` J8.3, J8.4, §4.1 |
| FR-ACC-03 | Email OTP verification is **server-side**: the code is stored as a hash, attempts are limited, it expires, and the expiry stated in the email matches the real one (10 vs 15 minutes today) | M | `.brd` J8.5, §5.1 |
| FR-ACC-04 | Password hashing uses one adaptive algorithm and cost across the system (currently 10 in one place and 12 in another) | M | `.brd` §4.7; SECURITY-12 |
| FR-ACC-05 | Logout, password change, email change, role change, account lock/unlock and suspension are audited (these `AuditAction` values are declared but never written today) | M | `.brd/phase-2` §2.6, J8.10 |
| FR-ACC-06 | MFA is available for admin accounts | M | SECURITY-12 |
| FR-ACC-07 | A user can request access to and correction of their personal data; account deletion and data export are defined (retention rules decided in NFR Requirements) | S | `.brd` J8.9; C7 A (APPs) |
| FR-ACC-08 | Coordinator and client profile self-service edits stay on `apps/app` in the first release | — | Out of scope (demand side) |

### 5.6 Worker-lifecycle notifications (FR-NOT) — `.brd/phase-5`

All notifications are sent through the job queue, with retries, a dead-letter queue and delivery status recorded (Q12 A, RESILIENCY-10).

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-NOT-01 | Email a worker when a compliance document is **rejected**, including the rejection reason | M | `.brd` §5.4 #1 |
| FR-NOT-02 | Email a worker when a compliance document is **approved** | M | `.brd` §5.4 #1 |
| FR-NOT-03 | Email a worker when their profile is **published** (and when it's unpublished) | M | `.brd` §5.4 #2 |
| FR-NOT-04 | Warn a worker ahead of a document's expiry (lead time decided in design) and notify them when it expires | M | `.brd` §5.4 #3 |
| FR-NOT-05 | Send a registration confirmation email that matches what really happens | M | `.brd` §5.4 #10 |
| FR-NOT-06 | Notify the account holder on suspension, reactivation and password change | S | `.brd` §5.4 #9, #11 |
| FR-NOT-07 | Remind workers who abandon onboarding part-way | C | `.brd` §5.4 #4 |

### 5.7 Audit trail (FR-AUD)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-AUD-01 | Every **change** to a sensitive record (identity, compliance documents, bank details, account status, role, publication) is recorded: actor, impersonator (if any), timestamp, action, target, before/after values, request/correlation ID | M | C7 A; SECURITY-13 |
| FR-AUD-02 | Every **view** of a sensitive record (compliance document files, bank details, identity documents) by anyone other than its owner is recorded | M | C7 A (Q17 D) |
| FR-AUD-03 | Audit records are append-only: application code cannot update or delete them | M | SECURITY-14 |
| FR-AUD-04 | Audit records are kept for at least the retention period set in NFR Requirements (the SECURITY-14 minimum of 90 days applies to logs; audit records will likely need longer under NDIS obligations) | M | C7 A; SECURITY-14 |

### 5.8 Integration and migration (FR-MIG, FR-INT)

| ID | Requirement | Pri | Source |
|---|---|---|---|
| FR-MIG-01 | Each domain moves to the backend independently. `apps/app` switches per domain via configuration, and can switch **back** to its old path without a deploy until the domain is declared complete | M | Q15 A; RESILIENCY-04 |
| FR-MIG-02 | Every schema change is expand/contract. At every point, both the old `apps/app` code and the backend work against the live schema. Contract steps ship as separate reviewed deploys, with a backup taken first | M | C4 A, C2.2 A |
| FR-MIG-03 | No regression for out-of-scope domains: demand-side, recruitment and admin reporting keep working unchanged on `apps/app` throughout | M | Q15 A |
| FR-MIG-04 | Data corrections needed by schema cleanup (e.g. `'Verified'` → a valid status, text DOB → date, duplicate requirement rows) are applied by versioned, idempotent, tested migration scripts | M | Q9; PBT-04 |
| FR-INT-01 | **Existing outbound notifications must not stop.** Today every worker registration reaches the CRM through the n8n webhook (`.brd` J1.6). When registration moves to the backend, it keeps sending that same notification — now through the queue, with a timeout, retries and a dead-letter queue — without adding any new Zoho integration. *(Confirmed at review 2026-09-25 — OI-05.)* | M | `.brd` J1.6, §5.2; C6 B; Q14 C; OI-05 |
| FR-INT-02 | The n8n registration URL moves out of source code into configuration/secrets | M | `.brd` J1.6; SECURITY-12 |
| FR-INT-03 | Email is sent through the existing provider (Resend) behind an interface, so the provider can be replaced | M | `.brd` §6.3 |

---

## 6. Non-functional requirements

### 6.1 Performance and scale (NFR-PERF)
- **NFR-PERF-01:** Sized for thousands of active users at moderate concurrency (Q16 B). Latency targets (e.g. p95 for reads and writes) are set in NFR Requirements.
- **NFR-PERF-02:** Every list endpoint is paginated with a bounded page size (`.brd` J3.1, DB-05).
- **NFR-PERF-03:** Database connections are pooled with explicit limits, suited to Neon and to multiple containers (RESILIENCY-10).
- **NFR-PERF-04:** Uploads stream to storage without buffering the whole file in memory.

### 6.2 Security (NFR-SEC) — Security Baseline enabled, blocking
All 15 SECURITY rules apply. Requirements-level commitments:
- **NFR-SEC-01 (SECURITY-01):** Encryption at rest and TLS 1.2+ in transit for Postgres, object storage, Redis/queue and backups. Bank details are encrypted at field level as well (FR-ONB-09).
- **NFR-SEC-02 (SECURITY-02, -03):** Load balancer access logs; structured application logs with a correlation ID, and no secrets, tokens or personal data.
- **NFR-SEC-03 (SECURITY-04):** Security headers on every HTTP response (the API serves JSON; any HTML such as OpenAPI docs is disabled in production or protected — SECURITY-09).
- **NFR-SEC-04 (SECURITY-05):** Schema validation on every endpoint, with max lengths, body size limits and parameterised queries only (Prisma).
- **NFR-SEC-05 (SECURITY-06, -07):** Least-privilege IAM roles per task; the database, cache and queue are reachable only from the service's security group; private subnets.
- **NFR-SEC-06 (SECURITY-08):** Deny-by-default guards; object-level ownership checks on every resource ID; admin-only functions checked on the server; CORS limited to the `apps/app` origins; authorization failures return **403**, never 500 (`.brd` §2.4 #3).
- **NFR-SEC-07 (SECURITY-10):** A lockfile, dependency vulnerability scanning in CI, an SBOM for production images, pinned base images (no `latest`).
- **NFR-SEC-08 (SECURITY-11):** Rate limiting on every public-facing endpoint. It **fails closed** (or degrades safely) when Redis is unavailable, rather than silently failing open (`.brd` §4.7). Misuse cases are documented in design.
- **NFR-SEC-09 (SECURITY-12):** See FR-ID-02..04, FR-ACC-01..06. Secrets live in AWS Secrets Manager, and none are in source (FR-INT-02).
- **NFR-SEC-10 (SECURITY-13, -14):** See FR-AUD. Alerts on repeated authentication failures, authorization failures and privilege changes; log retention ≥ 90 days; the application role cannot delete its own logs.
- **NFR-SEC-11 (SECURITY-15):** A global exception filter; generic error responses; every external call has error handling and fails closed.

### 6.3 Compliance and data residency (NFR-CMP)
- **NFR-CMP-01:** Personal information is handled consistently with the Australian Privacy Principles (C7 A). Remonta must confirm the specific obligations with its compliance owner; this document does not make legal determinations.
- **NFR-CMP-02:** NDIS record-keeping obligations are reflected in retention rules (set in NFR Requirements).
- **NFR-CMP-03:** Primary data stays in Australia: Postgres (Neon, Sydney — confirmed), object storage, backups, cache and queue (C8 A). Moving compliance documents off Vercel Blob to AU-region storage is part of this requirement if Blob can't guarantee an Australian region; this gets verified in Infrastructure Design.
- **NFR-CMP-04:** Observability SaaS may be offshore only if logs, traces and error reports are scrubbed of personal data before leaving the service (C8 A).

### 6.4 Observability (NFR-OBS) — Q18 B
- **NFR-OBS-01:** Structured JSON logging with a correlation ID carried across `apps/app` → `apps/api` → the queue.
- **NFR-OBS-02:** Error tracking with alerting.
- **NFR-OBS-03:** OpenTelemetry metrics and traces (latency, error rate, throughput, saturation, queue depth, job failures).
- **NFR-OBS-04:** Dashboards and alerts for operational and security events, routed into the incident process (NFR-RES-08).

### 6.5 Resiliency (NFR-RES) — Resiliency Baseline enabled, blocking

| ID | Requirement | Rule |
|---|---|---|
| NFR-RES-01 | **Initial criticality classification** (to be confirmed in Application Design): `apps/api` request path = **Critical** (workers can't onboard and admins can't verify); queue workers for notifications/expiry = **High**; geocoding = **Medium** (degrades gracefully). Dependencies to map: Neon, object storage, Redis/queue, Resend, n8n, geocoding provider, `apps/app` | RESILIENCY-01 |
| NFR-RES-02 | **Availability and recovery targets (confirmed at review 2026-09-25 — OI-06):** SLA **99.9 %** monthly for the API; **RTO ≤ 30 min** and **RPO ≤ 5 min** for an availability-zone failure. Recovery from a regional failure is out of scope for the first release (C2.1 A), so no regional RTO/RPO is set yet | RESILIENCY-02 |
| NFR-RES-03 | Change management follows the `CLAUDE.md` process. The backend needs a staging or preview environment equivalent to "verify the preview" before production | RESILIENCY-03 |
| NFR-RES-04 | Deployments are automated through GitHub Actions: canary traffic shifting with automatic rollback on health or metric regression; rollback means redeploying the previous pinned image; migrations are forward-only | RESILIENCY-04 |
| NFR-RES-05 | Shallow and deep health checks (database, Redis/queue, storage), wired into the load balancer | RESILIENCY-06 |
| NFR-RES-06 | At least 2 availability zones for compute; multi-AZ configurations for data stores where the provider supports them; auto-scaling with minimum and maximum limits; service quotas documented | RESILIENCY-08, -09 |
| NFR-RES-07 | Explicit timeouts on every external call; circuit breakers on outbound HTTP (n8n, Resend, geocoding); defined degraded behaviour when non-critical dependencies fail | RESILIENCY-10 |
| NFR-RES-08 | A lightweight incident response and post-incident review process is proposed by AI-DLC and adopted by the team | RESILIENCY-15 |
| NFR-RES-09 | Automated backups with point-in-time recovery, a defined retention period, encryption, and a documented test-restore procedure | RESILIENCY-11, -12, -13 |
| NFR-RES-10 | The resiliency testing approach is decided at NFR Design | RESILIENCY-14 |

### 6.6 Testing and quality (NFR-TEST) — PBT enabled, full enforcement
- **NFR-TEST-01:** fast-check is the property-based testing framework (TypeScript), integrated with the project test runner, with seeds logged and run in CI (PBT-08, PBT-09).
- **NFR-TEST-02:** Property-based tests are **required** for: the state machines (document, verification, publication, account status — stateful PBT, PBT-06); the requirements engine (invariants: every mandatory document included, no duplicates — PBT-03); serialisation of DTOs and tokens (round-trip, PBT-02); idempotent migrations and queue handlers (PBT-04); and the new implementations compared against legacy behaviour where the business rules are meant to stay the same (oracle, PBT-05).
- **NFR-TEST-03:** Example-based tests pin every business-critical scenario (PBT-10), including the ownership and authorization checks, which have **zero** coverage today (`.brd/phase-2` §2.4).
- **NFR-TEST-04:** `apps/api` gets its own `quality` script and CI job (type-check, lint, tests) under the same "baseline tolerates existing debt, rejects anything new" policy as `apps/app` and `apps/web`.

### 6.7 Maintainability (NFR-MNT)
- **NFR-MNT-01:** Security-critical logic (authentication, authorization, audit) lives in dedicated NestJS modules (SECURITY-11).
- **NFR-MNT-02:** Zod schemas in `packages/schemas` stay the shared contract where they apply. The package boundary rules (P-1..P-5) still hold: `apps/web` never imports `apps/api` code or `@remonta/db`.
- **NFR-MNT-03:** The API is versioned (e.g. `/v1`), and the OpenAPI spec is generated from code and checked in CI.

### 6.8 Architecture (NFR-ARCH) — added 2026-09-25 at the user's direction
The user asked that system architecture get particular weight. These three requirements shape Application Design. Their exact form is settled by `application-design/architecture-direction-questions.md`.

- **NFR-ARCH-01 — Every API is secure by default.** Security is enforced by one central request pipeline, not by each endpoint remembering to add it. The pipeline covers authentication, authorization including ownership, input validation, rate limiting, audit and response filtering. An endpoint with no declared access policy is **refused at startup and fails CI**. An automated test enumerates every route and proves that an anonymous call gets 401 and a wrong-role or non-owner call gets 403. **Chosen 2026-09-25 (Q3):** option A (deny-by-default pipeline, central policy-as-code, per-route CI proof, dependency scan, DAST on the preview, AWS WAF), extended to all ten principles in NFR-ARCH-04.
- **NFR-ARCH-02 — Centralised API definition.** Each endpoint is **declared once** in a central contract: method, path, input and output schemas, access policy, rate limit, audit action. Routing, validation, the OpenAPI spec, the generated `apps/app` client and the security pipeline are all derived from that declaration. Adding an endpoint means adding a declaration and its business logic to the domain's existing files, **not** creating new controller, DTO or guard files. **Chosen 2026-09-25 (Q1 A):** one contract per business area (a contract file + an existing handler file per area).
- **NFR-ARCH-03 — Architecture beyond layers.** The service is organised by **business capability** (bounded contexts), not as horizontal layers (controllers / services / repositories). Business rules are kept independent of frameworks and infrastructure behind ports and adapters. Side effects (emails, n8n, geocoding, expiry) are driven by domain events published reliably. **Chosen 2026-09-25 (architecture Q2 A):** a modular monolith with bounded contexts, hexagonal (ports and adapters) inside each module, domain events through a transactional outbox, and CQRS-lite read models for heavy admin lists.
- **NFR-ARCH-04 — The ten API security principles (user's reference, 2026-09-25).** This is what "a dynamic and secured API" means for this project. Every endpoint must satisfy all ten, and each is enforced by the architecture rather than left to individual endpoints. The list lines up with the OWASP API Security Top 10 (2023), which is used as the checklist in design and review.

| # | Principle (user's words, condensed) | OWASP API 2023 | How the design must enforce it | Broken today (RE) |
|---|---|---|---|---|
| P1 | **Don't trust the front end.** The backend always verifies who the user is and what they may do | API2 Broken Authentication | Signed short-lived token + server-side session check on every request, in the central pipeline; nothing the client sends about identity or role is believed | M4, M5, M6, M13 (client sets its own progress) |
| P2 | **Access control: who, what action, which resource**, on every request | API1 BOLA, API5 BFLA | Central policy check (role + ownership + record state) before any data is read; deny by default; startup/CI fail for an endpoint without a policy | H1, H2, M1, M3, M12, M14 |
| P3 | **Business logic: validate the whole journey,** not just single calls | API6 Sensitive Business Flows | State machines enforced server-side in the domain (document, verification, publication, account); flow-level rules (e.g. publish only if always-required documents are approved; setup-password only with a valid token); flow abuse limits | H2, H3, M8 (CAPTCHA skippable), publish with no preconditions |
| P4 | **External APIs: validate their responses,** with our own security layer | API10 Unsafe Consumption | Every outbound adapter (Resend, n8n, Google, CAPTCHA, future payroll) validates responses against a schema, with timeouts, retries and circuit breakers; failures are contained; fail closed for security checks | CAPTCHA fails open; webhooks fire-and-forget |
| P5 | **SSRF** | API7 SSRF | No endpoint fetches a user-supplied URL; outbound calls only to an allow-list of configured hosts; egress restricted at the network level (Infrastructure Design); uploaded-file URLs are generated server-side, never accepted from clients | `updateWorkerPhoto` accepts any URL (RE §5) |
| P6 | **Security configuration: secure the environment,** not just the code | API8 Security Misconfiguration | Secrets in a secrets manager; least-privilege IAM and DB roles (audit table append-only); security headers, CORS allow-list, TLS only; no debug output in production; builds fail on type errors; IaC reviewed; WAF | `ignoreBuildErrors`, hardcoded n8n URL, `devCode` in SMS responses, errors echoed to clients |
| P7 | **API inventory** | API9 Improper Inventory | The central contract is the inventory; the OpenAPI spec is generated from it and checked in CI; no undeclared routes; versioned (`/v1`); retired endpoints proven unreachable | 86 routes + 11 action modules with no inventory; dead and unsafe endpoints still live |
| P8 | **Rate limiting: always limit requests** | API4 Unrestricted Resource Consumption | A limit declared per endpoint in the contract (per user and per IP), enforced centrally; payload and upload size limits; pagination mandatory on lists; WAF burst limits; limits fail closed | Rate limit fails open; unbounded pending list; unauthenticated 50 MB uploads |
| P9 | **Input validation: validate and sanitise all input** | (API8 / injection) | Every input is validated against its contract schema (Zod, strict, unknown fields rejected) before the handler runs; file content-signature checks; output encoding | Registration has truthiness checks only; `update-step` has no validation; MIME-only file checks |
| P10 | **Don't expose sensitive data: return only what's necessary** | API3 BOPLA (excessive data exposure) | Every response is shaped by a declared output schema, and fields not in it are stripped centrally; sensitive fields (bank, DOB, documents) are never in general responses; errors are generic to clients and detailed in logs only | H1 (bank details), H4 (public files), `documentUrl` returned raw |

---

## 7. Constraints
- **CON-01:** 1–2 months, 1–2 developers, with the date fixed (Q19 A, C10 A). MoSCoW priorities decide what gives.
- **CON-02:** `main` deploys both existing products; the backend adds a third deployment. The `CLAUDE.md` process applies, and the backend must not change `vercel.json` build behaviour for the existing apps.
- **CON-03:** The shared production database is live throughout; there is no downtime window.
- **CON-04:** All primary data stays in Australian regions.

---

## 8. Open issues (resolved in the stage named)

| ID | Issue | Resolve in |
|---|---|---|
| OI-01 | **Resolved 2026-09-25 (User Stories Q10 A, F1 A):** the recovered `categories.json` is authoritative and becomes catalogue version 1. Home Modifications → Home and Yard Maintenance list; Fitness and Rehabilitation = Personal Trainer. New obligations for existing workers appear as `PENDING`, with no automatic unpublish. → US-CMP-12, US-MIG-05 | Resolved |
| OI-02 | **Resolved 2026-09-25 (Q11 C, F2a A, F2b A):** an admin may publish with outstanding documents by giving an audited reason, **except** the always-required ones (100 points of ID, NDIS Worker Screening Check, police check, right to work, WWCC where required), which must be approved and current. After publication, an expired document flags the profile; an expired always-required document takes it offline automatically. → US-CMP-07, US-CMP-09, US-CMP-10 | Resolved |
| OI-03 | **Resolved 2026-09-25 (Q12 A):** gender is optional: Female, Male, Non-binary, Prefer to self-describe (free text), Prefer not to say; existing values kept. → US-ONB-01 | Resolved |
| OI-04 | **Resolved 2026-09-25 (Q13 A, F3 C, F3.2 A):** bank details are needed and stay collected, encrypted at field level. In the first release **no one** reads them, admins included; the worker sees a masked version. The payroll/accounting integration is deferred to the next release. → US-ONB-09 | Resolved |
| OI-10 | **Payroll/accounting system for bank details** is undecided (F3.1 C). Needed before the next release's integration is designed | Before next release |
| OI-05 | **Resolved 2026-09-25:** keep the existing n8n registration notification, now sent through the queue (FR-INT-01) | Resolved |
| OI-06 | **Resolved 2026-09-25:** SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min accepted as proposed (NFR-RES-02) | Resolved |
| OI-07 | **Object storage location:** Vercel Blob's region vs. AU-region S3 | Infrastructure Design |
| OI-08 | **Queue technology** (BullMQ on Redis vs SQS) and **Redis residency** (Upstash region vs ElastiCache Sydney) | NFR Requirements |
| OI-09 | **Reverse Engineering:** `.brd/` covers business behaviour; how much the technical reverse engineering needs refreshing for the first-release domains | Workflow Planning |

---

## 9. Extension compliance — Requirements Analysis stage

### Security Compliance
| Rule | Status | Note |
|---|---|---|
| SECURITY-01 … SECURITY-15 | Compliant (as requirements) | Each rule has at least one traceable requirement (§6.2, FR-ID, FR-ACC, FR-AUD). Checking the design and code against these happens in later stages |

No blocking security findings at this stage.

### Resiliency Compliance
| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01 | Compliant (initial) | NFR-RES-01; confirmed in Application Design |
| RESILIENCY-02 | Compliant | RTO/RPO strategy chosen by the user (R1, C2.1). SLA 99.9 %, RTO ≤ 30 min and RPO ≤ 5 min confirmed (OI-06) |
| RESILIENCY-03 | Compliant | The existing `CLAUDE.md` process is named (R3 A) |
| RESILIENCY-04 | Compliant | GitHub Actions (R4 A); rollback by redeploying the pinned image (C2.2 A); canary (R6 D) |
| RESILIENCY-05 … -07, -09, -10, -12, -13 | Compliant (as requirements) | §6.4, §6.5; verified in design |
| RESILIENCY-08 | Compliant | Single region, multi-AZ chosen by the user (C2.1 A) |
| RESILIENCY-11 | Compliant | Backup and point-in-time restore within the region, consistent with C2.1 A; cross-region recovery deferred |
| RESILIENCY-14 | N/A at this stage | Asked at NFR Design, per the rule |
| RESILIENCY-15 | Compliant | Lightweight process to be proposed (C2.3 B) |

No blocking resiliency findings at this stage.

### PBT Compliance
| Rule | Status | Note |
|---|---|---|
| PBT-01 … PBT-10 | N/A at this stage | They apply from Functional Design onward; the property targets are recorded now in NFR-TEST-02 |
