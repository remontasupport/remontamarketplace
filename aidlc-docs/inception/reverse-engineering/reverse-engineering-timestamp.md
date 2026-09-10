# Reverse Engineering Metadata

**Analysis Date**: 2026-09-09T02:12:02Z
**Analyzer**: AI-DLC (rule kit v1.0.1)
**Workspace**: `C:\Users\Toton\Desktop\Remonta\remontamarketplace`
**Git branch**: `app/main`
**Git HEAD at analysis**: `c541580` — "Remove the parity, archive and rehearsal tooling"
**Working tree state**: clean at analysis start

## Scope Analysed

| Metric | Value |
|---|---|
| Source files in scope | 452 (`.ts`, `.tsx`, `.js` across `src`, `middleware.ts`, `scripts`, `tests`) |
| Lines of code | ~134,200 (`src` + `middleware.ts`) |
| API route handlers | 86 |
| Server Actions | 56 across 10 modules |
| Pages | 54 (21 Server Components, 33 Client Components) |
| React components | 163 |
| Prisma models | 32 (24 auth + 8 legacy) |
| Prisma enums | 10 |
| Migrations | 5 |
| Runtime dependencies | 55 |
| Dev dependencies | 19 |
| Environment variables referenced | 35 |

## Artifacts Generated

- [x] `business-overview.md` — business context, 18 business transactions, business dictionary, onboarding flow
- [x] `architecture.md` — system architecture, component descriptions, data flows, integration points
- [x] `code-structure.md` — build system, module hierarchy, file inventory, design patterns, critical dependencies
- [x] `api-documentation.md` — all 86 endpoints with guards, internal APIs, full data model
- [x] `component-inventory.md` — 25 logical components with physical counts
- [x] `technology-stack.md` — languages, frameworks, infrastructure, tooling, environment configuration
- [x] `dependencies.md` — internal dependency graph, **client/server boundary coupling analysis**, external dependencies
- [x] `code-quality-assessment.md` — test coverage, 13 ranked technical debt findings, patterns and anti-patterns
- [x] `branch-topology.md` — two-product branch divergence, shared-surface drift, cross-product coupling
- [x] `reverse-engineering-timestamp.md` — this file

## Method and Confidence

Findings were established by reading the referenced files directly. Where an initial search
produced a misleading result, the corrected finding is what the artifacts record — specifically,
a first-pass grep suggested roughly twenty unguarded `/api/admin/*` routes; reading the files
showed the pattern had missed `requireRole` and `requireAnyRole`, and the corrected count of
genuinely unguarded admin endpoints is one.

**Not verified in this pass** (would require running the system or external access):
- Runtime behaviour, actual query performance, or production data volumes
- Package license fields (stated from convention, not machine-verified)
- Whether `SearchSupport` on the unprotected `/remontaadmin/findsupport` route successfully
  returns data, which determines the real severity of finding TD-5
- Contents of `.env` / `.env.local` (deliberately not read; confirmed untracked by git)
- The legacy `DATABASE_URL` database's actual contents or whether it is still written to

## Pre-existing Documentation Treated as Input

These were noted as context and are not AI-DLC artifacts:
- `docs/` — `architecture-audit.md`, `business-plan.md`, `business-requirements.md`,
  `FILE_ORGANIZATION.md`, `README.md`, `structure.md`, `Zoho_Jobs_To_DB.md`
- `.brd/` — `phase-0-orient.md` through `phase-8-build-archaeology.md`

## Note on a Prior AI-DLC Session

`prisma/auth-schema.prisma` references `aidlc-docs/inception/application-design/target-schema.md`,
which does not exist in this repository. The W1 migration commits indicate a prior design session
whose artifacts were not retained. The `aidlc-docs/` tree created in this session is new.

## Relevance to the Stated Goal

The user's development intent — convert to a monorepo, separate backend from frontend, and add a
mobile application — was stated during this stage. `dependencies.md` was extended with a
**Client / Server Boundary Analysis** section addressing it directly, and
`code-quality-assessment.md` closes with a priority order for that goal.

## Post-Analysis Revisions (2026-09-09)

Two user clarifications during the approval gate materially changed the findings:

1. **Objective reframed** — the monorepo driver is that `main` (marketing website) and `app/main`
   (web application) are two products maintained as two long-lived branches. Added
   `branch-topology.md` documenting an 11-month divergence (148 vs 381 commits), nine of ten
   shared endpoints drifted, and a 322-line schema divergence.

2. **Database ownership confirmed** — `DATABASE_URL` is the marketing database and
   `AUTH_DATABASE_URL` the application database; they are physically separate. Finding TD-8 was
   revised from Medium to Low: the apparent duplicate-model confusion is two products' schemas
   coexisting on one branch, and the real cross-product coupling is 3 queries against 1 model in
   2 files. Five model declarations on `app/main`'s `schema.prisma` are dead.

A measurement error was corrected in the process: a `prisma.` search over-counted legacy-database
usage because several files alias the auth client with `import { authPrisma as prisma }`.
