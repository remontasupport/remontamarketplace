# AI-DLC State Tracking

## Project Information
- **Project**: Remonta marketplace monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Project Type**: Brownfield
- **Current Cycle**: api-review -- started 2026-10-14 (user: "reset the ai dlc now, I want to check all the APIs in
  order and the structure of the api on how I built it, but before that, I want the test on the development or local
  first"). Record branch `aidlc/api-review` (from `aidlc/worker-profile-api` `b217341`). The previous cycle,
  worker-profile-api, is **parked** with open work: `aidlc-docs/archive/worker-profile-api/PARKED.md` (PR #57 held,
  the prod promotion of `182f94f...`, the column tests).
- **Current Stage** (saved 2026-10-15 end of day, for the resume). The review covers three worker sections: **My
  Profile** (2026-10-14, `inception/review/my-profile-api-review.md`, F1-F11), **Services** (2026-10-15,
  `inception/review/services-inventory.md`, S1-S9, D1-D4) and **Compliance** (2026-10-15,
  `inception/review/compliance-inventory.md`, C1-C9, DC1-DC4), plus a **performance audit**
  (`inception/review/api-performance-audit.md`, P1-P10). Designs: `u3b-service-documents-design.md`,
  `u4a-compliance-documents-design.md`.

  **On `main` `813107d` (merged; the api on STAGING only, the app parts LIVE):**
  - #66 (merged 2026-10-15): U3a services api (`PUT /v1/worker/services`, `.../:categoryId/registration`; a removed
    service is deleted entirely, D2) + the performance fixes P1-P8 (`perf/api-round-trips`) + U3b service documents
    (ticket -> private bucket `documents/<profileId>/` -> confirm; links; admin link).
  - #67 S1: the per-worker requirement lists `private, no-store` (app, live).
  - #69 C1: the citizenship PATCH accepts the Right to Work answer only (app, live; no use of the hole on the copy).
  - #70 U4a compliance documents api (confirm/delete/citizenship/any-own-document link, `complianceDocuments` in the
    profile), with the null-category fix (`e1a1408`) and the flaky completion test made deterministic (`9ec8bc0`).
  - **Production api: still the old image** (not promoted today). Its rollback revision is `remonta-api-00009-gct`.

  **PR #57** (`feat/edit-profile-app` `6b4a9bd`): held until the api is promoted (the contract client refuses the old
  api's shapes). #68 (U3c, the Services pages) was merged INTO it at `f0ad86a`.

  **`feat/services-app` `e49438a`** (worktree `../remonta-pr57`, where the local servers run): PR #57 + U3c + the
  redirect fix + C1 + U4a + the test fix. Its commits after `f0ad86a` are not yet in PR #57 (they reach it through
  `main`, or a new PR from this branch into `feat/edit-profile-app`).

  **Still open, not merged:** the nine My Profile api branches of 2026-10-14 (none in main: `252f089`, `223736f`
  (#64 open), `405790f`, `bc83ebd`, `07c7740`, `4620077`, `cea8497`, `833f6fa`, `997168a`; all inside PR #57);
  `chore/staging-services-check` `8933b42` (the staging checklist script; PR optional).

  **Go-live order (unchanged):** the My Profile api changes onto main (one combined PR recommended) -> staging ->
  the preview checks -> Actions -> deploy-api -> stage `prod`, imageTag = the FULL 40-character sha -> production
  probes -> merge PR #57 (with U3c) -> production checks.

  **2026-10-16:** DC5 an expiry date already passed is refused (the api's message; nothing saved). The nine My Profile
  api branches stay separate (no combined PR; user). **U4b built**: `feat/compliance-app` `a26ff55` stacked on
  `feat/services-app` (design + Built: `inception/review/u4b-compliance-steps-design.md`); the trainings moved with
  the shared hooks.

  **Resume here:**
  1. `git ls-remote origin main feat/edit-profile-app feat/services-app feat/compliance-app`; ask what was merged since.
  2. U4b: PR `feat/compliance-app` -> base `feat/services-app` (no App Quality CI on a non-main base: the local gate is
     the proof; Vercel builds the preview). On the preview (staging api + bucket), with a staging-only worker: one
     upload per kind (police check, an identity document, right to work with a future expiry and with a past one ->
     "This document has expired", a training, the Code of Conduct signature), view it (the document route), delete.
  3. Staging checks still owed from 2026-10-15: `cd apps/api && node --import tsx scripts/staging-services-check.ts`
     (after `gcloud auth login`; on `chore/staging-services-check`) and one service-document upload on the preview.
  4. Next units: U4c (trainings: a check of each step now that the hooks moved; the dead fallback steps), U4d ABN +
     contract (the tax id out of the URL, C3), U4e Additional Credentials, U4f retire (the ignored `apiEndpoint`
     strings, `/api/worker/requirements` onto the api) + the legacy public files to the private bucket (DC3: identity
     first).
  5. Answers owed: the 2026-10-14 list (home addresses, admins seeing them, job/course order, the draft).
  6. Local: `bash scripts/local/run-api.sh` and `run-app.sh` from `../remonta-pr57` (stop the api before a gate:
     EPERM; rebuild after an api change; uploads fail locally -- no Google credentials). The browser smoke mints a
     local NextAuth session (`next-auth/jwt` encode, the local NEXTAUTH_SECRET) for a dev-copy worker; playwright-core
     lives in an old scratchpad (`2bee6707-.../scratchpad/pw`).
  7. Follow-ups: F2 the remaining legacy `"use server"` writes (profile, contract until U4d); F3-F5 bank account; F11;
     the xhr uploader's 120 s timeout for large documents; "Other Documents" still on the legacy action (U4e);
     `test/my-profile-columns` never opened.

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

## Extension Configuration (decided per cycle)
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes, blocking | worker-profile-api cycle, Requirements Analysis 2026-10-09 (Q15 a) |
| Resiliency Baseline | Yes, blocking; SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region; capacity gate 10,000 active workers/hour | worker-profile-api cycle, 2026-10-09 (Q16 a, Q6 A) |
| Property-Based Testing | Yes, full | worker-profile-api cycle, 2026-10-09 (Q17 a) |

## Stage Progress

### INCEPTION
- [x] Workspace Detection (2026-10-09): `aidlc-state.md` said no cycle open; `main` = `c51d430` (PR #49), clean tree;
  brownfield, unchanged layout; no reverse-engineering artifacts under `aidlc-docs/inception/` (the admin-search
  archive's 2026-10-08 pass is the latest; the decision full pass vs targeted inventory is deferred until the goal is known)
- [x] Goal named (`inception/cycle-start-questions.md`, 2026-10-09: Other, verbatim in the audit) -> branch `aidlc/worker-profile-api`
- [x] Targeted inventory (2026-10-09): `inception/requirements/worker-profile-inventory.md` (the dashboard's 13 pages
  and their data paths; the sidebar's current order; the api structure and concurrency model; the capacity arithmetic)
  and `worker-profile-routes.md` (33 route files, one row each). Key fact: the dashboard's writes are 53 server actions
  (6,962 lines) on Prisma, not routes; no worker entry exists in the api
- [x] Requirements Analysis (2026-10-09): 17 verification + 6 clarification questions answered (all recorded in the
  audit); `inception/requirements/requirements.md` written (D1-D16, FR-WRK/PI/EP/SVC/DOC/UPL/HOME/JOB/NAV/PLT, NFR-01..14,
  the extension compliance tables, 7 open items) -- **approved 2026-10-09**
- [ ] User Stories: assessment (execute); plan approved 2026-10-09 (Q1-Q3 A); `user-stories/personas.md` (P1/P2/S1/S4/S5
  by reference + W1/W2/W3) and `user-stories/stories.md` (33 stories, E1-E8, FR map, verification map) -- **approved 2026-10-09**
  with one change: ABN only, no TFN (requirements amendment D17 / FR-PI-07; US-WP-05 rewritten)
- [x] Workflow Planning (2026-10-09): `plans/execution-plan.md` -- risk High; four units fixed (U1 worker-area +
  capacity gate, U2 edit-profile, U3 services-documents, U4 dashboard-jobs); 10 PRs, api promoted before each app PR,
  a clean-up PR per unit after production verification -- approved 2026-10-09
- [ ] Application Design -- EXECUTE (concise): `plans/application-design-plan.md` written (Q1 entry per section; Q2 a
  `storageKey` column + an admin link entry; Q3 a `section` mode and new kinds in the engine; Q4 completion as a domain
  function with today's function as the oracle; Q5 uploads lifted to `platform/storage` with a kind table; Q6 one profile
  query and a typed client; Q7 the sidebar as a typed array) -- plan approved 2026-10-09 ("No2, let us proceed with
  the plan", read as: no change to documents' store; all seven as proposed); artifacts written -- **approved 2026-10-09**
- [ ] Units Generation -- SKIP (the four units are fixed in the execution plan)

### CONSTRUCTION (per unit; stages per the execution plan)
- [x] U1 `worker-area`: Functional Design · NFR Requirements · NFR Design · Infrastructure Design (all approved 2026-10-09) · Code Generation (2026-10-12, PRs #50-#52) · Build and Test (2026-10-12: staging checklist, promotion `b9ff6f4`, production checks and backfill) -- **live**; clean-up PR pending
- [ ] U2 `edit-profile`: Functional Design (plan approved 2026-10-12, Q1-Q10 A; **approved 2026-10-12**) · Code Generation (plan approved 2026-10-12, option A; **PR 2 generated** on `feat/edit-profile-api` `8a66496`, `code/PR2-summary.md`; PRs 3-4 next) · Build and Test (**PR 2 live** 2026-10-12: #56 merged `67fef1d`, migrated and promoted, prod revision `00009-gct`; staging 18+12 checks, load test with writes recorded; **PR 3 generated** on `feat/edit-profile-app` `2965ec3`, `code/PR3-summary.md`; PR #57 green at `3735cd8` after the user's menu changes; **held open by the user** 2026-10-12; next: the preview checklist, merge when the user says, the load-test re-run, promotion)
- [ ] U3 `services-documents`: Functional Design (full) · NFR Requirements · NFR Design · Code Generation (PRs 5-7) · Build and Test
- [ ] U4 `dashboard-jobs`: Functional Design (short) · Infrastructure Design · Code Generation (PRs 8-10) · Build and Test

## Execution Plan Summary
- **Stages to execute**: Application Design (concise); per unit as listed above; Code Generation and Build and Test always
- **Stages to skip**: Units Generation (units fixed in the plan); NFR Requirements/Design for U2 and U4 (inherit U1's and
  U3's); Infrastructure Design for U2 (a migration only) and U3 (the sign-up bucket reused)
