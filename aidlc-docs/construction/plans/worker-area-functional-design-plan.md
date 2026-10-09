# Functional Design Plan -- unit `worker-area` (U1)

**Inputs:** requirements FR-WRK-01..04, 06, 08, FR-PLT-01/02/06, NFR-01..05, 11, 12; stories US-WP-26, 27 (read half),
28, 30, 31, 32; application design C1-C6, C13, C17, C18, C25 and services S1, S8; `worker-area/functional-design/
completion-today.md` (today's completion rules, read from the code on 2026-10-09).

Scope of this unit: the `worker` contract area and module skeleton, ownership by token, the profile read's shape and
its one statement, the completion status, the health probe's limiter exemption, the load-test script, the stages
table. The limit values, the capacity arithmetic and the load tool are NFR Requirements; the pooler check and the
table's numbers are Infrastructure Design.

**One finding changes a requirement.** Nothing outside the worker dashboard reads `setupProgress` or
`profileCompleted` (the admin, client and public routes and the api: no reader), and `profileCompleted` is set true by
no code path. FR-WRK-06's reason ("so the admin screens and the client search keep reading them") does not hold; the
flags matter to the worker's own screens only. The questions below take that into account.

Six decisions are open. Each is pre-filled with a proposal; leave or change the letter and say "approved" (or
"done").

## Question 1
Which completion rules the api computes. Today three computations disagree (`completion-today.md`): the live flags
(with known defects: a service without sub-categories makes all four flags false for a minute; the trainings check
ignores status so a rejected certificate counts; `CategoryDocument.documentType` REQUIRED/OPTIONAL is ignored so
optional documents block completion; the `abn` column is never consulted), the persisted copies (older logic), and
the sidebar's ten-field percentage.

A) **The intended rules, defects fixed, one definition.** `completionOf` computes the four flags from the rows with
these corrections: a service without sub-categories is evaluated like any other (no all-false); trainings count
only rows with status `SUBMITTED` or `APPROVED`; only `CategoryDocument.documentType = REQUIRED` documents are
mandatory (optional ones never block); the ABN flag reads the `abn` JSON (a valid ABN) **or** the signed contract row
as today; the rest exactly as today. `profileCompleted` = all four flags, persisted. The oracle test asserts
equality with the ported live function on generated profiles **outside** the four corrected cases, and asserts the
corrected behaviour on those. Recommended: the worker's screens are the only reader, so the defects can be fixed
without breaking anyone, and the port is documented rule by rule.

B) **Bug-for-bug port** of the live function; the oracle asserts equality everywhere; defects fixed in a later unit.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
The Edit Profile badge's percentage. Today it is a ten-field formula unrelated to the flags (two of its fields are
always true once the additional-info row exists), and the highlight shows under 80 %.

A) **One definition, derived from the sections.** `completion.percent` = the share of a fixed list of sections that
are filled, computed in the api beside the flags: name, photo, bio (≥ 50 characters), service area, personal info
(date of birth, gender, vehicle, languages), ABN, services, preferred hours (≥ 1 slot), experience (≥ 1 domain), work
history (≥ 1), education (≥ 1), languages, personality; equal weight; rounded. The highlight stays at `< 80 %`.
Workers will see their percentage change once (most will see it drop, since two always-true fields go). Recommended:
the badge then means what it says, and the sidebar needs no second computation.

B) **Keep today's ten-field formula**, computed in the api from the same rows; no visible change.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
The services flag's source. Today it uses a hard-coded table (`serviceDocumentRequirements.ts`, 11 services) rather
than the catalogue's `SubcategoryDocument`/`CategoryDocument` rows that the requirements list shows, so what the
sidebar lists and what completion demands can differ.

A) **Port the table as data in U1** (`modules/worker/domain/service-requirements.ts`, one row per service) so the
flag's answers do not change now; U3, which moves documents and reads the catalogue for `listRequirements`, decides
whether the catalogue replaces the table (a follow-up recorded now). Recommended for U1: parity, no catalogue
dependency in the first PR.

B) **Derive from the catalogue now** (`Document.category ∈ {QUALIFICATION, REGISTRATION, INSURANCE}` per service and
sub-category, `documentType = REQUIRED`); the table is deleted. Changes the flag for some workers; needs the catalogue
read in U1.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 4
The profile read's `requirements` summary. The sidebar's Mandatory and Trainings dropdowns list the documents the
worker's services need, with status (today a separate route with the public-cache defect). U1's read can carry the
two groups so the sidebar needs one call from PR 3 on.

A) **Included in `getProfile`**: `requirements: { mandatory: RequirementItem[], trainings: RequirementItem[] }`, each
item `{ id, name, status: 'missing' | 'submitted' | 'approved' | 'rejected' | 'expired', requirementType }`, grouped
by today's rules (`completion-today.md`, sidebar groups) from the catalogue rows; the per-service document lists
stay in U3's `listRequirements`. Recommended: the sidebar becomes one read; the catalogue grouping is read-only.

B) **Not included**: the sidebar keeps calling `/api/worker/requirements` until U3 ships `listRequirements`; the
public-cache defect lives until then.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 5
`displayRole` (the role under the worker's name in the sidebar).

A) **Today's rule**, in the api: the first service by creation; Therapeutic Supports with sub-categories → the names
joined by " / "; else the category name; none → "Support Worker". Recommended: no visible change.

B) **The first service's category name only** (as the dashboard page does today); simpler, loses the therapeutic
detail.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 6
The health probe and the rate limiter (FR-PLT-06). `meta()` requires a limit on every entry, and the pipeline enforces
it before anything else, so each Cloud Run probe does one database upsert.

A) **Probes skip the limiter in the pipeline**: `probe: true` entries pass the rate-limit stage without a hit
(the contract still declares a limit, unused); the pipeline test proves a probe never touches the limiter.
Recommended: one condition, no contract change.

B) **Allow `rateLimit: []` on probe entries** in `meta()` and the checks; the health entry drops its limit.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Execution checklist

- [x] 1. Confirm the six answers; resolve any ambiguity in a clarification file
- [x] 2. `business-rules.md`: R1 ownership (token → profile; 404 rules; impersonation), R2 the profile read (shape,
  masking, caching), R3 completion (the four flags rule by rule with the Q1 corrections marked; `profileCompleted`;
  the percent per Q2; the services table per Q3), R4 requirements grouping (Q4), R5 displayRole (Q5), R6 the probe
  exemption (Q6), R7 the load script's contract (inputs, outputs, what it must never do)
- [x] 3. `business-logic-model.md`: L1 `profileIdOf`, L2 `getProfile` (the one transaction and its statements),
  L3 `completionOf` (step by step), L4 `persistCompletion`, L5 the requirements grouping, L6 the pipeline's probe
  branch, L7 the load script's loop; the property list for PBT-01 (ownership invariant; completion oracle; percent
  monotonic in filled sections; read idempotent; ETag stable for an unchanged profile)
- [x] 4. `domain-entities.md`: `Profile` (the read's body, field by field with sources), `Completion`,
  `RequirementItem`, `ServiceRequirement` (the table), the worker-side `Principal` use; no new table in U1
- [x] 5. `frontend-components.md`: none in U1 (no app change in PR 1); a note that the sidebar's needs are met by the
  read's shape (checked against `Sidebar.tsx`'s props)
- [x] 6. Cross-check against US-WP-26, 27, 28, 30, 31, 32 and requirements section 6's staging checklist items
- [x] 7. Present for approval
