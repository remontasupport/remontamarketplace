# User Stories -- sign-up photo on Google Cloud Storage

**Sources:** `../requirements/requirements.md` (approved 2026-10-05); `../plans/story-generation-plan.md`
(Q1 A format, Q2 A personas, Q3 A journey-based with a system epic); `personas.md`.
**Format:** "As a / I want / so that" + Given/When/Then; each story tagged with persona, MoSCoW priority and FR ids;
**PBT** names the property-based-testing property where one applies.

**Shared rules that hold for every story** (stated once):
- **R-ID:** upload ids are random UUIDs; every ticket, confirm and claim is addressed by that id and nothing else
  (NFR-06).
- **R-LOG:** every stage logs its duration with the request id and never logs a ticket signature, an IP, or file
  content (FR-20).
- **R-LIMITS:** the 5 MB limit and the 1600 px longest edge apply everywhere a size or dimension is checked (D13).
- **R-GATE:** nothing in E3 reaches production before it ran on staging through the preview checklist (CLAUDE.md).

**Epics**

| Epic | Title | Persona | FRs | Stories |
|---|---|---|---|---|
| E1 | Upload my photo during sign-up | P1 Worker | FR-01..05, FR-09..11 | 6 |
| E2 | Photos after sign-up | P2 Administrator | FR-08, FR-12, FR-13 | 3 |
| E3 | The api behind the upload | S4 `apps/api` | FR-01..07, FR-16..20 | 7 |
| E4 | The latency alert | S5 Operator | FR-14, FR-15 | 2 |
| | | | **Total** | **18** |

---

## E1 -- Upload my photo during sign-up

### US-PH-01 -- Pick a photo and keep filling the form
**Persona:** P1 Worker (V7) · **Priority:** M · **FRs:** FR-01, FR-02, FR-05

As a worker signing up on my phone, I want my photo to start uploading the moment I choose it, so that I am not kept waiting on the photo step.

- **Given** I choose a JPEG, PNG or WebP, **when** the file is selected, **then** the browser shrinks it (longest edge 1600 px, JPEG) as today, asks the api for a ticket, and starts sending the file straight to storage, while the step shows my preview and lets me continue.
- **Given** the upload is still running, **when** I move to the next steps, **then** the form keeps working and the upload continues in the background.
- **Given** the upload finished and was confirmed, **then** the field holds the upload id and the step shows "uploaded", exactly as it does today.
- **Given** I am offline when I pick the photo, **then** the wizard's existing offline pause applies and the upload starts when I am back online.
- **PBT:** for any image dimensions, the shrink step's output never exceeds 1600 px on its longest edge and never enlarges (invariant, idempotence: shrinking twice equals shrinking once).

### US-PH-02 -- See the upload's progress
**Persona:** P1 Worker (V7) · **Priority:** M · **FRs:** FR-02, FR-05

As a worker on mobile data, I want to see how far my photo upload has got, so that I know it is working and not stuck.

- **Given** the upload is in flight, **then** the photo field shows a progress indicator that advances with the bytes sent, replacing today's spinner.
- **Given** the upload completes, **then** the indicator reaches the end and the confirmation state replaces it.
- **Given** the ticket was issued but the upload has not started within a few seconds (slow network), **then** the indicator shows an indeterminate state rather than 0 % forever.

### US-PH-03 -- A dropped connection does not lose my photo
**Persona:** P1 Worker (V7) · **Priority:** M · **FRs:** FR-02, FR-03, FR-05

As a worker on a weak connection, I want a failed upload to retry by itself, so that I do not have to notice and start again.

- **Given** the transfer to storage fails part-way (network error, 5xx from storage), **when** it fails, **then** the browser retries the upload with the same ticket, with back-off, up to the engine's retry limit.
- **Given** the ticket has expired (10 minutes) before the upload succeeded, **when** the browser retries, **then** it asks the api for a fresh ticket and uploads under the new id; the old row is left for the purge.
- **Given** every retry failed, **then** the field shows "Your photo could not be uploaded. Please try again or choose another photo." and the form cannot be submitted until a photo is uploaded, as today.
- **Given** I pick a different photo while one is uploading, **then** the first upload is abandoned (its row is left for the purge) and only the new one counts.

### US-PH-04 -- Submit waits for my photo
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-04, FR-05

As a worker, I want the form to wait for my photo if it is still uploading when I press submit, so that my account is created with the photo I chose.

- **Given** an upload is in flight, **when** I submit, **then** the status shows "uploading", the form waits for the confirmation, then sends the registration with the upload id.
- **Given** the upload fails during that wait, **then** the form returns to the photo step with the error message and nothing is submitted.
- **Given** the registration is accepted, **then** my profile has my photo immediately (the uploaded copy), later replaced by the processed copy (US-PH-07) without anything for me to do.

### US-PH-05 -- My iPhone photo just works
**Persona:** P1 Worker (V8a, V8c) · **Priority:** M · **FRs:** FR-09, FR-11

As a worker with an iPhone, I want to pick a photo from my camera roll and have it accepted, so that I never learn what HEIC is.

- **Given** the file input no longer lists HEIC or HEIF in its accept list (JPEG first), **when** I pick a photo shot in HEIC on an iPhone or iPad, in Safari or an in-app browser, **then** the device hands the page a JPEG and the upload proceeds as US-PH-01.
- **Given** I pick a HEIC on a Mac in Safari, **then** the browser decodes it and the shrink step uploads a JPEG; no message is shown.
- **Given** the dashboard screens that render the same shared component, **then** they are unchanged in this cycle (scope narrowed 2026-10-05: sign-up only).

### US-PH-06 -- I am told exactly what to do with a HEIC I cannot upload
**Persona:** P1 Worker (V8b) · **Priority:** M · **FRs:** FR-10, FR-11

As a worker on Android or a desktop with a HEIC file, I want a clear message before any upload, so that I can fix it in one step.

- **Given** the browser cannot decode the file and its first bytes carry a HEIC `ftyp` brand, **when** I pick it, **then** before any ticket or upload the field shows: "This photo is in HEIC format. Please choose a JPEG or PNG. On iPhone, set Camera > Formats > Most Compatible." and the occurrence is logged without the file.
- **Given** a file with a `.heic` name but JPEG bytes, **then** it is treated as a JPEG (bytes decide, not the name).
- **Given** a HEIC reaches the api anyway (an old client, a crafted request), **when** confirm inspects the bytes, **then** the upload is refused with 415 and the message "Please upload a JPEG, PNG or WebP photo."
- **PBT:** for any byte prefix, the device-side detector and the api's sniffer agree on JPEG, PNG, WebP, HEIC or none (oracle: the two implementations against the same generated headers).

---

## E2 -- Photos after sign-up

### US-PH-07 -- The profile shows a clean photo
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-06, FR-13

As an administrator, I want a new worker's profile photo to be a correctly oriented, reasonably sized JPEG with no hidden metadata, so that it displays consistently and reveals nothing about where it was taken.

- **Given** a worker registered with a photo, **when** the background processing has run (within a minute in normal operation), **then** the profile's photo URL points at the processed copy: JPEG, longest edge at most 1600 px, orientation applied, no EXIF, GPS, XMP or IPTC blocks, served from the public processed prefix of the bucket.
- **Given** the processing has not run yet or failed, **then** the profile shows the uploaded copy and nothing is blank.
- **Given** the processed copy exists, **then** the original upload is gone from the staging prefix.
- **PBT:** for any generated image, processing is idempotent (processing the processed copy yields identical dimensions and no metadata) and never enlarges (invariant).

### US-PH-08 -- Old photos stay exactly as they are
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-12

As an administrator, I want every photo and document uploaded before the switch to keep displaying, so that the change is invisible for existing workers.

- **Given** a profile whose photo is a Vercel Blob URL, **when** I open the worker's record, the admin list or the public list after the switch, **then** the photo renders as before; no stored URL was rewritten.
- **Given** a worker replaces their photo from the dashboard after the switch, **then** the dashboard's existing Blob route handles it and the new Blob URL displays; the profile may hold a Google URL or a Blob URL and both render through the allowed-hosts list.

### US-PH-09 -- A thumbnail exists for later
**Persona:** P2 Administrator · **Priority:** S · **FRs:** FR-08

As Remonta, I want a 256 px thumbnail stored beside each processed photo, so that lists can adopt it in a later cycle without re-processing.

- **Given** processing succeeded, **then** a 256 px JPEG thumbnail exists under the processed prefix and its URL is recorded on the upload row (or the profile column chosen at design, OI-3).
- **Given** this cycle, **then** no screen displays the thumbnail yet.

---

## E3 -- The api behind the upload

### US-PH-10 -- Issue a ticket that can only do one thing
**Persona:** S4 `apps/api` · **Priority:** M · **FRs:** FR-01, FR-16, NFR-05, NFR-06

As the api, I want to hand the browser a ticket that allows exactly one upload of one accepted type and bounded size to one server-chosen key, so that nobody can use the bucket for anything else.

- **Given** a request with a declared type in {JPEG, PNG, WebP} and a size of at most 5 MB, **when** the ticket entry is called within the rate limits (10/h per IP, 300/h global), **then** a `PENDING` row is created with a random UUID and a key under the staging prefix, and the response carries the upload id, the upload target and the signed fields, valid for 10 minutes and bound to that key, that content type and a size range up to 5 MB.
- **Given** a declared type outside the list, a size over 5 MB, or a malformed body, **then** 400 or 415 with a field error and no row.
- **Given** the IP or global limit is exceeded, **then** 429 with `Retry-After`, as today.
- **Given** the signing service (IAM) or the bucket is unavailable, **then** 503 with a generic message within the call's timeout, and nothing is recorded (NFR-11).
- **Given** a ticket is used to upload a different key, a different content type, or more than 5 MB, **then** storage refuses it; the api never sees those bytes.
- **PBT:** for any generated (type, size) within bounds, the policy document the api produces, when parsed back, names exactly that key, type and size range (round-trip); any key the api derives starts with the staging prefix and contains no path separators beyond it (invariant).

### US-PH-11 -- Confirm an upload before trusting it
**Persona:** S4 `apps/api` · **Priority:** M · **FRs:** FR-03, NFR-05, NFR-08

As the api, I want to inspect what landed in the bucket before the id can be used, so that only genuine images of accepted type and size can be claimed.

- **Given** a `PENDING` row and an object at its key, **when** confirm is called with the id, **then** the api reads the object's metadata (size at most 5 MB, content type in the list) and its first bytes (JPEG, PNG or WebP signature), marks the row `STAGED` with the real size and type, and returns 200 with the id.
- **Given** no object at the key (upload never finished), **then** 409 "upload incomplete" and the row stays `PENDING` for the purge.
- **Given** the object is too large, the wrong type, or not an image by its bytes, **then** 413 or 415 with the existing messages, the object is deleted, and the row is marked `REJECTED` so it can never be claimed.
- **Given** a row already `STAGED`, **when** confirm is called again, **then** 200 with the same id and no change (idempotent).
- **Given** an unknown id, or a row that is `REJECTED`, `CLAIMED` or expired, **then** 404.
- **Given** the bucket is unreachable within the timeout, **then** 503 and the row stays `PENDING` (fail closed).
- **PBT:** for any byte prefix, confirm's accept/reject decision equals the sniffer's classification (oracle); confirm applied twice equals confirm applied once (idempotence).

### US-PH-12 -- Claim the photo into the account
**Persona:** S4 `apps/api` · **Priority:** M · **FRs:** FR-04, FR-06

As the api, I want registration to take a staged upload id exactly as today, so that the sign-up's contract and the form's definition do not change.

- **Given** a `STAGED` row less than 24 h old, **when** registration is accepted with its id, **then** inside the registration transaction the row becomes `CLAIMED`, the profile's photo URL is set to the uploaded copy's URL, and a `PHOTO_UPLOADED` outbox event is enqueued with the profile id and the upload id.
- **Given** a row that is `PENDING`, `REJECTED`, already `CLAIMED` or older than 24 h, **then** registration is refused with the existing field error for the photo and nothing is created.
- **Given** a row staged on Blob before the switch (store recorded as `vercel-blob`), **when** it is claimed, **then** the profile receives its Blob URL and no processing event is enqueued (processing targets bucket objects only).

### US-PH-13 -- Process the photo in the background
**Persona:** S4 `apps/api` · **Priority:** M · **FRs:** FR-06, FR-08, NFR-10

As the api, I want to produce the clean copy and the thumbnail after the account exists, so that the request path stays fast and a processing failure never blocks a sign-up.

- **Given** a `PHOTO_UPLOADED` event, **when** the outbox handler runs, **then** it reads the original, applies the EXIF orientation, resizes to at most 1600 px, encodes JPEG quality 85 with all metadata removed, writes the processed copy and a 256 px thumbnail under the profile's prefix, updates the profile's photo URL to the processed copy, records the thumbnail URL, and only then deletes the original; all within the handler timeout.
- **Given** the handler runs twice for the same event (retry after a partial run), **then** the outcome is the same: existing copies are overwritten identically, the profile URL is the processed one, the original is gone.
- **Given** the original is already gone and the processed copy exists, **then** the handler completes without error.
- **Given** the image cannot be decoded, **then** the event fails permanently, is dead-lettered, the existing dead-letter alert fires, and the profile keeps the uploaded copy.
- **Given** the bucket is unavailable, **then** the event fails with back-off and is retried; after the maximum attempts it is dead-lettered as above.
- **PBT:** for any generated image, the handler is idempotent (model-based against the fake store: after one or two runs the store holds exactly the processed copy and thumbnail, never the original).

### US-PH-14 -- Purge what was never used, in both stores
**Persona:** S4 `apps/api` · **Priority:** M · **FRs:** FR-07, FR-17

As the api, I want unclaimed uploads removed daily from whichever store holds them, so that the bucket holds nothing that nobody owns.

- **Given** `PENDING` rows whose ticket expired, `REJECTED` rows, and `STAGED` rows older than 24 h, **when** the daily job runs, **then** their objects are deleted from the store the row names (bucket or Blob) and the rows are deleted; a missing object is not an error.
- **Given** a `STAGED` row claimed between the job's read and its delete, **then** it is not deleted (as today).
- **Given** the bucket's lifecycle rule, **then** any object under the staging prefix older than 2 days is removed even if the job never ran.
- **Given** no Blob-named rows remain and the cut-over window has passed, **then** the Blob token can be removed from the stages table and Secret Manager (US-PH-16).

### US-PH-15 -- Run the same flow locally and in CI against a fake bucket
**Persona:** S4 `apps/api` · **Priority:** M · **FRs:** FR-18, NFR-15

As a developer, I want the ticket, confirm, processing and purge flows to run against a fake Cloud Storage server in CI and on my machine, so that the api's gate proves them without Google credentials.

- **Given** the `fake-gcs-server` container is running (locally beside PostGIS, and in the `API Quality` job), **when** the api's quality gate runs, **then** the adapter, ticket, confirm, processing and purge tests execute against it and pass.
- **Given** the container is absent, **then** those tests are skipped and reported as skipped, never as passed.
- **Given** the `local` disk store, **then** it no longer exists; `PHOTO_STORE=gcs` with an endpoint override is the development configuration, and the setup script documents the container.

### US-PH-16 -- Switch over without losing anyone
**Persona:** S4 `apps/api` · **Priority:** M · **FRs:** FR-17, NFR-14 · **Variation:** V6

As Remonta, I want the promotion to the new image to be safe for a person mid-sign-up and reversible, so that the cut-over needs no downtime.

- **Given** a photo staged on Blob minutes before the promotion, **when** the person submits minutes after, **then** registration succeeds with the Blob URL (US-PH-12).
- **Given** the new image is live, **then** the app's new wizard code and the api's new entries ship such that an old wizard page still open in a browser either completes with the old entry or shows a retryable error, never a silent failure (design decides: keep the multipart entry for one release, or version the contract).
- **Given** a rollback to the previous image, **then** sign-ups continue on Blob; bucket-staged rows wait for the new image's purge; the lifecycle rule covers their objects.
- **Given** a few days after the switch with no Blob-named rows left, **then** `BLOB_READ_WRITE_TOKEN` is removed from `stages.ts` and Secret Manager and the api boots without it.

---

## E4 -- The latency alert

### US-PH-17 -- An alert that means saturation
**Persona:** S5 Operator · **Priority:** M · **FRs:** FR-14

As the operator, I want the latency alert to fire only when the service as a whole is slow under real traffic, so that an email means something is wrong.

- **Given** the corrected policy, **when** one request on a quiet service takes 4 s, **then** no incident opens.
- **Given** the service's p95 across all routes exceeds 2 s for at least two consecutive 5-minute windows while the request count exceeds the configured minimum, **then** one incident opens and one email arrives.
- **Given** the policy's documentation text, **then** it describes the service-wide p95, the volume condition and the duration, and the runbook steps.
- **PBT:** none (configuration).

### US-PH-18 -- Apply a policy change to the live project
**Persona:** S5 Operator · **Priority:** M · **FRs:** FR-15

As the operator, I want a repeatable step that updates existing alert policies from the JSON in the repository, so that a policy edit reaches Google Cloud without deleting and recreating anything.

- **Given** a policy JSON changed in `infra/cloudrun/monitoring/`, **when** the apply step runs for a stage, **then** the policy with that display name is updated in place (conditions, documentation, strategy) and created only if missing; the step prints what changed.
- **Given** no change, **then** the step reports nothing to do.
- **Given** the step ran for production, **then** the next day passes without a single-upload email (verification §6.3).

---

## Traceability

| FR | Stories |
|---|---|
| FR-01 | US-PH-01, US-PH-10 |
| FR-02 | US-PH-01, US-PH-02, US-PH-03 |
| FR-03 | US-PH-03, US-PH-11 |
| FR-04 | US-PH-04, US-PH-12 |
| FR-05 | US-PH-01, US-PH-02, US-PH-04 |
| FR-06 | US-PH-07, US-PH-12, US-PH-13 |
| FR-07 | US-PH-14 |
| FR-08 | US-PH-09, US-PH-13 |
| FR-09 | US-PH-05 |
| FR-10 | US-PH-06 |
| FR-11 | US-PH-05, US-PH-06 |
| FR-12 | US-PH-08 |
| FR-13 | US-PH-07 |
| FR-14 | US-PH-17 |
| FR-15 | US-PH-18 |
| FR-16 | US-PH-10 (bucket, IAM, CORS, lifecycle at Infrastructure Design) |
| FR-17 | US-PH-14, US-PH-16 |
| FR-18 | US-PH-15 |
| FR-19 | every story's PR (docs in the same PR) |
| FR-20 | R-LOG |

**Preview checklist cross-check (requirements §6.2):** phone upload with progress = US-PH-01/02; HEIC on iPhone =
US-PH-05; HEIC on Android or desktop = US-PH-06; full sign-up = US-PH-04/12; processed copy, thumbnail, original
gone, no EXIF = US-PH-07/09/13; old Blob photo displays = US-PH-08; slow single request does not fire = US-PH-17.

## Amendment 2026-10-05 (Functional Design)

No new columns (user decision). In US-PH-10, US-PH-11, US-PH-14 and US-PH-16 read "a `PENDING` row" as "no row
yet", "`STAGED`" as "the row exists, unclaimed", "`REJECTED`" as "object deleted, no row", and "the row records
which store" as "the key's prefix says which store". Acceptance criteria otherwise unchanged; the purge of
never-confirmed objects is the bucket lifecycle rule.
