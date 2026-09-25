# U2 — Test Frameworks: Code Generation Plan

**Stage**: CONSTRUCTION — Code Generation (Part 1: Planning)
**Unit**: U2 — Test Frameworks
**Date**: 2026-09-10
**Status**: APPROVED and COMPLETE 2026-09-10 on `app/main`

**This plan is the single source of truth for U2 code generation.**

---

## 1. Per-Unit Stage Assessment

| Stage | Decision | Rationale |
|---|---|---|
| **Functional Design** | **SKIP** | No business logic, no data model, no behaviour change. Test infrastructure only. |
| **NFR Requirements** | **SKIP** *(with one carve-out)* | NFR-5.1–5.4 already state the testability requirements. The one genuine decision — **which frameworks** — is PBT-09 and is made explicitly in §3 below rather than deferred to a stage of its own. |
| **NFR Design** | **SKIP** | No new patterns beyond the framework configuration itself. |
| **Infrastructure Design** | **SKIP** | No deployment, cloud resource or networking change. Test files are never bundled. |
| **Code Generation** | **EXECUTE** | Always. |

---

## 2. Unit Context

- **Unit**: U2 — Test Frameworks
- **Phase**: A (Safety Net)
- **Depends on**: U1 (complete on `app/main`)
- **Blocks**: U3 (CI has nothing to run without this)
- **Traces to**: FR-6.4, FR-6.5, NFR-5.1, NFR-5.2, NFR-5.3, NFR-5.4, PBT-08, PBT-09, PBT-10, TD-3
- **Production risk**: **none.** Test files are not reachable from any page or route, so Next never bundles them. No `src/` production file is modified.

### Carried forward from U1

U1's marketing-branch work (Step 9) and its commit remain outstanding. U2 proceeds on `app/main`
only, matching U1. Both units land on marketing together when the branch work happens.

---

## 3. Framework Selection (satisfies PBT-09)

### Test runner — **Vitest**

| Option | Assessment |
|---|---|
| **Vitest** ✅ | Native ESM and TypeScript with no Babel layer, reuses the existing `tsconfig` paths, materially faster, and its config sits beside Next's without fighting it. |
| Jest | Works via `next/jest`, but adds a transform layer and more configuration for ESM. More established with Next, but the advantage has narrowed. |

**Chosen: Vitest.** The decisive factor is the `@/*` path alias — Vitest resolves it from
`tsconfig` with one plugin, where Jest needs a duplicated `moduleNameMapper` that drifts.

### Property-based testing — **fast-check**

The de facto standard for TypeScript. Integrates directly with Vitest, and provides **automatic
shrinking** and **seed-based reproducibility**, which are exactly what PBT-08 requires. No
realistic alternative.

### Component testing — **deferred to a later unit** *(decision point — see §7)*

`@testing-library/react` plus `jsdom` would add four dependencies and a DOM environment. The code
about to be extracted into `packages/domain-*` (U10, U11) is **pure logic with no DOM**, so
component testing has no consumer yet. It is proposed as deferred; say if you would rather it
land now.

---

## 4. Two Risks This Unit Must Handle

### Risk 1 — new test files could fail U1's type-check gate

`tsconfig.json` includes `**/*.ts` with `strict: true`, so **every test file is type-checked**.
A misconfigured test setup would introduce new type errors, and U1's baseline gate would
correctly reject them — blocking the very unit that is meant to build on it.

**Mitigation**: **do not use Vitest globals.** Import `describe`, `it` and `expect` explicitly
from `vitest` in every test file. That removes the need for global type declarations entirely and
is the more explicit style regardless. Step 6 verifies `npm run quality` still passes.

### Risk 2 — test files must not reach the production bundle

Next bundles only what is reachable from a page or route. Files named `*.test.ts` that nothing
imports are never traversed, so they cannot enter the bundle.

**Mitigation**: Step 7 verifies `npm run build` output is unchanged, and confirms no test file
appears in `.next`.

---

## 5. Test Location Convention

**Co-located**: `foo.ts` is tested by `foo.test.ts` in the same directory.

Chosen over a separate `tests/` tree because tests then **travel with their code** during the
package extraction in U8–U13. A parallel tree would need every path rewritten at each move, and
tests that fail to move get silently orphaned.

The existing k6 scripts stay at `tests/load/` untouched — they are a different kind of test with a
different runner.

---

## 6. First Tests — What and Why

Establishing frameworks with trivial tests proves nothing. These two subjects were chosen because
they have **real properties worth asserting**, and both are pure.

### Subject 1 — `toMinutes` / `fromMinutes` (`src/lib/w1/promote.ts`)

The W1 migration's time conversion. Its own comment says the pair is *"kept beside it so the pair
cannot drift"* — a property test is precisely how that intent gets enforced.

`promote.ts` imports only `import type { Prisma }`, which is **erased at compile time**, so
testing it pulls in no Prisma runtime.

Properties:
1. **Round-trip** (PBT-02): for any `m` in 0–1439, `toMinutes(fromMinutes(m)) === m`
2. **Normalisation, not identity**: `fromMinutes(toMinutes(s))` zero-pads, so `"9:00"` → `"09:00"`. The reverse round-trip is **idempotent after one pass**, not the identity — a real asymmetry the current code has and which a naive test would assert wrongly.
3. **Rejection** (PBT-03): hours > 23 or minutes > 59 return `null` rather than a wrong number — the documented reason `null` exists is so a bad value is not silently read as midnight.

### Subject 2 — `serviceNameToSlug` / `slugToServiceName` (`src/utils/serviceSlugMapping.ts`)

Zero imports, entirely pure.

Properties:
1. **Round-trip over the known mapping** (PBT-02): for every name in `SERVICE_NAME_TO_SLUG`, name → slug → name is the identity
2. **Fallback is lossy** (PBT-03): for unmapped input the fallback normalises whitespace and casing, so the round trip is *not* the identity. Asserting this documents real behaviour rather than pretending it round-trips.

### Example-based tests (PBT-10)

PBT-10 requires property tests to **complement**, not replace, example-based tests. Each subject
also gets conventional cases for its documented edge conditions — `"00:00"`, `"23:59"`, `"24:00"`,
`"9:00"`, non-strings, and the known service names.

---

## 7. Generation Steps

### Step 1 — Install and configure Vitest
- [x] Add `vitest`, `vite`, `vite-tsconfig-paths` as devDependencies
- [x] Create `vitest.config.mts` (.mts required — ESM-only plugin) — node environment, `@/*` resolved from `tsconfig`, `include` limited to `src/**/*.test.ts`, `tests/load/**` excluded so k6 scripts are never picked up
- **Traces to**: FR-6.4, NFR-5.1

### Step 2 — Install fast-check
- [x] Add `fast-check` as a devDependency
- [x] Configure reporting so a failure prints the shrunk counterexample **and its seed** (PBT-08)
- **Traces to**: FR-6.5, PBT-08, PBT-09

### Step 3 — Add npm scripts
- [x] `test` → `vitest run`
- [x] `test:watch` → `vitest`
- [x] Extend `quality` to `type-check:baseline && lint:baseline && test`
- **Traces to**: FR-6.3, FR-6.4

### Step 4 — Write `src/lib/w1/promote.test.ts`
- [x] Property: minutes → string → minutes is the identity across 0–1439
- [x] Property: string → minutes → string normalises (zero-pads) and is idempotent thereafter
- [x] Property: out-of-range and non-string inputs return `null`
- [x] Examples: `"00:00"`, `"23:59"`, `"24:00"`, `"9:00"`, `"", null, undefined, 540`
- [x] **Explicit imports from `vitest`** — no globals (Risk 1)
- **Traces to**: NFR-5.2, PBT-02, PBT-03, PBT-10

### Step 5 — Write `src/utils/serviceSlugMapping.test.ts`
- [x] Property: round trip is the identity for every entry in the known mapping
- [x] Property: the fallback path normalises and is therefore lossy — asserted, not assumed
- [x] Examples: known names, unknown names, empty string, multi-space input
- **Traces to**: NFR-5.2, PBT-02, PBT-03, PBT-10

### Step 6 — Verify the type gate still passes
- [x] `npm run type-check:baseline` → exit 0, **149 unchanged** (no new errors from test files)
- [x] `npm run lint:baseline` → exit 0, **523 unchanged**
- **This is the check that Risk 1 did not materialise.**

### Step 7 — Verify the build is unaffected
- [x] `npm run build` succeeds
- [x] No test file appears in the build output
- [x] No production file under `src/` modified — only new `*.test.ts` files added
- **Traces to**: PS-1, Risk 2

### Step 8 — Verify the tests actually fail when they should
- [x] Add a deliberately failing assertion → `npm test` **fails** with non-zero exit
- [x] Remove it → passes
- [x] Add a deliberately false property → confirm fast-check **shrinks** to a minimal counterexample and prints a reproducible **seed** (PBT-08)
- [x] Remove it
- **Exit criterion for the unit**

### Step 9 — Documentation
- [x] Write `aidlc-docs/construction/U2/code/U2-summary.md` — frameworks chosen and why, conventions, how to run, how to reproduce a property failure from its seed, and what U3 will wire into CI

---

## 8. Production-Safety Protocol

| Invariant | How U2 satisfies it |
|---|---|
| **PS-1** Both apps build and deploy | Step 7 |
| **PS-2** Preview-verified | Standing protocol |
| **PS-3** Single `git revert` | New files plus `package.json` — nothing to unwind |
| **PS-4** Additive before subtractive | Nothing removed |
| **PS-5** No destructive DB change | **N/A** — no database interaction |
| **PS-6** Not both structure and behaviour | **Neither** |
| **PS-7** Integrations disabled before removal | **N/A** |

**Deploy risk: none.** Test files are unreachable from any route; devDependencies are not bundled.

---

## 9. Extension Compliance

| Rule | Status |
|---|---|
| **PBT-08** Shrinking and reproducibility | **Satisfied** — fast-check provides both; Step 8 verifies rather than assumes |
| **PBT-09** Framework selection | **Satisfied** — Vitest and fast-check, justified in §3 |
| **PBT-10** Complementary strategy | **Satisfied** — every subject gets both property and example-based tests |
| **PBT-02** Round-trip properties | **Satisfied** — both subjects are round-trip pairs |
| **PBT-03** Invariant properties | **Satisfied** — rejection and lossiness invariants |
| PBT-01, 04, 05, 06, 07 | **N/A this unit** — domain-level; U9, U10, U11 |
| SECURITY-10 supply chain | **Partial** — three new devDependencies, pinned via lock file; scanning arrives in U3 |
| RESILIENCY | **N/A** — no runtime component |

**No blocking findings.**

---

## 10. Summary

**9 steps.** Adds three devDependencies, one config file, two test files and three npm scripts.
**No production file under `src/` is modified** — only new `*.test.ts` files alongside existing
ones.

**One decision needs your input**: component testing (`@testing-library/react` + `jsdom`) is
proposed as **deferred**, because the code about to be extracted is pure logic with no DOM. Say if
you would rather it land in U2.

**Estimated scope**: 1–2 weeks, most of it in writing tests worth having rather than in
configuration.
