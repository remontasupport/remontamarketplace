# U5 — pnpm and Turborepo: Implementation Summary

**Unit**: U5 (Phase B — Workspace, in place)
**Date**: 2026-09-10
**Decisions**: D1=B (delete the chatbot), D2=A (`packageManager` + Corepack), D3=A (both products), ~~D4=A (isolated linker)~~ → **D4 REVERSED 2026-09-22 to `node-linker=hoisted`** (see Addendum)
**Status**: Code complete on both branches. `main` `c9b5c58`; `app/main` `fd4af99` (PR `u5-pnpm`, all six checks green). **PS-2 VERIFIED** 2026-09-22 (dashboard loads, queries succeed).

---

## 1. What Changed

### `app/main`

| File | Action |
|---|---|
| `package.json` | `packageManager: pnpm@9.15.9`; removed `@chatscope/chat-ui-kit-react`; added `turbo` |
| `.npmrc` | Rewritten for pnpm — `legacy-peer-deps` removed |
| `package-lock.json` | **Deleted** |
| `pnpm-lock.yaml` | **Created** |
| `pnpm-workspace.yaml` | **Created** — `apps/*`, `packages/*` declared ahead of the directories |
| `turbo.json` | **Created** |
| `.github/workflows/ci.yml` | Switched to pnpm |
| `src/components/admin/AdminChatbot.tsx` | **Deleted** |
| `src/components/admin/FloatingChatbot.tsx` | **Deleted** |
| `src/app/admin/layout.tsx` | Removed the import and commented-out render |

### `main` (marketing)

| File | Action |
|---|---|
| `package.json` | `packageManager: pnpm@9.15.9`; **added `@portabletext/react@4.0.3`** |
| `package-lock.json` → `pnpm-lock.yaml` | Migrated |
| `.github/workflows/ci.yml` | Switched to pnpm |

Marketing deliberately gets **no** `pnpm-workspace.yaml` or `turbo.json` — those belong to the
monorepo root, which U6 establishes.

---

## 2. pnpm Caught Two Phantom Dependencies

This is the entire justification for D-08, demonstrated twice on the first attempt.

### `@chatscope/chat-ui-kit-styles` — app *(dead code)*

Imported by `AdminChatbot.tsx:12`, never declared. Resolved only because npm hoists it as a
transitive dependency of `@chatscope/chat-ui-kit-react`.

The component was already effectively dead — `admin/layout.tsx` imported `FloatingChatbot` but its
render was commented out, so the import chain stayed live while the UI did not. Per **D1=B**, the
whole thing was deleted: both components, the import, the commented render, and the chatscope
dependency. That removed a package rather than adding a declaration to support dead code.

`/api/admin/chat` is now **orphaned** — nothing calls it. Left in place; removing an API route goes
beyond "delete the chatbot", and it is ADMIN-guarded so it is not exposed surface. Flagged as a
follow-up.

### `@portabletext/react` — marketing *(live code)*

The more valuable catch. Imported by `newsroom/[slug]/page.tsx` and `PortableTextComponents.tsx`,
never declared, resolving only via hoisting from `next-sanity`.

**This was demonstrated, not assumed.** Running the marketing build after the pnpm migration but
before declaring it:

```
Failed to compile.
Type error: Cannot find module '@portabletext/react' or its corresponding type declarations.
```

That is live code rendering newsroom articles. Under npm it would have kept working until some
unrelated dependency update stopped hoisting it — and then broken with no obvious cause.

**Pinned to 4.0.3 deliberately.** `pnpm add` resolved **8.0.1** by default, four major versions
ahead of what the code has actually been running against. Accepting that would have been a silent
library upgrade inside a unit whose entire premise is that nothing changes. U5 migrates a package
manager; it does not upgrade rendering libraries.

---

## 3. `.npmrc`: Why the Two Products Differ

**App** — `legacy-peer-deps=true` existed for exactly one conflict:

```
nodemailer@6.10.1 installed
@auth/core@0.41.1 requires peer nodemailer@^7.0.7
```

`legacy-peer-deps` is npm-only, so `.npmrc` was rewritten with `strict-peer-dependencies=false`
and `auto-install-peers=true`, plus a comment recording that **U13 resolves this** by retiring
Nodemailer in favour of Resend (AD-02).

**Marketing** — measured, and it has **no peer conflicts at all**. No `.npmrc` needed. Consistent
with its zero TypeScript errors: the marketing tree is simply in better shape.

`node-linker` is **not** set to `hoisted` (D4=A). Hoisting would have given pnpm's speed and none
of its safety — both phantom dependencies above would have silently kept working.

> ⚠️ **SUPERSEDED 2026-09-22.** D4 was reversed: `node-linker=hoisted` is now set, because pnpm's
> isolated layout could not deploy on Vercel. The reasoning above still stands as the reason to
> remove it again — see the Addendum at the end of this document.

---

## 4. Turborepo

Installed at 2.10.12 with `turbo.json` defining `build`, `type-check`, `type-check:baseline`,
`lint`, `lint:baseline`, `test`, `quality` and `dev`.

**It orchestrates nothing yet, and that is correct.** `pnpm-workspace.yaml` points at `apps/*` and
`packages/*`, neither of which exists until U6 and U7:

```
turbo ls  →  0 no packages (pnpm9)
turbo run build --dry  →  monorepo: true, packages: [], tasks: 0
```

The config is **valid and resolves** — verified by dry run — but caching cannot be demonstrated
until there are packages to cache. Claiming otherwise would be untrue. The task graph is written
now so U6 and U7 are directory moves rather than configuration rewrites.

One correction during the work: Turborepo requires the `//` comment key to be a **string**, not an
array. The initial config failed to parse; fixed.

---

## 5. `pnpm audit` Counts Differently From `npm audit`

| Tool | Total | Critical | High | Moderate | Low |
|---|---|---|---|---|---|
| `npm audit` (U3) | 56 | 7 | 17 | 32 | 0 |
| `pnpm audit` (U5) | **175** | 8 | 70 | 86 | 11 |

**No new vulnerabilities appeared.** pnpm counts per dependency *path* where npm counts per
package, so the same advisories are reported many times over across the tree.

Recorded here so the jump is not mistaken for a regression when CI first runs under pnpm. The
audit step remains report-only.

---

## 6. Verification Performed

| Check | app/main | main |
|---|---|---|
| `pnpm install` | ✅ | ✅ |
| Both Prisma clients generated | ✅ | ✅ |
| `pnpm run quality` | ✅ 149 / 523 / 41 tests | ✅ 76 lint, strict tsc clean |
| `pnpm run build` | ✅ | ✅ |
| `turbo.json` parses and resolves | ✅ dry run | n/a |
| CI YAML valid, pnpm steps ordered correctly | ✅ | ✅ |
| `pnpm audit` runs | ✅ | ✅ |
| `cdxgen -t pnpm` produces CycloneDX | ✅ 1 MB, spec 1.6 | ✅ |
| **Phantom dependency fails the build before declaration** | n/a | ✅ **demonstrated** |

Baselines unchanged at 149 / 523 and 76 — deleting the chatbot removed no baselined findings.

### A Windows path-length obstacle worth recording

The first marketing worktree, created under the session scratchpad, failed
`pnpm install` with `ELIFECYCLE -4058`. pnpm's isolated layout nests packages under
`.pnpm/<name>@<version>/node_modules/...`, and combined with a ~130-character base path that
exceeds Windows' 260-character `MAX_PATH`.

Re-running from a short path (`C:\rm-u5`) succeeded in 51 seconds. **This is an environment
artifact, not a pnpm problem**, but it is worth knowing before U6 moves everything a directory
deeper: the repository already sits at
`C:\Users\Toton\Desktop\Remonta\remontamarketplace`, and `apps/app/` adds nine more characters to
every path. If installs start failing after U6, this is the first thing to check —
`git config --system core.longpaths true` is the usual remedy.

---

## 7. Production Safety

| Invariant | Status |
|---|---|
| **PS-1** Both apps build and deploy | ✅ both verified locally |
| **PS-2** Preview-verified | ✅ **VERIFIED 2026-09-22** — dashboard loaded on preview; see Addendum |
| **PS-3** Single `git revert` | ✅ restores `package-lock.json`; Vercel reverts to npm on the next build |
| **PS-4** Additive before subtractive | ⚠️ Partial — `package-lock.json` deleted as `pnpm-lock.yaml` arrives. Keeping both would make Vercel's package-manager detection ambiguous, which is worse. |
| **PS-5** No destructive DB change | ✅ N/A |
| **PS-6** Not both structure and behaviour | ⚠️ **Exception taken** — D1=B deleted a dead admin component. Its render was already commented out, so no user-visible behaviour changed. |
| **PS-7** Integrations disabled before removal | ✅ N/A |

**Vercel switches to pnpm on the next deploy.** A resolution failure fails the build, and Vercel
never promotes a failed build — so the failure mode here is a failed deploy, not broken
production.

---

## 8. Follow-ups

| Item | Where |
|---|---|
| `/api/admin/chat` is orphaned — nothing calls it | New — decide whether to remove |
| `@auth/core` / Nodemailer peer conflict | **U13** resolves it |
| Windows `MAX_PATH` may bite once paths deepen | **U6** — watch for it |
| Turborepo caching cannot be exercised until packages exist | **U6/U7** |
| `pnpm audit` count differs from `npm audit` | Recorded above; audit remains report-only |

---

# Addendum — 2026-09-22: Vercel Deployment Failure and D4 Reversal

U5 was recorded complete on 2026-09-10 but had **never been deployed**. The AI-DLC commits
were not merged to `origin/app/main`, so Vercel had never built under pnpm. Opening the pull
request on 2026-09-22 exercised that path for the first time, and **both Vercel deployments
failed**.

## What Failed, and How It Was Narrowed

CI passed throughout — `pnpm install --frozen-lockfile` works on Node 20.x and 22.x. But
`ci.yml` deliberately does not build, leaving Vercel as the only thing that does. Local builds
from a clean `pnpm install` succeeded in every configuration tried, so the failure could not be
reproduced off-platform.

Narrowed by elimination across five preview deployments:

| Branch | `vercel.json` | Linker | Prisma output | Result |
|---|---|---|---|---|
| `u5-pnpm` | original, 3 globs | isolated | node_modules | ❌ |
| `u5-test-nomono` | original | isolated | node_modules | ❌ |
| `u5-test-nofn` | `src/generated/**` | isolated | node_modules | ❌ |
| `u5-fix-output` | `src/generated/**` | isolated | **src/generated** | ❌ |
| `u5-fix-hoisted` | original | **hoisted** | node_modules | ✅ |

Every failure reported "The deployment failed because of an internal Vercel error" with an
**empty build log**. `u5-test-nomono` ruled out `turbo.json` and `pnpm-workspace.yaml`.
`u5-test-nofn` ruled out Next's own file tracing being sufficient.

**The linker is the only variable that changes the outcome.**

## A Theory That Was Wrong, Recorded Because It Was Acted On

The working hypothesis was that `vercel.json`'s `includeFiles` globs
(`node_modules/@prisma/client/**`, `node_modules/.prisma/**`) cannot reach the Prisma engine
under pnpm, which places it at
`node_modules/.pnpm/@prisma+client@<hash>/node_modules/.prisma/client/`.

**That part is true and was measured.** On a clean pnpm install, root `.prisma` does not exist
and `@prisma/client` is a symlink. The `node_modules/.prisma` directory on the development
machine is dated **2026-03-05**, six months before the migration — an npm-era leftover that made
the local tree look correct and hid the discrepancy.

**But it is not the cause.** `u5-fix-output` gave `prisma/schema.prisma` an explicit
`output = "../src/generated/client"`, matching what `auth-schema.prisma` already does, putting
the engine in the source tree where `includeFiles` reaches it — **and it still failed**. That
falsified the theory. It was reverted.

A secondary possibility for that specific failure: `src/generated` would have held ~82 MB across
both clients, and `includeFiles` injects it into every function, which could independently exceed
function size limits. Not investigated further, since the branch was abandoned.

**The root cause inside Vercel is not established.** Only the boundary is.

Also tried and rejected: `public-hoist-pattern[]=*prisma*` does **not** work, because
`@prisma/client` is a direct dependency, which pnpm links at the root regardless of hoist
patterns.

## The Fix, and What It Costs

`.npmrc` gains `node-linker=hoisted`, **reversing D4=A**.

Hoisting restores npm-like flat resolution. The two phantom dependencies U5 found are already
declared, so nothing regresses today — but the guard against new ones is gone, **including
through U6 and U7**, the units that move code between package boundaries and therefore the
window where phantom dependencies are most likely to appear.

During U6 and U7: treat any dependency error with extra suspicion. pnpm will no longer raise it.

Removing the line requires the Vercel failure actually understood — a support ticket carrying the
failing deployment IDs, since the build log is empty and local reproduction succeeds. **Tracked
for U8.**

## Production Safety, Restated

| Invariant | Status |
|---|---|
| **PS-1** Both apps build and deploy | ✅ both Vercel deployments green on `u5-pnpm` |
| **PS-2** Preview-verified | ✅ **VERIFIED 2026-09-22** — dashboard loaded on the preview, database-backed, no errors |
| **PS-3** Single `git revert` | ✅ unchanged |

**Production was never touched.** Vercel does not promote a failed build, so every failure above
was a failed preview. The npm-built deployment served throughout.

## Process Note

The failure was found on a preview branch because the push was deliberately routed to
`u5-pnpm` rather than to `app/main`. Had U5 been pushed to the production branch as originally
planned, this would have been a failed production deploy instead.
