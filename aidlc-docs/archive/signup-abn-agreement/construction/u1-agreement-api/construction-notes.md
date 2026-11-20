# U1 `agreement-api`: construction notes

Branch `feat/signup-agreement-api` (from `main` `1f8d27f`), 2026-11-19.

## What changed

- `@remonta/schemas` `workerRegistrationSchema.ts`: `abnNumberSchema` and `documentFileNameSchema` (moved from
  `worker.sections.ts`, which now imports them: one ABN rule, one file-name rule), `AGREEMENT_MAX_BYTES` (5 MB),
  `signupAgreementSchema` `{uploadId, fileName, abn}`, and `agreement` **optional** on the sign-up body.
- `@remonta/api-contract`: entry `createAgreementUploadTicket` `POST /v1/registrations/worker/agreement-tickets`
  (public, 10/h IP, 300/h global, 1 KB); `public-endpoints.json`; `openapi.json` regenerated.
- `apps/api`:
  - `registration/application/upload-ticket.ts` `issueUploadTicket`: the photo, worker-document and agreement tickets
    share it (two existing copies removed).
  - `stageDocument` takes per-caller rules (`StageRules`: cap, accepted types, field, messages); worker documents
    unchanged (`WORKER_DOCUMENT_RULES`).
  - `writeSignedEngagement(tx, id, type, abn?)`: stores the given ABN (ATO check re-run).
  - `registration/application/agreement.ts`: ticket, `stageAgreement` (PDF only, `agreement` field), `recordAgreement`
    (`recordComplianceDocument` `contract-of-agreement` + engagement), `discardAgreement`.
  - `registerWorker`: R7 (existing email discards; profile id = uuid chosen before the transaction; copy before; row +
    engagement inside; copy deleted on any failure); audit metadata `agreement: true|false`.
- Docs: `docs/signup/01-flow.md` (R7), `02-api-reference.md` (4.6c, `agreement`, errors), `03-data-model.md`.

## Deviation from the functional design

- **Completion is not recomputed in the sign-up transaction.** The profile read computes completion live, and the
  completion-sync job (every 5 minutes, watermark on `verification_requirements`) persists the flags for the new row;
  recomputing at sign-up could also queue a `WorkerAccountDetailsChanged` (Zoho) the sign-up never sent before.
- `recordComplianceDocument` sets `verificationStatus = PENDING_REVIEW` (as the dashboard signing): a worker who signs
  at sign-up enters the admin review queue at once. Same behaviour as signing on the dashboard; noted for the user.

## Tests

- schemas: agreement optional/valid/invalid; PBT "the agreement ABN rule and the dashboard ABN rule are one rule".
- api unit (`agreement-units.test.ts`): ticket (PDF, 5 MB, 10 min, 503 on `agreement`), staging (PDF copied, image
  refused and deleted, missing upload), discard.
- api database (`agreement.int.test.ts`, CI only: Docker is down here): row + engagement + file + audit (no ABN);
  without agreement unchanged; existing email; missing upload; not a PDF; failure in the transaction deletes the copy;
  invalid ABN refused by the contract.
