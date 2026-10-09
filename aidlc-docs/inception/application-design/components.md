# Components -- the worker profile on `apps/api`

**Sources:** `../plans/application-design-plan.md` (Q1-Q7, all A, approved 2026-10-09); requirements with D17;
stories US-WP-01..33; the execution plan's units U1-U4.

Units: **U1 `worker-area`** = C1, C2 (the profile read), C3, C4, C5, C6, C13, C17, C18. **U2 `edit-profile`** = C2
(section entries), C7, C8, C9, C10, C14, C15, C16, C19, C20. **U3 `services-documents`** = C2 (services, documents,
tickets), C11, C12, C21, C22. **U4 `dashboard-jobs`** = C2 (jobs, applications), C23, C24, C25.

## Contract (`packages/api-contract`)

### C1 `worker.contract.ts` -- the worker area (U1 skeleton; entries added per unit)
- **Purpose**: declare every worker endpoint once: path, strict schemas, `meta()`.
- **Responsibilities**: every entry `access: {roles: ['WORKER']}`, `bot: 'none'`, per-user and per-IP limits
  (values at NFR Requirements), `maxBodyKb` per entry, reads `privateCacheSeconds: 60`, writes `audit: 'WORKER_…'`
  actions; the shared schemas (`localitySchema` reused from registration; `maskedBankAccountSchema`;
  `uploadKindSchema`); `contracts` in `index.ts` gains `workerContract`; `openapi.json` regenerated; nothing in
  `public-endpoints.json`.
- **Interface** (by unit):
  - U1: `getProfile` GET `/v1/worker/profile`.
  - U2: `putName` PUT `/v1/worker/profile/name`; `putBio` `/bio`; `putHomeAddress` `/home-address`;
    `putServiceArea` `/service-area`; `putPersonalInfo` `/personal-info`; `putAbn` `/abn`;
    `confirmPhoto` POST `/v1/worker/photos` (a confirmed ticket becomes a photo); `makeMainPhoto`
    POST `/v1/worker/photos/{id}/main`; `removePhoto` DELETE `/v1/worker/photos/{id}`;
    `putAvailability` PUT `/v1/worker/availability`; `putExperience` `/experience`; `putJobHistory`
    `/job-history`; `putEducation` `/education`; `putBankAccount` `/bank-account`;
    `putAdditionalInfo` PUT `/v1/worker/additional-info/{group}`.
  - U3: `putServices` PUT `/v1/worker/services`; `listRequirements` GET `/v1/worker/requirements`;
    `listDocuments` GET `/v1/worker/documents`; `putDocument` PUT `/v1/worker/documents/{requirementType}`;
    `deleteDocument` DELETE `/v1/worker/documents/{id}`; `getDocumentLink` GET `/v1/worker/documents/{id}/link`;
    `createUploadTicket` POST `/v1/worker/uploads/tickets`; `confirmUpload` POST `/v1/worker/uploads/confirmations`.
  - U4: `listJobs` GET `/v1/worker/jobs`; `applyToJob` POST `/v1/worker/job-applications`; `withdrawApplication`
    POST `/v1/worker/job-applications/{id}/withdraw`; `listApplications` GET `/v1/worker/job-applications`.
  - U3, admin side (in `admin.contract.ts`): `getDocumentLink` GET `/v1/admin/documents/{id}/link` (ADMIN, audited).

### C2 shared shapes (`worker.contract.ts`, alongside C1)
- `profileSchema` (the read's body: identity, photos, bio, personalInfo, abn, homeAddress, serviceArea, completion,
  verificationStatus, displayRole, sections' summaries); one `…Schema` per PUT body; `uploadKindSchema`
  (`profile-photo` | `document`); `documentKindSchema` with its typed metadata variants; `jobSchema`,
  `applicationSchema`.

## Api (`apps/api`)

### C3 `modules/worker/worker.handlers.ts` -- one handler per entry (U1, grows per unit)
- **Purpose**: bind C1 to the application services; nothing else (the pipeline did auth, roles, limits, parsing,
  caching).
- **Responsibilities**: resolve the principal's profile id through C4 for every entry; call one application
  function; log one line per write (`entry`, `durationMs`, never field values); return `{status, body}`.
- **Interface**: `workerHandlers(deps: WorkerModuleDeps): HandlerSet` with `WorkerModuleDeps = { db, clock,
  localities: LocalityDirectory, uploads: UploadsService, outbox: OutboxEnqueuer }`.

### C4 `modules/worker/application/own-profile.ts` -- ownership (U1)
- **Purpose**: the one place that turns a `Principal` into the worker's profile id, and checks a child row belongs
  to it.
- **Responsibilities**: `profileIdOf(principal)` (404 `ApiError` when no profile row); `ownedRow(tx, table, id,
  profileId)` (404 when the row's `workerProfileId` differs; never 403: existence is not revealed).
- **Interface**: `profileIdOf(db, principal): Promise<string>`; `assertOwned(tx, kind, id, profileId): Promise<void>`.

### C5 `modules/worker/application/get-profile.ts` + `persistence/profile-read.ts` -- the profile read (U1)
- **Purpose**: one statement (or one transaction) that returns everything the dashboard needs.
- **Responsibilities**: the profile row with its HOME row and locality label, the home address with its locality,
  the counts and flags the sections and the sidebar need; C6's completion applied; the bank account masked by C9;
  shape per `profileSchema`.
- **Interface**: `getProfile(deps, profileId): Promise<Profile>`.

### C6 `modules/worker/domain/completion.ts` -- the completion status (U1)
- **Purpose**: the flags `accountDetails`, `compliance`, `trainings`, `services`, `profileCompleted` and the
  percentage, from rows, pure.
- **Responsibilities**: today's rules ported (`setupProgress.service.ts`), parameterised by the catalogue's
  required documents per service; the app's function copied into `test/worker/completion-oracle.ts` for the
  property test; `persistCompletion(tx, profileId, flags)` writes `setupProgress`/`profileCompleted`.
- **Interface**: `completionOf(input: CompletionInput): Completion`; `CompletionInput` = the rows it needs.

### C7 `modules/worker/application/sections/*.ts` -- one application function per section (U2)
- **Purpose**: validate what the schema cannot (overlaps, dates), replace the section in one transaction, persist
  completion when it can change, return the section.
- **Responsibilities**: `putName`, `putBio`, `putPersonalInfo`, `putAbn` (profile columns, the `abn` JSON shape),
  `putAvailability` (domain rule: no overlap), `putExperience` (areas in the domain's list), `putJobHistory`,
  `putEducation` (ordered lists, `sortOrder` from position), `putAdditionalInfo` (per group), `putBankAccount`
  (C9), `putHomeAddress` (C8), `putServiceArea` (C8), photos (C7a: confirm → `photos`/`additionalPhotos` format
  kept; make-main swaps; remove deletes the Blob objects).
- **Interface**: `put<Section>(deps, profileId, body, ctx): Promise<SectionBody>`.

### C8 `modules/worker/application/addresses.ts` -- the two addresses (U2)
- **Purpose**: the home address (private) and the service area (search) as two different writes.
- **Responsibilities**: `putHomeAddress`: the locality must exist (C13), writes `homeStreetLine`/`homeLocalityId`,
  never the legacy columns; `putServiceArea`: `placeHome(locality, 'ONBOARDING', radius)` from the locations
  module, upsert the HOME row, write the legacy columns, mark the reconciler off for this profile (a `source`
  other than `RECONCILER`/`BACKFILL` already does), persist completion.
- **Interface**: `putHomeAddress(deps, profileId, {streetLine, localityId})`; `putServiceArea(deps, profileId,
  {localityId, travelRadiusKm})`.

### C9 `modules/worker/domain/bank-account.ts` -- masking and validation (U2)
- **Purpose**: the BSB and account-number rules, and the masked view.
- **Responsibilities**: `validate(bsb, number, name)`; `mask(account) → {accountName, bsbMasked, numberMasked}`
  (last three digits); the JSON shape stored as today; a redaction path for the logger.
- **Interface**: `maskBankAccount(stored): MaskedBankAccount`; `bankAccountSchema` (full) and
  `maskedBankAccountSchema` live in C2.

### C10 `packages/db` migration -- the home address and the storage key (U2 carries the first; U3 the second)
- **Purpose**: expand-only columns.
- **Responsibilities**: `worker_profiles.homeStreetLine text null`, `homeLocalityId int null references
  au_localities(id) on delete restrict` + index; `verification_requirements.storageKey text null`.

### C11 `platform/storage/` -- the object store and the uploads service (U3; the port in U1 if PR 1 is convenient)
- **Purpose**: one upload path for every kind (Q5).
- **Responsibilities**: `ObjectStore` port (ticket, inspect, readPrefix, read, write, delete, `signedReadUrl`),
  the GCS adapter moved from `modules/registration/adapters/gcs-photo-store.ts`; `UploadsService` with the
  **upload-kind table** `UPLOAD_KINDS = { 'registration-photo': {...}, 'profile-photo': {...}, 'document':
  {contentTypes: [pdf, jpeg, png], maxBytes, prefix: 'documents/', afterConfirm: 'none'} }`; `createTicket(kind,
  ownerKey)`, `confirmUpload(ticketId, ownerKey)`, `purgeUnclaimed()` (the existing job generalised); the
  registration module calls it with `registration-photo` and keeps its behaviour and tests.
- **Interface**: `UploadsService { createTicket; confirmUpload; signedReadUrl; delete }`, `UploadKind`.

### C12 `modules/worker/application/documents.ts` -- documents (U3)
- **Purpose**: the worker's documents against the allowed set.
- **Responsibilities**: `allowedRequirementTypes(profileId)` from the catalogue (base set + the worker's services);
  `putDocument(requirementType, confirmedUploadId, metadata)` (typed metadata per document kind; status
  `SUBMITTED`; `verificationStatus` → `PENDING_REVIEW`; replaces the previous object); `deleteDocument(id)`
  (row + object); `listDocuments`, `listRequirements` (per service, with status); `documentLink(id)` → signed URL
  (C11); the admin's `documentLink` for `GET /v1/admin/documents/{id}/link`.
- **Interface**: as named.

### C13 `modules/localities` (existing) -- locality lookup (U1 dependency)
- Used by C8 for `localityId` validation and labels; unchanged.

### C17 `platform/rate-limit` health exemption (U1)
- **Purpose**: the probe must not pay a database upsert.
- **Responsibilities**: entries with `probe: true` skip the limiter (the contract check already forbids a limit
  on probes, or the pipeline skips it); `platform.contract.ts` health entry adjusted.

### C18 `apps/api/scripts/load-worker.ts` -- the load test (U1)
- **Purpose**: FR-PLT-02: drive staging at the stated rate with a worker-token mix.
- **Responsibilities**: mints tokens from a staging secret (as the checklist runner does), a mix of `getProfile`
  and section PUTs at N requests/s for M minutes, reports p50/p95/p99, status counts, `Retry-After` honoured;
  a `--burst 3` mode. Tool: decided at NFR Requirements (`autocannon` proposed).

### C23 `modules/worker/application/jobs.ts` -- jobs and applications (U4)
- **Purpose**: the jobs list and idempotent apply/withdraw.
- **Responsibilities**: `listJobs({state, city}, page)`; `apply(profileId, userId, jobId)` (upsert on
  `(jobId, workerId)`, `workerId` = user id); `withdraw(id)`; `listApplications(userId)`; apply enqueues
  `JobApplied` (C24) in the same transaction.

### C24 `modules/notifications/crm.handlers.ts` -- the CRM outbox handler (U4)
- **Purpose**: post to n8n from the outbox, never from a request.
- **Responsibilities**: handlers for `JobApplied` ({fullName, userId, zohoId}) and `WorkerRegistered` (the
  registration payload) through `SafeHttpClient` to the allow-listed host from `N8N_JOB_APPLICATION_WEBHOOK_URL`
  / `N8N_REGISTRATION_WEBHOOK_URL`; idempotent on `event.id` (an `Idempotency-Key` header); failures throw so the
  dispatcher retries and dead-letters.

### C25 `infra/lib/stages.ts` (U1 and U4)
- U1: prod `maxInstances`, `MAX_IN_FLIGHT` < `concurrency`, `DB_POOL_SIZE` (values at NFR Requirements);
  README: the pooler check. U4: `N8N_JOB_APPLICATION_WEBHOOK_URL` in `SECRET_NAMES`, bootstrap, YAML.

## Form engine (`packages/form-engine`, U2)

### C14 `section.ts` -- the section mode
- **Purpose**: a definition that seeds from a read entry and saves to a PUT entry.
- **Responsibilities**: `defineSection({ contract, readEntry, pick, writeEntry, fields, title })` with the same
  import-time checks as `defineForm` (every field in the write body; `pick` names a key of the read response);
  `seed(readBody) → values`; `toBody(values)`; the draft keyed `section:<name>`, cleared on success; no CAPTCHA;
  retries and offline from `submit.ts`; server field errors mapped to fields.
- **Interface**: `defineSection`, `SectionDefinition`, `seedSection`, `sectionBody`.

### C15 `kinds.ts` additions
- `select`, `multiSelect` (options from a list the definition names), `date`, `monthYear`, `number`, `textarea`,
  `timeRanges` (value: `{day, startMinute, endMinute}[]`), `orderedList` (value: an array of sub-objects; `fields`
  per item), `maskedSecret` (value entered in full; seed shows the mask; `neverSaved`), `abn` (digits + checksum
  in `sanitise`/`schemas`). Each kind: `defaults`, `schemas` (from the contract shape), `toBody`.

## App (`apps/app`, U2-U4)

### C16 `src/features/worker/` -- the worker dashboard's data layer and definitions
- `api.ts`: `workerApi = createWorkerApi({ baseUrl, tokenSource: apiToken })` (the admin client's outcome mapping
  reused from `lib/api/`); `useWorkerProfile()` (key `['worker','profile']`; `reload()` with `cache: 'reload'`);
  `definitions/<section>.ts` one `defineSection` each; `SectionPage.tsx` (`"use client"`: renders a definition
  with `FormWizard`'s field components in section mode); the dashboard, my-jobs and preview pages as client pages
  reading `useWorkerProfile`.

### C19 `src/features/navigation/workerMenu.ts` -- the sidebar declaration
- `WORKER_MENU: MenuItem[]` in D11's order; `children(profile)` for Edit Profile (static steps + sections),
  Mandatory, Trainings, My Services; `badge(profile)` for Edit Profile; `workerMenu.test.ts` asserts the order and
  resolvable hrefs. `components/dashboard/Sidebar.tsx` renders it.

### C20 `components/ui/form-wizard/fields.tsx` additions -- one component per new kind (presentational only).

### C21 admin worker page: the home address block and the masked bank account (through the existing admin route,
  which reads the same columns; no worker entry). (U2)

### C22 admin document views: when `documentUrl` is null, call `GET /v1/admin/documents/{id}/link` through the
  admin client and open the signed URL. (U3)
