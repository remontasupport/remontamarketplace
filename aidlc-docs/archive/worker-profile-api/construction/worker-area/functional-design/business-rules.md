# Business Rules -- unit `worker-area` (U1)

Numbered so code and tests can cite them. Decisions: the plan's Q1-Q6, all A (approved 2026-10-09). "Envelope" =
the contract's error body with a generic message and the request id. "Today" = `completion-today.md`.

## R1 Ownership (C4 `own-profile`)

| # | Rule |
|---|---|
| R1.1 | Every worker entry acts on the profile whose `userId` equals the principal's `userId` (the token's `sub`). No entry takes a user id or a profile id in its path, query or body. |
| R1.2 | A WORKER principal with no `worker_profiles` row: 404 `WORKER_PROFILE_NOT_FOUND` with the envelope, logged at warn with the user id (an account with the role but no profile is a data fault, not a client error to explain). |
| R1.3 | A child row named by id (later units: a document, a photo, an application) that does not belong to the principal's profile: 404, never 403. Existence is not revealed. For `job_applications` ownership is by `workerId = principal.userId`. |
| R1.4 | Impersonation: the principal is the worker (`sub`); `impersonatorId` rides on the log lines and audit rows; no rule in this cycle treats an impersonated request differently (D10). |
| R1.5 | A non-WORKER role on a worker entry is 403 from the pipeline's role check before any handler runs (unchanged). |

## R2 The profile read (C5 `get-profile`)

| # | Rule |
|---|---|
| R2.1 | One transaction (ReadCommitted, statement timeout 5 s) reads everything; no second round trip from the handler. The catalogue rows for the requirement groups (R4) are read in the same transaction. |
| R2.2 | The body is `Profile` (`domain-entities.md` E1). Every field has one source column; none is computed in the app. |
| R2.3 | `bankAccount` is returned masked (U2's rule R-BANK, applied here from day one: the read never returns the stored JSON). Until U2 ships, the field is `null` for every worker (the read maps the stored JSON through the mask even now). |
| R2.4 | `homeAddress` is `null` until U2's migration; the field exists in the schema from U1 so clients need no change later. |
| R2.5 | `serviceArea` comes from the HOME `worker_locations` row joined to `au_localities`: `{ localityId, label ("Suburb, ST postcode"), travelRadiusKm, precision }`; `null` when the worker is unplaced. |
| R2.6 | The photo fields keep today's storage format: `photos` (a URL or null) → `photos.main`; `additionalPhotos` (today's string format, parsed as the app parses it) → `photos.additional[]`. |
| R2.7 | Caching: `privateCacheSeconds: 60`; the pipeline adds `Cache-Control: private, max-age=60`, `Vary: Authorization`, a strong ETag of the body; `If-None-Match` equal → 304. The response memo is **not** used (per-user body). |
| R2.8 | The read has no side effect: it does not persist completion (R3.9 says who does). |

## R3 Completion (C6 `domain/completion.ts`)

The four flags are computed from rows by a pure function. Marked **[fix]** = differs from today on purpose (Q1 A);
otherwise exactly today.

| # | Rule |
|---|---|
| R3.1 | **accountDetails** = `firstName`, `lastName`, `photos.main`, `introduction`, `city`, `state`, `postalCode`, `gender` all non-empty and `age` or `dateOfBirth` present (today's `age != null`; `dateOfBirth` accepted too since U2 writes it: **[fix, additive]**). Whitespace-only counts as empty **[fix]**. |
| R3.2 | **compliance**, step 1: no services → false. |
| R3.3 | compliance, step 2: the required set = the ids of catalogue documents with `Document.category ∈ {IDENTITY, BUSINESS, COMPLIANCE}` linked to the worker's categories (`CategoryDocument`) and chosen sub-categories (`SubcategoryDocument`) **where `CategoryDocument.documentType = 'REQUIRED'` (sub-category documents are always required, as the requirements route presents them)** **[fix]**; plus always `code-of-conduct-part1` and `code-of-conduct-part2`. A `conditionKey`/`requiredIfTrue` pair is honoured when the condition's value is known from the profile (`hasVehicle`), otherwise treated as not required **[fix]**. |
| R3.4 | compliance, step 3, presence by base type (`requirementType` after the last `:`), over all requirement rows: `identity-points-100` → a PRIMARY row and a SECONDARY row exist; `abn-contractor` → a valid ABN in the `abn` JSON **or** a `contract-of-agreement` row **[fix: the ABN itself counts]**; `code-of-conduct-part1` → true; `code-of-conduct-part2` → `code-of-conduct`; `ndis-screening-check` → any of `ndis-screening-check`, `worker-screening-check`, `ndis-worker-screening`; `right-to-work` → `right-to-work` or `identity-working-rights`; else the id itself. |
| R3.5 | compliance, step 4, status: every row that is a base-compliance row (full type in the required set, or PRIMARY/SECONDARY, or one of `worker-screening-check`, `ndis-worker-screening`, `identity-working-rights`, **or whose base type satisfied a required id in R3.4 [fix: `contract-of-agreement`, `code-of-conduct` and composite keys are status-checked too]**) has status `SUBMITTED` or `APPROVED`; at least one such row exists. `PENDING`, `REJECTED`, `EXPIRED` anywhere → false. |
| R3.6 | **trainings**: no services → false; the required set = catalogue documents with `Document.category = 'TRAINING'` linked to the worker's categories and sub-categories **(`documentType = REQUIRED` for category links) [fix]**; empty → false; alias `ndis-worker-orientation` ⇔ `ndis-training`; a training is present when a requirement row's base type is the id or its alias **and the row's status is `SUBMITTED` or `APPROVED` [fix: status checked; `documentUrl` no longer the test, since U3 rows have `storageKey`]**; trainings = every required training present. |
| R3.7 | **services**: no services → false; per service, the required and optional types from the table in `domain/service-requirements.ts` (today's 11 rows, Q3 A; matched on the lower-cased, trimmed category name and the hyphenated sub-category id; **a service without sub-categories is evaluated with the "no subcategory" row of the table, never short-circuited [fix]**); uploads = rows with `documentCategory = SERVICE_QUALIFICATION`, a composite key whose first part equals the category name (**case-insensitively [fix]**) and status `SUBMITTED` or `APPROVED` **[fix: status checked, url not]**; per service: required non-empty → all required uploaded; else optional non-empty → at least one uploaded; else passes; services = every service passes. |
| R3.8 | **profileCompleted** = all four flags true **[fix: computed and persisted; today never set]**. |
| R3.9 | **Persistence**: `persistCompletion(tx, profileId, completion)` writes `setupProgress = {accountDetails, compliance, trainings, services}` and `profileCompleted` only when they differ from the stored values; and sets `verificationStatus` from `NOT_STARTED` to `IN_PROGRESS` when any flag becomes true (today's intended `updateSectionCompletion`, minus its PENDING_REVIEW branch, which the document paths own). Called by every write that can change a flag (U2-U4); U1 ships the function and a one-off backfill script run on staging to populate the stored values for existing workers (dry run, `--apply`). |
| R3.10 | **percent** (Q2 A) = `round(100 × filled / 13)` over: name (first and last), photo (`photos.main`), bio (`introduction.trim().length >= 50`), service area (a HOME row), personal info (`dateOfBirth` or `age`, `gender`, `hasVehicle`, and at least one language), ABN (a valid ABN in `abn`), services (≥ 1), preferred hours (≥ 1 slot), experience (≥ 1 domain row), work history (≥ 1), education (≥ 1), languages (`worker_additional_info.languages` ≥ 1), personality (non-empty). The badge highlight stays `< 80`. |
| R3.11 | The function is pure: rows in, `Completion` out; no clock, no database, no catalogue call inside (the catalogue rows are an input). |
| R3.12 | **Oracle**: `test/worker/completion-oracle.ts` is today's `getAllCompletionStatusOptimized` ported to take rows instead of a user id. The property test generates profiles and asserts `completionOf(rows) ≡ oracle(rows)` **except** when a generated profile hits a [fix] case, where it asserts the fixed behaviour; the generator reports how many cases of each kind it produced (both must be > 0). |

## R4 The requirement groups in the read (C5, Q4 A)

| # | Rule |
|---|---|
| R4.1 | `requirements.mandatory` = the catalogue documents with `Document.category ∈ {IDENTITY, BUSINESS, COMPLIANCE}` for the worker's categories and sub-categories, deduplicated by id, in the catalogue's order, with the two code-of-conduct parts spliced after `abn-contractor` (or at the end) and part 2 omitted; **with no services, empty** (today the route listed everything while completion said false; the sidebar then shows "choose your services first"). |
| R4.2 | `requirements.trainings` = the catalogue documents with `Document.category = 'TRAINING'` likewise, minus `ndis-induction-module`, `effective-communication`, `safe-enjoyable-meals` (folded into `ndis-worker-orientation`), ordered by today's `TRAINING_STEP_ORDER`, unknown ids last. |
| R4.3 | Each item: `{ id, name, requirementType: id, status }` where status = `approved` (a row with `APPROVED`), `submitted` (`SUBMITTED`), `rejected`, `expired`, `missing` (no row or `PENDING`), using the same presence aliases as R3.4 for `identity-points-100`, `abn-contractor`, `ndis-screening-check`, `right-to-work`. |
| R4.4 | `requirements.documentType` (REQUIRED/OPTIONAL) is carried per item so the sidebar can label optional ones. |

## R5 displayRole (Q5 A)

| # | Rule |
|---|---|
| R5.1 | The worker's services ordered by `createdAt`; the first one: if its `categoryName = 'Therapeutic Supports'` and it has sub-category names → the names joined by `' / '`; else its `categoryName`; no service → `'Support Worker'`. |

## R6 The probe and the limiter (Q6 A)

| # | Rule |
|---|---|
| R6.1 | An entry with `meta.probe = true` passes the pipeline's rate-limit stages (steps 3 and 10) without a limiter hit; its declared limit is not consulted. |
| R6.2 | Everything else about probes is unchanged (never shed, plain HTTP allowed). A test proves a probe request never calls `RateLimiter.hit`. |

## R7 The load script (C18)

| # | Rule |
|---|---|
| R7.1 | Runs only against staging: refuses a base URL or database host that is production's (the `scripts/local/rehearsal-env.sh` rule). Reads `STAGING_API_TOKEN_SECRET` and `STAGING_AUTH_DATABASE_URL` as the checklist runner does. |
| R7.2 | Picks N active WORKER users from the staging copy (`users.status = 'ACTIVE'`, with a profile), mints a 5-minute token each (re-minted at 4 minutes), and drives a mix: 70 % `getProfile` (half with `If-None-Match`), 30 % section writes (U2 on; in U1 the write share is a `PUT` that does not exist yet → the mix is reads only, and the script says so). |
| R7.3 | Inputs: `--rate <req/s>`, `--minutes`, `--burst <factor>` (a second phase at rate × factor for 60 s), `--workers N`. Outputs: p50/p95/p99 per entry, status counts (200/304/429/503/5xx), `Retry-After` honoured count, errors by kind; a JSON report file and a one-screen summary. |
| R7.4 | Never writes data on production, never prints a token, never exceeds `--rate × --burst`. Exit code 1 when the acceptance numbers (NFR Requirements) are not met. |

## R8 Contract hygiene (C1)

| # | Rule |
|---|---|
| R8.1 | Every worker entry is built with `workerRead()` or `workerWrite(audit)`; the helpers set `access`, `bot`, `rateLimit`, `maxBodyKb`, and `privateCacheSeconds` (reads) or `audit` (writes). A test asserts no worker entry lacks `audit` when its method is not GET. |
| R8.2 | `getProfile` is the only U1 entry; the area is exported from `index.ts`; `openapi.json` regenerated; the harnesses bind the area with `unreachableHandlers` where they do not test it. |
