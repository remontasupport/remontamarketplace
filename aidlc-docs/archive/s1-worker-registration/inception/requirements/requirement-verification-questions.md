# Requirements Verification Questions — New Backend System

"A new backend system" leaves the scope open, so these questions pin it down.
Fill in the letter after each `[Answer]:` tag. If no option fits, pick the last one
(Other) and describe what you want after the tag. Add notes under any answer.

Context I used: the existing monorepo (`apps/app`, `apps/web`, `packages/*`) and the
business-requirements reverse engineering in `.brd/phase-0` … `phase-8`.

---

## Part A — What the backend is

## Question 1
What is the new backend system for?

A) A backend for the **existing Remonta product**: the worker, client, coordinator and admin journeys described in `.brd/phase-3`

B) A backend for a **new Remonta product or capability** that doesn't exist today (describe it after the tag)

C) An **internal operations backend** for Remonta staff (e.g. replacing work done in Zoho CRM / n8n)

D) An **integration / API platform** that other systems (partners, providers, internal tools) call

X) Other (please describe after [Answer]: tag below)

[Answer]: A, we will optimize the system architecture of the backend as well and improve each code logic.

## Question 2
How does the new backend relate to the current application (`apps/app`)?

A) **Replaces** it. `apps/app` becomes a pure frontend (or is rebuilt) and calls the new backend for all data and logic

B) **Runs alongside** it. The new backend owns some domains, and `apps/app` keeps the rest

C) **Independent.** It shares nothing with `apps/app` (no shared database, auth or code)

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 3
Should the `.brd/` documents (phases 0–8) be treated as the source of business requirements?

A) Yes. The backend must preserve the business rules, state machines and journeys they describe, and fix the gaps they identify

B) Partly. Use them as reference, but I'll say which parts are in or out of scope

C) No. They describe the old system, and the new backend has different requirements

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
Which business domains must the **first release** cover? (Multiple letters allowed, e.g. `A, B`)

A) Identity, accounts and roles (worker / client / coordinator / admin)

B) Worker onboarding and compliance document verification (`.brd` J2, J3)

C) Demand side: worker search and service requests (`.brd` J4, J5)

D) Recruitment: Zoho vacancies → job listings → applications (`.brd` J6)

E) Administration and reporting (`.brd` J7)

F) Full parity with the current app from day one

X) Other (please describe after [Answer]: tag below)

[Answer]: A and B

## Question 5
Who or what calls the backend? (Multiple letters allowed)

A) The existing Next.js application (`apps/app`)

B) A mobile app (current or planned)

C) Remonta staff tools / an admin console

D) External parties: Zoho, n8n, partners or providers calling in via webhooks or API

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part B — Technical shape

## Question 6
Where should the backend code live?

A) A new app in this monorepo (e.g. `apps/api`), sharing `packages/schemas` and `packages/db`

B) A new app in this monorepo with its **own** data layer (not sharing `packages/db`)

C) A separate repository

X) Other (please describe after [Answer]: tag below)

[Answer]: I am planning to use a separate tech, I am choosing between Nest or Nuxt, but what is the best backend? I am open to your recommendation

## Question 7
Which language and framework?

A) TypeScript on Node.js with a structured framework (NestJS)

B) TypeScript on Node.js with a lightweight framework (Fastify or Hono)

C) TypeScript using Next.js route handlers / server actions (no separate server)

D) A different language (e.g. Go, Python, Java, C#) — name it after the tag

X) Other (please describe after [Answer]: tag below)

[Answer]: A, but I am open to your suggestions

## Question 8
What API style?

A) REST (JSON over HTTP, OpenAPI-documented)

B) GraphQL

C) tRPC (typed RPC shared with TypeScript clients)

D) REST for external callers + tRPC or RPC for internal clients

X) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 9
What database?

A) The **existing** Neon Postgres database and Prisma schema (`packages/db`), evolved in place

B) A **new** Postgres database with a redesigned schema, with data migrated from the current one

C) A new database with no migration (a fresh start)

D) A different database technology — name it after the tag

X) Other (please describe after [Answer]: tag below)

[Answer]: Can we do A, but we will clean and fix the schema along the way

## Question 10
How should authentication work?

A) Keep the current auth (NextAuth with JWT sessions in `apps/app`), and have the backend validate the same tokens

B) Move auth into the new backend (it issues and validates sessions/tokens itself)

C) Use a managed identity provider (e.g. Clerk, Auth0, AWS Cognito, Microsoft Entra)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 11
Where will the backend be hosted?

A) Vercel (serverless functions, same platform as the current apps)

B) AWS (e.g. ECS/Fargate, Lambda, App Runner)

C) A container platform (e.g. Fly.io, Railway, Render, Google Cloud Run)

D) Azure

X) Other (please describe after [Answer]: tag below)

[Answer]: I am planning to a container platform

## Question 12
Does the backend need background processing (scheduled syncs, queues, retries, long-running jobs)?

A) Yes, a proper job queue with retries and visibility (e.g. BullMQ, SQS, Inngest, Trigger.dev)

B) Only simple scheduled jobs (cron)

C) No background processing

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part C — Integrations and business ownership

## Question 13
What role does **Zoho CRM** play once the new backend exists? (`.brd/phase-6` shows Zoho is currently the system of record for everything commercial.)

A) Zoho stays the system of record. The backend syncs to and from it reliably

B) The backend becomes the system of record. Zoho receives copies for staff/sales use

C) Zoho is phased out entirely

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 14
What happens to the **n8n automations** (`.brd/phase-6` §6.2: n8n currently holds real business logic)?

A) Move that logic into the backend, where it's versioned and tested

B) Keep n8n, but have the backend call it through well-defined, monitored interfaces

C) Decide per workflow during design

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 15
How should the move to the new backend happen?

A) Incrementally, domain by domain (strangler pattern). The old and new systems run side by side, with no big cutover

B) Build it fully, then cut over in one go

C) No migration needed (new system / new data)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part D — Non-functional requirements

## Question 16
What scale should the first version handle?

A) Small: hundreds of active users, low concurrency

B) Medium: thousands of active users, moderate concurrency

C) Large: tens of thousands of active users or more, high concurrency

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 17
What compliance and data-handling obligations apply? The backend stores NDIS participant and worker identity/compliance documents. (Multiple letters allowed)

A) Australian Privacy Act / Australian Privacy Principles

B) NDIS Practice Standards / NDIS Commission requirements

C) All data (database, files, backups) must stay in Australia (data residency)

D) A full audit trail of who viewed or changed sensitive records

E) No specific obligations beyond general good practice

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 18
What level of observability do you want?

A) Structured logging + error tracking (e.g. Sentry) + basic uptime checks

B) Option A plus metrics, tracing and alerting (e.g. OpenTelemetry, Datadog, Grafana)

C) Minimal: platform logs only, for now

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 19
What are the delivery constraints?

A) Target date within 1–2 months, small team (1–2 developers)

B) Target date within 3–6 months, small team

C) Longer horizon, or a larger team

D) No fixed date: quality over speed

X) Other (please describe the date, team size and what "done" means after [Answer]: tag below)

[Answer]: A

---

## Part E — Process

## Question 20
The previous AI-DLC cycle (the monorepo migration, U1–U8) is committed in git under `aidlc-docs/` but has been removed from your working tree. What should happen to it?

A) Move it to `aidlc-docs/archive/monorepo-migration/`, so it stays browsable next to the new cycle

B) Remove it from the branch for good (still recoverable from git history)

C) Leave it as it is in git, and I'll handle it myself

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part F — Extensions

## Question 21: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 22: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 23: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: A
