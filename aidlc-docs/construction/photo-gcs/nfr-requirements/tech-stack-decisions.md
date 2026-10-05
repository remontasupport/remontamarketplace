# Tech Stack Decisions -- unit `photo-gcs` (U3)

| # | Decision | Chosen | Alternatives considered | Why |
|---|---|---|---|---|
| T1 | Object storage | Google Cloud Storage, regional bucket per stage in `australia-southeast1` | Vercel Blob with presigned uploads (Option B of the requirements) | measured 1.3 s write floor from Sydney on Blob; the api already lives in the project; residency; no key file |
| T2 | Storage client | `@google-cloud/storage` (official Node client) | hand-rolled REST + own V4 signing | signed POST policies, metadata, ranged reads, IAM `signBlob` fallback and endpoint override are built in; signing by hand is the one thing worth not writing |
| T3 | Ticket mechanism | V4 signed POST policy document (form POST) | V4 signed PUT URL | the policy enforces the size range at the bucket; a form POST needs no CORS preflight |
| T4 | Signing identity | the runtime service account through IAM `signBlob` (no key on the instance); a throwaway key injected in tests | a downloaded service-account key in Secret Manager | no long-lived key anywhere; one IAM role on itself |
| T5 | Image processing | `sharp` (libvips) | `jimp`; Cloud Run Jobs or Cloud Functions for processing | native speed inside the 15 s handler; prebuilt binary via optional package, installed by the Linux Docker build; one process, no new deployable |
| T6 | Processing execution | the existing outbox dispatcher, `PhotoUploaded` handler, bulkhead of 2 | Cloud Tasks / Pub/Sub | retries, leases, dead-lettering and the alert already exist; no new service |
| T7 | Browser transport | `XMLHttpRequest` multipart POST in an app adapter behind the engine's `Uploader` port | `fetch` | only XHR reports upload progress; the engine stays DOM-free (P-7) |
| T8 | Byte sniffer | `detectImageType` moved to `packages/schemas`, pure | duplicate in engine and api | one implementation for the browser's HEIC decision and the api's confirm |
| T9 | Local and CI storage | `fsouza/fake-gcs-server` container (`-scheme http`, `-public-host localhost:4443`), `GCS_API_ENDPOINT` override in the client | a real dev bucket; a hand-written in-memory store | no credentials in CI; the client library speaks to it unchanged; the in-memory store stays for pure unit tests of the flows |
| T10 | Policy tests | offline: the client signs with a throwaway RSA key (generated in the test, never committed), the policy is base64-decoded and asserted | signing against the fake server | the fake does not validate signatures, so it cannot prove them |
| T11 | Browser form POST verification | staging, preview checklist (a real bucket) | the fake server | the fake's form-upload policy enforcement is undocumented |
| T12 | Property-based tests | `fast-check` 4.x with `vitest` 2.x, seed logged on failure (CI uses the default random seed with reporting) | none | already the repository's choice (PBT-09) |
| T13 | Logging and metrics | pino JSON lines as today; two log-based metrics via bootstrap's `metric` helper | a metrics client | consistent with the existing alerts; no new dependency |
| T14 | Bucket audit | Cloud Audit Logs `DATA_WRITE` for `storage.googleapis.com` on the project | off / all | attributable writes at negligible cost |
| T15 | Configuration | `PHOTO_BUCKET`, `PHOTO_PUBLIC_BASE_URL`, `GCS_API_ENDPOINT?`, `GCS_TIMEOUT_MS` (5000); `BLOB_READ_WRITE_TOKEN?` until 3c; `PHOTO_STORE`/`PHOTO_LOCAL_DIR` removed | keep `PHOTO_STORE` | one store in production; the overlap is "token present or not" |

## Versions (to pin in the lockfile at code generation)

| Package | Where | Version policy |
|---|---|---|
| `@google-cloud/storage` | `apps/api` dependencies | latest 7.x at generation time |
| `sharp` | `apps/api` dependencies | latest 0.34.x at generation time; `@img/sharp-linux-x64` resolves on the Linux build; developers on Windows and macOS get their own optional package |
| `fast-check`, `vitest` | already present | unchanged |
| `fake-gcs-server` image | `.github/workflows` and the setup script | a pinned tag (`fsouza/fake-gcs-server:1.52` family), not `latest` |

## Container and build notes

- The Docker `prod-deps` stage runs `pnpm install --prod --ignore-scripts` then `pnpm deploy --prod`; optional
  dependencies are included by default, so sharp's Linux binary lands in `/out/node_modules`. `--ignore-scripts`
  is fine: sharp 0.33+ has no install script. The runtime image is `bookworm-slim` (glibc), which sharp's
  prebuilt binary targets.
- `sharp` is imported lazily inside the processing handler so the request path never loads libvips.
- Memory: `sharp` decodes JPEG with libjpeg-turbo streaming; a 24-megapixel decode peaks around 100-150 MB; the
  bulkhead of 2 keeps the instance under its 1 GiB with headroom for the api.

## What is deliberately not adopted

- A CDN or custom domain in front of the bucket (requirements Q4 A).
- Client-side HEIC conversion (add later if the browser-side log line shows demand).
- Object versioning on the bucket (soft delete is the recovery backstop; objects are immutable by key).
- A separate processing service: the outbox is enough at this scale and keeps one deployable.
