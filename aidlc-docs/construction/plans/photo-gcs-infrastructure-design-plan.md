# Infrastructure Design Plan -- unit `photo-gcs` (U3)

**Inputs:** functional design, NFR requirements (U3-SEC-01..09, U3-AVAIL-01..06), NFR design (P6-P9, logical
components), `infra/lib/stages.ts`, `infra/cloudrun/bootstrap.sh` + `lib.sh` (U1), the `API Quality` workflow.
Facts checked 2026-10-05: Cloud Storage CORS accepts a subdomain wildcard origin (`https://*.vercel.app`);
`gcloud storage managed-folders` exists in the installed SDK.

Three questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done").

## Question 1
Bucket names (global namespace; one per stage).

A) **`remonta-api-photos-staging` and `remonta-api-photos`**, matching the service names
(`remonta-api-staging`, `remonta-api`) so every stage-scoped resource reads the same way. If a name is taken
(global namespace), fall back to B for that stage. Recommended.

B) **Project-suffixed**: `remonta-api-photos-staging-510206` and `remonta-api-photos-510206`; never collides,
less readable; the suffix is the project number, already public in the api URL.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
How the processed prefix is made publicly readable while the staging prefix stays private.

A) **One bucket per stage, uniform bucket-level access, a managed folder `workers/` with
`allUsers: roles/storage.objectViewer`.** The staging prefix inherits nothing public. One bucket, one lifecycle
rule, one CORS, one IAM binding for the api. Recommended.

B) **Two buckets per stage**: a private `…-staging` bucket for uploads and a public `…-photos` bucket for the
processed copies (bucket-level `allUsers` grant). Simpler IAM model, double the resources and a cross-bucket copy
in processing.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
Who creates the buckets, and when.

A) **Bootstrap, by you, before PR 3a merges**: a new bootstrap step 11 (`buckets`) creates both buckets with their
settings, the managed folders, the IAM bindings and the audit-log config; idempotent like the rest. You run
`bash infra/cloudrun/bootstrap.sh remonta-api-510206` (the whole script, which only creates what is missing) once
the PR is open and reviewed, so the staging deploy that follows the merge finds its bucket. Recommended: keeps
"nothing deploys without the resource it needs" and keeps Google Cloud writes in a person's hands.

B) **I run the bucket step from this machine** with the signed-in account, after your go, as with the alert
apply.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Fixed by earlier decisions (not questions)

- Region `australia-southeast1`; uniform bucket-level access; soft delete 7 days (default); no versioning;
  lifecycle: delete objects under `staging/` older than 1 day; CORS: the stage's app origins, `POST`, max-age 3600,
  response header `Content-Type`.
- IAM: runtime SA `roles/storage.objectUser` on its bucket; `roles/iam.serviceAccountTokenCreator` on itself.
- Project audit config: Cloud Storage `DATA_WRITE`.
- Log-based metrics `remonta-api-photo-rejected` (`jsonPayload.msg="photo-rejected"`) and
  `remonta-api-photo-processing-fallback` (`jsonPayload.msg="photo-processing-fallback"`), via the `metric` helper.
- The stage table (`stages.ts`) gains `PHOTO_BUCKET` and `PHOTO_PUBLIC_BASE_URL`; `lib.sh` gains `bucket_for`
  with the same names; the infra tests check they agree; `service.*.yaml` re-rendered.
- CI: `fake-gcs-server` service container in `API Quality` (pinned tag); the local setup script documents the
  container; no Google credentials anywhere in CI.
- Secrets: none added; `BLOB_READ_WRITE_TOKEN` leaves the table in PR 3c.

## Execution checklist

- [ ] 1. Confirm the three answers; resolve ambiguity in a clarification file
- [ ] 2. `aidlc-docs/construction/photo-gcs/infrastructure-design/infrastructure-design.md`: every Google Cloud
  resource with its exact settings and the gcloud commands bootstrap will run; the stage table changes; the CI
  change; the configuration per stage
- [ ] 3. `deployment-architecture.md`: the three-PR rollout with what exists before each merge and promotion,
  the verification per step, the rollback per step, the cut-over window and the token removal
- [ ] 4. Present for approval
