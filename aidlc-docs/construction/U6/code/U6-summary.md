# U6 — `apps/` Relocation: Implementation Summary

**Unit**: U6 (Phase B) — the highest deployment risk in the migration
**Date**: 2026-09-10
**Decisions**: D1=A (`main`), D2=A (tag+delete), D3=A (same Vercel projects), D4=B (two workflows), D5=A (snapshot)
**Status**: **Steps 1–6 complete on branch `u6/monorepo`, commit `0485312`.**
**Steps 7–10 — push, Vercel re-point, merge, retire `app/main` — are NOT done.**

---

## 1. What Exists Now

```
remonta/                        ← branch u6/monorepo
├── package.json                 workspace root, private, turbo only
├── pnpm-workspace.yaml  turbo.json  .npmrc  .gitignore
├── .github/workflows/           ci-app.yml, ci-web.yml, ci-supply-chain.yml
├── aidlc-docs/  .aidlc-rule-details/  .brd/
├── apps/web/    @remonta/web    ← from `main`      (331 files)
└── apps/app/    @remonta/app    ← from `app/main`  (525 files)
```

**961 files changed. No file content changed — every change is a path**, plus the new root
configuration.

The quality gates prove it: both apps report **exactly** the same findings as before the move.

| App | Before | After |
|---|---|---|
| `apps/app` | 149 type, 523 lint, 41 tests | **149 type, 523 lint, 41 tests** ✅ |
| `apps/web` | 76 lint, strict tsc clean | **76 lint, strict tsc clean** ✅ |

---

## 2. It Was a Tree Merge, Not a Move

**18 root-level paths collided**, each existing in both products with entirely different content:

```
.github  .gitignore  .quality-baseline  components.json  docs
eslint.config.mjs  next.config.ts  package.json  pnpm-lock.yaml
postcss.config.mjs  prisma  public  README.md  scripts  src
tsconfig.json  vercel.json
```

Each product keeps its own copy inside its app directory. Only genuine workspace infrastructure
sits at the root. `docs/` moved with its product — the two sets are different (marketing has
webhook and sync guides; the app has architecture and business documents) and splitting them by
subject would have meant editorial judgements this unit had no business making.

One lockfile now, at the root. Both per-app `pnpm-lock.yaml` files were discarded and regenerated
as a single workspace lockfile.

---

## 3. Two Problems the Move Created — Both Caught Before Committing

### `.gitignore` was root-anchored

`/node_modules`, `/.next/`, `/out/` and `/build` only ever matched at the repository root. The
moment the apps moved into subdirectories, **those rules stopped matching anything**.

A `git add -A` under the old rules staged **54,219 dependency files and 1,508 build artifacts**.

Caught by checking the staged count before committing rather than after. The index was reset and
the rules made recursive. Final commit: **961 files, zero dependency `node_modules`, zero
`.next`.**

This is worth remembering for U7 — every new `packages/*` directory inherits the same exposure, and
the fix has already been applied.

### That fix then swallowed something that must stay tracked

Prisma emits a `node_modules` folder **inside** its generated client, and that client is committed
on purpose so Vercel can bundle it (`outputFileTracingIncludes` in `next.config.ts`). The new
recursive rule matched it.

Excepted explicitly, with the reasoning recorded in `.gitignore` itself so the next person to
tidy it up understands why the exception exists:

```gitignore
!src/generated/**/node_modules/
!apps/*/src/generated/**/node_modules/
```

---

## 4. Incidental Cleanup

The commit drops **18 stale `query_engine-windows.dll.node.tmpNNNNN` files** — roughly 21 MB each,
leftovers from interrupted `prisma generate` runs, tracked on `main` by accident.

The application's `.gitignore` already had `*.tmp[0-9]*` for exactly this; the merge brings that
rule to both products.

---

## 5. Turborepo Now Has Something to Orchestrate

```
U5:  turbo ls → 0 packages
U6:  turbo ls → 2 packages   @remonta/app, @remonta/web
```

`turbo run build --concurrency=1` builds both: **2 successful, 2 total.**

### Concurrency must be 1

Parallel builds **fail**. Each app runs `prisma generate` during its build, and two concurrent
generates conflict on Windows — the failure moves between apps run to run, which is the signature
of a race rather than a defect. Both apps build reliably on their own and serialised.

### Caching does not work yet

Second run: `Cached: 0 of 2`. Not investigated to conclusion — it is an optimisation, not
correctness, and both apps build correctly either way.

One real staleness bug was fixed in passing: `turbo.json`'s `globalDependencies` still pointed at a
root-level `.quality-baseline/**` that had moved into the apps. That alone does not explain the
misses. **Left as a follow-up**, recorded honestly rather than papered over — a cache that never
hits is at least not lying about it.

---

## 6. CI: Three Workflows

Per D4=B, split by path filter:

| Workflow | Runs when | Gate |
|---|---|---|
| `ci-app.yml` | `apps/app/**`, `packages/**`, lockfile, turbo config | type baseline (149), lint baseline (523), 41 tests |
| `ci-web.yml` | `apps/web/**`, `packages/**`, lockfile, turbo config | **strict `tsc`**, lint baseline (76) |
| `ci-supply-chain.yml` | any change | `pnpm audit` and SBOM, both report-only |

A marketing change no longer runs the application's tests. Check names stay distinct, so branch
protection can require each product independently.

**Branch protection will need updating** — the old `CI / Quality (Node 20.x)` and `(Node 22.x)`
checks no longer exist. The new names are `App Quality (Node 20.x)`, `App Quality (Node 22.x)`,
`Web Quality (Node 20.x)`, `Web Quality (Node 22.x)`.

---

## 7. `.env` Must Move Into Each App

Found by the build failing:

```
Failed to collect page data for /api/auth/forgot-password
```

Next.js loads `.env` relative to the **app** root. With the app at `apps/app/`, a root-level `.env`
is invisible to it, and modules that read environment variables at import time — `ratelimit`
(Upstash) and `email` (Resend) — threw during page-data collection.

**Local developers must copy `.env` and `.env.local` into `apps/app/`.** Both remain gitignored.
Vercel is unaffected: it injects environment variables directly and does not read `.env` files.

---

## 8. ⚠️ What Is NOT Done

**Nothing has been deployed. Vercel has not been touched. `main` is unchanged.**

| Step | Status |
|---|---|
| 7 — Push branch, open PR, verify CI | **Not done** |
| 8 — Re-point Vercel Root Directory and Production Branch | **Not done** |
| 9 — Merge to `main`, verify production | **Not done** |
| 10 — Tag and delete `app/main` | **Not done** |

### Before Step 8 — the pre-flight that was deferred

Step 0 called for these and they have **not** been done, because they need dashboard access:

- [ ] **Record both Vercel projects' current production deployment IDs** — the rollback targets. This is the single most important line in the plan.
- [ ] Rehearse the rollback: promote a previous deployment, confirm the site works, promote back
- [ ] Screenshot current Root Directory and Production Branch settings

### The settings to change (Step 8), marketing first

| Project | Root Directory | Production Branch |
|---|---|---|
| marketing | → `apps/web` | unchanged (`main`) |
| application | → `apps/app` | **`app/main` → `main`** |

That production-branch change is the most consequential setting in the unit.

**Expect the branch to fail Vercel builds until this is done** — both projects still build from the
repository root, where there is no longer an application. That failure is expected and harmless.

### The verification that matters

Preview verification **must load a database-backed page and confirm which product is served**. The
failure this unit risks is not a failed build — Vercel never promotes those. It is a successful
build serving the wrong app.

---

## 9. Production Safety

| Invariant | Status |
|---|---|
| **PS-1** Both apps build and deploy | ✅ both build locally; deployment pending Step 8 |
| **PS-2** Preview-verified | ⏳ Step 7–8 |
| **PS-3** Single `git revert` | ✅ until Step 8; afterwards a Vercel setting plus a revert |
| **PS-4** Additive before subtractive | ✅ old deployments keep serving; `app/main` deleted last, after tagging |
| **PS-5** No destructive DB change | ✅ **no schema, no migration, no data touched at all** |
| **PS-6** Not both structure and behaviour | ✅ pure structure — no file content changed |
| **PS-7** Integrations disabled before removal | ✅ N/A |

---

## 10. Follow-ups

| Item | Where |
|---|---|
| **Record Vercel deployment IDs before Step 8** | **Immediate** |
| Turborepo caching does not hit | New — optimisation |
| Parallel builds conflict on `prisma generate` | Use `--concurrency=1`; investigate later |
| Branch protection needs the four new check names | With Step 9 |
| Copy `.env` into `apps/app/` for local development | Any developer |
| Windows `MAX_PATH` — work was done at `C:\rm-u6` | Long paths still not enabled system-wide |
