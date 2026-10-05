# Components -- sign-up photo on Google Cloud Storage

**Sources:** `../plans/application-design-plan.md` (Q1 A signed POST policy, Q2 A URLs on the upload row, Q3 A the
multipart entry keeps storing to Blob during the overlap, Q4 A code inside `modules/registration`; approved
2026-10-05). Scope: the sign-up path only.

One simplification against the plan: there is no separate ticket signer. The Cloud Storage client signs a POST
policy itself, and on Cloud Run without a key file it does so through IAM `signBlob` with the runtime service
account. The GCS adapter therefore owns ticket creation.

## Shared (packages/schemas)

### C1 `imageType` -- the byte sniffer, one implementation
- **Purpose**: classify a byte prefix as JPEG, PNG, WebP, HEIC or none.
- **Responsibilities**: the four signatures (JPEG `FF D8 FF`, PNG 8-byte header, WebP `RIFF....WEBP`, HEIC `ftyp`
  + brand set); pure, no dependencies.
- **Interface**: `detectImageType(bytes: Uint8Array): ImageType | null`, `ACCEPTED_IMAGE_TYPES` (JPEG, PNG,
  WebP), `IMAGE_HEADER_BYTES = 16`.
- **Why here**: today it lives in the api (`domain/image-type.ts`). The wizard needs the same decision for the
  HEIC message, and `packages/schemas` is the one dependency-free package both the engine and the api already
  reach (through `@remonta/api-contract`). The api file becomes a re-export. P-5 holds (no Next, React, DOM,
  Prisma).

## Contract (packages/api-contract)

### C2 `registration.contract.ts` -- three photo entries
- **Purpose**: declare the ticket and confirm entries; keep the multipart entry until PR 3c.
- **Responsibilities**: Zod bodies and responses; `meta()` with access, bot, rate limits, body limits;
  `public-endpoints.json` lines.
- **Interface**: `createPhotoUploadTicket` (POST `/v1/registrations/worker/photo-tickets`),
  `confirmPhotoUpload` (POST `/v1/registrations/worker/photo-confirmations`), `uploadRegistrationPhoto`
  (unchanged until 3c, HEIC still listed there so the live wizard's behaviour does not change at 3a).

## Form engine (packages/form-engine)

### C3 `photo` kind -- the field definition
- **Purpose**: the field whose value is a staged upload id.
- **Responsibilities**: default, validation ("Profile photo is required"), body mapping; `defineForm` checks the
  two entries exist in the contract.
- **Interface**: `FieldDef` variant `{ kind: "photo"; ticketEntry: string; confirmEntry: string }` (replaces
  `uploadEntry` in 3b).

### C4 `stagePhoto` -- the three-step upload
- **Purpose**: turn a file into a staged upload id: ticket, direct upload, confirm.
- **Responsibilities**: call the ticket entry through the contract client; hand the file and the target to the
  `Uploader` port with progress; call confirm; retry with back-off honouring `Retry-After`; obtain a fresh ticket
  when one expired or the upload failed past the ticket's life; map 404/409/413/415/429/503 to the field's
  messages; honour an abort signal.
- **Interface**: `stagePhoto(def, backend, field, file, deps: { uploader; onProgress?; signal?; retry? }):
  Promise<string>`.
- **Never**: touches the DOM or Node (P-7). The transport is the port.

### C5 `Uploader` port and `isHeicHeader`
- **Purpose**: the engine's contract for the browser transport, and the pure HEIC decision.
- **Interface**: `interface Uploader { upload(file: Blob, target: UploadTarget, opts: { onProgress?(sent, total);
  signal? }): Promise<void> }`; `UploadTarget = { url; method: 'POST'; fields: Record<string,string>; fileField }`;
  `isHeicHeader(bytes: Uint8Array): boolean` (wraps C1).

## Application (apps/app)

### C6 `xhrUploader` -- the browser transport
- **Purpose**: implement `Uploader` with `XMLHttpRequest`, the one browser API with upload progress events.
- **Responsibilities**: build the multipart form (signed fields first, the file last under `fileField`), POST to
  the bucket, report progress, abort on signal, resolve on 2xx, reject with a typed error otherwise.
- **Interface**: `xhrUploader: Uploader`.

### C7 `uploaderFor` (in `useFormWizard`) -- the wizard's uploader
- **Purpose**: what the photo field calls with a picked file.
- **Responsibilities**: shrink (unchanged); read the first 16 bytes and, when the file could not be decoded and
  `isHeicHeader` is true, reject with the HEIC message before any network call and log one line; otherwise call
  `stagePhoto` with `xhrUploader`, feeding progress into the field's state and keeping the preview thumbnail as
  today; track in-flight uploads so submit waits.
- **Interface**: `(field) => (file: File, onProgress?) => Promise<string>` (progress added).

### C8 `PhotoField` + `PhotoUpload` props -- the field UI
- **Purpose**: the presentational field; the shared component gains optional props only.
- **Responsibilities**: `PhotoUpload` accepts `accept`, `allowedTypes`, `typeErrorMessage` and `progress`
  (0-100 or `'indeterminate'`), all optional with today's defaults, so dashboard screens are unchanged; the wizard's
  `PhotoField` passes JPEG/PNG/WebP, the wizard's messages, and the progress value, rendered in place of the
  spinner.

### C9 `next.config` image hosts
- **Purpose**: allow `storage.googleapis.com` with the bucket's path prefix in `images.remotePatterns`.

## Api (apps/api, `modules/registration`)

### C10 `domain/photo-upload.ts` -- state machine and keys
- **Purpose**: the pure rules of an upload row.
- **Responsibilities**: states `PENDING`, `STAGED`, `REJECTED`, `CLAIMED`; which transitions are legal
  (`confirm`, `reject`, `claim`, `expire`); key derivation `stagingKey(id, type)` under `staging/`,
  `processedKey(profileId, id)` and `thumbnailKey(profileId, id)` under `workers/`; `publicUrl(base, key)`; the
  claim window (24 h) and the ticket life (10 min).
- **Interface**: pure functions and constants; the place for property-based tests.

### C11 `adapters/photo-store.ts` -- the ports and the two adapters
- **Purpose**: everything that touches an object store.
- **Responsibilities**: `PhotoStore` (bucket): `createUploadTicket`, `inspect`, `readPrefix`, `read`, `write`,
  `delete`; `BlobPhotoStore` (overlap only): `put`, `delete`. `GcsPhotoStore` implements `PhotoStore` with
  `@google-cloud/storage` (signed POST policy V4, metadata, ranged read, download, save with cache control,
  delete) and an optional endpoint override for the fake server; `VercelBlobPhotoStore` keeps `put`/`delete`.
- **Interface**: see `component-methods.md`.

### C12 `application/photo-ticket.ts` -- issue a ticket
- **Purpose**: FR-01 / US-PH-10.
- **Responsibilities**: validate type and size (the contract already did; the function trusts its input), create
  the `PENDING` row with the IP hash, ask the store for a ticket bound to the row's key, return id, target and
  expiry.

### C13 `application/photo-confirm.ts` -- confirm an upload
- **Purpose**: FR-03 / US-PH-11.
- **Responsibilities**: load the row; idempotent on `STAGED`; `inspect` and `readPrefix` the object; decide with
  C1 and the limits; transition to `STAGED` with the real size and type, or delete the object and mark
  `REJECTED`; typed errors for 404, 409, 413, 415, 503.

### C14 `application/register-worker.ts` `claimPhoto` -- claim (changed)
- **Responsibilities**: only `STAGED` rows within the window; set `CLAIMED`; copy the row's URL into the profile;
  enqueue `PhotoUploaded` when the row's store is `gcs`.

### C15 `application/photo-process.ts` -- the outbox handler
- **Purpose**: FR-06 / US-PH-13.
- **Responsibilities**: `processPhoto(uploadId)`: read the original, `sharp` (lazy import) rotate, resize inside
  1600 px, JPEG q85, metadata stripped, sRGB; thumbnail 256 px; `write` both with a long immutable cache control;
  update the profile's `photos` and the row's `processedUrl`/`thumbnailUrl`; delete the original; idempotent on
  re-run; permanent failure on undecodable input.

### C16 `application/stage-photo.ts` -- the multipart path (overlap only)
- **Responsibilities**: unchanged behaviour: sniff, `BlobPhotoStore.put`, row with `store = vercel-blob`,
  `state = STAGED`. Removed in 3c with the entry.

### C17 `jobs/purge-photos.ts` -- purge (changed)
- **Responsibilities**: expired `PENDING`, `REJECTED`, and `STAGED` older than 24 h; delete from the store the row
  names; count per store in the job summary.

### C18 `registration.handlers.ts`, `config.ts`, `main.ts` -- wiring
- **Responsibilities**: two new handlers bound to the entries; config `PHOTO_BUCKET`, `PHOTO_PUBLIC_BASE_URL`,
  optional `GCS_API_ENDPOINT` (fake server) and optional `BLOB_READ_WRITE_TOKEN` (overlap; the multipart handler is
  bound only while the entry exists); `main.ts` builds the GCS store, registers `PhotoUploaded` in the outbox
  handler map, passes both stores to the purge job.

## Infrastructure (infra/) and CI

### C19 Stages table and bootstrap
- **Responsibilities**: `stages.ts` gains `PHOTO_BUCKET` and `PHOTO_PUBLIC_BASE_URL` per stage; `bootstrap.sh`
  enables the Storage API, creates each bucket (regional, uniform access, soft delete default, lifecycle: delete
  `staging/` after 2 days, CORS for the stage's origins and POST), grants public read on the `workers/` managed
  folder only, and binds the runtime service account to `roles/storage.objectUser` on its bucket and
  `roles/iam.serviceAccountTokenCreator` on itself.

### C20 Alert policy and apply step (U1)
- **Responsibilities**: the corrected `latency-p95.json`; `infra/cloudrun/apply-alerts.sh <stage>` that updates
  policies by display name and creates missing ones; bootstrap calls it.

### C21 `API Quality` workflow
- **Responsibilities**: a `fake-gcs-server` service container beside PostGIS; `GCS_API_ENDPOINT` and
  `PHOTO_BUCKET` for the tests; the local setup script documents the same container.
