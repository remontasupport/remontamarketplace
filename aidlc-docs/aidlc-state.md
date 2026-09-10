# AI-DLC State Tracking

## Project Information
- **Project Name**: remonta (Remonta Marketplace)
- **Project Type**: Brownfield
- **Start Date**: 2026-09-09T02:12:02Z
- **Current Stage**: CONSTRUCTION - U5 COMPLETE (pnpm on both branches); U6 next
- **Phase A**: U1, U2, U3a, U3 COMPLETE and VERIFIED. **U4 resequenced** to run between U13 and U14 by user decision (2026-09-10) — monitoring deferred until the monorepo is done.
- **Rule Details Directory**: `.aidlc-rule-details/` (AI-DLC rule kit v1.0.1)

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript, TSX, JavaScript
- **Build System**: npm (Next.js 15.5.7 with Turbopack, Prisma 6.16)
- **Project Structure**: Modular monolith — Next.js App Router full-stack application
- **Workspace Root**: `C:\Users\Toton\Desktop\Remonta\remontamarketplace`
- **Reverse Engineering Needed**: Done — artifacts in `aidlc-docs/inception/reverse-engineering/`

## Codebase Scale (Workspace Detection scan)
- **Source files**: 452 (.ts / .tsx / .js across src, middleware, scripts, tests)
- **Lines of code**: ~134,200 (src + middleware.ts)
- **API route handlers**: 86 (`src/app/api/**/route.ts`)
- **Prisma schemas**: 2 — `schema.prisma` (8 models), `auth-schema.prisma` (24 models)
- **Migrations**: 7
- **Tests present**: k6 load/smoke/stress only (`tests/load/`) — no unit or integration test suite detected

## Key Technology Stack (initial scan)
- **Framework**: Next.js 15.5.7 (App Router), React 19.1.0
- **Auth**: NextAuth 4.24 + Prisma adapter, bcryptjs
- **Data**: PostgreSQL via Prisma + Accelerate, `pg`
- **State/Data fetching**: TanStack Query, SWR, Zustand
- **UI**: Tailwind 4, Radix UI, MUI 7, Headless UI, shadcn-style `components/ui`
- **Realtime**: Pusher
- **Email**: Resend, Nodemailer, React Email
- **Storage**: Vercel Blob
- **Rate limiting**: Upstash Redis + Ratelimit
- **Validation**: Zod 4, React Hook Form
- **PDF**: @react-pdf/renderer, jsPDF

## Pre-existing Documentation (not AI-DLC generated)
- `docs/` — architecture-audit.md, business-plan.md, business-requirements.md, FILE_ORGANIZATION.md, README.md, structure.md, Zoho_Jobs_To_DB.md
- `.brd/` — phase-0 through phase-8 business requirements discovery documents
- These will be treated as INPUT to Reverse Engineering, not as a substitute for it.

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Extension Configuration

| Extension | Enabled | Mode | Decided At |
|---|---|---|---|
| Security Baseline | **Yes** | Full — all 15 SECURITY rules blocking | Requirements Analysis |
| Resiliency Baseline | **Yes** | Full — all 15 RESILIENCY rules blocking | Requirements Analysis |
| Property-Based Testing | **Yes** | Full — all 10 PBT rules blocking (answer A, not Partial) | Requirements Analysis |

Full rule files loaded on opt-in per the deferred-loading rule:
- `.aidlc-rule-details/extensions/security/baseline/security-baseline.md`
- `.aidlc-rule-details/extensions/resiliency/baseline/resiliency-baseline.md`
- `.aidlc-rule-details/extensions/testing/property-based/property-based-testing.md`

**Consequence**: from Requirements Analysis onward, every stage completion message must carry a
compliance summary for all three extensions, marking each rule compliant / non-compliant / N/A.
Any non-compliant applicable rule is a **blocking finding** — the "Continue to Next Stage" option
must be withheld until resolved.

**Note on PBT with the current codebase**: the project has no unit or integration test framework
at all (see `code-quality-assessment.md`, TD-3). PBT-09 (framework selection) and PBT-10
(complementary testing strategy) therefore cannot be satisfied without first establishing a test
runner. This is consistent with the user's answer to D1 (quality gates first).

## Stage Progress

### INCEPTION PHASE
- [x] **Workspace Detection** — COMPLETE (2026-09-09T02:12:02Z)
- [x] **Reverse Engineering** — COMPLETE and APPROVED (2026-09-09)
- [x] **Requirements Analysis** — COMPLETE and APPROVED (2026-09-09)
  - `requirements.md` — 39 decisions, FR-1..FR-10, NFR-1..NFR-7, 10 risks, structure review
  - `requirement-verification-questions.md` — 20 questions answered
  - `requirements-clarification-questions.md` — 13 follow-ups answered
- [x] **User Stories** — **SKIPPED** at explicit user request (2026-09-09)
  - AI assessment recommended executing. Consequence: search-visibility acceptance criteria
    (FR-4.2, FR-10.7 — the RISK-2 security boundary) must be captured during U7 Functional Design.
- [x] **Workflow Planning** — COMPLETE and APPROVED (2026-09-09)
  - `plans/execution-plan.md` — risk HIGH, 10 proposed units, dependency graph, 14–23 week estimate
- [x] **Application Design** — COMPLETE and APPROVED (2026-09-10)
  - 5 artifacts in `inception/application-design/`; 15 design decisions AD-01..AD-15
  - 13 packages + 3 apps; no blocking extension findings
- [x] **Units Generation** — COMPLETE and APPROVED (2026-09-10)
  - Part 1: 15 questions answered; Part 2: 3 artifacts generated
  - **15 units in 4 phases**; PS-1..PS-7 production-safety invariants binding
  - Coverage: 54/54 FR, 30/31 NFR, 11/13 TD — gaps deliberate and recorded

### CONSTRUCTION PHASE (per unit)
- [ ] **Functional Design** — EXECUTE (selectively, behaviour-changing units)
- [ ] **NFR Requirements** — EXECUTE
- [ ] **NFR Design** — EXECUTE
- [ ] **Infrastructure Design** — EXECUTE
- [ ] **Code Generation** — EXECUTE (always)
- [ ] **Build and Test** — EXECUTE (always)

### OPERATIONS PHASE
- [ ] **Operations** — placeholder

## Execution Plan Summary
- **Stages to execute**: Application Design, Units Generation, then per-unit Functional Design,
  NFR Requirements, NFR Design, Infrastructure Design, Code Generation, then Build and Test
- **Stages skipped**: User Stories (user request)
- **Risk level**: HIGH — two live products, 149 measured type errors, zero correctness tests,
  a live Zoho integration being retired against unverified population overlap
- **Measured**: `npx tsc --noEmit` on `app/main` returns **149 errors** (2026-09-09); 14 in
  `src/lib` and 8 in `src/services/worker` — code destined for shared packages

## Reverse Engineering Status
- [x] Reverse Engineering - Completed on 2026-09-09T02:12:02Z
- **Artifacts Location**: `aidlc-docs/inception/reverse-engineering/`
- **Artifacts**: business-overview.md, architecture.md, code-structure.md, api-documentation.md,
  component-inventory.md, technology-stack.md, dependencies.md, code-quality-assessment.md,
  reverse-engineering-timestamp.md

## Development Intent (stated 2026-09-09, during Reverse Engineering)

User goal, in their words: "I want to convert this project into a monorepo, because I want to
separate the backend from the front end, and create a mobile application".

Constraints surfaced by Reverse Engineering that bear directly on this goal:
- **56 Server Actions** across `src/services/**` are Next.js RPC only and have NO HTTP surface.
  A mobile client cannot call them. This covers the entire worker onboarding domain — the
  product's core flow.
- **17 files** (15 pages, 2 components) query Prisma directly in Server Components, bypassing the
  API layer. That data has no endpoint behind it.
- **Auth is NextAuth v4** cookie/JWT — browser-shaped, not token-shaped for mobile.
- **No shared contract package** exists for types or response shapes.
- **Two databases duplicate five models**, `Job` most materially — backend package boundaries
  cannot be drawn until ownership is settled.
- **No type checking, no lint gate, no CI, no correctness tests** — nothing would catch code
  broken by a package move.

Favourable finding: `src/lib` is 22 of 24 modules server-clean, so the domain layer can move to a
backend package largely intact.

## Open Items
- Requirements Analysis must establish scope and sequencing for the monorepo split, the
  backend/frontend separation, and the mobile application.
- Extension opt-in questions (security, resiliency, property-based testing) are presented during
  Requirements Analysis.
