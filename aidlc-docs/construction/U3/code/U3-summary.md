# U3 — CI Pipeline: Implementation Summary

**Unit**: U3 (Phase A — Safety Net)
**Date**: 2026-09-10
**Decisions**: D1=A (Node matrix 20+22), D2=A (no build in CI), D3=A (audit report-only), D4=A (PRs + pushes)
**Status**: Complete on both branches. **Branch protection still requires your action — see §5.**

---

## 1. What Changed

| File | Branch | Action |
|---|---|---|
| `.github/workflows/ci.yml` | `app/main` | Created (uncommitted) |
| `.github/workflows/ci.yml` | `main` | Created — commit `94823d9` |

No application code. No runtime path. No deployment change.

---

## 2. What the Pipeline Runs

Two jobs, in parallel.

### `quality` — matrix over Node 20.x and 22.x

| Branch | Command | What it gates |
|---|---|---|
| `app/main` | `npm run quality` | type baseline (149 known) → lint baseline (523 known) → 41 tests |
| `main` | `npm run quality` | **strict `tsc`, zero tolerance** → lint baseline (76 known) |

Marketing type-checks strictly because it has **zero** type errors and needs no baseline. That
difference is the whole reason the two workflows are not identical.

Marketing has **no test step** — U2 landed on `app/main` only. When it reaches `main`, `quality`
picks it up and the workflow file does not change.

### `supply-chain` — single Node version

- `npm audit` — **report only**, `continue-on-error: true`
- `npm sbom --sbom-format=cyclonedx` — uploaded as a 90-day artifact (SECURITY-10)

---

## 3. Why It Needs No Secrets

Verified before writing anything, rather than discovered in a failing run:

| Check | Result |
|---|---|
| `npm run quality` with **every env var unset** | exit 0 |
| `prisma generate` without a database URL | succeeds |
| `package-lock.json` in sync | yes — `npm ci` works |

So the pipeline runs safely on pull requests and forks with **no credential exposure at all**.
That is a property worth protecting: if a future step needs a secret, it should be justified
rather than added by reflex.

`permissions: contents: read` scopes the token to the minimum (SECURITY-06).

---

## 4. Why the Audit Step Does Not Fail the Build

`npm audit` reports **56 vulnerabilities: 7 critical, 17 high, 32 moderate.**

Failing on those would block every pull request from the moment this merges — the same trap U1
was built to avoid with 149 type errors. So it reports on every run and gates nothing yet.

**This is a deliberate, dated compromise, not an oversight.** Two criticals are worth clearing
first, after which the step should become `--audit-level=critical` with `continue-on-error`
removed:

| Package | Why it matters |
|---|---|
| **`@auth/core`** (via `@auth/prisma-adapter`) | Auth.js email normalisation — **on the authentication path** of a system holding participant PII |
| **`jspdf`** | Path traversal / local file inclusion. Half of the duplicate PDF stack in TD-7 — **if `@react-pdf/renderer` covers everything, deleting jsPDF removes a critical vulnerability for free** |

Also `axios` (NO_PROXY bypass, direct), `form-data` (CRLF injection), `defu` (prototype pollution).

**Recommended follow-up unit**: triage these seven, starting with whether jsPDF is used at all.

---

## 5. ⚠️ Branch Protection — Only You Can Do This

**The workflow currently reports but cannot block a merge.** FR-6.3 asks for a gate that can fail
one, and a workflow without branch protection is documentation, not a gate.

In GitHub → **Settings → Branches → Add branch ruleset** (or Add rule), for **both `main` and
`app/main`**:

1. **Require status checks to pass before merging**
2. Add these as required:
   - `Quality (Node 20.x)`
   - `Quality (Node 22.x)`
3. **Require branches to be up to date before merging** — optional, but prevents a merge that passes alone and fails combined
4. Leave **`Supply chain`** *not* required, since its audit step is informational

Do **not** require `Supply chain` while the audit is report-only — it would pass regardless and
give false assurance.

Until this is configured, U3 has installed the machinery but not the enforcement.

---

## 6. Verification Performed

| Check | Result |
|---|---|
| YAML parses (real parser, not regex) | ✅ both files |
| Jobs resolve to `quality`, `supply-chain` | ✅ |
| Matrix is `20.x`, `22.x`; `fail-fast: false` | ✅ |
| Triggers are PR + push on `main`, `app/main` | ✅ |
| `concurrency.cancel-in-progress` | ✅ |
| `permissions: contents: read` | ✅ |
| Audit step `continue-on-error: true` | ✅ |
| No build job present (D2=A) | ✅ |
| Every referenced npm script exists | ✅ all four |
| `npm sbom --sbom-format=cyclonedx` works locally | ✅ valid CycloneDX 1.5 |
| Marketing scripts confirmed present from U1 | ✅ |

An initial regex-based check reported three jobs including `push`. That was an artifact of `push:`
sitting at the same indentation under `on:` as job names sit under `jobs:`. A real YAML parse
confirmed two jobs. Worth noting because it is exactly the kind of false signal that makes people
distrust a check — the fix was to validate properly, not to loosen the pattern.

**Not verified**: the workflow has not yet run on GitHub. YAML validity and script existence are
confirmed; runner behaviour is not. The first push will be the real test, and a first-run failure
here costs nothing — CI is not on the deployment path.

---

## 7. What This Pipeline Deliberately Does Not Do

- **Build the apps** — Vercel does, on every push and PR, and never promotes a failure
- **Deploy anything** — Vercel owns deployment
- **Run k6 load tests** — they need a live target; they belong in Build and Test
- **Gate on ESLint warnings** — 355 exist on `app/main`, 19 on `main`, none blocking
- **Gate on `npm audit`** — see §4

---

## 8. Production Safety

| Invariant | Status |
|---|---|
| **PS-1** Both apps build and deploy | ✅ unaffected — no build input changed |
| **PS-2** Preview-verified | ✅ N/A — CI config is never deployed |
| **PS-3** Single `git revert` | ✅ one new file per branch |
| **PS-4** Additive before subtractive | ✅ nothing removed |
| **PS-5** No destructive DB change | ✅ N/A |
| **PS-6** Not both structure and behaviour | ✅ neither |
| **PS-7** Integrations disabled before removal | ✅ N/A |

**Deploy risk: none.** GitHub Actions has no effect on the Vercel runtime.

---

## 9. Follow-ups

| Item | Where |
|---|---|
| **Configure branch protection on both branches** | **You — §5** |
| Triage the 7 critical vulnerabilities; check whether jsPDF is used at all | New unit |
| Tighten the audit step once criticals are cleared | After the above |
| Drop `20.x` from the matrix after the Node upgrade | After Node 22 |
| Apply U2 (tests) to the marketing branch | With the next marketing pass |
