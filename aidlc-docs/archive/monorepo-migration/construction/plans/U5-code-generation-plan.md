# U5 — pnpm and Turborepo: Code Generation Plan

**Stage**: CONSTRUCTION — Code Generation (Part 1: Planning)
**Unit**: U5 — pnpm and Turborepo *(first unit of Phase B)*
**Date**: 2026-09-10
**Status**: APPROVED 2026-09-10 — D1=B (delete the chatbot), D2=A, D3=A, D4=A

---

## 1. Per-Unit Stage Assessment

| Stage | Decision | Rationale |
|---|---|---|
| **Functional Design** | **SKIP** | No business logic, no data model, no behaviour change. Dependency resolution only. |
| **NFR Requirements** | **SKIP** | NFR-6.2 (packages declare their own dependencies) already states what this serves. |
| **NFR Design** | **SKIP** | No new runtime patterns. |
| **Infrastructure Design** | **SKIP** | No cloud resource change. Vercel's package-manager detection changes, which is covered in §3. |
| **Code Generation** | **EXECUTE** | Always. |

---

## 2. What This Unit Does

Convert both products from npm to **pnpm**, and add **Turborepo** — **without moving a single
directory**. The tree looks identical afterwards. U6 does the moving.

The point is D-08: pnpm's strict isolation makes an undeclared dependency a **build error** rather
than an accident that works until it doesn't. That property is why it was chosen, and this unit is
where it starts paying.

---

## 3. Three Findings From Pre-Work

Investigated before planning, so the risks are measured rather than anticipated.

### F-1 — A real phantom dependency, and pnpm will break on it

`src/components/admin/AdminChatbot.tsx:12`:

```ts
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
```

**`@chatscope/chat-ui-kit-styles` is not in `package.json`.** It resolves today only because npm
hoists it — it is a transitive dependency of `@chatscope/chat-ui-kit-react`, which *is* declared.

Under pnpm's isolated `node_modules`, that import **will not resolve** and the build will fail.

This is precisely the class of bug D-08 was chosen to expose, found before the migration rather
than during it.

**Context that matters**: the component is effectively dead. `admin/layout.tsx` imports
`FloatingChatbot`, but its render is commented out — `{/* <FloatingChatbot /> */}`. The import
chain is still live, so the module is still resolved at build time. And chatscope is already
slated for retirement in **U12** (AD-12).

### F-2 — `.npmrc` carries `legacy-peer-deps=true`, and here is why

Running an install with that flag off reveals exactly one conflict:

```
Found: nodemailer@6.10.1
Conflicting peer dependency: nodemailer@7.0.13
  required by @auth/core@0.41.1
```

One conflict, well understood, and **self-resolving**: Nodemailer is retired in favour of Resend
in U13 (AD-02).

pnpm 8+ defaults `strict-peer-dependencies` to `false`, so it should warn rather than fail — but
`legacy-peer-deps` is an npm setting with no pnpm equivalent, so `.npmrc` needs rewriting for the
new resolver rather than carrying the flag across.

Worth noting: `@auth/core` is also the package carrying the **critical vulnerability** U3's audit
surfaced. Two independent reasons to look at it.

### F-3 — Vercel's package manager changes with the lockfile

Vercel detects the package manager from the lockfile. Committing `pnpm-lock.yaml` switches both
projects from `npm install` to `pnpm install` **on the next deploy**.

That is a genuine deployment change, not just a local one. It is also the main reason this unit is
separate from U6 — two deployment-affecting changes in one unit would make a failure ambiguous
(PS-6).

`vercel.json` runs `npx prisma generate ...`, which works under pnpm, so the build command needs
no change.

---

## 4. Four Decisions

### Question D1 — How should the phantom dependency be fixed?

A) **Declare it.** Add `@chatscope/chat-ui-kit-styles` to `package.json`. Minimal, preserves behaviour exactly, keeps U5 purely about the package manager.

B) **Delete the dead chatbot.** Remove `FloatingChatbot`, `AdminChatbot`, the commented-out render and its import, and both chatscope packages. Removes a dependency rather than declaring one for code that is commented out and slated for deletion anyway.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **Recommendation: A**, narrowly, and I hold it loosely. B is genuinely appealing — declaring a
> dependency so that dead code can keep importing a stylesheet is a slightly absurd outcome, and
> B would remove two packages instead. But PS-6 says a unit should not change both structure and
> behaviour, and U12 already owns chatscope's removal with visual verification attached. Doing it
> here means deleting an admin component in a unit whose failure mode is dependency resolution,
> which muddies attribution if something breaks.
>
> Take B if you would rather not carry it; it is defensible and I will note the PS-6 exception.

### Question D2 — How should the pnpm version be pinned?

A) **`packageManager` field + Corepack.** Add `"packageManager": "pnpm@<version>"` to `package.json`. Corepack (already present at 0.20.0) activates the exact version, and Vercel honours the field. One source of truth, no global install.

B) Install pnpm globally and rely on whatever version is present.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** It pins the version for you, CI and Vercel identically. B reintroduces the
> "works on my machine" problem the lockfile exists to prevent.

### Question D3 — Migrate both products in this unit, or the app first?

A) **Both, in this unit.** Marketing and app both move to pnpm now. U6 then becomes a pure directory move.

B) **App only**, marketing later. Smaller blast radius per change.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** If marketing stays on npm, U6 has to merge an npm project and a pnpm
> project into one workspace *while also* relocating directories and re-pointing Vercel — three
> concerns in the unit already carrying the highest deployment risk. Doing both here keeps U6 to
> one job. They remain separate commits on separate branches, so each is still independently
> revertible.

### Question D4 — pnpm's `node-linker` setting?

A) **Default (isolated).** Symlinked, strictly isolated `node_modules`. This is the behaviour D-08 was chosen for.

B) **`node-linker=hoisted`.** Makes `node_modules` flat like npm's. Maximum compatibility, but discards the isolation that motivated the choice.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** B would leave you with pnpm's speed and none of its safety — the phantom
> dependency in F-1 would silently keep working. Next.js, Prisma and Vitest all work under isolated
> linking. If something concrete breaks, the fix is to declare the missing dependency, not to
> loosen the linker.

---

## 5. Unit Context

- **Phase**: B (Workspace, in place)
- **Depends on**: U3 *(U4 was resequenced out of Phase A)*
- **Blocks**: U6
- **Traces to**: FR-1.5, FR-1.6, NFR-6.2, D-07, D-08
- **Production risk**: **Low, but real.** No application code changes, but **the package manager Vercel uses changes**. A resolution failure would fail the build — which Vercel will not promote, so the failure mode is a failed deploy rather than a broken production.

### Why this is safer than it sounds

Vercel never promotes a failed build. If pnpm cannot resolve something, the deploy fails and the
previous deployment keeps serving. The dangerous pattern — build succeeds, runtime fails — is
unlikely here, because dependency resolution problems surface at build time by nature.

**Preview verification still matters**: a package could resolve at build time and fail at runtime
if it is only reached dynamically. Verification must load a database-backed page.

---

## 6. Generation Steps

### Step 1 — Fix the phantom dependency (per D1)
- [x] Apply the chosen option
- [x] Confirm no other undeclared imports exist — the pre-work scan found only this one
- **Traces to**: F-1

### Step 2 — Activate pnpm
- [x] `corepack enable` and pin via the `packageManager` field (per D2)
- [x] Record the exact version chosen
- **Traces to**: D2

### Step 3 — Rewrite `.npmrc` for pnpm
- [x] Remove `legacy-peer-deps=true` — an npm-only setting
- [x] Add pnpm equivalents as needed, with a comment recording the nodemailer/`@auth/core` conflict and that U13 resolves it
- **Traces to**: F-2

### Step 4 — Migrate the lockfile
- [x] `pnpm import` to derive `pnpm-lock.yaml` from `package-lock.json`, preserving resolved versions
- [x] Delete `package-lock.json`
- [x] `pnpm install` and confirm it resolves cleanly
- **This is where a second phantom dependency would surface if the scan missed one**

### Step 5 — Add the workspace and Turborepo
- [x] `pnpm-workspace.yaml` — a single entry for now; `apps/*` and `packages/*` arrive in U6 and U7
- [x] `turbo.json` with `build`, `lint`, `type-check` and `test` tasks and correct dependency ordering
- [x] Confirm Turborepo caching works on a second run
- **Traces to**: FR-1.5, FR-1.6

### Step 6 — Verify locally
- [x] `pnpm run quality` — type baseline 149, lint baseline 523, 41 tests, all unchanged
- [x] `pnpm run build` succeeds
- [x] `turbo run build` succeeds and caches
- [x] Nothing under `src/` modified except the D1 fix

### Step 7 — Update CI
- [x] Switch `.github/workflows/ci.yml` to pnpm — `pnpm/action-setup`, `cache: pnpm`, `pnpm install --frozen-lockfile`
- [x] Keep the Node 20/22 matrix
- **Without this, CI installs with npm against a repo that no longer has `package-lock.json`**

### Step 8 — Marketing branch (per D3)
- [x] Same migration via a git worktree
- [x] Marketing has **no `.npmrc`** and may have different peer conflicts — measure rather than assume
- [x] Verify its build and quality gate

### Step 9 — Documentation
- [x] `aidlc-docs/construction/U5/code/U5-summary.md`

---

## 7. Production-Safety Protocol

| Invariant | How U5 satisfies it |
|---|---|
| **PS-1** Both apps build and deploy | Steps 6 and 8 |
| **PS-2** Preview-verified | **Must load a database-backed page**, not just a static one |
| **PS-3** Single `git revert` | Reverting restores `package-lock.json` and `.npmrc`; Vercel reverts to npm on the next build |
| **PS-4** Additive before subtractive | ⚠️ Partial — `package-lock.json` is deleted as `pnpm-lock.yaml` arrives. Keeping both would be worse: Vercel's detection would become ambiguous. |
| **PS-5** No destructive DB change | N/A |
| **PS-6** Not both structure and behaviour | ✅ Neither — unless D1=B is chosen, which removes a dead component |
| **PS-7** Integrations disabled before removal | N/A |

---

## 8. Summary

**9 steps.** No application code changes except the one-line phantom-dependency fix.

**Four decisions**: D1 phantom dependency (recommend **A**, held loosely), D2 version pinning
(recommend **A**), D3 both products (recommend **A**), D4 linker (recommend **A**).

**The finding that matters**: `@chatscope/chat-ui-kit-styles` is imported but undeclared, and pnpm
**will** break on it. Found in pre-work rather than in a failing deploy — which is exactly the
argument for choosing pnpm in the first place.

**Estimated scope**: 3–5 days, most of it verification rather than typing.
