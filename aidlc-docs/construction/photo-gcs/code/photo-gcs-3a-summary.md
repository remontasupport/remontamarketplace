# Code summary -- unit `photo-gcs`, PR 3a (backend, additive)

**Branch** `feat/photo-gcs-api` from `main` `e20dee4`, one commit `2198a74`, pushed 2026-10-05.
**PR**: https://github.com/remontasupport/remontamarketplace/compare/main...feat%2Fphoto-gcs-api?expand=1
(52 files, +2238 / -121). Plan: `../../plans/photo-gcs-code-generation-plan.md`, parts A-F.

## What changed

| Area | Files | Change |
|---|---|---|
| `packages/schemas` | `src/image-type.ts` (new), `src/image-type.test.ts` (new), `src/index.ts`, `package.json` | The byte sniffer moved here with `ACCEPTED_IMAGE_TYPES`, `IMAGE_HEADER_BYTES`, `isHeicHeader`; subpath export `@remonta/schemas/image-type`; 14 tests incl. 3 properties |
| `packages/api-contract` | `src/registration.contract.ts`, `public-endpoints.json`, `openapi.json` (regenerated), `test/contract.test.ts` | Entries `createPhotoUploadTicket` and `confirmPhotoUpload` with schemas and limits; the multipart entry untouched |
| `apps/api` domain | `domain/photo-upload.ts` (new), `domain/image-type.ts` (re-export), `domain/events.ts` | Keys, prefixes, `storeOf`, `isClaimable`, windows; `PhotoUploaded` event |
| `apps/api` adapters | `adapters/photo-store.ts`, `adapters/gcs-photo-store.ts` (new) | `PhotoStore` (bucket) and `BlobPhotoStore` ports; the Cloud Storage adapter with per-call timeouts, V4 POST policy, `StoreUnavailable` |
| `apps/api` use cases | `application/photo-ticket.ts`, `photo-confirm.ts`, `photo-process.ts` (new); `stage-photo.ts`, `register-worker.ts` | Ticket (nothing stored), confirm (decision table R2, row created last), processing (sharp, bulkhead 2, as-is fallback); claim returns the key, profile `photos` null for bucket rows, event enqueued; multipart path unchanged in behaviour, 503 if no Blob token |
| `apps/api` jobs, wiring, config | `jobs/purge-photos.ts`, `registration.handlers.ts`, `main.ts`, `config/config.ts`, `.env.example`, `package.json` | Purge over both stores by prefix; two handlers bound; `PHOTO_BUCKET`, `PHOTO_PUBLIC_BASE_URL`, `GCS_API_ENDPOINT`, `GCS_TIMEOUT_MS`, `PHOTO_PROCESS_CONCURRENCY`; `PHOTO_STORE`/`PHOTO_LOCAL_DIR` removed; `@google-cloud/storage` 7, `sharp` 0.34 |
| `apps/api` tests | `test/registration/fakes.ts`, `generators.ts`, `photo-units.test.ts`, `gcs-policy.test.ts`, `photo-gcs.int.test.ts` (new); `config.test.ts`, `jobs.int.test.ts`, `harness.ts`, `registration.int.test.ts` | In-memory bucket with failure injection; keys/claimability/confirm/processing/purge example and property tests; the policy decoded from a throwaway RSA key; the fake-server integration suite (skips without `GCS_API_ENDPOINT`) |
| `infra/` | `lib/stages.ts`, `service.*.yaml` (rendered), `cloudrun/lib.sh`, `cloudrun/bootstrap.sh` (step 11), `cloudrun/storage/*.json` (new), `test/cloudrun.test.ts`, `test/monitoring.test.ts`, `README.md` | Bucket names and public base URL per stage; buckets, managed folder public read, IAM, lifecycle, CORS, audit config, two log metrics; tests pin the names and the JSON files |
| CI, scripts, docs | `.github/workflows/ci-api.yml`, `scripts/setup-new-machine.sh`, `CLAUDE.md`, `docs/signup/*` | Fake storage container (pinned 1.52.2) started before the tests with the three variables; local container; the api reference §4.6a/b/c, the flow, the data model, the events and jobs, the source index |

## Gates (2026-10-05, this machine)

| Gate | Result |
|---|---|
| `@remonta/schemas` quality | 60 tests passed (14 new) |
| `@remonta/api-contract` quality | 35 passed; `openapi.json` regenerated and committed |
| `@remonta/api` quality | lint, strict tsc, **284 passed, 128 skipped** (the database suites and the fake-bucket suite: Docker Desktop is not running on this machine; CI runs both) |
| `@remonta/infra` quality | 37 passed; render drift clean |
| `pnpm --filter @remonta/api run build` | tsup ok |
| `npx turbo run build` | app and web compiled |
| generated Prisma clients | none staged (pre-existing local diffs left alone) |

Fixed on the way: a property predicate relying on an assertion's return value (returned a boolean instead);
the purge property's boundary at exactly 24 h (the job's window is strict); the policy test expecting the
bucket path in the URL (the SDK returns the bare endpoint with an endpoint override); sharp's EXIF typing
(`IFD3` for GPS); the infra test's table parser catching the new `bucket_for` line.

## What CI must still prove

The `photo-gcs.int.test.ts` suite against `fake-gcs-server` (adapter calls, ticket, upload standing in for
the browser, confirm, claim, processing with sharp on Linux, purge) has not run on this machine. If the
fake refuses a ranged read or the resumable-off save, the adapter's `readPrefix`/`write` options are the
first place to look.

## Before merging (deployment architecture, PR 3a)

1. Open the PR (1 commit, 52 files) and wait for all checks; `API Quality` now includes the bucket suite.
2. **You run bootstrap** once the PR is reviewed: `bash infra/cloudrun/bootstrap.sh remonta-api-510206`
   (idempotent; step 11 creates `remonta-api-photos-staging` and `remonta-api-photos`, the public managed
   folder, the IAM bindings, the audit config and the two metrics, and prints a WARNING if an org policy
   refuses the public grant). Bootstrap runs from the merged file set, so run it from this branch checked out
   locally, or after merge but **before the staging deploy finishes**; the api refuses to boot without its bucket.
   The simplest order: run bootstrap from the branch now, then merge.
3. After merge: staging deploys; health 200; `curl` the ticket entry (201 with a policy), a shell form POST to
   the bucket, confirm (200 and a row), a sign-up through the staging api with that id, the processed copy and
   thumbnail under `workers/<profileId>/`, the staging object gone; the live wizard still works through the
   multipart entry. Then promote to production and verify the same with one test object.

## Rollback

Promote the previous image. The buckets stay. The multipart path is untouched, so the live wizard is
unaffected in either direction.

## Amendment 2026-10-05 -- option 2 (copies in Vercel Blob), commits b55181d, 016d41d, dd9ff21

Bootstrap step 11 ran on the project: both buckets created, IAM bindings, write audit logs and the two
metrics in place. The public grant on `workers/` was refused: Domain restricted sharing (org policy) forbids
`allUsers` grants (HTTP 412), not public-access prevention. Decision: the bucket is private and upload-only;
the processing handler writes the clean copy, the thumbnail and the as-is fallback to Vercel Blob
(`cacheControlMaxAge` one year) and the profile gets the Blob URL; the Blob token is required and stays.
Code: `photo-process.ts`, `photo-store.ts` (`put` options), `stage-photo.ts` (no 503 guard), `config.ts`,
`main.ts`, bootstrap (prevention enforced on update, managed folder deleted, no grant), tests, docs,
`.env.example`. Gates after the change: api 284 passed / 128 skipped, infra 37. Two earlier flag errors in
bootstrap (`--public-access-prevention=inherited`, `--labels` on create) were fixed on the way.

**Before the PR:** the user re-runs `bash infra/cloudrun/bootstrap.sh remonta-api-510206` so step 11
enforces public access prevention and removes the two managed folders (expected: `exists: gs://...` for both,
no WARNING line, the audit and metric lines). Then open the PR (4 commits, 53 files).

**Amendment 2026-10-05, commit `922c374`:** the copies written to Blob carry `cacheControlMaxAge` of 30 minutes (user decision), not one year; constant `PHOTO_CACHE_S` in `photo-process.ts`.

**CI, 2026-10-05:** first run failed (no signing credential in the fake-bucket suite; `2aeb6cd`), second run 411/412 (the oversize test declared a size over the limit; `3082b5b`), third run green on every check. The fake-bucket suite has now run in CI: adapter calls, ticket, upload, confirm, sign-up, processing with sharp on Linux, purge.

## Build and Test, PR 3a -- staging (2026-10-05)

- Bootstrap re-run by the user: both buckets `public_access_prevention: enforced`, uniform access, Sydney,
  soft delete 7 d, lifecycle age 1 on `staging/`, labels; no managed folders left.
- PR #37 merged into `main` as `fbc6705` (verified by refs). `deploy-api`: quality green, image
  `api:fbc6705...` built and pushed (sharp and the storage client install in the container), staging
  revision `remonta-api-staging-00012-sqn` serving; boot log "apps/api listening", no "will not start".
- Staging checks from this machine (08:07Z): health 200 (0.28 s); ticket 201 in 0.72 s with the eight
  signed fields and the expiry (IAM `signBlob` by the runtime account works); the browser-style form POST of
  a 23.5 KB JPEG (EXIF + GPS + orientation 6) to `https://storage.googleapis.com/remonta-api-photos-staging/`
  → 201 in 1.2 s from here; the object present with `image/jpeg`; confirm 200 in 0.50 s; a second confirm
  200 (idempotent). Rejections: a guessed id → 409 "upload did not finish"; a ticket declaring HEIC → 400.
  The old multipart entry on the same revision → 201 in 2.6 s (Blob unchanged). Production: health 200,
  the ticket entry 404 (not promoted yet), sign-up page unchanged.
- Not verifiable from here: a sign-up claiming a bucket row (reCAPTCHA needs a browser), so the processing
  handler's first real run on staging happens in PR 3b's preview checklist, by the user, with
  `clent.b@remontaservices.com.au`. The staged test row (`4717c4dd-...`) and its object are purged after 24 h.
- The first upload attempt failed locally (http 000): the Windows curl does not read Git Bash `/c/...`
  paths; `cygpath -m` fixed the script. Not an api issue.

**Next:** production promotion by the user (Actions → deploy-api → Run workflow → stage=prod,
imageTag=`fbc6705bc51310069f6c05e4e3d73525c0d0a64c`), then the same checks on production.
