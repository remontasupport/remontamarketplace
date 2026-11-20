# Requirements: signup-abn-agreement (the ABN notice and the Contractor Agreement inside the worker sign-up)

Cycle opened 2026-11-19. **Approved 2026-11-19** (O1, O2 answered; R7 made explicit at the user's request). Brownfield; the area is the worker sign-up (`workerRegistration.ts`, `POST /v1/registrations/worker`)
and the dashboard's ABN agreement (`components/contracts/ContractPage.tsx`, `POST /v1/worker/contract`).

## Today (targeted inventory, 2026-11-19)

- **Sign-up** (`apps/app/src/features/forms/definitions/workerRegistration.ts`, form engine): intro "Welcome to Remonta"
  with **Continue** (`definition.intro`, `WizardIntro` in `FormWizard.tsx`), then four steps: location; details + email
  code + password; services; photo + consent. Submit = `submitWorkerRegistration` (public, CAPTCHA `worker_register`,
  5/h per IP). `registerWorker` (R1-R6) creates user, profile, services, HOME location, onboarding, photo claim, audit
  and outbox in one transaction; an existing email gets the same 202 and nothing changes (R1). The worker is not signed
  in afterwards (success page -> /login). No ABN anywhere in the sign-up.
- **Dashboard agreement** (`/dashboard/worker/contract/abn`, `ContractPage`): preamble (provider name, ABN, GST yes/no,
  address), the contract text (`config/contractContent.ts`, `ContractViewer`), signature pad, date, agree box. The
  browser builds the PDF (jsPDF + `lib/contractPdf.ts`), uploads it by ticket, then `signContract`: `stageDocument`
  copies it to `documents/<profileId>/<uploadId>.pdf`, `recordComplianceDocument` writes the `contract-of-agreement`
  row and `writeSignedEngagement` sets `worker_profiles.abn = {workerEngagementType: {type, signed: true}}` in one
  transaction. The page only checks the ABN is non-empty; the value is not sent (D17 of api-review), only the PDF holds it.
- **The ABN section** (`putAbn`, `abnBodySchema`): 11 digits + ATO checksum (`@remonta/schemas/validations/abn`), stored as
  `workerEngagementType.value`; `writeSignedEngagement` keeps a stored value.
- Building blocks to reuse: the anonymous upload ticket (`createUploadTicket` to `staging/<uuid>`, photo and documents),
  `stageDocument`, `recordComplianceDocument`, `writeSignedEngagement`/`writeAbn`, `abnChecksum`, the PDF builder.

## Decisions (user, 2026-11-19)

| # | Question | Answer |
|---|---|---|
| D1 | The notice | On the intro, **Continue** opens a modal: "Before you begin, please have your ABN handy. You’ll need it in the final step of the sign-up process." with **Proceed** (starts the form) and **Cancel** (closes the notice, stays on the intro) |
| D2 | The final step | The same ABN engagement agreement as the dashboard |
| D3 | Required? | Yes: no account without a signed agreement |
| D4 | Where it is signed | Inside the sign-up: the signed PDF and the ABN go with Submit; account and agreement are created together |
| D5 | ABN or TFN | ABN only (TFN stays on the dashboard) |
| D6 | Release | Notice and agreement ship together (the notice never points at a missing step) |

## Functional requirements

- **R1 Notice.** D1, declared in the form definition (data), not hand-built in the page. Proceed starts the form as
  Continue does today; Cancel or Escape or a click outside closes it. Wording exactly as D1.
- **R2 Final step "Contractor Agreement".** After photo + consent, a new last step shows the dashboard agreement's
  preamble (provider name prefilled from first + last name, editable; ABN; GST yes/no; address), the contract text, a
  signature, the date and the agree box, as on the dashboard. One shared component and one PDF builder for both places
  (no second copy of the contract or the PDF code).
- **R2a Name auto-fill** (user 2026-11-19: "apply the auto fill in for the name in the agreement"). The agreement's
  provider name starts as the worker's first + last name: in the sign-up from the details step, on the dashboard page
  from the profile (today it starts empty). Editable (a company or business name is allowed); the PDF's "Name:" line
  follows the field.
- **R3 ABN rule.** 11 digits and the ATO checksum, from the contract entry's schema (the form and the api agree), with
  the existing field error wording.
- **R4 Submit carries the agreement.** The browser builds the signed PDF and uploads it by an anonymous ticket (the
  photo's pattern) before Submit; the registration body carries the upload id and the ABN. Without them the api refuses
  with a field error on the last step.
- **R5 Atomic.** In `registerWorker`'s transaction: the contract file checked (PDF, size) and copied to the worker's
  folder, the `contract-of-agreement` compliance row, and `abn = {workerEngagementType: {type: 'abn', value, signed:
  true}}`. All or nothing (registration R3); a failed transaction leaves no copied file.
- **R6 Existing email (registration R1).** Same 202, no account change, the uploaded PDF discarded; nothing in the
  response differs.
- **R7 The file is on the dashboard's agreement** (user 2026-11-19: "save the file on the dashboard in the agreement as
  well"). The signed PDF is stored as the same `contract-of-agreement` row the dashboard signing writes (private bucket,
  `documentUrl` = the app's `/api/documents/<id>/<name>` path), so the dashboard's agreement section
  (`requirements/setup`, `contractDocumentFromDB`) shows it signed with the file to open, the ABN is on file, completion
  counts it, and the admin compliance page and Document History see it as today. No dashboard code change expected
  (to verify on the preview).
- **R8 Draft.** The on-device draft never keeps the signature or the PDF; the ABN, name, GST and address follow the
  existing draft rule (to confirm in Functional Design).
- **R9 Docs.** `docs/signup/` updated in the same PR (CLAUDE.md).

## Non-functional

- api path change: contract entries + handlers only; staging-preview checklist before the promotion (CLAUDE.md), plus a
  full sign-up with the agreement on the preview.
- Order: the api is promoted before the app's merge reaches production (the app step needs the new body fields;
  follow-up 32). An old app against the new api must keep working until then, or the fields are optional until the
  app is live (to settle in the plan).
- Security: the anonymous ticket is rate-limited like the photo's; the PDF is never public; the ABN is not logged.
- Extensions (user 2026-11-19): Security Baseline blocking, Resiliency Baseline, PBT full.

## Answered

- O1 Extensions: the three carried, unchanged.
- O2 Workers who signed up before the release: no change; they sign on the dashboard as today.
