# AI-DLC State Tracking

## Project Information
- **Project**: Cut-over clean-up -- remove the legacy worker sign-up path (follow-up 3)
- **Project Type**: Brownfield -- the Remonta monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Start Date**: 2026-10-02 (user: "delete the legacy api in sign up workflow and the connected codes of it")
- **Current Stage**: CONSTRUCTION -- Code Generation complete 2026-10-02 (unit `legacy-removal`, parts A-D, gates
  E1-E2 passed; summary `aidlc-docs/construction/legacy-removal/code/legacy-removal-summary.md`). Build and Test in
  progress: the user opens the PR for `feat/remove-legacy-signup`, CI, the preview protocol (`requirements.md` §5
  step 4), merge, production check (step 5), then the manual Upstash/Vercel clean-up.
  Inception done: inventory (`inception/requirements/legacy-signup-removal-inventory.md`), questions + clarification
  answered (Q1 = B remove engine legacy mode, Q2 = A unavailable card, Q3 = A now, Q4 = B Security + Resiliency, no
  PBT; clarification A "make sure the production api still works 100%"), `requirements.md`, `plans/execution-plan.md`.
  **Nothing deleted yet.** Branch `feat/remove-legacy-signup` from `b7ccc80`.

## Extension Configuration (this cycle)
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes, blocking (Q4 B) | Requirements Analysis, 2026-10-02 |
| Resiliency Baseline | Yes, blocking (Q4 B); targets inherited from S1 | Requirements Analysis, 2026-10-02 |
| Property-Based Testing | No (Q4 B); the engine's existing PBT tests stay | Requirements Analysis, 2026-10-02 |

## Previous cycles (archived, read-only)

| Cycle | Archive | Outcome |
|---|---|---|
| Monorepo migration (U1-U8) | `aidlc-docs/archive/monorepo-migration/` | `apps/app`, `apps/web`, `packages/*` on pnpm + Turborepo; live |
| Slice 1 -- worker registration on `apps/api` | `aidlc-docs/archive/s1-worker-registration/` | Live in production since 2026-10-02 10:20Z |
| Sign-up draft + reCAPTCHA badge (2 units) | `aidlc-docs/archive/signup-draft-and-recaptcha-badge/` | PR #30 and PR #32 merged 2026-10-02; both verified live by the user |

`aidlc-docs/audit.md` is the single append-only audit trail across cycles; never rewrite it.

## What is live (carry forward -- facts the next cycle builds on)

- **Production sign-up runs on `apps/api`** (NestJS 11 on Fastify 5, Cloud Run `remonta-api`, `australia-southeast1`,
  project `remonta-api-510206`), the only sign-up path since 2026-10-02: the pre-S1 page, its routes
  (`/api/auth/register-async`, `/api/auth/check-email`), the Upstash switch `switch:registration` and the form
  engine's legacy mode were removed (cycle `legacy-removal`). The app finds the api through `NEXT_PUBLIC_API_URL` +
  `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (`lib/registration-backend.ts`); with either missing the page shows "Sign-up is
  temporarily unavailable". Rollback of an app change = Vercel promote; of the api = its previous revision/image.
  **Manual after the merge:** delete the Upstash key `switch:registration`; remove `REGISTRATION_BACKEND` from
  Vercel's Preview scope (both are unread now).
- **Staging** `remonta-api-staging` deploys from every merge to `main` that touches the api path; production moves only
  by `workflow_dispatch` promotion (CLAUDE.md "apps/api on Google Cloud Run").
- **The production auth database** (`workerprofiles`, host `ep-delicate-recipe-a7mbt4ef`) carries the 12 S1 migrations,
  PostGIS 3.5, `au_localities` (15,467), `worker_locations` (1,751 backfilled HOME rows; 70 workers unplaced, for
  review), `worker_onboarding` + transitions (1,821), the outbox, rate-limit buckets and scheduled jobs. Runbook and
  results: `archive/s1-worker-registration/construction/S1-registration/S1-production-run.md`.
- **The sign-up wizard's draft lives in the tab's `sessionStorage`** (PR #30, 2026-10-02): a refresh restores it,
  closing the tab or browser deletes it; the adapter `features/forms/adapters/browser.ts` also removes any entry left
  under the old `localStorage` key on load. The engine (`packages/form-engine/src/draft.ts`) is unchanged.
- **The reCAPTCHA badge is hidden with no branding line** (PR #32, 2026-10-02, user decision): `.grecaptcha-badge`
  in `apps/app/src/app/globals.css`. Google's terms ask for the "protected by reCAPTCHA" line when the badge is hidden;
  the compliant variant is commit `ea8f89f` (one revert of `b55e729` away) if ever needed.
- **Secrets** `remonta-api-<NAME>` in Secret Manager; the reCAPTCHA pair is the classic **v3** key `remonta-api`
  (domain `app.remontaservices.com.au`), secret version 4; its site key is Vercel Production
  `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; the staging pair stays on `vercel.app` for previews.
- **Local dev shows "Sign-up is temporarily unavailable"** unless `NEXT_PUBLIC_API_URL` is set: `apps/app/.env` has
  the reCAPTCHA site key but no api URL. Testing sign-up changes needs the Vercel preview, or the api on port 4000 plus
  the CLAUDE.md env overrides.
- **Local Prisma clients differ from the committed ones**: 38 files under `apps/app/src/generated/` (and `apps/web`)
  show real content differences, not only line endings, after a local `prisma generate`. Never staged so far; the cause
  (Prisma version or schema drift) is unexamined.
- **Code scanning**: CodeQL and Semgrep run on every PR (report-only; the Semgrep rule self-test does fail).
- **Reference**: `docs/signup/README.md` documents the live sign-up (flow, endpoints, tables, enums, events; the draft
  and badge paragraphs in `01-flow.md`).

## Follow-ups left open (candidates for the next cycle or housekeeping)

1. **Search slice** (parked since S1): move the worker-search readers (client search, public list, admin list,
   `lib/worker-search.ts`) from `worker_profiles.latitude/longitude` to `worker_locations` + PostGIS; then stop the api's
   legacy dual write (`locations/domain/home.ts`); then a migration drops the columns.
2. **CRM notification** (n8n -> Zoho) for api-mode sign-ups: an outbox handler. Deprioritised 2026-10-01/02.
3. **Cut-over clean-up** -- DONE 2026-10-02 (cycle `legacy-removal`, user decision to proceed the same day). Left
   from it: re-record the Vercel rollback deployment ids in CLAUDE.md (several app deploys since they were recorded);
   `packages/schemas/src/schema/contractorFormSchema.ts` is still exported but has no importer (delete with the other
   stale exports, item 8); `apps/app/docs/*.md` (the 2026-09 business analysis) cite the deleted routes by line
   number and are historical.
4. **Form engine wording**: a reCAPTCHA token failure is reported as "We couldn't reach Remonta…"
   (`packages/form-engine/src/verification.ts`).
5. **Rotate exposed credentials**: the production auth db role `neondb_owner`; the production Blob token; the Prisma
   Accelerate key; the `rehearse-w1` role password. Then update Vercel and the local env files.
6. **Repository visibility**: the GitHub repository is public (checked 2026-10-02); confirm intended.
7. **Generated Prisma clients**: explain and settle the local-vs-committed difference (above), then decide whether
   `src/generated/` should stay in git at all.
8. Smaller: SERVICE_OPTIONS in `apps/app/src/constants` stale vs the catalogue; the stale `UserRole` type in
   packages/schemas; two duplicate `users.email` indexes; the other hand-built forms onto the form engine; admin users
   search still `contains` + insensitive; the 10 codes/h per IP decision; delete the production test worker account of
   2026-10-02 10:26Z if not wanted; delete stale branches (`aidlc/archive-s1`, `fix/signup-draft-session-storage`,
   `fix/recaptcha-badge`, and the older ones).

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript
- **Build System**: pnpm workspaces + Turborepo
- **Project Structure**: Monorepo -- `apps/app` (Next.js application), `apps/web` (Next.js marketing site),
  `apps/api` (NestJS + Fastify on Cloud Run), `packages/{config,schemas,api-contract,form-engine,db}`, `infra/`
- **Workspace Root**: `C:\Users\floil\OneDrive\Documents\Projects\Remonta\remontamarketplace`
- **Reverse Engineering Needed**: decide at Workspace Detection, once the intent is known (the last two cycles deferred
  it). The S1 archive holds a targeted refresh of the registration/onboarding/identity/platform domains (2026-09-25,
  stale for `apps/api`, `packages/api-contract`, `packages/form-engine`, `infra/`); `.brd/phase-0…8` the business view.

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: CLAUDE.md "Dynamic by default" (contract entries + handlers; form definitions)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | _(decide at Requirements Analysis; last two cycles: Yes, blocking)_ | |
| Resiliency Baseline | _(last two cycles: Yes, blocking; targets SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min)_ | |
| Property-Based Testing | _(S1: Yes, full; last cycle: Partial)_ | |

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
