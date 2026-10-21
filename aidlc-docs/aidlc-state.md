# AI-DLC State Tracking

## Project Information
- **Project**: Remonta marketplace monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Project Type**: Brownfield
- **Current Cycle**: onboarding-tour -- started 2026-10-21. Goal (user, verbatim in `audit.md`): a quick tour for a
  worker's first sign-in that highlights the sidebar groups in turn (My Profile, Next, Services, Next, Compliance, ...):
  "Basically just a tour how to complete the profile". Record branch `aidlc/onboarding-tour` (from `aidlc/api-review`
  `d9289f3`). The previous cycle, api-review, is **parked**: `aidlc-docs/archive/api-review/PARKED.md`
  (`feat/account-app` held, not released).
- **Current Stage**: CONSTRUCTION -- U1 `tour-seen-api` merged (#88, `main` `f00a3cb`) and on staging
  (`remonta-api-staging-00054-f7t`); staging checklist 13/13. **Not promoted to production** (later, on the user's
  word: imageTag `f00a3cb85ba22939f9d6cebcf4e36509d4cb28d9`). `main` merged into `feat/account-app` (`dda4f61`, gates
  green). **U2 generated and pushed** (`feat/onboarding-tour` `ffad332`, gates green, preview built). **Build and Test
  written** (`construction/build-and-test/`): automated tests all pass. Preview checks 1-7 done by the user;
  **`feat/onboarding-tour` merged into `feat/account-app` (`ffad332`)**. **U1 promoted to production 2026-10-21
  02:59Z** (`remonta-api-00012-gts` = `f00a3cb`; checks pass; rollback row on `docs/rollback-rows-2026-10-21-tour`).
  Open: `feat/account-app`'s preview checklist + tour checks 8-10, then its merge into `main` (the tour, the sidebar,
  PR #57 and U5 go live together), production checks, then Operations / close the cycle.

  **New area in this cycle (user, 2026-10-21): profile completion.** Audit written
  (`inception/review/profile-completion-audit.md`, F1-F9, I1-I6); answered; requirements written
  (`inception/requirements/completion-requirements.md`, approved 2026-10-21); execution plan
  (`inception/plans/completion-execution-plan.md`, approved); C1 Functional Design approved; C1 NFR Design approved; C1 merged (#89, `main` `1eda05a`) and on staging
  (`00055-j29`), checks 10/10; **not promoted** (safe any time: invisible under `legacy`; promote with the full sha
  `1eda05ac2c6682b9fe34d2f09dcb06ca78962a06`, then the alert's metric + `apply-alerts.sh prod`). Decided 2026-10-21: **Language
  optional** (10 required pages): merged (#91, `main` `0fbd3d4`), staging `00056-rgt` checks 10/10. **Promoted 2026-10-21**:
  `remonta-api-00013-rl7` = `0fbd3d4`; the first full pass corrected 8 stale workers. The alert applied (metric +
  policy, 2026-10-21). **C1 complete.** Open: the rollback-row PR `docs/rollback-rows-2026-10-21-completion`;
  then `feat/account-app`'s release, then C2 (Functional Design first). **Before the release (user, 2026-10-21):
  small UI changes on `feat/account-app`**, one at a time: 1) the tour's ? hidden on phones (`c9da208`);
  2) no Preview profile on the steps, no role under the first name. The dev branch has the tour migration now. 
  C2 waits for the `feat/account-app` release (CD8).

  **Done:** workspace detection (brownfield, unchanged); the targeted inventory
  `aidlc-docs/inception/inventory/onboarding-tour-inventory.md` (on `feat/account-app` `4d62630`).

  **The constraint found:** the tour points at the new worker menu (`WORKER_MENU`), which exists only on
  `feat/account-app`; `main` (production) still has the old sidebar. The tour's code branches from `feat/account-app`
  and ships with or after it.

  **Resume here (2026-10-21):**
  1. `git ls-remote origin main feat/account-app`; ask what was merged since.
  2. `feat/account-app`'s preview (`ffad332`): CLAUDE.md's checklist + tour checks 8-10. Then, on the user's word:
     merge `feat/account-app` into `main`, production checks, re-record the Vercel rollback rows, close the cycle. `../remonta-pr57` is on `feat/account-app` again. Open for the user: the browser check of today's production app against staging. OI-1 is settled: "seen" has its own read and
     save (the profile read's schema is strict; changing it would break today's production app).

## Stage Progress
### INCEPTION PHASE
- [x] Workspace Detection
- [x] Reverse Engineering (targeted inventory)
- [x] Requirements Analysis (approved 2026-10-21)
- [x] User Stories -- SKIP
- [x] Workflow Planning (approved 2026-10-21)
- [ ] Application Design -- SKIP
- [ ] Units Generation -- SKIP (U1 `tour-seen-api`, U2 `tour-app` fixed in the plan)

### CONSTRUCTION PHASE
- [x] Functional Design -- U1 and U2 approved 2026-10-21
- [ ] NFR Requirements -- SKIP (NFR-01..10 in the requirements)
- [x] NFR Design -- approved 2026-10-21 (U1 amended with BR-10)
- [ ] Infrastructure Design -- SKIP
- [ ] Code Generation -- EXECUTE (U1 done, merged #88, staging 13/13; U2 pushed `ffad332`, preview checks next)
- [ ] Build and Test -- written 2026-10-21; the person-run checks open

## Previous cycles (archived, read-only)

| Cycle | Archive | Outcome |
|---|---|---|
| Monorepo migration (U1-U8) | `aidlc-docs/archive/monorepo-migration/` | `apps/app`, `apps/web`, `packages/*` on pnpm + Turborepo; live |
| Slice 1 -- worker registration on `apps/api` | `aidlc-docs/archive/s1-worker-registration/` | Live in production since 2026-10-02 10:20Z |
| Sign-up draft + reCAPTCHA badge (2 units) | `aidlc-docs/archive/signup-draft-and-recaptcha-badge/` | PR #30 and PR #32 merged 2026-10-02; verified live |
| Legacy sign-up removal (cut-over clean-up) | `aidlc-docs/archive/legacy-signup-removal/` | PR #34 merged 2026-10-02 (`a30946e`); verified live; Upstash switch key deleted |
| Sign-up photo on Google Cloud Storage (U1 `alert-policy`, U3 `photo-gcs`) | `aidlc-docs/archive/signup-photo-gcs/` | PRs #36-#39 merged and verified live 2026-10-05; api revision `remonta-api-00005-j74` |
| Admin worker search on `apps/api` (U1 `api-identity`, U2 `admin-search`, + experience sub-areas) | `aidlc-docs/archive/admin-search-api/` | PRs #41-#47 merged 2026-10-08/09; api image `024596f` on prod (dispatch 2026-10-09 02:41Z); the app on `main` `48a8a7e`; verified live by the user |
| Worker profile on `apps/api` (U1 `worker-area`, U2 `edit-profile` in part) | `aidlc-docs/archive/worker-profile-api/` | **Parked 2026-10-14** with work open (`PARKED.md`); U1 live 2026-10-12, U2 PR 2 live; PR #57 held |
| API review: the worker dashboard on `apps/api` (U3-U5, the State filter) | `aidlc-docs/archive/api-review/` | **Parked 2026-10-21** (`PARKED.md`); api #61-#85 live (prod `b8fe2eb`, 2026-10-19); the State filter live (#86); `feat/account-app` held |

`aidlc-docs/audit.md` is the single append-only audit trail across cycles; never rewrite it.

## What is live (carry forward -- facts the next cycle builds on)

- **The worker sign-up has one backend: `apps/api`** (NestJS 11 on Fastify 5, Cloud Run `remonta-api`,
  `australia-southeast1`, project `remonta-api-510206`, URL `remonta-api-154148201608.australia-southeast1.run.app`).
  The app finds it through `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; with either missing the sign-up
  page shows "Sign-up is temporarily unavailable". Rollback of an app change = Vercel promote; of the api = its
  previous revision/image. The sign-up photo goes straight to a private Cloud Storage bucket by signed POST ticket,
  then the outbox handler writes the clean copy and thumbnail to Vercel Blob (`docs/signup/`).
- **The admin dashboard's lists read `apps/api`** (2026-10-08): `GET /v1/admin/workers` (one statement on
  `worker_profiles` + `users` + `worker_locations` HOME + `au_localities` + `worker_additional_info`, with
  `worker_services` and `worker_experience` per filter; PostGIS `ST_DWithin` for the radius; 120/min per admin),
  `/v1/admin/users`, `/v1/admin/workers/suspended`; a bearer JWT the app mints at `GET /api/auth/api-token`
  (`API_TOKEN_SECRET` per stage, Vercel scope <-> Secret Manager); private caching 60 s + ETag; the api's response
  memo. The old Next.js admin routes are gone; `/api/admin/contractors/[id]` and `.../status` remain. Reference:
  `docs/admin/README.md`.
- **Experience sub-areas** (2026-10-09): the five care domains and their 39 specific areas live once in
  `packages/schemas/src/data/experienceAreas.ts`; the edit-profile page offers them, `worker_experience.specificAreas`
  stores them as labels, and the search takes `experienceAreas` (`DOMAIN:Area` pairs, any-of within a domain, all-of
  across; a pair needs its domain in `experienceWith`). Checked on the staging copy: 38 distinct stored values, all in
  the list. `otherAreas` is not read.
- **Unplaced workers**: 69 active workers have no HOME row (the S1 backfill's no-guess leftovers: city names such as
  Sydney, Melbourne, Hervey Bay, Gold Coast with a suburb's postcode; misspelt suburbs; street addresses without a
  suburb; four empty, four overseas). The reconciler (every 5 min) places a worker the moment the legacy columns match
  one suburb. No admin control exists; a direct row with `source = 'ADMIN'` plus the legacy columns is the manual way
  (audit 2026-10-09). "Hervey Bay" is not a locality: 24 suburbs on 4655.
- **Staging** `remonta-api-staging` deploys from every merge to `main` touching the api path (`rehearse-w1` Neon copy,
  host `ep-wandering-shadow`); production moves only by `workflow_dispatch` promotion of an image already built.
  Vercel Preview points at staging. `scripts/local/run-api.sh` + `run-app.sh` run the new code on a developer machine
  against that copy (`REHEARSAL_DATABASE_URL` in `apps/api/.env`). **Still to remove by hand:** `REGISTRATION_BACKEND`
  in Vercel's Preview scope.
- **This machine (2026-10-09):** WSL answers "Class not registered", so Docker Desktop's Linux engine is down and the
  database-gated tests skip locally; CI's API Quality job is the proof. `gcloud` needs a re-login for secrets.
- **The production auth database** (`workerprofiles`, host `ep-delicate-recipe-a7mbt4ef`) carries the S1 migrations,
  PostGIS 3.5, `au_localities` (15,467), `worker_locations`, `worker_onboarding` + transitions, the outbox, rate-limit
  buckets and scheduled jobs. The api still dual-writes `worker_profiles.location/city/state/postalCode/latitude/
  longitude`: the client search and the public list read them (follow-up 1).
- **Secrets** `remonta-api[-staging]-<NAME>`, six per stage, in Secret Manager; add versions with
  `printf '%s' | gcloud secrets versions add --data-file=-` (no trailing newline: follow-up 15).
- **Quality gates (2026-10-09):** schemas 63 tests; api-contract 49; api 368 unit (+143 database-gated, CI); app
  142 type / 471 lint known / 119 tests; form-engine 58; infra 37. CodeQL and Semgrep on every PR.
- **Rollback deployments** re-recorded in CLAUDE.md on 2026-10-09 (the deployment pages of the `main` `48a8a7e` builds).
- **Driving minutes on the worker card** (PR #49 `e8889fa`, merged to `main` `c51d430` on 2026-10-09, outside a cycle):
  the admin search card reads "about N min drive from the suburb centre", estimated in the app from the straight-line km
  the api returns (`apps/app/src/features/admin-search/travel.ts`); the sort is unchanged. Its production verification
  is not recorded in the audit; CLAUDE.md's rollback rows still name the `48a8a7e` builds.

## Follow-ups left open (candidates for the next cycle or housekeeping)

1. **Search slice, remainder**: the client search and the public list still read `worker_profiles.latitude/longitude`;
   move them to `worker_locations` + PostGIS, then stop the api's dual write, then drop the columns. (The admin list is
   done.)
2. **CRM notification** (n8n -> Zoho) for sign-ups: an outbox handler.
3. **Form engine wording**: a reCAPTCHA token failure reads "We couldn't reach Remonta…".
4. **Rotate exposed credentials**: the production auth db role; the production Blob token; the Prisma Accelerate key;
   the `rehearse-w1` role password. Then Vercel and the local env files.
5. **Repository visibility**: the GitHub repository is public; confirm intended.
6. **Generated Prisma clients**: settle the local-vs-committed difference; decide whether `src/generated/` stays in git.
7. **Stale exports and docs**: `contractorFormSchema.ts`, the stale `UserRole` type, `apps/app/docs/*.md`.
8. Smaller: SERVICE_OPTIONS stale vs the catalogue; two duplicate `users.email` indexes; the other hand-built forms
   onto the form engine; admin users search `contains`; the 10 codes/h per IP decision; the production test accounts
   of 2026-10-02 and 2026-10-05; stale branches (`aidlc/*`, `feat/*` merged, `app/main`); tighten the app lint baseline.
9. **Observations**: the `latency-p95` policy (no email expected without 60+ requests in 5 min); a week of Cloud
   Logging on the photo entries (by 2026-10-12).
10. **Photo-era leftovers**: multipart-era unclaimed rows skipped by the purge; the test sign-up of 2026-10-05.
11. **Dashboard uploads** (`/api/upload/worker-photo`): the ticket/confirm pattern later; out of scope by decision.
12. **MFA for admin accounts** (SECURITY-12): the identity slice.
13. **Profile column normalisation**: `gender`, `hasVehicle`, `dateOfBirth`, the worker type out of the `abn` JSON, one
    language list.
14. **A document-filter screen for the admin search** (category, status, type on one `verification_requirements` row).
15. **Secret versions without a trailing newline**: say so in `infra/README.md`'s rotation runbook and the bootstrap.
16. **The checklist runner and the paced replay** as the standard post-deploy check for the admin entries.
17. **Unplaced workers (69)**: an admin set-suburb control (a contract entry + handler writing a HOME row with
    `source = 'ADMIN'` and the legacy columns + a picker on the worker's admin page); and city-name help in the suburb
    autocomplete (Hervey Bay, Gold Coast, Sunshine Coast, Toowoomba have no locality row: offer their suburbs).
    Recommended as the next cycle.
18. **Experience sub-areas, options**: (the profile page's limit of 3 went on 2026-10-13, PR #59) also match `otherAreas` (a toggle); show the matched areas on the result row;
    the profile page's 3-per-domain limit hides a fourth condition from the search.
19. **This machine**: repair WSL (`wsl --install` as admin, reboot) so the local PostGIS and the database-gated tests
    run again; re-login `gcloud`.
20. **The local client-side error** (2026-10-09, the local app against the staging copy): not reproduced on the preview
    or production; if it returns, the browser console's first line is the lead.

21. **Admin contractor page reads legacy columns** (found 2026-10-13): `/api/admin/contractors/[id]` and its page show
    `worker_profiles.languages` / `hobbies` / `uniqueService`; the worker pages (old and new) write
    `worker_additional_info`, so the admin view can be stale. Read the additional-info row (as the api's read does).
22. **The services setup page's Next saves nothing** (verified 2026-10-13): it sends `update-step` `step: 100 + n` with
    `{qualificationsByService, nursingRegistration}`; the route writes nothing for those steps (101 needs `services`,
    102 `selectedQualifications`, 103+ default) and answers "Step N saved successfully". Check on the preview whether
    the ticked qualifications survive a reload (they may be derived from the uploaded documents).
23. **`verification_requirements` has no unique (workerProfileId, requirementType)**: the find-then-create upserts of
    the compliance and service-document uploads can race into duplicates (subagent finding, to verify).
24. **Two service-document upload paths** (`uploadServiceDocument` and `POST /api/upload/service-documents`) with
    different `requirementType` keys, Blob paths and fields; some deletes (`identity-documents`, the service-document
    ones) leave the Blob file (subagent finding, to verify).
25. **Account**: the password change asks no current password and invalidates no session server-side; the email change
    does not lower-case and needs no re-verification (subagent finding, to verify; SECURITY baseline).
26. **No test covers the `apps/app` writes** of Services, Compliance and Account, and CI (app) has no database: see the
    open question in Current Stage.

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript
- **Build System**: pnpm workspaces + Turborepo
- **Project Structure**: Monorepo -- `apps/app` (Next.js application), `apps/web` (Next.js marketing site),
  `apps/api` (NestJS + Fastify on Cloud Run), `packages/{config,schemas,api-contract,form-engine,db}`, `infra/`
- **Workspace Root**: `C:\Users\floil\OneDrive\Documents\Projects\Remonta\remontamarketplace`
- **Reverse Engineering**: the admin-search archive's `inception/reverse-engineering/` (2026-10-08) is the latest
  whole-repo view; the targeted inventories (`admin-search-inventory.md`, the photo inventory) map their areas. A new
  cycle on another area starts with a targeted inventory of that area.

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: CLAUDE.md "Dynamic by default" (contract entries + handlers; form definitions)

## Extension Configuration (onboarding-tour)
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes, blocking | onboarding-tour, Requirements Analysis 2026-10-21 (Security A) |
| Resiliency Baseline | Yes; SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region; plus "the tour never gets in the way of the dashboard" | onboarding-tour, 2026-10-21 (Resiliency A, F2 A) |
| Property-Based Testing | Yes, full | onboarding-tour, 2026-10-21 (PBT A) |
