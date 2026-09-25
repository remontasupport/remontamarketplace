# Requirements — Monorepo Consolidation and Product Separation

**Project**: Remonta Marketplace
**Stage**: INCEPTION — Requirements Analysis
**Date**: 2026-09-09
**Depth**: Comprehensive
**Status**: Awaiting approval — all blocking items resolved

---

## 1. Intent Analysis

| Dimension | Assessment |
|---|---|
| **User request** | "I want to convert this project into a monorepo, because I want to separate the backend from the front end, and create a mobile application" — subsequently refined: "the main branch is currently used in the marketing website while the app/main branch is for the web application" |
| **Request type** | **Migration / Refactoring** (primary), with **New Project** deferred (mobile) |
| **Request clarity** | Initially vague, now **clear** after two clarification rounds (33 questions answered) |
| **Scope estimate** | **Cross-system** — two live production products, two databases, two Vercel projects |
| **Complexity estimate** | **Complex** — 11-month branch divergence, 691 total source files, zero test coverage, no CI, three blocking compliance regimes |
| **Risk profile** | **High** — both products are live; the application handles disability-participant personal data and statutory compliance evidence |

### The real driver

The monorepo objective is not primarily about backend/frontend separation. It is that **two
distinct products are being maintained as two long-lived branches of one repository**:

- `main` → marketing website (Sanity CMS, 231 src files, `DATABASE_URL`)
- `app/main` → web application (460 src files, `AUTH_DATABASE_URL`)

They diverged 2025-10-17 and are **148 vs 381 commits apart**, both actively developed. Nine of
ten shared API endpoints have drifted; the shared `schema.prisma` has drifted by 322 lines.
Branch naming is currently the only signal of product ownership.

Backend/frontend separation and the mobile application are **downstream goals**, deliberately
sequenced after consolidation (see FR-9, and the user's G1 answer).

---

## 2. Decisions Recorded

All decisions below come from the user's answers across two question rounds. Items marked
**[AI recommendation]** were explicitly delegated to me and are justified in Section 6.

### Product and data

| ID | Decision | Source |
|---|---|---|
| D-01 | Monorepo consolidates the marketing site and web application as separate apps | Initial intent |
| D-02 | Marketing product **owns the Zoho integration** — **narrowed by D-38**, see note below | Q3 |
| D-03 | The app's contractor search points at **real `WorkerProfile` records**; the `ContractorProfile` dependency is dropped from the app entirely. **No data migration.** | J2 |
| D-04 | The Zoho → `ContractorProfile` sync **is live in production** today | J1 |
| D-05 | The app's contractor search shows **all workers regardless of publication status** (admin-facing, behind ADMIN auth per FR-5.2) | J3 |
| D-06 | ~~Marketing keeps `ContractorProfile`, its sync, and its webhook~~ — **SUPERSEDED by D-38** | J2, Q3 |
| D-38 | **`ContractorProfile` and its Zoho contractor sync are retired entirely.** `WorkerProfile` becomes the single worker record across both products. Resolves RISK-8. | User, 2026-09-09 |
| D-39 | Retirement follows a **verify-then-drop sequence** (FR-10.6); data is not deleted until population overlap is confirmed | AI recommendation, accepted pending user confirmation |

> **Consequence of D-38 for D-02.** Once the contractor sync is retired, the **only live Zoho
> integration is the application's hourly job sync** (`/api/cron/sync-jobs` → `Job`). Marketing
> would own a Zoho integration it no longer runs, while holding the `zoho/authorize` and
> `zoho/callback` OAuth utility routes that only exist on its branch. In practice both products
> already authenticate independently using `ZOHO_REFRESH_TOKEN`, so nothing breaks at runtime —
> but D-02 should be narrowed to reflect that **the application owns the live Zoho integration**
> and marketing retains only the one-time OAuth utility. Flagged for confirmation; not blocking.

### Structure and tooling

| ID | Decision | Source |
|---|---|---|
| D-07 | Monorepo tooling: **Turborepo** | B1=D **[AI recommendation]** |
| D-08 | Package manager: **pnpm** | B2=D **[AI recommendation]** |
| D-09 | Git history: **fresh start** — both products imported as snapshots; the existing repository is retained read-only for history | B3=C |
| D-10 | Branches: **migrate first, abandon stale branches**; only named branches carry forward | B4=C |
| D-11 | Deployment: **two Vercel projects from one repository**, each scoped to its app directory | D3=C **[AI recommendation]** |
| D-34 | **Single database.** Both apps consolidate onto `AUTH_DATABASE_URL`; the separate marketing database is retired | User, 2026-09-09 |
| D-35 | **Marketing holds no database credential.** It consumes the application's `/api/public/workers` endpoint instead (isolation option 1) | User, 2026-09-09 |
| D-36 | Target structure confirmed: `apps/{web,app,mobile}` + `packages/{db,schemas,domain,api-client,ui}` — see §9 for reviewed refinements | User, 2026-09-09 |
| D-37 | Mobile technology: **Expo** (React Native) — supersedes D-30 | User structure, 2026-09-09 |

### Shared UI

| ID | Decision | Source |
|---|---|---|
| D-12 | Shared UI package scope: **design tokens and primitives only** initially | C1=D **[AI recommendation]** |
| D-13 | The two products must be **visually identical** — one brand, one look | C3=A |
| D-14 | Full UI library consolidation is **split into a separate follow-on effort**; the monorepo lands first with the shared package standardised on one stack | L1=C (revises C2 from A to B) |

### Quality and delivery

| ID | Decision | Source |
|---|---|---|
| D-15 | Type checking and CI are restored **as a prerequisite phase**, before any restructuring | D1=A |
| D-16 | Existing type errors are **grandfathered with a baseline**; strict checking applies to new and moved code | D2=B |
| D-17 | ~~Delivery is **parallel**~~ — **REVISED to incremental** (D-40) | D4=C |
| D-40 | **Delivery is incremental.** The existing repository is restructured progressively, one unit at a time. Both products stay deployable at every step. There is **no cutover event** and no second copy to maintain. Resolves RISK-3. | User, 2026-09-09 (revises D4=C) |
| D-18 | **No deadline** — quality over speed | D5=A |
| D-19 | Four security findings (TD-1, TD-2, TD-4, TD-5) are fixed **as part of the migration** | E1=B |
| D-20 | Team: **solo developer, this is the main focus** | L2=A |

### Resiliency (Resiliency extension mandatory decisions)

| ID | Decision | Source |
|---|---|---|
| D-21 | **RTO/RPO: hours** — Backup & Restore strategy | K1=A |
| D-22 | Change management: **AI-DLC proposes a lightweight process** (change record + approval + rollback note) | K2=B |
| D-23 | CI/CD: **AI-DLC proposes a pipeline** — none exists today | K3=B |
| D-24 | Rollback: **database-aware rollback required** — schema and data migration reversal must be explicitly designed | K4=D |
| D-25 | Deployment style: **blue/green** | K5 **[AI recommendation]** |
| D-26 | Regional topology: **single-region, multi-zone** | K6 **[AI recommendation]** |
| D-27 | Resiliency testing: **AI-DLC proposes a DR testing schedule and chaos experiment plan** | K7=B |
| D-28 | Incident response: **AI-DLC proposes a lightweight IR and Correction of Errors process** | K8=B |

### Mobile (scoped, deprioritised)

| ID | Decision | Source |
|---|---|---|
| D-29 | Monorepo delivers **structure plus a shared contracts package**, so mobile has something to build against later. Server Actions are **not** promoted to HTTP in this effort. | G1="A AND B" (B supersets A) |
| D-30 | Mobile technology: **not yet decided** | G2=D |

### Extensions

| ID | Decision | Source |
|---|---|---|
| D-31 | Security Baseline: **enabled**, all 15 rules blocking | F1=A |
| D-32 | Resiliency Baseline: **enabled**, all 15 rules blocking | F2=A |
| D-33 | Property-Based Testing: **enabled**, all 10 rules blocking (full, not partial) | F3=A |

---

## 3. Functional Requirements

### FR-1 — Monorepo structure
The repository shall contain both products as independently buildable, independently deployable
workspace packages under a single root.

- **FR-1.1** Structure shall be as confirmed in D-36 and refined in §9:
  ```
  apps/
    web/          # main branch -> marketing site (Sanity)
    app/          # app/main branch -> the application, incl. /api
    mobile/       # Expo, structure only
  packages/
    db/           # prisma schema + generated client
    schemas/      # Zod schemas + shared types
    domain/       # framework-neutral business logic
    api-client/   # typed fetch client
    ui/           # shadcn/Radix components, both web apps
    config/       # shared eslint/ts/prettier/tailwind config
  ```
- **FR-1.2** `apps/web` shall contain the current `main` branch product (Sanity CMS marketing site).
- **FR-1.3** `apps/app` shall contain the current `app/main` branch product, including all API routes.
- **FR-1.4** `apps/mobile` shall be reserved for Expo but not implemented (D-29, D-37).
- **FR-1.5** Turborepo shall orchestrate build, lint, type-check and test tasks (D-07).
- **FR-1.6** pnpm workspaces shall manage dependencies (D-08).
- **Traces to**: D-01, D-07, D-08, D-29

### FR-2 — Product import
Both products shall be imported into the monorepo as snapshots.

- **FR-2.1** History shall not be preserved through the move; the existing repository is retained read-only as the historical record (D-09).
- **FR-2.2** The import shall be verified by confirming each app builds and deploys independently before cutover.
- **FR-2.3** Only branches named as active shall be carried forward; the remaining branches of the current 36 are abandoned (D-10).
- **Traces to**: D-09, D-10

### FR-3 — Shared packages
Code used by more than one app shall live in a shared package rather than being duplicated.

- **FR-3.1** `packages/ui` shall provide design tokens and UI primitives (D-12) on a single primitive library and single styling approach. It shall be consumed by **both** `apps/web` and `apps/app`, and shall **not** be consumed by `apps/mobile` (DOM-based components cannot render in React Native). It is **required**, not optional, because D-13 mandates visual parity.
- **FR-3.2** `packages/schemas` shall provide shared Zod schemas and TypeScript types. It shall carry **no Next.js, React or DOM dependency**, so Expo can consume it (FR-9.1).
- **FR-3.3** `packages/db` shall own the Prisma schema and generated client for the single consolidated database (D-34). It shall be consumed by `apps/app` and `packages/domain` only — **never** by `apps/web` (D-35) or `apps/mobile`.
- **FR-3.4** `packages/domain` shall contain framework-neutral business logic extracted from `src/services/*` and `src/lib/*`. See **RISK-7** — the source modules are Next.js Server Actions and must be de-coupled from the framework during extraction.
- **FR-3.5** `packages/api-client` shall provide a typed fetch client over `apps/app`'s HTTP API, consumed by `apps/mobile` and by `apps/web` (which under D-35 reaches worker data only this way).
- **FR-3.6** `packages/config` shall provide shared ESLint, TypeScript, Prettier and Tailwind configuration, so quality gates (FR-6) are defined once.
- **FR-3.7** The nine drifted shared endpoints shall be reconciled to one implementation each, owned by whichever product is authoritative.
- **FR-3.8** Both web products shall render shared components identically (D-13).
- **Traces to**: D-12, D-13, D-29, D-34, D-35, D-36

### FR-4 — Contractor search re-pointing
The web application's contractor search shall read worker data from the application database
rather than the marketing database.

- **FR-4.1** A new endpoint in `apps/web` shall serve worker search results from `WorkerProfile` in the application database.
- **FR-4.2** The search shall return **all** workers regardless of `isPublished` or verification status (D-05).
- **FR-4.3** `/api/contractors` and `/api/contractors/[id]` shall be removed from `apps/web`, along with the `@/lib/prisma` legacy client and the five dead model declarations on the app's copy of `schema.prisma`.
- **FR-4.4** `SearchSupport.tsx` shall consume the new endpoint.
- **FR-4.5** No contractor data shall be migrated between databases (D-03).
- **FR-4.6** Marketing shall retain `ContractorProfile`, `sync-contractors`, and the `zoho-contractor` webhook unchanged (D-06).
- **FR-4.7** The marketing website shall remain functional throughout — see **RISK-1**; the new endpoint shall be built and verified before anything is removed.
- **Traces to**: D-02, D-03, D-05, D-06

### FR-5 — Security remediation
The four findings from Reverse Engineering shall be resolved during the migration (D-19).

- **FR-5.1 (TD-1)** `POST /api/admin/fix-qualifications` shall be removed. The equivalent script `src/scripts/fixQualificationNames.ts` is retained.
- **FR-5.2 (TD-5)** `/remontaadmin/findsupport` shall be brought under an authenticated, ADMIN-guarded route, or removed. **This is a precondition of FR-4.2** — see RISK-2.
- **FR-5.3 (TD-4)** The coordinator role check shall test `/dashboard/supportcoordinators`. Dashboard layout guards shall assert role, not merely authentication.
- **FR-5.4 (TD-2)** `POST /api/upload/worker-photo` shall enforce rate limiting and bind uploads to a short-lived registration token.
- **Traces to**: D-19; SECURITY-08, SECURITY-11

### FR-6 — Quality gates (prerequisite phase)
Automated quality gates shall exist before any code moves between packages (D-15).

- **FR-6.1** `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` shall be removed from both products' Next configs.
- **FR-6.2** Existing type errors shall be captured in a baseline; new and moved code shall type-check strictly (D-16).
- **FR-6.3** A CI pipeline shall run type-check, lint, and tests on every pull request, and shall be able to fail a merge (D-23).
- **FR-6.4** A unit and integration test framework shall be established — none exists today.
- **FR-6.5** A property-based testing framework shall be configured (D-33, PBT-09).
- **FR-6.6** A dependency vulnerability scanning step shall be added to CI (SECURITY-10).
- **Traces to**: D-15, D-16, D-23, D-33

### FR-7 — Deployment
Each app shall deploy independently from the monorepo (D-11).

- **FR-7.1** Two Vercel projects shall each target one app directory, preserving independent deploy cadence.
- **FR-7.2** Build commands shall run through Turborepo with remote caching enabled.
- **FR-7.3** Deployments shall use blue/green semantics (D-25).
- **FR-7.4** Both apps shall use the single consolidated database via `AUTH_DATABASE_URL` (D-34). `apps/web` shall **not** receive any database connection string in its Vercel environment (D-35); it reaches worker data through `apps/app`'s public API only.
- **FR-7.5** The marketing database (`DATABASE_URL`) shall be retired once `ContractorProfile` and `Job` usage is resolved (see FR-10).
- **Traces to**: D-11, D-25, D-34, D-35

### FR-8 — Process artefacts
Because no formal processes exist, the following shall be proposed for adoption.

- **FR-8.1** A lightweight change management process — change record, approval, rollback note (D-22).
- **FR-8.2** A CI/CD pipeline definition (D-23).
- **FR-8.3** A database-aware rollback procedure covering Prisma schema and data migration reversal (D-24).
- **FR-8.4** A DR testing schedule and chaos experiment plan (D-27).
- **FR-8.5** A lightweight incident response and Correction of Errors process (D-28).
- **Traces to**: D-22, D-23, D-24, D-27, D-28

### FR-9 — Mobile readiness (structure only)
The monorepo shall make future mobile work feasible without doing it now (D-29).

- **FR-9.1** `packages/contracts` shall be consumable by a React Native client (no Next.js or DOM dependencies).
- **FR-9.2** The 56 Server Actions shall **not** be promoted to HTTP endpoints in this effort; this is documented as the primary blocker for mobile.
- **FR-9.3** Mobile technology selection is deferred (D-30).
- **Traces to**: D-29, D-30

---

### FR-10 — Database consolidation
Both apps shall run against one database; the marketing database shall be retired (D-34).

- **FR-10.1** Marketing's database footprint is exactly two models — `ContractorProfile` (read by `/api/contractors`, `/api/contractors/[id]`, `/api/contractors-by-area`; written by `/api/sync-contractors` and the `zoho-contractor` webhook) and `Job` (read by `/api/jobs`, written by `/api/sync-jobs`). No other model is touched.
- **FR-10.2** Marketing's public worker directory shall be re-pointed at `apps/app`'s `/api/public/workers` endpoint, which already returns the correct projection (id, name, introduction, photo, city, state, services) with no contact details or documents.
- **FR-10.3** Marketing's `Job` usage shall be retired. The job sync is **duplicated** — both products carry `sync-jobs` writing to their own `Job` model — and marketing's `vercel.json` declares an empty `crons` array, so its copy is unscheduled and its data stale. The application's hourly sync is authoritative.
- **FR-10.4** `ContractorProfile`, `/api/sync-contractors`, `/api/webhooks/zoho-contractor`, `/api/contractors`, `/api/contractors/[id]` and `/api/contractors-by-area` shall be **retired from both products** (D-38). `WorkerProfile` becomes the single worker record.
- **FR-10.5** No worker data shall be duplicated across databases once consolidation completes.
- **FR-10.6** Retirement shall follow this sequence, and shall **not** begin with data deletion (D-39):
  1. **Verify populations first.** Compare `ContractorProfile` against `WorkerProfile` — row counts, and overlap on email — to establish whether Zoho contractors are already registered workers. This is a read-only check and is a **precondition** for every step below.
  2. **Re-point reads.** Marketing's public directory moves to `apps/app`'s `/api/public/workers` (FR-10.2); the app's search moves to `WorkerProfile` (FR-4).
  3. **Stop writes.** Disable the contractor webhook in Zoho, then remove `/api/sync-contractors` and `/api/webhooks/zoho-contractor`.
  4. **Dormancy period.** Leave the `ContractorProfile` table and its data in place, unread and unwritten, for an agreed period.
  5. **Drop last.** Remove the model and table only after the dormancy period passes without regression.
- **FR-10.7** **Endpoint segregation (security).** `apps/web` shall consume **only** `/api/public/workers`, which returns the published bio projection. It shall **not** consume the unrestricted admin search from FR-4.2. The two surfaces have different visibility rules — public directory shows published, verified workers; admin search shows all workers behind ADMIN authorization.
- **Traces to**: D-02, D-05, D-34, D-35, D-38, D-39; SECURITY-08

---

## 4. Non-Functional Requirements

### NFR-1 — Availability and recovery
- **NFR-1.1** RTO and RPO targets are **hours**; Backup & Restore is the DR strategy (D-21).
- **NFR-1.2** Topology is **single-region, multi-zone** (D-26). Neon PostgreSQL is in `ap-southeast-2`.
- **NFR-1.3** Both databases shall have documented, verified backup and restore procedures.
- **NFR-1.4** No cross-region failover is required.
- **Traces to**: RESILIENCY-02, RESILIENCY-08, RESILIENCY-11, RESILIENCY-12

### NFR-2 — Deployability
- **NFR-2.1** Both products shall remain deployable at all times during the migration.
- **NFR-2.2** Any single migration step shall be revertible without data loss.
- **NFR-2.3** Schema changes shall have an explicitly designed reversal path (D-24).
- **Traces to**: RESILIENCY-04

### NFR-3 — Security
- **NFR-3.1** All application endpoints shall deny by default and enforce authorization server-side (SECURITY-08).
- **NFR-3.2** HTTP security headers — CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` — shall be applied to **all** HTML-serving routes in both products, not only `/dashboard/*` (SECURITY-04).
- **NFR-3.3** All API inputs shall be schema-validated with explicit length and size bounds (SECURITY-05).
- **NFR-3.4** Public-facing endpoints shall be rate limited (SECURITY-11).
- **NFR-3.5** No secrets shall appear in source; the exposed Neon credential shall be rotated (SECURITY-12).
- **NFR-3.6** Dependencies shall be pinned via lock file, vulnerability-scanned in CI, and an SBOM generated for production builds (SECURITY-10).
- **NFR-3.7** Unused dependencies shall be removed — `pusher`, `pusher-js` have no found usage (SECURITY-10).
- **Traces to**: SECURITY-04, 05, 08, 10, 11, 12

### NFR-4 — Observability
- **NFR-4.1** Structured logging with timestamp, correlation ID, level and message shall be configured in both apps (SECURITY-03).
- **NFR-4.2** No PII, tokens or credentials shall appear in logs (SECURITY-03).
- **NFR-4.3** Alerting shall be configured for authentication failures and authorization violations (SECURITY-14).
- **NFR-4.4** Logs shall be retained for at least 90 days (SECURITY-14).
- **NFR-4.5** Health checks shall exist for both apps (RESILIENCY-06).
- **Traces to**: SECURITY-03, SECURITY-14, RESILIENCY-05, RESILIENCY-06

### NFR-5 — Testability
- **NFR-5.1** A unit and integration test framework shall be established (FR-6.4).
- **NFR-5.2** Property-based tests shall cover round-trip properties, invariants and idempotency where identifiable (PBT-02, PBT-03, PBT-04).
- **NFR-5.3** PBT shall complement, not replace, example-based tests (PBT-10).
- **NFR-5.4** Failing property tests shall shrink to minimal reproducing cases and be reproducible by seed (PBT-08).
- **Traces to**: PBT-01 through PBT-10

### NFR-6 — Maintainability
- **NFR-6.1** No code shall be duplicated across apps; shared code lives in `packages/`.
- **NFR-6.2** Each package shall declare its own dependencies; pnpm strict isolation shall prevent phantom dependencies.
- **NFR-6.3** Product ownership shall be expressed by directory structure, not branch name.
- **NFR-6.4** The shared UI package shall use exactly one primitive library and one styling approach (D-14).

### NFR-7 — Performance
- **NFR-7.1** No regression in page load or API latency relative to current production.
- **NFR-7.2** Turborepo remote caching shall keep CI build times workable as the repo grows.
- **NFR-7.3** Existing k6 load scripts shall be carried forward and run against the new structure before cutover.

---

## 5. Risks

### RISK-1 — Deliberate marketing-website breakage (HIGH)
The user's J1 answer states the Zoho sync "can be eliminated now, by meaning eliminating, we can
let an error to the website marketing while building the api that points to the workerprofile."

**This is not necessary and is not recommended.** The marketing site and the app read
`ContractorProfile` independently. The new `WorkerProfile`-backed endpoint can be built and
verified in `apps/web` **before** anything is removed, with no marketing downtime and no extra
effort. Breaking a live marketing site provides no sequencing benefit.

**FR-4.7 therefore specifies build-then-cut-over.** If deliberate downtime is genuinely intended,
this requirement needs changing and a maintenance window agreeing.

**Note**: J1 also revises the earlier A3 answer. A3 said `ContractorProfile` rows were "just fake
ones"; J1 confirms the sync is live in production, so the table holds **real synced contractor
data alongside** the hand-inserted test rows. Removal of the app's dependency remains correct,
but the table itself is not disposable.

### RISK-2 — Unguarded page combined with unrestricted search (HIGH — security)
D-05 (FR-4.2) returns **all** workers regardless of publication or verification status. The only
consumer of that search is `SearchSupport.tsx`, rendered by `/remontaadmin/findsupport`, which
**currently has no authentication guard whatsoever** (TD-5).

Shipping FR-4.2 without FR-5.2 would expose every unpublished, unverified worker profile —
including people mid-onboarding — to anonymous callers. **FR-5.2 is a hard precondition of
FR-4.2** and the two must ship together. This is a **SECURITY-08 blocking constraint**.

### RISK-3 — Parallel delivery with a solo developer — **RESOLVED**
**Resolution (user, 2026-09-09): incremental delivery** (D-40, revising D4=C).

The original concern: parallel delivery plus a solo developer meant maintaining two copies of two
live products until cutover, with every change landing twice — the same drift mechanism that
produced the current 148-vs-381 branch divergence.

Incremental removes that mechanism. There is one codebase throughout, so a fix lands once, and
there is no cutover event to get wrong.

**Residual cost, accepted**: the repository holds a mixed structure mid-migration (partly old
layout, partly packages), and some units need temporary shims so both shapes resolve at once.
NFR-2.1 already requires both products stay deployable at every step, which is what makes this
safe.

**Consequence for RISK-1**: incremental delivery makes build-then-cutover the natural default for
the contractor search change too, since there is never a moment where the old path is removed
before the new one works.

### RISK-4 — Fresh-start history loss (MEDIUM)
D-09 discards history through the move. `git blame` and `git log` will not traverse the boundary
for 691 files. The old repository must be preserved read-only and its location documented.

### RISK-5 — Three blocking compliance regimes on a zero-test codebase (MEDIUM)
All 40 extension rules are blocking. The codebase currently has no unit tests, no CI, no CSP, no
alerting, and no SBOM. Many rules will be non-compliant on first evaluation and will gate stage
completion. FR-6 exists to address this first, but stage progress will be slower than a
non-extension workflow.

### RISK-7 — `packages/domain` cannot hold Server Actions as-is (MEDIUM)
The proposed `packages/domain` draws from `src/services/*`. **All ten of those modules begin with
`"use server"`** — they are 56 Next.js Server Actions, not plain functions. A Server Action is a
framework construct bound to Next's RPC protocol; it cannot be imported by Expo and does not
belong in a framework-neutral package.

**Required approach**: extract the business logic as plain async functions into `packages/domain`,
and leave thin `"use server"` wrappers in `apps/app` that call them. That keeps existing web
behaviour working unchanged while making the logic reusable by a future HTTP layer and by mobile.
Without this split, `packages/domain` silently becomes Next-only and FR-9.1 fails.

### RISK-8 — Zoho write path has no destination under D-35 — **RESOLVED**
**Resolution (user, 2026-09-09): option 1 — retire `ContractorProfile` and its sync entirely**
(D-38). The conflict between D-02, D-35 and the observed write path dissolves because the write
path ceases to exist. `WorkerProfile` becomes the single worker record; marketing reads it through
`/api/public/workers`.

**Residual risk, now tracked as RISK-10.**

### RISK-10 — Population overlap between `ContractorProfile` and `WorkerProfile` is unverified (HIGH)
D-38 retires a **live production integration**. Whether that is safe depends on a fact that is
still not established, and which the two available answers contradict:

- **A3**: "The ContractorProfile are just fake ones, I created those by inserting to the table"
- **J1**: "Yes it is currently renning in production"

If the sync is live, the table holds real Zoho-sourced contractors. If those people are **not**
also registered as `WorkerProfile` records, then retiring the sync means marketing's public
directory will show a **smaller or different set of people** than it does today, and an active
data source stops. Nothing in the schema settles this — the two models share no id and no foreign
key, and this analysis has no database access.

**Mitigation**: FR-10.6 makes population verification a precondition of every retirement step, and
defers data deletion behind a dormancy period. Executed in that order, the decision is recoverable
at every stage until step 5.

**Action required before Construction**: run the comparison in FR-10.6 step 1 and record the
result. If the populations diverge materially, D-38 should be revisited.

### RISK-9 — `apps/web` / `apps/app` naming is a durable trap (LOW severity, HIGH nuisance)
In the confirmed structure, `apps/web` is the **marketing** site and `apps/app` is the
**application**. "web" naturally reads as "the web app", which is the other one. Every future
contributor — human or AI — will reach for the wrong directory, and the mistake is silent.

**Recommendation**: `apps/marketing` and `apps/web`. The cost is zero now and non-trivial later.
This is a naming preference, not a blocker; the structure is otherwise sound.

### RISK-6 — Exposed database credential (MEDIUM — security)
A live Neon connection string was shared in conversation. `.env` is correctly gitignored and
untracked, so the repository is clean; the exposure is the disclosure itself. **NFR-3.5 requires
rotation.**

---

## 6. Justification for Delegated Recommendations

### D-07 — Turborepo (B1)
Two Next.js apps already deploying to Vercel. Turborepo is built by Vercel, needs almost no
configuration for this shape, and gets free remote caching on Vercel. Nx offers generators and a
richer dependency graph, but that power is aimed at many-package repositories; for two apps and
four packages it is configuration overhead without payoff. Workspaces alone would leave CI
re-building everything on every change.

### D-08 — pnpm (B2)
Chosen specifically because of TD-7. This codebase has six areas of duplicate capability and a
history of packages reaching for whatever is hoisted. pnpm's strict isolation makes a package's
undeclared dependency a build error rather than an accident that works until it doesn't. In a
repo about to gain shared packages, that property is worth the one-time lockfile migration.

### D-12 — Tokens and primitives only (C1)
With D-14 splitting full consolidation into a later effort, the shared package should start at
the layer both products genuinely share: colour, typography, spacing, and basic controls. Shared
*domain* components (worker cards, search filters) should wait until a second real consumer
exists — building them for a hypothetical mobile app risks designing for a client that does not
exist yet. The package can grow to option B later without rework.

### D-11 — Two Vercel projects (D3)
Preserves independent deploy cadence, which matters because the marketing site and the
application have very different release rhythms. One project serving both would require routing
logic and couple their deployments — the opposite of what this migration is for. Turborepo
supports per-project root directories natively.

### D-25 — Blue/green (K5)
This is what Vercel already does. Each deployment is an immutable build, and promotion is an
atomic alias switch with instant rollback. That is blue/green semantics at the platform level,
at no additional cost and with no extra infrastructure. Canary would need traffic-splitting the
platform does not provide by default; direct/in-place misdescribes what actually happens.

### D-26 — Single-region, multi-zone (K6)
Follows directly from D-21. Backup & Restore with an RTO measured in hours does not justify
multi-region infrastructure, and the resiliency extension explicitly flags over-engineering as a
finding. Neon runs in `ap-southeast-2` with multi-zone durability; both Vercel projects serve
from the edge. Multi-region would contradict the chosen recovery target and add substantial cost
and operational complexity for a solo developer.

---

## 7. Out of Scope

| Item | Rationale |
|---|---|
| Mobile application implementation | Deferred by D-29; structure and contracts only |
| Promoting 56 Server Actions to HTTP | D-29; documented as the primary mobile blocker |
| NextAuth v4 → Auth.js v5 migration | Required for mobile token auth, not for consolidation |
| Full UI library consolidation | Split out by D-14 into a follow-on effort |
| Backend extraction into a standalone service | Sequenced after consolidation |
| Merging the two databases | Explicitly not required; D-03 removes the only coupling |
| Reconciling the 148/381 divergent commits | D-09 imports snapshots instead |
| Adding foreign keys for TD-9 | Data-integrity debt, not migration-blocking |
| Resolving TD-6, TD-10, TD-11, TD-12, TD-13 | Documented debt, not in this scope |

---

## 8. Summary

This is a **consolidation project, not a backend-extraction project**. Two products maintained as
two branches for eleven months are being brought into one repository as two apps, with shared code
extracted into packages and product ownership expressed by directory rather than branch name.

The work sequences as: **quality gates first** (type checking, CI, test frameworks — none of which
exist today), then **parallel monorepo construction**, then **cutover**, with four security fixes
and the contractor-search re-pointing landing along the way. Mobile is scoped but deliberately
deferred; the monorepo's job is to make it possible, not to deliver it.

Two items need attention before Workflow Planning:

- **RISK-2 is a blocking security constraint.** FR-4.2 (show all workers) cannot ship without
  FR-5.2 (guard the page). Together they are fine; separately they expose unverified worker
  profiles anonymously.
- **RISK-1 and RISK-3 carry recommendations against recorded decisions** — build-then-cutover
  rather than deliberate marketing breakage, and incremental rather than parallel delivery for a
  solo developer. Both are the user's call; both are documented rather than silently applied.

---

## 9. Structure Review

The structure supplied by the user on 2026-09-09 was reviewed against the reverse-engineering
findings. **Verdict: sound.** The package boundaries match the coupling actually measured in the
codebase — `src/lib` is 22-of-24 modules server-clean, so a `domain` package is viable, and the
existing `/api/public/workers` projection makes `api-client` a natural fit for marketing under
D-35. Six refinements follow.

### Accepted as proposed

| Package | Assessment |
|---|---|
| `apps/mobile` (Expo) | Correct choice — maximises reuse of the existing React codebase. Records the D-37 decision that G2 left open. |
| `packages/db` | Correct as **singular** given D-34 consolidates to one database. Consumed by `apps/app` and `packages/domain` only. |
| `packages/schemas` | Good. Must stay dependency-free of Next/React/DOM so Expo can consume it (FR-3.2). |
| `packages/api-client` | Strong fit. Now has **three** consumers, not two — mobile, and `apps/web` under D-35. |

### Refinements

**R-1 — Rename the two web apps.** `apps/web` = marketing and `apps/app` = the application
inverts the intuitive reading. Recommend `apps/marketing` and `apps/web`. See RISK-9.

**R-2 — `packages/domain` needs a Server Action split.** The source modules are all `"use server"`.
Extract plain functions into the package; leave thin Server Action wrappers in `apps/app`.
See RISK-7.

**R-3 — `packages/ui` is required, not optional.** D-13 mandates visual parity between the two web
products, so a shared UI package is load-bearing. "Web-only" is correct in the sense of *excluded
from Expo* — shadcn and Radix are DOM-based — but it serves **both** web apps, not one.

**R-4 — Add `packages/config`.** Shared ESLint, TypeScript, Prettier and Tailwind configuration.
FR-6 requires quality gates applied consistently across every package; without a config package
each one drifts. Standard for Turborepo.

**R-5 — Plan for the generated Prisma client.** `src/generated/auth-client` is currently committed
and force-bundled through both `next.config.ts` (`outputFileTracingIncludes`,
`serverExternalPackages`) and `vercel.json` (`includeFiles`). Moving it into `packages/db` will
break those paths. This is already the most fragile part of the deployment configuration and
needs explicit attention during Construction.

**R-6 — Zoho write path: RESOLVED.** `packages/db` being app-only left
marketing with no write path for the contractor sync it owned. Resolved by D-38: the sync is
retired entirely. Residual verification risk tracked as RISK-10 (FR-10.6).

### Traceability

| Structure element | Requirement |
|---|---|
| `apps/web`, `apps/app`, `apps/mobile` | FR-1.1 – FR-1.4 |
| `packages/db` | FR-3.3, FR-10 |
| `packages/schemas` | FR-3.2, FR-9.1 |
| `packages/domain` | FR-3.4, RISK-7 |
| `packages/api-client` | FR-3.5, FR-10.2 |
| `packages/ui` | FR-3.1, D-13 |
| `packages/config` | FR-3.6, FR-6 |
