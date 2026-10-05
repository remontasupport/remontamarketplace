# Story Generation Plan -- sign-up photo on Google Cloud Storage

**Role:** product owner. **Inputs:** `../requirements/requirements.md` (approved 2026-10-05), the inventory, and
S1's `personas.md` and `stories.md` (archive `s1-worker-registration/inception/user-stories/`), whose conventions
this cycle proposes to reuse.

Three questions decide how the stories are written. Each has S1's convention pre-filled as the proposal; leave the
answer as it is to accept, or change the letter. Say "approved" (or "done") when the answers stand.

## Question 1
Story format and acceptance-criteria depth.

A) **S1's format**: "As a / I want / so that", Given/When/Then criteria covering the happy path, the business-rule
failures and the security negatives the requirements name; each story tagged with persona, MoSCoW priority and FR
ids; a **PBT** line naming the property where one applies.

B) **Lighter**: one-line stories with a bullet list of criteria, no persona tags or PBT lines.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed (S1's convention; the previous cycles' construction notes reference stories in this shape)

## Question 2
Personas. S1 defined P1 Worker (with variations), P2 Administrator, P3 Client/Coordinator and the system actors
S1 `apps/app`, S3 Anonymous visitor.

A) **Reuse S1's personas by reference** (P1 Worker, P2 Administrator) and add one system actor, **S4 `apps/api`**,
for the ticket, confirm, processing, purge and cut-over stories. Add two Worker variations specific to this cycle:
V7 "phone on mobile data, Facebook or Instagram in-app browser" and V8 "HEIC source: iPhone, Android, or a desktop
with a copied phone photo". `personas.md` holds only the additions and the references.

B) **Write a fresh persona file** describing every actor in full for this cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
Breakdown approach.

A) **User-journey-based with a system epic**: E1 "Upload my photo during sign-up" (worker journey: pick, progress,
HEIC, failures, submit), E2 "Photos after sign-up" (administrator: processed photo, old photos, thumbnails recorded),
E3 "The api behind the upload" (system actor: ticket, confirm, process, purge, cut-over, observability), E4 "The
latency alert" (operator). About 14-16 stories. Recommended: it mirrors requirements §3 and the preview checklist.

B) **Feature-based**: one epic per requirement group (3.1-3.6) regardless of who experiences it.

C) **Persona-based**: every story under its persona, system behaviour folded into the worker's stories.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Execution checklist

- [x] 1. Confirm the three answers above; resolve any ambiguity in a clarification file
- [x] 2. Write `aidlc-docs/inception/user-stories/personas.md` per Q2
- [x] 3. Write `aidlc-docs/inception/user-stories/stories.md` per Q1 and Q3:
  - [x] 3a. E1 worker journey stories with criteria for progress, HEIC (both arrival paths), ticket expiry,
    upload failure and retry, picking another photo, submit waiting for the upload
  - [x] 3b. E2 administrator stories: processed photo on the profile, old Blob photos unchanged, thumbnail recorded
  - [x] 3c. E3 system stories: ticket constraints, confirm checks and idempotence, processing and its failure path,
    purge of both stores, cut-over window, per-stage logging without sensitive data
  - [x] 3d. E4 operator stories: the corrected policy's behaviour on a quiet service, applying it to the live project
  - [x] 3e. Map every FR of requirements §3 to at least one story; name the PBT property where one applies
  - [x] 3f. INVEST check: each story independently testable on the preview, small enough for one unit's plan
- [x] 4. Cross-check the stories against the preview checklist in requirements §6 (every checklist item traceable)
- [x] 5. Present for approval
