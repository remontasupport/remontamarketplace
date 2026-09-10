# U6 — `apps/` Relocation and Root Directory Change: Code Generation Plan

**Stage**: CONSTRUCTION — Code Generation (Part 1: Planning)
**Unit**: U6 — the highest deployment risk in the migration
**Date**: 2026-09-10
**Status**: APPROVED 2026-09-10 — D1=A (main), D2=A (tag+delete), D3=A (same projects), D4=B (two workflows), D5=A (snapshot)

---

## 1. This Is the Unit Everything Else Was Sequenced Around

U1–U5 built a safety net precisely so this unit could be attempted. It is the one where:

- **Two branches become one repository.** This is the actual monorepo consolidation.
- **Both Vercel projects change Root Directory** and start deploying from the same branch.
- **The `app/main` branch stops being a product** and becomes history.

Everything before this was reversible with `git revert` and cost nothing if wrong. This one changes
how both products deploy.

---

## 2. What the Merge Actually Involves

I compared the two trees. **18 root-level paths collide**:

```
.github  .gitignore  .quality-baseline  components.json  docs
eslint.config.mjs  next.config.ts  package.json  pnpm-lock.yaml
postcss.config.mjs  prisma  public  README.md  scripts  src
tsconfig.json  vercel.json
```

Every one of those exists in **both** products with **different content**. `src/`, `prisma/`,
`package.json` and `next.config.ts` are entirely different codebases sharing a name.

Unique to marketing: `sanity/`, `sanity.config.ts`, `SANITY_SETUP.md`
Unique to the app: `middleware.ts`, `tests/`, `vitest.config.mts`, `data.json`, `.npmrc`, `turbo.json`, `pnpm-workspace.yaml`, `aidlc-docs/`, `.aidlc-rule-details/`, `.brd/`

So U6 is not a directory move. It is a **tree merge with 18 collisions**, resolved by giving each
product its own subtree.

### Target layout

```
remonta/                        ← one branch, one repository
├── package.json                 workspace root (private, no app deps)
├── pnpm-workspace.yaml          apps/*, packages/*
├── turbo.json
├── .npmrc
├── .gitignore                   merged from both
├── .github/workflows/ci.yml     ONE workflow, both apps
├── aidlc-docs/  .aidlc-rule-details/  docs/  .brd/
│
├── apps/web/                    ← from `main`
│   ├── package.json  next.config.ts  tsconfig.json  vercel.json
│   ├── eslint.config.mjs  postcss.config.mjs  components.json
│   ├── .quality-baseline/  scripts/  prisma/  public/  src/
│   └── sanity/  sanity.config.ts
│
└── apps/app/                    ← from `app/main`
    ├── package.json  next.config.ts  tsconfig.json  vercel.json
    ├── eslint.config.mjs  postcss.config.mjs  components.json
    ├── .quality-baseline/  scripts/  prisma/  public/  src/
    └── middleware.ts  tests/  vitest.config.mts  data.json
```

---

## 3. Five Decisions

### Question D1 — Which branch becomes the monorepo?

`main` is the default branch on `origin` (`origin/HEAD → origin/main`).

A) **`main`.** Marketing's files move down into `apps/web/`, the application arrives as `apps/app/`. The default branch stays the default branch.

B) **`app/main`.** The application stays put and marketing moves in.

C) **A new branch**, e.g. `monorepo`, promoted to default once verified.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** `main` is already the default branch and where a newcomer looks first.
> It is also the smaller tree (231 files versus 460), so fewer files move on that side. B would
> leave the default branch as the marketing site while the monorepo lived elsewhere, which inverts
> the eventual reality. C is defensible and safer-feeling, but the promotion step is its own risky
> event, and the work happens on a feature branch either way.

### Question D2 — What happens to `app/main` afterwards?

A) **Tag and delete.** Tag it `archive/app-main-final` so the history is reachable, then delete the branch. One product, one branch.

B) **Keep it**, frozen, no further commits.

C) **Delete outright** — the repository history already contains it.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** A tag is free and permanent, and it removes the possibility of someone
> pushing to `app/main` months later and wondering why nothing deploys. B leaves exactly that trap.
> C loses the convenient pointer for no gain.

### Question D3 — How do the Vercel projects get re-pointed?

Both projects currently build from the repository root, on different branches. After U6 they both
build from **the same branch**, with different Root Directories.

A) **Same projects, change two settings each** — Production Branch → `main`, Root Directory → `apps/web` / `apps/app`. Environment variables untouched. Matches the T1=A reasoning from U5's predecessor: no re-entry of 45 variables.

B) **New projects** — as rejected in T1 for the same reason.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A**, for the reason already settled: re-creating projects means re-entering
> environment variables by hand, and a missed `AUTH_DATABASE_URL` produces the one genuinely
> dangerous failure — a build that succeeds and a runtime that does not.
>
> **The application project's Production Branch changes from `app/main` to `main`.** That is the
> single most consequential setting in this unit.

### Question D4 — One CI workflow or two?

Both branches currently have their own `ci.yml`, and they differ: the app runs
`type-check:baseline`, marketing runs strict `tsc`.

A) **One workflow, a matrix over both apps.** Single file; each app runs its own `quality` script, so the strict/baseline difference is preserved by the scripts rather than the workflow.

B) **Two workflows**, `ci-web.yml` and `ci-app.yml`, with path filters so each runs only when its app changes.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **Recommendation: B**, and this is where I differ from the obvious choice. Path filters mean a
> marketing-only change does not run the application's 41 tests and vice versa, which matters once
> `packages/*` exist and the graph grows. It also keeps the two products' check names distinct in
> branch protection, so you can require them independently. A is simpler today and worse at U11.

### Question D5 — How should the application's tree be brought in?

B3=C chose "fresh start — import both as snapshots".

A) **Snapshot**, per B3=C. Copy the tree in as one commit; `git log` for application files starts here. The old history stays reachable via the D2 tag.

B) **Subtree merge** preserving history, so `git log` and `git blame` traverse the move.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A**, because it is what you already decided in B3=C and nothing since has
> changed the trade-off. Worth restating the cost honestly: **`git blame` on application files will
> stop at this commit.** For a 460-file codebase that is a real loss. If that matters more than it
> did when B3 was answered, B is still available and this is the last moment to choose it.

---

## 4. Per-Unit Stage Assessment

| Stage | Decision | Rationale |
|---|---|---|
| **Functional Design** | **SKIP** | No business logic changes. Every file keeps its content; only its path changes. |
| **NFR Requirements** | **SKIP** | No new NFRs. NFR-2.1 (both deployable throughout) already governs. |
| **NFR Design** | **SKIP** | No new patterns. |
| **Infrastructure Design** | ⚠️ **PARTIAL — inline** | Vercel Root Directory and Production Branch change. Rather than a separate stage, the deployment change is designed in §6 with an explicit rollback. Say if you would rather it ran fully. |
| **Code Generation** | **EXECUTE** | Always. |

---

## 5. Unit Context

- **Depends on**: U5 (both products already on pnpm — which is why D3 in U5 mattered)
- **Blocks**: U7 and everything after
- **Traces to**: FR-1.1, FR-1.2, FR-1.3, FR-2.1, FR-2.2, FR-7.1, NFR-6.3
- **Production risk**: **HIGHEST IN THE MIGRATION**

### The failure mode to design against

Not a failed build — Vercel never promotes those. The danger is **the build succeeds and the
runtime fails**: wrong Root Directory serving the wrong app, or a path assumption breaking after
the move.

**So preview verification must load a database-backed page and confirm which product it is.** A
green build proves nothing here. This was already recorded as the rule for U6 and U8.

### Windows path length — a live concern

U5 hit `ELIFECYCLE -4058` installing pnpm at a deep path. `apps/app/` adds nine characters to
every path in a repository already at
`C:\Users\Toton\Desktop\Remonta\remontamarketplace`.

**Mitigation, before any moving**: `git config --system core.longpaths true`, then verify
`pnpm install` still works. If it does not, that is a blocker to resolve first — not something to
discover halfway through the move.

---

## 6. Generation Steps

### Step 0 — Pre-flight *(do these before touching anything)*
- [ ] `git config --system core.longpaths true`; confirm `pnpm install` still succeeds
- [ ] **Record both Vercel projects' current production deployment IDs** — the rollback targets
- [ ] Confirm Vercel's current Root Directory and Production Branch settings, and screenshot them
- [ ] Confirm branch protection status, so a mid-flight push cannot bypass CI

### Step 1 — Branch and move marketing into `apps/web/`
- [ ] Branch `u6/monorepo` from `main`
- [ ] `git mv` every marketing path into `apps/web/`, keeping `.gitignore`, `docs/`, `README.md` and `.github/` at root
- [ ] Verify with `git status` that moves are detected as renames, not delete-plus-add

### Step 2 — Bring the application in as `apps/app/`
- [ ] Import the `app/main` tree as a snapshot (per D5)
- [ ] Hoist root-level infrastructure it carries — `turbo.json`, `pnpm-workspace.yaml`, `.npmrc`, `aidlc-docs/`, `.aidlc-rule-details/`, `.brd/`
- [ ] Merge `.gitignore` from both, keeping every rule from each

### Step 3 — Root workspace package
- [ ] Create the root `package.json`: `private: true`, `packageManager`, workspace scripts, **no application dependencies**
- [ ] Confirm `pnpm-workspace.yaml` globs now match two real directories
- [ ] `pnpm install` at root; confirm it links both apps

### Step 4 — Verify Turborepo now has something to orchestrate
- [ ] `turbo ls` shows **2 packages** (it showed 0 in U5)
- [ ] `turbo run build` builds both
- [ ] Second run is a **cache hit** — the caching U5 could not demonstrate

### Step 5 — One or two CI workflows (per D4)
- [ ] Rewrite CI for the new layout with per-app path filters
- [ ] Verify YAML parses and every referenced script exists at its new path

### Step 6 — Local verification, both apps
- [ ] `apps/web`: build succeeds; quality gate at 76 lint, strict tsc clean
- [ ] `apps/app`: build succeeds; quality gate at 149 / 523 / 41 tests
- [ ] No file **content** changed anywhere — paths only, plus the new root files

### Step 7 — Push and verify previews **before touching Vercel**
- [ ] Push `u6/monorepo`; open a PR
- [ ] CI must pass for both apps
- [ ] **Vercel will still build from the old Root Directory and will likely fail** — that is expected and harmless at this stage

### Step 8 — Re-point Vercel, marketing first
- [ ] Marketing project: Root Directory → `apps/web`. Verify its preview loads and renders the worker directory.
- [ ] Application project: Root Directory → `apps/app`, **Production Branch → `main`**. Verify sign-in and a database-backed dashboard page.
- [ ] Marketing first because it is the lower-consequence product and proves the sequence

### Step 9 — Merge and verify production
- [ ] Merge to `main`
- [ ] Both production deployments verified: sign-in, a database-backed page, the marketing directory
- [ ] **Confirm each project is serving the right product** — the specific failure this unit risks

### Step 10 — Retire `app/main` (per D2)
- [ ] Tag `archive/app-main-final`, push the tag
- [ ] Delete the branch locally and on `origin`

### Step 11 — Documentation
- [ ] `aidlc-docs/construction/U6/code/U6-summary.md`

---

## 7. Rollback

| Stage | Recovery |
|---|---|
| Before Step 8 | `git revert` or abandon the branch. Nothing deployed. |
| After Root Directory change, before merge | Restore the setting; production still serves the recorded deployment |
| After merge, production broken | **Promote the Step 0 deployment ID** — seconds, no rebuild. Then restore settings and revert the merge. |
| After Step 10 | Branch deletion is recoverable from the tag |

**Recording the deployment IDs in Step 0 is the single most important line in this plan.** It is
what turns a bad outcome into a sixty-second fix.

---

## 8. Production-Safety Protocol

| Invariant | How U6 satisfies it |
|---|---|
| **PS-1** Both apps build and deploy | Steps 6 and 9 |
| **PS-2** Preview-verified | Step 8 — **must load a database-backed page and confirm which product is served** |
| **PS-3** Single `git revert` | Until Step 8. After that, recovery is a Vercel setting plus a revert. |
| **PS-4** Additive before subtractive | ✅ Old deployments keep serving until a verified replacement is promoted; `app/main` is deleted last, after a tag |
| **PS-5** No destructive DB change | ✅ N/A — no schema or data touched |
| **PS-6** Not both structure and behaviour | ✅ Pure structure. **No file content changes.** |
| **PS-7** Integrations disabled before removal | ✅ N/A |

---

## 9. Summary

**11 steps, and Step 0 matters more than any of them.**

**Five decisions**: D1 which branch (recommend **A, `main`**), D2 retire `app/main` (recommend
**A, tag then delete**), D3 Vercel (recommend **A, same projects**), D4 CI (recommend **B, two
workflows** — the one place I differ from the obvious answer), D5 history (recommend **A**, per
B3=C, **but this is the last moment to change your mind about losing `git blame`**).

**What makes this survivable**: both apps already on pnpm from U5, CI proving both build, 41 tests,
quality baselines, and Vercel's refusal to promote a failed build. That is the safety net U1–U5
existed to build.

**Estimated scope**: ~1 week, most of it verification.
