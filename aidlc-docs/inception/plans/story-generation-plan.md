# Story Generation Plan -- the worker profile on `apps/api`

**Role:** product owner. **Inputs:** `../requirements/requirements.md` (approved 2026-10-09), the inventory, and
the previous cycles' `personas.md` and `stories.md` (archives `s1-worker-registration`, `signup-photo-gcs`,
`admin-search-api`), whose conventions this cycle proposes to reuse.

Three questions decide how the stories are written. Each has the previous cycles' convention pre-filled as the
proposal; leave the answer as it is to accept, or change the letter. Say "approved" (or "done") when the answers
stand.

## Question 1
Story format and acceptance-criteria depth.

A) **The previous cycles' format**: "As a / I want / so that", Given/When/Then criteria covering the happy path,
the business-rule failures and the security negatives the requirements name; each story tagged with persona, MoSCoW
priority and FR ids; a **PBT** line naming the property where one applies.

B) **Lighter**: one-line stories with a bullet list of criteria, no persona tags or PBT lines.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
Personas. S1 defined P1 Worker, P2 Administrator, P3 Client/Coordinator and the system actors S1 `apps/app`,
S3 Anonymous visitor; the photo cycle added S4 `apps/api` and S5 Operator; the admin-search cycle added two
administrator variations.

A) **Reuse by reference** P1 Worker (the main human user), P2 Administrator, S1 `apps/app`, S4 `apps/api` and
S5 Operator; add three Worker variations specific to this cycle: **W1 "Filling in my profile"** (a new worker after
sign-up working through Personal Info and the sections, often on a phone, sometimes offline), **W2 "Keeping it
current"** (an established worker who moved house or wants to work around a different suburb, changes a photo,
renews a document), **W3 "Applying for work"** (a worker on the dashboard who applies to a job and expects the
office to know). `personas.md` holds only the additions and the references.

B) **Write a fresh persona file** describing every actor in full for this cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
Breakdown approach.

A) **User-journey-based with a system epic**, mirroring requirements section 3 and the proposed unit cut:
E1 "Tell Remonta who I am" (worker: name, photo, bio, personal info, ABN/TFN; drafts, retries, offline),
E2 "Where I live and where I work" (worker: the private home address; the service area and radius; an unplaced
worker placing themselves; administrator: the home address on the worker page, the search finding the worker at
the new suburb), E3 "My experience and details" (worker: hours, experience, work history, education, the
additional-details groups, the bank account masked), E4 "My services and documents" (worker: edit services, the
documents a service needs, upload by ticket, delete, status; administrator: review unchanged), E5 "My dashboard and
jobs" (worker: the home page, the jobs list, apply and withdraw; the CRM notified), E6 "Finding my way" (worker: the
sidebar order and the Edit Profile dropdown, the completion badge), E7 "The api behind the profile" (system actor:
ownership by token, one statement per page, section round-trips, completion status, the upload tickets and
confirmations, the outbox handler, limits and shedding, the load test numbers), E8 "Cut over page by page"
(operator: secrets, the staging checklist with the load test, promotion, the page switch, clean-up, rollback).
About 28-32 stories. Recommended.

B) **Feature-based**: one epic per requirement group (3.1-3.7) regardless of who experiences it.

C) **Persona-based**: every story under its persona, system behaviour folded into the worker's stories.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Execution checklist

- [ ] 1. Confirm the three answers above; resolve any ambiguity in a clarification file
- [ ] 2. Write `aidlc-docs/inception/user-stories/personas.md` per Q2
- [ ] 3. Write `aidlc-docs/inception/user-stories/stories.md` per Q1 and Q3:
  - [ ] 3a. E1 worker stories: name, photo (main, additional, make main), bio, personal info, ABN/TFN; a draft kept
    on the device; a save retried after 503/429; the api unreachable; the emergency-contact step gone
  - [ ] 3b. E2 worker and administrator stories: the home address (street + suburb from the list; private); the
    service area (suburb + radius) through placement, the legacy columns following; an unplaced worker placing
    themselves; the admin sees the home address and finds the worker at the new suburb; the client search unchanged
  - [ ] 3c. E3 worker stories: preferred hours (no overlap), experience per domain with the shared areas, work
    history and education as ordered lists, the additional-details groups, the bank account written in full and
    read masked
  - [ ] 3d. E4 worker and administrator stories: edit services against the catalogue; the documents a service
    needs; upload by ticket and confirm; a disallowed type refused; delete; the admin review unchanged; the old
    public-cache routes gone with this epic
  - [ ] 3e. E5 worker stories: the home page from one read; the jobs list; apply (idempotent) and withdraw; the
    office notified through n8n without the browser
  - [ ] 3f. E6 worker stories: the sidebar order; the Edit Profile dropdown; the completion badge; every link
    resolves
  - [ ] 3g. E7 system stories: ownership by token (404 for others' rows, 403 for other roles, 401 without a token);
    one statement per page; whole-section replace round-trips; completion status computed in the api with today's
    meaning; ticket/confirm/purge; the outbox handler with retries and dead letters; per-user limits and shedding;
    the load test at the stated rate and at 3×
  - [ ] 3h. E8 operator stories: secrets and the stages table; the staging checklist incl. the load test; promotion;
    the page PR; the clean-up PR; rollback at each step; docs in the same PRs
  - [ ] 3i. Map every FR of requirements section 3 to at least one story; name the PBT property where one applies
  - [ ] 3j. INVEST check: each story independently testable on staging or in CI, small enough for one unit's plan
- [ ] 4. Cross-check the stories against the verification protocol in requirements section 6 (every item traceable)
- [ ] 5. Present for approval
