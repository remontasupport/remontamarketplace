# Infrastructure Design -- unit `photo-gcs` (U3)

**Decisions:** infrastructure plan Q1 A (names match the services), Q2 A (one bucket per stage, public managed
folder `workers/`), Q3 A (the user runs bootstrap before PR 3a merges); approved 2026-10-05. Project
`remonta-api-510206`, region `australia-southeast1`.

## 1. Resources per stage

| Resource | staging | prod |
|---|---|---|
| Bucket | `remonta-api-photos-staging` | `remonta-api-photos` |
| Public base URL | `https://storage.googleapis.com/remonta-api-photos-staging` | `https://storage.googleapis.com/remonta-api-photos` |
| Managed folder (public read) | `workers/` | `workers/` |
| Runtime service account | `remonta-api-staging-run@…` | `remonta-api-run@…` |
| CORS origins | `https://*.vercel.app` | `https://app.remontaservices.com.au` |

Fallback if a bucket name is taken at creation: append `-510206` for that stage (plan Q1 B) and put the chosen
name in the stage table before the PR merges.

## 2. Bucket settings (identical per stage)

| Setting | Value | Why |
|---|---|---|
| Location | `australia-southeast1` (regional) | residency; zone-redundant by design |
| Storage class | Standard | small, frequently read |
| Access control | uniform bucket-level access | managed folders need it; no ACLs |
| Public access prevention | **inherited (not enforced)** | enforced would block the managed-folder public grant; the exception is documented (SECURITY-09) |
| Soft delete | 7 days (default) | recovery backstop |
| Versioning | off | keys are immutable |
| Lifecycle | delete, `matchesPrefix: ["staging/"]`, `age: 1` | never-confirmed uploads |
| CORS | origins per stage; methods `POST`; responseHeader `Content-Type`; maxAgeSeconds 3600 | the browser's form POST and reading its response |
| Labels | `remonta-project=remonta`, `remonta-service=api`, `remonta-stage=<stage>` | as the services |

Note on public access prevention: Google's org-level default may enforce it. Bootstrap sets the bucket to
`inherited`; if the org policy enforces prevention, the managed-folder grant fails and the plan's alternative
(a signed-read design) would have to be revisited. Checked at bootstrap time; the step prints the result.

## 3. IAM

| Principal | Role | Scope |
|---|---|---|
| `allUsers` | `roles/storage.objectViewer` | managed folder `workers/` only |
| runtime SA of the stage | `roles/storage.objectUser` (create, read, delete objects) | its bucket |
| runtime SA of the stage | `roles/iam.serviceAccountTokenCreator` | on itself (for `signBlob`) |
| deploy SA | nothing new | |

Project audit config: `storage.googleapis.com` → `DATA_WRITE` (Admin and data-read stay as they are).

## 4. Bootstrap additions (`infra/cloudrun/bootstrap.sh`, step 11; helpers in `lib.sh`)

```
bucket_for()  { case "$1" in staging) echo remonta-api-photos-staging ;; prod) echo remonta-api-photos ;; esac; }
origins_for() { case "$1" in staging) echo 'https://*.vercel.app' ;; prod) echo 'https://app.remontaservices.com.au' ;; esac; }

say "11. Photo buckets (regional, uniform access, public read on workers/ only)"
gcloud services enable storage.googleapis.com
for STAGE in staging prod:
  B=$(bucket_for $STAGE); RUN_SA=...
  exists gcloud storage buckets describe gs://$B ||
    gcloud storage buckets create gs://$B --location=$REGION --uniform-bucket-level-access --public-access-prevention=inherited \
      --soft-delete-duration=7d --labels=remonta-project=remonta,remonta-service=api,remonta-stage=$STAGE
  gcloud storage buckets update gs://$B --lifecycle-file=$here/storage/lifecycle.json --cors-file=$here/storage/cors.$STAGE.json
  exists gcloud storage managed-folders describe gs://$B/workers/ || gcloud storage managed-folders create gs://$B/workers/
  gcloud storage managed-folders add-iam-policy-binding gs://$B/workers/ --member=allUsers --role=roles/storage.objectViewer
  gcloud storage buckets add-iam-policy-binding gs://$B --member=serviceAccount:$RUN_SA --role=roles/storage.objectUser
  gcloud iam service-accounts add-iam-policy-binding $RUN_SA --member=serviceAccount:$RUN_SA --role=roles/iam.serviceAccountTokenCreator
gcloud projects get-iam-policy … | add auditConfig storage.googleapis.com DATA_WRITE | gcloud projects set-iam-policy   (idempotent merge)
metric remonta-api-photo-rejected "a sign-up photo upload was rejected at confirm" 'resource.type="cloud_run_revision" AND jsonPayload.msg="photo-rejected"'
metric remonta-api-photo-processing-fallback "a sign-up photo could not be processed; stored as uploaded" 'resource.type="cloud_run_revision" AND jsonPayload.msg="photo-processing-fallback"'
```

New files: `infra/cloudrun/storage/lifecycle.json`, `infra/cloudrun/storage/cors.staging.json`,
`infra/cloudrun/storage/cors.prod.json` (committed, tested for shape). The audit-config merge is done with
`node -e` on the exported policy JSON, like the policy comparison in `apply-alerts.sh`.

## 5. Stage table and rendered services

`infra/lib/stages.ts`: `environment` gains per stage `PHOTO_BUCKET` and `PHOTO_PUBLIC_BASE_URL`; `PHOTO_STORE`
removed (PR 3a: the api reads the bucket; the Blob token remains in `SECRET_NAMES` until 3c). `pnpm --filter
@remonta/infra run render` regenerates `service.*.yaml`; the drift test enforces it. A new test asserts that
`bucket_for` in `lib.sh` and `PHOTO_BUCKET` in `stages.ts` agree, and that `PHOTO_PUBLIC_BASE_URL` is
`https://storage.googleapis.com/<PHOTO_BUCKET>`.

## 6. CI: `API Quality` (`.github/workflows/ci-api.yml`)

```yaml
services:
  postgres: (unchanged)
  gcs:
    image: fsouza/fake-gcs-server:1.52.2        # pinned
    ports: ["4443:4443"]
    options: >-
      --health-cmd "wget -qO- http://localhost:4443/storage/v1/b || exit 1"  (or the image's documented health path)
      --health-interval 5s --health-timeout 5s --health-retries 12
    # command: -scheme http -public-host localhost:4443   (set through the image's entrypoint args if the runner supports it; otherwise a `docker run` step before the tests)
env:
  GCS_API_ENDPOINT: http://localhost:4443
  PHOTO_BUCKET: test-photos
  PHOTO_PUBLIC_BASE_URL: http://localhost:4443/test-photos
```

Tests create the bucket through the client (`storage.createBucket`) if missing and skip, reporting as skipped,
when `GCS_API_ENDPOINT` is unset. The local setup script (`scripts/setup-new-machine.sh`) and CLAUDE.md's
"apps/api" section gain the same container command.

## 7. Configuration per stage (plain environment, from the table)

| Variable | staging | prod |
|---|---|---|
| `PHOTO_BUCKET` | `remonta-api-photos-staging` | `remonta-api-photos` |
| `PHOTO_PUBLIC_BASE_URL` | `https://storage.googleapis.com/remonta-api-photos-staging` | `https://storage.googleapis.com/remonta-api-photos` |
| `GCS_TIMEOUT_MS` | default 5000 (not in the table) | same |
| `PHOTO_PROCESS_CONCURRENCY` | default 2 (not in the table) | same |
| `BLOB_READ_WRITE_TOKEN` (secret) | kept until 3c | kept until 3c |

## 8. Extension compliance (Infrastructure Design, U3)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 | Compliant | Google-managed encryption; TLS; the fake server in CI is http on localhost only |
| SECURITY-02 | N/A | no load balancer or CDN; Cloud Audit Logs `DATA_WRITE` on the bucket |
| SECURITY-06 | Compliant | two bindings, bucket- and self-scoped; no wildcards |
| SECURITY-07 | Compliant | CORS per stage, `POST` only |
| SECURITY-09 | Compliant with documented exception | public read on `workers/` only; prevention `inherited` with the org-policy check at bootstrap |
| SECURITY-10 | Compliant | pinned container tag; lockfile |
| SECURITY-14 | Compliant | two metrics; existing alerts; audit logs |
| RESILIENCY-08, -12 | Compliant | regional bucket; soft delete; lifecycle |
| RESILIENCY-04 | Compliant | rollout and rollback in `deployment-architecture.md` |
| others | as earlier stages | no blocking finding |

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
