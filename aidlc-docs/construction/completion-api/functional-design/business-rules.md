# C1 `completion-api`: business rules (2026-10-21)

| ID | Rule | From |
|---|---|---|
| CR-1 | **One declaration**: every measure (percent, group state, first unfinished, stored flags under `groups`) is derived from the items of E1-E4; no rule is written twice in the api | FR-CMP-01 |
| CR-2 | **Percent** = round(100 × required My Profile items done / 11) | FR-CMP-03 |
| CR-3 | **My Profile complete** = every required My Profile item done; optional items never count against it | CD3 |
| CR-4 | **Services complete** = every Services item done (E3) | FR-CMP-04, CD4, CD5 |
| CR-5 | **Compliance complete** = today's `compliance && trainings` | FR-CMP-05 |
| CR-6 | **Profile complete** = the three groups | FR-CMP-06 |
| CR-7 | **First unfinished** of a group = its first item, in menu order, that is not done; when a group is incomplete but every item reads done (an edge of today's compliance rule: a row type outside the steps), the group's first item | FR-SCR-02 |
| CR-8 | Whitespace-only is empty everywhere; lists count only non-empty values | FR-CMP-02 |
| CR-9 | **The entry**: `GET /v1/worker/completion`, WORKER, own data (404 without a profile row), worker read limits, private cache 60 s + ETag; the app reloads it after a save | FR-CMP-07, NFR-C4 |
| CR-10 | **The stored flags** are written under the stage's `COMPLETION_MODEL` (E6) by every write that can change them, by the job and by the backfill; only when they differ; `verificationStatus` NOT_STARTED → IN_PROGRESS when any flag becomes true, as today | FR-STO-01, -05 |
| CR-11 | **The job `completion-sync`** every 5 minutes (Q2 A) over the profiles changed since its watermark -- a profile, a document (incl. `reviewedAt`, `expiresAt` passing), a service, a location, the additional info, the availability, experience, job history or education rows -- and a **full pass once a day**; batches of 200; one run at a time (the scheduler's lease) | FR-STO-02, -03 |
| CR-12 | **The backfill**: every worker under the stage's model; dry run by default (counts of what would change, per flag), `--report=<file>`, `--apply`; idempotent | FR-STO-04 |
| CR-13 | **The profile read's `completion` is unchanged** (today's rules); it is retired after C2 in a later clean-up | NFR-C1 |
| CR-14 | **The service documents** in the entry are `uploadableDocuments(service, subcategories)` per chosen service, `uploaded` = a SUBMITTED or APPROVED row of that type for that service | OC-2, FR-SCR-04 |

## Where the new rules differ from today's on purpose (the oracle's exceptions)

| Today | New | Why |
|---|---|---|
| Account Details needs city, state, postcode (the service area's legacy columns) | My Profile needs no suburb | CD5 |
| Account Details: bio any length; the percent: 50+ | 50+ everywhere | Q1 A, one rule |
| Percent over 13 sections incl. the ABN, a service, the home, two language sections | Over the 11 required My Profile pages | CD2, F4 |
| `services` without the service area | Services incl. the service area | CD4 |
| Four checklist flags | Three groups (Compliance = compliance + trainings) | CD4 |

Everywhere else (compliance, trainings, a service's documents) the new items reuse today's functions, and the oracle
test asserts the same answers.
