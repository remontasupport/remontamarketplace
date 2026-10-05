# Domain Entities -- unit `photo-gcs` (U3)

**Decisions:** functional design plan Q1 A (retry budget), Q2 A (declared size informational), Q3 A (short gap
after claim; copy-as-is on permanent processing failure); approved 2026-10-05. Application design AD-1..AD-10.

## E1 Photo upload (`registration_photo_uploads`, one row per ticket)

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `id` | uuid | ticket | The upload id the browser carries through ticket, confirm and registration; random, never guessable |
| `state` | `PENDING` \| `STAGED` \| `REJECTED` \| `CLAIMED` | state machine below | |
| `store` | `gcs` \| `vercel-blob` | ticket (`gcs`) / multipart entry (`vercel-blob`, overlap only) | Which adapter owns the object; read by purge and claim |
| `blobKey` | string, unique | ticket | `staging/<id>.<ext>` for `gcs`; `workers/registration/<id>.<ext>` for the Blob rows (as today) |
| `url` | string | ticket (`gcs`: the would-be public URL of the staging key, kept for symmetry with Blob rows; not public) / multipart (the Blob URL) | For Blob rows, what the profile receives at claim; for `gcs` rows, diagnostic only (Q3 A) |
| `contentType` | string | ticket (declared) then confirm (real, from the bytes) | After confirm: the sniffed type |
| `sizeBytes` | int | ticket (declared) then confirm (real, from metadata) | After confirm: the object's size |
| `ipHash` | string | ticket | HMAC of the requester's IP, as today |
| `expiresAt` | timestamp | ticket | `createdAt + 10 min`; the policy's expiry; a `PENDING` row past it is purgeable and not confirmable |
| `createdAt` | timestamp | ticket | Start of the 24 h claim window (unchanged semantics) |
| `confirmedAt` | timestamp? | confirm | |
| `rejectedReason` | string? | confirm | `too-large` \| `not-image` \| `wrong-type` \| `missing` (for diagnostics; never shown as such) |
| `claimedAt`, `claimedByWorkerProfileId` | existing | claim | Unchanged |
| `processedUrl` | string? | processing | Public URL of `workers/<profileId>/<id>.jpg` |
| `thumbnailUrl` | string? | processing | Public URL of `workers/<profileId>/<id>-256.jpg` |
| `processedAt` | timestamp? | processing | Set when the profile was pointed at the processed copy (or the as-is copy, Q3 A) |

Migration (additive): `state` default `STAGED` and `store` default `vercel-blob` for existing rows (every existing
row was staged by the multipart entry on Blob); existing rows with `claimedAt` set become `CLAIMED`; `expiresAt`
nullable for them. New columns nullable otherwise. The unique index on `blobKey` stays; add an index on
`(state, createdAt)` for the purge and `(state, expiresAt)` for expired tickets.

### State machine

```
             ticket            confirm ok              registration
   (none) ─────────> PENDING ──────────────> STAGED ──────────────> CLAIMED ──(processing)──> CLAIMED + processedUrl
                        │ confirm failed        │ 24 h unclaimed
                        v                       v
                     REJECTED ──purge──> (gone)  (gone)
                        ^
   PENDING past expiresAt ──purge──> (gone)
```

Legal transitions, and nothing else: `PENDING->STAGED`, `PENDING->REJECTED`, `STAGED->CLAIMED`. Purge deletes
`PENDING` (expired), `REJECTED`, `STAGED` (older than 24 h); never `CLAIMED`.

## E2 Objects in the bucket

| Prefix | Key | Written by | Readable by | Deleted by |
|---|---|---|---|---|
| `staging/` | `staging/<id>.<jpg\|png\|webp>` | the browser, under a ticket | the api only | confirm (reject), processing (success or as-is copy), purge, lifecycle rule (2 days) |
| `workers/<profileId>/` | `<id>.jpg` and `<id>-256.jpg` (processed), or `<id>.<ext>` (as-is copy on permanent failure) | processing | everyone (public read on the managed folder) | nobody in this cycle |

Keys contain only `[a-z0-9/._-]`; the id is the row's uuid; the extension comes from the sniffed type (ticket:
declared type; confirm re-derives and, if the sniffed type differs from the declared one, the object is rejected,
see rules). `publicUrl(base, key) = base + '/' + key` with `base = https://storage.googleapis.com/<bucket>`.

## E3 Outbox event `PhotoUploaded`

Payload `{ photoUploadId, workerProfileId }`, ids only. Enqueued inside the registration transaction when the
claimed row's `store` is `gcs`. Handled by the processing handler (idempotent). Dead-lettered after 6 attempts as
every outbox event; permanent failure (undecodable bytes) short-circuits to the as-is copy and completes.

## E4 The worker profile (`worker_profiles.photos`)

| Moment | `photos` holds |
|---|---|
| Blob row claimed (overlap) | the Blob URL, at claim, as today |
| `gcs` row claimed | `null` until processing (Q3 A); the row's `blobKey` says which object is theirs |
| Processing succeeded | `processedUrl` |
| Processing failed permanently | the public URL of the as-is copy |

Readers of `photos` are unchanged: they render whatever URL is stored, through the allowed hosts list.

## E5 Ticket (not persisted; the response of the ticket entry)

`{ photoUploadId, upload: { url, method: 'POST', fields, fileField: 'file' }, expiresAt }` where `fields` are the
signed policy's form fields (`key`, `Content-Type`, `policy`, `x-goog-algorithm`, `x-goog-credential`,
`x-goog-date`, `x-goog-signature`, and `success_action_status: 201`). The policy binds: exact `key`, exact
`Content-Type`, `content-length-range` 1..5242880, expiry `expiresAt`.
