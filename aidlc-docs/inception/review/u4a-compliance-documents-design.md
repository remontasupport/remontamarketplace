# U4a compliance documents on the api -- design (2026-10-15)

Decisions: DC2 private storage (as D1); DC3 the legacy public files move early, identity first (a later unit); DC4.
Builds on U3b (the ticket, the staging check and copy, the app document route).

## What may be uploaded (the allow-list; C4: any string was accepted)

- The legacy table (`compliance.service.ts` DOCUMENT_CONFIGS) ported: the identity documents with their category
  (passport, birth certificate: PRIMARY; driver's licence, Medicare, utility bill, bank statement: SECONDARY; working
  rights: WORKING_RIGHTS; driver-license-vehicle: SECONDARY, optional), police check, WWC, the two screening keys, the
  four NDIS modules, infection control, the contract of agreement, the Code of Conduct.
- Any catalogue `Document` of category COMPLIANCE or TRAINING, and `right-to-work` (the generic step uploads under the
  catalogue id; its name is the catalogue's).
- Not here: INSURANCE / TRANSPORT (Additional Credentials, U4e), the service categories (U3b), `other-requirement`
  (multi-row, reachable only from a fallback list).

## Entries

| Entry | Rules |
|---|---|
| ticket | the existing `POST /v1/worker/service-documents/tickets` serves any worker document (same rules) |
| `POST /v1/worker/compliance-documents` `{uploadId, requirementType, fileName, expiryDate?, acknowledgement?}` | the type allowed (400); the file staged and checked as U3b (413/415), copied to `documents/<profileId>/`; one row per type (found, updated or created): `requirementType` = the key, `documentCategory` from the table, the name, `isRequired` on create, `status SUBMITTED`, `submittedAt`, review fields cleared, `expiresAt` (a real date, today or later; required for right-to-work), metadata `{storageKey, fileName, contentType, sizeBytes, uploadId}` plus, for the Code of Conduct, `{workerName, signatureDate, acknowledgedAt}`; `verificationStatus PENDING_REVIEW` as today; completion recomputed; the replaced file deleted after the commit |
| `DELETE /v1/worker/compliance-documents/:documentId` | the caller's row of an allowed type (404 otherwise); the file after the commit: its own bucket key, or a legacy Blob URL in the worker's own folder (`<legacy folder>/<userId>/`) |
| `PUT /v1/worker/compliance/right-to-work/citizenship` `{isCitizen}` | the C1-fixed rule, on the api: a citizen is SUBMITTED; a "no" leaves an uploaded document alone and takes back a fileless claim |
| `GET /v1/worker/documents/:documentId/link` | any own row: a 5-minute signed link, or a legacy row's public URL (the app document route moves to it in U4b) |
| `GET /v1/worker/profile` | gains `complianceDocuments[]`: every row that is not SERVICE_QUALIFICATION, `{id, requirementType, name, status, documentCategory, url, fileName, uploadedAt, expiresAt, isCitizen}` |

## Built (2026-10-15)

`feat/compliance-documents-api` `d087e6e` from main `9381b61`. Gates: contract 88, api 672 (+195 database/bucket-gated,
CI). Tests: the allow-list and categories, the legacy-folder rule, the view; the HTTP flow on PostGIS (police check +
PENDING_REVIEW + private key, identity categories, right-to-work expiry, the Code of Conduct acknowledgement, a
catalogue training, a made-up type 400, the replace, the link, another worker 404, citizenship yes/no, delete, a service
document refused). Merged into `feat/services-app` (`8f754b2`; all gates green there: contract 93, api 751, app 221).
Local smoke on the dev copy through the api: the read's `complianceDocuments`, a legacy row's link, another worker's
link/delete 404, a type not asked for 400, right to work without expiry 400, an insurance 400 (U4e), citizenship yes 200
and a string 400; the rows put back. A confirm with nothing uploaded answers 503 here (no bucket credentials), 409 on
staging. The catalogue's `infection-control` matches the step's key: C8 is not a bug.
