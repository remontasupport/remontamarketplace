# AI-DLC State Tracking

## Project Information
- **Project**: _(new cycle -- to be named at Inception)_
- **Project Type**: Brownfield -- the Remonta monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Start Date**: _(set when the new cycle starts)_
- **Current Stage**: INCEPTION -- not started. The previous cycle closed on 2026-10-02; see "What is live" below before planning anything.

## Previous cycles (archived, read-only)

| Cycle | Archive | Outcome |
|---|---|---|
| Monorepo migration (U1-U8) | `aidlc-docs/archive/monorepo-migration/` | `apps/app`, `apps/web`, `packages/*` on pnpm + Turborepo; live |
| Slice 1 -- worker registration on `apps/api` | `aidlc-docs/archive/s1-worker-registration/` | **Live in production since 2026-10-02 10:20Z** |

`aidlc-docs/audit.md` is the single append-only audit trail across cycles; never rewrite it.

## What is live (carry forward -- facts the next cycle builds on)

- **Production sign-up runs on `apps/api`** (NestJS 11 on Fastify 5, Cloud Run `remonta-api`, `australia-southeast1`,
  project `remonta-api-510206`, revision 00003 of image `7e79f8b…`). The Upstash key `switch:registration` = `api`
  selects it; `legacy` is the rollback (effective on the next request) and serves `apps/app/src/features/forms/legacy/worker/`.
- **Staging** `remonta-api-staging` deploys from every merge to `main` that touches the api path; production moves only
  by `workflow_dispatch` promotion (CLAUDE.md "apps/api on Google Cloud Run").
- **The production auth database** (`workerprofiles`, host `ep-delicate-recipe-a7mbt4ef`) carries the 12 S1 migrations,
  PostGIS 3.5, `au_localities` (15,467), `worker_locations` (1,751 backfilled HOME rows; 70 workers unplaced, for
  review), `worker_onboarding` + transitions (1,821), the outbox, rate-limit buckets and scheduled jobs. Runbook and
  results: the archive's `construction/S1-registration/S1-production-run.md`.
- **Secrets** `remonta-api-<NAME>` in Secret Manager; the reCAPTCHA pair is the classic **v3** key `remonta-api`
  (domain `app.remontaservices.com.au`), secret version 4; its site key is Vercel Production
  `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; the staging pair stays on `vercel.app` for previews.
- **Code scanning**: CodeQL and Semgrep run on every PR (report-only; the Semgrep rule self-test does fail).
- **Reference**: `docs/signup/README.md` documents the live sign-up (flow, endpoints, tables, enums, events).

## Follow-ups left open by Slice 1 (candidates for the next cycle or housekeeping)

1. **Search slice** (first item the standing instruction parked): move the worker-search readers (client search,
   public list, admin list, `lib/worker-search.ts`) from `worker_profiles.latitude/longitude` to `worker_locations`
   + PostGIS; then stop the api's legacy dual write (`locations/domain/home.ts`); then a migration drops the columns.
2. **CRM notification** (n8n -> Zoho) for api-mode sign-ups: an outbox handler; until then new workers are read from
   the admin list. Deprioritised by the user 2026-10-01/02.
3. **Cut-over clean-up** once the canary is accepted (~a week of real sign-ups): delete `features/forms/legacy/worker/`
   and the `legacy` branches of the definition/switch; remove the `lib/auth-prisma.ts` omit of the three S1 columns
   (safe now); re-record the Vercel rollback deployment ids in CLAUDE.md.
4. **Form engine wording**: a reCAPTCHA token failure is reported as "We couldn't reach Remonta…" -- give it its own
   message (`packages/form-engine/src/verification.ts`).
5. **Rotate exposed credentials**: the production auth db role `neondb_owner` on `ep-delicate-recipe-a7mbt4ef`
   (connection string appeared in tool output 2026-10-02); the production Blob token; the Prisma Accelerate key; the
   `rehearse-w1` role password. Then update Vercel and the local env files.
6. **Repository visibility**: the GitHub repository is public (checked 2026-10-02); confirm intended. Making it private
   needs the Code Security add-on for the scanners to keep working.
7. Smaller: SERVICE_OPTIONS in `apps/app/src/constants` stale vs the catalogue; the stale `UserRole` type in
   packages/schemas; two duplicate `users.email` indexes; the other hand-built forms onto the form engine; admin users
   search still `contains` + insensitive; the 10 codes/h per IP decision; delete the test worker account created on
   production 2026-10-02 10:26Z (cl***@remontaservices.com.au) if not wanted; delete stale branches.

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript
- **Build System**: pnpm workspaces + Turborepo
- **Project Structure**: Monorepo -- `apps/app` (Next.js application), `apps/web` (Next.js marketing site),
  `apps/api` (NestJS + Fastify on Cloud Run), `packages/{config,schemas,api-contract,form-engine,db}`, `infra/`
- **Reverse Engineering Needed**: Decide at Workspace Detection. The S1 archive holds a targeted refresh of the
  in-scope domains (2026-09-25) and `.brd/phase-0…8` the business view (2026-09-23).

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: CLAUDE.md "Dynamic by default" (contract entries + handlers; form definitions)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | _(decide at Requirements Analysis; S1 used: Yes, blocking)_ | |
| Resiliency Baseline | _(S1: Yes, blocking)_ | |
| Property-Based Testing | _(S1: Yes, full enforcement)_ | |

## Stage Progress
### 🔵 INCEPTION PHASE
- [ ] Workspace Detection
- [ ] Reverse Engineering
- [ ] Requirements Analysis
- [ ] User Stories
- [ ] Workflow Planning
- [ ] Application Design
- [ ] Units Generation

### 🟢 CONSTRUCTION PHASE
- [ ] Per unit: Functional Design, NFR Requirements, NFR Design, Infrastructure Design, Code Generation
- [ ] Build and Test
