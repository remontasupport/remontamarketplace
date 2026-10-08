# AI-DLC State Tracking

## Project Information
- **Project**: Remonta marketplace monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Project Type**: Brownfield
- **Current Cycle**: *Admin worker search on `apps/api`* (started 2026-10-08; branch `aidlc/admin-search-api` from
  `main` `949cf2b`). Goal (user, 2026-10-08): a new api backend for the admin dashboard's search endpoints, with the
  radius computed accurately on the new schema (`worker_locations` + `au_localities` + PostGIS).
- **Current Stage**: **CONSTRUCTION -- PR 2 (U2, admin api side) = #42, merged `b09a9c1` 2026-10-08 05:57Z and
  verified on staging (`remonta-api-staging-00017-h7x`; `construction/admin-search/code/pr2-verification.md`: every
  row done except parity against the old route, deferred to PR 3's preview). Found on the way: both stages'
  `API_TOKEN_SECRET` had been stored with a line ending; clean version 2 added 06:14Z, staging redeployed.
  Awaiting the joint promotion of PRs 1 and 2: Actions -> deploy-api -> stage=prod, imageTag=`b09a9c1dedd3558b4eda08d72f8bfa8e0334aa3a`;
  then prod health 200, admin entry 401, auth-failed alert silent. Then PR 3 (the app switch, Parts G-K of the U2
  plan; carries the two uncommitted script files `apps/api/scripts/staging-admin-check.ts` and the paced
  `parity-admin-search.ts`). PR 1 = #41, merged and verified on staging.**

## Previous cycles (archived, read-only)

| Cycle | Archive | Outcome |
|---|---|---|
| Monorepo migration (U1-U8) | `aidlc-docs/archive/monorepo-migration/` | `apps/app`, `apps/web`, `packages/*` on pnpm + Turborepo; live |
| Slice 1 -- worker registration on `apps/api` | `aidlc-docs/archive/s1-worker-registration/` | Live in production since 2026-10-02 10:20Z |
| Sign-up draft + reCAPTCHA badge (2 units) | `aidlc-docs/archive/signup-draft-and-recaptcha-badge/` | PR #30 and PR #32 merged 2026-10-02; verified live |
| Legacy sign-up removal (cut-over clean-up) | `aidlc-docs/archive/legacy-signup-removal/` | PR #34 merged 2026-10-02 (`a30946e`); verified live; Upstash switch key deleted |
| Sign-up photo on Google Cloud Storage (U1 `alert-policy`, U3 `photo-gcs` in PRs 3a/3b/3c) | `aidlc-docs/archive/signup-photo-gcs/` | PR #36 (`e20dee4`, the latency alert), #37 (`fbc6705`, api), #38 (`177a2c2`, wizard), #39 (`0dbed46`, clean-up) all merged and verified live 2026-10-05; production api revision `remonta-api-00005-j74`. Cycle closed 2026-10-05 with two observations open (follow-ups 10, 11) |

`aidlc-docs/audit.md` is the single append-only audit trail across cycles; never rewrite it.

## What is live (carry forward -- facts the next cycle builds on)

- **The worker sign-up has one backend: `apps/api`** (NestJS 11 on Fastify 5, Cloud Run `remonta-api`,
  `australia-southeast1`, project `remonta-api-510206`, URL `remonta-api-154148201608.australia-southeast1.run.app`).
  The pre-S1 page, its routes (`/api/auth/register-async`, `/api/auth/check-email`), the Upstash switch and the form
  engine's legacy mode were removed on 2026-10-02 (last version: commit `b7ccc80`). The app finds the api through
  `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (`apps/app/src/lib/registration-backend.ts`); with either
  missing the page shows "Sign-up is temporarily unavailable" and logs the variable name. Rollback of an app change =
  Vercel promote; of the api = its previous revision/image.
- **The sign-up photo goes straight from the browser to a private, upload-only Cloud Storage bucket** (2026-10-05, U3):
  the api issues a signed POST-policy ticket (`POST /v1/registrations/worker/photo-tickets`, 10 min, bound to key,
  type and 5 MB), the browser POSTs the file to `remonta-api-photos[-staging]` (Sydney) with a progress bar, then
  confirms (`…/photo-confirmations`: the api inspects size, type and the first 16 bytes before the
  `registration_photo_uploads` row exists). After the sign-up claims the row, the `PhotoUploaded` outbox handler makes
  the clean copy (orientation applied, inside 1600 px, JPEG q85, metadata stripped) and a 256 px thumbnail and writes
  them to **Vercel Blob** under `workers/<profileId>/` (public, `Cache-Control` 30 min, user decision), sets
  `worker_profiles.photos` to the Blob URL and deletes the staging object. HEIC is refused on the device (the wizard's
  accept list; dashboard screens keep theirs). No new database column. Blob remains the home of every photo (option 2,
  2026-10-05: the organisation policy `iam.allowedPolicyMemberDomains` forbids public buckets). The multipart entry
  `POST /v1/registrations/worker/photo` is gone (PR 3c); rows it wrote carry `workers/registration/` keys and are never
  purged. Reference: `docs/signup/` (01 flow, 02 api, 03 data model, 05 events); code map in the archive's
  `inception/requirements/signup-photo-inventory.md`. Measured on production: ticket ~0.35-0.45 s (IAM signBlob),
  confirm ~0.2-0.3 s; the old multipart route was 4 s p95.
- **The latency alert `remonta-api latency-p95`** (U1, PR #36) measures a true p95 over 5-minute windows
  (`ALIGN_DELTA` + `REDUCE_PERCENTILE_95`), fires only with 60+ requests in the window for 10 minutes, treats missing
  data as inactive; applied by `infra/cloudrun/apply-alerts.sh` from `infra/cloudrun/monitoring/<name>.json`.
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
- **Secrets** `remonta-api[-staging]-<NAME>`, six per stage, in Secret Manager (`BLOB_READ_WRITE_TOKEN` stays: the clean
  copies go to Blob); the reCAPTCHA pair is the classic v3 key `remonta-api` (domain `app.remontaservices.com.au`),
  secret version 4; the staging pair stays on `vercel.app` for previews. `RECAPTCHA_SECRET_KEY` in `apps/app` still
  serves the client/coordinator register routes. The api's runtime service account signs upload policies through
  IAM `signBlob` (no key file).
- **Local dev shows "Sign-up is temporarily unavailable"** unless `NEXT_PUBLIC_API_URL` is set (`apps/app/.env` has no
  api URL). Test sign-up changes on a Vercel preview, or run the api on port 4000 with the CLAUDE.md env overrides
  (the api now also needs `PHOTO_BUCKET`, `PHOTO_PUBLIC_BASE_URL` and, locally, `GCS_API_ENDPOINT` for the fake bucket).
- **Local Prisma clients differ from the committed ones** (content, not only line endings) after a local
  `prisma generate`; never staged so far; cause unexamined (follow-up 7).
- **Quality gates (2026-10-05):** app 144 type / 488 lint known / 86 tests; form-engine 58; api-contract 35; api 404
  (128 need `TEST_DATABASE_URL` and the fake bucket; CI runs both); infra 37; schemas 60. CodeQL and Semgrep run on
  every PR; "Code scanning results / CodeQL" fails a PR on a new high-severity alert (it did once, fixed in
  `packages/api-contract/src/client.ts`).
- **Reference**: `docs/signup/README.md` documents the live sign-up; `03-data-model.md` §5 keeps the pre-S1 writes and
  the multipart photo staging as history.

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
   2026-10-02 10:26Z; stale branches (`aidlc/*`, `fix/*`, `feat/*` merged ones, and the old `app/main`); tighten
   the app lint baseline file to 488 deliberately.
10. **Observation, alert unit (U1)**: no `remonta-api latency-p95` email on 2026-10-06 (the first full day on the
    corrected policy and the direct upload). If one arrives, read the policy's incident: the condition now needs 60+
    requests in a 5-minute window.
11. **Observation, latency goal (U3)**: after a week (by 2026-10-12), Cloud Logging on `remonta-api`: no request to
    `/v1/registrations/worker/photo-tickets` or `…/photo-confirmations` above 500 ms, the multipart route absent (404),
    the policy silent. Note the ticket's ~0.4 s (IAM signBlob) against the design's 300 ms hope: acceptable, or cache
    nothing and accept, or sign with a key (rejected for key hygiene).
12. **Photo-era leftovers**: the two staged test rows the 3a checks left in production (purged after 24 h by the job);
    the multipart-era unclaimed rows, if any, now skipped by the purge (`skippedUnknownStore` in the daily summary);
    the production test sign-up of 2026-10-05 08:57Z (profile `cmuv0oju40001s6014vmje0bp`) if it is not a real worker.
14. **MFA for admin accounts** does not exist in `apps/app` (SECURITY-12; recorded 2026-10-08 at the admin-search
    cycle's requirements; belongs to the identity slice).
15. **Profile column normalisation** (recorded 2026-10-08, Q2 A): `worker_profiles.gender` and `hasVehicle` as typed
    values, `dateOfBirth` as a date (today text with the integer `age` fallback), the worker type out of the `abn`
    JSON, one language list instead of `worker_profiles.languages` + `worker_additional_info.languages`. Each is
    written by `apps/app` onboarding and read by the searches: an onboarding cycle with backfills.
16. **A document-filter screen for the admin search** (recorded 2026-10-08, Q3 A): the old route's URL-only
    `documentCategories`/`documentStatuses`/`requirementTypes` and the never-displayed options endpoint are dropped;
    if wanted, design the controls and an entry together, with same-document semantics (category, status and type
    on one `verification_requirements` row).
13. **Dashboard uploads** (`/api/upload/worker-photo` and the shared `PhotoUpload` defaults, HEIC accepted there):
    out of scope by the user's 2026-10-05 decision; the same ticket/confirm pattern can be applied later.

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript
- **Build System**: pnpm workspaces + Turborepo
- **Project Structure**: Monorepo -- `apps/app` (Next.js application), `apps/web` (Next.js marketing site),
  `apps/api` (NestJS + Fastify on Cloud Run), `packages/{config,schemas,api-contract,form-engine,db}`, `infra/`
- **Workspace Root**: `C:\Users\floil\OneDrive\Documents\Projects\Remonta\remontamarketplace`
- **Reverse Engineering**: the S1 archive holds the 2026-09-25 analysis (stale for `apps/api`, `packages/api-contract`,
  `packages/form-engine`, `infra/`); the photo cycle's targeted inventory
  (`archive/signup-photo-gcs/inception/requirements/signup-photo-inventory.md`) maps every photo path as of 2026-10-05;
  `.brd/phase-0…8` the business view. A new cycle on another area should start with a targeted inventory of that area.

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: CLAUDE.md "Dynamic by default" (contract entries + handlers; form definitions)

## Extension Configuration (decided 2026-10-08 for this cycle)
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes, blocking | Requirements Analysis, 2026-10-08 (Q10 A) |
| Resiliency Baseline | Yes, blocking; S1's targets carried forward (SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region) | Requirements Analysis, 2026-10-08 (Q11 A) |
| Property-Based Testing | Yes, full | Requirements Analysis, 2026-10-08 (Q12 A) |

## Stage Progress
### INCEPTION
- [x] Workspace Detection (2026-10-08): brownfield, unchanged; branch `aidlc/admin-search-api`
- [x] Reverse Engineering (2026-10-08, Q1 = B): `inception/reverse-engineering/` (9 artifacts) + the targeted inventory
- [x] Requirements Analysis (2026-10-08): 12 answers + CQ1 (free text withdrawn); approved 2026-10-08
- [x] Workflow Planning (2026-10-08): `inception/plans/execution-plan.md`; approved 2026-10-08
- [x] User Stories (2026-10-08): 17 stories + personas; approved 2026-10-08 (with the requirements amendment)
- [x] Application Design (2026-10-08): approved 2026-10-08, incl. the instant-repeats amendment (caches, Q1 C)
- [ ] Units Generation -- SKIP (U1 `api-identity`, U2 `admin-search` fixed in the plan)
### CONSTRUCTION (per unit)
- [ ] U1 `api-identity`: design complete; Code Generation plan approved 2026-10-08; PR 1 = #41 merged `c95435c` and verified on staging 2026-10-08 (promotion with PR 2); Part E with PR 3, NFR Design, Infrastructure Design, Code Generation (PR 1 + app part of PR 3), Build and Test
- [ ] U2 `admin-search`: plan approved 2026-10-08; PR 2 = #42 merged `b09a9c1` and verified on staging 2026-10-08 (promotion pending); PR 3, PR 4 to follow, NFR Design, Code Generation (PR 2 + app part of PR 3 + PR 4), Build and Test

The closed cycle's full stage record is in `aidlc-docs/archive/signup-photo-gcs/` (inception:
requirements, 18 stories, execution plan, application design; construction: U1 infrastructure design and code, U3
functional design, NFR requirements and design, infrastructure design, code generation plan with every step ticked,
the three PR summaries and the 3b preview checklist).
