# U7 — `packages/config`, `packages/schemas`: Implementation Summary

**Unit**: U7 (Phase B — Workspace)
**Date**: 2026-09-23
**Decisions**: Q1=B (full scope), Q2=A (re-export shims), **Q3=C (mobile deferred)**, Q4=A (ESLint boundaries), Q5=A (Tailwind theme deferred to U12)
**Status**: Code complete, preview-verified. Branch `u7/packages`, commit `a52c789`. Awaiting merge.

---

## 1. What Exists Now

```
packages/
├── config/                       @remonta/config
│   ├── tsconfig.base.json        framework-neutral — no dom, no jsx, no next
│   ├── tsconfig.next.json        the two apps extend this
│   ├── eslint.base.mjs           shared ignores
│   ├── eslint.boundaries.mjs     P-1 .. P-5
│   └── prettier.config.mjs       defined, deliberately not applied
└── schemas/                      @remonta/schemas — zod is its ONLY dependency
    └── src/
        ├── schema/       5 files    form and API input schemas
        ├── types/        5 files    domain enums and entity interfaces
        ├── validations/  1 file     contractor
        ├── data/         1 file     australianPostcodes
        └── index.ts      barrel
```

`turbo ls` → **4 packages**: `@remonta/app`, `@remonta/web`, `@remonta/config`, `@remonta/schemas`.

### Why `tsconfig.base.json` is framework-neutral

`packages/schemas` extends it. If the base carried `lib: ["dom"]`, `jsx` or the Next plugin, the
package would inherit exactly what **P-5** forbids. Splitting Next-specific options into
`tsconfig.next.json` is what lets one base serve both a framework-free package and two Next apps.

---

## 2. Duplication Removed

All three were **byte-identical** across both apps — verified by hash before the move:

| File | Before | After |
|---|---|---|
| `australianPostcodes.ts` | 285 lines × 2 | one copy + 4-line shims |
| `validations/contractor.ts` | 89 lines × 2 | one copy + 4-line shims |
| `types/index.ts` | 61 / 59 lines | one copy + 4-line shims |

**433 lines of duplication eliminated.** The third row differed by exactly two lines — the app's
version re-exports `./serviceRequest`, which web lacked because the file did not exist there. A
clean superset, so reconciliation was a read rather than a merge.

---

## 3. What Stayed Behind, and Why

`src/types/next-auth.d.ts` remains in `apps/app`. It augments the `next-auth` and `next-auth/jwt`
modules, and a NextAuth module augmentation cannot live in a package that forbids Next. Checked
every candidate before moving: **12 of 13 clean, this one structurally excluded.**

---

## 4. The Boundary Check Was Proven, Not Assumed

The exit criterion was that a deliberate violation fails. It was tested for real:

```
apps/web importing '@remonta/db'
  → error  P-1: apps/web must not import @remonta/db. Marketing holds no database
           access (D-35) — it reads worker data over HTTP via @remonta/api-client.

packages/schemas importing 'next/headers' and '@prisma/client'
  → error  P-5: packages/schemas must not import Next. It is the contract Expo
           consumes — a Next import makes it unusable from React Native.
  → error  P-5: ...must not import Prisma. Schemas describe the API contract, not
           the database shape.
```

Both probes deleted afterwards. Each rule carries its reason in the error message, so a developer
who trips it learns *why* rather than how to silence it.

**Wired into both CI workflows** as a `Package boundaries` step. The app quality gates do not reach
the packages, so without it the rules would exist and never run — worse than not having them,
because it would look enforced.

### What it catches and what it does not

Catches a **direct** import of a forbidden package. Does **not** catch a transitive reach —
`apps/web` importing something that itself imports `db`. Manifest omission is the defence there,
which is why `component-dependency.md` lists both for every rule. Neither alone is sufficient.

---

## 5. Three Things This Surfaced

None were planned. All three are the kind of problem that only appears when a boundary is drawn.

### 5.1 An incomplete `exports` map — caught by the baseline

`package.json` declared `"./types"` but not `"./types/*"`, so `@remonta/schemas/types/auth` did not
resolve and every shim built on it **exported nothing**. The type baseline caught it immediately as
**75 new errors**, all variants of *"has no exported member 'UserRole'"*.

Worth noting what saved it: not the build, which would have failed later and less clearly, but
U1's baseline gate — built five units ago for exactly this.

### 5.2 P-5 was silently unenforceable — caught by testing the test

`packages/schemas/eslint.config.mjs` had no TypeScript parser. ESLint fell back to `espree`, which
cannot parse `import type`, so the probe returned:

```
Parsing error: Unexpected token {
```

**A config that cannot parse the files it guards enforces nothing**, while still exiting 0 on
everything it skips. Had the probe not been run, U7 would have shipped a boundary rule that never
fired — and nobody would have learned that until a Next import reached `packages/schemas` and broke
the future mobile client.

Found only because the exit criterion demanded a *deliberate violation* rather than an assertion
that the rule existed.

### 5.3 Two definitions of the same names — caught by flattening

```
formatZodErrors           — defined in BOTH registrationSchema and serviceRequestSchema
CreateServiceRequestInput — defined in BOTH types/serviceRequest and serviceRequestSchema
```

Harmless while they sat in separate files under one app; a compile error (TS2308) once flattened
into one namespace. The package boundary doing its job on its first day.

`serviceRequestSchema` is excluded from the root barrel and reachable at its subpath. **Resolving
the duplication means choosing a canonical definition and deleting the other — a behaviour change,
and not U7's to make (PS-6).** Recorded as a follow-up.

---

## 6. Baseline Update — Paths Only

Seven signatures moved from `src/schema/*` to `../../packages/schemas/src/schema/*`. Verified
against the old entries before regenerating:

| Signature | Old count | New count |
|---|---|---|
| `clientFormSchema.ts::TS2769` | 3 | 3 |
| `registrationSchema.ts::TS2339 / TS2769 / TS7006` | 1 / 2 / 1 | 1 / 2 / 1 |
| `workerProfileSchema.ts::TS2322 / TS2353 / TS2769` | 2 / 2 / 4 | 2 / 2 / 4 |

Same codes, same counts, only the paths changed. Total unchanged at **149 across 70 signatures**.
No new debt was baselined.

ESLint moved 523 → **518**: five findings left with the files. The gate fails only on *new*
findings, so fewer is fine.

---

## 7. `packages/schemas` Gate Is Lint-Only, On Purpose

The 15 pre-existing type errors in the moved schema files are **already tracked** in
`apps/app/.quality-baseline/typescript.txt`, recorded as `../../packages/schemas/src/schema/*` —
`apps/app` type-checks this package through its imports.

A second strict `tsc` in the package would either fail on errors already accounted for, or need a
duplicate baseline to keep in sync with the first. The job this gate exists to do is enforce
P-1..P-5, and lint does that.

---

## 8. Production Safety

| Invariant | Status |
|---|---|
| **PS-1** Both apps deployable | ✅ `turbo run build` 2 of 2 |
| **PS-2** Preview-verified | ✅ sign-in, dashboard, **and a form** — plus marketing homepage and newsroom |
| **PS-3** Single `git revert` | ✅ shims mean no call site changed |
| **PS-4** Additive before subtractive | ✅ old locations still resolve |
| **PS-5** No destructive DB change | ✅ N/A |
| **PS-6** Not both structure and behaviour | ✅ Tailwind theme deferred (Q5=A); name duplication left unresolved |
| **PS-7** Integrations disabled before removal | ✅ N/A |

The form check is the one that mattered. Sign-in and dashboards exercise auth and the database —
neither touches what U7 changed. Every Zod schema now resolves through a shim, and only running a
form proves that resolves at runtime rather than merely compiling.

---

## 9. Deferred

**`apps/mobile` (Q3=C)** — not a priority. No dependents, so nothing else is affected. **FR-1.4**
is reassigned to whichever unit creates it. The **P-3** rule is written into the shared config and
sits inert, so mobile later arrives into an already-enforced boundary.

`packages/schemas` keeps its P-5 constraint regardless — it exists *because* Expo will consume the
package, and relaxing it now would only make the later work harder.

**Tailwind theme (Q5=A)** — deferred to U12, where the visual reconciliation happens.

---

## 10. Follow-ups

| Item | Where |
|---|---|
| `formatZodErrors` / `CreateServiceRequestInput` duplicate definitions | Needs a canonical choice — behaviour change |
| Prettier defined but not applied | Run repo-wide as its own commit |
| `apps/mobile` + FR-1.4 | A later unit |
| Windows `EPERM` on `prisma generate` — two apps race the shared engine | Needs a root script; local-only, Vercel unaffected |
| Remaining from U6 | `node-linker=hoisted` (U8), Sanity preview CORS, Turborepo cache 0 of 2 |
