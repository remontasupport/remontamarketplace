# U3b service documents on the api -- design (2026-10-15)

Decisions in force: D1 private storage with signed links for the worker and admins; D2 a removed service's documents
go with it; D4 an uploaded file is the tick. Inventory: the U3b section of the agent report (audit 2026-10-15).

## Shape

| Step | Who | What |
|---|---|---|
| Ticket | `POST /v1/worker/service-documents/tickets` `{contentType, sizeBytes}` | a signed POST policy for `staging/<uuid>` (the photo bucket; the lifecycle rule deletes `staging/` after a day, so an abandoned upload needs no table and no job). PDF, JPEG, PNG, WebP, HEIC/HEIF; 50 MB (today's limit) |
| Upload | the browser | straight to the bucket (CORS POST already allowed for the app's origin): the file never passes through a function |
| Confirm | `POST /v1/worker/service-documents` `{uploadId, categoryId, requirementType, fileName}` | the service must be chosen; the type must be one the service calls for (`service-requirements.ts` + the Cert III/IV types of the two Support Worker services); one ranged read checks size and magic bytes against the declared type; a server-side copy to `documents/<profileId>/<uploadId>.<ext>` (private, outside `staging/`); the staging object deleted; then the row in the section transaction |
| Row | `verification_requirements` | as today: `requirementType "<service name>:<type>"`, `documentCategory SERVICE_QUALIFICATION`, `status SUBMITTED`, the service's name for the type; one row per service and type (found, then updated or created); a re-upload clears the review fields; `metadata {serviceTitle, category, storageKey, fileName, contentType, sizeBytes, uploadId}`; `documentUrl` = **`/api/documents/<row id>/<file name>`**, an app path |
| View | `GET /v1/worker/service-documents/:id/link` (owner) and `GET /v1/admin/documents/:id/link` (ADMIN) | a 5-minute signed GET URL for `storageKey` (inline, the original file name); a legacy row without one answers its stored public URL |
| Delete | `DELETE /v1/worker/service-documents/:id` | the row (the caller's, SERVICE_QUALIFICATION), completion recomputed; the file after the commit (own `documents/<profileId>/` key, or a legacy Blob URL in the worker's own folder) |
| Read | `GET /v1/worker/profile` | gains `serviceDocuments[]` |

**Why `documentUrl` is an app path:** the admin compliance page opens `documentUrl` directly (link, iframe for `.pdf`,
img for image extensions). A path that ends in the real extension keeps every admin and worker view working; the app
route (U3c) checks the session (the owner or an admin), asks the api for the signed link and redirects. A signed URL
stored in the row would expire and its `?query` defeats the extension check.

Removing a service (U3a) deletes its documents' files from both stores (the GCS key under the worker's own prefix, or
the legacy Blob URL in the worker's own folder).

Not in U3b: the app route and the pages (U3c); the other document kinds (compliance, identity, trainings, other) stay on
Blob; existing public service files stay until a separate migration.

## Built (2026-10-15)

`feat/service-documents-api` `bcb4de8`, stacked on U3a (`feat/services-api`) with `perf/api-round-trips` merged in
(it uses the single ranged read). Merged into PR #57 (`a45667c`). Gates on PR #57: schemas 84, contract 90, api 719
(+193 database/bucket-gated, CI), app 139/470 known 213, infra 40. Tests: 13 unit (the checks, keys, path, link,
disposition, per-service types) and the HTTP flow on PostGIS (ticket, upload, confirm, retry, link, other worker 404,
replace, refusals, delete, service removal with the bucket). Local smoke on the dev copy through the api: the read's
`serviceDocuments`, a legacy row's link, another worker's link and delete 404, a type not for the service 400, a service
not chosen 404, a zip ticket 400. An upload itself cannot run here (no bucket credentials): staging after the merge.
