# Deployment Architecture -- unit `photo-gcs` (U3)

The three-PR rollout, with what must exist before each step, how each is verified and how each rolls back. The
constraint behind the order: Vercel previews call the **staging** api, which deploys from `main`; production's
api moves only by promotion; the app deploys to production on merge (CLAUDE.md).

## Topology after PR 3b

```
phone / browser ──(1) ticket, (3) confirm──> remonta-api (Cloud Run, Sydney) ──signBlob──> IAM
       │                                            │ inspect / read 16 B / read / write / delete
       └──(2) POST form + file──────────────────────┴──> bucket remonta-api-photos (Sydney)
                                                              ├─ staging/<id>        private, lifecycle 1 day
                                                              └─ workers/<pid>/…     public read (managed folder)
app (Vercel) ──next/image──> https://storage.googleapis.com/remonta-api-photos/workers/…   (and old Blob URLs as before)
outbox dispatcher (in the api) ──PhotoUploaded──> processing (sharp, bulkhead 2)
scheduler (in the api) ──daily──> purge (bucket + Blob until 3c)
```

## PR 3a -- backend, additive

| | |
|---|---|
| **Branch / packages** | `feat/photo-gcs-api` from `main`: `infra/` (stages table, bootstrap step 11, storage JSON files, tests), `packages/schemas` (sniffer), `packages/api-contract` (two entries; multipart kept), `apps/api` (adapter, handlers, processing, purge, config), `.github/workflows/ci-api.yml` (fake storage), `docs/signup`, CLAUDE.md |
| **Before merge** | PR open and reviewed; **you run `bash infra/cloudrun/bootstrap.sh remonta-api-510206`** (idempotent; creates the two buckets, folders, bindings, audit config, metrics; prints the public-access-prevention result); CI green including `API Quality` with the fake storage |
| **Merge** | `deploy-api` builds the image and deploys **staging**; the api boots only if `PHOTO_BUCKET` is set, which the rendered staging YAML now provides |
| **Verify on staging** | health 200; the live wizard (preview) still signs up through the multipart entry, unchanged; `curl` the ticket entry → 201 with a policy; a form POST with the policy from the shell → 201 at the bucket; confirm → 200 and a row; a full sign-up with an internal email using that id (through the staging api directly) → account, outbox `DONE` for `PhotoUploaded`, processed copy and thumbnail in `workers/<pid>/`, staging object gone, `photos` on the profile = the processed URL; purge dry run |
| **Promote** | `workflow_dispatch` stage=prod with the staging image tag; production's api gains the entries; the live wizard behaviour is unchanged (multipart to Blob) |
| **Verify on production** | health 200; ticket entry 201; the production bucket receives a shell-uploaded test object and confirm stages it (purged after 24 h); the sign-up page unchanged |
| **Rollback** | promote the previous image; the buckets stay (empty or with test objects); nothing else to undo |

## PR 3b -- the wizard switch

| | |
|---|---|
| **Branch / packages** | `feat/photo-gcs-wizard` from `main` (after 3a merged and promoted): `packages/form-engine`, `apps/app` (field, uploader, props, `next.config` host), `docs/signup` |
| **Before merge** | the Vercel preview, against staging (which has 3a): the preview checklist of requirements §6.2 in full: phone on mobile data with progress; HEIC on iPhone (JPEG arrives) and on Android or desktop (the message); a full sign-up with an internal email; processed copy and thumbnail, original gone, no EXIF (checked with an EXIF reader on the downloaded copy); duplicate-email notice; an old Blob photo still displays in the dashboard; the production domain unchanged meanwhile. Recorded in the construction notes |
| **Merge** | Vercel deploys the app to production; production's api already serves the entries; the direct upload is live |
| **Verify on production** | one internal sign-up from a phone; the processed copy appears; the Cloud Run request log shows ticket and confirm under 300 ms; no photo route above 1.5 s |
| **Rollback** | Vercel promote of the previous `remonta-app` deployment (seconds); the api keeps both entries, so the old wizard works again at once |

## PR 3c -- clean-up (after the cut-over window)

| | |
|---|---|
| **When** | after the purge summary shows no Blob-prefixed unclaimed rows for 3 consecutive days (R9.3) |
| **Branch / packages** | `feat/photo-gcs-cleanup` from `main`: `packages/api-contract` (multipart entry removed), `apps/api` (`stage-photo.ts`, the Blob adapter, `@vercel/blob` dependency, the token in config), `infra/lib/stages.ts` (`BLOB_READ_WRITE_TOKEN` out of `SECRET_NAMES`), docs |
| **Before merge** | CI green; staging deploy; staging health; a sign-up on a preview still works (3b path) |
| **Promote** | as 3a |
| **After** | you delete the secrets `remonta-api[-staging]-BLOB_READ_WRITE_TOKEN` in Secret Manager (bootstrap no longer lists them) |
| **Rollback** | promote the previous image (the token secret still exists until you delete it, so the old image boots) |

## Cut-over window, in one table

| Period | Multipart entry | New entries | Rows created | Purge deletes from |
|---|---|---|---|---|
| before 3a | live, Blob | -- | Blob rows | Blob |
| 3a merged (staging) | live, Blob | callable, bucket | Blob (wizard) + bucket (checklist) | both |
| 3a promoted | live, Blob | live, bucket (no caller) | Blob | both |
| 3b merged | idle | live | bucket | both (Blob rows drain within 24 h) |
| 3c merged + promoted | gone | live | bucket | bucket |

## Verification of the latency goal (the reason for the unit)

After 3b on production, one week of Cloud Logging: no request to `/v1/registrations/worker/photo-tickets` or
`…/photo-confirmations` above 500 ms; the old multipart route absent; the corrected latency policy silent. Record
in the construction notes beside U1's observation.
