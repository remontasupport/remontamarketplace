# Application Design Plan -- sign-up photo on Google Cloud Storage

**Inputs:** `../requirements/requirements.md` (approved; D6/FR-09 revised 2026-10-05 for the sign-up-only scope),
`../user-stories/stories.md`, `../requirements/signup-photo-inventory.md`, and the code shapes the design must
fit: contract entries with `meta()`, `defineHandlers`, the `PhotoStore` port, the outbox `OutboxHandler` map, the
scheduler `Job`, the engine's `photo` kind and `uploadToApi`, the wizard's `uploaderFor`, the shared `PhotoUpload`
component's `upload` prop, and the `RegistrationPhotoUpload` row.

**Scope rule (user, 2026-10-05):** only the sign-up path. No dashboard route, no change to the shared component's
defaults.

Four decisions shape the components. Each is pre-filled with a proposal; leave it to accept or change the letter,
then say "approved" (or "done").

## Question 1
How the browser's upload ticket is signed (requirements OI-2).

A) **A V4 signed POST policy document.** The api signs a policy naming the exact key, the content type, a
`content-length-range` of 1 byte to 5 MB and a 10-minute expiry; the browser sends one multipart form POST to the
bucket with the signed fields. Storage enforces every constraint, size included. Signing uses the runtime service
account through IAM `signBlob`, no key file. A form POST without custom headers needs no CORS preflight; the bucket's
CORS still names the app origins so the browser may read the response. Recommended.

B) **A V4 signed PUT URL.** Simpler client code (one PUT with the file as body), bound to key and content type, but
Cloud Storage does not enforce a size limit on a signed PUT, so only the api's confirm step catches an oversized
object after it was fully uploaded.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
Where the processed-photo and thumbnail URLs live (requirements OI-3).

A) **On the upload row** (`registration_photo_uploads`: `processedUrl`, `thumbnailUrl`, plus `state` and `store`).
No profile schema change; the profile's `photos` column receives the processed URL when processing finishes, as it
receives the uploaded URL at claim today. A later cycle that displays thumbnails joins through
`claimedByWorkerProfileId` or adds a profile column then. Recommended: additive, one table.

B) **A new profile column** `photoThumbnailUrl` on `worker_profiles`, written by the processing handler, ready for
readers to adopt without a join. Touches the app's Prisma client and the shared schema now.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
What the kept multipart entry does between PR 3a's promotion and PR 3b's merge (the live wizard still calls it).

A) **Exactly what it does today: stores to Vercel Blob** through the existing adapter, rows marked
`store = vercel-blob`, `state = STAGED`. The live path's behaviour does not change until 3b has passed the preview
checklist, which is CLAUDE.md's rule. The Blob adapter and token leave in 3c. Recommended.

B) **Store to the bucket** through the new adapter (the multipart handler calls the same confirm logic on the bytes
it already holds). One store sooner, fewer Blob-era rows, but the live path changes at 3a's promotion, before the
new wizard was verified.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 4
Where the new api code sits.

A) **Inside `modules/registration`**, beside `stage-photo.ts`: `application/photo-ticket.ts`,
`application/photo-confirm.ts`, `application/photo-process.ts` (the outbox handler), `adapters/gcs-photo-store.ts`,
`adapters/photo-ticket-signer.ts`, `domain/photo-upload.ts` (the state machine and key derivation); the purge job
and `image-type.ts` updated in place; entries stay in `registration.contract.ts`. One area, one contract, as
CLAUDE.md prefers. Recommended for the sign-up-only scope.

B) **A new `modules/photos` module** with its own `photos.contract.ts`, so a later dashboard move has a home.
Larger diff now; a second contract area for two entries.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Design decisions that are not questions (stated so they can be objected to)

- **The engine owns the three-step flow and the HEIC byte check; the app owns the transport.** `packages/form-engine`
  (P-7: no DOM, no Node) gains an `Uploader` port: `{ upload(file, target, onProgress, signal) }`. The app's adapter
  implements it with `XMLHttpRequest` (the only browser API that reports upload progress) and reads the file's first
  16 bytes for the HEIC check through a pure engine function. The engine's `stagePhoto(def, backend, entry, file,
  deps)` replaces `uploadToApi`: ticket, upload through the port, confirm, with retries honouring `Retry-After`
  and a fresh ticket after expiry.
- **The wizard's photo field passes its own accept list and messages** to the shared `PhotoUpload` through new
  optional props (`accept`, `allowedTypes`, `typeErrorMessage`); the component's defaults are unchanged, so
  dashboard screens behave as before.
- **Progress reaches the field through the existing `upload` callback's deps**: `uploaderFor` wires `onProgress`
  into the field's state; `PhotoUpload` gains an optional `progress` prop (0-100 or indeterminate) rendered in place
  of its spinner when present.
- **One store port, two adapters, one state machine.** `PhotoStore` grows from `put/delete` to
  `createUploadTicket`, `inspect` (metadata), `readPrefix` (first bytes), `read`, `write`, `delete`; the Blob adapter
  implements only what the overlap needs (`put` for the multipart entry, `delete` for the purge) and throws for the
  rest; the GCS adapter implements all. The row's `store` column selects the adapter at purge time.
- **Processing is an outbox handler registered in `main.ts`** beside the notification handlers, keyed
  `PhotoUploaded`, declared in `domain/events.ts` with an ids-only payload, and `sharp` is loaded lazily inside it.

## Execution checklist

- [ ] 1. Confirm the four answers above; resolve any ambiguity in a clarification file
- [ ] 2. `aidlc-docs/inception/application-design/components.md`: each component's purpose, responsibilities and
  interface, across engine, app, contract, api, infra
- [ ] 3. `component-methods.md`: method signatures with input and output types (rules deferred to Functional
  Design)
- [ ] 4. `services.md`: the orchestration of ticket, upload, confirm, claim, process and purge, with the sequence
  per PR (3a, 3b, 3c)
- [ ] 5. `component-dependency.md`: dependency matrix, communication patterns, data flow for the upload, the claim
  and the processing; the boundary rules P-6 and P-7 respected
- [ ] 6. `application-design.md`: the consolidated document
- [ ] 7. Present for approval
