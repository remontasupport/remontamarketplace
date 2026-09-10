# U1 — Type-Error Baseline: Code Generation Plan

**Stage**: CONSTRUCTION — Code Generation (Part 1: Planning)
**Unit**: U1 — Type-Error Baseline
**Date**: 2026-09-10
**Status**: APPROVED 2026-09-10. Steps 1-8, 10 COMPLETE on `app/main`. Step 9 (marketing) DEFERRED — requires committing app/main first.

**This plan is the single source of truth for U1 code generation.**

---

## 1. Per-Unit Stage Assessment

The execution plan marks the per-unit design stages as EXECUTE, applied selectively. For U1:

| Stage | Decision | Rationale |
|---|---|---|
| **Functional Design** | **SKIP** | U1 contains no business logic, no data model and **no behaviour change whatsoever**. It is build configuration and tooling. The execution plan's own criterion — "skip for units where behaviour is unchanged" — applies exactly. |
| **NFR Requirements** | **SKIP** | No new NFRs arise. NFR-5 (testability) and NFR-6 (maintainability) already state what this unit serves. The tech stack is determined — TypeScript and ESLint are present. No performance, security or scalability requirement is introduced. |
| **NFR Design** | **SKIP** | NFR Requirements skipped, so there are no new patterns to design. |
| **Infrastructure Design** | **SKIP** | No deployment architecture, cloud resource or networking change. `next.config.ts` is touched, but only to annotate existing flags — no infrastructure mapping is implied. |
| **Code Generation** | **EXECUTE** | Always. |

If you would rather any of these four ran anyway, say so before approving.

---

## 2. Two Findings That Change This Unit

### Finding 1 — U1 as originally scoped is not achievable

`unit-of-work.md` specifies that U1 *"remove `typescript.ignoreBuildErrors` and
`eslint.ignoreDuringBuilds`"* **and** *"generate a baseline file recording the 149 known errors"*.

**Those two instructions contradict each other.** `next build` runs its own type and lint checks
and knows nothing about a baseline file. Removing the flags makes every build fail immediately:

| Check | Current count | Effect of removing the flag |
|---|---|---|
| TypeScript | **149 errors** | Every `next build` fails |
| ESLint | **1,256 errors**, 2,220 warnings | Every `next build` fails |

Measured on `app/main` at `c541580` on 2026-09-10.

**Corrected approach**: the suppression flags **stay** in U1, annotated with why and with explicit
removal criteria. The gate comes from **separate baseline-aware scripts enforced in CI** (U3), not
from `next build`. A developer cannot introduce a new error, because CI compares against the
baseline — which is what FR-6.2 actually asks for. The flags come out in a later unit when the
baselines reach zero.

**Requirement impact**: FR-6.1 as written ("suppression removed from both configs") **is not
achievable in this migration** without first fixing 149 type errors and 523 lint errors, which is
a project in itself. It should be re-scoped:

- **FR-6.1a** *(U1)* — baseline-aware gates in place; suppressions retained with documented removal criteria
- **FR-6.1b** *(future, out of scope)* — suppressions removed once both baselines reach zero

**This re-scoping needs your confirmation** — it is a change to an approved requirement, not a
detail.

### Finding 2 — 75% of the lint noise is generated code

`eslint.config.mjs` ignores `node_modules`, `.next`, `out`, `build` and `next-env.d.ts` — but
**not `src/generated/**`**, which holds the committed Prisma client.

| Scope | Problems | Errors | Warnings |
|---|---|---|---|
| As configured today | 3,476 | 1,256 | 2,220 |
| Excluding `src/generated/**` | **878** | **523** | **355** |
| **Noise from generated code** | **2,598 (75%)** | 733 | 1,865 |

The tell-tale rules confirm it: `no-unused-expressions` (1,473) and `no-this-alias` (219) are
signatures of machine-generated code, not hand-written source.

**One ignore pattern removes three-quarters of the backlog** and makes the remainder meaningful.
TypeScript is unaffected — none of the 149 errors are in generated code.

---

## 3. Unit Context

- **Unit**: U1 — Type-Error Baseline
- **Phase**: A (Safety Net)
- **Depends on**: nothing — this is the first unit
- **Blocks**: U2 (test frameworks)
- **Traces to**: FR-6.1 *(re-scoped, see above)*, FR-6.2, TD-3
- **Production risk**: **none.** No runtime code is modified. `next.config.ts` changes are comments only.
- **Applies to**: both products — but they are still separate branches until U6, so U1 lands twice.

### Marketing-side difference

`main`'s `next.config.ts` has `eslint.ignoreDuringBuilds: true` but **no**
`typescript.ignoreBuildErrors`. **Marketing already type-checks on every build.** So U1 on the
marketing branch is ESLint work only, and its TypeScript position is already where the app is
trying to get to.

### Files in scope

| File | Branch | Action |
|---|---|---|
| `eslint.config.mjs` | `app/main` | Modify — add `src/generated/**` to ignores |
| `next.config.ts` | `app/main` | Modify — annotate the two suppression flags |
| `package.json` | `app/main` | Modify — add four scripts |
| `scripts/check-baseline.mjs` | `app/main` | Create |
| `.quality-baseline/typescript.txt` | `app/main` | Create |
| `.quality-baseline/eslint.txt` | `app/main` | Create |
| `eslint.config.mjs` | `main` | Modify — same ignore |
| `next.config.ts` | `main` | Modify — annotate ESLint flag |
| `package.json`, baseline files, script | `main` | Create — ESLint only |

**No file under `src/` is modified.** No application code changes in this unit.

---

## 4. Generation Steps

### Step 1 — Exclude generated code from linting
- [x] Add `"src/generated/**"` to the `ignores` array in `eslint.config.mjs`
- [x] Re-run ESLint and confirm the count drops from 3,476 to ~878
- **Traces to**: Finding 2

### Step 2 — Create the baseline comparison script
- [x] Create `scripts/check-baseline.mjs`
- [x] Accepts `--tool=typescript|eslint` and `--update`
- [x] Runs the relevant tool, normalises each finding to a stable signature (`file:rule` for ESLint, `file:code` for TypeScript — **deliberately excluding line and column numbers** so that unrelated edits shifting line positions do not produce false failures)
- [x] Compares against the stored baseline; exits non-zero **only** on signatures absent from it
- [x] Reports newly-fixed findings so the baseline can be tightened
- **Traces to**: FR-6.2

### Step 3 — Capture the TypeScript baseline
- [x] Run `node scripts/check-baseline.mjs --tool=typescript --update`
- [x] Creates `.quality-baseline/typescript.txt` with the 149 known errors
- [ ] Commit the baseline (deferred — commits not authorised)
- **Traces to**: FR-6.2, D-16

### Step 4 — Capture the ESLint baseline
- [x] Run `node scripts/check-baseline.mjs --tool=eslint --update` (after Step 1)
- [x] Creates `.quality-baseline/eslint.txt` with the ~523 remaining errors
- [x] Warnings recorded separately and **not** gated initially
- **Traces to**: FR-6.2

### Step 5 — Add npm scripts
- [x] `type-check` → `tsc --noEmit`
- [x] `type-check:baseline` → `node scripts/check-baseline.mjs --tool=typescript`
- [x] `lint:baseline` → `node scripts/check-baseline.mjs --tool=eslint`
- [x] `quality` → runs both baseline checks (the single command CI will call in U3)
- **Traces to**: FR-6.2, FR-6.3

### Step 6 — Annotate the suppression flags
- [x] In `next.config.ts`, add a comment above `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` recording: why they remain, that the real gate is `pnpm quality` in CI, the current baseline counts, and the condition for removal (baseline reaches zero)
- [x] **Do not remove the flags** — see Finding 1
- **Traces to**: FR-6.1a

### Step 7 — Verify the gate actually gates
- [x] Introduce a deliberate type error in a scratch file → `type-check:baseline` **fails**
- [x] Remove it → passes
- [x] Introduce a deliberate lint error → `lint:baseline` **fails**
- [x] Remove it → passes
- [x] Confirm the 149 + 523 existing findings do **not** fail the check
- **Exit criterion for the unit**

### Step 8 — Verify the build is unaffected
- [x] `npm run build` succeeds exactly as before
- [x] No file under `src/` differs
- **Traces to**: PS-1

### Step 9 — Apply to the marketing branch
- [ ] **DEFERRED** Branch from `main`; apply Steps 1–8, **ESLint only** (marketing has no TypeScript suppression)
- [ ] Capture marketing's own ESLint baseline
- [ ] Verify marketing builds
- **Note**: marketing already type-checks, so no TypeScript baseline is needed there

### Step 10 — Documentation
- [x] Write `aidlc-docs/construction/U1/code/U1-summary.md` — what changed, measured before/after counts, how the baseline works, how to update it, and the criteria for removing the suppression flags
- [x] Record the FR-6.1 re-scoping outcome

---

## 5. Production-Safety Protocol (PS-1..PS-7)

| Invariant | How U1 satisfies it |
|---|---|
| **PS-1** Both apps build and deploy | Step 8 verifies the app build; Step 9 verifies marketing |
| **PS-2** Preview-verified | Preview deployment plus k6 smoke, per the standing protocol |
| **PS-3** Single `git revert` | Only config, scripts and two new baseline files. Nothing to unwind. |
| **PS-4** Additive before subtractive | Nothing is removed. Flags stay; scripts are added. |
| **PS-5** No destructive DB change | **N/A** — no database interaction |
| **PS-6** Not both structure and behaviour | **Neither.** No structural move, no behaviour change. |
| **PS-7** Integrations disabled before removal | **N/A** — no integrations touched |

**Deploy-time risk: none.** The runtime bundle is byte-identical apart from comments in
`next.config.ts`.

---

## 6. Extension Compliance

| Extension | Applicable rules | Status |
|---|---|---|
| SECURITY | SECURITY-10 (supply chain — lock file, scanning) | **Partial** — lock file exists; scanning arrives in U3. Not blocking here. |
| RESILIENCY | None applicable to a tooling unit | **N/A** |
| PBT | PBT-09, PBT-10 (framework selection, complementary strategy) | **N/A for U1** — delivered in U2 |

**No blocking findings for U1.**

---

## 7. Summary

**10 steps, one unit, zero production risk.**

- **Modified**: `eslint.config.mjs`, `next.config.ts`, `package.json` — on both branches
- **Created**: one script, two baseline files — on both branches
- **Not touched**: anything under `src/`

**Two decisions need your confirmation before generation:**

1. **FR-6.1 re-scoped** into FR-6.1a (baseline gates now) and FR-6.1b (flag removal, out of scope). The requirement as written cannot be met without first fixing 149 type errors and 523 lint errors.
2. **The suppression flags stay** in `next.config.ts` for now, annotated rather than removed.

**Estimated scope**: ~1 week, dominated by writing and proving the baseline script rather than by
the config changes themselves.
