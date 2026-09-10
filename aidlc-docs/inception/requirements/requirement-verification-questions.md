# Requirements Verification Questions

**Stage**: INCEPTION — Requirements Analysis
**Created**: 2026-09-09
**Depth**: Comprehensive (system-wide restructure affecting two live production products)

Please answer each question by putting your letter choice after the `[Answer]:` tag. If none of
the options fit, choose the **Other** option and describe what you want after the tag.

Questions are grouped. **Section A is the one I most need answered** — it resolves a tension
between two of your earlier answers.

---

## Section A — Contractor Data Move (resolves a conflict)

You told me the marketing product owns the Zoho integration, **and** that the contractor data
should move rather than stay a cross-database call. Those two answers pull in opposite
directions, because `ContractorProfile` in the marketing database is populated *by* the Zoho sync.

Current state, for reference:
- `ContractorProfile` lives in the **marketing** database, keyed on `zohoContactId`, kept fresh by the Zoho sync
- `WorkerProfile` lives in the **application** database, created when a worker registers and completes onboarding
- The web app reads `ContractorProfile` in exactly 3 queries, all for contractor search
- Both describe the same real-world people, but neither has a foreign key or shared id with the other

### Question A1
Where should the contractor data end up?

A) Move `ContractorProfile` into the **application** database. The marketing site then reads it from the app via an API instead of directly.

B) Keep `ContractorProfile` in the **marketing** database and move the web app's contractor search *out* of the app — the app calls a marketing API instead of a second database.

C) Merge `ContractorProfile` into `WorkerProfile` in the application database, so there is one worker record rather than two representations of the same person.

D) Keep both where they are for now and only remove the dead model declarations, deferring the data move to a later phase.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question A2
If the contractor data moves out of the marketing database, where should the **Zoho sync write to**?

A) Marketing keeps running the Zoho sync and writes across into the application database.

B) The Zoho sync moves to the application side; marketing keeps only the OAuth credentials and authorisation flow.

C) The Zoho sync becomes a shared backend package that either product can run, with one designated owner at runtime.

D) Not applicable — my answer to A1 keeps the data where the sync already writes.

X) Other (please describe after [Answer]: tag below)

[Answer]: D

### Question A3
Are `ContractorProfile` and `WorkerProfile` the same people?

A) Yes — same individuals, two representations. They should eventually be one record.

B) Partly — overlapping but not identical populations.

C) No — genuinely different groups (for example, contractors are prospects and workers are onboarded).

D) I am not certain and this needs investigation before deciding.

X) Other (please describe after [Answer]: tag below)

[Answer]: The ContractorProfile are just fake ones, I created those by inserting to the table

---

## Section B — Monorepo Structure and Tooling

### Question B1
Which monorepo tooling should be used?

A) **Turborepo** — lightweight, strong Vercel integration, minimal configuration. Natural fit for two Next.js apps already deploying to Vercel.

B) **Nx** — more powerful (generators, dependency graph, affected-only builds) but heavier and more opinionated.

C) **npm/pnpm workspaces only** — no build orchestrator, simplest possible setup, slower CI as the repo grows.

D) No preference — recommend one and justify it.

X) Other (please describe after [Answer]: tag below)

[Answer]: D

### Question B2
Which package manager?

A) **pnpm** — the monorepo default; much faster installs and strict dependency isolation, which prevents packages accidentally using each other's dependencies. Requires migrating the existing `package-lock.json`.

B) **npm workspaces** — stay on npm, no migration, but slower and with looser dependency isolation.

C) **Yarn** — mature workspace support.

D) No preference — recommend one.

X) Other (please describe after [Answer]: tag below)

[Answer]: D

### Question B3
How should the two products' git history be brought together?

A) **Preserve full history for both** via `git subtree` or `git filter-repo`, so `git blame` and `git log` keep working across the move. More setup effort.

B) **Preserve history for the application only** (`app/main`, the larger and more active tree), import the marketing site as a snapshot.

C) **Fresh start** — import both as snapshots, keep the old repository available read-only for history.

D) No preference — recommend one.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question B4
What happens to the 36 existing branches, including 22 `app/main-*` feature branches?

A) Consolidate now — merge or close all in-flight work before the migration, then migrate from a clean state.

B) Migrate first, then rebase surviving active branches onto the new structure.

C) Migrate first and abandon stale branches; only named branches get carried forward.

D) I need to review which branches are still live before deciding.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Section C — Shared UI Package

You said the two products should share a UI package. These questions settle what that means in
practice, because the products currently use different UI stacks.

Current state: the application uses Radix UI, MUI, Headless UI and Tailwind, with a
shadcn-style primitive set in `src/components/ui` (27 files). The marketing site is a Sanity-driven
site with its own presentation.

### Question C1
What should the shared UI package contain?

A) **Design tokens and primitives only** — colours, typography, spacing, buttons, inputs, cards. Each product keeps its own layouts and page-level components.

B) **Primitives plus shared domain components** — anything both products render, for example worker cards and search filters.

C) **A full design system** — everything visual, with both products consuming it exclusively.

D) No preference — recommend a scope.

X) Other (please describe after [Answer]: tag below)

[Answer]: D

### Question C2
The application currently carries four overlapping UI libraries (Radix, MUI, Headless UI, chatscope) and three styling approaches (Tailwind, styled-components, Emotion). Should the shared package consolidate these?

A) **Yes, consolidate as part of this work** — pick one primitive library and one styling approach, migrate to it. Larger effort, but avoids copying the ambiguity into a new package.

B) **Standardise the shared package only** — the new package uses one stack; existing app code is left alone and migrates opportunistically.

C) **No** — carry the current mix into the shared package and address it separately later.

D) No preference — recommend an approach.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question C3
Do the two products need to look visually identical?

A) Yes — one brand, one look, shared components render the same in both.

B) Related but distinct — shared tokens and primitives, but marketing may diverge stylistically.

C) Independent — sharing is for code reuse and consistency of behaviour, not appearance.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Section D — Quality Gates and Sequencing

### Question D1
The Reverse Engineering assessment found that `next.config.ts` disables both TypeScript and ESLint build failures, there is no CI, and there are no correctness tests. My recommendation is to fix this **before** moving code between packages, because otherwise breakage relocates silently across two products. Do you agree?

A) **Yes — restore type checking and add CI first**, as a prerequisite phase before any restructuring.

B) **Partly** — add CI and type checking as part of the migration itself, in the same phase.

C) **No** — proceed with the restructure first, address quality gates afterwards.

D) Restore type checking only; defer CI.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question D2
Re-enabling TypeScript build errors will likely surface a backlog of existing type errors. How should that be handled?

A) Fix all errors before proceeding, however many there are.

B) Enable strict checking for **new and moved** code; grandfather existing errors with a baseline and burn them down over time.

C) Assess the error count first, then decide.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question D3
The two products currently deploy as two separate Vercel projects. After the migration?

A) **Two Vercel projects from one repository**, each scoped to its app directory. Deployments stay independent.

B) **One Vercel project** serving both, with routing between them.

C) Not decided — recommend an approach.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question D4
How should this be delivered?

A) **Incrementally** — both products stay deployable at every step, migration lands in reviewable stages.

B) **Big-bang** — one large restructuring change, accepting a freeze window.

C) **Parallel** — build the monorepo alongside the current setup, cut over when ready.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question D5
Is there a deadline, release, or freeze window constraining this work?

A) No hard deadline — quality over speed.

B) There is a target date (please state it after the tag).

C) There is a freeze period to avoid (please state it after the tag).

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Section E — Security Fixes Found During Analysis

Reverse Engineering found four issues. They are small and self-contained, and cheapest to fix now
while the code is still in one place.

- **TD-1**: `POST /api/admin/fix-qualifications` has no authentication and performs mass writes to compliance records. Appears to be a dead one-time migration; a script version already exists.
- **TD-5**: `/remontaadmin/findsupport` is labelled "Admin access only" but has no auth guard and is not covered by the middleware matcher.
- **TD-4**: the coordinator role check tests `/dashboard/coordinator`, but the route is `/dashboard/supportcoordinators`, so it never fires. Any authenticated user can load the coordinator dashboard UI.
- **TD-2**: `POST /api/upload/worker-photo` accepts unauthenticated uploads to Blob storage with no rate limit.

### Question E1
Should these be fixed as part of this work?

A) **Yes, all four, before the migration** — as a small preliminary phase.

B) Yes, but **as part of the migration**, not before.

C) **Only TD-1 and TD-5** (the unauthenticated admin surfaces); defer the others.

D) **No** — handle separately outside this workflow.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Section F — Extension Opt-Ins

These three questions decide which additional rule sets are enforced as hard constraints for the
rest of this workflow.

### Question F1: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question F2: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question F3: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Section G — Mobile Application (scoped, deprioritised)

You said the mobile app is in scope but should come after the restructure. These answers shape
what the monorepo should *make possible*, even if mobile work happens later.

### Question G1
What should the monorepo do about mobile now?

A) **Structure only** — leave a place for `apps/mobile` and make backend extraction feasible later. No mobile work in this effort.

B) **Structure plus contracts** — also extract the shared types and API contract package now, so mobile has something to build against later.

C) **Structure, contracts, and HTTP surface** — additionally promote the 56 Server Actions to HTTP endpoints, so the backend is mobile-ready when mobile work starts.

X) Other (please describe after [Answer]: tag below)

[Answer]: A AND B

### Question G2
When mobile is built, what technology is expected?

A) React Native / Expo — maximises code sharing with the existing React codebase.

B) Native iOS and Android.

C) A cross-platform alternative (Flutter or similar).

D) Not decided yet.

X) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Section H — Anything Else

### Question H1
Is there anything about the migration, the two products, or their operational constraints that I have not asked about and should know?

[Answer]: 
