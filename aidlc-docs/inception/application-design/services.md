# Services -- the worker profile on `apps/api`

The orchestration per use case. "Pipeline" = the api's existing request pipeline (auth, role, limits, validation,
memo, audit check, caching, errors). Every flow below starts after the pipeline has admitted the request with a
WORKER principal.

## S1 Read the profile (U1) -- `getProfile`
1. C4 `profileIdOf(principal)` → profile id (404 if none).
2. C5 `readProfileRows` in one transaction: profile columns, HOME row + locality, home locality, photos, sections'
   rows, services, requirements with status, the catalogue's required documents per service.
3. C6 `completionOf(rows)` → flags and percent (pure).
4. C9 `maskBankAccount` on the stored JSON.
5. Shape to `profileSchema`; the pipeline adds `private, max-age=60`, `Vary`, ETag (304 on match).

## S2 Save a section (U2) -- any `put*`
1. C4 ownership → profile id.
2. Domain validation beyond the schema (C7's rules: overlaps, dates, areas in domain, ABN checksum).
3. `replaceSection`: one `unitOfWork` (ReadCommitted, 5 s statement timeout): delete + insert for list sections
   (`sortOrder` from position) or `update` for column sections; `persistCompletion` when the section can change a
   flag (name, bio, personal info, ABN, service area, services, documents).
4. Audit: the entry's action with `{profileId, section}` (never values); `impersonatorId` carried by the pipeline.
5. Return the section; the client calls `reload()` on the profile query with `cache: 'reload'`.

## S3 The two addresses (U2)
- **Home address** (`putHomeAddress`): C13 locality lookup (400 `fields.localityId` when unknown or retired) →
  `update worker_profiles set homeStreetLine, homeLocalityId` → return with suburb/state/postcode from the locality.
  Never touches `location/city/state/postalCode/latitude/longitude` or `worker_locations`.
- **Service area** (`putServiceArea`): C13 lookup → `placeHome(locality, 'ONBOARDING', radius)` → in one
  transaction: upsert the HOME `worker_locations` row (the `point` column is generated), update the legacy columns
  with `legacy` from `placeHome`, `persistCompletion` → return `{localityId, label, travelRadiusKm, precision}`.
  The reconciler skips rows whose `source` is not `RECONCILER`/`BACKFILL` (existing rule, re-asserted by a test).

## S4 A photo (U2)
1. `createUploadTicket({kind: 'profile-photo', contentType, sizeBytes})` → C11 `UploadsService.createTicket`
   (owner key = profile id) → `{uploadId, target, expiresAt}`.
2. The browser POSTs the file to the bucket (the engine's `Uploader`, as the sign-up).
3. `confirmPhoto({uploadId})` → C11 `confirmUpload` (inspect: exists, allowed type, size) → C7a records the photo
   (`photos`/`additionalPhotos` format kept) and enqueues `PhotoUploaded` → the existing processing handler makes
   the clean copy and thumbnail on Vercel Blob and points the profile at it, deleting the bucket original
   (unchanged behaviour from the sign-up).
4. `makeMainPhoto` / `removePhoto`: column swaps; remove deletes the Blob objects (C11's Blob adapter) best-effort.

## S5 A document (U3)
1. `createUploadTicket({kind: 'document', ...})` → ticket under `documents/<profileId>/<uploadId>`.
2. Browser upload.
3. `putDocument(requirementType, {uploadId, metadata})`: C12 `allowedRequirementTypes` (400 if not allowed) → C11
   `confirmUpload` → in one transaction: upsert the `verification_requirements` row (`storageKey` = the object
   key, `documentUrl` null, `status SUBMITTED`, `submittedAt`, typed `metadata`), delete the previous object if the
   row had one, `verificationStatus = PENDING_REVIEW`, `persistCompletion` → return the document.
4. Reads: `listDocuments`/`listRequirements` never return the key; `getDocumentLink(id)` → ownership → C11
   `signedReadUrl(key, 300)`. The admin's `GET /v1/admin/documents/{id}/link` does the same without ownership and
   with its own audit action.
5. `deleteDocument(id)`: ownership → delete the object → delete the row → `persistCompletion`.
6. `purgeUnclaimed` (the existing job, generalised over `UPLOAD_KINDS`) removes staged objects past their ticket.

## S6 A job application and the CRM (U4)
1. `applyToJob({jobId})`: the job must be active (404 otherwise) → one transaction: upsert `job_applications`
   `(jobId, workerId = principal.userId)` status `PENDING` → `enqueue(tx, {type: 'JobApplied', payload: {fullName,
   userId, zohoId}})` → return the application (idempotent: a second call returns the same row, enqueues nothing
   new if the row already existed as PENDING).
2. The outbox dispatcher (every 2 s, `SKIP LOCKED`) runs C24's `JobApplied` handler: `SafeHttpClient.post(url,
   payload, {idempotencyKey: event.id})`; non-2xx throws → back-off, DEAD after 6 with the alert.
3. `WorkerRegistered` gains the same handler shape posting the registration payload to its URL (follow-up 2).
4. `withdrawApplication(id)`: ownership by `workerId` → status `WITHDRAWN`.

## S7 The dashboard page (U4) and the sidebar (U2), app side
- `useWorkerProfile()` (one query) feeds the sidebar (C19 `WORKER_MENU` with `children(profile)` and
  `badge(profile)`), the home page (completion, reminders incl. "your suburb isn't set"), and every section's seed.
- The jobs slider calls `listJobs({state: profile.serviceArea.state})`; apply/withdraw call S6 then `reload()`.
- The sections: `useSection(def)` = `seedSection(def, profile)` + the engine's draft/retry/offline + `sectionBody`
  → `workerApi.<writeEntry>` → on success clear the draft and `reload()`.

## S8 Capacity (U1), operator side
- `scripts/load-worker.ts --rate N --minutes M [--burst 3]` against staging: mints WORKER tokens for the staging
  test accounts, drives S1 and S2 mixes, reports latency percentiles, status counts and `Retry-After` behaviour;
  the numbers go into the construction notes before each promotion (FR-PLT-02).
- `infra/lib/stages.ts`: the ceiling, `MAX_IN_FLIGHT`, pool; README: the `pgbouncer=true` check on both stages.

## Cross-cutting
- **Errors**: `ApiError` with the envelope; 404 for the principal's missing profile and for any row not owned;
  400 with `fields` for domain rules; 503 from the store (`StoreUnavailable`) and the pool.
- **Logging**: one line per write with `entry`, `durationMs`, `profileId`; the redaction list gains the bank
  account paths, `streetLine`, `storageKey`, signed URLs.
- **Caching**: reads `private, max-age=60` + ETag; writes `no-store`; the memo is not used for worker entries.
