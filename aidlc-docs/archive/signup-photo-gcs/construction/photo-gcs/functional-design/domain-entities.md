# Domain Entities -- unit `photo-gcs` (U3)

**Decisions:** functional design plan Q1 A (retry budget), Q2 A (declared size informational), Q3 A (short gap
after claim; copy-as-is on permanent processing failure); approved 2026-10-05. **Amended 2026-10-05 at the
user's request ("I don't want more columns"): no new columns, no migration.** The amendment replaces
application design AD-2 and the `state`/`store` columns of C10; everything else stands.

## How zero columns works

| Need | Earlier answer | Now |
|---|---|---|
| "Ticket issued, nothing confirmed yet" | a `PENDING` row | no row: the ticket is a signed policy for a fresh random key; nothing is persisted until confirm has checked the object (today, too, a row exists only once a file was accepted) |
| "Confirmed, claimable" | `state STAGED` | the row exists and `claimedAt` is null (as today) |
| "Rejected" | `state REJECTED`, `rejectedReason` | no row; the object is deleted at once; one log line carries the reason |
| "Which store holds it" | `store` | derived from `blobKey`: `staging/…` or `workers/…` is the bucket, `workers/registration/…` is Blob (the only prefix Blob rows ever had) |
| Ticket expiry | `expiresAt` | not persisted; the policy carries it; objects nobody confirms are removed by the bucket's lifecycle rule |
| Processed and thumbnail URLs | `processedUrl`, `thumbnailUrl` | derived: `workers/<profileId>/<id>.jpg` and `…/<id>-256.jpg`; the profile's `photos` holds the processed URL, which is the only reader this cycle has |
| "Processing finished" | `processedAt` | the profile's `photos` points into the bucket's `workers/` prefix (or the as-is copy); the staging object is deleted last |

## E1 Photo upload (`registration_photo_uploads`, unchanged schema)

| Field | Set by | Meaning after this unit |
|---|---|---|
| `id` | confirm (the id the ticket named) | The upload id the browser carries through ticket, confirm and registration; random, never guessable |
| `blobKey` | confirm (`staging/<id>`) / multipart entry (`workers/registration/<id>.<ext>`, overlap) | The object's key; its prefix says which store |
| `url` | confirm (the public URL the processed copy **will** have: `workers/<profileId>` is unknown at confirm, so this holds the staging key's URL, not public) / multipart (the Blob URL) | For Blob rows: what the profile receives at claim. For bucket rows: diagnostic only; never shown |
| `contentType` | confirm (sniffed, real) | One of JPEG, PNG, WebP |
| `sizeBytes` | confirm (real, from metadata) | |
| `ipHash` | confirm (the confirming request's IP) | As today |
| `createdAt` | confirm | Start of the 24 h claim window (today: upload time; now: confirm time, the same moment for the person) |
| `claimedAt`, `claimedByWorkerProfileId` | claim | Unchanged |

No migration. Existing rows are Blob rows by their prefix.

### Lifecycle (no stored state)

```
ticket (no row) ──browser uploads──> object at staging/<id>
   confirm ok      ──> row (unclaimed)      ──registration──> row (claimed) ──processing──> profile.photos = processed URL; staging object gone
   confirm failed  ──> object deleted, no row
   never confirmed ──> object removed by the lifecycle rule (1 day); no row
   unclaimed 24 h  ──> purge deletes object and row
```

## E2 Objects in the bucket

| Prefix | Key | Written by | Readable by | Deleted by |
|---|---|---|---|---|
| `staging/` | `staging/<id>` (no extension; the type is the object's content type and the row's) | the browser, under a ticket | the api only | confirm (reject), processing (last step), purge, lifecycle rule (1 day) |
| `workers/<profileId>/` | `<id>.jpg`, `<id>-256.jpg` (processed), or `<id>.<ext>` (as-is copy on permanent failure) | processing | everyone (public read on the managed folder) | nobody in this cycle |

Keys contain only `[a-z0-9/._-]`. `publicUrl(base, key) = base + '/' + key` with
`base = https://storage.googleapis.com/<bucket>`. `storeOf(key)`: `workers/registration/` → Blob; otherwise →
bucket.

## E3 Outbox event `PhotoUploaded`

Payload `{ photoUploadId, workerProfileId }`, ids only. Enqueued inside the registration transaction when the
claimed row is a bucket row. Handled by the processing handler (idempotent by reading the profile). Dead-lettered
after 6 attempts as every outbox event; permanent failure (undecodable bytes) short-circuits to the as-is copy.

## E4 The worker profile (`worker_profiles.photos`, unchanged)

| Moment | `photos` holds |
|---|---|
| Blob row claimed (overlap) | the Blob URL, at claim, as today |
| bucket row claimed | `null` until processing (Q3 A) |
| Processing succeeded | `https://storage.googleapis.com/<bucket>/workers/<profileId>/<id>.jpg` |
| Processing failed permanently | `…/workers/<profileId>/<id>.<ext>` (the as-is copy) |

The thumbnail exists at `…/<id>-256.jpg` whenever the processed copy does; a later cycle derives it from the
profile URL (replace `.jpg` with `-256.jpg`) or records it then.

## E5 Ticket (not persisted; the response of the ticket entry)

`{ photoUploadId, upload: { url, method: 'POST', fields, fileField: 'file' }, expiresAt }` where `fields` are the
signed policy's form fields (`key`, `Content-Type`, `policy`, `x-goog-algorithm`, `x-goog-credential`,
`x-goog-date`, `x-goog-signature`, `success_action_status: 201`). The policy binds: exact `key = staging/<id>`,
exact `Content-Type` (the declared one), `content-length-range` 1..5242880, expiry 10 minutes. The id is a fresh
uuid minted by the api; it is unguessable, so confirm's lookup by id cannot be aimed at someone else's object.

## Amendment 2026-10-05 (option 2: the clean copies live in Vercel Blob)

The organisation's **Domain restricted sharing** policy (`iam.allowedPolicyMemberDomains`, customer
`C02vymhrm`) forbids `allUsers` grants, so the bucket cannot serve photos publicly (HTTP 412 at bootstrap;
public-access prevention itself was not the blocker). User decision: keep Vercel Blob as the home of every
photo. The bucket is **private and upload-only**: the browser uploads the original under a ticket, confirm
checks it, and after the claim the processing handler writes the clean copy and the thumbnail to **Blob**
(`workers/<profileId>/<id>.jpg`, `...-256.jpg`, public, immutable cache), sets the profile to the Blob URL
and deletes the original from the bucket. Consequences: no public prefix, no managed folder, public access
prevention enforced on the buckets; no new image host in `apps/app` (the Blob hosts are already allowed);
the Blob token stays in the api for good (PR 3c removes only the multipart entry, `stage-photo.ts` and the
local disk store); the latency goal is unchanged (one upload, in-region, the api out of the byte path).
Earlier text in this document that places processed copies in the bucket's `workers/` prefix or removes
the Blob token is superseded by this note.
