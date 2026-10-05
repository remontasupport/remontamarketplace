# AI-DLC State Tracking

## Project Information
- **Project**: Sign-up photo on Google Cloud Storage -- direct browser upload, server verification, background processing, HEIC no longer accepted, latency alert corrected (branch `aidlc/signup-photo-gcs`)
- **Project Type**: Brownfield -- the Remonta monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Start Date**: 2026-10-05
- **Current Stage**: CONSTRUCTION -- U3 `photo-gcs` NFR Design artifacts awaiting approval (scope: sign-up only, user 2026-10-05).
  Decision (chat, 2026-10-05): "Option A" -- a Google Cloud Storage bucket in Sydney with api-issued upload tickets;
  old photos stay in Vercel Blob (store region `syd1`). Requirements approved; 18 stories approved. Evidence and
  code map: `inception/requirements/signup-photo-inventory.md`.

## Previous cycles (archived, read-only)

| Cycle | Archive | Outcome |
|---|---|---|
| Monorepo migration (U1-U8) | `aidlc-docs/archive/monorepo-migration/` | `apps/app`, `apps/web`, `packages/*` on pnpm + Turborepo; live |
| Slice 1 -- worker registration on `apps/api` | `aidlc-docs/archive/s1-worker-registration/` | Live in production since 2026-10-02 10:20Z |
| Sign-up draft + reCAPTCHA badge (2 units) | `aidlc-docs/archive/signup-draft-and-recaptcha-badge/` | PR #30 and PR #32 merged 2026-10-02; verified live |
| Legacy sign-up removal (cut-over clean-up) | `aidlc-docs/archive/legacy-signup-removal/` | PR #34 merged 2026-10-02 (`a30946e`); verified live; Upstash switch key deleted |

`aidlc-docs/audit.md` is the single append-only audit trail across cycles; never rewrite it.

## What is live (carry forward -- facts the next cycle builds on)

- **The worker sign-up has one backend: `apps/api`** (NestJS 11 on Fastify 5, Cloud Run `remonta-api`,
  `australia-southeast1`, project `remonta-api-510206`, URL `remonta-api-154148201608.australia-southeast1.run.app`).
  The pre-S1 page, its routes (`/api/auth/register-async`, `/api/auth/check-email`), the Upstash switch and the form
  engine's legacy mode were removed on 2026-10-02 (last version: commit `b7ccc80`). The app finds the api through
  `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (`apps/app/src/lib/registration-backend.ts`); with either
  missing the page shows "Sign-up is temporarily unavailable" and logs the variable name. Rollback of an app change =
  Vercel promote; of the api = its previous revision/image.
- **Staging** `remonta-api-staging` deploys from every merge to `main` that touches the api path; production moves only
  by `workflow_dispatch` promotion (CLAUDE.md "apps/api on Google Cloud Run"). Vercel Preview points at staging through
  the two public variables. **Still to remove by hand:** `REGISTRATION_BACKEND` in Vercel's Preview scope (unread).
- **The production auth database** (`workerprofiles`, host `ep-delicate-recipe-a7mbt4ef`) carries the 12 S1 migrations,
  PostGIS 3.5, `au_localities` (15,467), `worker_locations` (1,751 backfilled HOME rows; 70 workers unplaced, for
  review), `worker_onboarding` + transitions (1,821), the outbox, rate-limit buckets and scheduled jobs. Runbook:
  `archive/s1-worker-registration/construction/S1-registration/S1-production-run.md`. The api still dual-writes
  `worker_profiles.location/city/state/postalCode/latitude/longitude` because the search readers read them (follow-up 1).
- **The sign-up draft lives in the tab's `sessionStorage`** (PR #30): a refresh restores it, closing the tab deletes it.
- **The reCAPTCHA badge is hidden with no branding line** (PR #32, user decision; compliant variant = commit `ea8f89f`).
- **Secrets** `remonta-api-<NAME>` in Secret Manager; the reCAPTCHA pair is the classic v3 key `remonta-api`
  (domain `app.remontaservices.com.au`), secret version 4; the staging pair stays on `vercel.app` for previews.
  `RECAPTCHA_SECRET_KEY` in `apps/app` still serves the client/coordinator register routes.
- **Local dev shows "Sign-up is temporarily unavailable"** unless `NEXT_PUBLIC_API_URL` is set (`apps/app/.env` has no
  api URL). Test sign-up changes on a Vercel preview, or run the api on port 4000 with the CLAUDE.md env overrides.
- **Local Prisma clients differ from the committed ones** (content, not only line endings) after a local
  `prisma generate`; never staged so far; cause unexamined (follow-up 7).
- **Quality gates (2026-10-02):** app 144 type / 488 lint known / 83 tests; form-engine 51; api-contract 34; api 373
  (124 need `TEST_DATABASE_URL`). CodeQL and Semgrep run on every PR; "Code scanning results / CodeQL" fails a PR on a
  new high-severity alert (it did once, fixed in `packages/api-contract/src/client.ts`).
- **Reference**: `docs/signup/README.md` documents the live sign-up; `03-data-model.md` §5 keeps the pre-S1 writes as
  history (rows from before 2026-10-02 differ: mobile as typed, `LOGIN_SUCCESS` as the registration audit action).

## Follow-ups left open (candidates for the next cycle or housekeeping)

1. **Search slice**: move the worker-search readers (client search, public list, admin list, `lib/worker-search.ts`)
   from `worker_profiles.latitude/longitude` to `worker_locations` + PostGIS; then stop the api's dual write
   (`locations/domain/home.ts`, `LegacyLocationColumns`); then a migration drops the columns.
2. **CRM notification** (n8n -> Zoho) for sign-ups: an outbox handler. The only code that ever posted to the webhook
   went with the legacy route; until the handler exists new workers are read from the admin list.
3. **Re-record the Vercel rollback deployment ids** in CLAUDE.md (several app deploys since they were recorded).
4. **Form engine wording**: a reCAPTCHA token failure is reported as "We couldn't reach Remonta…"
   (`packages/form-engine/src/verification.ts`).
5. **Rotate exposed credentials**: the production auth db role `neondb_owner`; the production Blob token; the Prisma
   Accelerate key; the `rehearse-w1` role password. Then update Vercel and the local env files.
6. **Repository visibility**: the GitHub repository is public (checked 2026-10-02); confirm intended.
7. **Generated Prisma clients**: explain and settle the local-vs-committed difference; decide whether `src/generated/`
   stays in git.
8. **Stale exports and docs**: `packages/schemas/src/schema/contractorFormSchema.ts` (exported, no importer), the
   stale `UserRole` type in packages/schemas, `apps/app/docs/*.md` (2026-09 analysis citing deleted routes).
9. Smaller: SERVICE_OPTIONS in `apps/app/src/constants` stale vs the catalogue; two duplicate `users.email` indexes;
   the other hand-built forms onto the form engine (api-only now: add the contract entry first); admin users search
   still `contains` + insensitive; the 10 codes/h per IP decision; the production test worker account of
   2026-10-02 10:26Z; stale branches (`aidlc/*`, `fix/*`, `feat/remove-legacy-signup`, and the older ones); tighten
   the app lint baseline file to 488 deliberately.

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript
- **Build System**: pnpm workspaces + Turborepo
- **Project Structure**: Monorepo -- `apps/app` (Next.js application), `apps/web` (Next.js marketing site),
  `apps/api` (NestJS + Fastify on Cloud Run), `packages/{config,schemas,api-contract,form-engine,db}`, `infra/`
- **Workspace Root**: `C:\Users\floil\OneDrive\Documents\Projects\Remonta\remontamarketplace`
- **Reverse Engineering Needed**: replaced by the targeted inventory `inception/requirements/signup-photo-inventory.md`
  (2026-10-05), pending the user's confirmation in Q1 of the questions file. The S1 archive holds the 2026-09-25
  analysis (stale for `apps/api`, `packages/api-contract`, `packages/form-engine`, `infra/`); `.brd/phase-0…8` the
  business view.

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: CLAUDE.md "Dynamic by default" (contract entries + handlers; form definitions)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes, blocking | Requirements Analysis, 2026-10-05 (Q9 A) |
| Resiliency Baseline | Yes, blocking; S1's targets carried forward (SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region) | Requirements Analysis, 2026-10-05 (Q10 A) |
| Property-Based Testing | Yes, full | Requirements Analysis, 2026-10-05 (Q11 A) |

## Stage Progress
### 🔵 INCEPTION PHASE
- [x] Workspace Detection (2026-10-05: brownfield, monorepo; branch `aidlc/signup-photo-gcs` from `main` `635273b`)
- [x] Reverse Engineering (targeted inventory `inception/requirements/signup-photo-inventory.md`, confirmed Q1 A)
- [x] Requirements Analysis (`inception/requirements/requirements.md`, approved 2026-10-05)
- [x] User Stories (`inception/user-stories/personas.md`, `stories.md`: 18 stories; approved 2026-10-05)
- [x] Workflow Planning (`inception/plans/execution-plan.md`, approved 2026-10-05; scope narrowed the same day to the sign-up only: unit U2 removed, Q3 = B)
- [x] Application Design (`inception/application-design/`, approved 2026-10-05)
- [ ] Units Generation -- SKIP (units fixed in the execution plan: U1 `alert-policy`, U3 `photo-gcs` in PRs 3a/3b/3c)

### 🟢 CONSTRUCTION PHASE
- [x] U1 `alert-policy`: PR #36 merged (`e20dee4`), policies applied to prod and staging 2026-10-05 03:45Z, live policy verified; one observation open (no latency email the next day). Summary: `construction/alert-policy/code/alert-policy-summary.md`
- [~] U3 `photo-gcs`: NFR Design artifacts written 2026-10-05 (`construction/photo-gcs/nfr-design/`), awaiting approval; then Infrastructure Design, Code Generation (one plan, three PRs; 3a without a migration), Build and Test per PR
- [ ] Build and Test (per PR: gates, CI, preview checklist, merge, staging, promotion)

## Execution Plan Summary
- **Stages to execute**: Application Design; for U3 Functional Design, NFR Requirements, NFR Design; Infrastructure Design for U1 and U3; Code Generation and Build and Test per unit
- **Stages to skip**: Units Generation (units fixed in the plan); the per-unit design stages for U1 (configuration)
- **Scope rule (user, 2026-10-05)**: only the sign-up path changes. The dashboard's upload routes and the shared `PhotoUpload` component's behaviour on dashboard screens are untouched; the wizard passes its own accept list
- **Sequence**: PR 1 (U1) first; U3 as 3a backend additive (bootstrap buckets first, merge, staging checklist, promote), 3b wizard switch (preview against staging, merge), 3c clean-up after the cut-over window
