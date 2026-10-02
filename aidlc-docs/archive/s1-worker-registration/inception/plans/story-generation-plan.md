# Story Generation Plan — Remonta Backend (`apps/api`), first release

**Inputs:** `aidlc-docs/inception/requirements/requirements.md` (approved 2026-09-25), `.brd/phase-2` (actors), `.brd/phase-4` (rules, state machines), `.brd/phase-5` (communications), `.brd` journeys J1, J2, J3, J8, J7.4, J7.7.
**Outputs:** `aidlc-docs/inception/user-stories/personas.md`, `aidlc-docs/inception/user-stories/stories.md`.

**How to answer:** put the letter (or your own text) after each `[Answer]:` tag, save the file, and tell me "answered". Every question needs an answer before generation starts. Part B holds the four business decisions (OI-01 to OI-04) that the requirements left for this stage.

---

## Part A — Story approach

### Breakdown options (context for Question 1)

| Approach | Fits here because | Trade-off |
|---|---|---|
| **User journey-based** | `.brd` is already organised by journey (J1, J2, J3, J8) | Cross-cutting rules (audit, session revocation) repeat across journeys |
| **Feature-based** | Maps directly onto the FR groups | Loses the worker's start-to-finish view; tends toward technical stories |
| **Persona-based** | Four personas with clear boundaries | Admin and worker stories for one document get split apart |
| **Domain-based** | Lines up with strangler cut-over (FR-MIG-01: one domain at a time) | Close to feature-based; less readable for business reviewers |
| **Epic-based (hierarchical)** | Epics give Units Generation natural slices | Needs a rule for what an epic is |

### Question 1
How should stories be organised?

A) **Epics by journey/domain, stories by persona inside them.** Epics: Identity & Sessions, Registration (J1), Onboarding (J2), Compliance Verification (J3), Account & Access (J8), Notifications, Audit, Migration & Cut-over. Each story is written from one persona's view. This matches `.brd` for reviewers and FR-MIG-01 for cut-over (Recommended)

B) Pure user-journey-based (J1, J2, J3, J8 only). Cross-cutting items become acceptance criteria on the journey stories

C) Persona-based (Worker stories, Admin stories, Account holder stories)

D) Feature-based, one story group per FR table

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
How big should a story be?

A) **One user-visible outcome per story, typically covering 1–3 FRs.** Example: "Admin rejects a document with a reason" covers FR-CMP-03, FR-CMP-04, FR-CMP-10 and FR-NOT-01. Aim for roughly 35–55 stories (Recommended)

B) Coarse: one story per journey step (J2.1, J2.4 …), about 20–25 stories, with long acceptance-criteria lists

C) Fine: one story per FR, about 90 stories

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
Which story and acceptance-criteria format?

A) **"As a / I want / so that" + Given/When/Then acceptance criteria**, each story tagged with its FR IDs, MoSCoW priority and persona (Recommended)

B) "As a / I want / so that" + a plain checklist of acceptance criteria

C) Job stories ("When … I want … so I can …") + Given/When/Then

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
How deep should acceptance criteria go?

A) **Happy path + the business-rule failures + the security negatives the requirements call out** (wrong role, suspended session, illegal state transition, enumeration). Where a rule is a good property-based-testing candidate (state machines, requirements engine, validation), the story names the property (Recommended, since PBT is under full enforcement)

B) Happy path + business-rule failures only; security negatives are left to NFR/design

C) Happy path only

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
How should work with no direct user (token exchange, the queue, the audit store, geocoding, n8n delivery, the expiry job) appear?

A) **As "system" stories with a named system actor** (`apps/app`, Scheduler) inside the relevant epic, with acceptance criteria that can be tested from outside. Pure infrastructure (Fargate, CI/CD, observability) stays out of stories and goes to NFR/Infrastructure Design (Recommended)

B) Only as acceptance criteria on user stories. No system stories

C) As a separate "Platform enablers" epic that includes infrastructure

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
Should cut-over and migration behaviour be written as stories?

A) **Yes, in the Migration & Cut-over epic,** from the point of view of existing users. Examples: a worker who is half-way through onboarding at switch-over keeps their progress; an admin sees the same pending queue before and after; switching a domain back to `apps/app` loses no data; legacy `'Verified'` workers end up in a valid status (Recommended)

B) Only FR-MIG-01/02 as system stories. Data corrections go to Functional Design

C) No. Migration is handled entirely in design and construction

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7
How many worker personas?

A) **One worker persona with documented variations** (ABN vs TFN engagement, single vs multiple service lines, first-time vs returning after expiry) called out in acceptance criteria (Recommended)

B) Two or three distinct worker personas (e.g. new support worker; experienced multi-service ABN contractor; worker whose documents are expiring)

C) One worker persona, no variations

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 8
The first release has a single admin tier (FR-ID-08). Do different staff do different admin jobs in practice?

A) **One Administrator persona.** Everyone who reviews compliance also publishes profiles and suspends accounts (Recommended, if that matches how the team works)

B) Two personas with the same permissions but different goals: a Compliance reviewer (documents, expiry) and an Operations/Support admin (publication, suspension, impersonation). Permissions stay single-tier in the first release

C) Two personas **and** separate permissions. This changes FR-ID-08 and reopens requirements

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 9
Documents are due to expire. How far ahead should a worker be warned (FR-NOT-04)? The acceptance criteria need a number.

A) **30 days and 7 days before expiry, then on the expiry date** (Recommended)

B) 14 days before, then on the expiry date

C) 60, 30 and 7 days before, then on the expiry date

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part B — Business decisions deferred from Requirements

### Question 10 (OI-01) — Which document catalogue is authoritative?
Today there are two: `serviceDocumentRequirements.ts` (Support Worker: nothing mandatory; nine service lines) and the recovered `categories.json` (public liability insurance, Working with Children Check and training mandatory; seven service lines).

A) **`categories.json` is authoritative** (the stricter one). The backend stores it as the versioned catalogue (FR-CMP-12). Existing workers get the new obligations as `PENDING` requirements, without their profile being unpublished automatically

B) `serviceDocumentRequirements.ts` is authoritative (current live behaviour, looser)

C) Neither. The business supplies a corrected catalogue before Functional Design; stories are written against a catalogue that admins can edit and version

D) Start from `categories.json`, but the business reviews each service line's mandatory list before Functional Design. Stories assume a versioned, admin-maintained catalogue

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 11 (OI-02) — What must be true before a profile is published?

A) **Hard rule:** the server refuses to publish unless every mandatory document for the worker's services is `APPROVED` and not expired. When a mandatory document expires later, the profile is unpublished automatically and the worker and admins are notified

B) **Hard rule to publish, but no automatic unpublish on expiry.** Admins are alerted instead and decide

C) **Admin discretion with an override:** the server warns about the missing or expired documents; an admin can still publish by giving a reason, which is audited

D) Keep today's behaviour (no checks)

X) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 12 (OI-03) — The gender field (today: only "Male" / "Female")

A) **Widen and make it optional:** Female, Male, Non-binary, Prefer to self-describe (free text), Prefer not to say. Existing values are kept. Participants who filter by worker gender still can, where a worker has given one

B) Keep Male/Female but make it optional

C) Keep it exactly as it is (required, Male/Female)

D) Remove the field

X) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 13 (OI-04) — Bank details (stored today, read by nothing)

A) **Needed** (e.g. for paying workers). Keep collecting them, encrypted at the field level; only authorised roles can read them, and every read is audited (FR-ONB-09)

B) **Not needed.** Stop collecting them, remove the step from onboarding, and purge the stored data with a tested, audited migration

C) **Undecided.** Stop collecting new bank details now. Existing records are encrypted and kept untouched until the business decides, with a deadline recorded as a risk

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Resolved decisions (answers + follow-ups, 2026-09-25)

Generation follows these. Sources: this file, `story-plan-clarification-questions.md` (F1–F3) and `story-plan-clarification-questions-2.md` (F3.1–F3.2).

| # | Decision |
|---|---|
| Structure | Epics by journey/domain with persona-view stories (Q1 A); one user-visible outcome per story, ~35–55 stories (Q2 A); "As a / I want / so that" + Given/When/Then, tagged with FR IDs, MoSCoW and persona (Q3 A) |
| Acceptance criteria | Happy path + business-rule failures + security negatives; the PBT property is named where one applies (Q4 A) |
| System work | System stories with named system actors; pure infrastructure excluded (Q5 A) |
| Migration | A Migration & Cut-over epic written from existing users' point of view (Q6 A) |
| Personas | One Worker persona with variations (Q7 A); one Administrator persona (Q8 A) |
| Expiry warnings | 30 days and 7 days before, then on the expiry date (Q9 A) |
| **OI-01 catalogue** | `categories.json` is authoritative and becomes the versioned catalogue; existing workers get new obligations as `PENDING`, with no automatic unpublish for that reason (Q10 A). Home Modifications → the Home and Yard Maintenance list; Fitness and Rehabilitation = Personal Trainer; existing selections kept (F1 A) |
| **OI-02 publication** | Admin may publish with documents outstanding, giving an audited reason (Q11 C), **except** always-required documents, which must be approved and current: 100 points of ID, NDIS Worker Screening Check, police check, right to work, and WWCC where the catalogue requires it (F2a A). A document expiring after publication flags the profile and notifies the worker; admins see an "expired documents" list; if the expired document is always-required, the profile goes offline automatically until it is replaced (F2b A) |
| **OI-03 gender** | Optional; Female, Male, Non-binary, Prefer to self-describe (free text), Prefer not to say; existing values kept (Q12 A) |
| **OI-04 bank details** | Needed (Q13 A). In the first release they are collected and stored encrypted at field level, and **no one** reads them: not admins, not any screen (F3 C, F3.2 A). The worker sees a masked version of their own details and can replace them. The payroll/accounting integration is deferred to the next release; **target system undecided** (F3.1 C → new OI-10) |

---

## Part C — Execution checklist (run after the plan is approved)

- [x] 1. Personas
  - [x] 1.1 Write `personas.md`: Worker (with the variations from Q7), Administrator (from Q8), Client/Coordinator (identity only), and the system actors (`apps/app`, Scheduler, Anonymous visitor)
  - [x] 1.2 For each persona: goals, frustrations taken from `.brd` defects, what they touch in the first release, and what they explicitly do not touch
- [x] 2. Epic skeleton
  - [x] 2.1 Create the epics from Q1 in `stories.md`, each linked to its FR groups and `.brd` journeys
- [x] 3. Stories per epic, in this order
  - [x] 3.1 Identity & Sessions (FR-ID)
  - [x] 3.2 Registration — J1 (FR-REG, FR-INT-01)
  - [x] 3.3 Onboarding — J2 (FR-ONB), applying the Q12 and Q13 decisions
  - [x] 3.4 Compliance Verification — J3 (FR-CMP), applying the Q10 and Q11 decisions
  - [x] 3.5 Account & Access — J8 (FR-ACC)
  - [x] 3.6 Notifications (FR-NOT), applying the Q9 lead times
  - [x] 3.7 Audit (FR-AUD)
  - [x] 3.8 Migration & Cut-over (FR-MIG), as scoped in Q6
- [x] 4. Acceptance criteria
  - [x] 4.1 Write them in the Q3 format at the Q4 depth
  - [x] 4.2 Name the PBT property on each story that has one (state machines, requirements engine, validation, migration scripts)
- [x] 5. Quality checks
  - [x] 5.1 INVEST check on each story; split any that fail "Small" or "Testable"
  - [x] 5.2 Traceability matrix: every M-priority FR maps to at least one story; S and C FRs are marked as covered or deferred
  - [x] 5.3 Persona ↔ story map
  - [x] 5.4 Record the OI-01 to OI-04 resolutions in `requirements.md` §8
- [ ] 6. Present for approval
