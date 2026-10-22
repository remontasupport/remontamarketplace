# Profile completion: requirements (2026-10-21)

Sources: the user's request and answers (verbatim in `audit.md`, 2026-10-21); `completion-questions.md` Q1-Q8 and the
follow-up on Q5; the audit `../review/profile-completion-audit.md` (F1-F9, I1-I6).

## 1. Intent analysis

| | |
|---|---|
| **Request** | "audit the profile completion of the workers, how it was track from the api and backend, analyse the structure of this feature and apply improvements" |
| **Type** | Enhancement + refactoring (one definition of "complete"; consistent screens; stored flags kept true) |
| **Scope** | `apps/api` (worker domain, a new entry, a job), `packages/api-contract`, `apps/app` (sidebar, checklist, profile pages, service step, admin preview) |
| **Complexity** | Moderate: rules change meaning; the stored flags are read by admin screens; the deployed app parses the profile read strictly |
| **Depth** | Standard |

## 2. Decisions

| # | Decision | From |
|---|---|---|
| CD1 | Do all six improvements I1-I6 | Q1 A |
| CD2 | The badge percent counts **only the My Profile pages that are required** (CD3): 100 % = every required page filled | Q2 A, Q3 B |
| CD3 | **Required My Profile pages (11):** Name, Profile Photo, Bio, Date of Birth, Gender, Language, Experience, Work History, Education, Preferred Hours, Vehicle Access. **Optional (7)**, ticked when filled, never holding the percent back: Address, Cultural Background, Religion, Interests, Support & Activities, Preferences, Personality | Q3 B, Q5 follow-up ("No suburb for My Profile") |
| CD4 | **The home checklist has three items, the menu's groups**: **My Profile** (the 11 required pages), **Services** (a service chosen, its documents, the Service Area set), **Compliance** (the mandatory documents and the trainings); each links to its first unfinished page | Q4 A |
| CD5 | **No suburb in My Profile**; the Service Area counts under Services. The legacy city/state/postcode no longer decide anything | Q5 follow-up |
| CD6 | **Applying is not gated** anywhere: the profile page's block goes (the 2026-09-23 decision) | Q6 A |
| CD7 | The congratulations pop-up stays once per worker | Q7 A |
| CD8 | **Ships after `feat/account-app`**, as its own release | Q8 A |

## 3. Functional requirements

### 3.1 One definition, in the api (FR-CMP)

| ID | Requirement |
|---|---|
| FR-CMP-01 | One declaration in `apps/api` (the worker domain) lists every completion item: each My Profile page (id = its sidebar slug, required or optional, its rule), the Services parts, the Compliance parts. Every measure is derived from it; no rule is written twice |
| FR-CMP-02 | The page rules: Name (first and last), Profile Photo, Bio (50+ characters, as the tick today), Date of Birth (or a stored age), Gender, Language (the additional-info languages; the legacy `worker_profiles.languages` when that is empty), Experience (a row), Work History (a row), Education (a row), Preferred Hours (a slot), Vehicle Access (answered Yes or No); optional pages filled when their value is set. Whitespace-only is empty |
| FR-CMP-03 | **Percent** = round(100 × required pages filled / 11) (CD2) |
| FR-CMP-04 | **Services complete** = at least one service, every chosen service's documents (today's `services` rule), and a Service Area (CD4, CD5) |
| FR-CMP-05 | **Compliance complete** = today's `compliance` and `trainings` together (CD4) |
| FR-CMP-06 | **Profile complete** = My Profile, Services and Compliance complete |
| FR-CMP-07 | `GET /v1/worker/completion` (new, WORKER, no private cache or a short one): every page's done state and required flag, the three groups' state with their first unfinished page, the percent, profile complete. Additive: `GET /v1/worker/profile` is unchanged (F9) |

### 3.2 The screens (FR-SCR)

| ID | Requirement |
|---|---|
| FR-SCR-01 | The sidebar's ticks, the My Profile badge and "Your profile is x % complete" read FR-CMP-07; the 18 `done` functions in `workerMenu.ts` are removed |
| FR-SCR-02 | The home checklist shows the three groups of CD4 with their state, "n of 3 completed", and a "continue" link to the first unfinished page; its words match the menu (F7) |
| FR-SCR-03 | The profile page's apply block (`applyReadiness`) is removed (CD6) |
| FR-SCR-04 | The service document step asks for what the api's table says (I6): the app's `config/serviceDocumentRequirements.ts` copy is retired; the step reads the api |
| FR-SCR-05 | The tour's last step ("Your progress") still points at the checklist (its anchor kept) |

### 3.3 The stored flags (FR-STO)

| ID | Requirement |
|---|---|
| FR-STO-01 | `worker_profiles.setupProgress` and `profileCompleted` follow the new definition (the four stored keys are kept for the readers that exist: `accountDetails` = My Profile complete, `compliance` and `trainings` as today, `services` = FR-CMP-04; `profileCompleted` = FR-CMP-06), written by every api write that can change them |
| FR-STO-02 | **After an admin's approve, reject or reset of a document** the stored flags are recomputed (F5) |
| FR-STO-03 | **A scheduled recompute** (the api's scheduler) brings every worker's stored flags to the computed values at least daily (catalogue changes, writes outside the api); it writes only rows that differ |
| FR-STO-04 | A one-off backfill applies the new definition to every worker before the screens move (dry run first, a report, `--apply`, as the S1 backfills) |
| FR-STO-05 | `verificationStatus` keeps its rule (NOT_STARTED → IN_PROGRESS when any flag becomes true) |

## 4. Non-functional requirements

| ID | Requirement | Rule |
|---|---|---|
| NFR-C1 | **No change a live screen sees before its release**: the profile read keeps its shape and its `completion` values until the app that reads FR-CMP-07 ships; the stored flags change meaning only with the backfill, run at the release | RESILIENCY-04 |
| NFR-C2 | The definition is pure and has one property test against the old rules' oracle where they agree, and tables for every change made on purpose (as U1 of worker-area did) | PBT-01..03 |
| NFR-C3 | The recompute job is bounded (batches, a statement timeout), idempotent, logs counts only, and cannot run twice at once (the scheduler's lock) | RESILIENCY-09, -10 |
| NFR-C4 | The new entry: worker-only, own data only, the worker read limits; the admin recompute (if an entry): admin-only, audited | SECURITY-08, -11, -13 |
| NFR-C5 | No new dependency; the gates' baselines do not grow | SECURITY-10 |

## 5. Proposed units (for workflow planning)

| Unit | Branch | Holds | Ships |
|---|---|---|---|
| **C1 `completion-api`** | from `main` | the declaration and rules (FR-CMP-01..06), `GET /v1/worker/completion`, the stored-flag semantics, the admin recompute path, the scheduled recompute, the backfill (dry run) | PR → staging → promotion; additive, invisible until C2 |
| **C2 `completion-app`** | from `main` **after `feat/account-app` is released** | FR-SCR-01..05, the admin preview reading computed values | its own release; the backfill applied in the same window |

## 6. Out of scope

Changing the compliance or training rules themselves; the admin's review screens beyond the recompute; the public
profile's content; MFA; the jobs area.

## 7. Open items for design

| # | Item |
|---|---|
| OC-1 | How the admin document routes (Next.js) trigger the recompute: a new admin api entry they call, or moving those three routes to the api |
| OC-2 | Where the service table is exposed for FR-SCR-04: in FR-CMP-07, or in the profile read's requirement groups (strictness, F9) |
| OC-3 | The admin contractor profile and the share page (`profilePreview.service.ts`): read the computed values through the api instead of the stored flags |
| OC-4 | The congratulations pop-up's trigger under three groups (once per worker, CD7) |

## Amendment 2026-10-21 (user: "B", then "Language only")

**CD3 amended:** Language is optional. **Required My Profile pages (10):** Name, Profile Photo, Bio, Date of Birth,
Gender, Experience, Work History, Education, Preferred Hours, Vehicle Access. **Optional (8):** Address, Language,
Cultural Background, Religion, Interests, Support & Activities, Preferences, Personality. FR-CMP-03: percent = round(100
× required pages filled / 10). Why: on the staging copy 1,202 of 1,790 workers (all pre-S1; the sign-up never asked)
have no language anywhere -- unanswered, not a data gap (`construction/completion-api/code/C1-summary.md`).
Measured options (staging copy, 148 complete today): as designed 65 profile complete / 83 drop out; **Language optional
75 / 73**; + Education 82 / 66; + Work History 86 / 62; + Experience and Preferred Hours 145 / 3.
