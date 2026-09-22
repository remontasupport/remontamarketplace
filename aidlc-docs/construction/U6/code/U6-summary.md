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

---

# Step 8 Progress — 2026-09-22

## Pre-flight: complete

| Item | Status |
|---|---|
| Rollback deployment IDs re-recorded | ✅ marketing `8843hlhft`, application `izjuyh7pl` |
| Production badges confirmed | ✅ both, via Environment=Production filter |
| Rollback rehearsal performed | ✅ promoted previous, confirmed, promoted back — both worked |

The stale 2026-09-10 targets were caught in the process: `uv0ctkia2` now sits *behind* the pnpm
migration and promoting it would have reverted production. Marketing's `8843hlhft` was still
valid, since marketing has not deployed since 2026-08-31.

## Marketing Root Directory → `apps/web`

Changed. First build afterwards still failed with:

```
Error: The Next.js output directory ".next" was not found at "/vercel/path0/.next"
```

**That path is diagnostic.** `/vercel/path0` is the repository root; with Root Directory set to
`apps/web` the error would name `/vercel/path0/apps/web/.next`. So that build ran *without* the new
setting.

Ruled out as causes: there is no root `vercel.json`; `apps/web/vercel.json` is `{"crons": []}` with
no `buildCommand`; `apps/web/package.json` declares `prisma generate && next build`.

Most likely the deployment predated the setting change, or Vercel's **Redeploy** reused the
original deployment's configuration snapshot rather than current project settings. A *new*
deployment is required to pick up a changed Root Directory.

Also to verify: the **"Include files outside of the Root Directory in the Build Step"** checkbox
must be enabled, or the build cannot see `pnpm-lock.yaml`, `pnpm-workspace.yaml` or `turbo.json`
at the workspace root and the install fails.

## Preview Verification: Newsroom Empty — Sanity CORS, Not a Regression

The marketing preview built successfully but its newsroom rendered "No Articles Yet".

**Diagnosis: the preview origin is not registered in Sanity's allowed origins.**

`apps/web/src/app/newsroom/page.tsx` is a **client component**. It fetches from the visitor's
browser in `useEffect`, and swallows failures:

```ts
} catch (error) {
  console.error('Error loading articles:', error)
} finally {
  setLoading(false)      // → renders the empty state
}
```

So a blocked request produces an ordinary-looking empty page: no error screen, nothing in the
build log. Browser console showed:

```
Error fetching articles: Error: Request error while attempting to reach
https://98ycfc5t.apicdn.sanity.io/v2024-01-01/data/query/production?query=*[_type == "article" ...]
    at s.onerror (...)
```

The project ID, dataset and query are all correct. The request fails at the network layer —
`onerror`, never completing — which is how a CORS block presents to a browser client.

### Why this is not caused by U6

- All four newsroom and Sanity files are **byte-identical** to `main` (verified by hash)
- `@portabletext/react@^4.0.3` is declared
- `apps/web` had **zero** modifications in this unit
- The same code serves articles correctly in production right now

Sanity registers allowed origins per project. The production domain is registered; each preview
deployment gets a unique `*.vercel.app` hostname that is not. **This would have affected any
marketing preview at any time.** It went unnoticed because marketing had never had a preview
deployment verified — `u5-marketing` was pushed on 2026-09-10 and never checked.

### Consequence, and why it should be fixed anyway

Production is unaffected: its origin is already allowed.

But **no marketing preview will ever show articles** until a preview origin is registered, which
silently weakens preview verification for this product — and preview verification is the mechanism
PS-2 depends on. Adding `https://*.vercel.app` (or the project's preview domain) under
**Sanity → Project → API → CORS Origins** restores it.

Recorded as a follow-up rather than done here: it is a Sanity dashboard change, outside the
repository, and unrelated to the relocation.

### A second-order observation

The failure was invisible in every automated signal — the build passed, CI passed, no error page
was served. Only a human opening the page and then the browser console found it. That is a
concrete instance of the gap **U4** (observability) was meant to close, and it was found during a
unit where the accepted risk of deferring U4 was explicitly recorded.

## Steps 7 and 9 — Marketing Cutover COMPLETE (2026-09-22)

Pull request **#4** merged as `5515399`. 17 commits, 1,003 files. `main` is now the monorepo trunk.

| Step | Status |
|---|---|
| 4 — Marketing Root Directory → `apps/web` | ✅ |
| 5 — Preview built with the new root | ✅ `a9b07c5` |
| 6 — Preview verified | ✅ loads; newsroom empty due to Sanity CORS on preview origins (not a regression) |
| 7 — Merge to `main` | ✅ `5515399` |
| 9 — Marketing production verified | ✅ **site loads correctly** |

**Marketing production now builds and serves from `apps/web`.** The highest-risk mechanism in the
unit — changing a Vercel Root Directory on a live project — is proven on a live site.

### Two things worth recording about the merge

**The PR carried 17 commits, not the 13 first estimated.** The count was measured against a local
`main` that was 3 commits ahead of `origin/main`. GitHub compares against `origin/main`, which had
never received marketing's U1 (`0bd28dc`), U3 (`94823d9`) or U5 (`c9b5c58`). Consequence:
`u5-marketing` and `u5-marketing-fix` are now **fully superseded** — the monorepo carries
marketing's U1/U3/U5, and the root `.npmrc` covers both apps with `node-linker=hoisted`, which was
the open question `u5-marketing-fix` existed to answer.

**No GitHub Actions checks ran on the pull request.** `origin/main` had **no** `.github/workflows`
at all — it sat at `9a09ac2`, predating marketing's U3 — and GitHub will not run workflows for a
pull request when they do not exist on the base branch. So this PR *added* CI rather than being
checked by it.

What stood in place of CI: local gates (app 149/523/54, web 76 lint + strict `tsc` clean),
`turbo run build` 2 of 2, and a successful marketing preview build and load. Real evidence, but
from one machine rather than a clean runner. **This was the last unchecked merge** — the workflows
now exist on `main`, so every subsequent push and pull request is gated.

### Remaining

| Step | Action |
|---|---|
| 8b | Application: Root Directory → `apps/app`, **Production Branch `app/main` → `main`** |
| 9b | Verify application production — a database-backed page, per PS-2 |
| 10 | Tag and delete `app/main` |

Follow-ups: register a preview origin in Sanity CORS; close the superseded `u5-marketing` and
`u1-*` pull requests.

## Step 8b — Application Re-point (2026-09-22)

Both settings changed together on `remonta-app`:

| Setting | From | To |
|---|---|---|
| Root Directory | *(repository root)* | `apps/app` |
| Production Branch | `app/main` | **`main`** |

Neither works alone: `apps/app` while tracking `app/main` builds a directory that does not exist on
that branch; `main` with the old root looks for an application that is not there.

**Verified on a preview before production.** Branch `u6/app-verify` (`a360d68`) was pushed *after*
the settings change specifically so `remonta-app` would build it as a Preview under the new root —
a branch other than `main` cannot become Production, so this was safe by construction.

| Check | Result |
|---|---|
| Preview build under Root Directory `apps/app` | ✅ |
| Sign-in and a database-backed page on the preview | ✅ |

That second row is **PS-2**, and it mattered more here than anywhere else in the unit: the Prisma
client was moved today from the shared `node_modules` location into `apps/app/src/generated/client`,
a path that had never run on Vercel. A green build proves compilation; only a real query proves the
engine shipped inside the serverless function. The failure mode `unit-of-work.md` recorded as the
accepted risk for U6 and U8 — *build succeeds, runtime fails* — is precisely this, and U4's
monitoring being deferred means a human loading a page was the only detector available.

Production remained on `izjuyh7pl` throughout, serving all four domains.
