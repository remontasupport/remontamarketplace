# Inventory -- the sign-up photo path (2026-10-05)

**Request:** move the worker sign-up photo off the api's byte path and off Vercel Blob onto a Google Cloud Storage
bucket in Sydney, with direct browser uploads, server-side verification and asynchronous processing ("Option A",
2026-10-05). This file is the targeted reverse-engineering artifact for the cycle: every fact below was read from the
code or measured on 2026-10-05. Nothing has been changed yet.

## 1. Why: the evidence

| Fact | Value | Source |
|---|---|---|
| Alert firing | `remonta-api latency-p95`, 2026-10-04 00:08Z, 4034 ms vs 2000 ms | Cloud Monitoring email |
| The request behind it | `POST /v1/registrations/worker/photo`, 424 KB, 4.043 s, 201, iPhone (Facebook in-app browser), 23:57:09Z | Cloud Logging |
| All requests over 1.5 s in 5 days | 4, all photo uploads: 3.58 s/258 KB, 4.04 s/424 KB, 2.22 s/140 KB, 1.92 s/707 B | Cloud Logging |
| Other routes | sign-up 0.95-1.27 s; email code 0.6-0.8 s; localities and health well under 0.5 s | Cloud Logging |
| Production traffic | 212 requests in 5 days; 9 photo uploads; 6 sign-ups | Cloud Logging |
| Service health | one revision since 2026-10-02 (`remonta-api-00003-l9x`), no restarts, no `shed:` lines, no warnings | Cloud Logging |
| Staging floor | 22-byte JPEG upload 1.69-1.85 s vs health 0.38-0.46 s from the same machine: ~1.3 s is the Blob `put` from Cloud Run Sydney, store already in `syd1` | curl, 2026-10-05 |
| Blob API path | `blob.vercel-storage.com` answers through Vercel's anycast edge; ~0.25 s after TLS even for a rejected request (edge-to-origin hop) | curl, 2026-10-05 |
| Policy design | per-series p95 then `REDUCE_MAX` across series: on a quiet service = the slowest single request on any route; duration 300 s = one window; autoClose 1800 s | `infra/cloudrun/monitoring/latency-p95.json` |

## 2. The current flow, file by file

**Browser (apps/app)**

| File | Role |
|---|---|
| `src/components/forms/fields/PhotoUpload.tsx` | Shared file input; `accept` lists `image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif`; 50 MB default, 10 MB from the wizard; also used by dashboard screens (account setup, profile card, admin picker) |
| `src/components/ui/form-wizard/fields.tsx` `PhotoField` | Wizard wrapper around `PhotoUpload`; spinner only, no progress |
| `src/features/forms/useFormWizard.ts` `uploaderFor` | On file pick: `shrinkImage(file)` then `uploadToApi(...)` in the background; `submit` awaits in-flight uploads (`status: uploading`) |
| `src/features/forms/adapters/shrinkImage.ts` | Canvas re-encode to JPEG q0.85, longest edge 1600 px; returns the original if the browser cannot decode it (HEIC outside Safari) or if it is already small |
| `src/features/forms/photoPreview.ts` | Thumbnail data URL kept in the form for the preview |
| `src/features/forms/definitions/workerRegistration.ts` | The photo field: `kind: "photo"`, `uploadEntry: "uploadRegistrationPhoto"` |
| `next.config.*` `images.remotePatterns` | Allows `**.public.blob.vercel-storage.com` and `*.blob.vercel-storage.com`; no Google host |

**Form engine (packages/form-engine)**

| File | Role |
|---|---|
| `src/kinds.ts` `photo` | Field rule: value is the upload id (string, required) |
| `src/submit.ts` `uploadToApi` | Builds the multipart body (`photo`), posts through the contract client with retries, maps 413/415 to a message naming HEIC |
| `src/form.ts` | `defineForm` checks `uploadEntry` exists in the contract |
| `src/draft.ts` | Draft expiry 23 h, inside the 24 h a staged photo stays claimable |

**Contract (packages/api-contract)**

| Entry | Facts |
|---|---|
| `uploadRegistrationPhoto` `POST /v1/registrations/worker/photo` | multipart, file `photo`, `PHOTO_MAX_BYTES`, mime JPEG/PNG/WebP/HEIC; public; `bot: 'none'`; 10/h per IP, 300/h global; `maxBodyKb: 5120`; 201 `{ photoUploadId }` |
| `registerWorker` | takes `photoUploadId`; the handler claims it |
| `public-endpoints.json` | lists the public entries (a new entry needs a line) |

**Api (apps/api)**

| File | Role |
|---|---|
| `src/modules/registration/application/stage-photo.ts` | `detectImageType` on the bytes (415 otherwise), UUID key `workers/registration/<id>.<ext>`, `store.put`, insert `registration_photo_uploads` (`blobKey`, `url`, `contentType`, `sizeBytes`, `ipHash`); deletes the blob if the insert fails; 24 h claim window |
| `src/modules/registration/domain/image-type.ts` | Magic bytes for JPEG, PNG, WebP, HEIC (`ftyp` brands) |
| `src/modules/registration/adapters/photo-store.ts` | The `PhotoStore` port (`put`, `delete`); `LocalDiskPhotoStore` (dev) and `VercelBlobPhotoStore` (dynamic `import('@vercel/blob')`, `put` public, `addRandomSuffix: false`). The S1 design already named "AU private storage (OI-07)" as an adapter swap |
| `src/modules/registration/application/register-worker.ts` `claimPhoto`/`attachPhoto` | Copies the row's `url` into `worker_profiles.photos` inside the registration transaction |
| `src/modules/registration/jobs/purge-photos.ts` | Daily: deletes unclaimed uploads older than 24 h from the store and the table |
| `src/config/config.ts` | `PHOTO_STORE` is `local` or `vercel-blob` (local refused in production), `PHOTO_LOCAL_DIR`, `BLOB_READ_WRITE_TOKEN` required for blob |
| `src/main.ts` | Wires the store from config; `SafeHttpClient` allow-list (`outboundHosts`) for other outbound calls |
| `src/platform/outbox/dispatcher.ts` | Claim/lease dispatcher, 2 s poll, 15 s handler timeout, retries, DEAD after max attempts -- the place for asynchronous processing |
| `src/platform/jobs/scheduler.ts` | The scheduled jobs (purge, reconciler) |
| no `sharp` anywhere in the monorepo | processing library to add |

**Database (packages/db)**

| Table / column | Facts |
|---|---|
| `registration_photo_uploads` (`RegistrationPhotoUpload`) | id, blobKey, url, contentType, sizeBytes, ipHash, createdAt, claimed/worker link (schema.prisma ~line 891) |
| `worker_profiles.photos` (String?) | The profile photo URL the app reads; `additionalPhotos` beside it |

**Infrastructure (infra/)**

| File | Role |
|---|---|
| `lib/stages.ts` | The one table: `SECRET_NAMES` (includes `BLOB_READ_WRITE_TOKEN`), env (`PHOTO_STORE: 'vercel-blob'`), per-stage CORS/instances; `render.ts` renders `cloudrun/service.<stage>.yaml` (drift-checked) |
| `cloudrun/bootstrap.sh` | One-time project setup: APIs, registry, runtime service accounts (no roles; secrets only), secrets, alert policies (create-if-missing) |
| `cloudrun/monitoring/latency-p95.json` | The policy to correct |
| `.github/workflows/deploy-api.yml` | Build, then staging; `workflow_dispatch` promotion to prod |

**Docs**

| File | Role |
|---|---|
| `docs/signup/02-api-reference.md` §4.6, `03-data-model.md` §2.8, `05-events-and-emails.md`, `01-flow.md` | Written from the code; must change in the same PR |
| `CLAUDE.md` "apps/api on Google Cloud Run" | Secrets list, bootstrap, alert names |

## 3. What already exists on the Google side

- Project `remonta-api-510206`, region `australia-southeast1`; services `remonta-api` and `remonta-api-staging`, each
  with its own runtime service account `remonta-api[-staging]-run@...` that today holds no role (it may only read its
  secrets). Secret Manager holds `remonta-api[-staging]-<NAME>`.
- No bucket, and `bootstrap.sh` does not enable the Cloud Storage API (it enables run, artifactregistry,
  secretmanager, iam, iamcredentials, sts, monitoring, logging, cloudresourcemanager).
- Signing upload tickets from Cloud Run without a key file uses the IAM Credentials API (`signBlob`), which needs the
  runtime service account to hold `roles/iam.serviceAccountTokenCreator` on itself, plus object create/read/delete on
  the bucket.

## 4. Old data and the dashboard (unchanged by this cycle)

- Every stored photo and document is an absolute Vercel Blob URL (`<storeId>.public.blob.vercel-storage.com/...`),
  displayed through `next/image` with the Blob hosts allowed. They keep working untouched.
- Dashboard uploads (`api/upload/worker-photo`, `api/blob/upload-token` with `handleUpload`, compliance, certificates,
  identity documents, vehicle photo) write to Blob through `apps/app`; outside this cycle.
- The Vercel Blob store is in `syd1` (user, 2026-10-05).

## 5. Constraints carried from CLAUDE.md

Branch, PR, CI, the preview checklist on staging (sign-in, dashboard, health, suburb search, **a photo upload**, a
full sign-up with an internal email, duplicate-email notice), merge, staging deploy, then `workflow_dispatch`
promotion to prod with the same image. One contract entry + one handler per endpoint; no Nest controllers; the form
engine stays free of React/Node (P-7); `apps/web` never touches the db (P-1/P-2); generated Prisma clients are never
committed; `service.*.yaml` is rendered, never edited.
