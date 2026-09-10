# U1 — Type-Error Baseline: Implementation Summary

**Unit**: U1 (Phase A — Safety Net)
**Date**: 2026-09-10
**Branch**: `app/main`
**Status**: Steps 1–8 and 10 complete on `app/main`. **Step 9 (marketing branch) deferred** — see §6.

---

## 1. What Changed

| File | Action | Change |
|---|---|---|
| `eslint.config.mjs` | Modified | Added `src/generated/**` to `ignores` |
| `next.config.ts` | Modified | **Comments only** — annotated why the two suppressions remain and when they can go |
| `package.json` | Modified | Added `type-check`, `type-check:baseline`, `lint:baseline`, `quality` |
| `scripts/check-baseline.mjs` | Created | The baseline comparison gate |
| `.quality-baseline/typescript.txt` | Created | 149 errors, 70 signatures |
| `.quality-baseline/eslint.txt` | Created | 523 errors, 178 signatures |

**Nothing under `src/` was modified.** Verified with `git status --porcelain src/` — empty.

The runtime bundle is unchanged. The only edits to a file Next reads at build time are comments.

---

## 2. Measured Results

### ESLint — excluding generated code

| Scope | Problems | Errors | Warnings |
|---|---|---|---|
| Before | 3,476 | 1,256 | 2,220 |
| After | **878** | **523** | **355** |
| Removed | **2,598 (75%)** | 733 | 1,865 |

`eslint.config.mjs` had never excluded `src/generated/**`, where Prisma emits its client. That
client is committed so Vercel can bundle it, so ESLint was linting roughly 2,600 problems' worth of
machine-generated code. The dominant rules — `no-unused-expressions` (1,473) and `no-this-alias`
(219) — are code-generation artifacts, not defects.

**523 errors is the real hand-written backlog.** The earlier figure of 1,256 was misleading.

### TypeScript

149 errors across 70 signatures. Unchanged by this unit — none were in generated code.

| Location | Errors |
|---|---|
| `src/app/dashboard` | 37 |
| `src/app/api` | 30 |
| `src/components/pdf` | 20 |
| `src/schema` | 15 |
| `src/lib` | 14 |
| `src/components/dashboard` | 14 |
| `src/services/worker` | 8 |
| other | 11 |

The 22 in `src/lib` and `src/services/worker` are cleared first in **U10**, per D3=C, because that
code becomes `packages/domain-*` and `packages/db` — moving it with unresolved errors would
propagate them to every consumer.

---

## 3. Why the Suppression Flags Stayed

`unit-of-work.md` originally specified that U1 *remove* `typescript.ignoreBuildErrors` and
`eslint.ignoreDuringBuilds` **and** generate a baseline. **Those instructions contradict each
other**, and the contradiction was found while planning this unit.

`next build` runs its own type and lint checks. It has no knowledge of a baseline file. Removing
either flag fails every build immediately — 149 and 523 errors respectively.

**What was built instead**: the flags stay, annotated in place, and the gate moved to
`npm run quality`, which compares current findings against `.quality-baseline/` and fails only on
findings not already recorded. Existing debt is tolerated; new debt is rejected. That is what
FR-6.2 asks for.

**Requirement re-scoped** (approved by the user, 2026-09-10):

- **FR-6.1a** *(U1, done)* — baseline-aware gates in place; suppressions retained with documented removal criteria
- **FR-6.1b** *(out of scope)* — suppressions removed once both baselines reach zero

---

## 4. How the Gate Works

```bash
npm run quality              # both checks — this is what CI runs (U3)
npm run type-check:baseline  # TypeScript only
npm run lint:baseline        # ESLint only

node scripts/check-baseline.mjs --tool=typescript --update   # re-record
```

### Signature design

A finding's signature is `<file>::<rule-or-code>` with an occurrence count. **Line and column
numbers are deliberately excluded.**

That choice matters: adding an unrelated line above an existing error shifts its position but not
its signature, so ordinary edits do not produce false failures. Adding a genuinely new error raises
the count for that signature, which does fail. A line/column-based baseline would have been noisy
enough to be ignored, which is the usual way these gates die.

### Behaviour

- **New finding** → exit 1, printed with its signature and the count change
- **Fixed finding** → reported as an improvement, with the command to tighten the baseline. Does not fail.
- **Warnings** → recorded but not gated, so the 355 existing warnings need not be cleared for the gate to be useful

---

## 5. Verification Performed

| Check | Result |
|---|---|
| ESLint count after ignoring generated code | 3,476 → 878 ✅ |
| TypeScript baseline captured | 149 findings, 70 signatures ✅ |
| ESLint baseline captured | 523 findings, 178 signatures ✅ |
| Baselines pass their own check (idempotent) | exit 0 ✅ |
| **Deliberate new type error** → gate fails | exit 1, correctly identified ✅ |
| **Deliberate new lint error** → gate fails | exit 1, correctly identified ✅ |
| Probe removed, `npm run quality` | exit 0 ✅ |
| `git status src/` | empty — nothing touched ✅ |
| **`npm run build`** | **succeeds** ✅ |

The probe files used for the two failure tests were created under
`src/__baseline_probe__/` and deleted in the same step. Confirmed absent.

---

## 6. Step 9 Deferred — Marketing Branch

U1 applies to both products, but they remain separate branches until U6. The marketing side is
**not** done.

It was not attempted because the `app/main` changes are uncommitted. Switching to `main` now would
either carry them across — wrong, since marketing needs different changes — or fail outright.
Committing was not authorised, so the unit stops here rather than performing an unrequested git
operation.

### What marketing still needs

| Step | Applies? | Note |
|---|---|---|
| Exclude `src/generated/**` from ESLint | **Yes** | `main` has its own generated client |
| ESLint baseline | **Yes** | Count not yet measured |
| Annotate `eslint.ignoreDuringBuilds` | **Yes** | Present in `main`'s config |
| TypeScript baseline | **No** | — |
| Annotate `typescript.ignoreBuildErrors` | **No** | — |

**`main` has no `typescript.ignoreBuildErrors`.** The marketing product already type-checks on
every build. Its TypeScript position is already where the application is trying to get to, so U1
there is ESLint work only.

---

## 7. Production Safety

| Invariant | Status |
|---|---|
| **PS-1** Both apps build and deploy | ✅ `app/main` build verified. Marketing pending Step 9. |
| **PS-2** Preview-verified before production | ⏳ Pending deployment |
| **PS-3** Single `git revert` | ✅ Three modified files, three new files, nothing to unwind |
| **PS-4** Additive before subtractive | ✅ Nothing removed |
| **PS-5** No destructive DB change | ✅ N/A — no database interaction |
| **PS-6** Not both structure and behaviour | ✅ Neither |
| **PS-7** Integrations disabled before removal | ✅ N/A |

**Deploy risk: none.** No runtime code changed.

---

## 8. Follow-ups

| Item | Where |
|---|---|
| Apply U1 to the marketing branch (Step 9) | Requires committing `app/main` first |
| Wire `npm run quality` into CI | **U3** |
| Clear the 22 type errors in `src/lib` and `src/services/worker` | **U10** (D3=C) |
| Consider gating warnings once errors reach zero | Future |
| Remove suppression flags | FR-6.1b — when baselines reach zero |
