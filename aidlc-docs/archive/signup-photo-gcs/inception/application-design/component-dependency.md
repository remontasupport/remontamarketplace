# Component Dependencies -- sign-up photo on Google Cloud Storage

## Package dependency matrix (build-time)

| Depends on -> | schemas | api-contract | form-engine | db | @google-cloud/storage | sharp | fast-check |
|---|---|---|---|---|---|---|---|
| **packages/schemas** (C1) | -- | | | | | | test |
| **packages/api-contract** (C2) | yes | -- | | | | | test |
| **packages/form-engine** (C3-C5) | yes (via contract) | yes | -- | | | | test |
| **apps/app** (C6-C9) | yes | yes | yes | yes (existing) | | | test |
| **apps/api** (C10-C18) | yes | yes | | yes | yes (new) | yes (new) | test |
| **infra/** (C19-C20) | | | | | | | |

Boundary rules kept: P-5 (`schemas` imports nothing framework-shaped; C1 is pure), P-6 (every endpoint declared
once in `api-contract`; both sides compile against it), P-7 (`form-engine` has no React, DOM or Node: the browser
transport is the `Uploader` port, implemented in `apps/app`). `apps/web` is untouched (P-1, P-2).

## Runtime communication

| From | To | How | Timeout / retry |
|---|---|---|---|
| Browser (C6, C7) | api ticket and confirm entries | HTTPS JSON through the contract client | engine attempt timeout; retries with back-off and `Retry-After` |
| Browser (C6) | Cloud Storage bucket | HTTPS multipart POST with signed policy fields; CORS from the app origin | XHR; retried by `stagePhoto` |
| api (C11 GCS adapter) | Cloud Storage JSON API | HTTPS via the client library; IAM `signBlob` for tickets | `GCS_TIMEOUT_MS` (5 s) per call |
| api (C15) | Cloud Storage | read, write, delete via the adapter | within the outbox handler timeout (15 s) |
| api (C16, overlap) | Vercel Blob API | the Blob SDK | as today |
| api (C17) | both stores | delete | job timeout |
| Scheduler, OutboxDispatcher | C15, C17 | in-process | leases as today |

Neither SDK goes through `SafeHttpClient`; both talk to fixed vendor hosts, as the Blob adapter's comment already
records. No user-supplied URL is ever fetched.

## Data flow

### Upload

```
file ──shrink──> JPEG ≤1600px ──header──> [HEIC? stop]
     ──ticket──> api: row(PENDING, key=staging/<uuid>.<ext>, ipHash, store=gcs) + signed policy
     ──POST (fields + file)──> bucket: object at key (storage enforces key/type/size/expiry)
     ──confirm──> api: inspect(key) + readPrefix(key,16) -> detectImageType -> row(STAGED, sizeBytes, contentType)
                                                            or delete(key) + row(REJECTED)
```

### Claim and process

```
registration tx: row(CLAIMED, claimedBy) ; profile.photos = publicUrl(staging key) ; outbox PhotoUploaded
outbox handler: read(staging) -> sharp -> write(workers/<profile>/<id>.jpg), write(..-256.jpg)
                -> profile.photos = processedUrl ; row.processedUrl/thumbnailUrl -> delete(staging)
```

### What each store holds

| Prefix | Who writes | Public | Lifecycle |
|---|---|---|---|
| `staging/` | the browser (via ticket) | no | deleted by confirm-reject, by processing, by purge, or by the 2-day rule |
| `workers/<profileId>/` | the api (processing) | read-only public (managed folder) | kept; replaced only by a later re-process |

## Change coupling (what must move together)

| Pair | Why | PR |
|---|---|---|
| C2 entries + C12/C13/C18 handlers | the api refuses to boot with an unbound entry | 3a |
| C2 ticket response shape + C4 `stagePhoto` + C6 | the engine parses the target the api issues | 3a defines, 3b consumes |
| C10 states + db migration + C14/C17 | the claim and the purge read the new columns | 3a |
| C19 bucket + C18 config | the api refuses to boot without `PHOTO_BUCKET` | buckets created before 3a merges |
| C1 move + api re-export | the api's sniffer import path | 3a |
| C3 field change + definition + C8 | the wizard's photo field | 3b |
| multipart entry + C16 + Blob token | the overlap | removed together in 3c |
