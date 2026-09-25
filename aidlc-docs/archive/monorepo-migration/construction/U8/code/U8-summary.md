# U8 — `packages/db`: Prisma Relocation — Implementation Summary

**Unit**: U8 (Phase C — Data and domain) — **the R-5 unit**
**Date**: 2026-09-23
**Decisions**: Q1=A (schema moves, generation stays), Q2=B (keep `node-linker=hoisted`), Q3=A (delete the five dead models), Q4=A (leave `apps/web` alone)
**Status**: Code complete, preview-verified. Branch `u8/packages-db`, head `8786804`. Awaiting merge.

---

## 1. What Moved

```
apps/app/prisma/auth-schema.prisma  →  packages/db/prisma/schema.prisma   (24 models)
apps/app/prisma/migrations/         →  packages/db/prisma/migrations/     (7 migrations)
```

`turbo ls` → **5 packages**: `app`, `web`, `config`, `schemas`, `db`.

---

## 2. What Did Not Move, and the Constraint That Decided It

Prisma still generates into `apps/app/src/generated/auth-client`.

**Vercel resolves `vercel.json`'s `includeFiles` relative to the project Root Directory**, which
for the application is `apps/app`. A path of `../../packages/db/**` lies outside it and cannot be
addressed. The generated client is **~124 MB** including the `rhel-openssl-3.0.x` engine, and U5
established across **five consecutive failed deployments** that this platform fails at Prisma
bundling with an empty build log and an "internal Vercel error" — root cause never established.

So the schema moved and the artifact stayed. The reasoning is written into the schema's generator
block, where anyone changing it will read it first.

### The consequence, stated rather than hidden

With the artifact in `apps/app`, **`packages/db` cannot export a client without importing from its
own consumer.** That is a cycle, and a worse problem than the one it would solve.

So this package is **schema, migrations and CLI scripts only** — smaller than the design describes.
The client instantiation (pooling, singleton, Neon cold-start retry) stays in
`apps/app/src/lib/auth-prisma.ts`, where it already works. No shims were needed, because nothing
moved out from under any call site.

**U9 cannot defer this.** It builds the repository functions that belong here and that need the
client. `packages/db/README.md` records the three ways out — generate into both locations,
resolve the Vercel behaviour and move the artifact properly, or invert the dependency — and names
the second as the real fix. It needs the support ticket that has been open since U5.

---

## 3. A Gap I Introduced in U6 and Fixed Here

`apps/app/next.config.ts` read:

```ts
outputFileTracingIncludes: {
  '/**': ['./node_modules/@prisma/client/**/*', './src/generated/auth-client/**/*'],
},
```

U6 gave each schema an explicit `output`, after which the app resolves `@/generated/client` and
`@/generated/auth-client` and never reaches `node_modules` for either. So the first entry traced a
path the app does not use, and **`./src/generated/client/**/*` was missing entirely** — the main
client was never traced at all.

Production kept working because `vercel.json`'s `includeFiles: "src/generated/**"` covers both
wholesale. **A real gap sat behind a config that happened to be redundant.** Both clients are now
listed explicitly.

**Verified**: after the fix, **144 build traces** reference
`libquery_engine-rhel-openssl-3.0.x.so.node`.

---

## 4. Five Dead Models Deleted

`Document`, `Category`, `Subcategory`, `CategoryDocument`, `SubcategoryDocument` were declared in
**both** the legacy schema and `auth-schema`, and had **drifted**:

| Model | Legacy | Auth |
|---|---|---|
| Document | 16 lines | 14 |
| Category | 12 | 9 |
| Subcategory | 15 | 12 |
| CategoryDocument | 23 | 15 |
| SubcategoryDocument | 15 | 12 |

Two divergent definitions of the same tables. Verified before deleting that they form a **closed
subgraph** — zero references from the three surviving models — and that both routes using the
legacy client query **only `contractorProfile`**.

Legacy schema: **213 → 132 lines. No live table altered.**

---

## 5. Also Removed: 83 MB of Orphaned Client

`apps/web/src/generated/auth-client` — **56 tracked files, 83 MB, zero importers.** Its embedded
`sourceFilePath` still pointed at `C:\Users\toton\Desktop\Remonta\prisma\auth-schema.prisma`, a
location that has not existed since before the monorepo. Marketing's `prisma.ts` imports
`@/generated/client`.

Dead weight being committed and deployed. Found only while grepping for stale schema references
**after** a deploy failure — which is when that grep should have been run, not after.

---

## 6. Two Deploy Failures, Both Mine, Both the Same Shape

| Failure | Cause |
|---|---|
| `Could not load --schema from provided path prisma/auth-schema.prisma` | Updated `package.json`'s build script, missed that `vercel.json` carries its own `buildCommand` which **overrides** it |
| `should NOT have additional property //buildCommand` | Assumed `vercel.json` tolerated a `//` comment key because `turbo.json` does. It rejects **any** unknown property |

**Both passed locally and failed on Vercel.** `turbo run build` reads `package.json`; only Vercel
reads `vercel.json`, and only Vercel validates its schema. Nothing on the local side exercises that
file, so local verification was checking a different thing from what deploys.

This is the third time this shape has cost a cycle — `envMode` in U6, then these two.

**Follow-up worth doing**: a check that parses both `vercel.json` files against the known Vercel
key set and asserts each `buildCommand` matches its `package.json` build script. It would have
caught both in seconds, and it belongs in CI rather than in anyone's memory.

The warning now lives in `apps/app/package.json` as a `//build` key, which npm tolerates.

---

## 7. Environment Resolution

Prisma resolves `.env` relative to **where it runs**, and `.env` lives in `apps/app`. Running the
package's own scripts from `packages/db` fails with:

```
Error code: P1012
error: Environment variable not found: DIRECT_DATABASE_URL.
```

That is where the file is, not a misconfiguration. The app's `db:*` scripts therefore run from
`apps/app` with `--schema` pointing at the package. **The generator's `output` is relative to the
schema file, not the working directory**, so the client still lands correctly either way. CI and
deploy environments inject the variables, so the package scripts work there.

Documented in `packages/db/README.md` with the exact error it avoids.

---

## 8. Production Safety

| Invariant | Status |
|---|---|
| **PS-1** Both apps deployable | ✅ `turbo run build` 2 of 2; Vercel green |
| **PS-2** Preview-verified | ✅ **sign-in, dashboard and a form** — the check R-5 demands |
| **PS-3** Single `git revert` | ✅ no call site changed |
| **PS-4** Additive before subtractive | ✅ nothing moved out from under a consumer |
| **PS-5** No destructive DB change | ✅ **file relocation only; no live table altered** |
| **PS-6** Not both structure and behaviour | ✅ the deleted models were declarations nothing read |
| **PS-7** Integrations disabled before removal | ✅ N/A |

---

## 9. Verified

```
turbo ls        5 packages
app gate        149 type · 518 lint · 54 tests
web gate         76 lint · strict tsc clean
boundaries      P-1..P-5 pass
turbo build     2 successful, 2 total
rhel engine     144 traces
preview         sign-in · dashboard · form  ✅
```

---

## 10. Follow-ups

| Item | Note |
|---|---|
| **`packages/db` cannot export a client** | Blocks U9's repository placement. Needs the Vercel bundling question resolved — support ticket open since U5 |
| **`node-linker=hoisted`** | Q2=B deferred removal to its own unit. Phantom-dependency detection has now been off for U6, U7 and U8 |
| **`vercel.json` / `package.json` drift check** | Would have caught both of this unit's deploy failures |
| Windows `EPERM` on `prisma generate` | Two apps race the shared engine; needs a root script |
| Sanity preview CORS | From U6 |
| Turborepo cache still 0 of 2 | From U6 |
