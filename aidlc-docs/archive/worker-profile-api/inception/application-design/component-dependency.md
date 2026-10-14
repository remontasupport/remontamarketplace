# Component dependencies -- the worker profile on `apps/api`

## Dependency matrix (row depends on column)

| | C1/C2 contract | C4 own | C5 read | C6 completion | C8 addresses | C9 bank | C11 storage | C12 docs | C13 localities | locations `placeHome` | outbox | `SafeHttpClient` | pipeline |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C3 handlers | ✓ | ✓ | ✓ | | ✓ | | | ✓ | | | | | ✓ (bound by) |
| C5 read | ✓ | | | ✓ | | ✓ | | | ✓ | | | | |
| C7 sections | ✓ | ✓ | | ✓ | | ✓ | ✓ (photos) | | | | ✓ (PhotoUploaded) | | |
| C8 addresses | ✓ | | | ✓ | | | | | ✓ | ✓ | | | |
| C12 documents | ✓ | ✓ | | ✓ | | | ✓ | | | | | | |
| C23 jobs | ✓ | ✓ | | | | | | | | | ✓ (JobApplied) | | |
| C24 CRM handler | | | | | | | | | | | ✓ (handler) | ✓ | |
| registration module | ✓ | | | | | | ✓ (kind `registration-photo`) | | ✓ | ✓ | ✓ | | |
| admin module | ✓ (admin link) | | | | | ✓ (mask) | ✓ (signed url) | ✓ (adminDocumentLink) | | | | | |
| C14/C15 engine | ✓ (schemas) | | | | | | | | | | | | |
| C16 app data layer | ✓ (`createClient`) | | | | | | | | | | | | |
| C19 sidebar | | | | | | | | | | | | | |
| C22 admin doc views | ✓ (admin client) | | | | | | | | | | | | |

Boundaries kept: `packages/api-contract` imports Zod only (P-6); `packages/form-engine` imports the contract and
nothing from React/DOM/Node (P-7); `apps/app` calls the api only through `createClient` (Semgrep
`remonta-no-raw-fetch-to-api`); `apps/api` never adds a Nest controller.

## Communication patterns

| From → To | How |
|---|---|
| Browser → api | HTTPS JSON through `createClient(workerContract)` with `Authorization: Bearer` (the app's token source, 5-minute JWT, refresh-once on 401); reads carry `If-None-Match` |
| Browser → bucket | one signed multipart POST per upload (the engine's `Uploader`, XHR with progress) |
| api → database | Prisma, one pool per instance; `unitOfWork` for every write; statement timeouts |
| api → bucket | the `ObjectStore` adapter (GCS JSON API, service-account signed policies and read URLs) |
| api → Vercel Blob | the existing Blob adapter (photos' clean copies only) |
| api → n8n | outbox → C24 → `SafeHttpClient` (allow-listed host, no redirects, 10 s), never on the request path |
| api instances ↔ each other | nothing in memory; rate limits, outbox claims and job leases in Postgres |
| app admin page → api | the admin client for `GET /v1/admin/documents/{id}/link`; the admin's other reads unchanged (the existing app route reads the columns) |

## Data flows

**A section save** (US-WP-01, 12, 27):
```
form (section def) --values--> engine: validate (contract schema) --body--> workerApi.putX --PUT--> pipeline
  --> handler: profileIdOf --> putX: domain rules --> unitOfWork { replace rows; persistCompletion } --> audit
  <-- 200 section <-- client: clear draft; profile.reload() --GET (cache: reload)--> getProfile --> sidebar/home update
```

**An upload** (US-WP-02, 19, 29):
```
form --POST tickets {kind, contentType, size}--> UploadsService.createTicket --> bucket policy {url, fields}
browser --multipart--> bucket (staging/<kind>/<owner>/<uploadId>)
form --PUT documents/{type} {uploadId, metadata}--> confirmUpload (inspect) --> row {storageKey} + verificationStatus + completion
[photos: confirmPhoto --> PhotoUploaded --> outbox handler --> clean copy on Blob --> profile.photos]
read --GET documents/{id}/link--> signedReadUrl (300 s) --> browser opens
```

**An application and the CRM** (US-WP-23, 24):
```
ApplyModal --POST job-applications {jobId}--> apply: tx { upsert application; enqueue JobApplied } --> 201
dispatcher (2 s) --claim SKIP LOCKED--> crm.JobApplied --> SafeHttpClient.post(n8n, payload, Idempotency-Key)
  success: DONE | failure: back-off 2..32 min, DEAD after 6 --> alert
```

**The service area** (US-WP-09, 10):
```
form --PUT service-area {localityId, radius}--> LocalityDirectory.byId --> placeHome(locality,'ONBOARDING',radius)
  --> tx { upsert worker_locations HOME; update legacy columns; persistCompletion } --> 200
admin search (ST_DWithin on HOME.point) and client search (legacy lat/long) now find the worker at the new suburb
```

## Unit and PR mapping

| Component | Unit | PR |
|---|---|---|
| C1 skeleton + `getProfile`, C2 profile schema, C3, C4, C5, C6, C13 use, C17, C18, C25 (U1 part) | U1 | 1 |
| C10 (home address), C1 section entries, C7, C8, C9 | U2 | 2 |
| C14, C15, C20, C16, C19, C21 | U2 | 3 |
| deletions: profile actions, `update-step`, old hooks, Step6ABN's TFN branch, nested QueryClients | U2 | 4 |
| C10 (`storageKey`), C11 (lift + kinds), C12, admin link entry, C1 U3 entries | U3 | 5 |
| services/documents pages on the engine, C22, `/api/upload/worker-photo` auth + limit | U3 | 6 |
| deletions: document routes, Blob upload routes, `compliance/upload`, `blob/upload-token`, no-caller routes | U3 | 7 |
| C1 U4 entries, C23, C24, C25 (secret) | U4 | 8 |
| dashboard and my-jobs as client pages, ApplyModal/WithdrawButton on the api, geocode call removed | U4 | 9 |
| deletions: Prisma-reading pages, `NewsSliderAsync`, Upstash keys, `/api/worker/jobs*` | U4 | 10 |

Seams stated: C11 is introduced in U3 but the registration module keeps its tests green by delegating; if PR 1 finds
it cheaper to introduce the `ObjectStore` port early (the profile read does not need it), that is allowed and noted.
C21 needs no worker entry (the admin route reads the columns), so U2's PR 3 can ship it without an admin contract
change.
