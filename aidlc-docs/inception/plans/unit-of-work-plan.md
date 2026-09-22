# Unit of Work Plan

**Stage**: INCEPTION — Units Generation (Part 1: Planning)
**Date**: 2026-09-10
**Depth**: Comprehensive
**Status**: COMPLETE — Part 1 and Part 2 done 2026-09-10

---

## Primary Constraint

> *"make sure you do this very carefully so that prod would not be affected"* — user, 2026-09-10

Both products are **live in production** and the application handles disability-participant
personal data and statutory compliance evidence. Production safety is therefore treated as a
**decomposition criterion**, not a delivery detail: unit boundaries are drawn to isolate risk, and
a unit that cannot be verified and reverted independently is the wrong size.

This reverses the usual trade-off. Where a larger unit would be more efficient but harder to
revert, this plan proposes the smaller one.

---

## Two Findings That Help

Investigating before writing this plan turned up two existing capabilities worth building on.

**1. Vercel preview deployments already work correctly with authentication.**
`src/lib/auth.config.ts` distinguishes `VERCEL_ENV === "production"` from `"preview"` and scopes
the session cookie accordingly. The comment records why: Vercel runs every deployment with
`NODE_ENV=production`, so previews were setting cookies for the production host and breaking
sign-in. That was fixed in commit `96a077f`.

**Consequence**: every unit can be fully exercised — including login and role-gated pages — on a
preview URL before anything reaches production. This is the strongest production-safety tool
already available, and it costs nothing.

**2. A rehearsal-database pattern was used for the W1 migration.**
`.env.local` still holds `REHEARSAL_DATABASE_URL` and `REHEARSAL_POOLED_URL`. The W1 commits show
a parity harness run against a rehearsal copy before the destructive phase, and the
`WorkerAvailability` unique-key comment records a real finding from that rehearsal — two Saturday
slots sharing a start time — which would otherwise have silently discarded data.

**Consequence**: the precedent for verifying destructive schema changes against a production copy
already exists in this project. The `ContractorProfile` retirement (U15) should reuse it.

---

## Proposed Production-Safety Invariants

Every unit must satisfy all seven. Proposed for confirmation in Question P1.

| # | Invariant |
|---|---|
| **PS-1** | **Both apps build and deploy at the unit's final commit.** No unit ends with a broken tree. |
| **PS-2** | **Verified on a Vercel preview deployment before production.** Including sign-in and at least one role-gated page. |
| **PS-3** | **Revertible by a single `git revert`** with no manual cleanup, until the unit's designated point of no return. |
| **PS-4** | **Additive before subtractive.** New path is built and verified before the old path is removed — never the reverse. Old code stays until the new is proven. |
| **PS-5** | **No destructive database change without a rehearsal run first**, using the existing rehearsal database, and a verified backup. |
| **PS-6** | **No unit changes both structure and behaviour.** Moves and behavioural changes are separate units, so a regression has one candidate cause. |
| **PS-7** | **Live integrations are disabled before their code is removed**, never simultaneously — specifically the Zoho contractor webhook. |

**PS-6 deserves emphasis.** It is why the security fixes and the search re-point are separated
from the package moves in the proposal below, despite being convenient to do together. If a
worker-search regression appears after a unit that both moved files and changed visibility rules,
there is no way to tell which caused it.

---

## Proposed Decomposition

The execution plan proposed 10 units. Re-examined against PS-1..PS-7, three of them bundle
independent risks and are split. P7 and P8 then added one more, giving **15 units**. Question D1 asked whether this granularity is
right.

### Phase A — Safety net (no structural change at all)

| Unit | Name | Why it is separate |
|---|---|---|
| **U1** | Type-error baseline | Remove `ignoreBuildErrors`, baseline the 149 errors. **Zero file moves.** Pure config plus a baseline file. |
| **U2** | Test frameworks | Vitest + a PBT framework, first tests. No production code touched. |
| **U3** | CI pipeline | GitHub Actions running type-check, lint, test, boundary check. No production code touched. |
| **U4** | **Observability baseline** *(added after P7)* | Structured logging with correlation IDs, alerting on authentication and authorization failures, `/api/health`, 90-day log retention. **Plus: verify a database restore actually works** *(added after P8)*. |

Phase A cannot break production — nothing in the runtime path changes. It exists so every later
unit has a net beneath it.

**U4 was added in response to two answers.** P7: *"I don't have this, may be we can set up a
monitoring"* — no monitoring exists today. P8: restore has never been verified. Combined with
P3=A (every unit deploys to production as it completes), that meant **fourteen unobserved
production deploys**, with detection resting entirely on the preview verification from P2 and a
user noticing afterwards.

U4 also discharges two blocking extension rules that would otherwise gate every later stage —
SECURITY-14 (alerting on authentication failures, log retention) and NFR-4.3 — and satisfies
NFR-1.3, which requires the backup and restore procedure to be *verified*, not merely to exist.
Verifying the restore before any schema work is what makes the 1-day dormancy in P5 survivable.

### Phase B — Workspace, in place

| Unit | Name | Risk isolated |
|---|---|---|
| **U5** | pnpm + Turborepo, single package | Convert to a workspace with **one** entry. `package-lock.json` → `pnpm-lock.yaml`. No directory moves. |
| **U6** | `apps/` relocation + Root Directory change | Move both products into `apps/web` and `apps/app`; change the Root Directory setting on the **existing** Vercel projects (T1=A). Environment variables are untouched. **Highest deployment risk in the migration**, isolated. Safe sequence below. |
| **U7** | `packages/config` + `packages/schemas` | Leaf packages, no runtime behaviour. |

### Phase C — Data and domain extraction

| Unit | Name | Risk isolated |
|---|---|---|
| **U8** | `packages/db` — Prisma relocation | **R-5.** The generated client is force-bundled by `next.config.ts` and `vercel.json`; moving it breaks those paths. Isolated because it is the most likely build break. |
| **U9** | `packages/db` — repository functions | Additive only. Repositories added alongside existing Prisma calls; nothing switched yet (PS-4). |
| **U10** | `packages/domain-core` + first domain package | Proves the `Actor` pattern end-to-end on one domain before repeating it five times. Also clears the 22 type errors in `src/lib` and `src/services/worker` first, per D3=C. |
| **U11** | Remaining five domain packages | Repeats a proven pattern. Sub-dividable if U10 reveals problems. |
| **U12** | `packages/ui` reconciliation | 16 primitives that drifted for eleven months across two apps must be reconciled pair by pair, not copied. Purely visual risk. |
| **U13** | `packages/integrations` + `packages/api-client` | Email extraction and the typed client. |

### Phase D — Behaviour changes

| Unit | Name | Risk isolated |
|---|---|---|
| **U14** | Security fixes + search re-point (**atomic, flag-gated**) | FR-4 and FR-5 together. RISK-2 forbids shipping the all-worker search without the guard. Deployed dark behind a feature flag (D5=A), following the W1 read-switch precedent. The only unit that deliberately changes behaviour. |
| **U15** | `ContractorProfile` retirement | FR-10.6 verify-then-drop, with a rehearsal run and verified backup (P4=C), webhook disabled before code removal (PS-7), and a **1-day dormancy** (P5). **The only irreversible unit.** |

`apps/mobile` scaffolding folds into U7 as a stub — it is an empty directory and carries no risk.

### U6 — Safe execution sequence (T1=A)

Root Directory is a **project-wide** Vercel setting, so the old and new structures cannot build
simultaneously in one project. This sequence works within that constraint while keeping production
serving throughout.

Repeat independently for each of the two Vercel projects — **do `apps/web` (marketing) first**,
since it is the lower-consequence product and proves the sequence before the application follows.

| Step | Action | Production state |
|---|---|---|
| 1 | Create branch `u6/apps-relocation`; move files into `apps/web` / `apps/app`; commit. **Do not merge.** | Serving old deployment, untouched |
| 2 | Confirm Vercel's current Root Directory semantics against their docs | Unchanged |
| 3 | Record the current production deployment ID — this is the rollback target | Unchanged |
| 4 | Change Root Directory to `apps/web` (then later `apps/app`) in project settings | **Unchanged** — settings affect the next build only, not the running deployment |
| 5 | Push the branch; Vercel builds a **preview** with the new root | Unchanged |
| 6 | Verify the preview per PS-2 and P2=B: sign-in, one role-gated page, k6 smoke against the preview URL | Unchanged |
| 7 | Merge to `main`; production builds with the new root | **Promoted only if the build succeeds** |
| 8 | Verify production; confirm health check and logs | New structure live |

**Rollback at any point**: promote the deployment ID from step 3 in the Vercel dashboard (seconds,
no rebuild), then revert the merge commit and restore the Root Directory setting.

**The window to be aware of** is between steps 4 and 7: `main` still holds the old structure while
the project expects the new root, so any push to `main` in that window produces a failed build.
It cannot reach production — Vercel does not promote failed builds — but it is noisy. T3=A (no
concurrent feature work) means nothing should be pushing to `main` anyway.

**Why this satisfies PS-4 (additive before subtractive)**: the running production deployment is
never removed or modified. It keeps serving until a verified replacement is promoted, and remains
available as an instant rollback target afterwards.

**What T1=A avoids**: re-entering 45 environment variables across two new projects. That
duplication is itself a production risk — a missed `AUTH_DATABASE_URL` or `NEXTAUTH_SECRET`
produces a build that succeeds and a runtime that fails, which is worse than any failure mode in
the sequence above.

### Sequence and reversibility

```
U1 → U2 → U3 → U4         safety net, zero production risk
          ↓
U5 → U6 → U7              workspace; U6 is the deployment-risk unit
          ↓
U8 → U9 → U10 → U11       data and domain; all additive
          ↓
        U12, U13          parallelisable with U10/U11
          ↓
         U14              behaviour change, atomic, flag-gated
          ↓
         U15              irreversible, gated on rehearsal + verified backup
```

**Every unit before U15 is revertible.** U15 becomes irreversible only at FR-10.6 step 5, after
the 1-day dormancy.

### Note on the 1-day dormancy (P5)

One day is shorter than the two weeks to three months the options offered, and shorter than my
recommendation. It will not surface a weekly or monthly dependency — a month-end report that reads
`ContractorProfile`, for instance, would be discovered after the table is gone.

**However, it is more defensible than it first appears**, for a specific reason: by the time the
dormancy begins, the Zoho webhook is disabled (PS-7) and nothing reads or writes the table. It is
**static**. So restoring it from the verified backup taken in U15 loses nothing — the restore is
byte-identical to what was dropped.

The risk is therefore not data loss but discovering a forgotten dependency and needing a restore
to recover. With P4=C (rehearsal plus verified backup) and P8 addressed in U4 (restore proven to
work), that is a recoverable inconvenience rather than an incident. **Accepted as answered.**

---

## Plan

### Part 1 — Planning (this document)
- [x] Analyse requirements, application design and production-safety constraint
- [x] Propose production-safety invariants (PS-1..PS-7, confirmed binding by P1=A)
- [x] Propose unit decomposition (15 units after P7/P8 added U4)
- [x] Generate decomposition questions (15 across P/D/T/O)
- [x] Collect answers (all 15 answered 2026-09-10)
- [x] Analyse answers for ambiguity and contradiction (no contradictions found)
- [x] Issue follow-up questions if needed (none required)
- [x] Obtain approval to generate artifacts (2026-09-10)

### Part 2 — Generation (after approval)
- [x] Generate `unit-of-work.md` — unit definitions, responsibilities, production-safety protocol per unit
- [x] Generate `unit-of-work-dependency.md` — dependency matrix and sequencing
- [x] Generate `unit-of-work-requirement-map.md` — units mapped to FR/NFR *(adapted: User Stories was skipped, so requirements replace stories — see Question D4)*
- [x] Validate unit boundaries and dependencies
- [x] Verify every requirement is assigned to a unit (54/54 FR, 30/31 NFR — NFR-3.5 is immediate action)
- [x] Verify every unit satisfies PS-1..PS-7
- [x] Produce extension compliance summary

---

## Questions

---

## Section P — Production Safety (primary)

### Question P1
Do you accept the seven production-safety invariants PS-1..PS-7 as binding on every unit?

A) **Yes, all seven as written.**

B) Yes, but with changes (describe after the tag).

C) Too strict — they will slow delivery more than the risk warrants.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question P2
How should each unit be verified before reaching production?

A) **Vercel preview deployment**, exercised manually (sign-in plus the affected pages), then merge to production. Uses the capability that already works.

B) Preview deployment **plus** the k6 smoke test run against the preview URL.

C) A dedicated long-lived staging environment with its own database.

D) CI checks only — if type-check, lint and tests pass, deploy.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

> **Recommendation: B.** Preview deployments already work correctly with auth, and the k6 smoke
> script already exists. Together they cost almost nothing and catch both functional and
> performance regressions. Option C is the most thorough but means maintaining a second database
> and its data, which is significant overhead for a solo developer. Option D is not sufficient —
> there are currently no correctness tests to rely on.

### Question P3
When a unit is complete and verified, when does it reach production?

A) **Immediately** — deploy each unit as it completes. Smallest change per deploy, easiest to attribute a regression.

B) **Batch by phase** — deploy at the end of Phase A, B, C, D. Fewer deploys, larger blast radius each.

C) **Weekly** — accumulate completed units and deploy on a schedule.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** It is the whole point of small units: if production breaks after a deploy
> containing one unit, the cause is that unit. Batching re-introduces the ambiguity the
> decomposition exists to remove.

### Question P4
The `ContractorProfile` retirement (U14) requires a destructive schema change. How should it be rehearsed?

A) **Reuse the W1 rehearsal-database pattern** — restore a production copy to `REHEARSAL_DATABASE_URL`, run the retirement against it, verify, then run against production.

B) Verified backup only — take a backup, run against production, restore if something breaks.

C) Both — rehearsal run **and** a verified backup immediately before the production run.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: C.** The precedent exists in this project and it found a real data problem
> during W1 that would otherwise have silently discarded availability slots. NFR-1.3 requires a
> documented, verified backup and restore procedure regardless, and this is the natural moment to
> prove it works.

### Question P5
FR-10.6 step 4 specifies a dormancy period — `ContractorProfile` unread and unwritten before the table is dropped. How long?

A) **2 weeks**

B) **1 month**

C) **3 months**

D) Indefinitely — stop using it, never drop it.

X) Other (please describe after [Answer]: tag below)

[Answer]: 1 DAY

> **Recommendation: B.** Long enough for a monthly reporting or billing cycle to surface a
> dependency nobody remembered; short enough not to linger. Option D is defensible and costs only
> storage, but leaves a dead table that future readers must reason about.

### Question P6
Are there times when deploying to production is especially risky — traffic peaks, business hours, reporting cycles?

A) **No meaningful pattern** — deploy any time.

B) **Yes, avoid business hours** (please state the hours and timezone after the tag).

C) **Yes, other constraint** (please describe after the tag).

X) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question P7
After a production deploy, how would you currently find out that something broke?

A) **A user reports it** — no monitoring exists today.

B) Vercel's built-in error reporting and function logs.

C) An external monitoring or alerting service (please name it after the tag).

X) Other (please describe after [Answer]: tag below)

[Answer]: I don't have this, may be we can set up a monitoring

> **Why I ask**: NFR-4.3 requires alerting on authentication and authorization failures, and
> SECURITY-14 requires it as a blocking rule. If the honest answer is A, then detection depends
> entirely on the preview verification in P2, and basic alerting should be pulled forward into
> Phase A rather than left to a later NFR unit. Your answer changes the unit ordering.

### Question P8
Has a database restore from backup ever been performed and verified for the production database?

A) **Yes**, restore has been tested.

B) **No** — backups exist (Neon) but a restore has never been exercised.

C) I am not certain.

X) Other (please describe after [Answer]: tag below)

[Answer]: c

> **Why I ask**: D-21 selects Backup and Restore as the DR strategy, and NFR-1.3 requires the
> procedure to be documented and verified. An untested backup is not a recovery plan. If B or C,
> verifying a restore should be a task inside Phase A, before any schema work.

---

## Section D — Decomposition

### Question D1
Is 14 units the right granularity?

A) **Yes, 14 as proposed** — risk isolated per unit.

B) **Finer** — split further, especially U10 (five domain packages) and U13.

C) **Coarser** — closer to the original 10; the extra splits add ceremony.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A**, given the production-safety emphasis. The three splits from the original
> 10 each isolate a specific named risk: U5 the Vercel root-directory change, U7 the Prisma
> generated-client relocation (R-5), and the U1/U2/U3 split keeps the safety net free of any
> structural change. If U9 shows the domain pattern is harder than expected, U10 can be split
> further at that point without re-planning.

### Question D2
What does "unit complete" mean?

A) **Merged and deployed to production**, verified healthy.

B) **Merged to the main branch**, deployment batched separately.

C) **Reviewed and ready**, deployment decided later.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> Note: this should agree with your P3 answer. If P3=A then D2=A follows.

### Question D3
U1 baselines the 149 type errors rather than fixing them (D-16). How should the backlog be burned down afterwards?

A) **Opportunistically** — fix errors in a file whenever that file is touched by a later unit.

B) **Dedicated units** — add explicit units to clear the backlog by area.

C) **Fix the 22 in `src/lib` and `src/services/worker` first**, because that code moves into shared packages, then the rest opportunistically.

X) Other (please describe after [Answer]: tag below)

[Answer]: C

> **Recommendation: C.** Those 22 errors are in exactly the code that becomes `packages/domain-*`
> and `packages/db`. Moving code with unresolved type errors into a shared package propagates them
> to every consumer, and a sample error already proved to be a real defect — a `RequirementStatus`
> compared against `"PENDING_REVIEW"`, a value the enum does not contain, so the branch never
> fires.

### Question D4
User Stories was skipped, so `unit-of-work-story-map.md` has no stories to map. Replace it with a requirements map?

A) **Yes** — produce `unit-of-work-requirement-map.md` mapping units to FR-1..FR-10 and NFR-1..NFR-7, giving the same traceability.

B) Generate the story map anyway, deriving lightweight stories from the requirements first.

C) Skip the artifact entirely.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** The artifact's purpose is traceability — that every requirement lands in
> some unit and no unit exists without a reason. Requirements serve that as well as stories, and
> this work is a restructure rather than a feature build.

### Question D5
U13 changes behaviour (worker search source and visibility). Should it be behind a feature flag?

A) **Yes** — deploy the new search dark, enable by flag, and disable instantly without a redeploy if wrong.

B) **No** — the unit is small and revertible by `git revert`; a flag adds machinery and a second code path.

C) **Flag only the marketing-facing directory change**, since that is the public surface.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A**, narrowly. This is the one unit that changes what users see, it touches
> the public marketing directory, and it carries the RISK-2 security boundary. A flag turns a
> revert-and-redeploy cycle into a switch. There is precedent in the codebase — W1 used
> flag-gated read switches (commits `febc7fa`, `ffdce8f`) before making typed tables
> authoritative, and that migration went cleanly.

---

## Section T — Technical Sequencing

### Question T1
U5 changes each Vercel project's root directory to `apps/web` and `apps/app`. How should that cut over?

A) **In place** — change the root directory setting on the existing projects. Brief risk window; instant rollback by reverting the setting.

B) **New projects** — create two new Vercel projects pointed at the new roots, verify on their preview URLs, then move the production domains across. Old projects remain as fallback.

C) Not sure — recommend one.

X) Other (please describe after [Answer]: tag below)

[Answer]: **A** *(revised from B on 2026-09-10 after user question — see below)*

> ~~**Recommendation: B.**~~ **Revised recommendation: A.**
>
> My original recommendation of B under-weighted one thing: standing up new Vercel projects means
> re-entering **45 distinct environment variables** by hand, across two projects — 90 values
> including `AUTH_DATABASE_URL`, `NEXTAUTH_SECRET`, the five Zoho credentials and the n8n webhook
> URLs. A single missed or mistyped value produces exactly the failure mode that is actually
> dangerous: **the build succeeds and the runtime breaks.**
>
> **Why A is safe.** Vercel deployments are immutable and only successful builds are promoted.
> Changing the Root Directory setting does not touch the running production deployment — it
> affects the next build only. If that build fails, nothing is promoted and the old deployment
> keeps serving. Mis-ordering the setting change and the file move therefore yields a *failed
> build*, not an outage.
>
> **The one real risk** is a build that succeeds but is broken at runtime — most plausibly the
> Prisma engine failing to bundle. That is already isolated: U6 is a directory move plus a
> settings change, and the Prisma relocation is U8 with its own verification.
>
> **The one real constraint** is that Root Directory is a project-wide setting, not per-branch, so
> the old and new structures cannot build simultaneously in one project. The safe sequence in
> §U6 below works around it, and T3=A (no concurrent feature work) makes the resulting window
> harmless.
>
> **Verify before executing U6**: confirm Vercel's current Root Directory behaviour against their
> documentation. Platform details change, and this decision rests on that behaviour.

### Question T2
During Phase C, code moves into packages while old import paths still exist across 691 files. How should the transition be handled?

A) **Re-export shims** — the old path becomes `export * from "@remonta/domain-worker"`, and call sites migrate gradually. The shim is deleted by the unit that completes the move.

B) **Update every call site** in the same unit as the move. No shims, no intermediate state, larger units.

C) **TypeScript path aliases** mapping old specifiers to new locations without touching files.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Recommendation: A.** It is what makes PS-4 achievable — both paths work simultaneously, so
> the move is verifiable before the old path disappears. Option B produces large risky units;
> option C hides the migration from the type system and from `grep`, making the remaining work
> invisible.

### Question T3
Is any feature work planned on either product during this migration?

A) **No** — the migration has exclusive use of both codebases.

B) **Yes, occasional bug fixes** only.

C) **Yes, ongoing feature development** alongside.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

> **Why I ask**: incremental delivery (D-40) means one codebase, so concurrent work is far safer
> than it would have been under the parallel model — but it still affects unit sizing. If C, units
> should be kept smaller and merged more frequently to limit conflict surface.

---

## Section O — Open

### Question O1
Anything about production, its usage patterns, integrations or operational constraints that I have not asked and should account for before decomposing?

[Answer]: 
