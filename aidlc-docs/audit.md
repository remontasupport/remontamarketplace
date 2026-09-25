# AI-DLC Audit Log — New Backend System

Append-only. Every user input is logged verbatim.

---

## 2026-09-24T13:53:59+05:30 — Workflow start

**User input (verbatim):**
> Let's start ai dlc

**User input (verbatim):**
> let us start new AI DLC, i am creating a new backend system

**AI action:** Showed the welcome message. Ran Workspace Detection.
- `aidlc-docs/aidlc-state.md` was not on disk, so a new cycle was started (the previous cycle stays in git `HEAD`).
- Existing code found: TypeScript monorepo (`apps/app`, `apps/web`, `packages/*`), pnpm + Turborepo.
- Found `.brd/` business-requirements reverse engineering (phases 0–8).
- Reverse Engineering deferred until the new backend's relationship to the existing system is known (Requirements Q1–Q3).

**AI action:** Began Requirements Analysis. The intent is vague ("a new backend system"), so Standard/Comprehensive depth is expected. Created `aidlc-docs/inception/requirements/requirement-verification-questions.md` (23 questions, including the 3 extension opt-ins). Awaiting answers.

---

## 2026-09-24 — Requirements verification answers received

**User input (verbatim):**
> ANSWERED

**Answers recorded** (from `requirement-verification-questions.md`):
Q1 A ("we will optimize the system architecture of the backend as well and improve each code logic.") ·
Q2 C · Q3 B · Q4 A and B · Q5 A ·
Q6 "I am planning to use a separate tech, I am choosing between Nest or Nuxt, but what is the best backend? I am open to your recommendation" ·
Q7 A ("but I am open to your suggestions") · Q8 D ·
Q9 "Can we do A, but we will clean and fix the schema along the way" ·
Q10 A · Q11 "I am planning to a container platform" · Q12 A · Q13 B · Q14 C · Q15 A ·
Q16 B · Q17 C · Q18 B · Q19 A · Q20 A · Q21 A · Q22 A · Q23 A

**AI action — extensions:** Security Baseline, Resiliency Baseline and Property-Based Testing (full enforcement) enabled. Full rule files loaded.

**AI action — Q20:** Restored the previous cycle's `aidlc-docs/` from git `HEAD` (`git archive`) into `aidlc-docs/archive/monorepo-migration/` — 46 of 46 files.

**AI action — facts checked for the analysis:**
- `apps/app` uses `next-auth ^4.24.11`, JWT strategy, `maxAge` 30 days (`apps/app/src/lib/auth.config.ts:277-282`), with no server-side session record.
- The Neon database host is `ap-southeast-2.aws.neon.tech` (Sydney). Only the hostname region was matched; no secret values were read.

**AI action — contradictions/ambiguities found:**
1. Q2 C (independent, sharing nothing) vs Q5 A / Q9 A / Q10 A / Q15 A (shared DB, auth, callers, side-by-side migration)
2. Q6/Q7 — framework recommendation requested (NestJS recommended over Nuxt); where the code lives is unresolved
3. Q8 D (REST external + tRPC internal) vs Q5 A (only `apps/app` calls it; tRPC is not native to NestJS)
4. Q9 (clean the schema in place) + Q15 (run side by side) — how to evolve a schema two systems use
5. Q10 A (keep NextAuth v4 30-day JWT) vs Q21 A — fails SECURITY-12 (server-side expiry / logout invalidation) and SECURITY-08 (audience/issuer); also Q4 A scope of "identity"
6. Q13 B (backend becomes system of record) vs first-release scope Q4 A, B — what the first release does with Zoho
7. Q17 C only — Privacy Act / NDIS / audit trail possibly applicable; SECURITY-13 requires a change audit anyway
8. Q17 C — how far data residency reaches (Blob, Redis, host, queue, observability not verified)
9. Q11 — which container platform (needs an Australian region)
10. Q19 A (1–2 months, 1–2 devs) vs overall scope
11. Q3 B — `.brd/` in/out-of-scope list not yet given; a proposal was offered

**AI action — Resiliency questions required at Requirements:** RESILIENCY-02 (RTO/RPO), -08 (regional topology), -03 (change management), -04 (CI/CD, rollback, deployment style), -15 (incident response).

Created `aidlc-docs/inception/requirements/requirements-clarification-questions.md` (11 clarifications + 7 resiliency questions). Awaiting answers.

---

## 2026-09-24 — Clarification answers (round 1) received

**User input (verbatim):**
> answered

**Answers recorded** (from `requirements-clarification-questions.md`):
Clarification 1 A · 2 a · 3 a · 4 A · 5 a · 6 b · 7 a · 8 A · 9 A · 10 A · 11 A ·
Resiliency 1 (RTO/RPO) C · Resiliency 2 (topology) C · Resiliency 3 (change mgmt) A ·
Resiliency 4 (CI/CD) "A, and open for improvement" · Resiliency 5 (rollback) d ·
Resiliency 6 (deployment style) d · Resiliency 7 (incident response) a

**Resolved:** a separate NestJS service in `apps/api`, sharing the existing database and auth; REST + OpenAPI; expand/contract schema changes via `packages/db`; NextAuth kept with server-side session revocation and short-lived signed tokens to the backend; Zoho not touched in the first release; Privacy Act/APPs + NDIS + full audit trail + AU residency for primary data; AWS ECS Fargate in `ap-southeast-2`; keep the date and narrow the first release; `.brd` scope as proposed; change management = the CLAUDE.md process; CI/CD = GitHub Actions (open to improvement); canary deployments.

**Remaining conflicts found:**
1. Resiliency 1 C (Warm Standby — active-passive) vs Resiliency 2 C (active-active); the Neon database is a single-region primary; Clarification 10 A (keep the date)
2. Resiliency 5 D (database-reversing rollback) vs Clarification 4 A (expand/contract, forward-only)
3. Resiliency 7 A chosen, but no process reference given (RESILIENCY-15 requires one by name)

Created `aidlc-docs/inception/requirements/requirements-clarification-questions-2.md` (3 questions). Awaiting answers.

---

## 2026-09-24 — Clarification answers (round 2) received

**User input (verbatim):**
> ANSWERED

**Answers recorded** (from `requirements-clarification-questions-2.md`):
2.1 A (single region, multi-AZ in Sydney; cross-region deferred) · 2.2 A (forward-only migrations + redeploy the previous pinned image) · 2.3 B (AI-DLC proposes a lightweight incident process)

**AI action:** No remaining contradictions. Read `.brd` phases 2–5 in full for the in-scope domains. Created `aidlc-docs/inception/requirements/requirements.md` (Comprehensive depth; FR-ID, FR-REG, FR-ONB, FR-CMP, FR-ACC, FR-NOT, FR-AUD, FR-MIG/FR-INT; NFR-PERF/SEC/CMP/OBS/RES/TEST/MNT; 9 open issues; extension compliance summary — no blocking findings).

**Assumptions flagged for review:** OI-05 (FR-INT-01: keep the existing n8n worker-registration notification when registration moves to the backend); OI-06 (proposed SLA 99.9 %, AZ-failure RTO ≤ 30 min, RPO ≤ 5 min).

**User Stories assessment:** Execute — High Priority criteria met (multi-persona system: worker/admin/client/coordinator; complex business logic: four state machines, requirements engine, publication rules). OI-01..OI-04 are business decisions best settled in story planning.

**Approval prompt presented:** Requirements Analysis complete — review `requirements.md`; request changes or approve and continue to User Stories.

---

## 2026-09-24 — Workflow paused (out-of-band change requested)

**User input (verbatim):**
> Ohh before we proceed. I want to update the provider agreement in the workers dahsboard first. Is that possible

**AI action:** AI-DLC paused at the Requirements Analysis approval gate (requirements.md not yet approved). The provider agreement change is handled as a separate change to `apps/app` (`apps/app/src/config/contractContent.ts` — `ABN_CONTRACT`, "Remonta Platform Provider Agreement") on its own branch/PR, outside this cycle. Resume point: Requirements Analysis approval → User Stories.

---

## 2026-09-25 — Workflow resumed

**User input (verbatim):**
> Let's continue the AI DLC

**AI action:** Checked the out-of-band change first: PR #10 (`fix/provider-agreement-v3`) is merged, and `origin/main` = `25eb04e` (checked with `git ls-remote`). Resumed at the Requirements Analysis approval gate. OI-05 (FR-INT-01) and OI-06 (NFR-RES-02) need a decision at this review before approval. Presented the approval prompt again.

---

## 2026-09-25 — Requirements review decisions and approval

**Approval prompt presented:** OI-05 (keep the n8n registration webhook?), OI-06 (SLA 99.9 % / RTO ≤ 30 min / RPO ≤ 5 min?), and "is requirements.md approved so we can continue to User Stories?"

**User input (verbatim):**
> OI-05: "Keep it (Recommended)" · OI-06: "Accept as proposed (Recommended)" · Approval: "Approve, continue"

**AI action:** Recorded OI-05 and OI-06 as resolved in `requirements.md` (FR-INT-01, NFR-RES-02, §8, RESILIENCY-02 row). **Requirements Analysis approved.**

---

## 2026-09-25 — User Stories: Part 1 Planning

**AI action:** Assessment written to `aidlc-docs/inception/plans/user-stories-assessment.md` (decision: Execute; multi-persona system, complex business logic, UX changes, customer-facing API). Story plan written to `aidlc-docs/inception/plans/story-generation-plan.md`, with 13 questions: Part A, story approach (Q1–Q9); Part B, the business decisions deferred from requirements, OI-01 catalogue (Q10), OI-02 publication preconditions (Q11), OI-03 gender field (Q12), OI-04 bank details (Q13). Awaiting answers.

---

## 2026-09-25 — User asked what the story plan means

**User input (verbatim):**
> I am not sure about the terms you used on the story-plan, what is the story all about? is it for technical?

**AI action:** Explained in plain language what user stories are, what the plan's terms mean, and which questions need a business decision. No answers recorded yet.

---

## 2026-09-25 — Story plan answers received

**User input (verbatim):**
> ANSWERED

**Answers recorded** (from `story-generation-plan.md`):
Q1 A · Q2 A · Q3 A · Q4 A · Q5 A · Q6 A · Q7 A · Q8 A · Q9 A · Q10 (OI-01) A · Q11 (OI-02) C · Q12 (OI-03) A · Q13 (OI-04) A

**Answer analysis (Step 9):** Q1–Q9 and Q12 are clear and consistent. Q10 A agrees with Q11 C (new obligations become PENDING; no automatic unpublish). Gaps found:
1. Q10 A: `categories.json` has 7 service lines; the live app has 9. Home Modifications and Fitness and Rehabilitation have no document list, and Personal Trainer is named differently (`.brd/phase-4` §4.3)
2. Q11 C: it is undefined whether legally required checks (NDIS Worker Screening, WWCC, police, ID, right to work) can be overridden, and what happens when a document expires after publication
3. Q13 A: bank details are now needed, but no consumer or access path is defined (today nothing reads them)

Created `aidlc-docs/inception/plans/story-plan-clarification-questions.md` (Follow-ups 1, 2a, 2b, 3). Awaiting answers.

---

## 2026-09-25 — Story plan follow-up answers received

**User input (verbatim):**
> answered

**Answers recorded** (from `story-plan-clarification-questions.md`):
Follow-up 1 A (Home Modifications → Home and Yard Maintenance list; Fitness and Rehabilitation = Personal Trainer) · 2a A (ID, NDIS screening, police check, right to work, WWCC where required cannot be overridden) · 2b A (stays live and flagged; auto-offline if an always-required document expires) · 3 C (bank details are never shown on screen; sent only to a payroll/accounting system)

**Answer analysis:** 1, 2a and 2b are clear and consistent with Q10 A and Q11 C. Follow-up 3 C is incomplete: the target system isn't named (the option asked for it), and it adds a new outbound integration, which works against C10 A (fixed date, narrowed scope).

Created `aidlc-docs/inception/plans/story-plan-clarification-questions-2.md` (3.1 target system, 3.2 timing). Awaiting answers.

---

## 2026-09-25 — Story plan round-2 answers received

**User input (verbatim):**
> answered

**Answers recorded** (from `story-plan-clarification-questions-2.md`): 3.1 C (payroll system not decided) · 3.2 A (integration deferred to the next release; first release stores bank details encrypted, no one reads them, worker sees a masked version)

**Answer analysis:** Consistent; nothing remains ambiguous. The undecided target system becomes new open issue **OI-10** (resolve before the next release). Added a "Resolved decisions" section to `story-generation-plan.md`.

**Approval prompt presented (2026-09-25):** "The story plan is complete and all questions are resolved. Review `aidlc-docs/inception/plans/story-generation-plan.md` (see 'Resolved decisions'). Approve the plan to start generating personas.md and stories.md, or request changes."

---

## 2026-09-25 — Story plan approved

**User input (verbatim):**
> approve, continue

**AI action:** Story plan approved. Starting Part 2 (Generation): personas.md, then stories.md, following the Part C checklist.

---

## 2026-09-25 — User Stories generated

**AI action:** Generated `aidlc-docs/inception/user-stories/personas.md` (P1 Worker with variations V1–V6, P2 Administrator, P3 Account holder; system actors S1–S4) and `aidlc-docs/inception/user-stories/stories.md` (55 stories in 8 epics: E1 Identity 7, E2 Registration 6, E3 Onboarding 10, E4 Compliance 12, E5 Account & Access 6, E6 Notifications 4, E7 Audit 3, E8 Migration 7; 15 PBT properties). Checked: every FR in `requirements.md` appears in the traceability matrix. Recorded the OI-01..OI-04 resolutions in `requirements.md` §8, updated FR-ONB-09 and FR-CMP-07 to match, and added OI-10 (payroll system undecided). Plan checklist items 1–5 marked done.

**Approval prompt presented (2026-09-25):** "User Stories Complete. Review `stories.md` and `personas.md`. Request changes, or approve and continue to Workflow Planning."

---

## 2026-09-25 — User Stories approved

**User input (verbatim):**
> approve, continue

**AI action:** User Stories approved. Stage marked complete. Starting Workflow Planning (includes resolving OI-09: how much the reverse engineering needs refreshing).

---

## 2026-09-25 — Workflow Planning

**AI action:** Wrote `aidlc-docs/inception/plans/execution-plan.md`. Risk: High (shared production DB, auth changes, regulated data, fixed date; strangler switch-back keeps it below Critical). Stages: Reverse Engineering EXECUTE as a targeted refresh (OI-09; the archived RE predates the monorepo move, 186 commits since `c541580`; three Prisma schema files found); Application Design, Units Generation, Functional Design, NFR Requirements, NFR Design, Infrastructure Design, Code Generation, Build and Test all EXECUTE. Flagged scope vs. date: units ordered so the release can stop at a unit boundary.

**Approval prompt presented (2026-09-25):** "Workflow Planning Complete. Review execution-plan.md. Request changes, or approve and continue to Reverse Engineering (targeted refresh)."

---

## 2026-09-25 — Workflow Planning approved, with architecture direction

**User input (verbatim):**
> Approved but I also want you to give importance to the system architecture design. I want every API to be secure. I also want to have a centralize system for the API, for example I don't want to create another file if I create another API if that makes sense. I want you to apply an advance architecture, not only a layer by layer design.

**AI action:** Execution plan approved. The three directions were added to `requirements.md` as NFR-ARCH-01..03 and weighted into Application Design. Their exact meaning is open, so they get clarification questions (`aidlc-docs/inception/application-design/architecture-direction-questions.md`) answered before Application Design; Reverse Engineering proceeds in the meantime.

---

## 2026-09-25 — Reverse Engineering (targeted refresh) complete

**AI action:** Four parallel read-only code agents mapped identity/auth, registration/onboarding, compliance/notifications and data/platform at HEAD `8e530c1`. Wrote 9 artifacts to `aidlc-docs/inception/reverse-engineering/`, including `security-findings.md`. The source-of-truth schema is `packages/db/prisma/schema.prisma` (the other three are legacy or reference). OI-09 resolved.

**Live production findings recommended for immediate hotfix (outside this cycle):** H1 bank details returned by the unauthenticated server action `getWorkerProfilePreview` (verified by direct reading); H2 account takeover through `/api/auth/setup-password` (default password + email only); H3 the public worker feed ignores `isPublished`; H4 identity documents stored as public blobs.

**Approval prompt presented (2026-09-25):** "Reverse Engineering Complete. Review aidlc-docs/inception/reverse-engineering/. Request changes, or approve and continue to Application Design (after the architecture-direction questions are answered). Separately: approve hotfixes H1–H3 (and check H4)?"

---

## 2026-09-25 — Architecture direction: Q2 answered + security reference

**User input (verbatim):**
> I only answered Q2, but I want you to have this reference when I am saying a dyanmic and secured API
>
> 1. Do not trust the Front End. Back-end will always verify who's the users are and what they only can do
>
> 2. Access Control , always validate, who's making the requests? What action they are trying to perform? and which resource?
>
> 3. Business Logic, validate the entire user's journey, not just individual API, because if the flow breaks, the system will get abused
>
> 4. External APIs, always validate responses and have our own security layer
>
> 5. SSRF
>
> 6. Security Configuration, make sure the environment is secure, not just the code.
>
> 7. API Inventory
>
> 8. Rate Limiting, always limit request
>
> 9. Input Validation, always validate and sanitize users input, before processing them. Do not trust all inputs
>
> 10. Do not expose sensitive data. Sometimes it is the response that has the problem. Always return the data that is only necessary

**Answers recorded** (from `architecture-direction-questions.md`): Q1 blank · Q2 A (modular monolith, bounded contexts, hexagonal, outbox, CQRS-lite) · Q3 blank

**AI action:** Added NFR-ARCH-04 to `requirements.md` §6.8: the ten principles (P1–P10) mapped to OWASP API Security Top 10 (2023), with the enforcement mechanism for each and the RE findings that break it today. Recorded Q2 A in NFR-ARCH-03. Interpretation offered: the reference sets the Q3 security bar at option A **plus** P3/P4/P5/P9/P10 (A alone does not cover them); asked the user to confirm. Q1 is still unanswered. RE approval and the H1–H3 hotfix decision are still pending.

---

## 2026-09-25 — Architecture direction settled; RE approved; hotfixes approved

**Question presented (chat):** Q1 central API form; Q3 security bar = A + the ten principles?; hotfixes H1–H3?; RE approval.

**User input (verbatim selections):**
> Q1: "One contract per area (Recommended)" · Q3: "Yes, A + all 10 points (Recommended)" · Hotfixes: "Yes, H1 → H2 → H3 (Recommended)" · RE: "Approve"

**AI action:** Recorded Q1 A and Q3 A+P1–P10 in `architecture-direction-questions.md` and in NFR-ARCH-01/02 of `requirements.md`. **Reverse Engineering approved.** Next AI-DLC stage: Application Design. The hotfixes H1 → H2 → H3 run first, outside the cycle, each as its own branch and PR per CLAUDE.md; H4 feasibility check (Vercel Blob private access) to follow.

---

## 2026-09-25 — Hotfix H1 (outside the cycle)

**AI action:** Branch `fix/h1-bank-details-exposure` from `main` (`25eb04e`); commit `03b36d1` removes `bankAccount` from `getProfilePreviewData` (`services/worker/profilePreview.service.ts`) and `fetchProfileByUserId` (`lib/profileData.ts`): 2 files, 4 deletions. Local verification: the workspace links were broken (the repo was moved from `Desktop\Remonta`), so dependencies were reinstalled (`pnpm install --frozen-lockfile --ignore-scripts`, after the Windows EPERM on the Prisma engine); then `@remonta/app` quality passed (type-check within baseline, eslint 516 known, 62/62 tests) and `turbo run build --filter=@remonta/app` passed. Pushed; the PR is to be opened by the user from the compare URL (`gh` not installed). Regenerated Prisma clients and aidlc-docs are not in the commit.

---

## 2026-09-25 — Hotfixes H2, H3 pushed; H4 assessed (outside the cycle)

**AI action:**
- **H2:** branch `fix/h2-setup-password-takeover`, commit `cafc173`. `/api/auth/setup-password` now takes an email only; for an ACTIVE worker still on the default password it issues the existing single-use 1 h reset token and sends the reset email; the response is identical in all cases. `/setup-password` page reduced to an email form. Quality (ts 149 known, eslint 517 known, 62/62 tests) and build passed.
- **H3:** branch `fix/h3-published-workers-only`, commit `2b06553`. `isPublished: true` added to the where-builders of `api/public/workers` and `api/client/workers`; `api/client/workers/by-ids` deliberately unchanged (it resolves already-assigned workers). Quality (eslint 518 known) and build passed. **Flagged:** search results will shrink to published workers only; the published count was not checked (no DB access taken).
- **H4:** `@vercel/blob` 2.8.0 supports `access: 'private'` + `get()`. The fix needs private uploads, an authorised download route and a migration of existing public blobs; that is larger than a hotfix. Store region unconfirmed (OI-07). Decision requested from the user.
- PRs are to be opened by the user from the compare URLs (`gh` not installed).

---

## 2026-09-25 — Workflow change requested: worker sign-up first

**User input (verbatim):**
> actually can we start with the sign up worklflow for the workers? Let us organize all the codes connected to it and change backend simutaneously

**AI action:** Treated as a mid-workflow sequencing change (`common/workflow-changes.md`): the worker registration journey (E2, J1) becomes the first vertical slice, built end to end, instead of designing all domains first. Asked the user to confirm the approach and the decisions it forces early (depth of design for the slice, where `apps/api` runs before Infrastructure Design, what "organize" covers in `apps/app`).

---

**Question presented (chat):** approach, hosting, scope of "organize", registration photo.
**User input (verbatim selections):**
> Approach: "Short design, then code (Recommended)" · Hosting: "Local + CI first (Recommended)" · Organize: "Group + remove dead code (Recommended)" · Photo: "Keep public for profile photos (Recommended)"

**AI action:** Execution plan amended: **Slice 1 = Worker Registration** (US-REG-01..06, US-NOT-01; plus the platform core it needs). The slice goes through a compressed Application Design + Functional Design (one document, `aidlc-docs/construction/S1-registration/S1-design.md`), then Code Generation and Build & Test. `apps/api` runs locally and in CI; the `apps/app` switch stays on "legacy" until Infrastructure Design delivers AWS Sydney. The registration photo stays on current public storage, uploaded only through the backend. Full Application Design for the other domains follows, built on the same core.

---

## 2026-09-25 — Slice 1 design drafted

**AI action:** Wrote `aidlc-docs/construction/S1-registration/S1-design.md`:
- **Backend core:** `apps/api` layout, ts-rest contract system with security metadata, an 11-step central pipeline mapped to P1–P10, a Postgres outbox with dispatcher, SafeHttpClient, persistence, config, observability.
- **Registration module:** endpoints, staged photo upload, strict shared schema, journey rules R1–R5, events, expand-only data changes.
- **`apps/app`:** feature folder, removals, runtime switch.
- **Tests,** plus a P1–P10 checklist.

Three questions are embedded (n8n payloads, HIBP failure behaviour, Docker for DB tests).

**Approval prompt presented (2026-09-25):** "Review S1-design.md, answer Q1–Q3, then approve to start code generation on branch s1/worker-registration."

---

## 2026-09-25 — S1 design approved; data-model question raised

**User input (verbatim):**
> Approved, but before we proceed. i want you to examine also how it should be save to the database schema, since the primary requirement for a match is the location, should we save it to the other table?. Think also that this flow is the very first step of the pipeline, Meaniing the flow is this. After the worker's sign up, they now passed to the 1st pipeline, when they sign in, they need to complete the second pipeline which is submitting a documents. Now this is very important because I want to have a clear vision of who are stuck in the 1st pipeline and who are in the progress or completed the second pipeline? what will be our marker to track that? I am open to restructure the database.

**AI action:** S1-design approved (Q1–Q3 still blank). Wrote `aidlc-docs/construction/S1-registration/S1-data-model.md`:
- **Location:** `au_localities` (ABS open data, PostGIS) and `worker_locations` (HOME + SERVICE_AREA, travel radius). Registration places a worker at the locality centroid, so no geocoding is needed at sign-up. Legacy columns are dual-written during the transition.
- **Pipeline marker:** `worker_onboarding` (a single `stage` enum SIGNED_UP → DOCUMENTS_IN_PROGRESS → DOCUMENTS_SUBMITTED / ACTION_REQUIRED → VERIFIED → PUBLISHED, with milestone timestamps and counts) plus the append-only `worker_onboarding_transitions`. The stage is derived by the pure `deriveStage`; a reconciler covers legacy writers; existing workers are backfilled.

Decisions requested in chat.

---

## 2026-09-25 — Session resumed

**User input (verbatim):**
> let us continue the ai dlc, where we left at?

**AI action:** Read `aidlc-state.md`, the audit tail and both S1 documents. Position: S1-design approved; `S1-data-model.md` awaiting approval; S1-design Q1–Q3 unanswered; the data-model decisions (Questions 4–6) were asked in chat last session and never answered or recorded in the document. Re-presented all open decisions. `origin/main` is still `25eb04e`, so hotfix PRs H1–H3 are not merged.

---

## 2026-09-25 — Location tables explained

**User input (verbatim):**
> I want to be clear and understand each table. Can you produce the table for the location first? Also will the old table interrupted? is there any migration after we publish this workflow?

**AI action:** Explained `au_localities` and `worker_locations` column by column, with example rows. Confirmed that `worker_profiles` location columns are not dropped or altered (58 files in `apps/app` read them) and are dual-written in the same transaction. Set out the migration sequence: the expand migrations and data load before release, the backfill after it, and the contract step later, once search has moved.

---

## 2026-09-25 — Service areas clarified

**User input (verbatim):**
> So in the app. the workers can set multiple service location? is that the design?

**AI action:** Clarified that the table allows multiple SERVICE_AREA rows, but Slice 1 sign-up creates only the HOME row. No UI for service areas exists today (`LocationsSection` is a stub). Whether workers get a screen to add service areas is an open product decision for the onboarding slice. Asked the user.

---

## 2026-09-25 — Default radius; suburb data source

**User input (verbatim):**
> Let us set to 50kms. Also I want to fix the suburb api as well. I believe what I am currently using is incomplete locations in Australia, can you see on the internet a free API that lists all the suburb, locations in AU

**AI action:**
- The default `travel_radius_km` is set to 50 in `S1-data-model.md` §4. Service-area option (A/B/C) not yet chosen.
- Current suburb lookup (`apps/app/src/app/api/suburbs/route.ts`, `actions/suburbs.ts`) uses Google Places `types=(cities)`, keeps 5 results, and drops any without a postcode: the cause of missing suburbs.
- Researched free sources. Australia Post data is paid for commercial use. Community CSVs (Matthew Proctor, GitHub lists) derive from it, so their licence is unclear. ABS SAL is CC BY 4.0 but has no postcodes. Recommended Geoscape G-NAF + Localities (data.gov.au, open EULA based on CC BY 4.0, quarterly) loaded into `au_localities` behind our own endpoint. Doc updated, pending confirmation.

---

## 2026-09-25 — G-NAF and option A confirmed; locality refresh process

**User input (verbatim):**
> Yes use G-NAF, option A, BUT HOW DO WE UPDATE THE TABLE? SHOULD IT BE UPDATED?

**AI action:** Confirmed in `S1-data-model.md`:
- G-NAF is the source.
- Service areas: option A, radius only, default 50 km; the SERVICE_AREA kind is kept unused.

Added §2.1a, the refresh process: every six months, a reviewed script loads the release into staging, prints a diff report, then applies it on approval. Rows are upserted on `gnaf_locality_pid`; dropped localities are retired (`retired_at`, `superseded_by`), never deleted. Added those three columns to `au_localities`.

---

## 2026-09-25 — Onboarding tables explained

**User input (verbatim):**
> yes, show me the onboarding tables

**AI action:** Explained `worker_onboarding` and `worker_onboarding_transitions` column by column, with example rows. Covered the stages, the "stuck" thresholds, how the stage is kept correct, the effect on existing columns, and migrations. Asked about profile sections (Question 6) and the stuck thresholds.

---

## 2026-09-25 — Onboarding decisions

**User input (verbatim):**
> FOR 1, I take your recommendation, 2 also

**AI action:** Recorded in `S1-data-model.md`:
- Profile sections are tracked as progress within a stage, not as a stage of their own.
- The "stuck" thresholds (7 / 14 / 3 business / 7 / 3 business days) are confirmed as configurable defaults.
- Status line updated: data-model decisions complete.

S1-design Q1–Q3 are still open; asked again.

---

**Question presented (chat):** S1-design Q1 (n8n), Q2 (HIBP outage), Q3 (test database).
**User input (verbatim selections):**
> n8n: "Keep both (Recommended)" · HIBP down: "Accept and log (Recommended)" · Test DB: "Docker (Recommended)"

**AI action:** Recorded Q1 = A, Q2 = A, Q3 = A in `S1-design.md` §7. `docker` is not installed on this machine yet; flagged to the user. `aidlc-state.md` now points to the S1 code generation plan as the next step.

---

## 2026-09-25 — Branch created; S1 code generation plan written

**User input (verbatim):**
> yes, go ahead with the branch and plan

**AI action:**
- Created `s1/worker-registration` from `origin/main` @ `25eb04e` (upstream unset, so a push can't target `main`). The uncommitted aidlc-docs came with it; `fix/h3-published-workers-only` is unchanged.
- Wrote `aidlc-docs/construction/plans/S1-code-generation-plan.md`: 12 steps, one commit each. It records where the data model supersedes S1-design (`localityId`, no geocoding at registration, a localities endpoint, the reconciler and backfills).
- One correction: `au_localities` is unique on `(gnaf_locality_pid, postcode)`, one row per suburb–postcode pair.
- Found constraints and recorded them in the plan:
  - migrations need a tested `down.sql` and a production apply approved separately;
  - `apps/api` isn't in production during S1, so the suburb fix reaches production through `apps/app` `/api/suburbs` reading `au_localities`;
  - no Python or Docker on this machine, so the G-NAF loader is written in TypeScript;
  - the reCAPTCHA keys already exist.
- **Approval prompt presented:** "Approve the S1 code generation plan to start step 1."

---

## 2026-09-25 — S1 plan approved; step 1 started

**User input (verbatim):**
> approved, start step 1

**AI action:** Plan approved and moved to PART 2 — GENERATION. `S1-data-model.md` §2.1 is updated with the `(gnaf_locality_pid, postcode)` key. Starting step 1 (`packages/db` schema and expand migrations).

---

## 2026-09-25 — S1 step 1: schema and expand migrations

**AI action:**
- `packages/db/prisma/schema.prisma`: 7 models, 6 enums, 3 nullable `WorkerProfile` columns and `AuditAction.ACCOUNT_REGISTERED`.
- Five migrations, each with a `down.sql`: `s1_postgis`, `s1_localities`, `s1_worker_locations`, `s1_onboarding`, `s1_registration`. Hand-written parts that Prisma can't express:
  - GENERATED geography `point` columns;
  - the partial unique HOME index;
  - CHECK constraints (states including OT, postcode, coordinate bounds, one radius on HOME only, onboarding counts).
- The `s1_registration` down refuses to run while audit rows use the new enum value.
- **Deviation:** the second Prisma generator moved to step 5. In the shared schema it would also run in the `apps/app` Vercel build, which is the U5 failure path.
- **Verified:**
  - `prisma validate`;
  - offline coverage: every statement from `migrate diff` is present; the only differences are the GENERATED columns;
  - `@remonta/app` quality: ts 149, eslint 518, 62/62 tests;
  - `@remonta/schemas` quality.
- **Not yet verified (needs Docker):** applying forward and down on a real PostGIS database, and a drift check.
- Regenerated `client/` and `apps/web` clients differ only in absolute paths; not committed.

---

## 2026-09-25 — Docker not yet installed

**User input (verbatim):**
> I haven't installed the docker yet

**AI action:** Proposed carrying on with the work that needs no database (steps 3 and 4, and the build half of step 2 against fixtures). Database verification of step 1 is deferred until Docker is installed, or a Neon branch is used instead. Asked the user which to do.

---

## 2026-09-25 — Docker troubleshooting

**User input (verbatim):**
> I've installed it already but the terminal says docker --version
> 'docker' is not recognized as an internal or external command,
> operable program or batch file.

**AI action:** Diagnosed:
- Docker Desktop 29.8.0 is installed per user (`%LOCALAPPDATA%\Programs\DockerDesktop`), and its `resources\bin` is on the user PATH. The existing terminal predates the install.
- The engine isn't running.
- WSL isn't installed, and no hypervisor is active.

Gave the user the fix steps.

---

## 2026-09-25 — Session paused

**User input (verbatim):**
> I'll restart now, did you save this state so I can comeback later?

**AI action:** Updated `aidlc-state.md` with the exact resume point and committed the AI-DLC docs to `s1/worker-registration`.

---

## 2026-09-25 — Session resumed

**User input (verbatim):**
> let us continue the AI dlc

**AI action:** Docker engine 29.8.0 now responds (WSL 2, `docker-desktop` distro). Resuming at S1 step 1 DB verification: apply the forward migrations and every `down.sql` on local PostGIS (`postgis/postgis:16-3.4`), then a drift check.

---

## 2026-09-25 — S1 step 1 verified on local PostGIS

**AI action:**
- `postgis/postgis:16-3.4` container; the cycle was run on a database created from `template0`. The image's default database pre-installs `postgis_topology` and `tiger_geocoder`, which made the first run's `CREATE EXTENSION` a no-op and blocked `DROP EXTENSION`, so that run was discarded.
- Forward: the full history applies. Drift against the schema is limited to the two GENERATED `point` columns, which Prisma reads as defaults (expected).
- 27 constraint probes, all as designed: generated point, the (pid, postcode) key, states incl. OT, postcode, bounds, self-supersede, one HOME per worker, radius on HOME only (1–500), locality delete restricted, onboarding counts, no-op transition, photo size, outbox attempts, cascade on profile delete. Each rejection was checked to name its intended constraint.
- Down: the `s1_registration` guard refuses while an `ACCOUNT_REGISTERED` row exists. All five `down.sql` run newest-first, and the resulting schema has an empty `migrate diff` against `main`'s schema. Re-apply after reversal succeeds.
- **Finding:** the `s1_postgis` down would remove PostGIS even if it pre-dated S1, because the forward step uses `IF NOT EXISTS`. Added a warning to `down.sql` and a pre-check to the plan's production step.
- Migrations README: generated-column drift note and the local `down.sql` test procedure.
- One run was invalidated by my own shell error (env var expanded before it was set) and rerun; noted here for completeness.

---

## 2026-09-25 — G-NAF download link

**User input (verbatim):**
> CAN YOU PROVIDE THE LINK FOR GNAF

**AI action:** Gave the data.gov.au G-NAF dataset page and which file to pick: the full G-NAF release in GDA2020 PSV format, not G-NAF Core, because the build needs the `LOCALITY`, `LOCALITY_POINT` and `ADDRESS_DETAIL` tables.

---

## 2026-09-25 — G-NAF downloaded

**User input (verbatim):**
> c:\Users\toton\Downloads\g-naf_aug26_allstates_gda2020_psv_110.zip

**AI action:** Checked the zip's integrity. Extracted only the tables step 2 needs (LOCALITY, LOCALITY_POINT, ADDRESS_DETAIL and the authority code tables) to `C:\data\gnaf`, outside the repo.

---

**AI action (cont.):** Extracted 43 tables (2.1 GB) to `C:\data\gnaf\G-NAF\G-NAF AUGUST 2026\`, plus `Contents.txt` and `create_tables_ansi.sql`. Findings that shape step 2:
- 17,581 localities, 0 retired in the release file. Classes: G 15,643 · I (Indigenous location) 1,546 · U 241 · T 130 · D 19 · H 2.
- `LOCALITY_POINT.LOCALITY_PID` joins on `LOCALITY.LOCALITY_PID` (17,581 of 17,581 match), not on `GNAF_LOCALITY_PID` (360 match; 1,699 empty). `LOCALITY_PID` is therefore the stable key. The column `au_localities.gnafLocalityPid` must hold `LOCALITY_PID`, and its name invites confusion with G-NAF's own `GNAF_LOCALITY_PID`. Raised with the user.

---

## 2026-09-25 — Rename au_localities.gnafLocalityPid → localityPid

**User input (verbatim, question answer):**
> Rename now (Recommended)

**AI action:**
- Renamed the column in `schema.prisma` (with a doc comment), in the `s1_localities` migration (column and unique index `au_localities_localityPid_postcode_key`), in `S1-data-model.md` §2.1/§2.1a and in the plan. The migration is not yet on any shared database, so editing it in place is safe.
- Re-verified on a fresh `template0` database: validate, forward apply, drift limited to the two GENERATED columns, 27/27 probes, all five downs, empty diff against `main`'s schema, re-apply. `@remonta/app` quality passes (62/62 tests).

---
