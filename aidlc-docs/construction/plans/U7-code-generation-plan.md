# U7 — `packages/config`, `packages/schemas`, mobile stub: Code Generation Plan

**Unit**: U7 (Phase B — Workspace)
**Depends on**: U6 ✅ complete and verified
**Traces to**: ~~FR-1.4~~ (deferred with mobile), FR-3.2, FR-3.6, FR-9.1, FR-9.3, NFR-6.1, NFR-6.4, P-5
**Status**: **PART 2 — GENERATION.** Q1=B, Q2=A, Q3=C (mobile deferred), Q4=A, Q5=A.

---

## 1. Stage Assessment

| Stage | Decision | Reasoning |
|---|---|---|
| Functional Design | **SKIP** | No new business logic. U7 relocates existing schemas and types; the design already exists in `components.md` and `component-dependency.md`. |
| NFR Requirements | **SKIP** | Tech stack settled (D-07 Turborepo, D-08 pnpm). No new performance, security or scalability requirement. |
| NFR Design | **SKIP** | Follows from NFR Requirements being skipped. |
| Infrastructure Design | **SKIP** | No new Vercel projects, no deployment topology change. Packages are consumed at build time. |
| **Code Generation** | **EXECUTE** | Always. |

Same shape as U1–U6, and for the same reason: structural work against an already-approved design.

---

## 2. What Was Measured

Surveyed before planning, not assumed.

### P-5 compliance — which files may enter `packages/schemas`

`packages/schemas` must have **zero** Next, React, DOM or Prisma dependencies. Every candidate was
checked:

| Result | Files |
|---|---|
| ✅ Clean | 12 of 13 |
| ❌ Must stay in `apps/app` | `src/types/next-auth.d.ts` — augments `next-auth` and `next-auth/jwt` |

That exclusion is structural, not incidental: a NextAuth module augmentation cannot live in a
package that forbids Next.

### Duplication U7 eliminates

| File | Status |
|---|---|
| `src/lib/data/australianPostcodes.ts` | **byte-identical** in both apps — 285 lines duplicated |
| `src/lib/validations/contractor.ts` | **byte-identical** in both apps — 89 lines duplicated |
| `src/types/index.ts` | **differs** — app 61 lines, web 59 |

The third row is the one to watch. Two files that drifted apart cannot be merged mechanically.

### Scope size

- `apps/app`: `src/schema` 5 files, `src/types` 6, `src/lib/validations` 1 — **1,407 lines**
- `apps/web`: `src/types` 1 file, `src/lib/validations` 1
- `zod@^4.1.11` already declared in **both** apps — no new dependency needed
- Tailwind v4 CSS-first in both; **neither app has a `tailwind.config` file**

---

## 3. Questions

### Question 1 — How much moves into `packages/schemas` in U7?

A) **Shared-only** — the three files both apps use: `australianPostcodes.ts`, `contractor.ts`, and
a reconciled `types/index.ts`. Smallest possible change; proves the package mechanism with minimal
blast radius. The rest follows later.

B) **Full scope per the design** — all of `src/schema` (5), `src/types` minus `next-auth.d.ts` (5),
`src/lib/validations` (1), plus `australianPostcodes.ts`. Roughly 1,400 lines. Matches the U7
definition in `unit-of-work.md`, and leaves `packages/schemas` complete rather than half-done.

C) **Schemas only** — `src/schema/*` and validations; defer all types.

X) Other (please describe after [Answer]: tag below)

[Answer]: B — full scope per the design. AI recommendation accepted (user, 2026-09-23). Low risk because Q2=A means no call sites change.

---

### Question 2 — What happens to the old locations?

A) **Re-export shims** (T2=A, the approved decision). `apps/app/src/schema/registrationSchema.ts`
becomes a re-export from `@remonta/schemas`. Every existing import keeps working untouched, so this
unit changes no call sites and PS-4 holds. Shims are deleted in a later unit.

B) **Hard move** — update all import sites now. Cleaner end state, but it changes many files and
mixes relocation with call-site edits in one unit.

X) Other (please describe after [Answer]: tag below)

[Answer]: A — re-export shims (T2=A). AI recommendation accepted. Keeps PS-3 and PS-4 intact.

---

### Question 3 — How deep should the `apps/mobile` Expo stub go? ✅ ANSWERED

A) **Manifest only** — `package.json`, `tsconfig.json` extending `packages/config`, and a README
stating its purpose. Proves it participates in the workspace and the boundary rules; nothing runs.

B) **Runnable Expo scaffold** — `app.json`, `App.tsx`, entry point, so `expo start` opens a
placeholder in Expo Go. Bigger, and adds Expo and React Native to the lockfile.

C) **Skip mobile in U7**, add it when there is something to build.

X) Other (please describe after [Answer]: tag below)

[Answer]: C — deferred. "Not the priority" (user, 2026-09-23).

#### What deferring mobile costs, and what it does not

**Low cost.** The stub has no dependents: nothing imports `apps/mobile`, so omitting it changes
nothing about how the two live products build or deploy. It is the only part of U7 that could be
removed without touching anything else.

**What moves out of U7:**

| Item | Effect |
|---|---|
| **FR-1.4** (`apps/mobile` reserved for Expo) | Unmet in U7 — reassign to the unit that creates it |
| **P-3** (mobile must not import `db` or `domain-*`) | The rule is still *written* into the shared ESLint config so it is ready, but it guards nothing until the package exists |
| **D-37** (Expo chosen) | Unaffected — a recorded decision, not an artifact |

**What does not change.** `packages/schemas` still carries its **P-5** hard constraint — zero Next,
React, DOM or Prisma. That constraint exists *because* Expo will eventually consume the package,
and relaxing it now would make the later mobile work harder for no present gain. The contract is
built to be consumable whether or not a consumer exists yet.

**Worth stating plainly**: mobile was already scoped as structure-only (FR-1.4, D-29), and the
56 Server Actions remain the primary blocker for a working mobile client regardless (FR-9.2).
Deferring the stub does not move the mobile goal further away — that goal was always a separate
effort after this migration.

---

### Question 4 — How are the P-1..P-5 boundaries enforced?

The exit criterion is that **a deliberate violation fails CI**.

A) **ESLint flat config in `packages/config`** using `no-restricted-imports`, consumed by every app
and package. Matches AD-10/AD-11, which place the boundary rules in the shared ESLint config. One
mechanism, already wired into the existing lint gates.

B) **`dependency-cruiser`** as a separate CI step. More expressive for graph rules like P-4 (no
`domain-*` importing another `domain-*`), but a second tool and a second config.

C) **Manifest omission only** — no automated check. Weakest; does not satisfy the exit criterion.

X) Other (please describe after [Answer]: tag below)

[Answer]: A — ESLint flat config in packages/config. AI recommendation accepted. Matches AD-10/AD-11 and reuses the lint gate already in CI.

---

### Question 5 — Does `packages/config` include the shared Tailwind theme now?

Both apps run Tailwind v4 CSS-first and **neither has a `tailwind.config` file** — theming lives in
CSS. AD-14/D-13 require visual parity between the two products.

A) **Defer the theme to U12** (`packages/ui`), where the visual reconciliation actually happens.
U7's `packages/config` ships tsconfig bases, ESLint and Prettier only. Keeps U7 structural.

B) **Include a shared theme now** — extract common CSS custom properties into `packages/config`
and import from both apps. Earlier parity, but it touches styling, which is visible behaviour, in
a unit otherwise free of it (PS-6 argues against).

X) Other (please describe after [Answer]: tag below)

[Answer]: A — defer the Tailwind theme to U12. AI recommendation accepted. Keeps U7 structural; PS-6 holds.

---

## 4. Execution Steps (Part 2 — after answers)

Checkboxes ticked as work completes, in the same interaction as the work.

### Step 1 — `packages/config`
- [x] `package.json` as `@remonta/config`, private, no runtime dependencies
- [x] `tsconfig.base.json` — plus `tsconfig.next.json`; the two app tsconfigs were byte-identical, so this was pure deduplication
- [x] Flat ESLint config including P-1..P-5 (`eslint.boundaries.mjs`)
- [x] Prettier config — defined, deliberately NOT applied repo-wide (a mass reformat inside a structural unit would violate PS-6)
- [x] Both apps extend it; baselines verified — 149 type / 518 lint (5 moved out with the files) / 76 web

### Step 2 — `packages/schemas`
- [x] `package.json` as `@remonta/schemas`, `zod` its only runtime dependency
- [x] 12 files moved; `next-auth.d.ts` stayed in `apps/app` as P-5 requires
- [x] Reconciled — the difference was exactly two lines; the app version is a clean superset
- [x] Deduplicated — 285→4, 89→4, 59→4 lines. 433 lines of byte-identical duplication removed
- [x] Shims at every old location; **no call site changed**
- [x] Verified — `zod` is the only runtime dependency, and P-5 rejects the rest

### Step 3 — `apps/mobile` — **DEFERRED (Q3=C)**
- [x] **Not done in U7.** No dependents, so nothing else is affected.
- [x] The **P-3** rule is still written into the shared ESLint config, inert until the package
      exists — so mobile arrives into an already-enforced boundary rather than needing one added
- [x] **FR-1.4 reassigned** — record against the unit that creates `apps/mobile`

### Step 4 — Boundary check in CI
- [x] Implemented as ESLint `no-restricted-imports` in `packages/config`
- [x] **Proven** — `@remonta/db` from `apps/web` rejected (P-1); `next/headers` and `@prisma/client` from `packages/schemas` rejected (P-5). Both reverted.
- [x] Wired into both workflows as a `Package boundaries` step — the app gate does not reach the packages

### Step 5 — Verification
- [x] `turbo ls` reports **4** packages
- [x] Gates: app 149/518/54, web 76 + strict `tsc` clean
- [x] `turbo run build` — 2 successful, 2 total
- [x] **Preview verified** — sign-in, dashboard, **and a form** (the U7-specific check: schema imports now resolve through the package). Marketing preview loads.
- [ ] Production verified after merge

### Step 6 — Documentation
- [x] `aidlc-docs/construction/U7/code/U7-summary.md`
- [x] `aidlc-state.md` updated

---

## 5. Production Safety

| Invariant | Assessment |
|---|---|
| **PS-1** Both apps deployable | Packages are build-time; apps keep building throughout |
| **PS-2** Preview-verified | Required before merge — U6's lesson is that a green build proves compilation, not runtime |
| **PS-3** Single `git revert` | Yes, if Q2=A — no call sites change |
| **PS-4** Additive before subtractive | Q2=A satisfies this; Q2=B partially violates it |
| **PS-5** No destructive DB change | N/A |
| **PS-6** Not both structure and behaviour | Holds if Q5=A; Q5=B introduces visible styling changes |
| **PS-7** Integrations disabled before removal | N/A |

---

## 6. Risk Carried In From U6

**`node-linker=hoisted` means pnpm no longer fails on undeclared dependencies.** U7 extracts the
first shared packages — exactly when phantom dependencies appear. A package that imports something
it does not declare will resolve through the hoisted root and work by accident.

U5 caught two real phantom dependencies before that guard was disabled, one of them live
newsroom-rendering code. **Verify each new package's manifest by reading it**, rather than trusting
that the build passed.

`.npmrc` records why hoisting is on and what removing it requires. Tracked for U8.
