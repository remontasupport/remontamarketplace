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
    "Agreement signed"; a server refusal clears it; the Change button removed at the user's request 2026-11-19).
  - `workerRegistration.ts`: the notice and the fifth step "Contractor Agreement".
- Docs: `docs/signup/01-flow.md` (steps 0, 4, 5).

## Tests

- form-engine `test/agreement.test.ts`: kind rules, body, neverSaved, step of key, `defineForm` refusals, the upload
  (no confirm, retry, own message), 415 with fields -> invalid. All 76 earlier engine tests unchanged and passing.
- app `forms.test.ts`: the steps, the notice, the last step, "what the form accepts, the contract accepts" with an
  agreement; `contractPdf.test.ts`: the preamble checks and messages, the PDF and its safe name.

## Added on the same branch at the user's request (2026-11-19), in order

Sign-up:
- Notice title "Please Note:", fades in from above (`intro.notice.title`).
- "Send code" enables after a 500 ms pause on a valid email (`useEmailCode`), not only on blur.
- Services step: one service only (`max: 1`, form rule; server limit in U3); once one is ticked the others are dimmed
  and disabled; a "Please Note:" dialog lists what the service requires, from `GET /v1/service-requirements` (#166,
  api branch merged into this one), with a plain fallback when the list cannot load.
- The agreement step's "Change" button removed.
- (api, own PRs, on `main`) #166 the service-requirements entry; #167 the verified email holds 24 h for the sign-up.

Worker dashboard:
- "Support Worker" reads "Support Work" (and the High Intensity one) wherever workers see it (`lib/serviceLabel.ts`).
- Services You Offer (Account > Manage services): "ADD MORE SERVICES"; Edit and Remove inside each card, centred,
  evenly spaced; Remove confirms ("Remove this service? ... Clients searching for this service will no longer find
  you. You can add it back at any time."); each change saves on confirmation (no edit mode / Done).
- My Profile steps save on leaving (`stepForms.tsx`): Previous, Next, "Save & finish" on the last step, any link out
  (sidebar), "Review application"; no Save buttons on the steps (Service Area and the bank account keep theirs).
- Required before Next (`requiredBeforeNext` / `requiredMet`): Bio (About you + Fun fact 50+), Date of Birth, Gender,
  Languages, Preferred Hours, Vehicle Access, Cultural Background, Religion, Interests, Support & Activities,
  Preferences. The Bio page's Save checks both sections (`savePair`).
- Address optional (no asterisk; a blank never-saved step is not saved on leave; an entered address still needs a suburb).

Admin:
- A search by Type of support shows only the searched service under each name (`servicesShown`).
- Show profile (and client/public views): empty sections hidden except About Me and Basic Information; a column with
  nothing gives the grid one column; edit mode shows all; the worker's own preview unchanged.

## Open questions left with the user
- Multi-select "Type of support" in the admin search (needs an api change)?
- Should the worker's own Profile Preview also hide empty sections?
- About you: require 50 characters (the sidebar tick already wants 50)?
- Address: allow a street without a suburb (api change)?
- Next on a step already complete but edited again: it saves (the step saves on leave) -- confirm on the preview.
- Primary service: analysed (`inception/requirements/primary-service-analysis.md`), skipped by the user for now.

## Preview checklist for the U2 PR (staging api)
Sign-up end to end (notice; email code + wait > 10 min before Complete; one service + the requirements list; the
agreement with a wrong ABN refused, then signed); the new worker's dashboard agreement shows the PDF; admin compliance
shows it; Manage services (add / edit / remove + confirm); My Profile steps (save on Next, required steps, Address
optional, Personality "Save & finish"); admin search badges; admin Show profile empty sections; production unchanged.
