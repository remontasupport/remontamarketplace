# Code summary -- unit `photo-gcs`, PR 3c (clean-up after the cut-over)

**Branch** `feat/photo-gcs-cleanup` from `main` `177a2c2` (3b merged), three commits `574be0a` (contract),
`7740497` (api), `686a6c6` (docs), pushed 2026-10-05.
**PR**: https://github.com/remontasupport/remontamarketplace/compare/main...feat%2Fphoto-gcs-cleanup?expand=1
(24 files, +136 / -358). Plan: `../../plans/photo-gcs-code-generation-plan.md`, steps J1-J5, **as amended
by option 2** (2026-10-05): the Blob adapter, the `@vercel/blob` dependency and `BLOB_READ_WRITE_TOKEN` stay,
because the clean copies live in Vercel Blob; step J3 (the secret out of `infra/`) is therefore cancelled.

**Not to merge before the cut-over window has closed** (deployment architecture, R9.3): the purge summary shows
no Blob-prefixed unclaimed rows (`skippedUnknownStore: 0` once this PR runs; `deletedBlob: 0` before it) for three
consecutive daily runs after the wizard switch of 2026-10-05, i.e. **2026-10-08 at the earliest**. Merging earlier
would leave multipart-era unclaimed rows and their Blob objects unpurged (the row is skipped, the object stays).

## What changed

| Area | Files | Change |
|---|---|---|
| `packages/api-contract` | `src/registration.contract.ts`, `public-endpoints.json`, `openapi.json` (regenerated), `test/contract.test.ts` | `uploadRegistrationPhoto` (`POST /v1/registrations/worker/photo`, multipart) removed; eight entries remain |
| `apps/api` use cases | `application/photo-claim.ts` (new), `stage-photo.ts` (deleted), `register-worker.ts`, `photo-confirm.ts` | `claimPhoto` (returns the key), `attachPhoto`, `hashIp` in their own file; the sign-up transaction no longer branches on the store: `photos` is null until `PhotoUploaded` writes the clean copy; the event is always queued |
| `apps/api` adapters, domain, jobs, wiring | `adapters/photo-store.ts`, `domain/image-type.ts` (deleted), `domain/photo-upload.ts`, `jobs/purge-photos.ts`, `registration.handlers.ts`, `main.ts` | `LocalDiskPhotoStore` gone; `VercelBlobPhotoStore` stays for the clean copies; the handler and the `store` dependency removed; the purge takes `{ gcs }` only and skips (counted as `skippedUnknownStore`) any row whose key is not the bucket's, so a leftover Blob row is never deleted from the wrong store |
| `apps/api` tests | `test/registration/harness.ts`, `registration.int.test.ts`, `photo-units.test.ts`, `units.test.ts`, `fakes.ts` | The harness and the PostGIS suite stage a photo the way the browser does (ticket, the object under the ticket's key through `putAsBrowser`, confirm); `body()` skips staging when the caller passes `photoUploadId` (the fake-bucket suite does); the "photo upload" cases became "photo ticket and confirm" (row under `staging/<id>`; non-image bytes → 415, no row, object deleted); the profile's `photos` is asserted null; cleanup also removes the suite's `PhotoUploaded` events; the purge property models one store |
| docs | `docs/signup/01-flow.md`, `02-api-reference.md`, `03-data-model.md`, `05-events-and-emails.md`, `README.md` | 4.6c is a history note; the 415 row; the data model's 2.8 and a §5 history paragraph; the purge summary fields; the source index points at `photo-claim.ts` |

Unchanged on purpose: `infra/` (six secrets, the token included), `apps/api/package.json` (`@vercel/blob` stays),
`config.ts` (`BLOB_READ_WRITE_TOKEN` required), `test/helpers.ts` `multipart()` (still used by the synthetic
multipart contract in `route-security.test.ts`, which keeps proving the pipeline's multipart rules), `.env.example`,
CLAUDE.md.

## Gates (2026-10-05, this machine)

| Gate | Result |
|---|---|
| `@remonta/api-contract` quality | 35 passed; `openapi.json` regenerated (121 lines gone) |
| `@remonta/api` quality | lint, strict tsc, **276 passed, 128 skipped**: the PostGIS suites (`registration.int`, `hostile.int`, `jobs.int`, …) and the fake-bucket suite did **not** run (Docker Desktop not responding on this machine). The harness and the PostGIS suite are exactly what this PR rewrites, so **CI's `API Quality` is the gate that proves them** |
| `@remonta/form-engine` quality | 58 passed (its fixtures name only the remaining entries) |
| `apps/app` strict tsc | 144 errors, the baseline (nothing in the app named the removed entry) |
| `pnpm --filter @remonta/api run build` | tsup ok |
| generated Prisma clients | reverted; none staged |

## Before merging (deployment architecture, PR 3c)

1. The window: three consecutive daily purge runs after 2026-10-05 with no Blob-prefixed unclaimed rows. Read it in
   Cloud Logging on `remonta-api`: the job's summary line (`purge-unclaimed-registration-photos`) with `deletedBlob: 0`
   and `candidates` accounted for by `deletedGcs`. Earliest merge: 2026-10-08.
2. CI green, `API Quality` included (the rewritten PostGIS suites).
3. Merge with "Merge pull request" → `deploy-api` deploys **staging**; health 200; a sign-up on a PR preview still
   works through the wizard (ticket, confirm, submit; the processed copy in Blob).
4. Promote (`workflow_dispatch`, stage=prod, the staging image tag); production health 200; the multipart route answers
   404; one internal sign-up from a phone still processes.

## Rollback

Promote the previous api image (the multipart entry comes back with it; the wizard does not use it). Nothing to undo
in Secret Manager or `infra/`: this PR removes no secret.
