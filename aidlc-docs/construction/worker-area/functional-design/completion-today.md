# Completion status as computed today (read from the code, 2026-10-09)

The input for porting `completionOf` (C6) and for the oracle test. Source: `apps/app/src/services/worker/
setupProgress.service.ts` (1,875 lines; "SPS"), `profilePreview.service.ts`, `Sidebar.tsx`, the profile route,
`config/serviceDocumentRequirements.ts`, `utils/dynamicComplianceSteps.ts`, `dynamicTrainingSteps.ts`. Extracted by a
read-only pass and spot-checked by the session.

## Three computations that disagree

| Where | What | Used by |
|---|---|---|
| `getAllCompletionStatusOptimized(userId)` (SPS:1332-1875) | the four flags, recomputed on every call, Redis `completion_status:v3` 60 s | the sidebar checkmarks and the dashboard page (the live value; **the oracle to port**) |
| `worker_profiles.setupProgress` JSON | written by the `autoUpdate*Completion` actions using older per-section copies of the logic (differences: the trainings alias; the no-offerings case) | read by nobody outside the worker dashboard; `parseSetupProgress` defaults to all false |
| the sidebar percentage (`Sidebar.tsx:81-98` from `getProfilePreviewData`) | a 10-field equal-weight formula unrelated to the flags | the Edit Profile badge (`< 80 %` highlights) |

`profileCompleted` is set to true by no code path (`updateSectionCompletion` exists but has no caller); the registration
sets it false. **Nothing outside the worker dashboard reads `profileCompleted` or `setupProgress`** (grep of the admin,
client, public routes and `apps/api`: no reader), so requirements FR-WRK-06's premise ("the admin screens and the
client search keep reading them") is wrong; the flags matter only to the worker's own screens.

## The live flags (SPS:1332-1875)

One read of the profile (`firstName, lastName, photos, introduction, city, state, postalCode, age, gender, abn`),
its `workerServices {categoryName, subcategoryNames}` and all `verificationRequirements {requirementType, status,
documentCategory, documentUrl}`; then up to two `category.findMany` calls. "Base type" of a requirement =
`requirementType.split(':')`'s last segment when composite (`"<Service title>:<type>"`), else the whole string.

### accountDetails
`firstName && lastName && photos && introduction && city && state && postalCode && age != null && gender` (JS
truthiness; no length rule on `introduction`; vehicle, ABN, languages not involved).

### compliance
1. No services → false.
2. Service strings: for each service, `"<categoryName>:<sub>"` per subcategory, else `categoryName`; ids are the
   lower-cased, hyphenated names.
3. `Category` rows by id or name, with `documents → document {id, category}` and the matching `subcategories →
   additionalDocuments → document`. A failing query is treated as no categories.
4. `baseComplianceIds` = document ids whose `Document.category ∈ {IDENTITY, BUSINESS, COMPLIANCE}` from both levels,
   plus always `code-of-conduct-part1` and `code-of-conduct-part2`. **`CategoryDocument.documentType`
   (REQUIRED/OPTIONAL), `conditionKey`, `requiredIfTrue` are ignored: every linked document counts as required.**
5. Presence, over the base types of all requirement rows (status and url not checked here):
   `identity-points-100` → a row with `documentCategory PRIMARY` and one with `SECONDARY` (`driver-license-vehicle`
   is SECONDARY and counts); `abn-contractor` → base type `contract-of-agreement` present (the `abn` column is not
   consulted); `code-of-conduct-part1` → always true; `code-of-conduct-part2` → `code-of-conduct` present;
   `ndis-screening-check` → any of `ndis-screening-check | worker-screening-check | ndis-worker-screening`;
   `right-to-work` → `right-to-work | identity-working-rights`; anything else → the id itself present.
6. If nothing is missing: the rows with full `requirementType ∈ baseComplianceIds`, or `documentCategory ∈ {PRIMARY,
   SECONDARY}`, or type ∈ {`worker-screening-check`, `ndis-worker-screening`, `identity-working-rights`} must all have
   status `APPROVED | SUBMITTED` (`PENDING_REVIEW` is not a `RequirementStatus`: dead branch) and there must be at
   least one such row. `PENDING`, `REJECTED`, `EXPIRED` on any of them → false. Rows never status-checked:
   `contract-of-agreement`, `code-of-conduct`, `ndis-screening-check`, composite keys. Citizenship is not read here:
   the right-to-work PATCH sets the row `SUBMITTED` when `metadata.isCitizen`, else leaves `PENDING`.

### trainings
1. No services → false. The same category query. `trainingDocIds` = document ids with `Document.category =
   'TRAINING'` from both levels; empty → false.
2. Training rows = requirement rows whose base type ∈ `trainingDocIds ∪ {ndis-training}` (the `documentCategory =
   'TRAINING'` branch is dead: the enum has no such value). Alias `ndis-worker-orientation → ndis-training`.
3. Missing = a training id with neither itself nor its alias among the rows' base types.
4. If nothing is missing: `uploadedTypes.size >= trainingDocIds.size && rows.length > 0 && every row has a
   documentUrl`. **Status is not checked** (REJECTED and EXPIRED count).

### services
Uses the hard-coded table `config/serviceDocumentRequirements.ts`, not the catalogue.
1. No services → false. **Bug:** a service with no subcategory names makes the whole function return `data: false`
   (a boolean), which the callers read as all four flags false, cached 60 s.
2. Per service (by `categoryName`, matched lower-cased and trimmed), the union over its subcategories of the table's
   `required` and `all` types:

| Service | Required | Optional |
|---|---|---|
| support worker | -- | qualification-certificate, other-training |
| support worker (high intensity) | qualification-certificate | manual-handling-training, medication-training, behaviour-support-training, other-training |
| cleaning services; home and yard maintenance | -- | qualification-certificate |
| nursing services | ahpra-registration, qualification-certificate | |
| personal trainer | professional-association-membership, qualification-certificate | |
| therapeutic supports, subcategory ∈ {occupational-therapist, orthoptist, physiotherapist, podiatrist, psychologist} | ahpra-registration, qualification-certificate | |
| therapeutic supports, other subcategory | professional-association-membership, qualification-certificate | |
| therapeutic supports, no subcategory | professional-association-membership, qualification-certificate, professional-indemnity-insurance | |
| home modifications | qualification-certificate, trade-licence, public-liability-insurance | |
| fitness and rehabilitation | professional-association-membership, qualification-certificate, first-aid-cpr | public-liability-insurance |
| anything else | -- | -- |

3. Uploads: rows with `documentCategory = SERVICE_QUALIFICATION`, a `documentUrl`, and a key with ≥ 2 `:` parts;
   `uploadedByService[parts[0]]` ∪= `parts[last]`; `parts[0]` must equal `categoryName` case-sensitively. Status not
   checked.
4. Per service: required non-empty → every required type uploaded; else `all` non-empty → at least one upload under
   that title; else passes. `services` = no service missing anything.

### profileCompleted
Intended: all four flags true (`isAllSectionsCompleted`), with `verificationStatus` NOT_STARTED → IN_PROGRESS or →
PENDING_REVIEW. Never executed today.

## The sidebar percentage (`Sidebar.tsx:81-98`)
Ten equal-weight booleans from the preview data: `photos`; `introduction.length >= 50`; `city` (the `location`
branch is never selected); services non-empty; `additionalInfo.languages` non-empty; `availability` truthy;
`experience` truthy (both always `{}`-truthy when the additional-info row exists); job history non-empty; education
non-empty; personality non-empty. `Math.round(completed / 10 * 100)`; `null` until loaded; highlight when `< 80`.

## displayRole (profile route :43-47)
The first `worker_services` row by `createdAt`: `'Therapeutic Supports'` with subcategory names → the names joined
by ` / `; else its `categoryName`; no service → `'Support Worker'`. The dashboard page uses the category name only.

## Sidebar groups (`GET /api/worker/requirements`)
**Mandatory** = documents with `Document.category ∈ {IDENTITY, BUSINESS, COMPLIANCE}` (deduplicated by id; the two
code-of-conduct parts spliced after `abn-contractor`; `generateComplianceSteps` drops part 2). With no services the
route lists every category's documents while the completion check says false. **Trainings** = `Document.category =
'TRAINING'`, with `ndis-induction-module`, `effective-communication`, `safe-enjoyable-meals` hidden behind the
`ndis-worker-orientation` page but still required by the predicate; sorted by `TRAINING_STEP_ORDER`. Both groups list
every `CategoryDocument` regardless of `documentType`.

## Enums and types
`DocumentCategory`: PRIMARY, SECONDARY, WORKING_RIGHTS, SERVICE_QUALIFICATION (no TRAINING; the vehicle-photo route
writes `"OPTIONAL"`, an invalid value). `RequirementStatus`: PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED.
`VerificationStatus`: NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED. `Document.category` is free text:
IDENTITY, BUSINESS, COMPLIANCE, TRAINING, QUALIFICATION, REGISTRATION, INSURANCE, TRANSPORT. Known
`requirementType` values: identity (PRIMARY `identity-passport`, `identity-birth-certificate`; SECONDARY
`identity-drivers-license`, `identity-medicare-card`, `identity-utility-bill`, `identity-bank-statement`,
`driver-license-vehicle`; WORKING_RIGHTS `identity-working-rights`), `police-check`, `working-with-children`,
`ndis-worker-screening`, `worker-screening-check`, `infection-control`, `ndis-worker-orientation`,
`ndis-induction-module`, `effective-communication`, `safe-enjoyable-meals`, `certificate`, `contract-of-agreement`,
`code-of-conduct`, `other-requirement`, `right-to-work`, `vehicle-drivers-license`, and `"<Service>:<type>"`
composites. No seed of `Document`/`Category`/`CategoryDocument` rows is in the repository: the catalogue's contents
are read from the database (staging copy) at design time.

## Redis today
`completion_status:v3:<userId>` 60 s, shared by the profile route and the dashboard page; invalidated by the
services actions, the compliance upload paths and the update-step services case; **not** invalidated by the
profile actions (name, photo, bio, address, personal info), the ABN action, document deletes, the service-document
actions, the identity route or the citizenship PATCH (the TTL is the only refresh). All of it goes with U2-U4.
