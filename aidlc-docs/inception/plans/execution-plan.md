# Execution plan: signup-abn-agreement

Requirements approved 2026-11-19. Extensions: Security Baseline (blocking), Resiliency Baseline, PBT full.

## Reuse (no second copy)

| Need | Existing piece |
|---|---|
| Anonymous PDF upload | the bucket's `createUploadTicket` to `staging/<uuid>` (photo ticket, `createDocumentTicket`) |
| Check + copy the PDF | `stageDocument` (size, magic bytes, copy to `documents/<profileId>/...`) |
| The agreement row | `recordComplianceDocument` with `contract-of-agreement` (as `signContract`) |
| Engagement + ABN | `writeSignedEngagement` / `writeAbn` (one write: `{type: 'abn', value, signed: true}`) |
| ABN rule | `abnBodySchema`'s pipe (`normaliseAbn`, 11 digits, `abnChecksum`) in the registration schema |
| Agreement UI + PDF | `ContractPage`'s preamble, `ContractViewer`, `SignaturePad`, the jsPDF builder: split into a shared form part and a PDF builder; the dashboard page and the sign-up step both use them |
| Notice modal | `components/ui/dialog.tsx` / `ConfirmDialog`; the text lives in the definition (`intro.notice`) |

## Units

### U1 `agreement-api` (packages/schemas, packages/api-contract, apps/api) -- one PR, staging, preview checklist, promote

- **Contract**: `createAgreementUploadTicket` (public, PDF only, size cap, 10/h per IP like the photo; nothing stored)
  in `registration.contract.ts`; the registration body gains `abn` and `agreementUploadId` (+ file name). **Optional
  in the schema while the old app is live** (an old app's sign-up must not break between promotion and the app
  merge); required by U2's form definition, and made required in the schema by a small follow-up PR after U2 is live.
- **registerWorker**: profile id chosen before the transaction so the PDF is staged into the worker's folder first;
  in the transaction the agreement row and the engagement; on any failure the copy is deleted (as `signContract`);
  an existing email (R1) deletes the staged PDF and answers the same 202. No ABN in logs.
- **Tests**: unit + database tests (with agreement: row + engagement; without: unchanged; existing email: no row, file
  gone; bad PDF / missing upload: field error, no account); PBT on the ABN rule shared by contract and form; contract checks.
- **Docs**: `docs/signup/` (flow, endpoint, tables).

### U2 `agreement-app` (packages/form-engine, apps/app) -- one PR, after U1 is promoted

- `intro.notice` in the form engine's definition type; `WizardIntro` shows the modal (Proceed / Cancel).
- Field kind `agreement` (rule in `form-engine/src/kinds.ts`, one component in `fields.tsx`, one `FieldSlot` case):
  the shared agreement part; at submit the PDF is built, uploaded by ticket, and the id sent (fresh per attempt;
  never in the draft).
- `ContractPage` moved onto the shared part (behaviour unchanged on the dashboard).
- Definition: the notice and a final step "Contractor Agreement".
- **Tests**: form accepts = contract accepts; the dashboard page unchanged; the draft keeps no signature.

### U3 `agreement-required` (packages/schemas) -- a small PR after U2 is live

- `abn` and `agreementUploadId` required in the registration schema (D3), staging, promote.

## Order and risk

U1 merge -> staging -> preview checklist (sign-up without agreement still works = old app; health; the CLAUDE.md list)
-> promote -> U2 merge (its preview: full sign-up with the agreement; the dashboard agreement shows the file; admin sees
it) -> U3. D6 holds: workers see the notice and the step only when U2 is live, and both arrive together.
