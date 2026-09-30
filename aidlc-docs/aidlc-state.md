# AI-DLC State Tracking

## Project Information
- **Project**: New backend system — NestJS service (`apps/api`) for the existing Remonta product
- **Project Type**: Brownfield — a new service alongside `apps/app`, sharing its database and auth, with domains moved over incrementally (strangler)
- **Start Date**: 2026-09-24T13:53:59+05:30
- **Current Stage**: CONSTRUCTION - Slice 1 Worker Registration. S1 code in main and live (2026-09-30) with the sign-up on the pre-S1 legacy page; `apps/api` not deployed. Preview-first plan awaiting answers; then infrastructure (with a staging stack), database on staging, CRM notification, verification on the preview, promotion. See "Resume here".

## Resume here (rewritten 2026-09-28, end of day)

**Standing instruction (user, 2026-09-28):** no other work until `apps/api` is deployed and in use. Everything below is on that path only.

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
3. **Infrastructure Design + Dockerfile** for `apps/api` -- **IN PROGRESS (started 2026-09-28).** Plan answered 2026-09-28 (Fargate+ALB, CDK, WAF now, auto-deploy on main, one account, alerts to support@). **Design APPROVED 2026-09-28.** Documents: `aidlc-docs/construction/S1-registration/infrastructure-design/{infrastructure-design,deployment-architecture}.md`. They require one code change (`probe: true` on the health entry, replacing `loadShedding: 'exempt'`: the ALB health checker speaks plain HTTP and would get 403) and one answer (the app's other origins for CORS). Code Generation PART 1 (planning) done 2026-09-28, plan awaiting approval: `aidlc-docs/construction/plans/S1-infrastructure-code-generation-plan.md`. Scope: `infra/` CDK package, `deploy-api.yml`, `ci-infra.yml`, the probe change, in one PR. `apps/api/Dockerfile` + root `.dockerignore` written and **verified locally** (623 MB image; health 200 behind a forwarding proxy, 403 on plain HTTP, graceful SIGTERM, Docker `healthy`). Recommendation changed from App Runner to **ECS Fargate + ALB, ap-southeast-2** (the requirements' decision C9 A): App Runner throttles CPU on idle instances, which would stall the outbox dispatcher and the scheduled jobs between requests. Secrets in Secrets Manager. Next: answers -> infrastructure-design.md + deployment-architecture.md -> approval -> CDK package + deploy workflow.
4. **Production configuration** for the api: `CORS_ORIGINS` (the app's origin), `RECAPTCHA_ALLOWED_HOSTNAMES=app.remontaservices.com.au`, `IP_HASH_SECRET`, `PHOTO_STORE=vercel-blob` + `BLOB_READ_WRITE_TOKEN`, `APP_BASE_URL`, `EMAIL_FROM` on a **verified Resend domain** (user), `N8N_REGISTRATION_WEBHOOK_URL`.
5. **The deferred CRM notification** for api-mode sign-ups (outbox handler; payload snapshot-tested against the legacy one). A hard gate: without it api-mode sign-ups never reach Zoho.
6. **Deploy**, verify with the switch off (health, suburb search, a photo upload), then set `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in Vercel and flip the switch (Upstash key `switch:registration` = `api`) for a canary; flipping back is the rollback.
7. Afterwards: re-record the Vercel last-known-good deployment ids in CLAUDE.md (they predate 2026-09-28); the open decision on 10 codes/h per IP (20/h behind shared office addresses?).

### Waiting on the user right now
- **Vercel, still open:** the PR #14 merge deployed to production within ~2 min, so main deploys work now; why PRs #11-#13 (2026-09-28) never went live is unexplained (failed builds? a promoted older deployment?) -- check the deployments list. Also confirm the production env has no `REGISTRATION_BACKEND=api` / `NEXT_PUBLIC_API_URL`. Re-record the last-known-good deployment ids in CLAUDE.md (the fix deployment is a good candidate).
- The go for the production run (2) with the production direct connection string placed as described.
- A verified Remonta sender domain in Resend (needed by 4; until then the test sender delivers only to the account owner).
- An AWS account/region decision for 3 (App Runner recommended).

### Local environment to continue
- **Docker Desktop** running: container `remonta-s1-pg` (postgis/postgis:16-3.4, port 55432), database `s1test` with all migrations, 15,467 localities, the catalogue seed (`packages/db/scripts/local/seed-catalogue.sql`), and today's test rows (incl. user `test-avail-user` = clentbacatan123@gmail.com). If `au_localities` is ever empty: `@remonta/db`'s test truncates it -- reload with `localities:refresh` (dry run → `--apply --expect=<hash>`).
- **`apps/api/.env`:** the user's secrets plus `REHEARSAL_DATABASE_URL` (the rehearse-w1 pooled string; the scripts derive the direct one). `AUTH_DATABASE_URL` there points at the LOCAL database.
- **Run locally:** see CLAUDE.md "apps/api" (api on 4000; the app dev server with the env overrides; legacy mode needs `N8N_REGISTRATION_WEBHOOK_URL=http://127.0.0.1:9/` so no test sign-up reaches the live CRM).
- **Nothing is running now** (api, dev server, Studio all stopped). Uncommitted: only regenerated Prisma clients (`apps/*/src/generated`) -- never commit them (machine paths; `postinstall` regenerates).

### Open follow-ups, NOT on the path (parked by the standing instruction)
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
