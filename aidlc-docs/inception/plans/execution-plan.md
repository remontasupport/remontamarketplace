# Execution plan: document-history

Requirements approved 2026-11-11. Extensions: carried (Security Baseline blocking; Resiliency Baseline; PBT full).

## Where a file is lost today (all in `apps/api/src/modules/worker/worker.handlers.ts`)

| Path | Transaction step | After the commit |
|---|---|---|
| `confirmServiceDocument` | `recordDocument` returns `replaced` | `deleteDocumentFiles` |
| `confirmComplianceDocument`, `signContract` | `recordComplianceDocument` returns `replaced` | `deleteDocumentFiles` |
| `deleteServiceDocument` | `removeDocument` deletes the row | `deleteDocumentFiles` |
| `deleteComplianceDocument` | `removeComplianceDocument` deletes the row | `deleteDocumentFiles` |
| `putServices` | `writeServices` deletes a removed service's rows (`out.files`) | `deleteDocumentFiles` |

Every path already has the old row in hand inside the transaction. The change is one shared function,
`keepVersion(tx, oldRow, reason, now)`, called at those five steps, and the post-commit deletes removed.
`deleteDocumentFiles` stays (the admin delete and the retention job reuse it).

## Units

### U1 `history-api` (apps/api, packages/db, packages/api-contract) -- one PR, staging, preview checklist, promote

- **Migration**: table `document_versions` (id, workerProfileId FK, requirementId (no FK: the row may be gone),
  requirementType, requirementName, documentCategory, storageKey, documentUrl, fileName, uploadedAt, status, reviewedAt,
  reviewedBy, approvedAt, rejectedAt, rejectionReason, expiresAt, supersededAt, reason enum `REPLACED` |
  `DELETED_BY_WORKER` | `SERVICE_REMOVED`); indexes (workerProfileId, supersededAt) and (supersededAt). Additive only.
  New admin audit action for the delete.
- **Write**: `keepVersion` at the five steps above; no post-commit file delete on the worker paths.
- **Contract** (`admin.contract.ts`, admin access, rate limit, audit):
  - `GET /v1/admin/workers/:workerId/document-versions` -- the versions, newest first, no file keys.
  - `GET /v1/admin/document-versions/:versionId/link` -- a five-minute link (reuses `linkFor`).
  - `DELETE /v1/admin/document-versions/:versionId` -- row deleted, then the file (`deleteDocumentFiles`); audited with the admin.
- **Retention job** (scheduler, daily): versions with `supersededAt` older than 7 years, in batches; `RETENTION_MODE`
  `report` (logs counts only) on first release, `apply` by a later config change.
- **Tests**: unit + database tests per path (a replace/delete/service removal leaves a version and the file); PBT on the
  retention cut-off and on "no path deletes a worker file"; the contract checks.
- **Behaviour change at promotion**: worker files stop being deleted. Nothing the worker sees changes.

### U2 `history-app` (apps/app) -- one PR, after U1 is promoted

- New admin page `/admin/compliance/[id]/history`: versions grouped by document type, newest first, the current
  document for context, Open (link), Delete (confirm dialog, then refresh). Linked from `/admin/compliance/[id]`.
- Calls through `createClient(adminContract)` with the existing admin token loop; no hand-written fetch.

## Order and risk

U1 merge -> staging -> preview checklist (replace, delete, service removal each leave a version; history lists them;
link opens; admin delete removes row + file; production unchanged) -> promote -> U2 merge. App before api would show an
empty page calling a missing endpoint, so U2 waits for the promotion (follow-up 32).

## Open (to settle in U1 Functional Design)

- O2 Worker wording: a line in the worker's delete confirmation ("Remonta keeps a copy for compliance records")?
- O3 If a worker profile is ever deleted (no code path does today; the FK cascades from users), do its versions go too
  (cascade) or stay (block the delete)?
