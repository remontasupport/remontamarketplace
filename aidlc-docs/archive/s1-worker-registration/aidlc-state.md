# AI-DLC State Tracking

## Project Information
- **Project**: New backend system — NestJS service (`apps/api`) for the existing Remonta product
- **Project Type**: Brownfield — a new service alongside `apps/app`, sharing its database and auth, with domains moved over incrementally (strangler)
- **Start Date**: 2026-09-24T13:53:59+05:30
- **Current Stage**: CONSTRUCTION - Slice 1 Worker Registration **LIVE IN PRODUCTION on apps/api since 2026-10-02 10:20Z** (Upstash `switch:registration` = `api`; rollback = `legacy`). The production database carries the S1 schema, suburb list and backfills; `remonta-api` on Cloud Run serves revision 00003 of image `7e79f8b…`. First real sign-up verified end to end at 10:26Z. See "PENDING RIGHT NOW".

## Resume here (rewritten 2026-09-30, end of session)

**Standing instruction (user, 2026-09-28):** no other work until `apps/api` is deployed and in use. Everything below is on that path only.

### PENDING RIGHT NOW (2026-10-02, evening -- read this first)

**S1 is LIVE on apps/api (canary since 10:20Z).** Steps 1-6 of the production path are done: database run 06:42-07:15Z, secrets, promotion (revisions 00001-00003; the third after a new v3 reCAPTCHA pair `remonta-api`, secret version 4, site key in Vercel Production), the flip at 10:20:40Z after three rolled-back attempts caused by reCAPTCHA keys (staging key on the production domain; the legacy app's v2 key; a contaminated console test). First production sign-up verified at 10:26Z: every row, audit, outbox DONE, welcome email, immediate sign-in. **Watch next:** the admin list and the daily jobs (photo purge, outbox retention, reconciler) over the first days; Cloud Monitoring alerts go to support@. **Follow-ups opened today:** the form engine words a reCAPTCHA token failure as "couldn't reach Remonta" (misleading); remove the `auth-prisma.ts` omit of the S1 columns; delete `features/forms/legacy/worker/` once the canary is accepted; reset the production auth db password (exposed in tool output) and the earlier rotation list; the CRM/n8n notification is still parked (sign-ups are read from the admin list).

**Position (re-checked 2026-10-02 from a new device):** every S1 branch is in `main` (PRs #20-#24; last merge 55f1cfd),
including `fix/cloudrun-fresh-revision-per-deploy` (step 1 of the 2026-10-01 list, done: deploy-api runs 4 and 5 green).
Staging api healthy (`/v1/health` 200, `/v1/localities?q=parram` rows with ids). Production sign-up still the legacy
page (fresh `MISS`, no `run.app` in the HTML). Vercel Preview scope set to the staging api on 2026-10-01 (step 2, done).
PR #22 put the last two form calls (suburb search, services list) on apps/api, so the preview form is 100 % apps/api.
`EMAIL_FROM` = `Remonta <community@remontaservices.com.au>` on staging since deploy-api run 5. **CRM/n8n notification
deprioritised by the user (2026-10-01)** -- no longer a gate before the preview checks; still needed before any
production flip, because api-mode sign-ups would otherwise never reach Zoho.

**In flight (2026-10-02): PR for `s1/api-structure`** -- the apps/api review the user asked for before the preview
checks: two bug fixes (the reconciler/backfill postcode regex that never matched; the email lookup that compared exact
case in the sign-up but ignored case in the availability check, letting a pre-api account with capitals be created
twice), the sign-up transaction split into reusable pieces (events, user lookup, existing-account notice, services
check, photo claim, onboarding marker), dead code removed (`N8N_WEBHOOK_URL`, `okStatuses`, the `pg` dev dependencies,
the handler-set casts). Merging it redeploys **staging** only. After it: resume the list below.

**Preview checklist: accepted by the user 2026-10-02** ("the preview is good now"; the sign-up workflow reviewed, two bug fixes on staging, the taken-email message and the photo thumbnail fixed in apps/app). **Production go given in principle 2026-10-02**; the legacy location columns stay until the search slice.

**Production path progress (2026-10-02):** step 2 Resend DNS done (DKIM/SPF/MX/DMARC verified in public DNS); step 3 the six `remonta-api-<NAME>` production secrets set by the user in Cloud Shell and verified by shape (pooled auth db host `ep-delicate-recipe-a7mbt4ef-pooler`, db `workerprofiles`). **Step 4 DONE 2026-10-02 07:15Z**: the production database has the 12 migrations, the suburb list (15,467), 1,751 HOME locations and 1,821 onboarding markers (70 workers unplaced, for review); the live suburb search reads `au_localities`. The `auth-prisma.ts` omit of the S1 columns can now go (own PR). **Step 5 DONE 2026-10-02 08:51Z**: `remonta-api` (prod) deployed by promotion of `7e79f8b…`, revision 00001, verified (health, suburbs, catalogue, CORS exact origin, photo staging); URL `https://remonta-api-154148201608.australia-southeast1.run.app`; switch still `legacy`. **Next: step 6** -- Vercel Production scope: `NEXT_PUBLIC_API_URL=<that URL>` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<the prod v3 site key>`, redeploy production, confirm the legacy page still serves (switch off), then the canary flip `switch:registration=api`.

**Next, in order:**
1. **The preview checklist, run by the user** on the latest preview (any PR preview from `main` now; the previews are
   behind Vercel protection, not reachable from here). Done: 2, 3, 8; 5 partial (code email arrived). Open: 1 (sign in
   with a staging-only user, open a dashboard), 4 (photo upload), 5 (full sign-up with an internal email: account
   created, audit row, outbox `DONE`, admin list), 6 (duplicate-email notice), 7 (rollback drill: Preview
   `REGISTRATION_BACKEND=legacy` renders the old page). Record each in `S1-registration/preview-verification.md`.
2. Production prep, only on the user's go: the production database run per `S1-production-run.md`; prod secrets
   (`remonta-api-<NAME>`: prod DB string, a prod reCAPTCHA key for `app.remontaservices.com.au`, IP hash, Resend,
   Blob); `workflow_dispatch` stage=prod with the sha that passed the checklist; checks with the switch off; Vercel
   Production gets `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; Resend SPF/DKIM/DMARC for
   `community@remontaservices.com.au`.
3. ~~The CRM notification before the flip~~ -- **user decision 2026-10-02: skipped.** Api-mode sign-ups are read from the admin list until the n8n/Zoho handler is built (parked, not on the path).
4. After cut-over: delete `features/forms/legacy/worker/`, remove the `lib/auth-prisma.ts` omit once the S1
   migrations are on production, re-record the Vercel rollback ids in CLAUDE.md.

**Code scanning (2026-10-02, branch `ci/code-scanning`, PR to open):** CodeQL (`security-extended`, JS/TS + Actions,
weekly) and Semgrep (registry packs + `.semgrep/remonta.yml`, five repo rules with a self-test) as report-only
workflows uploading to GitHub code scanning. After the first runs: triage the backlog under Security -> Code
scanning, then make both required checks. The repository is **public** (checked 2026-10-02); the user to confirm
that is intended.

**Housekeeping still open:** rotate the exposed keys (production Blob token, Prisma Accelerate key, `rehearse-w1`
role password, and -- 2026-10-02 -- the production auth database role `neondb_owner` on `ep-delicate-recipe-a7mbt4ef`, whose connection string appeared in tool output); the 10 codes/h per IP decision; `aidlc/q1-preview-scope` (docs, 2 commits) and
`fix/services-loading-spinner` (0 commits ahead -- can be deleted) are the only non-merged S1-era branches.

**This device (2026-10-02):** the three secret files are present; Node 24.21, pnpm 9.15.9, `node_modules` installed;
**no Docker**, so the api's and `@remonta/db`'s database tests are skipped locally (CI runs them with PostGIS). Clean
tree on `main` apart from regenerated Prisma clients (never commit them).

### Superseded 2026-10-02 (kept for the record): the 2026-10-01 pending list

**Staging api is LIVE (2026-10-01):** `https://remonta-api-staging-154148201608.australia-southeast1.run.app`
(Cloud Run, `australia-southeast1`, project `remonta-api-510206`, against the `rehearse-w1` Neon branch). Checked:
`/v1/health` 200 `{"status":"ok"}` with no Google identity (health runs `SELECT 1`); `/v1/localities?q=parram` returns
rows with ids; CORS preflight from a `*.vercel.app` origin allowed, from another origin refused. **Production is
untouched:** production Cloud Run (`remonta-api`) not deployed, prod secrets empty, Upstash `switch:registration` =
`legacy`, the live sign-up served the legacy page after the merges (checked 03:07Z).

**How it got there (2026-10-01):** billing linked by the user; `bootstrap.sh` completed (one fix: the OIDC provider
display name must be <= 32 chars); three GitHub repository variables set; six staging secrets set. First deploys failed
and were fixed: PR #20 (PORT is reserved by Cloud Run; the service is public via `invoker-iam-disabled`); then a mix-up
in the secrets (the n8n single space had landed in IP_HASH_SECRET; both re-set). A re-run could not pick up the fixed
secrets because an unchanged template makes no new revision, so the serving revision was created by hand in Cloud Shell
(`gcloud run services update remonta-api-staging --revision-suffix=...`); the permanent fix is branch
`fix/cloudrun-fresh-revision-per-deploy` (a per-run/attempt `remonta-deploy-id` annotation). Staging's
`N8N_REGISTRATION_WEBHOOK_URL` is a single space (= unset) until the CRM notification is built.

**Next, in order:**
1. Merge `fix/cloudrun-fresh-revision-per-deploy`; its deploy-api run must go green and print the staging URL (proves
   the normal path, and replaces the hand-made revision).
2. Vercel **Preview** scope only (never Production): `REGISTRATION_BACKEND=api`, `NEXT_PUBLIC_API_URL=<staging URL>`,
   `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<the staging v3 site key>`. Redeploy a preview.
3. The preview checklist (`plans/S1-preview-first-verification-plan.md` §3), recorded in
   `S1-registration/preview-verification.md`.
4. The CRM notification (outbox handler) against a test n8n webhook -- a hard gate before production.
5. Only after that: production database run -> prod secrets (`remonta-api-<NAME>`) -> promote (`workflow_dispatch`
   stage=prod) -> checks with the switch off -> canary flip of `switch:registration`.

**Rotate when convenient:** the production Blob token (shown in editor context on 2026-10-01), the Prisma Accelerate key
and the `rehearse-w1` role password (2026-09-30).

**Production fixes 2026-10-01 (PR #18, live):** the legacy sign-up and 23 other `worker_profiles` reads failed on
production because the auth client includes S1's three columns, which production lacks (no S1 migration there).
`lib/auth-prisma.ts` now omits them globally; remove that once the S1 migrations run on production.

### Superseded 2026-10-01 (kept for the record): the 2026-09-30 billing block

**Where the bootstrap stopped:** GCP project **`remonta-api-510206`** (number 154148201608, display name
"remonta-api") exists; `support@remontaservices.com.au` is Owner; the user cloned the branch in **Cloud Shell**
(`~/remontamarketplace`). `bash infra/cloudrun/bootstrap.sh remonta-api-510206` failed at step 1:
**no billing account is linked** (`UREQ_PROJECT_BILLING_NOT_FOUND`); `gcloud billing accounts list` is empty for
support@. The CEO is believed to own the company's billing account under his personal Google login.

**Blocked on (the user, with the CEO) -- one of:**
- A. The CEO links the project himself: Billing → his account → Account management → Add project → `remonta-api`
  (he may need Viewer on the project first: IAM → Grant access → his email → Viewer).
- B. The CEO grants `support@remontaservices.com.au` **Billing Account User** on his billing account; then in
  Cloud Shell: `gcloud billing accounts list` → `gcloud billing projects link remonta-api-510206
  --billing-account=<ID>`.
- Also asked of the CEO: add a second **Billing Account Administrator** (a company identity), so billing does not
  hinge on one personal login.

**Then, in order (each step's command is in `infra/README.md` / `infra-summary.md`):**
1. `cd ~/remontamarketplace && git pull && bash infra/cloudrun/bootstrap.sh remonta-api-510206` (idempotent; ~5 min).
2. Set the three printed values as GitHub repository **Variables**: `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`,
   `GCP_DEPLOY_SERVICE_ACCOUNT`.
3. Six staging secret values (`gcloud secrets versions add remonta-api-staging-<NAME> --data-file=-`):
   `AUTH_DATABASE_URL` = `rehearse-w1` **pooled** string; `IP_HASH_SECRET` = `openssl rand -hex 32`;
   `N8N_REGISTRATION_WEBHOOK_URL` = a sink; `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN` as production's;
   `RECAPTCHA_SECRET_KEY` = a NEW v3 key pair with domain `vercel.app` (site key → Vercel Preview scope).
4. Open + merge the PR for `s1/infrastructure` (compare link with the slash encoded). `deploy-api` then deploys
   **staging only** and prints its `run.app` URL.
5. Vercel Preview scope: `REGISTRATION_BACKEND=api`, `NEXT_PUBLIC_API_URL=<staging URL>`,
   `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<staging site key>`. Run the preview checklist
   (`plans/S1-preview-first-verification-plan.md` §3); record in `S1-registration/preview-verification.md`.
6. Only after that: production database run → prod secrets (`remonta-api-<NAME>`) → promote (`workflow_dispatch`
   stage=prod) → checks with the switch off → canary flip of `switch:registration`.

**Also still open (unchanged):** the merged-but-unreviewed follow-ups list below; the Vercel question about why PRs
#11-#13 never went live on 2026-09-28; rotating the Prisma Accelerate key and the rehearsal branch's Neon role
password (both appeared in the assistant's tool output on 2026-09-30); the worker who reported a broken reset link at
01:42Z needs to be told to request a new one; the two other open PRs (`aidlc/q1-preview-scope` docs,
`fix/services-loading-spinner`) are still unmerged.

### Where things are
- **S1 is LIVE since 2026-09-30 ~02:01Z** (deployment `dpl_HiesnRpG6W5SmQxiu51GotinSXJX`, built from PR #14; `/registration/worker` is the S1 server page serving `mode: legacy`). Before that, production served the pre-S1 build: PR #11 282ac0f, PR #12 6452bb3, PR #13 063da07 were in main but **not live** (checked 2026-09-30, user-reported concern that api-mode sign-up was in use): `app.remontaservices.com.au/registration/worker` and `remonta-app.vercel.app` both serve deployment `dpl_7GnTSdLGtX3Tz9WUPpxXw9w8VvwD`, whose sign-up page is the **pre-S1 client page** (`ClientPageRoot`, `page-259b08dd…js`), edge-cached for ~5.7 days (`Age: 496062`, i.e. since ~2026-09-24). The 2026-09-28 "all 200" read checks did not distinguish builds. Either the main deploys failed/were skipped or production was promoted back; **the user must check the Vercel dashboard** (no Vercel or GitHub credentials on this machine). Consequence: production sign-up is 100% legacy today and the S1 code path has never served a real request. `apps/api` is not deployed anywhere.
- **Reset-link fix merged (PR #14, e169c3d, 2026-09-30):** `lib/app-url.ts`; user set `NEXT_PUBLIC_APP_URL=https://app.remontaservices.com.au` in Vercel production. Verify on the live domain once the deploy is current.
- **`legacy` = the old page again (PR #15, 94b7a85, LIVE 2026-09-30 ~02:25Z as `dpl_3Gb5dLo9vWokzhuEpLTWNEXuNupM`; verified: legacy page served, reset link on the production domain):** the pre-S1 sign-up page and step components restored under `features/forms/legacy/worker/`; the server page renders them when the switch is `legacy` and the engine wizard only in `api` mode. Production sign-up is then the pre-S1 code, byte for byte apart from import paths. Delete the folder at cut-over.
- **Registration switch pinned to legacy (2026-09-30):** Upstash `switch:registration` was unset (null → falls through to env `REGISTRATION_BACKEND`, whose production value in Vercel could not be read from here). Set to `legacy` explicitly; verified `GET` returns `legacy`. This overrides any env var once the S1 build is live. Flip to `api` only at step 6.
- **The production database is unchanged:** no S1 migration has run on it. Vercel runs no migrations.
- **The database side is rehearsed end to end** on Neon branch `rehearse-w1` (a reset copy of production of 2026-09-28): migrations forward → all 12 `down.sql` → diff against the pre-S1 schema empty → forward again; suburb list (plan `074d18238f0f0465`, 15,467 rows); both backfill dry runs reviewed and approved by the user; applied (1,719 HOME rows of 1,789 profiles, 1,789 markers, ~7 min batched) and re-applied (0 written). Runbook: `aidlc-docs/construction/S1-registration/S1-production-run.md`. `rehearse-w1` can be deleted.
- **The branch `s1/worker-registration` is fully in main** (PR #13, merge 063da07): the matcher rules, the batched backfills, docs. Step 1 of the path is done; the local branch is 3 commits behind `origin/main` (the merge) and can be fast-forwarded or dropped.
- **The hotfix branch / worktree are moot:** its commits reached main inside S1. `git worktree remove ../Remonta-hotfix` when convenient (it holds a copy of `.env`).

### The path to "deployed and in use", in order

**Re-ordered 2026-09-30 by the preview-first plan** (`construction/plans/S1-preview-first-verification-plan.md`): the switch guard is in code (production ignores the env var; only the Upstash key flips); the first api deploy is a `staging` stack against a Neon copy, verified from a PR preview with the plan's checklist, and only then the production database run, the `prod` stack and the canary flip. Production scope confirmed free of api variables (user, 2026-09-30). One question open (Q1a: what Vercel's Preview scope points at).
1. **PR to main** for the branch's commits (user opens: compare link with the slash encoded; expect 4 commits, 9 files; wait for the checks this time; "Merge pull request").
2. **Production database run** on the user's approval, per the runbook: production **direct** string in `apps/api/.env` under a name other than `AUTH_DATABASE_URL` (the runner refuses the rehearsal endpoint); status → migrate → suburb list → dry runs → user reviews the real reports → apply → apply again (0) → verify `/api/suburbs` returns ids. ~10 min. Visible effect: the suburb search stops calling Google.
3. **Infrastructure code GENERATED 2026-09-30 -- Google Cloud Run** on branch `s1/infrastructure` (the user opens the PR). Step 1 `probe` + staging allow-lists; `infra/`: the stage table (`lib/stages.ts`), rendered + drift-checked Cloud Run service definitions (`cloudrun/service.{staging,prod}.yaml`), `cloudrun/bootstrap.sh` (one idempotent gcloud run), alert policies; `ci-infra.yml`; `deploy-api.yml` (staging on push to main, prod by `workflow_dispatch` promotion, Workload Identity Federation). Pivoted from the AWS/CDK version the same day at the user's request (plan §3b, D14-D21; the CDK commits stay in history). Every gate green incl. `turbo run build` and the production-mode container test. Summary: `construction/S1-registration/code/infra-summary.md`. **Not deployed anywhere.** Next: the PR; then the user's bootstrap (a GCP project with billing, `bootstrap.sh`, three GitHub variables, six staging secret values, a staging reCAPTCHA key pair) and staging deploys itself on merge.
4. **Production configuration** for the api: `CORS_ORIGINS` (the app's origin), `RECAPTCHA_ALLOWED_HOSTNAMES=app.remontaservices.com.au`, `IP_HASH_SECRET`, `PHOTO_STORE=vercel-blob` + `BLOB_READ_WRITE_TOKEN`, `APP_BASE_URL`, `EMAIL_FROM` on a **verified Resend domain** (user), `N8N_REGISTRATION_WEBHOOK_URL`.
5. **The deferred CRM notification** for api-mode sign-ups (outbox handler; payload snapshot-tested against the legacy one). A hard gate: without it api-mode sign-ups never reach Zoho.
6. **Deploy**, verify with the switch off (health, suburb search, a photo upload), then set `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in Vercel and flip the switch (Upstash key `switch:registration` = `api`) for a canary; flipping back is the rollback.
7. Afterwards: re-record the Vercel last-known-good deployment ids in CLAUDE.md (they predate 2026-09-28); the open decision on 10 codes/h per IP (20/h behind shared office addresses?).

### Waiting on the user right now
- **Open the PR for `s1/infrastructure`** (compare link with the slash encoded; 8 commits, 51 files). Then, for the first deploy: a Google Cloud project with billing; `./infra/cloudrun/bootstrap.sh <project>`; the three GitHub variables it prints; the six staging secret values; a staging reCAPTCHA key pair (domain `vercel.app`). No DNS. (`infra-summary.md` lists the steps.)
- **Vercel, still open:** the PR #14 merge deployed to production within ~2 min, so main deploys work now; why PRs #11-#13 (2026-09-28) never went live is unexplained (failed builds? a promoted older deployment?) -- check the deployments list. Also confirm the production env has no `REGISTRATION_BACKEND=api` / `NEXT_PUBLIC_API_URL`. Re-record the last-known-good deployment ids in CLAUDE.md (the fix deployment is a good candidate).
- The go for the production run (2) with the production direct connection string placed as described.
- A verified Remonta sender domain in Resend (needed by 4; until then the test sender delivers only to the account owner).

### Local environment to continue
- **Docker Desktop** running at the end of the session: container `remonta-s1-pg` (postgis/postgis:16-3.4, port 55432), database `s1test` with all migrations, 15,467 localities, the catalogue seed and test rows. Local api and app dev servers were STOPPED. Cloud Shell in the user's browser has the branch cloned at `~/remontamarketplace`.
- **`apps/api/.env`:** the user's secrets plus `REHEARSAL_DATABASE_URL` (the rehearse-w1 pooled string; the scripts derive the direct one). `AUTH_DATABASE_URL` there points at the LOCAL database.
- **Run locally:** see CLAUDE.md "apps/api" (api on 4000; the app dev server with the env overrides; legacy mode needs `N8N_REGISTRATION_WEBHOOK_URL=http://127.0.0.1:9/` so no test sign-up reaches the live CRM).
- **Nothing is running now** (api, dev server, Studio all stopped). Uncommitted: only regenerated Prisma clients (`apps/*/src/generated`) -- never commit them (machine paths; `postinstall` regenerates).

### Open follow-ups, NOT on the path (parked by the standing instruction)
- **Search slice (first item when it opens):** move the worker-search readers (client search, public list, admin list, `lib/worker-search.ts`) from `worker_profiles.latitude/longitude` to `worker_locations` + PostGIS; then the api stops the legacy dual write (`locations/domain/home.ts`), then a migration drops the columns. Asked by the user 2026-09-30; not on the standing path.
- SERVICE_OPTIONS in `apps/app/src/constants` is stale vs the catalogue (two services not in the database, none of the real sub-categories); the stale `UserRole` type in packages/schemas; two duplicate `users.email` indexes; the other hand-built forms onto the form engine; admin users search still `contains` + insensitive.

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript
- **Build System**: pnpm workspaces + Turborepo
- **Project Structure**: Monorepo — `apps/app` (Next.js application), `apps/web` (Next.js marketing site), `packages/{config,schemas,db}` (Prisma over Neon Postgres, Sydney)
- **Workspace Root**: C:\Users\toton\Desktop\Remonta
- **Reverse Engineering Needed**: Refresh only — the backend shares `apps/app`'s database and auth
  - Business view: `.brd/phase-0` … `phase-8` (2026-09-23) — scope agreed in Clarification 11
  - Technical view: prior-cycle artifacts in `aidlc-docs/archive/monorepo-migration/inception/reverse-engineering/`
  - Decided at Workflow Planning: targeted refresh of the in-scope domains (done 2026-09-25)

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Previous Cycle
- The previous AI-DLC cycle (monorepo migration, U1–U8) is archived at `aidlc-docs/archive/monorepo-migration/` (Requirements Q20 = A; restored from git `HEAD`, 46 of 46 files).

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes (blocking) | Requirements Analysis |
| Resiliency Baseline | Yes (blocking) | Requirements Analysis |
| Property-Based Testing | Yes (full enforcement) | Requirements Analysis |

## Stage Progress
### 🔵 INCEPTION PHASE
- [x] Workspace Detection
- [x] Reverse Engineering — targeted refresh, approved 2026-09-25; artifacts in aidlc-docs/inception/reverse-engineering/; OI-09 resolved
- [x] Requirements Analysis — approved 2026-09-25 (OI-05, OI-06 resolved)
- [x] User Stories — approved 2026-09-25 (55 stories, 8 epics)
- [x] Workflow Planning — approved 2026-09-25 (+ NFR-ARCH-01..03 added)
- [ ] Application Design — EXECUTE
- [ ] Units Generation — EXECUTE

### 🟢 CONSTRUCTION PHASE
- [ ] Per unit: Functional Design, NFR Requirements, NFR Design, Infrastructure Design — all EXECUTE; Code Generation — EXECUTE
- [ ] Build and Test
