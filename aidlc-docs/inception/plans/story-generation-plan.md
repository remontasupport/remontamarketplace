# Story Generation Plan -- admin worker search on `apps/api`

**Role:** product owner. **Inputs:** `../requirements/requirements.md` (approved 2026-10-08), the execution plan,
the inventory, and the previous cycles' `personas.md` and `stories.md` (archives `s1-worker-registration` and
`signup-photo-gcs`), whose conventions this cycle proposes to reuse.

Three questions decide how the stories are written. Each has the previous cycles' convention pre-filled as the
proposal; leave the answer as it is to accept, or change the letter. Say "approved" (or "done") when the answers
stand.

## Question 1
Story format and acceptance-criteria depth.

A) **The previous cycles' format**: "As a / I want / so that", Given/When/Then criteria covering the happy path, the
business-rule failures and the security negatives the requirements name; each story tagged with persona, MoSCoW
priority and FR ids; a **PBT** line naming the property where one applies.

B) **Lighter**: one-line stories with a bullet list of criteria, no persona tags or PBT lines.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
Personas. S1 defined P1 Worker, P2 Administrator, P3 Client/Coordinator and the system actors S1 `apps/app`,
S3 Anonymous visitor; the photo cycle added S4 `apps/api` and S5 Operator.

A) **Reuse by reference** P2 Administrator (the only human user of this cycle), S1 `apps/app` (mints the token,
renders the screen) and S4 `apps/api` (verifies tokens, searches, ranks); add two Administrator variations specific
to this cycle: **V1 "matching a participant"** (has a suburb and a distance in mind, needs nearest-first and the
distance shown) and **V2 "tidying the list"** (wants to find workers whose suburb is not mapped and fix them); add
S5 Operator for the auth-failure alert. `personas.md` holds only the additions and the references.

B) **Write a fresh persona file** describing every actor in full for this cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
Breakdown approach.

A) **User-journey-based with a system epic**: E1 "Find workers near a suburb" (administrator: pick a suburb, choose
a distance, any distance, distance and precision shown, unmapped count and list, the other filters unchanged,
sorting and paging), E2 "Stay signed in to the api" (administrator: transparent token, expiry, impersonation
refused, api errors as notices), E3 "The other admin lists" (filter options, user picker, suspended list), E4 "The
api behind the search" (system actor: verify a token, reject a bad one, resolve the locality, rank by distance in one
statement, count the unplaced, parity with the old route, log and alert), E5 "Cut over without a gap" (operator and
developer: api first, promote, page switch, delete the routes, rollback). About 16-18 stories. Recommended: it
mirrors requirements section 3 and the staging checklist.

B) **Feature-based**: one epic per requirement group (3.1-3.5) regardless of who experiences it.

C) **Persona-based**: every story under its persona, system behaviour folded into the administrator's stories.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Execution checklist

- [x] 1. Confirm the three answers above; resolve any ambiguity in a clarification file
- [x] 2. Write `aidlc-docs/inception/user-stories/personas.md` per Q2
- [x] 3. Write `aidlc-docs/inception/user-stories/stories.md` per Q1 and Q3:
  - [x] 3a. E1 administrator stories: suburb pick keeps the id, "Within" needs a suburb, within X km nearest first
    with the distance, any distance, precision label, unmapped count and list, every other filter unchanged, stable
    sort and paging
  - [x] 3b. E2 administrator stories: the token is invisible in normal use, a 401 after refresh sends to sign-in,
    impersonating a worker is refused on admin entries, 429 and 503 notices keep the last results
  - [x] 3c. E3 administrator stories: filter options, the user picker, the suspended list, unchanged in content
  - [x] 3d. E4 system stories: mint and verify, every rejection case, locality resolution, the geo statement and
    its index, pagination and count consistency, parity with the old route, logging with principal, the
    auth-failure alert
  - [x] 3e. E5 operator and developer stories: PR order, promotion before the switch, the deletion PR after
    verification, rollback at each step
  - [x] 3f. Map every FR of requirements section 3 to at least one story; name the PBT property where one applies
  - [x] 3g. INVEST check: each story independently testable on staging or in CI, small enough for one unit's plan
- [x] 4. Cross-check the stories against the verification protocol in requirements section 6 (every item traceable)
- [x] 5. Present for approval
