# Requirements: document-history (admin access to past worker documents)

Cycle opened 2026-11-11. Brownfield; the area is the worker documents (`verification_requirements`).

## Today (targeted inventory, 2026-11-11)

- One `verification_requirements` row per worker and document type; the file lives in the private bucket
  (`metadata.storageKey`, `documentKey(profileId, uploadId, type)`) or, for legacy rows, on Vercel Blob (`documentUrl`).
- **Re-upload** (`POST /v1/worker/service-documents`, `POST /v1/worker/compliance-documents`): `recordDocument` overwrites
  the row and returns the `replaced` file; `worker.handlers.ts` deletes it after the commit (`deleteDocumentFiles`).
- **Worker delete** (`DELETE /v1/worker/{service,compliance}-documents/:id`): row and file deleted.
- **Service removed** (`PUT /v1/worker/services`): that service's rows and files deleted.
- Admin review (approve, reject, reset, expiry) in `apps/app/src/app/api/admin/compliance/[id]/[documentId]/*` overwrites
  review fields on the row. Admin views a current file through `GET /v1/admin/documents/:documentId/link`.

## Decisions (user, 2026-11-11)

| # | Question | Answer |
|---|---|---|
| D1 | Keep a document the worker deletes, or a removed service's documents? | Yes: replace, delete and service removal all keep the old version |
| D2 | Retention | 7 years, and an admin can delete a version; a separate page for it |
| D3 | Who sees old versions | Admins only |
| D4 | Record admin review actions too? | No: files only, each version carries the review state it had when superseded |

## Functional requirements

- **R1 Keep, don't delete.** A worker re-upload, a worker delete and a service removal no longer delete the file. Before
  the row is overwritten or deleted, in the same transaction, a version row is written.
- **R2 Version row** (new table, append-only for the worker paths): worker profile, requirement type and name, document
  category, the file (storage key or legacy URL, file name, type, size if known), uploaded at, status, reviewed at/by,
  approved/rejected at, rejection reason, expires at, why it was superseded (`REPLACED` | `DELETED_BY_WORKER` |
  `SERVICE_REMOVED`) and when. It survives the deletion of the requirement row.
- **R3 Admin history page** (a new admin page, per worker): every past version grouped by document type, newest first,
  current version shown for context; open a version with a five-minute link.
- **R4 Admin delete of a version**: removes the version row and its file, with a confirmation and an audit entry naming the
  admin. Irreversible.
- **R5 Retention**: a scheduled job deletes versions (row and file) superseded more than 7 years ago; dry-run reporting in logs.
- **R6 Workers see nothing new**: no worker endpoint lists versions; a worker's delete hides the document from the worker only.
- **R7 No backfill**: files already deleted cannot be recovered; history starts at the release.

## Non-functional

- Endpoints declared in `packages/api-contract` (admin access, rate limit, audit), one handler each (CLAUDE.md).
- File links signed for five minutes, never public; the file key never leaves the api.
- Security Baseline, Resiliency Baseline and PBT: to confirm for this cycle (carried values: all enabled).
- Privacy: a worker's delete no longer erases the file for 7 years; the privacy notice / worker wording may need a line (open).

## Open questions

- O1 Extensions for this cycle (carried: Security blocking, Resiliency, PBT full).
- O2 Privacy wording for workers (R6): add a line where the worker deletes a document?
