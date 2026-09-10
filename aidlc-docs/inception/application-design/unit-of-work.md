# Units of Work

**Stage**: INCEPTION — Units Generation (Part 2)
**Date**: 2026-09-10
**Status**: Awaiting approval

**15 units in 4 phases.** Decomposition driven by production safety (user instruction, 2026-09-10):
unit boundaries isolate risk, and any unit that cannot be independently verified and reverted is
the wrong size.

---

## Production-Safety Invariants (PS-1..PS-7)

Confirmed binding on every unit by P1=A.

| # | Invariant |
|---|---|
| PS-1 | Both apps build and deploy at the unit's final commit |
| PS-2 | Verified on a Vercel preview deployment before production, including sign-in and one role-gated page |
| PS-3 | Revertible by a single `git revert` with no manual cleanup, until the unit's point of no return |
| PS-4 | Additive before subtractive — the new path is proven before the old is removed |
| PS-5 | No destructive database change without a rehearsal run and a verified backup |
| PS-6 | No unit changes both structure and behaviour |
| PS-7 | Live integrations are disabled before their code is removed |

**Standing protocol for every unit** (P2=B, P3=A, D2=A):
1. Branch from `main`
2. Implement; both apps must build
3. Push → Vercel preview builds
4. Verify preview: sign-in, one role-gated page, k6 smoke against the preview URL
5. Merge → production deploys
6. Verify production healthy
7. Unit is complete only when deployed and verified in production

Deploys avoid business hours (P6=B — hours to be confirmed before U1).

---

# PHASE A — Safety Net

No unit in this phase changes anything in the runtime path. Phase A exists so every later unit has
something beneath it.

## U1 — Type-Error Baseline

- **Purpose**: make the TypeScript compiler capable of failing a build, without fixing 149 errors first.
- **Scope**: remove `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` from both `next.config.ts` files; generate a baseline file recording the 149 known errors; wire a `type-check` script that fails only on errors absent from the baseline.
- **Out of scope**: fixing the errors (D-16, D3=C — the 22 in `src/lib` and `src/services/worker` are fixed in U10).
- **Deliverables**: baseline file, `type-check` and `lint` scripts, updated Next configs.
- **Exit criteria**: a newly introduced type error fails the check; the 149 existing ones do not.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-6 ✓ (config only). **No runtime code changes.**
- **Rollback**: revert the commit.
- **Depends on**: nothing. **Traces to**: FR-6.1, FR-6.2.
- **Estimate**: ~1 week.

## U2 — Test Frameworks

- **Purpose**: establish the correctness net that does not exist today.
- **Scope**: install Vitest and a property-based testing framework; configure both; write a first meaningful unit test and a first property test; establish naming and location conventions; carry the existing k6 scripts forward unchanged.
- **Out of scope**: broad test coverage — that accrues per unit thereafter.
- **Deliverables**: test configuration, conventions, first tests, `test` script.
- **Exit criteria**: `pnpm test` runs unit and property tests; a deliberately failing test fails the command; failing property tests shrink and are reproducible by seed (PBT-08).
- **Production safety**: PS-1 ✓, PS-3 ✓, PS-6 ✓. **No production code touched.**
- **Depends on**: U1. **Traces to**: FR-6.4, FR-6.5, NFR-5.1, PBT-08, PBT-09, PBT-10.
- **Estimate**: 1–2 weeks.

## U3 — CI Pipeline

- **Purpose**: make the gates from U1 and U2 unskippable.
- **Scope**: GitHub Actions workflow running type-check, lint, unit tests, property tests and a dependency vulnerability scan on every pull request; branch protection so the checks must pass; SBOM generation for production builds.
- **Out of scope**: the package-boundary check (P-1..P-5) — no packages exist yet; added in U7.
- **Deliverables**: `.github/workflows/ci.yml`, branch protection, SBOM step.
- **Exit criteria**: a PR with a new type error, a lint violation, or a failing test cannot merge.
- **Production safety**: PS-1 ✓, PS-3 ✓, PS-6 ✓. **CI only — no application code.**
- **Depends on**: U1, U2. **Traces to**: FR-6.3, FR-6.6, FR-8.2, NFR-3.6, SECURITY-10, SECURITY-13.
- **Estimate**: 3–5 days.

## U4 — Observability Baseline and Restore Verification

> **Added in response to P7 and P8.** P7: no monitoring exists. P8: a restore has never been
> verified. With P3=A (each unit deploys to production immediately), the original plan meant
> fourteen unobserved production deploys.

- **Purpose**: be able to tell when production breaks, and prove the recovery path works, before anything structural moves.
- **Scope**:
  - Structured logging with timestamp, correlation ID, level and message in both apps; no PII, tokens or credentials in log output
  - Alerting on authentication failures, authorization violations and error-rate spikes
  - 90-day log retention
  - `GET /api/health` in both apps
  - Security headers — CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` — extended to **all** HTML routes, not just `/dashboard/*`
  - **Restore drill**: restore a production backup to the rehearsal database, verify integrity, document the procedure and measured restore time
  - Process artifacts: lightweight change-management process, database-aware rollback procedure, DR testing schedule, incident response and Correction of Errors process
- **Exit criteria**: a deliberately triggered authentication failure raises an alert; both health endpoints respond; security headers present on all HTML responses; **a restore has been performed and its duration recorded**; the five process documents exist.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-6 ✓. Additive instrumentation and response headers only; the restore drill targets the rehearsal database and never production.
- **Depends on**: U3. **Traces to**: FR-7 (health), FR-8.1, FR-8.3, FR-8.4, FR-8.5, NFR-1.3, NFR-3.2, NFR-4.1–4.5, SECURITY-03, SECURITY-04, SECURITY-14, RESILIENCY-05, RESILIENCY-06, RESILIENCY-12, RESILIENCY-13, RESILIENCY-14, RESILIENCY-15.
- **Estimate**: 1–2 weeks.

> Verifying the restore here is what makes the 1-day dormancy in U15 survivable (P5).

---

# PHASE B — Workspace, In Place

## U5 — pnpm and Turborepo

- **Purpose**: become a workspace without moving any directory.
- **Scope**: migrate `package-lock.json` to `pnpm-lock.yaml`; add `pnpm-workspace.yaml` and `turbo.json` with build, lint, type-check and test tasks; the repository remains a single workspace entry.
- **Out of scope**: any directory move (U6), any package extraction (U7).
- **Exit criteria**: `pnpm install` reproduces the dependency tree; all Turborepo tasks run; both apps build and deploy unchanged.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-6 ✓. Dependency-resolution change only.
- **Risk**: pnpm's strict isolation may surface previously-hoisted phantom dependencies. This is the point — but it can fail the build, so verify on preview carefully.
- **Depends on**: U4. **Traces to**: FR-1.5, FR-1.6, NFR-6.2.
- **Estimate**: 3–5 days.

## U6 — `apps/` Relocation and Root Directory Change

> **Highest deployment risk in the migration**, isolated to one unit. T1=A confirmed 2026-09-10.

- **Purpose**: move both products into `apps/` and re-point Vercel, without touching environment variables.
- **Scope**: move `main` → `apps/web` and `app/main` → `apps/app`; change the Root Directory setting on each existing Vercel project; adjust workspace globs.
- **Out of scope**: standing up new Vercel projects (rejected — would require re-entering 45 environment variables per project); any package extraction.
- **Execution**: the eight-step sequence in `plans/unit-of-work-plan.md` §U6, run **per project, marketing first**. Record the current production deployment ID as the rollback target before changing any setting.
- **Exit criteria**: both apps build and deploy from their new roots; production verified; environment variables untouched.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-4 ✓ (the running deployment is never modified — it serves until a verified replacement is promoted), PS-6 ✓.
- **Rollback**: promote the recorded deployment ID (seconds, no rebuild), then revert the commit and the Root Directory setting.
- **Known window**: between the settings change and the merge, a push to `main` produces a failed build. It cannot reach production. T3=A means nothing should be pushing.
- **Pre-flight**: confirm Vercel's current Root Directory semantics against their documentation.
- **Depends on**: U5. **Traces to**: FR-1.1–1.3, FR-2.1, FR-2.2, FR-7.1.
- **Estimate**: ~1 week.

## U7 — `packages/config`, `packages/schemas`, mobile stub

- **Purpose**: create the two leaf packages everything else depends on.
- **Scope**: `packages/config` (tsconfig bases, flat ESLint including the P-1..P-5 boundary rules, Prettier, shared Tailwind theme); `packages/schemas` (Zod schemas, shared types, domain enums, `australianPostcodes` reference data) with **zero** Next, React, DOM or Prisma dependencies; `apps/mobile` Expo stub; wire the boundary check into CI.
- **Exit criteria**: both apps consume both packages; `packages/schemas` has no framework dependency; the CI boundary check fails on a deliberate violation; branch abandonment per D-10 completed.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-4 ✓ (old locations become re-export shims per T2=A), PS-6 ✓.
- **Depends on**: U6. **Traces to**: FR-1.4, FR-3.2, FR-3.6, FR-9.1, FR-9.3, NFR-6.1, NFR-6.4, P-5.
- **Estimate**: ~1 week.

---

# PHASE C — Data and Domain Extraction

Every unit in this phase is **additive**. New paths are built beside old ones; nothing switches
until the new path is proven (PS-4).

## U8 — `packages/db`: Prisma Relocation

> **R-5 — the most likely build break in the migration.** Isolated deliberately.

- **Purpose**: move the Prisma schema, migrations and generated client into `packages/db`.
- **Scope**: relocate `prisma/auth-schema.prisma` → `packages/db/prisma/schema.prisma` and its migrations; relocate the generated client; update `outputFileTracingIncludes` and `serverExternalPackages` in `next.config.ts` and `includeFiles` in `vercel.json`; delete the legacy `prisma/schema.prisma` five dead model declarations; keep the Prisma client exported temporarily so existing call sites keep working.
- **Out of scope**: repository functions (U9); any schema change to live tables.
- **Exit criteria**: both apps build and deploy; every existing database query works in production; the generated client is present in the deployed bundle.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-6 ✓. **No schema change — file relocation only.**
- **Risk**: the bundling configuration is already the most fragile part of deployment, and the failure mode is a build that succeeds while runtime queries fail. Preview verification **must** exercise a database-backed page, not just a static one.
- **Depends on**: U7. **Traces to**: FR-3.3, FR-4.3 (partial — dead models), R-5.
- **Estimate**: ~1 week.

## U9 — `packages/db`: Repository Functions

- **Purpose**: build the repository layer (AD-07) alongside existing Prisma calls.
- **Scope**: seven repository modules — worker, search, verification, identity, demand, jobs, taxonomy — plus `withTransaction`. `WorkerSearchCriteria` carries a **required** `visibility` discriminator. The Prisma client stops being exported from the package root once call sites migrate.
- **Out of scope**: switching call sites (U10, U11).
- **Exit criteria**: repositories exist with tests, including round-trip and idempotency properties; nothing in production calls them yet.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-4 ✓ (purely additive), PS-6 ✓. **Zero behaviour change.**
- **Depends on**: U8. **Traces to**: FR-3.3, NFR-5.2, PBT-02, PBT-04.
- **Estimate**: 2–3 weeks.

## U10 — `packages/domain-core` and First Domain Package

- **Purpose**: prove the `Actor` pattern end-to-end once before repeating it five times.
- **Scope**: `packages/domain-core` (`Actor`, `Result`, `DomainError`, `assertRole`, `assertSelfOrRole`, `assertOwns`, `Paginated`); **`packages/domain-worker`** as the first domain package; `resolveActor` in `apps/app/src/server`; convert `src/services/worker/*` into thin `"use server"` wrappers in `apps/app/src/actions/worker/`. **Fix the 22 type errors in `src/lib` and `src/services/worker` first** (D3=C).
- **Why worker first**: it is the largest domain (~50 of 56 actions), so problems with the pattern surface immediately rather than after five easier packages.
- **Exit criteria**: worker profile flows work identically in production; domain functions take `Actor` and perform object-level checks; property tests cover the authorization invariant; the 22 type errors are gone from the baseline.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-4 ✓ (re-export shims, T2=A), PS-6 ✓ — behaviour must be **identical**; this is a refactor, not a change.
- **Depends on**: U9. **Traces to**: FR-3.4, AD-04, AD-05, AD-06, AD-15, NFR-5.2, RISK-7, PBT-03, PBT-07.
- **Estimate**: 2–3 weeks.

## U11 — Remaining Five Domain Packages

- **Purpose**: repeat the proven pattern.
- **Scope**: `domain-identity`, `domain-verification`, `domain-demand`, `domain-jobs`, `domain-search`. Route the 17 direct-Prisma Server Components through domain functions (AD-03). `domain-search` implements `searchWorkersPublic` and `searchWorkersAdmin` as **two separate functions** (FR-10.7) — built here, switched on in U14.
- **Sub-dividable**: if U10 shows the pattern is harder than expected, split per package.
- **Exit criteria**: all six domain packages exist; no domain package imports another (P-4); all behaviour unchanged in production.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-4 ✓, PS-6 ✓.
- **Depends on**: U10. **Traces to**: FR-3.4, FR-3.7, AD-03, P-4.
- **Estimate**: 3–4 weeks.

## U12 — `packages/ui` Reconciliation

- **Purpose**: one visual language across both web products (D-13).
- **Scope**: reconcile the **16 primitives that exist in both apps and have drifted for eleven months** — `button`, `card`, `checkbox`, `command`, `dialog`, `form`, `input`, `label`, `popover`, `progress`, `radio-group`, `searchable-select`, `select`, `textarea`, `location-dropdown`, `layout` — plus the app-only remainder. Standardise on Radix and Tailwind (AD-12, AD-13). Retire MUI, Headless UI, chatscope, styled-components and Emotion; move date pickers to `react-day-picker`.
- **Critical**: each pair must be **reconciled**, not copied. Choosing one side silently changes the other product's appearance or behaviour.
- **Out of scope**: full consolidation of app-internal component code (D-14 defers it).
- **Exit criteria**: both apps render from `packages/ui`; visual comparison against pre-change screenshots shows no unintended difference; the retired libraries are gone from both manifests.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-6 — **partial**: visual change is possible where the two versions genuinely differed. Preview verification must include visual comparison of key pages in both apps.
- **Depends on**: U7 (can run parallel to U10/U11). **Traces to**: FR-3.1, FR-3.8, D-12, D-13, AD-12, AD-13, AD-14.
- **Estimate**: 2–3 weeks.

## U13 — `packages/integrations` and `packages/api-client`

- **Purpose**: shared email, and the typed HTTP client that gives marketing its data.
- **Scope**: `packages/integrations` with Resend email and React Email templates (Nodemailer retired); `packages/api-client` hand-written over `packages/schemas`, exposing **public endpoints only** (FR-10.7). App-local integration clients move to `apps/app/src/integrations/`.
- **Exit criteria**: both apps send email through the shared package; `api-client` fetches the public worker directory successfully; it exposes no admin method; it carries no Next, React or DOM dependency.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-4 ✓, PS-6 ✓.
- **Depends on**: U7, U11 (can run parallel to U12). **Traces to**: FR-3.5, FR-9.1, AD-02, AD-09.
- **Estimate**: 1–2 weeks.

---

# PHASE D — Behaviour Changes

## U14 — Security Fixes and Search Re-point (ATOMIC, FLAG-GATED)

> **The only unit that deliberately changes what users see.** Atomic because RISK-2 forbids
> shipping the all-worker search without its guard.

- **Purpose**: point worker search at real `WorkerProfile` data, and close the four security findings.
- **Scope**:
  - **FR-5.1** delete `POST /api/admin/fix-qualifications` (unauthenticated mass write)
  - **FR-5.2** guard or remove `/remontaadmin/findsupport` — **on both apps**, it exists on each
  - **FR-5.3** fix the coordinator role check path; layouts assert role, not merely authentication
  - **FR-5.4** rate-limit `/api/upload/worker-photo`, bind it to a registration token
  - **FR-4** new `GET /api/admin/workers/search` on `WorkerProfile`, all statuses, ADMIN-only; `SearchSupport.tsx` re-pointed; `/api/contractors` and `/api/contractors/[id]` removed from `apps/app`
  - **FR-10.2** marketing's directory re-pointed to `/api/public/workers` via `api-client`
  - **FR-10.7** endpoint segregation verified — `apps/web` reaches only the public endpoint
  - Rate limiting on `/api/public/workers`, now publicly reachable on every directory page load
- **Feature flag** (D5=A): both search changes deploy dark, enabled by flag, disabled instantly without redeploy. Follows the W1 read-switch precedent (`febc7fa`, `ffdce8f`).
- **Exit criteria**: admin search returns all workers under ADMIN only; marketing directory renders from `WorkerProfile`; anonymous callers cannot reach unpublished or unverified workers **by any path**; all four findings closed; property test — no anonymous actor reaches an unpublished worker — passes.
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-3 ✓, PS-4 ✓ (flag-gated, old path removed only after the new is verified live), PS-6 — **deliberately violated in a controlled way**: this unit changes behaviour by design, which is why it contains no structural moves and is flag-gated.
- **Rollback**: disable the flag. No redeploy.
- **Depends on**: U11, U13. **Traces to**: FR-4.1–4.7, FR-5.1–5.4, FR-10.2, FR-10.7, NFR-3.1, NFR-3.4, RISK-2, SECURITY-08, SECURITY-11.
- **Estimate**: 1–2 weeks.
- **Note**: also carries the search-visibility acceptance criteria displaced by skipping User Stories.

## U15 — `ContractorProfile` Retirement (IRREVERSIBLE)

> **The only irreversible unit.** Gated on rehearsal and a verified backup.

- **Purpose**: retire `ContractorProfile`, its Zoho sync, and the marketing database.
- **Scope**: FR-10.6's five-step sequence, executed in order:
  1. **Verify populations** — compare `ContractorProfile` against `WorkerProfile` by row count and email overlap. **Precondition for every step below.** If they diverge materially, stop and revisit D-38 (RISK-10).
  2. **Reads already re-pointed** — done in U14
  3. **Stop writes** — disable the contractor webhook **in Zoho first** (PS-7), then remove `/api/sync-contractors` and `/api/webhooks/zoho-contractor`; remove marketing's duplicate `/api/sync-jobs`, `/api/refresh-jobs`, `/api/jobs`
  4. **Dormancy — 1 day** (P5), table unread and unwritten
  5. **Drop** — rehearsal run against `REHEARSAL_DATABASE_URL` first, verified backup immediately before, then drop `ContractorProfile`, `ContractorsbyArea` and the legacy `Job`; decommission the marketing database; remove `DATABASE_URL` from `apps/web`
- **Exit criteria**: population comparison recorded; webhook disabled in Zoho and confirmed silent; dormancy elapsed with no errors; rehearsal successful; backup verified; tables dropped; `apps/web` holds no database credential (P-1).
- **Production safety**: PS-1 ✓, PS-2 ✓, PS-5 ✓ (rehearsal **and** verified backup, P4=C), PS-7 ✓ (webhook disabled before code removal), PS-3 — **holds until step 5 only**.
- **Rollback**: revertible through step 4. After step 5, recovery is restore-from-backup. Because the sync is disabled by then the table is **static**, so a restore is byte-identical to what was dropped — nothing is lost.
- **Depends on**: U14. **Traces to**: FR-7.5, FR-10.1, FR-10.3–10.6, D-38, D-39, RISK-10, NFR-1.3.
- **Estimate**: ~1 week plus 1 day dormancy.

---

## Estimates

| Phase | Units | Estimate |
|---|---|---|
| A — Safety net | U1–U4 | 3.5–6 weeks |
| B — Workspace | U5–U7 | 2.5–3 weeks |
| C — Data and domain | U8–U13 | 11.5–16 weeks |
| D — Behaviour | U14–U15 | 2–3 weeks |
| **Total** | **15 units** | **~19.5–28 weeks** |

Less if U12 and U13 run in parallel with U10/U11 — roughly **17–24 weeks**.

**This is higher than the execution plan's 14–23 weeks.** Two honest reasons: U4 (observability
and restore verification) did not exist in that estimate, and the finer decomposition adds
per-unit verification overhead. That overhead is the cost of the production-safety constraint, and
it is being paid deliberately.

Ranges remain planning aids. The least certain are U9 (repositories across 24 models), U11 (five
domain packages) and U12 (16 drifted primitive pairs).

---

## Points of No Return

| Point | Unit | After which |
|---|---|---|
| Root Directory changed | U6 | Recoverable — promote the recorded deployment ID |
| Old import paths deleted | U10, U11 | Recoverable by `git revert` |
| Retired UI libraries removed | U12 | Recoverable by `git revert` |
| Feature flag enabled | U14 | Recoverable — disable the flag |
| **Tables dropped** | **U15 step 5** | **Recoverable only by restore from backup** |

Exactly one genuinely irreversible action exists in the entire migration, and it sits in the last
unit behind a rehearsal, a verified backup and a dormancy period.
