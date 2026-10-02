# Requirements Clarification Questions — New Backend System

Thanks for answering all 23 questions. Some answers pull against each other, you asked
for a recommendation on the framework, and the Resiliency extension you enabled requires
seven more decisions at this stage.

Where I recommend an option, it's listed first and marked **(Recommended)**. Answer the same
way as before, by putting a letter after `[Answer]:`.

---

## Part 1 — Contradictions and ambiguities

### Contradiction 1: "Independent" vs. shared database, auth and traffic
Q2 you chose **C) Independent, sharing nothing (no shared database, auth or code)**, but also:
- Q5 **A**: `apps/app` calls the backend
- Q9 **A**: it uses the existing Neon database and Prisma schema
- Q10 **A**: it validates the existing NextAuth tokens
- Q15 **A**: old and new run side by side, and domains move over one at a time

Those four answers all mean the backend shares the database, auth and users with `apps/app`.
My reading is that you meant **separate code and a separate technology**, not a separate system.

#### Clarification 1
What does "independent" mean for the new backend?

A) **Separate code and deployment, shared data.** It's a separate NestJS service with its own deployment, but it shares the existing database and auth tokens with `apps/app` while domains move over (Recommended — matches Q5, Q9, Q10, Q15)

B) **Fully independent.** A new database, its own auth, and `apps/app` doesn't call it. (Q5, Q9, Q10 and Q15 would need new answers.)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Ambiguity 2: Framework (Nest vs. Nuxt) and where the code lives (Q6, Q7)
You asked which of NestJS and Nuxt is the better backend. My recommendation is **NestJS**:

- **Nuxt** is a full-stack framework for **Vue** frontends. Its server layer (Nitro) is built to serve a Vue app. Your frontend is React/Next.js, so Nuxt would add a second UI framework without giving you a structured backend.
- **NestJS** is built for exactly this. Its building blocks map directly onto rules you enabled:
  - Guards enforce deny-by-default authorization (SECURITY-08)
  - Validation pipes check every input (SECURITY-05)
  - A global exception filter keeps errors safe for users (SECURITY-15)
  - `@nestjs/terminus` provides health checks (RESILIENCY-06)
  - `@nestjs/bullmq` provides the job queue (Q12)
  - `@nestjs/swagger` generates OpenAPI docs (Q8)
  - OpenTelemetry instrumentation is available for tracing (Q18)
- I suggest running it on the **Fastify adapter** for lower overhead.
- The trade-off: Nest takes more setup than a lightweight framework (Fastify or Hono), which counts against a 1–2 month timeline. Clarification 10 deals with that.

On **where the code lives**: the backend and `apps/app` will write to the same database while domains move over. There should be **one** Prisma schema and **one** migration history. Two codebases that each change the same schema is the most likely way for this migration to break production.

#### Clarification 2
Where should the NestJS backend live?

A) `apps/api` in this monorepo. It shares `packages/db` (one Prisma schema, one migration history) and `packages/schemas`, gets built by Turborepo, and gets checked by the same CI quality gates (Recommended)

B) A separate repository. We'd need to decide which repo owns database migrations, and the other repo would copy the schema

C) A different framework (Fastify or Hono) instead of NestJS — name it after the tag

X) Other (please describe after [Answer]: tag below)

[Answer]: a

### Ambiguity 3: API style (Q8 D vs. Q5 A)
Q8 **D** means REST for external callers plus tRPC for internal clients. But Q5 names **only `apps/app`** as a caller, so there are no external callers yet. Also, tRPC isn't native to NestJS: it would need a community adapter and would sit alongside Nest's own controller model.

#### Clarification 3
Which API style for the first release?

A) REST + OpenAPI, with a typed TypeScript client generated from the OpenAPI spec for `apps/app`. Standard, and works the same for external callers later (Recommended)

B) REST using `ts-rest` contracts defined in `packages/schemas` (the Zod schemas are shared). This gives tRPC-style type safety while the wire format stays plain REST. (Requires Clarification 2 = A.)

C) Keep Q8 D: REST for external callers + tRPC for `apps/app`

X) Other (please describe after [Answer]: tag below)

[Answer]: a

### Ambiguity 4: Changing a schema while two systems use it (Q9, Q15)
Q9 said to keep the existing database but clean and fix the schema along the way. Q15 said old and new run side by side. That means `apps/app` will still be reading and writing tables that the new backend wants to change. A rename or drop that doesn't account for the old app breaks production immediately. (CLAUDE.md: "a green build with every query failing is the standard failure mode".)

#### Clarification 4
How should schema changes be made during the migration?

A) **Expand/contract.** Every change is backward-compatible: add the new column or table → backfill → switch readers → then remove the old column once `apps/app` no longer uses it. Prisma stays the ORM, and `packages/db` stays the only place migrations come from (Recommended)

B) **Separate Postgres schema.** The backend creates its own tables in a separate Postgres schema (e.g. `api`) and copies data over one domain at a time. Old tables aren't changed until their domain has fully moved

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Contradiction 5: Keeping NextAuth (Q10 A) vs. the Security baseline (Q21 A) and identity in the first release (Q4 A)
I checked the current setup (`apps/app/src/lib/auth.config.ts:277-282`, `next-auth ^4.24.11`):
- The session is a **NextAuth v4 JWT that lasts 30 days**, and there's **no server-side session record**
- Logging out can't revoke a token that has already been issued, which **fails SECURITY-12** ("Sessions MUST have server-side expiration, be invalidated on logout")
- The tokens are encrypted with `NEXTAUTH_SECRET` and carry no audience or issuer, so the backend can't do the audience/issuer checks **SECURITY-08** requires

Q4 also puts identity, accounts and roles in the first release, so it needs to be clear what "identity" covers if login stays in NextAuth.

#### Clarification 5
How should authentication work for the first release?

A) **Login stays in `apps/app` (NextAuth) for now, with a fix for the Security baseline.** Sessions get a server-side session/version record so logout and account suspension take effect immediately, and a much shorter lifetime. `apps/app` sends the backend a short-lived signed token with audience and issuer. The backend's "identity" domain covers users, roles and account status; the login screens move in a later phase (Recommended)

B) **The backend owns auth from the first release.** It issues short-lived access tokens and refresh tokens or server sessions, and NextAuth in `apps/app` becomes a thin client that calls it. More work up front, but no rework later

C) **Move to a managed identity provider now** (e.g. Clerk, Auth0, Cognito). Existing password hashes and users need a migration plan

X) Other (please describe after [Answer]: tag below)

[Answer]: a

### Ambiguity 6: The backend as system of record (Q13 B) vs. first-release scope (Q4 A, B)
Q13 **B** makes the backend the system of record, with Zoho receiving copies. The first release covers identity and worker onboarding/compliance. Today, new worker registrations are meant to reach Zoho via n8n, but that push is broken (`N8N_WEBHOOK_URL` is unset — `.brd/phase-0` B, audit XC-02).

#### Clarification 6
What does the first release do with Zoho?

A) From the first release, the backend owns workers, accounts and compliance status, and pushes copies of those records to Zoho through the job queue, with retries and visibility. This replaces the broken n8n push for these domains (Recommended)

B) The first release doesn't touch Zoho. Zoho sync arrives with the later domains (requests, recruitment)

X) Other (please describe after [Answer]: tag below)

[Answer]: b

### Ambiguity 7: Compliance obligations (Q17 = C only)
You chose only **C (data stays in Australia)**. Three things suggest A, B and D may apply too. **Please confirm this with whoever handles compliance at Remonta** — I'm raising it, not giving legal advice.
- The backend stores NDIS participant details and worker identity documents. Organisations that provide health or disability services usually fall under the Australian Privacy Principles whatever their turnover.
- NDIS providers have their own record-keeping obligations.
- The Security baseline you enabled already requires an audit trail of critical data changes: who, what, when, before and after (**SECURITY-13**). `.brd/phase-2` §2.6 found gaps in the current audit trail.

#### Clarification 7
Which obligations should the requirements record?

A) C plus A, B and D: data stays in Australia, the Privacy Act/APPs, NDIS requirements, and a full audit trail of who viewed or changed sensitive records (Recommended, subject to your compliance check)

B) C plus D: data in Australia plus an audit trail of changes (the Security baseline minimum). Privacy Act and NDIS obligations are handled outside engineering

C) C only, as originally answered (the audit trail of changes is still required by SECURITY-13)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

### Ambiguity 8: What must stay in Australia
I confirmed the Neon database is in **Sydney** (`ap-southeast-2`). I have **not** checked these, which also hold data:
- Vercel Blob (compliance documents)
- Upstash Redis (cache and rate limits)
- The container host
- The job queue
- The observability vendor (Q18 B: logs, traces and error reports can contain personal data)

#### Clarification 8
How far does "data stays in Australia" reach?

A) Primary data must be in Australia: database, files/documents, backups, cache and queue. Observability tools may be hosted elsewhere, provided personal data is removed from logs, traces and error reports (Recommended — SECURITY-03 already bans personal data in logs)

B) Everything must be in Australia, including logs, traces, error tracking and email/SMS providers

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Ambiguity 9: Which container platform (Q11)
Clarification 8 means the platform needs an **Australian region**. The Neon database runs on **AWS Sydney**, so running the backend in the same region keeps database latency lowest.

#### Clarification 9
Which container platform?

A) **AWS ECS Fargate in `ap-southeast-2` (Sydney).** Same region as Neon. Spreading across availability zones is built in (RESILIENCY-08), and the Security rules map directly onto its features: load balancer access logs (SECURITY-02), IAM (SECURITY-06), security groups (SECURITY-07). More infrastructure to set up (Recommended)

B) **Google Cloud Run in `australia-southeast1` (Sydney).** Simpler to run and scales automatically, but it's on a different cloud from the database (still in the same city)

C) **Fly.io, Railway or Render.** Simplest, but whether each has an Australian region, and which of the Security/Resiliency features it supports, would need checking in Infrastructure Design

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Contradiction 10: Timeline vs. scope (Q19 A)
Q19 **A** gives 1–2 months with 1–2 developers. The other answers add up to:
- A new framework and service
- Identity plus onboarding/compliance
- Changing the schema of a live database
- Moving domains over one at a time
- A job queue
- Metrics, tracing and alerting
- All three extensions as **blocking** rules (15 security, 15 resiliency and 10 PBT rules)

That's realistic in 1–2 months only with a tightly defined first release.

#### Clarification 10
What gives, if something has to?

A) **Keep the date; narrow the first release.** Identity/accounts (per Clarification 5) + worker onboarding and compliance verification on the new backend, `apps/app` switched over for those screens, and all extensions enforced. The Zoho push, n8n decisions and other domains come in later releases (Recommended)

B) **Keep the scope; extend the date to 3–4 months**

C) **Keep date and scope; relax some extension rules** to advisory (non-blocking) for the first release — name which after the tag

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Ambiguity 11: Which parts of `.brd/` are in scope (Q3 B)
Q3 **B** said you'd name which parts of `.brd/` are in or out. Here's a proposal based on Q4 (A, B):

**In scope for the first release:**
- `.brd/phase-2`: actors and the permissions matrix, including fixing the cases where the UI and the API disagree (§2.4)
- `.brd/phase-3`: J1 worker registration, J2 worker onboarding, J3 compliance verification, J8 account and access
- `.brd/phase-4`: §4.1–4.3 (identity, profile and document rules), §4.7 (rate limits), §4.8 (defaults), §4.10 (derived values), and §4.11 (rules currently enforced only in the browser, which move to the server)
- `.brd/phase-4` §4.9 state machines: worker verification status, compliance document status, worker publication, account status
- `.brd/phase-5`: the worker-lifecycle emails and SMS tied to the above

**Out of scope for the first release:** J4 search, J5 service requests, J6 recruitment, J7 admin reporting, J9 content, and the pricing artefacts (§3.1).

#### Clarification 11
Is this scope right?

A) Yes, use it as proposed

B) Yes, with changes (list them after the tag)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part 2 — Resiliency extension decisions (required by the rules you enabled)

These come directly from the Resiliency baseline (Q22 = A), which says these decisions are
yours, not mine. Where your repo already has a process, I've noted it.

### Resiliency 1 (RESILIENCY-02): RTO/RPO Goals and Disaster Recovery Strategy
What are your Recovery Time Objective (RTO) and Recovery Point Objective (RPO) goals? These determine the appropriate Disaster Recovery strategy and infrastructure redundancy level.

A) RPO/RTO: Hours — Backup & Restore strategy. Lowest cost ($). Data backed up, no services deployed. Redeploy from IaC and restore from backups on failure. Suitable for non-critical workloads.

B) RPO/RTO: 10s of minutes — Pilot Light strategy. Cost: $$. Data live, services idle. Infrastructure deployed but not running, scaled up on failover. Suitable for important workloads.

C) RPO/RTO: Minutes — Warm Standby strategy. Cost: $$$. Data live, services run at reduced capacity. Scaled up during failover. Suitable for business-critical applications.

D) RPO/RTO: Near real-time — Multi-site Active/Active strategy. Highest cost ($$$$). Data live, live services in multiple regions simultaneously. Suitable for mission-critical, zero-downtime requirements.

E) N/A — Single-region deployment is acceptable, no cross-region DR needed. Rely on multi-zone availability within one region.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Resiliency 2 (RESILIENCY-08): Regional Topology
Does this workload require multi-region deployment, or is single-region with multi-zone redundancy sufficient?

*Note: Clarification 8 limits you to Australian regions (Sydney `ap-southeast-2`, Melbourne `ap-southeast-4` on AWS).*

A) Single-region, multi-zone — tolerates zone failure, not full-region failure. Lower cost. (Aligns with RTO/RPO options A/B/E.)

B) Multi-region active-passive — survives region failure with failover. Higher cost. (Aligns with Warm Standby / Pilot Light cross-region.)

C) Multi-region active-active — survives region failure with no downtime. Highest cost. (Aligns with Active/Active.)

X) Other (describe after [Answer]: tag below)

[Answer]: C

### Resiliency 3 (RESILIENCY-03): Change Management Process
How should production changes for this workload be governed? AI-DLC will conform the design to your answer rather than inventing a process.

*Note: your repo already has a documented process in `CLAUDE.md`: branch → PR → CI (App Quality, Web Quality, Supply chain, Package boundaries) → verify the preview → "Merge pull request" → verify production. That counts as option A.*

A) Use our existing organizational change management process — provide the name/tool (e.g., ServiceNow, Jira Change, internal CAB). AI-DLC will reference it and ensure deployable artifacts fit that process (change records, approval gates).

B) No formal process exists yet — AI-DLC should propose a lightweight change management process (change record + approval + rollback note) for the team to adopt.

C) N/A — this workload is exempt from formal change management (e.g., internal tooling). Document the exemption rationale.

X) Other (describe after [Answer]: tag below)

[Answer]: A

### Resiliency 4 (RESILIENCY-04): CI/CD and Deployment Tooling
What CI/CD tooling and deployment process should this workload use?

*Note: the repo already uses GitHub Actions (`.github/`) for CI; deployments to Vercel happen automatically on merge. A container backend needs its own deploy step.*

A) Use our existing CI/CD pipeline — provide the tool (e.g., GitHub Actions, GitLab CI, Jenkins, CodePipeline). AI-DLC will produce artifacts compatible with it.

B) No pipeline exists — AI-DLC should propose a CI/CD pipeline definition appropriate to the chosen IaC and runtime.

X) Other (describe after [Answer]: tag below)

[Answer]: A, and open for improvement

### Resiliency 5 (RESILIENCY-04): Rollback Mechanism
How should a failed production deployment be rolled back?

*Note: if Clarification 4 = A (expand/contract), app rollbacks never need a schema reversal, which makes A or B safe.*

A) Redeploy previous IaC/artifact version (version-pinned rollback)

B) Blue/green swap back to the previous environment

C) Canary auto-rollback on health/metric regression

D) Database-aware rollback required (schema/data migration reversal) — flag for explicit design

E) Use our organization's existing rollback procedure — provide reference

X) Other (describe after [Answer]: tag below)

[Answer]: d

### Resiliency 6 (RESILIENCY-04): Deployment Style
What deployment strategy is acceptable for this workload's risk profile?

A) Direct / in-place (lowest cost, highest blast radius) — acceptable for non-critical workloads

B) Rolling (gradual instance replacement)

C) Blue/green (zero-downtime cutover, higher cost)

D) Canary (progressive traffic shift with automated rollback)

X) Other (describe after [Answer]: tag below)

[Answer]: d

### Resiliency 7 (RESILIENCY-15): Incident Response Process
How are production incidents handled for this workload?

A) Use our existing incident response process — provide the reference (e.g., PagerDuty runbooks, internal IR/on-call process). AI-DLC will align alerting and runbooks to it.

B) No formal process exists — AI-DLC should propose a lightweight incident response and Correction of Errors (COE) process for adoption.

X) Other (describe after [Answer]: tag below)

[Answer]: a
