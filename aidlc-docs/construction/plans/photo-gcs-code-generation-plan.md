# Code Generation Plan -- unit `photo-gcs` (U3)

**Single source of truth for this unit.** One plan, three PRs in order (execution plan; deployment architecture).
Design: `../photo-gcs/functional-design/` (zero new columns), `nfr-requirements/`, `nfr-design/`,
`infrastructure-design/`. Stories US-PH-01..16. Branches from `main`; the AI-DLC documents stay on
`aidlc/signup-photo-gcs`. Each PR: gates locally, PR, CI, preview/staging checks, merge; 3a and 3c are followed
by a production promotion; 3b by the app's own production deploy.

## Unit context

- **Implements**: the ticket and confirm entries, the Cloud Storage adapter, background processing, purge over
  two stores, the engine's three-step upload with progress, the wizard's HEIC handling and accept list, the
  buckets and CI container, the docs.
- **Depends on**: U1 (done); the buckets created by the user running bootstrap before 3a merges.
- **Owns**: no new tables or columns; the bucket objects; the `PhotoUploaded` outbox event.
- **Interfaces fixed by the contract**: `createPhotoUploadTicket`, `confirmPhotoUpload`; `submitWorkerRegistration`
  unchanged (`photoUploadId` stays a uuid).

## Guiding rules

- Behaviour of the live multipart path is frozen until 3c (R9); HEIC stays accepted on that entry only.
- No row until confirm succeeds; the store is the key's prefix; URLs derive from ids (functional design).
- Tests against the fake storage server skip, reporting as skipped, when `GCS_API_ENDPOINT` is unset; policy
  signing is tested offline with a throwaway key; the browser form POST is proven on staging.
- Every property in the functional design's table gets a `fast-check` test beside an example-based one (PBT-10).
- Generated Prisma clients are never committed; `openapi.json` is regenerated and committed with the contract.

---

## PR 3a -- backend, additive (`feat/photo-gcs-api`)

### Part A -- `packages/schemas` (the shared sniffer)

- [x] **A1 new `src/image-type.ts`**: move `ImageType`, `extensionOf`, `detectImageType` from
  `apps/api/src/modules/registration/domain/image-type.ts` verbatim; add `ACCEPTED_IMAGE_TYPES = ['image/jpeg',
  'image/png', 'image/webp'] as const`, `AcceptedImageType`, `IMAGE_HEADER_BYTES = 16`, `isHeicHeader(bytes)`.
  Export from `src/index.ts`. P-5 holds (no imports).
- [x] **A2 new `src/image-type.test.ts`**: the table from `apps/api/test/registration/units.test.ts:58-75`
  moved here, plus `fast-check` properties: any buffer starting with a known signature classifies as that type;
  any buffer whose first 12 bytes carry none classifies `null`; the result depends only on the first 12 bytes
  (append random bytes, same result).

### Part B -- `packages/api-contract`

- [x] **B1 `src/registration.contract.ts`**: schemas `photoTicketRequestSchema` (`contentType:
  z.enum(ACCEPTED_IMAGE_TYPES)`, `sizeBytes: z.int().min(1).max(PHOTO_MAX_BYTES)`), `photoTicketResponseSchema`
  (`photoUploadId: z.uuid()`, `upload: { url: z.url(), method: z.literal('POST'), fields: z.record(z.string(),
  z.string()), fileField: z.literal('file') }`, `expiresAt: z.iso.datetime()`), `photoConfirmSchema`
  (`photoUploadId: z.uuid()`); entries `createPhotoUploadTicket` (POST `/v1/registrations/worker/photo-tickets`,
  201, public, bot none, 10/1h ip + 300/1h global, maxBodyKb 1) and `confirmPhotoUpload` (POST
  `/v1/registrations/worker/photo-confirmations`, 200, public, bot none, 30/1h ip + 1000/1h global, maxBodyKb
  1). `uploadRegistrationPhoto` untouched.
- [x] **B2 `public-endpoints.json`**: two lines with reasons (>= 10 chars): the ticket "names one key the browser
  may fill for ten minutes; nothing is stored until confirm", the confirm "checks the object's size and bytes
  before a row exists; ids are random".
- [ ] **B3** `pnpm --filter @remonta/api-contract openapi` → commit `openapi.json`.
- [x] **B4 tests**: `test/contract.test.ts` entry list (seven → nine, name order); a types test for the two
  schemas (accepts the fixture, refuses HEIC and 0 bytes and 5 MB + 1).

### Part C -- `apps/api`

- [x] **C1 `src/modules/registration/domain/image-type.ts`**: becomes `export { ... } from '@remonta/schemas'`
  (keeps imports stable in 3a; removed in 3c with the multipart path).
- [x] **C2 new `domain/photo-upload.ts`**: `TICKET_TTL_MS = 600_000`, `PHOTO_CLAIM_WINDOW_HOURS` (moved from
  `stage-photo.ts`, re-exported there), `STAGING_PREFIX = 'staging/'`, `PROCESSED_PREFIX = 'workers/'`,
  `BLOB_PREFIX = 'workers/registration/'`, `stagingKey(id)`, `processedKey(profileId, id)`,
  `thumbnailKey(profileId, id)`, `asIsKey(profileId, id, type)`, `idFromStagingKey`, `storeOf(key): 'gcs' |
  'vercel-blob'`, `publicUrl(base, key)`, `isClaimable(row, now)`. Pure.
- [x] **C3 `adapters/photo-store.ts`**: rename today's interface to `BlobPhotoStore` (`put`, `delete`) kept by
  `LocalDiskPhotoStore` (tests) and `VercelBlobPhotoStore`; new `PhotoStore` (bucket): `createUploadTicket(key,
  contentType, maxBytes, expiresAt)`, `inspect(key)`, `readPrefix(key, bytes)`, `read(key)`, `write(key, data,
  contentType, { cacheControl })`, `delete(key)`; `StoreUnavailable` error; new file `adapters/gcs-photo-store.ts`
  with `GcsPhotoStore({ bucket, publicBaseUrl, apiEndpoint?, credentials?, timeoutMs })` on
  `@google-cloud/storage` (`file.generateSignedPostPolicyV4({ expires, conditions: [['eq', '$Content-Type', t],
  ['content-length-range', 1, max]], fields: { 'Content-Type': t, success_action_status: '201' } })`,
  `getMetadata`, `createReadStream({ start: 0, end: n-1 })`, `download`, `save({ contentType, metadata: {
  cacheControl }, resumable: false })`, `delete({ ignoreNotFound: true })`), every call under
  `AbortSignal.timeout`. The SDK talks to `storage.googleapis.com` / `oauth2.googleapis.com` /
  `iamcredentials.googleapis.com` on its own (as the Blob SDK does); comment it like the Blob adapter.
- [x] **C4 new `application/photo-ticket.ts`**: L1; logs `photo-ticket`; 503 mapping of `StoreUnavailable`.
- [x] **C5 new `application/photo-confirm.ts`**: L2 with the decision table R2; `hashIp` reused from
  `stage-photo.ts`; logs `photo-confirm` / `photo-rejected`; unique-violation → 200.
- [x] **C6 `application/register-worker.ts` + `stage-photo.ts` + `domain/events.ts`**: `claimPhoto` returns `{ url,
  key }`; `createAccount` sets `photos: storeOf(key) === 'gcs' ? null : url` and, for bucket rows, `enqueue(tx, {
  type: PHOTO_UPLOADED, payload: { photoUploadId, workerProfileId } })` after `attachPhoto`; `events.ts` gains
  `PHOTO_UPLOADED` and `PhotoUploadedPayload`. The multipart `stagePhoto` is byte-for-byte unchanged.
- [x] **C7 new `application/photo-process.ts`**: L4; `photoUploadedHandler({ db, store, publicBaseUrl, log,
  concurrency })` wrapping `processPhoto` in a `Bulkhead({ name: 'photo-processing', maxConcurrent, maxQueue: 20,
  queueTimeoutMs: 10_000 })`; lazy `await import('sharp')`; `rotate().resize({ width: 1600, height: 1600, fit:
  'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toColorspace('srgb')` with no `withMetadata`
  (strips all); thumbnail at 256; as-is fallback on decode error (`PermanentFailure` not thrown; event completes);
  logs `photo-process` / `photo-processing-fallback`.
- [x] **C8 `jobs/purge-photos.ts`**: `purgeUnclaimedPhotosJob(db, { gcs, blob? })` per L5 with per-store counts and
  `skippedUnknownStore`.
- [x] **C9 `registration.handlers.ts`**: bind `createPhotoUploadTicket` and `confirmPhotoUpload`; deps gain
  `bucket: PhotoStore`, `publicBaseUrl`; `uploadRegistrationPhoto` keeps `store: BlobPhotoStore`.
- [x] **C10 `config/config.ts`**: add `PHOTO_BUCKET` (required, bucket-name regex), `PHOTO_PUBLIC_BASE_URL`
  (https url, or http for localhost), `GCS_API_ENDPOINT` (optional url), `GCS_TIMEOUT_MS` (default 5000),
  `PHOTO_PROCESS_CONCURRENCY` (default 2); remove `PHOTO_STORE`, `PHOTO_LOCAL_DIR` and their cross-checks;
  `BLOB_READ_WRITE_TOKEN` stays optional (its presence enables the multipart path's store). `test/config.test.ts`
  updated (lines 71-74 become: `PHOTO_BUCKET` required; `GCS_API_ENDPOINT` must be http(s)).
- [x] **C11 `main.ts`**: `const bucket = new GcsPhotoStore({...})`; `const blob = config.BLOB_READ_WRITE_TOKEN ?
  new VercelBlobPhotoStore(token) : undefined`; the multipart handler receives `blob` (if absent, the handler
  answers 503 "photo uploads temporarily unavailable" -- never happens before 3c because the token is in the
  table); `outboxHandlers.set(PHOTO_UPLOADED, photoUploadedHandler(...))`; `purgeUnclaimedPhotosJob(db, { gcs:
  bucket, blob })`.
- [x] **C12 `package.json`**: add `@google-cloud/storage` (7.x) and `sharp` (0.34.x); `pnpm install`; lockfile
  committed; `.env.example` updated (`PHOTO_BUCKET=test-photos`, `PHOTO_PUBLIC_BASE_URL=http://localhost:4443/test-photos`,
  `GCS_API_ENDPOINT=http://localhost:4443`, `BLOB_READ_WRITE_TOKEN=` optional).
- [x] **C13 test doubles `test/registration/fakes.ts`**: `InMemoryPhotoStore implements PhotoStore` (objects map,
  `failNext(op)` injection, ticket = fake fields); `generators.ts`: `fast-check` arbitraries for image headers,
  keys, ids, rows, failure sequences.
- [x] **C14 unit tests `test/registration/photo-units.test.ts`**: keys and `storeOf` (invariant + round-trip
  properties), `isClaimable`, confirm decision table (example + oracle property + idempotence) on the in-memory
  store with a fake db, purge over two stores (model-based property), processing with `sharp`-generated test
  images (processed dims ≤ 1600 / 256, no EXIF segment -- assert via `sharp(buf).metadata().exif === undefined`,
  idempotence on re-run, as-is fallback on garbage bytes, bulkhead never above 2 in flight).
- [x] **C15 policy test `test/registration/gcs-policy.test.ts`**: `GcsPhotoStore` with
  `credentials: { client_email, private_key }` from a throwaway RSA key generated by `node:crypto` in the test;
  `createUploadTicket` → decode `fields.policy` (base64 JSON) → conditions name the key, the type, the range
  and the expiry (round-trip property over generated inputs).
- [x] **C16 integration `test/registration/photo-gcs.int.test.ts`** (`describe.skipIf(!GCS_API_ENDPOINT || !local
  db)`): against the fake server: write/inspect/readPrefix/read/delete; ticket → put the object through the
  client (standing in for the browser) → confirm → row; confirm on missing object 409; oversize 413 and deleted;
  garbage 415 and deleted; claim through `submitWorkerRegistration` → `PhotoUploaded` enqueued → run the handler
  → processed copy, thumbnail, profile URL, staging gone; purge. `registration.int.test.ts` and `harness.ts`
  updated for the new deps shape (multipart path still on `LocalDiskPhotoStore`).
- [x] **C17 `test/route-security.test.ts`**: unchanged in 3a (the multipart entry still exists); a case that the
  two new entries refuse a non-JSON body (400) and an unknown field (strict object).

### Part D -- `infra/`

- [x] **D1 `lib/stages.ts`**: `environment` per stage gains `PHOTO_BUCKET` and `PHOTO_PUBLIC_BASE_URL`; `common`
  drops `PHOTO_STORE`; `SECRET_NAMES` unchanged. `pnpm --filter @remonta/infra run render` → commit both YAML.
- [x] **D2 `cloudrun/lib.sh`**: `bucket_for`, `origins_for`. **`cloudrun/bootstrap.sh`**: step 11 per
  infrastructure design §4 (enable `storage.googleapis.com`; create bucket; lifecycle and CORS from
  `cloudrun/storage/lifecycle.json`, `cors.staging.json`, `cors.prod.json`; managed folder + `allUsers`
  objectViewer; SA bindings; audit config merge with `node -e`; two `metric` lines). `bash -n`.
- [x] **D3 tests**: `test/cloudrun.test.ts:76` → asserts `PHOTO_BUCKET` and `PHOTO_PUBLIC_BASE_URL ===
  'https://storage.googleapis.com/' + PHOTO_BUCKET` and no `PHOTO_STORE`; `test/monitoring.test.ts` gains:
  `bucket_for` names equal the table's `PHOTO_BUCKET`; the three storage JSON files parse and the CORS origins
  per stage match `CORS_ORIGINS` of the table.
- [x] **D4 `infra/README.md`**: the buckets row; bootstrap step 11; the fake server for tests.

### Part E -- CI, local setup, docs

- [x] **E1 `.github/workflows/ci-api.yml`**: service `gcs: fsouza/fake-gcs-server:<pinned>` with the documented
  args (`-scheme http -public-host localhost:4443`; if a service container cannot take args on the runner, a
  `docker run -d` step before the tests instead), health check, workflow env `GCS_API_ENDPOINT`, `PHOTO_BUCKET`,
  `PHOTO_PUBLIC_BASE_URL`.
- [x] **E2 `scripts/setup-new-machine.sh`**: start `remonta-s1-gcs` beside the PostGIS container; export the three
  variables for the verify run. **CLAUDE.md** "apps/api" section: the container command and the variables.
- [x] **E3 `docs/signup`**: `02-api-reference.md` table rows and §4.6 split into 4.6a ticket, 4.6b confirm, 4.6c the
  multipart entry "kept until the wizard switch"; `01-flow.md` step 4 and the diagram; `03-data-model.md` §2.8
  (the key prefixes, "a row exists only after confirm"); `05-events-and-emails.md` (`PhotoUploaded`, the two log
  metrics, the purge over two stores); `README.md` source files (`photo-ticket.ts`, `photo-confirm.ts`,
  `photo-process.ts`, `gcs-photo-store.ts`) and the §1 link title fix ("One backend").

### Part F -- gates and hand-off (3a)

- [ ] **F1** `pnpm --filter @remonta/schemas run quality`, `@remonta/api-contract` (incl. openapi drift),
  `@remonta/api` with PostGIS and the fake server running locally (`docker run -d --name remonta-s1-gcs -p
  4443:4443 fsouza/fake-gcs-server:<tag> -scheme http -public-host localhost:4443`), `@remonta/infra`;
  `npx turbo run build`; `git diff --ignore-all-space --numstat` shows no generated client.
- [ ] **F2** Summary `aidlc-docs/construction/photo-gcs/code/photo-gcs-3a-summary.md`; push; PR link; then the user
  runs bootstrap (buckets) before merging; after merge: staging checks of the deployment architecture; promotion.

---

## PR 3b -- the wizard switch (`feat/photo-gcs-wizard`, after 3a is promoted)

### Part G -- `packages/form-engine`

- [x] **G1 `src/types.ts`**: photo kind `{ kind: "photo"; ticketEntry: string; confirmEntry: string }`;
  `UploadTarget`, `Uploader`, `UploadError` (`status`, `policyRefused`), `UploadProgress`.
- [x] **G2 `src/form.ts`**: `defineForm` checks `ticketEntry` and `confirmEntry` exist and are JSON entries.
- [x] **G3 new `src/photo-upload.ts`**: `stagePhoto(def, backend, field, file, deps)` per L6 and R6; `HEIC_MESSAGE`;
  `isHeicHeader` re-exported from `@remonta/schemas` (engine already depends on it through the contract? -- add
  `@remonta/schemas` as a direct dependency; P-7 unaffected).
- [x] **G4 `src/submit.ts`**: delete `uploadToApi`; `messageFor(413)` → "Your photo is too large. Please choose a
  photo under 5 MB."; `messageFor(415)` → "Please upload a JPEG, PNG or WebP photo."; `index.ts` exports.
- [x] **G5 tests `test/engine.test.ts`**: replace "uploads a photo through its entry" with a `stagePhoto` suite on
  a modelled api (ticket/confirm stubs) and a fake `Uploader` with scripted failures: happy path; retry on the
  same ticket; fresh ticket after 403; final message after the budget; abort stops requests; 413/415 final;
  `fast-check` property: at most 3 uploads per ticket and 2 tickets for any failure sequence. `defineForm` case
  for a missing `confirmEntry`.

### Part H -- `apps/app`

- [x] **H1 new `features/forms/adapters/xhrUploader.ts`** + `xhrUploader.test.ts` (fake XHR: fields order, file
  last, progress events, abort, 2xx resolve, 403 → `policyRefused`).
- [x] **H2 new `features/forms/adapters/readHeader.ts`** (`file.slice(0, 16).arrayBuffer()`).
- [x] **H3 `features/forms/useFormWizard.ts`**: `uploaderFor` per frontend design (shrink, header, HEIC stop with
  `console.warn('[photo] heic-rejected')`, per-field `AbortController`, `stagePhoto` with `xhrUploader`, progress
  callback; abort on unmount); imports `stagePhoto` instead of `uploadToApi`.
- [x] **H4 `features/forms/FormWizard.tsx`**: `PhotoSlot` holds `progress` state and passes it; `uploader`
  signature gains `onProgress`.
- [x] **H5 `components/ui/form-wizard/fields.tsx`**: `PhotoField` passes `accept`, `allowedTypes`,
  `typeErrorMessage`, `progress` to `PhotoUpload`.
- [x] **H6 `components/forms/fields/PhotoUpload.tsx`**: optional props `accept`, `allowedTypes`,
  `typeErrorMessage`, `progress`; `upload?(file, onProgress?)`; render a `role="progressbar"` bar
  (`data-testid="photo-upload-progress"`) when `progress` is set, else today's label; defaults unchanged
  (dashboard screens untouched).
- [x] **H7 `features/forms/definitions/workerRegistration.ts`**: `ticketEntry: "createPhotoUploadTicket"`,
  `confirmEntry: "confirmPhotoUpload"`.
- [ ] **H8 `next.config.ts`**: `remotePatterns` += `{ protocol: 'https', hostname: 'storage.googleapis.com',
  pathname: '/remonta-api-photos*/**' }`.
- [~] **H9 tests** (`forms.test.ts` holds; the hook and component tests cannot run in the app's Node-only vitest -- recorded in the summary, proven on the preview): `forms.test.ts` (definition carries both entries; the preview tests unchanged); a hook test for
  the HEIC stop (no network call, the message); `PhotoUpload` prop defaults test.
- [x] **H10 docs**: `docs/signup/01-flow.md` step 4 (the three calls, progress, HEIC); `02-api-reference.md` client
  notes.

### Part I -- gates and hand-off (3b)

- [x] **I1** `pnpm --filter @remonta/form-engine run quality`, `@remonta/app run quality` (baselines not grown),
  `npx turbo run build`.
- [x] **I2** (PR #38 merged 2026-10-05 as `177a2c2`; production serves the new wizard, apis healthy; the phone run on production is the user's, rows P1-P2 of the checklist) Summary `photo-gcs-3b-summary.md`; push; PR; the preview checklist (requirements §6.2, phone in hand)
  recorded in `aidlc-docs/construction/photo-gcs/code/preview-checklist-3b.md`; merge; production check.

---

## PR 3c -- clean-up (`feat/photo-gcs-cleanup`, after the cut-over window)

- [x] **J1 `packages/api-contract`**: remove `uploadRegistrationPhoto`, its `public-endpoints.json` line, regenerate
  `openapi.json`; tests (nine → eight; the synthetic multipart case stays on a synthetic contract).
- [x] **J2 `apps/api`** (amended by option 2: `VercelBlobPhotoStore`, `BlobPhotoStore`, `@vercel/blob` and the token STAY for the clean copies; the rest as written): remove `stage-photo.ts` (move `claimPhoto`/`attachPhoto`/`hashIp` to
  `application/photo-claim.ts`), `LocalDiskPhotoStore`, `VercelBlobPhotoStore`, `BlobPhotoStore`, the
  `@vercel/blob` dependency, `BLOB_READ_WRITE_TOKEN` from config; purge takes one store; `domain/image-type.ts`
  re-export removed (imports point at `@remonta/schemas`); `route-security.test.ts` multipart section becomes a
  synthetic-contract test; harness and int tests use ticket + confirm on the in-memory or fake store.
- [x] **J3 `infra/`** (CANCELLED by option 2, 2026-10-05: the Blob token remains one of the six secrets): `SECRET_NAMES` minus `BLOB_READ_WRITE_TOKEN`; render; `lib.sh`/bootstrap `SECRETS` list;
  tests ("exactly the five secrets").
- [x] **J4 docs**: `02-api-reference.md` 4.6c removed; `03-data-model.md` §5 history note; CLAUDE.md secrets
  count; `README` source files.
- [~] **J5** (gates green locally except the PostGIS and fake-bucket suites, Docker down: CI proves them; summary written; pushed 2026-10-05; PR, merge, staging, promotion wait for the cut-over window, 2026-10-08 at the earliest) gates; summary `photo-gcs-3c-summary.md`; PR; merge; staging; promotion; the user deletes the two
  Blob secrets in Secret Manager.

---

## Story traceability

| Story | Steps |
|---|---|
| US-PH-01 pick and keep filling | H3, H4, G3 |
| US-PH-02 progress | H1, H4, H5, H6 |
| US-PH-03 dropped connection | G3, G5, H1 |
| US-PH-04 submit waits | H3 (uploads ref unchanged), C6 |
| US-PH-05 iPhone just works | H5, H6 (accept list) |
| US-PH-06 HEIC message | A1, H2, H3, C5 (415 backstop) |
| US-PH-07 clean photo | C7, C14, C16 |
| US-PH-08 old photos unchanged | C6 (Blob rows), H8 (host added, Blob hosts kept) |
| US-PH-09 thumbnail exists | C7 |
| US-PH-10 ticket | B1, C3, C4, C15 |
| US-PH-11 confirm | B1, C5, C14, C16 |
| US-PH-12 claim | C6, C16 |
| US-PH-13 processing | C7, C14, C16 |
| US-PH-14 purge both stores | C8, C14 |
| US-PH-15 fake bucket in CI | E1, E2, C16 |
| US-PH-16 switch over | 3a/3b/3c ordering, J1-J5 |

## Estimated scope

3a: ~20 files changed or created in api, 2 in schemas, 3 in api-contract, 8 in infra, 2 in CI/scripts, 5 docs.
3b: 4 engine files + tests, 7 app files + tests, 2 docs. 3c: removals across api, contract, infra, docs.
