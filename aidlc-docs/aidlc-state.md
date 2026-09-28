# AI-DLC State Tracking

## Project Information
- **Project**: New backend system — NestJS service (`apps/api`) for the existing Remonta product
- **Project Type**: Brownfield — a new service alongside `apps/app`, sharing its database and auth, with domains moved over incrementally (strangler)
- **Start Date**: 2026-09-24T13:53:59+05:30
- **Current Stage**: CONSTRUCTION - Slice 1 Worker Registration, CODE GENERATION on branch `s1/worker-registration`. Steps 1-10 done (plus 5b, 9b, and step 13 = email verification before the password, a scope change of 2026-09-28). Next is step 11. See "Resume here" below.

## Resume here (updated 2026-09-28)

### 1. First: the sign-in hotfix (ready, NOT pushed -- user decision)
- **Branch** `fix/signin-email-lookup`, based on `origin/main` 25eb04e: 2 commits, 5 files.
- **Where:** a separate git worktree at `C:/Users/toton/Desktop/New folder/Remonta-hotfix`, with its own node_modules and a copy of `apps/app/.env`.
  - `ca7bb69`: exact `lower(email)` lookup. Fixes the ILIKE wildcard bug, where `a_b@` matched `axb@` and `%@domain` matched another account.
  - `0aaa571`: sign-in no longer caches the account (password hash, status) in Redis for 1 h. Before, the old password worked after a reset and suspended accounts could sign in.
- **Verified:** `@remonta/app` quality 149/518, 62 tests; 7 DB tests (3 of 4 fail against the old code); `next build` 99 pages.
- **Already merged into S1** (`63f0056`), so the two branches cannot conflict back.
- **To ship it** (CLAUDE.md process):
  1. `git -C ../Remonta-hotfix push origin fix/signin-email-lookup`
  2. PR: https://github.com/remontasupport/remontamarketplace/compare/main...fix%2Fsignin-email-lookup?expand=1 -- check it shows **2 commits, 5 files**.
  3. Preview: sign in; sign in with CAPITALS in the email; on a test account, reset the password and confirm the OLD password is refused at once.
  4. "Merge pull request" (not squash), then the same checks on production.
- **Afterwards:** `git worktree remove ../Remonta-hotfix` (it holds a copy of `.env`).

### 2. S1 step 10 -- backfill scripts: DONE 2026-09-28 (local verification only)
- `apps/api/scripts/backfill-worker-locations.ts` and `backfill-worker-onboarding.ts`; package scripts `backfill:locations` / `backfill:onboarding` (they read `apps/api/.env` via `--env-file`, so they target whatever `AUTH_DATABASE_URL` / `DIRECT_DATABASE_URL` point at -- for the local DB run `node --import tsx scripts/<name>.ts` with the URL exported instead).
- Dry run by default, `--apply` to write, `--report=<file>` for the full JSON. Idempotent. Details and decisions in the plan (step 10).
- **Still to do on the Neon branch** (step 12): migrations → `localities:refresh` → both dry runs → user reviews the ambiguous/unmatched list and the estimate counts → `--apply`.

### 2b. Step 13 -- email verification before the password: BUILT 2026-09-28 (scope change)
- Stateless like the client sign-up (user decision: no table): a signed ticket, 10-minute expiry, checked again at sign-up (R6). Two contract entries, an `emailCode` field kind, the password disabled until verified. Details in the plan (step 13).
- **Verified in the browser by the user, 2026-09-28:** send code → verify → password appears → availability check on blur → services → complete sign-up, all against the local database. Plus the availability check, the hostile-input suite, and the local catalogue seed (see the plan, step 13).
- Open: a verified Remonta sender domain in Resend, so real addresses receive the code.

### 3. Remaining S1 steps
- **Step 11 (CI + docs):**
  - `ci-api.yml`: quality, PostGIS service container, DB tests via TEST_DATABASE_URL, the openapi.json drift test;
  - add `@remonta/db`, `@remonta/form-engine` and `@remonta/api-contract` quality to CI;
  - CLAUDE.md: apps/api commands and the localities refresh procedure.
- **Step 12 (Build and Test):**
  - all gates;
  - local end-to-end in both switch modes;
  - the Vercel preview checks;
  - rerun `packages/db/bench` (every key query under 5 ms at 100 k);
  - decide whether to commit a refreshed `apps/app/src/generated/auth-client` (it differs by the S1 models; Vercel regenerates at build).
- **Before any production switch to `api`:**
  - the deferred CRM notification must exist (the user skipped it for now);
  - production migrations (record `SELECT extversion FROM pg_extension WHERE extname = 'postgis'` first) → `localities:refresh` → backfill dry runs → user approval → `--apply`.

### 4. Waiting on the user
- **Push decision** for the hotfix (above).
- **A test email send:** `apps/api/.env` has `EMAIL_FROM` set to Resend's test sender (onboarding@resend.dev), which only delivers to the Resend account owner. Set a verified Remonta sender for real inboxes, or approve one test send.
- **reCAPTCHA:** a full api-mode sign-up needs a real token, which needs the site key to allow `localhost` (Google reCAPTCHA admin), or it is tested on the Vercel preview.
- **A Neon branch** for rehearsing the migrations and backfills (before step 12).
- **Open follow-ups, not S1:**
  - the stale `UserRole` type in packages/schemas;
  - two duplicate `users.email` indexes to drop (a contract step);
  - move the other hand-built forms (8 suburb pickers, 11 multi-step pages) onto the form engine one at a time;
  - admin users search still uses `contains` + insensitive (harmless wildcards, admin only).

### 5. Local environment to continue
- **Docker Desktop** must be running: container `remonta-s1-pg` (postgis/postgis:16-3.4, port 55432).
  - Database `s1test`: all S1 migrations applied (patched in place), 15,467 localities loaded; used by every DB test via `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/s1test`.
  - If the container is gone: recreate the database from `template0`, run `migrate deploy`, then `localities:refresh --apply` (packages/db README).
- **`apps/api/.env`:** the user's secrets (never read by Claude) plus non-secret values Claude added (CORS_ORIGINS, RECAPTCHA_ALLOWED_HOSTNAMES, IP_HASH_SECRET, EMAIL_FROM, APP_BASE_URL).
  - Run: `cd apps/api && pnpm run build && node --env-file=.env dist/main.js` (port 4000). Unset any shell AUTH_DATABASE_URL first: `--env-file` does not override it.
- **`apps/app` dev against the local DB** (never with its .env as is -- it points at production DB and Redis):
  `AUTH_DATABASE_URL=…/s1test DATABASE_URL=…/s1test DIRECT_DATABASE_URL=…/s1test UPSTASH_REDIS_REST_URL= UPSTASH_REDIS_REST_TOKEN= REGISTRATION_BACKEND=api NEXT_PUBLIC_API_URL=http://127.0.0.1:4000 npx next dev -p 3000`
- **G-NAF extract:** `C:/data/gnaf` (for future `localities:build`). k6 binary: this session's scratchpad (download again if needed).
- **Uncommitted in the S1 tree:** only regenerated Prisma clients (`apps/*/src/generated`). Never commit them without checking `git diff --ignore-all-space --numstat`.
- **Local catalogue:** the services step reads Category/Subcategory, empty on a fresh `s1test`. Seed with `docker exec -i remonta-s1-pg psql -U postgres -d s1test < packages/db/scripts/local/seed-catalogue.sql` (from apps/app's SERVICE_OPTIONS; local only).
- **Trap (bit on 2026-09-28):** `pnpm --filter @remonta/db test` TRUNCATEs `au_localities` on the database in `TEST_DATABASE_URL` and leaves it empty. Reload: `DIRECT_DATABASE_URL=…/s1test pnpm --filter @remonta/db localities:refresh` (prints the plan hash), then the same with `--apply --expect=<hash>`.

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
