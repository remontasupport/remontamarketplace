# U1 `agreement-api`: functional design

Branch `feat/signup-agreement-api` from `main`. Packages: `@remonta/schemas`, `@remonta/api-contract`, `apps/api`.

## 1. Contract (`registration.contract.ts`, `workerRegistrationSchema.ts`)

- **New entry `createAgreementUploadTicket`** `POST /v1/registrations/worker/agreement-tickets`: body
  `{contentType: 'application/pdf', sizeBytes: 1..AGREEMENT_MAX_BYTES}` (5 MB; the generated PDF with a signature
  image is well under 1 MB), response `{uploadId, upload{url, method, fields, fileField}, expiresAt}` (the photo
  ticket's shape). Public, `bot: 'none'`, 10/h per IP, 300/h global, 1 KB body, nothing stored (the photo's rule).
  `public-endpoints.json` line.
- **Registration body** gains `agreement` (strict object, **optional in U1**, required in U3):
  `{uploadId: uuid, fileName: ≤200, abn}`; `abn` = the ABN section's rule (`normaliseAbn`, 11 digits, `abnChecksum`,
  same messages), moved into `@remonta/schemas` once and imported by `worker.sections.ts` too (no second copy).
- `maxBodyKb` 16 unchanged (the body grows by < 300 bytes).

## 2. The ticket (`apps/api/src/modules/registration/application/`)

`createPhotoTicket` and the worker module's `createDocumentTicket` are the same function with a different cap and
response key. One `issueUploadTicket(bucket, contentType, maxBytes, now, log, unavailableMessage)` in
`registration/application/upload-ticket.ts`; the photo, document and agreement tickets call it (removes the existing
repetition rather than adding a third copy). Behaviour of the two existing entries unchanged (their tests stay).

## 3. registerWorker with an agreement (R4-R6)

Order (new steps **bold**):

1. Email-code check, breach check, services, hash (unchanged).
2. Existing email -> **if `agreement`, delete `staging/<uploadId>` (best effort)** -> same 202 (R1, R6 of the cycle).
3. **If `agreement`: choose the profile id now (`randomUUID()`; ids are "cuid or uuid shaped" everywhere they are read)
   and `stageDocument(bucket, uploadId, profileId)`**: nothing there -> 400 `{agreement: ['Please sign the agreement
   again']}`; not a PDF -> the copy is refused and the staging object deleted -> 415 field error. Copied to
   `documents/<profileId>/<uploadId>.pdf`.
4. Transaction (unchanged steps, plus): the profile created with that id; **`recordComplianceDocument` with
   `contract-of-agreement`** (the target built from the spec table, no user lookup); **the engagement
   `{type: 'abn', value: <abn>, signed: true}`** (`writeSignedEngagement` gains the optional value: one write);
   **completion recomputed in the transaction** (`readProfileRowsTx` + `persistCompletion`, as `replaceSection`), so
   the dashboard is right at first sign-in.
5. **Any failure after 3 deletes the copied file** (as `signContract`). An `EmailTaken` race -> delete the copy -> R1.

Without `agreement` (old app, until U3): exactly today's behaviour. The audit row's metadata gains `agreement: true|false`
(no ABN). The ABN is never logged (the logger's redaction list gains `abn`).

## 4. What the worker and the admin then see (R7)

The row is the one `signContract` writes (`SUBMITTED`, `documentUrl` `/api/documents/<id>/<name>.pdf`, metadata
`storageKey`, `fileName`, `uploadId`), and `abn.workerEngagementType.signed = true`: the dashboard's agreement section,
the admin compliance page, completion and Document History read it unchanged.

## 5. Tests

- Unit: the schema (agreement optional; ABN rule shared with `abnBodySchema`, PBT: generated valid ABNs pass, any
  single-digit change fails); the ticket (PDF only, size bound).
- Database (CI): with agreement -> row, engagement, completion, file in the worker's folder; without -> unchanged;
  existing email -> no row, staging gone; missing upload / not a PDF -> field error, no account, no copied file; a
  transaction failure -> copy deleted.
- Contract checks; `public-endpoints.json`; `openapi.json` regenerated.

## 6. Security / resiliency

- Anonymous upload bounded (rate limits, PDF magic bytes, 5 MB, 10-minute ticket, staging lifecycle 1 day).
- The PDF is never public; the ABN in the body only, never in logs or the audit.
- Bucket unavailable -> 503 with `Retry-After` (the form engine retries).

## Open

- None blocking. The cap (5 MB) to confirm against a real generated PDF in U2.
