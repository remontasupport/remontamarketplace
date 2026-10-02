# AI-DLC State Tracking

## Project Information
- **Project**: Worker sign-up draft -- no answers kept on the device between visits (`/registration/worker`, api mode)
- **Project Type**: Brownfield -- the Remonta monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Start Date**: 2026-10-02 (user: "start ai dlc")
- **Current Stage**: INCEPTION -- Workflow Planning complete (2026-10-02), awaiting the user's approval of
  `aidlc-docs/inception/plans/execution-plan.md`. Requirements: `aidlc-docs/inception/requirements/requirements.md`
  (decisions D1-D7: sessionStorage; one-time clean-up of the old localStorage key; merge `aidlc/archive-s1` first;
  Security + Resiliency blocking, PBT partial; Reverse Engineering skipped).
- **Next**: (1) the user merges the PR for `aidlc/archive-s1`; (2) branch `fix/signup-draft-session-storage` from
  `main`; (3) Code Generation (plan at `aidlc-docs/construction/plans/draft-storage-code-generation-plan.md`);
  (4) Build and Test, preview checklist `requirements.md` §8.

## Execution Plan Summary
- **Stages to execute**: Code Generation, Build and Test.
- **Stages skipped**: Reverse Engineering (files read in analysis), User Stories (one persona, one behaviour),
  Application Design, Units Generation, Functional Design, NFR Requirements, NFR Design, Infrastructure Design
  (single adapter change; NFRs and extension assessments live in `requirements.md`).

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
- **Workspace Root**: `C:\Users\floil\OneDrive\Documents\Projects\Remonta\remontamarketplace`
- **Brownfield**: yes. `aidlc-docs/inception/reverse-engineering/` is empty for this cycle. The S1 archive holds a
  targeted refresh of the registration/onboarding/identity/platform domains (2026-09-25, HEAD `8e530c1`); it predates
  `apps/api`, `packages/api-contract`, `packages/form-engine` and `infra/`, so it is stale for those and current only
  as a map of the untouched `apps/app` domains. `.brd/phase-0…8` holds the business view (2026-09-23).
- **Reverse Engineering Needed**: deferred, as in the previous cycle, until the cycle's intent is known (kick-off
  Q2). Decision recorded in Workflow Planning.
- **Repository state at kick-off**: branch `aidlc/archive-s1` carries 12 commits not on `main` (the S1 close-out
  audit entries, the archive move, and one code change: `55d52db` photo-preview thumbnail). No PR open (kick-off Q3).

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: CLAUDE.md "Dynamic by default" (contract entries + handlers; form definitions)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes, blocking (V4 A) | Requirements Analysis, 2026-10-02 |
| Resiliency Baseline | Yes, blocking (V5 A); targets and processes inherited from Slice 1 (NFR-RES-01..04) | Requirements Analysis, 2026-10-02 |
| Property-Based Testing | Partial (V6 B): PBT-02, 03, 07, 08, 09 enforced, the rest advisory | Requirements Analysis, 2026-10-02 |

## Stage Progress
### 🔵 INCEPTION PHASE
- [x] Workspace Detection -- 2026-10-02 (brownfield; RE decision deferred to Workflow Planning)
- [x] Reverse Engineering -- SKIPPED (kick-off Q2 = C)
- [x] Requirements Analysis -- 2026-10-02, minimal depth (`inception/requirements/requirements.md`)
- [x] User Stories -- SKIPPED (one persona, one behaviour; acceptance in requirements §8)
- [x] Workflow Planning -- 2026-10-02 (`inception/plans/execution-plan.md`), awaiting approval
- [x] Application Design -- SKIPPED
- [x] Units Generation -- SKIPPED (one unit)

### 🟢 CONSTRUCTION PHASE
- [x] Functional Design, NFR Requirements, NFR Design, Infrastructure Design -- SKIPPED (see execution plan)
- [ ] Code Generation (plan, then generation) -- on `fix/signup-draft-session-storage` from `main`
- [ ] Build and Test -- quality gates, PR, preview checklist, merge, production check
