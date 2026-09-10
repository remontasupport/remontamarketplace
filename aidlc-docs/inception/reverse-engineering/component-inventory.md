# Component Inventory

**System**: Remonta Marketplace
**Analysis Date**: 2026-09-09T02:12:02Z

---

## Packaging Note

This repository is **not** a monorepo or npm workspace. There is exactly one authored
`package.json` at the root. The second `package.json`, at `src/generated/auth-client/`, is emitted
by Prisma and is not an authored package.

"Component" below therefore means a **logical module** — a coherent directory with a distinct
responsibility — rather than a separately published package. The count reflects logical
components; the physical package count is 1.

---

## Application Components

| Component | Path | Purpose |
|---|---|---|
| **HTTP and Page Surface** | `src/app` | 54 pages, 7 layouts and 86 API route handlers across worker, client, coordinator, admin and public areas |
| **UI Component Library** | `src/components` | 163 React components across 13 domain groups plus a 27-file primitive set |
| **Domain and Integration Layer** | `src/lib` | 24 modules (~4,150 lines): auth, verification, feature access, search, geocoding, Zoho, email, Blob, Redis, rate limiting, reCAPTCHA, logging, share tokens, reports |
| **Worker Domain Services** | `src/services` | 9 worker services plus 1 user service |
| **W1 Promotion Helpers** | `src/lib/w1` | `promote.ts`, `read.ts` — the Json-to-typed-table migration support |
| **React Hooks** | `src/hooks` | 7 domain hooks plus 8 TanStack Query hooks |
| **Client State** | `src/store`, `src/contexts`, `src/providers` | Zustand onboarding store, progress context, query and session providers |
| **Edge Authorization** | `middleware.ts` | Route-level auth and role gating for three page prefixes |

## Model Components

| Component | Path | Purpose |
|---|---|---|
| **Auth Schema** | `prisma/auth-schema.prisma` | The live domain: 24 models, 10 enums |
| **Legacy Schema** | `prisma/schema.prisma` | Zoho-mirror database: 8 models |
| **Target Schema Reference** | `prisma/schema.target.prisma` | Retained design reference; not generated from |
| **Migrations** | `prisma/migrations` | 5 migrations including the 4-step W1 sequence |
| **Legacy SQL** | `prisma/legacy-sql` | Legacy SQL assets |
| **Generated Auth Client** | `src/generated/auth-client` | Prisma client committed to source for Vercel bundling |

## Shared Components

| Component | Path | Purpose |
|---|---|---|
| **Domain Configuration** | `src/config` | 10 modules: setup steps, contract and code-of-conduct content, service offerings, skills, document and qualification requirements |
| **Reference Constants** | `src/constants` | 8 modules: services, languages, onboarding questions, profile answers |
| **Validation Schemas** | `src/schema`, `src/lib/validations` | 6 Zod schemas for client, contractor, registration, service request and worker profile |
| **Utilities** | `src/utils` | 10 helpers: API retry, dynamic compliance and training steps, image crop, phone verification, profile sections, qualification and service-slug mapping |
| **Type Definitions** | `src/types` | Auth roles, NextAuth augmentation, service request, setup progress, worker registration |
| **Reference Data** | `src/lib/data` | Australian postcode dataset |

## Infrastructure Components

| Component | Path | Purpose |
|---|---|---|
| **Vercel Configuration** | `vercel.json` | Build command, hourly cron, per-function Prisma bundling |
| **Next Configuration** | `next.config.ts` | Prisma externals, image optimisation, security headers, 50 MB Server Action limit |
| **Git Hooks** | `.husky` | Pre-commit `lint-staged` with Prettier |
| **Operational Scripts** | `scripts`, `src/scripts` | 5 `tsx` scripts: create admin, promote to admin, verify user, debug document filters, fix qualification names |

> **There is no infrastructure-as-code.** No CDK, Terraform, CloudFormation, Dockerfile or
> compose file exists. All infrastructure is Vercel-managed and configured declaratively through
> `vercel.json` and the Vercel dashboard.

## Test Components

| Component | Path | Type | Purpose |
|---|---|---|---|
| **Load Tests** | `tests/load` | Load / Performance | 5 k6 scripts: `smoke`, `load`, `stress`, `edit-profile`, shared `config.js` |

> **There are no unit tests and no integration tests.** No test runner (Jest, Vitest, Playwright,
> Cypress) appears in the dependency manifest. k6 is invoked as an external binary, not an npm
> dependency. This is the single largest quality gap in the project — see
> `code-quality-assessment.md`, finding TD-3.

---

## Total Count

| Category | Logical components |
|---|---|
| **Application** | 8 |
| **Model** | 6 |
| **Shared** | 6 |
| **Infrastructure** | 4 |
| **Test** | 1 |
| **Total** | **25** |

### Physical counts

| Metric | Count |
|---|---|
| Authored npm packages | 1 |
| Source files (`.ts`, `.tsx`, `.js`) | 452 |
| Lines of code (`src` + `middleware.ts`) | ~134,200 |
| React components | 163 |
| Pages | 54 |
| Layouts | 7 |
| API route handlers | 86 |
| Prisma models | 32 (24 auth + 8 legacy) |
| Prisma enums | 10 |
| Migrations | 5 |
| Domain services | 10 |
| `src/lib` modules | 24 |
| React hooks | 15 |
| Zod schemas | 6 |
| Operational scripts | 5 |
| Automated test files | 5 (all k6 load tests) |
| Runtime dependencies | 55 |
| Dev dependencies | 19 |
