# U2 `agreement-app`: construction notes

Branch `feat/signup-agreement-app` (from `main` `fcc503a`), 2026-11-19.

## What changed

- `@remonta/form-engine`:
  - `intro.notice` (text, proceed, cancel) on the definition type.
  - Field kind `agreement` (`ticketEntry`, `nameFrom`): required on the form ("Please sign the agreement") with the
    contract's rule for the value; `toBody` `{ agreement }`; `defineForm` checks the entry and the name fields.
  - The photo's direct-upload loop is one `stageDirect` (confirm optional); `stagePhoto` and the new `stageAgreement`
    use it. `UploadFieldError` (`PhotoFieldError` kept as its alias).
  - `submitToApi`: a 413/415 that names a field is a field error (the agreement's file), like a 400.
- `apps/app`:
  - `lib/contractPdf.ts`: `buildContractPdf`, `preambleProblem`, `formatContractDate` (moved from `ContractPage`); the
    file name is made safe for the api's rule (a "/" in a business name becomes "-").
  - `components/contracts/ContractAgreementForm.tsx`: the agreement (preamble, text, signature, date, agree box,
    button), presentational; `emptyPreamble`.
  - `ContractPage`: uses both; behaviour unchanged except R2a (the name starts as the profile's first + last name).
    The download is an object-URL link instead of jsPDF's `save` (same file, same name).
  - `FormWizardView` `WizardIntro`: the notice dialog. `useFormWizard`: `agreementUploaderFor`. `FormWizard`: the
    `agreement` case. `features/forms/AgreementSlot.tsx`: the step (sign -> ABN check -> PDF -> upload -> value;
    "Agreement signed" + Change; a server refusal clears it).
  - `workerRegistration.ts`: the notice and the fifth step "Contractor Agreement".
- Docs: `docs/signup/01-flow.md` (steps 0, 4, 5).

## Tests

- form-engine `test/agreement.test.ts`: kind rules, body, neverSaved, step of key, `defineForm` refusals, the upload
  (no confirm, retry, own message), 415 with fields -> invalid. All 76 earlier engine tests unchanged and passing.
- app `forms.test.ts`: the steps, the notice, the last step, "what the form accepts, the contract accepts" with an
  agreement; `contractPdf.test.ts`: the preamble checks and messages, the PDF and its safe name.
