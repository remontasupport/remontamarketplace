# U5 — Prisma / Vercel Linker Decision

**Raised**: 2026-09-22
**Status**: BLOCKING — U5 cannot merge until this is answered
**Context**: the pnpm migration deploys correctly only after changing how the Prisma
client is resolved. Two fixes work. They differ in what they cost, and the cost lands
on U6 and U7 rather than on U5.

---

## What Was Measured

Not inferred — each of these came from a clean `pnpm install --frozen-lockfile` in an
isolated worktree, and from four preview deployments on GitHub.

| Observation | Result |
|---|---|
| `pnpm install` on Vercel | **works** — CI proved it on Node 20.x and 22.x |
| `next build` locally, clean pnpm install | **succeeds** — every route compiled |
| Vercel deploy of `u5-pnpm` | **fails** — "internal Vercel error", no error in the build log |
| Vercel deploy of `u5-test-nomono` (no `turbo.json`, no `pnpm-workspace.yaml`) | **fails** — monorepo signals ruled out |
| Vercel deploy of `u5-test-nofn` (`includeFiles` → `src/generated/**` only) | **fails** — Next's own file tracing is not sufficient |
| Vercel deploy of `u5-fix-hoisted` (`node-linker=hoisted`) | **succeeds** |

### The mechanism

`vercel.json` bundles the Prisma engine through two globs:

```json
"includeFiles": "{src/generated/**,node_modules/@prisma/client/**,node_modules/.prisma/**}"
```

Under pnpm's isolated linker the Linux engine Vercel needs sits at:

```
node_modules/.pnpm/@prisma+client@6.19.1_prisma@6.19.1_typescript@5.9.3__typescript@5.9.3/
  node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node
```

`node_modules/.prisma` does not exist at the root, and `node_modules/@prisma/client` is a
symlink. Neither glob reaches the engine.

`public-hoist-pattern[]=*prisma*` was tried first and does **not** work: `@prisma/client`
is a direct dependency, which pnpm links at the root regardless of hoist patterns.

**A note on why this was invisible until now**: the `node_modules/.prisma` directory on the
development machine is dated **2026-03-05**, six months before the migration. It is an
npm-era leftover that pnpm never removed, and it made the local tree look correct.

---

## Question 1

How should the Prisma engine be made reachable on Vercel?

A) **`node-linker=hoisted` in `.npmrc`** — proven working (branch `u5-fix-hoisted`).
One line, trivially reversible, no repository growth, unblocks U5 today.
**Cost**: reverses decision D4=A. pnpm returns to npm-like flat resolution, so a future
undeclared dependency silently works again instead of failing the build. The two phantom
dependencies U5 found are already declared, so nothing regresses today — but the guard
against new ones is gone until U8 removes the need for this line.
**The risk this creates**: U7 extracts `packages/config` and `packages/schemas`, and U6/U7
move code between packages. Moving code is exactly when undeclared dependencies surface.
This option removes that detection during the window where it is most valuable.

B) **Give `prisma/schema.prisma` an explicit `output` under `src/generated`** — the same
thing `prisma/auth-schema.prisma` already does. The engine is then generated into the
source tree and bundled by the `src/generated/**` glob already present in `vercel.json`;
no `node_modules` path is involved and pnpm strictness (D4=A) is fully preserved.
**Scope**: smaller than it sounds — exactly **one** import site in the whole codebase,
`src/lib/prisma.ts:10`, plus the generator block.
**Costs**: (1) **unproven on Vercel** — needs one more preview deploy to confirm, roughly
three minutes; (2) adds roughly **40 MB** of engine binaries to the repository, matching
what `src/generated/auth-client` already carries (17 MB Linux + 21 MB Windows).

C) **Take A now to unblock U5, and commit to doing B during U8** — U8 is already scoped as
the Prisma relocation unit. The `.npmrc` line is deleted there and strictness returns.
**Cost**: U6 and U7 run without phantom-dependency detection, which is the window where it
matters most.

X) Other (please describe after [Answer]: tag below)

[Answer]: I'll take your recommendation

---

## Recommendation

**B**, with **C** as the pragmatic fallback if repository size is a concern.

The reasoning: A and C both give up the detection precisely during U6 and U7, which are the
units that move code between package boundaries — the exact conditions that produce phantom
dependencies. U5 already demonstrated this is not theoretical; it caught two real ones on its
first attempt, one of them live code rendering newsroom articles.

B costs one more preview deploy and 40 MB, and it is the configuration this project already
uses for its other schema. It ends with no `node_modules` path in the deployment at all,
which is a better place to be standing when U6 changes the Vercel Root Directory.

The argument against B is repository weight, and it is a fair one — 40 MB of committed
binaries is real, and it is why this is being asked rather than decided.

---

## Note (not a question)

`src/generated/auth-client/query_engine-windows.dll.node.tmp18904` (21 MB) exists in the
working tree but is **not tracked by git** — verified with `git ls-files`. It is a local
leftover from an interrupted `prisma generate`, harmless, and safe to delete locally at any
time. It does not affect the repository or any deployment.
