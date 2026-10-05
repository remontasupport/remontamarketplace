# Logical Components -- unit `photo-gcs` (U3)

Each component with the non-functional responsibilities it carries and the platform pieces it reuses. Code
components are the application design's C1-C21.

## Api (Cloud Run, `remonta-api[-staging]`)

| Component | NFR responsibilities | Reuses |
|---|---|---|
| `GcsPhotoStore` (C11) | 5 s timeout per call; typed `StoreUnavailable`; endpoint override for the fake; signs policies through the client (IAM `signBlob` in production, injected key in tests); never logs policy fields | `@google-cloud/storage`; config |
| Ticket handler (C12) | rate limits 10/h IP, 300/h global (contract `meta`); 503 + `Retry-After` on store failure; `photo-ticket` log line | rate-limit buckets; pipeline; pino |
| Confirm handler (C13) | rate limits 30/h IP, 1000/h global; 16-byte read; fail closed; idempotent; `photo-confirm` / `photo-rejected` log lines | pipeline; pino; `detectImageType` |
| Claim (C14) | transactional as today; enqueue inside the transaction | outbox `enqueue` |
| Processing handler (C15) | bulkhead 2 / queue 20 / 10 s; lazy `sharp`; idempotent; as-is fallback; `photo-process` log line; abort-signal aware | `Bulkhead`; outbox dispatcher (15 s lease, 6 attempts, dead-letter alert) |
| Purge job (C17) | daily; claim-safe; per-store counts; skips unknown stores | scheduler (10 min lease) |
| Load shedder (existing) | event-loop delay and in-flight cap protect ticket and confirm under load | unchanged |
| Config (C18) | refuses to boot without `PHOTO_BUCKET` and `PHOTO_PUBLIC_BASE_URL`; `GCS_TIMEOUT_MS` default 5000; Blob token optional until 3c | `config.ts` validation |

## Browser (`apps/app` + `packages/form-engine`)

| Component | NFR responsibilities |
|---|---|
| `stagePhoto` (C4) | the retry budget; `Retry-After`; offline pause; abort; progress callbacks; messages per R8 |
| `xhrUploader` (C6) | progress events; abort; no custom headers (no preflight); typed errors with `policyRefused` |
| `uploaderFor` (C7) | shrink before upload (bandwidth); HEIC stop before any network call; one in-flight upload per field |
| `PhotoUpload` props (C8) | accessible progress (`role="progressbar"`, `aria-valuenow`, text alternative); messages that name the fix |

## Google Cloud (per stage)

| Component | NFR responsibilities |
|---|---|
| Bucket `remonta-api-photos[-staging]`, regional `australia-southeast1` | residency; zone redundancy; uniform access; soft delete 7 days; lifecycle: delete `staging/` after 1 day; CORS for the stage's origins and `POST` |
| Managed folder `workers/` | the only public-read grant (`allUsers: roles/storage.objectViewer`) |
| IAM | runtime SA: `roles/storage.objectUser` on its bucket; `roles/iam.serviceAccountTokenCreator` on itself |
| Cloud Audit Logs | `DATA_WRITE` for Cloud Storage on the project |
| Log-based metrics | `remonta-api-photo-rejected`, `remonta-api-photo-processing-fallback` |
| Existing alerts | `outbox-dead-letter` (processing failures), `5xx-ratio`, `request-failed`, `latency-p95` (corrected) |

## CI and local

| Component | Role |
|---|---|
| `fsouza/fake-gcs-server` service container (pinned tag) in `API Quality`, and in the local setup script | the adapter and the flows; `GCS_API_ENDPOINT=http://localhost:4443`, `PHOTO_BUCKET=test-photos` created by the tests |
| PostGIS container (existing) | the database for the same tests |
| Throwaway RSA key generated in the policy test | offline signing; the decoded policy is asserted |
| In-memory `PhotoStore` (test double) | pure unit and property tests of confirm, processing and purge logic; failure injection |

## Configuration surface (api)

| Variable | Stage table | Secret | Default | Purpose |
|---|---|---|---|---|
| `PHOTO_BUCKET` | yes (per stage) | no | required | the bucket |
| `PHOTO_PUBLIC_BASE_URL` | yes | no | required | `https://storage.googleapis.com/<bucket>` |
| `GCS_API_ENDPOINT` | no (CI/local only) | no | unset | the fake server |
| `GCS_TIMEOUT_MS` | no | no | 5000 | per-call timeout |
| `PHOTO_PROCESS_CONCURRENCY` | no | no | 2 | the bulkhead |
| `BLOB_READ_WRITE_TOKEN` | yes until 3c | yes | optional | the overlap |
| removed: `PHOTO_STORE`, `PHOTO_LOCAL_DIR` | | | | |

## Capacity envelope (documented for RESILIENCY-09)

| Dimension | Today | Headroom |
|---|---|---|
| Sign-ups | ~1-2 per day | the ticket entry allows 300/h globally |
| Processing | seconds per photo, 2 concurrent per instance | ~1000 photos/hour per instance before queueing matters |
| Bucket | kilobytes per day | no quota concern; costs cents per month |
| `signBlob` | 1 per ticket | IAM Credentials quota 60 000/min per project |
