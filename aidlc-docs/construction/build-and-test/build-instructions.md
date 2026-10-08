# Build Instructions -- cycle *admin worker search on apps/api*

One set for the four PRs (1 identity api side, 2 admin api side, 3 app switch, 4 clean-up). The repository's own
process (CLAUDE.md "The process") is the authority; this file says what is specific to this cycle.

## Prerequisites

- **Build tool:** pnpm 9.15.9 (`packageManager` in the root `package.json`), Node 20.9+ (CI runs 20 and 22; the api
  image runs 22), Turborepo through `npx turbo`.
- **Dependencies:** `pnpm install --frozen-lockfile` at the root. New in this cycle: `jose` ^6.2.12 (`apps/api`,
  and `apps/app` from PR 3), `fast-check` (dev, `packages/api-contract`). The lockfile keeps `unplugin-swc`'s vite
  peer on 5.4.21: a plain `pnpm install` on this machine re-resolves it to vite 7 and breaks the api's type check;
  if the lockfile ever shows that change, restore it and add importer entries by hand (PR 1 summary, G5).
- **Environment variables (api, local run only; tests need none of the secrets):** everything in
  `apps/api/.env.example`, now including `API_TOKEN_SECRET` (32+ characters; any value locally) and the optional
  `API_TOKEN_SECRET_PREVIOUS`. The service refuses to boot without the first one.
- **Environment variables (app, from PR 3):** `API_TOKEN_SECRET` (the same value as the local api's),
  `NEXT_PUBLIC_API_URL`.
- **Local containers for the database-backed tests:** the PostGIS and fake-GCS containers of CLAUDE.md "apps/api";
  `TEST_DATABASE_URL` pointing at localhost. Without them the gated suites are skipped and reported as skipped.
- **System:** Windows 11 with Git Bash (this machine) or Linux (CI); about 4 GB free for `node_modules` and the
  Next.js builds.

## Build steps

### 1. Install

```bash
pnpm install --frozen-lockfile
# Afterwards, if `git status` shows apps/*/src/generated/** modified: the Prisma postinstall rewrote them.
git checkout -- apps/app/src/generated apps/web/src/generated
```

### 2. Quality gates, per package touched by the PR

```bash
pnpm --filter @remonta/api-contract run quality   # PR 1, 2
pnpm --filter @remonta/api run quality            # PR 1, 2 (prisma:generate, lint, strict tsc, vitest)
pnpm --filter @remonta/infra run quality          # PR 1 (lint, tsc, tests, render:check)
pnpm --filter @remonta/app run quality            # PR 3, 4 (type-check:baseline, lint:baseline, vitest)
pnpm --filter @remonta/schemas run quality        # any PR touching packages (P-1..P-5 boundaries)
pnpm --filter @remonta/form-engine run quality    # unchanged by this cycle; CI runs it anyway
```

Baselines tolerate existing debt and reject anything new; a failure is a regression.

### 3. Build everything

```bash
npx turbo run build
```

### 4. Verify

- **Expected:** `Tasks: 3 successful, 3 total` (api via tsup, app and web via `next build`).
- **Artifacts:** `apps/api/dist/main.js` (+ `hash-worker.js`), `apps/app/.next`, `apps/web/.next`.
- **Acceptable noise:** the `LF will be replaced by CRLF` warnings from git on Windows; Next.js's own build
  warnings already present on `main`.
- **Not acceptable:** any change under `apps/*/src/generated/**` (revert it); a lockfile diff beyond the intended
  entries.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `tsc` errors in `apps/api/vitest.config.ts` about two `vite` types | the lockfile re-resolved `unplugin-swc`'s peer to vite 7 | `git checkout -- pnpm-lock.yaml`, re-add only the importer entries, `pnpm install --frozen-lockfile` |
| `EPERM` on `query_engine-windows.dll.node` | a running dev server holds the Prisma engine | stop it, or `pnpm install --ignore-scripts` then generate by hand (CLAUDE.md trap) |
| api tests: "no record found" after `@remonta/db test` | that suite empties `au_localities` | `localities:refresh --apply --expect=<hash>` (CLAUDE.md trap) |
| the api refuses to start locally: `API_TOKEN_SECRET: required` | the new secret is missing from `apps/api/.env` | add any 32+ character value (and the same one to the app's env from PR 3) |
