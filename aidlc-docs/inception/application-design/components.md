# Components

**Stage**: INCEPTION — Application Design
**Date**: 2026-09-09

Derived from the answers in `plans/application-design-plan.md`. Design decisions referenced as
**AD-xx** below.

## Design Decisions Applied

| ID | Decision | Source |
|---|---|---|
| AD-01 | `domain` is split into **separate workspace sub-packages**, not directories | A1=C |
| AD-02 | `packages/integrations` holds **email only**; app-specific clients stay in `apps/app` | A2=D |
| AD-03 | The 17 direct-Prisma Server Components **route through domain packages** | A3=B |
| AD-04 | Domain functions take an **explicit `Actor` parameter**; no session reads inside | B1=A |
| AD-05 | Authorization is **defence in depth** — coarse role at transport, object-level ownership in domain | B2=C |
| AD-06 | Errors are **hybrid** — throw for authorization and programmer error, `Result` for expected domain failures | B3=C |
| AD-07 | `packages/db` exposes **repository functions**; domain never sees Prisma | B4=B |
| AD-08 | `apps/app/src/services` keeps **thin wrappers plus orchestration** | C1=C |
| AD-09 | `api-client` is **hand-written** now | C2=C |
| AD-10 | Boundaries enforced by **manifest omission plus CI check** | D1=C |
| AD-11 | `apps/mobile` is **prevented now** from importing domain and db | D2=A |
| AD-12 | UI primitives: **Radix**; MUI, Headless UI and chatscope retired | E1=A |
| AD-13 | Styling: **Tailwind only**; styled-components and Emotion retired | E2=A |
| AD-14 | Theming: **shared Tailwind config**, no separate token layer | E3=A |

### Consequence of AD-01 that requires a new package

Splitting `domain` into separate workspace packages means the `Actor` type, the `Result` type, the
`DomainError` hierarchy and the authorization primitives cannot live inside any one of them —
every domain package needs them. This design therefore introduces **`packages/domain-core`** as a
shared kernel.

This is a direct consequence of choosing A1=C over A1=B. Under A1=B those primitives would have
been an internal module of a single `domain` package with no extra manifest. **Total workspace
size is now 13 packages and 3 apps.** Flagged in the completion message for confirmation.

---

## Component Map

```
apps/
  web/                    Marketing site (Sanity). No DB credential.
  app/                    Application. Owns all HTTP routes and Server Actions.
  mobile/                 Expo scaffold. Structure only.

packages/
  config/                 Shared eslint / tsconfig / prettier / tailwind
  schemas/                Zod schemas + shared types. No Next, React or DOM.
  domain-core/            Actor, Result, DomainError, authorization primitives
  db/                     Prisma schema, generated client, repository functions
  integrations/           Email only (Resend). Shared by both web apps.
  ui/                     Radix + Tailwind primitives. Both web apps, not mobile.
  api-client/             Hand-written typed fetch client
  domain-identity/        Users, auth, password, sessions, audit, impersonation
  domain-worker/          Worker profile and onboarding
  domain-verification/    Compliance documents, verification lifecycle, feature access
  domain-demand/          Participants, service requests, worker selection
  domain-jobs/            Job sync, job board, applications
  domain-search/          Worker discovery and faceted search
```

---

## Application Components

### `apps/web` — Marketing Site

- **Purpose**: Public marketing presence and public worker directory.
- **Responsibilities**: Sanity-driven content (newsroom, services, policy, areas), contact and feedback forms, registration entry points, public worker directory.
- **Interfaces consumed**: `packages/api-client` (worker data over HTTP), `packages/ui`, `packages/schemas`, `packages/integrations` (email), `packages/config`.
- **Explicitly forbidden**: `packages/db`, any `domain-*` package, any database connection string (D-35, AD-10).
- **Source**: current `main` branch.

### `apps/app` — Application

- **Purpose**: The authenticated marketplace — worker onboarding, client and coordinator demand, admin operations.
- **Responsibilities**: All HTTP route handlers, all Server Actions, all pages and layouts, session resolution, transport-level role checks (AD-05), cache revalidation.
- **Interfaces consumed**: every package except `api-client` (which it serves rather than consumes).
- **App-local integration clients** (AD-02): Zoho, Vercel Blob, Upstash Redis, geocoding, Twilio SMS, reCAPTCHA.
- **Source**: current `app/main` branch.

### `apps/mobile` — Expo Scaffold

- **Purpose**: Reserved location for the future mobile client (D-29, D-37).
- **Responsibilities**: None in this effort. Scaffold only.
- **Interfaces consumed**: `packages/api-client`, `packages/schemas`.
- **Explicitly forbidden**: `packages/db`, all `domain-*` packages, `packages/ui` (DOM-based) — enforced now per AD-11.

---

## Shared Kernel

### `packages/domain-core`

- **Purpose**: Types and primitives every domain package needs. Introduced by AD-01.
- **Responsibilities**: The `Actor` discriminated union; the `Result` type; the `DomainError` hierarchy; authorization assertion primitives; the `Paginated<T>` envelope.
- **Depends on**: `packages/schemas` only.
- **Contains no**: database access, I/O, framework code.

### `packages/schemas`

- **Purpose**: The shared contract between server, web and mobile.
- **Responsibilities**: Zod schemas for every API input and form; the TypeScript types derived from them; domain enums (`UserRole`, `AccountStatus`, `RequirementStatus`, `CareDomain`, `DayOfWeek`, `ServiceRequestStatus`, `FundingType`, `JobApplicationStatus`, `DocumentCategory`).
- **Hard constraint**: zero dependencies on Next.js, React, the DOM or Prisma. This is what makes it consumable by Expo (FR-3.2, FR-9.1).
- **Source**: `src/schema/*`, `src/types/*`, `src/lib/validations/*`.

### `packages/config`

- **Purpose**: One definition of every quality gate and the shared theme.
- **Responsibilities**: Base `tsconfig`, flat ESLint config including the boundary rules from AD-10 and AD-11, Prettier config, and the shared Tailwind theme that gives both web apps an identical look (AD-14, D-13).

---

## Data Component

### `packages/db`

- **Purpose**: The only component that touches PostgreSQL.
- **Responsibilities**: The consolidated Prisma schema and migrations; the generated client; **repository functions** (AD-07) that are the sole data-access surface.
- **Interface style**: named repository functions grouped by aggregate. The Prisma client is **not** exported from the package root.
- **Consumed by**: all `domain-*` packages. Nothing else.
- **Explicitly forbidden to**: `apps/web`, `apps/mobile`, `packages/ui`, `packages/api-client`, `packages/schemas`.

**Note on faceted search under AD-07.** `worker-search.ts` builds a dynamic query from twelve
optional filters. It already takes a criteria object rather than positional arguments, so it maps
onto a repository function directly — `searchWorkers(criteria: WorkerSearchCriteria)` — with no
leakage of Prisma's `where` shape. The repository boundary holds without contortion.

**Note on scope.** AD-07 means writing repository functions across 24 models rather than exporting
the client. This is deliberate additional work chosen for the boundary it buys.

---

## Domain Components

All six follow the same rules: they take an `Actor` first parameter (AD-04), enforce object-level
authorization (AD-05), return `Result` for expected failures and throw for authorization and
programmer errors (AD-06), and reach data only through `packages/db` repositories (AD-07). None
of them import Next.js, React or Prisma.

### `packages/domain-identity`
- **Purpose**: Who the user is and what they are permitted to be.
- **Responsibilities**: Registration for all four roles; credential verification; password hashing, reset and lockout; session lifecycle; audit logging; admin impersonation.
- **Source**: `src/lib/auth.ts`, `auth.config.ts`, `password.ts`, `impersonation.ts`, `src/app/api/auth/**`, `src/services/user/account.service.ts`.
- **Security relevance**: SECURITY-12 designates this the isolated module for authentication and credential logic; SECURITY-11 requires that isolation.

### `packages/domain-worker`
- **Purpose**: The worker profile and its multi-stage onboarding.
- **Responsibilities**: Profile CRUD; additional info; availability, education, job history and care experience (the W1 typed tables); service category selection; setup progress; profile preview and publication state.
- **Source**: the nine modules in `src/services/worker/*`, plus `src/lib/profileData.ts`.
- **Scale**: the largest domain — roughly 50 of the 56 Server Actions resolve here.

### `packages/domain-verification`
- **Purpose**: The compliance gate that makes supply trustworthy.
- **Responsibilities**: Deriving requirements from selected services (including CONDITIONAL documents); per-document approve, reject, reset and expiry; the overall verification decision; publication; verification statistics; feature-level access (BASIC / VERIFIED / PREMIUM).
- **Source**: `src/lib/verification.ts`, `src/lib/feature-access.ts`, `src/services/worker/compliance.service.ts`, `src/config/*Requirements.ts`, `src/utils/dynamic*Steps.ts`.
- **Note**: holds the statutory screening logic — the highest-consequence domain in the system.

### `packages/domain-demand`
- **Purpose**: The client and coordinator side of the marketplace.
- **Responsibilities**: Participant records; service request lifecycle (PENDING → MATCHED → ACTIVE → COMPLETED, plus CANCELLED, ARCHIVED and reactivation); worker shortlisting and selection; coordinator profiles.
- **Source**: currently inline in `src/app/api/client/**` and `src/app/api/coordinator/**` — this domain has no existing service layer and is being created, not moved.

### `packages/domain-jobs`
- **Purpose**: Remonta's recruitment pipeline as surfaced to workers.
- **Responsibilities**: Zoho lead ingestion and upsert; deactivation of absent leads; the worker-facing job board; application and withdrawal.
- **Source**: `src/lib/zoho.ts` (client stays in `apps/app` per AD-02; the sync logic moves here), `src/app/api/sync-jobs`, `src/app/api/worker/jobs/**`.
- **Note**: marketing's duplicate, unscheduled job sync is retired (FR-10.3).

### `packages/domain-search`
- **Purpose**: Worker discovery, with visibility rules that differ by audience.
- **Responsibilities**: Faceted and geospatial search; two distinct visibility policies — **public** (published and verified only, for marketing via `/api/public/workers`) and **admin** (all workers regardless of status, per D-05); result projection; location string parsing.
- **Source**: `src/lib/worker-search.ts`, `src/lib/location-parser.ts`.
- **Not included**: `src/lib/geocoding.ts` calls an external API, and `services.md` forbids domain packages from calling external services directly. The geocoding **client** goes to `apps/app/src/integrations/geocoding.ts`; `domain-search` receives coordinates as input. `australianPostcodes.ts` is static reference data and goes to `packages/schemas/src/reference/`. *(Corrected 2026-09-09 — see `folder-structure.md` §6.)*
- **Why separate**: it is the only domain consumed by both products, and it is where FR-10.7's security boundary lives. Isolating it makes the two visibility policies explicit rather than emergent from call sites.

---

## Presentation and Client Components

### `packages/ui`
- **Purpose**: One visual language across both web products (D-13).
- **Responsibilities**: Radix-based primitives (AD-12) styled with Tailwind (AD-13), consuming the shared theme from `packages/config` (AD-14).
- **Retires**: MUI (date pickers move to `react-day-picker`, already a dependency), Headless UI, chatscope, styled-components, Emotion, and one of the two icon sets.
- **Consumed by**: `apps/web` and `apps/app`. **Not** `apps/mobile` — these are DOM components.
- **Scope**: tokens and primitives only for now (D-12); domain components deferred until a second real consumer exists.

### `packages/api-client`
- **Purpose**: A typed HTTP surface over `apps/app`.
- **Responsibilities**: Hand-written typed fetch functions (AD-09), request and response types drawn from `packages/schemas`, error normalisation onto the `Result` shape.
- **Consumed by**: `apps/web` (its only route to worker data under D-35) and later `apps/mobile`.
- **Initial surface**: the public worker directory. It grows as mobile requires.

### `packages/integrations`
- **Purpose**: External service clients genuinely shared between the two web apps.
- **Responsibilities**: **Email only** — Resend transport and React Email templates (AD-02).
- **Consumed by**: `apps/web` (contact and feedback forms) and `apps/app` (transactional mail).
- **Deliberately excluded**: Zoho, Blob, Redis, geocoding, SMS and reCAPTCHA stay in `apps/app`, so `apps/web` cannot reach credentials it has no business holding. This preserves D-35's isolation intent (SECURITY-06).
- **Note**: Nodemailer is retired in favour of Resend, removing one duplicate-capability pair.
