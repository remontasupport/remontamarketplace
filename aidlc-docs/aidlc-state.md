# AI-DLC State Tracking

## Project Information
- **Project**: New backend system — NestJS service (`apps/api`) for the existing Remonta product
- **Project Type**: Brownfield — a new service alongside `apps/app`, sharing its database and auth, with domains moved over incrementally (strangler)
- **Start Date**: 2026-09-24T13:53:59+05:30
- **Current Stage**: CONSTRUCTION - Slice 1 Worker Registration. Code generation steps 1-13 done and **merged to main 2026-09-28** (PRs #11, #12); the database side rehearsed on a Neon branch; the production database run, api hosting, config, CRM notification and deploy remain. See "Resume here".

## Resume here (rewritten 2026-09-28, end of day)

**Standing instruction (user, 2026-09-28):** no other work until `apps/api` is deployed and in use. Everything below is on that path only.

### Where things are
- **S1 is in production's code:** PR #11 (merge 282ac0f) and PR #12 (6452bb3) merged 2026-09-28. Both live apps run S1's code with the sign-up **on the legacy path** (the switch defaults to `legacy`); `apps/api` is not deployed anywhere. Production read checks after the deploy: login, sign-up page, suburb search (Google fallback: production has no S1 tables yet), categories -- all 200.
- **The production database is unchanged:** no S1 migration has run on it. Vercel runs no migrations.
- **The database side is rehearsed end to end** on Neon branch `rehearse-w1` (a reset copy of production of 2026-09-28): migrations forward → all 12 `down.sql` → diff against the pre-S1 schema empty → forward again; suburb list (plan `074d18238f0f0465`, 15,467 rows); both backfill dry runs reviewed and approved by the user; applied (1,719 HOME rows of 1,789 profiles, 1,789 markers, ~7 min batched) and re-applied (0 written). Runbook: `aidlc-docs/construction/S1-registration/S1-production-run.md`. `rehearse-w1` can be deleted.
- **The branch `s1/worker-registration` is 4 commits ahead of main** (the matcher rules from the rehearsal, the batched backfills, docs): 3ace3be, 81f5bf6, 6bff052 (+ the state commit). Production must run with them.
- **The hotfix branch / worktree are moot:** its commits reached main inside S1. `git worktree remove ../Remonta-hotfix` when convenient (it holds a copy of `.env`).

### The path to "deployed and in use", in order
1. **PR to main** for the branch's commits (user opens: compare link with the slash encoded; expect 4 commits, 9 files; wait for the checks this time; "Merge pull request").
2. **Production database run** on the user's approval, per the runbook: production **direct** string in `apps/api/.env` under a name other than `AUTH_DATABASE_URL` (the runner refuses the rehearsal endpoint); status → migrate → suburb list → dry runs → user reviews the real reports → apply → apply again (0) → verify `/api/suburbs` returns ids. ~10 min. Visible effect: the suburb search stops calling Google.
3. **Infrastructure Design + Dockerfile** for `apps/api`: AWS Sydney; App Runner recommended (long-running process: pool, hash workers, outbox dispatcher, job leases); secrets in Secrets Manager. Needs nothing from the user to write; an AWS account to provision.
4. **Production configuration** for the api: `CORS_ORIGINS` (the app's origin), `RECAPTCHA_ALLOWED_HOSTNAMES=app.remontaservices.com.au`, `IP_HASH_SECRET`, `PHOTO_STORE=vercel-blob` + `BLOB_READ_WRITE_TOKEN`, `APP_BASE_URL`, `EMAIL_FROM` on a **verified Resend domain** (user), `N8N_REGISTRATION_WEBHOOK_URL`.
5. **The deferred CRM notification** for api-mode sign-ups (outbox handler; payload snapshot-tested against the legacy one). A hard gate: without it api-mode sign-ups never reach Zoho.
6. **Deploy**, verify with the switch off (health, suburb search, a photo upload), then set `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in Vercel and flip the switch (Upstash key `switch:registration` = `api`) for a canary; flipping back is the rollback.
7. Afterwards: re-record the Vercel last-known-good deployment ids in CLAUDE.md (they predate 2026-09-28); the open decision on 10 codes/h per IP (20/h behind shared office addresses?).

### Waiting on the user right now
- Open the PR (1) and, after it merges, the go for the production run (2) with the production direct connection string placed as described.
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
