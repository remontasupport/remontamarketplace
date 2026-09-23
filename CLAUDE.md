# Working in this repository

## The one thing to know first

**`main` is production for BOTH products.** A merge deploys the application
(`app.remontaservices.com.au` + 3 domains) and the marketing site at the same time.
There is no staging branch.

**Never push to `main` directly.** Always branch → PR → verify → merge.

---

## The process

### 1. Branch

```bash
git checkout main && git pull
git checkout -b <type>/<short-name>      # fix/… feat/… u9/… 
```

### 2. Verify locally, before pushing

```bash
pnpm --filter @remonta/app run quality     # 149 type · 518 lint · 54 tests
pnpm --filter @remonta/web run quality     # 76 lint · strict tsc
pnpm --filter @remonta/schemas run quality # P-1..P-5 boundaries
npx turbo run build                        # both apps
```

Baselines tolerate existing debt and reject anything new. A failure here is a real
regression, not noise.

### 3. Push and open a PR

```bash
git push origin <branch>
```

Compare URL — **encode slashes in branch names**, or GitHub silently compares the
wrong thing:

```
https://github.com/remontasupport/remontamarketplace/compare/main...fix%2Fmy-branch?expand=1
```

**Sanity-check before clicking Create:** the commit and file counts should match what
you changed. Hundreds of commits means the base is wrong.

### 4. Wait for CI

`App Quality`, `Web Quality`, `Supply chain`, `Package boundaries`, plus both Vercel
previews.

### 5. Verify the preview — this is the step that catches real problems

A green build proves compilation. It proves nothing about runtime. On the preview URL:

- **Sign in**
- **Load a page that queries the database** — a dashboard, not the landing page
- **Submit a form** if the change touches schemas or validation

Every production incident this project has had would have been caught here. A green
build with every query failing is the standard failure mode, not an unusual one.

### 6. Merge

Use **"Merge pull request"** — not Squash. Squashing collapses the commits and
destroys per-unit revert granularity.

### 7. Verify production

Same checks as the preview, on the live domain. Production has its own environment
variables; a working preview does not prove a working production.

---

## Rollback

Promote the last known-good deployment in Vercel. Seconds, no rebuild.

| Project | Deployment |
|---|---|
| `remonta-app` | `izjuyh7pl` |
| `remontamarketplace` | `8843hlhft` |

Re-record these before any unit that changes deployment settings. **Promote a
deployment; do not redeploy a commit** — a rebuild can fail, an existing build cannot.

---

## Traps that have actually bitten

**`vercel.json` overrides `package.json`.** Both apps carry their own `buildCommand`,
and Vercel prefers it. Change one without the other and the deploy fails while
`turbo run build` passes locally. They must move together.

**`vercel.json` rejects unknown keys**, including `//` comments. `turbo.json` allows
one. Do not assume they behave alike.

**Local passing ≠ Vercel passing.** `turbo` reads `package.json`; only Vercel reads
`vercel.json` and validates its schema. Three separate failures have had this shape.

**Do not commit regenerated Prisma clients.** `prisma generate` rewrites line endings
across ~80 files with no content change. Check with
`git diff --ignore-all-space --numstat` and `git checkout --` them if empty.

**Windows `EPERM` on `query_engine-windows.dll.node`** means a process holds the
engine — usually a running dev server. Stop it, or
`pnpm install --ignore-scripts` then generate manually.

**Redis caches job listings for 2 hours.** Changing job data directly in the database
shows nothing until the cache is cleared: `npx tsx scripts/clear-jobs-cache.ts`. There
is no error — just the old list.

---

## Verify claims; do not assume them

- **Check refs, not reports.** `git ls-remote origin main` after a merge. "It's merged"
  has been wrong more than once, usually because the PR was created but not merged.
- **Prove a guard fails.** A boundary rule that has never rejected anything may be
  unenforceable. One was: `packages/schemas` had no TypeScript parser, so ESLint could
  not read the files it guarded and exited 0 forever.
- **Beware checks that cannot fail.** `.catch(() => 0)` around an invalid query reports
  success. So does a cache helper that returns early when unconfigured. Both happened
  here; both read as reassurance.

---

## Layout

```
main
├── apps/app        the application    → remonta-app
├── apps/web        the marketing site → remontamarketplace
└── packages/
    ├── config      tsconfig, ESLint (incl. P-1..P-5), Prettier
    ├── schemas     Zod schemas + types. NO Next/React/DOM/Prisma (P-5)
    └── db          Prisma schema + migrations
```

`apps/web` must never import `@remonta/db` or a `domain-*` package (**P-1**, **P-2**) —
marketing holds no database access. Enforced by ESLint and by manifest omission;
neither alone is sufficient.

Secrets live in `apps/app/.env` and `.env.local`, gitignored. Root-level copies are
stale leftovers from before the monorepo — ignore them.

---

## AI-DLC

This project follows the AI-DLC workflow in `aidlc-docs/`. Unit plans, summaries and
the audit trail live there. `aidlc-docs/aidlc-state.md` is the current position.

Log every user input verbatim in `audit.md` by **appending** — never rewrite it.
