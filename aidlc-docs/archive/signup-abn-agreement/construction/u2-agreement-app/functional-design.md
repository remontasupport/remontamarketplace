# U2 `agreement-app`: functional design

Branch `feat/signup-agreement-app` from `main` (after U1's promotion, done 2026-11-19). Packages: `@remonta/form-engine`,
`apps/app`. No api change.

## 1. The notice (R1)

- Engine type: `intro.notice?: { text: string; proceed: string; cancel: string }` (data in the definition).
- `WizardIntro` (presentational): with a notice, **Continue** opens a dialog (`components/ui/dialog.tsx`) with the text
  and two buttons; **Proceed** = today's start; **Cancel**, Escape or a click outside closes it, the intro stays.
- Definition: `notice: { text: "Before you begin, please have your ABN handy. You’ll need it in the final step of the
  sign-up process.", proceed: "Proceed", cancel: "Cancel" }`.

## 2. The shared agreement (R2, R2a; no second copy)

Today `ContractPage.tsx` holds the preamble state, the PDF builder and the submit together. Split:

| Piece | Where | Used by |
|---|---|---|
| `buildContractPdf(type, preamble, signature, signatureDate)` -> `{ file, fileName }` | `lib/contractPdf.ts` (beside the table helpers it already uses) | dashboard page, sign-up step |
| `ContractAgreementForm` (presentational: preamble fields, `ContractViewer`, `SignaturePad`, date, agree box, error, the button) | `components/contracts/` | dashboard page, sign-up step |
| `validatePreamble` (today's checks and messages, in one place) | with the form | both |

- `ContractPage` keeps its own submit (`signContract`, download, BroadcastChannel, success screen): **behaviour unchanged**,
  except R2a: the name starts as the profile's first + last name (`useWorkerProfile`, only while the field is still empty).
- Sign-up: the name starts as the details step's first + last name (read when the step opens; editable).

## 3. The `agreement` field kind (engine + app)

- Engine `FieldDef`: `{ kind: "agreement"; ticketEntry: string; nameFrom: [first: string, last: string] }`.
- Rules (`kinds.ts`): default `null`; schema = the contract's `agreement` rule, **required in the form**
  ("Please sign the agreement") although the contract keeps it optional until U3; `toBody` = `{ agreement: value }`;
  `neverSaved` in the definition (no signature, upload id or ABN in the on-device draft).
- Upload: the photo's direct-upload loop (ticket -> the file straight to storage, same-ticket retries, one fresh
  ticket, the engine's Retry-After/offline retry) becomes one engine function used by both, with the photo's confirm
  step optional; the agreement has no confirm (the submit checks it). Messages per kind.
- `defineForm` checks `ticketEntry` and the `nameFrom` fields exist.
- App `AgreementSlot`: renders `ContractAgreementForm` (type `abn`). **Sign & Accept Agreement** validates the preamble
  and the ABN with the contract's rule (11 digits + ATO check, R3) **before** any upload, builds the PDF, uploads it,
  and sets the value `{ uploadId, fileName, abn }`. Then the step shows "Agreement signed" with **Change** (clears the
  value to sign again). **Complete Signup** sends it. A server refusal on `agreement` ("Please sign the agreement
  again") lands on this step, value cleared.
- The PDF is not downloaded at sign-up (the worker can open it on the dashboard's agreement afterwards, R7).

## 4. The definition

`workerRegistration.ts`: the notice, then the current four steps unchanged, then a fifth step
`{ title: "Contractor Agreement", fields: [{ name: "agreement", kind: "agreement", ticketEntry:
"createAgreementUploadTicket", nameFrom: ["firstName", "lastName"], neverSaved: true }] }`. The draft id stays
`worker-registration` (a step added at the end; an old draft resumes where it was).

## 5. Tests

- Engine: the kind's rules (required, toBody, neverSaved), the shared upload loop for both kinds (the photo tests keep
  passing), `defineForm` refusals.
- App: "what the form accepts, the contract accepts" with an agreement; the definition has the notice and the last step;
  `buildContractPdf` output (file name, ABN/GST lines) unchanged for the dashboard.

## 6. Preview checklist (U2's PR)

Notice (Proceed, Cancel); full sign-up with an agreement on staging; the new worker's dashboard agreement section shows
the signed PDF and the ABN; the admin compliance page shows it; a wrong ABN refused on the device; the dashboard's own
agreement page still signs (name prefilled); production unchanged.

## Decision to confirm

- D7 Where the PDF is built and uploaded: at **Sign & Accept Agreement** on the last step (recommended: the worker sees
  it signed before Complete Signup, and a failure is shown on the step), not silently at Complete Signup.
