# Business Rules -- unit `photo-gcs` (U3)

Numbered so code and tests can cite them. "Field error" means the message attached to the wizard's photo field.
**Amended 2026-10-05: no new columns** (see `domain-entities.md`): nothing is persisted at ticket time; a row is
created by confirm; the store is derived from the key's prefix; processed URLs are derived from ids.

## R1 Ticket (`createPhotoUploadTicket`)

| # | Rule |
|---|---|
| R1.1 | Input: `contentType` in {`image/jpeg`, `image/png`, `image/webp`} and `sizeBytes` in 1..5 242 880, validated by the contract (400 otherwise, before the handler). |
| R1.2 | Rate limits as the multipart entry had: 10 per hour per IP, 300 per hour global; 429 with `Retry-After`. No CAPTCHA. |
| R1.3 | **No row.** A fresh uuid `id`; `key = staging/<id>`; expiry `now + 10 min`. Nothing is persisted; one log line records the id, the declared type and size (with the request id). |
| R1.4 | The ticket is a signed POST policy bound to exactly that key, that `Content-Type`, `content-length-range` 1..5 242 880 and the expiry. A different key, type, larger body or a later time is refused by storage; the api never sees it. |
| R1.5 | If the store cannot issue a ticket (signing or bucket failure within the timeout), the response is 503 with the generic message; the engine retries. |
| R1.6 | Response 201 `{ photoUploadId, upload, expiresAt }`. Nothing about the person is in it. |

## R2 Confirm (`confirmPhotoUpload`)

Decision table, evaluated top to bottom; the first matching row decides.

| # | Situation | Outcome | Written |
|---|---|---|---|
| R2.1 | a row with this id already exists (bucket or Blob, claimed or not) | 200 `{ photoUploadId }` (idempotent; a claimed one is refused later by R3.1) | nothing |
| R2.2 | object `staging/<id>` missing | 409 "upload incomplete" (the engine decides whether the ticket is still alive, R6) | nothing |
| R2.3 | object size > 5 242 880 | 413 | object deleted; log `photo-rejected too-large` |
| R2.4 | first 16 bytes not JPEG/PNG/WebP (HEIC included) | 415 "Please upload a JPEG, PNG or WebP photo." | object deleted; log `not-image` |
| R2.5 | sniffed type differs from the object's content type (the one the policy bound) | 415, same message | object deleted; log `wrong-type` |
| R2.6 | all checks pass | 200 `{ photoUploadId }` | **the row**: `id`, `blobKey = staging/<id>`, `url` (the staging URL; diagnostic, never public), real `contentType` and `sizeBytes`, `ipHash` of this request, `createdAt = now`. A concurrent confirm that inserted first wins (primary key); the loser re-reads and returns 200 |
| R2.7 | the store is unreachable within the timeout at R2.2..R2.5 | 503 | nothing (fail closed) |
| R2.8 | the size declared at ticket time is not compared (Q2 A): nothing was stored; the ticket's and confirm's log lines share the id for diagnostics | -- | -- |

Rate limits: 30 per hour per IP, 1000 per hour global. Confirm never reads more than 16 bytes of the object. An
id that never had an object (a guess, or a ticket nobody used) costs one metadata lookup and answers 409.

## R3 Claim (inside the registration transaction, `claimPhoto`)

| # | Rule |
|---|---|
| R3.1 | Claimable: the row exists, `claimedAt` is null and `createdAt > now - 24 h`; the update is conditional (`WHERE claimedAt IS NULL`), so two registrations cannot claim one row. Otherwise the existing field error "Please upload your photo again" (400) and nothing is created, as today. |
| R3.2 | On claim: `claimedAt`, then `claimedByWorkerProfileId` once the profile exists (`attachPhoto`, as today). |
| R3.3 | Blob row (`blobKey` starts with `workers/registration/`, overlap): the profile's `photos` = the row's `url` at creation, as today; no event. |
| R3.4 | Bucket row (`blobKey` starts with `staging/`): the profile's `photos` = `null` at creation (Q3 A); one `PhotoUploaded` event enqueued in the same transaction. |
| R3.5 | An id with no row (never confirmed, or rejected) is not claimable: the same field error as an expired one. |

## R4 Processing (`PhotoUploaded` handler)

| # | Rule |
|---|---|
| R4.1 | Load the row and the profile. If the profile's `photos` already points under `workers/<profileId>/<id>` (processed or as-is copy): delete the staging object if it is still there and finish (idempotent re-run). |
| R4.2 | Read the staging object. Missing: permanent failure -- nothing to process, the profile stays without a photo, the dead-letter alert fires. |
| R4.3 | Decode; apply EXIF orientation; resize so the longest edge is at most 1600 px, never enlarging; encode JPEG quality 85; strip every metadata block (EXIF, GPS, XMP, IPTC, comments); convert to sRGB and drop the ICC profile. |
| R4.4 | Thumbnail: the same pipeline with longest edge 256 px. |
| R4.5 | Write the processed copy to `workers/<profileId>/<id>.jpg` and the thumbnail to `workers/<profileId>/<id>-256.jpg` with `Cache-Control: public, max-age=31536000, immutable`; overwriting an identical key is fine (re-run). |
| R4.6 | Set the profile's `photos` to the processed copy's public URL (one update; the row is untouched -- URLs derive from the ids). |
| R4.7 | Then delete the staging object (best effort: a failure here is logged; R4.1 on a re-run, the purge, or the lifecycle rule remove it). |
| R4.8 | Undecodable bytes (the decoder throws): copy the staging object as it is to `workers/<profileId>/<id>.<ext of contentType>` with the same cache control, set the profile's `photos` to its URL (no thumbnail), delete the staging object, and complete the event with a warning log line `photo-processing-fallback`. The account never ends without a photo (Q3 A). |
| R4.9 | Any other failure (bucket unreachable, timeout): throw; the outbox retries with back-off; after 6 attempts the event is `DEAD` and the existing dead-letter alert fires; the profile stays `null` until a manual re-run. |
| R4.10 | Everything happens within the outbox handler timeout (15 s); the handler respects the abort signal between steps. |

## R5 Purge (daily job)

| # | Rule |
|---|---|
| R5.1 | Candidates: rows with `claimedAt` null and `createdAt < now - 24 h` -- exactly today's rule. Objects that were never confirmed have no row; the bucket lifecycle rule removes `staging/` objects older than 1 day. |
| R5.2 | For each: delete the object from the store chosen by the key's prefix (a missing object is not an error), then delete the row conditionally on `claimedAt` still null (a claim in between wins, as today). |
| R5.3 | A row whose prefix maps to a store with no adapter configured (Blob token removed while Blob rows remain) is skipped and counted (`skippedUnknownStore`); the summary makes it visible. |
| R5.4 | Batch of 1000 per run, oldest first; counts per store in the job summary. |

## R6 The engine's upload (`stagePhoto`, Q1 A)

| # | Rule |
|---|---|
| R6.1 | Steps: ticket, upload, confirm. Progress: ticket and confirm report `indeterminate`; upload reports bytes sent / total. |
| R6.2 | Ticket call failures follow the engine's existing retry (`withRetry`, honouring `Retry-After`); 400/415 are final (field error from the api's message). |
| R6.3 | Upload failures (network error, 5xx from storage, or a 4xx that is not a policy rejection): retry on the same ticket up to two more times with the engine's back-off, while `now < expiresAt`. |
| R6.4 | A storage 4xx that means the policy refused (403: expired or constraint) counts as "ticket dead": go to R6.6. |
| R6.5 | Confirm: 200 → done. 409 → treat as R6.3 (re-upload with the same ticket if alive). 413/415 → final, field error with the api's message. 429/503 → the engine's retry. |
| R6.6 | Ticket dead (expired or policy refusal) or the same-ticket budget spent: ask for a fresh ticket **once** and repeat R6.3..R6.5; a second exhaustion is final. |
| R6.7 | Final failure: field error "Your photo could not be uploaded. Please try again or choose another photo."; the field's value stays empty; the next pick starts a new flow. |
| R6.8 | Abort signal (new pick or leaving the form): stop immediately; no further requests; no error shown for the abandoned one. |
| R6.9 | Offline: the existing pause applies between steps (no attempt is spent while offline). |

## R7 Device-side HEIC and shrink (`uploaderFor`)

| # | Rule |
|---|---|
| R7.1 | Shrink as today (longest edge 1600 px, JPEG 0.85) when the browser can decode the file; otherwise keep the file. |
| R7.2 | If the file was not decodable and its first 16 bytes carry an `ftyp` box with a HEIC brand, stop before any network call: field error "This photo is in HEIC format. Please choose a JPEG or PNG. On iPhone, set Camera > Formats > Most Compatible."; one `console.warn('[photo] heic-rejected')` line, no file data. |
| R7.3 | If the file was not decodable and is not HEIC, continue: the api's confirm decides (R2.4). |
| R7.4 | The declared `contentType` sent with the ticket is the sniffed type of the (shrunk) file's first bytes when recognised, else the file's `type`, else `image/jpeg`. |
| R7.5 | The file input's accept list on the wizard is `image/jpeg,image/png,image/webp` (iPhones then hand over JPEG). |

## R8 Error map (api status -> engine message -> field state)

| Status | Where | Engine message | Field |
|---|---|---|---|
| 400 (ticket or confirm) | validation | api's field message or the generic one | error, value empty |
| 409 (confirm) | R2.2 | none (internal: re-upload or fresh ticket, R6.5/R6.6) | uploading |
| 413 | R2.3 | "Your photo is too large. Please choose a photo under 5 MB." | error, value empty |
| 415 | R2.4/R2.5 | "Please upload a JPEG, PNG or WebP photo." | error, value empty |
| 429 | limits | existing: wait `Retry-After`, then retry | uploading |
| 503 | R1.5/R2.7 | existing retry; final: "We couldn't upload your photo right now. Please try again in a moment." | error, value empty |
| storage 403 | R6.4 | none (internal) | uploading |
| storage 5xx / network | R6.3 | none (internal) | uploading |
| budget spent | R6.7 | "Your photo could not be uploaded. Please try again or choose another photo." | error, value empty |

The existing `messageFor(413|415)` in the engine loses "HEIC" from its wording (one string).

## R9 Overlap and cut-over

| # | Rule |
|---|---|
| R9.1 | PR 3a: the multipart entry and `stage-photo.ts` are unchanged; the rows they create are recognisable by their `workers/registration/` prefix. HEIC stays accepted on that entry only. **No database change in this unit.** |
| R9.2 | PR 3b: the wizard calls the new entries; the multipart entry stays bound but has no caller. |
| R9.3 | PR 3c: after the purge summary shows no Blob-prefixed unclaimed rows for 3 consecutive days, the multipart entry, `stage-photo.ts`, the Blob adapter and the token go. Claimed Blob rows stay as history (their `url` is still the profile's photo). |
