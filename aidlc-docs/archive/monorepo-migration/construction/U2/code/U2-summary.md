# U2 — Test Frameworks: Implementation Summary

**Unit**: U2 (Phase A — Safety Net)
**Date**: 2026-09-10
**Branch**: `app/main`
**Status**: Complete on `app/main`. Marketing branch deferred with U1.

---

## 1. What Changed

| File | Action |
|---|---|
| `package.json` | Modified — 4 devDependencies, `test` and `test:watch` scripts, `quality` extended |
| `vitest.config.mts` | Created |
| `src/lib/w1/promote.test.ts` | Created — 11 tests |
| `src/utils/serviceSlugMapping.test.ts` | Created — 10 tests |
| `scripts/check-baseline.mjs` | Modified — generated-path exclusion (see §4) |

**No production file under `src/` was modified.** Only two new `*.test.ts` files were added
alongside existing code.

---

## 2. Frameworks

| Choice | Version | Why |
|---|---|---|
| **Vitest** | 2.1.9 | Native ESM/TS, no Babel layer, resolves `@/*` from `tsconfig` via one plugin |
| **fast-check** | 4.9.0 | Automatic shrinking and seed reproducibility — PBT-08 |
| **vite** | 5.4.21 | Vitest peer dependency |
| **vite-tsconfig-paths** | 5.1.4 | Single source of truth for the `@/*` alias |

### Versions are pinned to the current Node — read before upgrading

Installing the latest (`vitest@5`, `vite@8`) **fails on this machine**:

```
SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
```

`styleText` arrived in **Node 20.12.0**; this environment runs **Node v20.9.0**. Vite 8's
rolldown bundler requires it.

Rather than force a Node upgrade as a side effect of adding a test framework — which would touch
the Vercel runtime and build behaviour, well outside U2's scope — the versions are pinned to a set
that works on Node 20.9.

**Follow-up**: a Node upgrade is worth considering on its own merits, with its own verification.
It is not blocked on anything here, and nothing here is blocked on it. No `engines` field is
declared in `package.json`; adding one would make this constraint explicit.

---

## 3. Configuration Notes

Three deliberate choices in `vitest.config.mts`:

**`.mts`, not `.ts`** — `vite-tsconfig-paths` v5 is ESM-only and `package.json` declares no
`"type": "module"`, so a `.ts` config is loaded via `require` and fails. The `.mts` extension
forces ESM loading.

**`globals: false`** — `tsconfig` includes `**/*.ts` with `strict: true`, so every test file is
type-checked. Relying on Vitest globals would need ambient type declarations wired correctly, and
getting that wrong introduces new type errors that U1's baseline gate would reject. Importing
`describe`/`it`/`expect` explicitly removes the problem and is clearer anyway.

**`css: { postcss: { plugins: [] } }`** — Vite otherwise discovers `postcss.config.mjs` and fails
loading the Tailwind 4 plugin. Nothing under test imports CSS, so the pipeline is switched off
rather than worked around. Revisit if component tests are added.

---

## 4. A Bug This Unit Found in U1's Baseline

U1's baseline was **non-deterministic**, and U2's verification exposed it.

`tsconfig` includes `.next/types/**/*.ts` so Next can type-check route signatures. Those files
exist **only after a build**. U1 captured its baseline before running its build, so:

- clean checkout → `tsc` reports 149 errors
- after `npm run build` → 150

The gate then failed for a reason unrelated to any change under review.

**Fix**: `scripts/check-baseline.mjs` now excludes `.next/` and `src/generated/` from collection.
A baseline must be reproducible; build output is not. The errors are still reported by
`npm run type-check` and by a production build — they are simply not baselined.

---

## 5. A Real Defect Found While Fixing That

The extra error was not noise:

```
.next/types/app/api/auth/send-otp/route.ts: error TS2344
  Property 'signOtpToken' is incompatible with index signature.
  Type '(email: string, code: string, expiresAt: number) => string' is not assignable to 'never'.
```

**`src/app/api/auth/send-otp/route.ts` exports `signOtpToken`.** Next.js route modules may export
only HTTP method handlers and a fixed set of config values. Anything else is invalid, and Next's
generated types catch it.

Currently masked by `typescript.ignoreBuildErrors: true`. It would fail a strict build.

**Not fixed here** — U2 is test infrastructure, and PS-6 forbids a unit changing both structure and
behaviour. Logged as a follow-up. The fix is to move `signOtpToken` into a module the route
imports.

---

## 6. Tests Written

Both subjects were chosen for having **real properties**, not for being easy to test.

### `src/lib/w1/promote.test.ts` — 11 tests

`toMinutes` / `fromMinutes` from the W1 migration. Its own comment says the pair is *"kept beside
it so the pair cannot drift"* — the round-trip property is how that gets enforced rather than just
stated. Importing it costs nothing at runtime: its only import is `import type { Prisma }`, erased
at compile time.

| Property | Rule |
|---|---|
| minutes → string → minutes is the identity across 0–1439 | PBT-02 |
| string → minutes → string **normalises**, and is idempotent thereafter | PBT-02 |
| output always matches the save-path validator `^([0-1][0-9]\|2[0-3]):[0-5][0-9]$` | PBT-03 |
| every out-of-range hour or minute returns `null` | PBT-03 |

**The asymmetry matters.** `toMinutes` accepts a single-digit hour (`\d{1,2}`), `fromMinutes`
always emits two, so `"9:00"` → `540` → `"09:00"`. The string round trip is *not* an identity, and
a test asserting it were would be wrong. That is captured explicitly.

### `src/utils/serviceSlugMapping.test.ts` — 10 tests

| Property | Rule |
|---|---|
| name → slug → name is the identity for every mapped name | PBT-02 |
| slug → name → slug is the identity for every mapped slug | PBT-02 |
| the mapping is a bijection — table sizes must match | PBT-03 |
| the fallback always yields a URL-safe slug | PBT-03 |
| `isServiceInDatabase` never disagrees with its table | PBT-03 |
| **the fallback is lossy and does not round-trip** | documented |

The lossiness is asserted deliberately. `"URGENT CARE"` does not survive a round trip. Anything
relying on an unmapped name doing so is relying on something that does not hold.

---

## 7. Verification Performed

| Check | Result |
|---|---|
| `npm test` | **21 passed**, 2 files ✅ |
| Type gate with tests present | **149 unchanged**, exit 0 ✅ |
| Lint gate with tests present | **523 unchanged**, exit 0 ✅ |
| Deliberately failing assertion → `npm test` fails | exit 1 ✅ |
| Deliberately false property → **shrinks** | `Counterexample: [0]`, `Shrunk 1 time(s)` ✅ |
| Failure prints a reproducible **seed** | `seed: 927865729` ✅ |
| Probe removed, clean run | 21 passed ✅ |
| `git status src/` | only the two new test files ✅ |
| **`npm run build`** | **succeeds** ✅ |
| Test files absent from `.next` | confirmed ✅ |

**Risk 1 did not materialise** — the test files added zero type and zero lint findings.

---

## 8. How to Use It

```bash
npm test           # run once — what CI will call
npm run test:watch # watch mode
npm run quality    # type-check + lint + test, all against baselines
```

**Reproducing a property failure**: fast-check prints `{ seed, path, endOnFailure }` on failure.
Pass it back to reproduce the exact case:

```ts
fc.assert(fc.property(...), { seed: 927865729, path: "0:0" });
```

**Convention**: tests sit beside the code they test — `foo.ts` → `foo.test.ts`. They travel with
their code through the package extraction in U8–U13 rather than being orphaned by a path rewrite.
The k6 scripts stay at `tests/load/` and are explicitly excluded from Vitest.

---

## 9. Extension Compliance

| Rule | Status |
|---|---|
| **PBT-02** Round-trip properties | ✅ both subjects |
| **PBT-03** Invariant properties | ✅ validator, range, bijection, predicate agreement |
| **PBT-08** Shrinking and reproducibility | ✅ **verified, not assumed** |
| **PBT-09** Framework selection | ✅ Vitest + fast-check, justified |
| **PBT-10** Complementary strategy | ✅ every subject has both property and example tests |
| PBT-01, 04, 05, 06, 07 | N/A — domain-level; U9–U11 |
| SECURITY-10 supply chain | Partial — 4 devDeps pinned via lock file; scanning in U3 |
| RESILIENCY | N/A — no runtime component |

**No blocking findings.**

---

## 10. Follow-ups

| Item | Where |
|---|---|
| **`signOtpToken` exported from a route module** | New — see §5 |
| Node 20.9 pins Vitest to 2.x | New — see §2 |
| Consider an `engines` field | New |
| Component testing (`@testing-library/react` + `jsdom`) | Deferred by decision |
| Wire `npm run quality` into CI | **U3** |
| Apply U1 + U2 to the marketing branch | Requires committing `app/main` |
