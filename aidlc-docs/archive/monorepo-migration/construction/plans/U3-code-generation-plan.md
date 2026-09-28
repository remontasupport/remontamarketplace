# U3 — CI Pipeline: Code Generation Plan

**Stage**: CONSTRUCTION — Code Generation (Part 1: Planning)
**Unit**: U3 — CI Pipeline
**Date**: 2026-09-10
**Status**: APPROVED (all recommendations) and COMPLETE 2026-09-10. Branch protection awaits user action.

---

## 1. Per-Unit Stage Assessment

| Stage | Decision | Rationale |
|---|---|---|
| **Functional Design** | **SKIP** | No business logic, no data model, no behaviour change. CI configuration only. |
| **NFR Requirements** | **SKIP** | NFR-3.6 and NFR-5 already state what this serves. |
| **NFR Design** | **SKIP** | No new runtime patterns. |
| **Infrastructure Design** | **SKIP** | CI is not deployment infrastructure. Vercel remains untouched. |
| **Code Generation** | **EXECUTE** | Always. |

---

## 2. What Already Works

Verified before planning, so the pipeline is designed against measured facts rather than hope:

| Fact | Consequence for CI |
|---|---|
| `npm run quality` exits 0 with **all env vars unset** | **CI needs no secrets at all** |
| `prisma generate` succeeds without a database URL | No dummy connection strings needed |
| `package-lock.json` is in sync | `npm ci` will work |
| No `.github/` directory exists | Nothing to preserve or merge |
| Quality gate runs in ~30 seconds locally | CI will be fast |

That `quality` needs no secrets is the useful part. It means the pipeline can run on forks and
pull requests without any credential exposure.

---

## 3. A Finding That Shapes This Unit

`npm audit` reports **56 vulnerabilities: 7 critical, 17 high, 32 moderate.**

FR-6.6 and SECURITY-10 require dependency scanning in CI. But a hard gate on day one would fail
**every pull request immediately** — the same trap U1 hit with 149 type errors and 523 lint errors.

Several are worth naming because they are actionable now rather than someday:

| Package | Severity | Note |
|---|---|---|
| **`@auth/core`** (via `@auth/prisma-adapter`) | **critical** | Auth.js email normalisation. **On the authentication path** of a system holding participant PII. |
| **`jspdf`** | **critical** | Local file inclusion / path traversal. This is one half of the duplicate PDF stack in TD-7 — if `@react-pdf/renderer` covers everything, **removing jsPDF removes a critical vulnerability for free**. |
| `axios` | high | NO_PROXY hostname normalisation bypass. Direct dependency. |
| `form-data` | high | CRLF injection |
| `defu` | high | Prototype pollution via `__proto__` |

The rest are largely transitive DoS and ReDoS advisories.

**Recommended handling**: same philosophy as U1 — measure, record, gate on *new*, and schedule the
backlog. Details in D3 below.

---

## 4. Four Decisions

### Question D1 — Which Node version(s) should CI run?

A) **Matrix: 20.x and 22.x** — proves the code works on both. Turns the pending Node upgrade from a hoped-for thing into a verified one, at the cost of one extra job.

B) **20.x only** — matches your current local Node (20.9.0).

C) **22.x only** — targets where you are going, but then CI diverges from your local machine until you upgrade.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** You have a pending Node 22 upgrade that I recommended doing before U5–U6.
> A matrix makes CI *prove* the code runs on 22 before you switch, rather than finding out during
> the upgrade. Vitest 2 supports both, so it should pass on each. Once you have upgraded, drop 20
> from the matrix.

### Question D2 — Should CI build the apps?

A) **No — rely on Vercel.** Vercel already builds every push and every PR as a preview deployment, and a failed build is never promoted. Duplicating it in CI roughly triples the pipeline time for no new signal.

B) **Yes — build in CI too.** Catches a break slightly earlier and without depending on Vercel, at the cost of several minutes per run.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** Vercel is already the build authority for both products and it gates
> promotion on success. CI's value here is the checks Vercel does *not* run — type baseline, lint
> baseline, tests — which currently have no home. Adding a redundant build mostly buys waiting.

### Question D3 — How strict should dependency scanning be?

A) **Report-only at first** — CI prints the audit summary and never fails on it. Tighten to fail-on-critical once the 7 criticals are triaged.

B) **Fail on critical immediately** — blocks every PR until all 7 criticals are resolved.

C) **Baseline it** like type and lint errors — record the current 56, fail only on new ones.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** C is tempting for consistency, but audit output shifts as new advisories
> are published against packages you never changed, so a baseline goes stale for reasons unrelated
> to your code and starts producing failures nobody caused. B blocks all work today. A gets the
> visibility requirement satisfied now and leaves a clear, dated path to strictness.
>
> Whichever you pick, **`jspdf` and `@auth/core` deserve their own follow-up unit** — one may be
> deletable outright, the other sits on the auth path.

### Question D4 — Which events trigger CI?

A) **Pull requests to `main` and `app/main`, plus direct pushes to those two branches.**

B) Pull requests only.

C) Every push to every branch.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** It covers the merge path and still catches a direct push to a long-lived
> branch. C wastes minutes on every work-in-progress commit; B misses direct pushes, which is
> exactly how this repository has been worked so far.

---

## 5. Unit Context

- **Phase**: A (Safety Net)
- **Depends on**: U1 (the baselines), U2 (the tests)
- **Blocks**: nothing technically, but it is what makes U1 and U2 *enforced* rather than merely available
- **Traces to**: FR-6.3, FR-6.6, FR-8.2, NFR-3.6, TD-3, SECURITY-10, SECURITY-13
- **Production risk**: **none.** No application code, no runtime path, no deployment change.

### Both branches

Like U1, this lands twice — `app/main` and `main` are still separate products until U6. The
workflow file is nearly identical; only the script names differ, because marketing runs
`type-check` strictly while the app runs `type-check:baseline`.

---

## 6. Generation Steps

### Step 1 — Create `.github/workflows/ci.yml` on `app/main`
- [x] Triggers per D4 — PR + push on main and app/main
- [x] Node matrix 20.x and 22.x per D1
- [x] `actions/checkout@v4`, `actions/setup-node@v4` with npm caching
- [x] `npm ci`
- [x] `npm run quality` — type baseline, lint baseline, tests
- [x] `npm audit` step per D3 — report-only, continue-on-error
- [x] Concurrency group so a new push cancels the previous run on the same branch

### Step 2 — SBOM generation
- [x] Added an `npm sbom --sbom-format=cyclonedx` step, uploaded as a build artifact
- [x] Verified available on npm 10.4 — no new dependency needed
- **Traces to**: SECURITY-10

### Step 3 — Verify the workflow is valid before relying on it
- [x] Confirmed YAML parses (real parser, not regex)
- [x] Confirmed every referenced npm script exists in `package.json`
- [x] Traced each step against the locally-verified commands from §2

### Step 4 — Document branch protection
- [x] Wrote the exact GitHub settings needed to make the checks **required** — a workflow that cannot block a merge is documentation, not a gate
- [ ] **AWAITING YOU** — GitHub UI change only you can make; the plan records what to click

### Step 5 — Marketing workflow on `main`
- [x] Same pipeline, adjusted: `type-check` runs **strictly** (marketing has zero type errors and needs no baseline)
- [x] Applied via a git worktree so the `app/main` checkout is untouched

### Step 6 — Documentation
- [x] `aidlc-docs/construction/U3/code/U3-summary.md` — what runs, what it gates, what it deliberately does not, and how to tighten the audit step later

---

## 7. What This Pipeline Will Not Do

Stated so the gaps are deliberate rather than assumed:

- **Not build the apps** (if D2=A) — Vercel does that
- **Not deploy anything** — Vercel owns deployment
- **Not run the k6 load tests** — they need a running target; they belong in the Build and Test stage
- **Not gate on warnings** — 355 ESLint warnings exist and are not blocking
- **Not gate on the audit** (if D3=A) — report only, for now

---

## 8. Production-Safety Protocol

| Invariant | How U3 satisfies it |
|---|---|
| **PS-1** Both apps build and deploy | Nothing that affects builds changes |
| **PS-2** Preview-verified | N/A — CI configuration is not deployed |
| **PS-3** Single `git revert` | One new file per branch |
| **PS-4** Additive before subtractive | Nothing removed |
| **PS-5** No destructive DB change | N/A |
| **PS-6** Not both structure and behaviour | Neither |
| **PS-7** Integrations disabled before removal | N/A |

**Deploy risk: none.** GitHub Actions has no effect on the Vercel runtime.

---

## 9. Summary

**6 steps.** One workflow file per branch, no application code, no secrets.

**Four decisions needed**: D1 Node versions (recommend **matrix 20 + 22**), D2 build in CI
(recommend **no**), D3 audit strictness (recommend **report-only initially**), D4 triggers
(recommend **PRs plus pushes to the two long-lived branches**).

**One thing only you can do**: branch protection. Without it the workflow reports but cannot
block, and FR-6.3 asks for a gate that can fail a merge. Step 4 writes down exactly what to set.

**Estimated scope**: half a day, plus your time in GitHub settings.
