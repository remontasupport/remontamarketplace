# AI-DLC State Tracking

## Project Information
- **Project**: Remonta marketplace monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Project Type**: Brownfield
- **Current Cycle**: worker-profile-api -- started 2026-10-09. Goal (user, verbatim in `audit.md`): migrate every legacy
  api of the worker profile to `apps/api`, starting with Edit Profile; reorder the sidebar navigation; the api to serve
  many requests at once ("10,000+ users at the same time", "worker servers"); easy to maintain; review the current api
  structure first. Record branch `aidlc/worker-profile-api` (from `main` `c51d430`).
- **Current Stage**: CONSTRUCTION -- U1 `worker-area`, NFR Requirements generated (`construction/worker-area/
  nfr-requirements/`: U1-SCL/PRF/AVL/SEC/REL/MNT/USA with verifications; tech stack T1-T10), awaiting approval; next
  NFR Design (U1).

## Previous cycles (archived, read-only)

| Cycle | Archive | Outcome |
|---|---|---|
| Monorepo migration (U1-U8) | `aidlc-docs/archive/monorepo-migration/` | `apps/app`, `apps/web`, `packages/*` on pnpm + Turborepo; live |
| Slice 1 -- worker registration on `apps/api` | `aidlc-docs/archive/s1-worker-registration/` | Live in production since 2026-10-02 10:20Z |
| Sign-up draft + reCAPTCHA badge (2 units) | `aidlc-docs/archive/signup-draft-and-recaptcha-badge/` | PR #30 and PR #32 merged 2026-10-02; verified live |
| Legacy sign-up removal (cut-over clean-up) | `aidlc-docs/archive/legacy-signup-removal/` | PR #34 merged 2026-10-02 (`a30946e`); verified live; Upstash switch key deleted |
| Sign-up photo on Google Cloud Storage (U1 `alert-policy`, U3 `photo-gcs`) | `aidlc-docs/archive/signup-photo-gcs/` | PRs #36-#39 merged and verified live 2026-10-05; api revision `remonta-api-00005-j74` |
| Admin worker search on `apps/api` (U1 `api-identity`, U2 `admin-search`, + experience sub-areas) | `aidlc-docs/archive/admin-search-api/` | PRs #41-#47 merged 2026-10-08/09; api image `024596f` on prod (dispatch 2026-10-09 02:41Z); the app on `main` `48a8a7e`; verified live by the user |

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
18. **Experience sub-areas, options**: also match `otherAreas` (a toggle); show the matched areas on the result row;
    the profile page's 3-per-domain limit hides a fourth condition from the search.
19. **This machine**: repair WSL (`wsl --install` as admin, reboot) so the local PostGIS and the database-gated tests
    run again; re-login `gcloud`.
20. **The local client-side error** (2026-10-09, the local app against the staging copy): not reproduced on the preview
    or production; if it returns, the browser console's first line is the lead.

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
- [ ] U1 `worker-area`: Functional Design (plan approved 2026-10-09, Q1-Q6 A; approved 2026-10-09) · NFR Requirements (approved 2026-10-09) · NFR Design · Infrastructure Design · Code Generation (PR 1) · Build and Test
- [ ] U2 `edit-profile`: Functional Design (full) · Code Generation (PRs 2-4) · Build and Test
- [ ] U3 `services-documents`: Functional Design (full) · NFR Requirements · NFR Design · Code Generation (PRs 5-7) · Build and Test
- [ ] U4 `dashboard-jobs`: Functional Design (short) · Infrastructure Design · Code Generation (PRs 8-10) · Build and Test

## Execution Plan Summary
- **Stages to execute**: Application Design (concise); per unit as listed above; Code Generation and Build and Test always
- **Stages to skip**: Units Generation (units fixed in the plan); NFR Requirements/Design for U2 and U4 (inherit U1's and
  U3's); Infrastructure Design for U2 (a migration only) and U3 (the sign-up bucket reused)
