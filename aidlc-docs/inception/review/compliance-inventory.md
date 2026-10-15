# Worker Compliance section -- targeted inventory (2026-10-15)

Scope (user, 2026-10-15): "move to the Compliance APIs". Read on `feat/services-app` `f0ad86a`. Paths under
`apps/app/src` unless stated.

## Pages

- **Compliance** (sidebar group): `/dashboard/worker/requirements/setup?step=<docId>` (mandatory: 100-point ID, ABN +
  contract, Code of Conduct 1/2, NDIS screening, police, WWC, right to work, others) and
  `/dashboard/worker/trainings/setup?step=` (NDIS orientation modules, infection control, ...). Steps from
  `/api/worker/requirements` (the catalogue by `Document.category`), the sidebar from the api's `requirements`.
- **Additional Credentials**: `/dashboard/worker/additional-documents` (insurance, transport: "Other Documents" through
  the service-document action).
- **Contract**: `/dashboard/worker/contract/[type]?taxId=` (signs, saves the ABN, uploads `contract-of-agreement`).

## Live operations

| Operation | Notes |
|---|---|
| `uploadComplianceDocument` (`services/worker/compliance.service.ts:285`) and POST `/api/compliance/upload` (via `lib/backgroundUploadQueue.ts`) | public Blob `put`; declared MIME only, 50 MB; any `documentType` string becomes a row; PRIMARY/SECONDARY/WORKING_RIGHTS by type; `verificationStatus=PENDING_REVIEW`; Redis; completion |
| `deleteComplianceDocument` (:704) | ownership checked; `del()` on whatever URL the row holds; no Redis bust |
| GET/PATCH `/api/worker/compliance-documents` | PATCH (right to work "I am a citizen"): any `documentType`, any metadata, no rate limit |
| GET/DELETE `/api/worker/identity-documents` | delete leaves the file |
| `updateWorkerABN` | -> the api's `putAbn` already exists |
| GET `/api/worker/requirements` | the step list; with no services it lists every category (the api: none) |

Dead: `saveComplianceDocumentRecord`, `identity-documents/copy-reference`, `/api/upload/{identity-documents,certificates,
other-requirements,vehicle-photo}`, `/api/worker/vehicle-photo`, `/api/blob/upload-token`,
`useWorkerRequirementsByService`, fallback-only steps (`Step4NDISTraining`, `Step4aNDISOrientation`,
`Step6OtherRequirements` via the static list).

## Findings (C1, C2, C3 verified in code 2026-10-15)

| # | Sev | Finding | Where |
|---|---|---|---|
| C1 | **High** (live) | **Self-certify any requirement.** PATCH `/api/worker/compliance-documents` `{documentType: "police-check", metadata: {isCitizen: true}}` creates a SUBMITTED row with no file; `complianceOf` counts it as present | `app/api/worker/compliance-documents/route.ts:129-187` |
| C2 | High | Identity, police, WWC, screening, contract and Code of Conduct files on **public** Blob URLs (paths carry the user id) | `compliance.service.ts:388, :421`; `compliance/upload/route.ts:154, :177` |
| C3 | Med | The ABN/TFN in the page URL (`?taxId=`): browser history, logs, Referer | `components/account-setup/steps/Step6ABN.tsx:71` |
| C4 | Med | Declared MIME only, no magic bytes; any type string becomes a row | `compliance.service.ts:350, :369`; `compliance/upload/route.ts:131, :143` |
| C5 | Med | Delete calls `del()` on the row's URL whatever it is (copy-reference shared URLs between rows) | `compliance.service.ts:767` |
| C6 | Low | Missing rate limits: PATCH compliance-documents, identity DELETE, other-requirements DELETE, `/api/upload/*` | |
| C7 | Low | Stale caches: identity delete leaves the file; no delete busts Redis | `identity-documents/route.ts:176`; `compliance.service.ts:788` |
| C8 | Bug? | Step5 always writes `infection-control`; a catalogue id `infection-control-training` would never match (check the catalogue) | `components/requirements-setup/steps/Step5InfectionControl.tsx:114` |
| C9 | Info | Dead routes still deployed (`blob/upload-token` takes the user id from the client payload) | |

No live IDOR (every live read/delete checks ownership).

## Already on the api

`GET /v1/worker/profile`: `requirements {mandatory, trainings}` per item, `completion.compliance/trainings`, all
requirement rows read (only SERVICE_QUALIFICATION exposed); `putAbn`. U3b's ticket/stage/record/link/delete machinery
generalises (today hard-wired to SERVICE_QUALIFICATION).

## Size

About 3,900 server lines to retire and 9,000 client lines to rewire (`components/requirements-setup/**` 5,907).

## Proposed units

| Unit | Scope |
|---|---|
| **C1 fix** | app only, from main: the PATCH accepts `right-to-work` only and a boolean `isCitizen`; rate limited |
| U4a api | compliance documents on the generalised document machinery: allowed keys (identity-* with category, the satisfier keys, catalogue ids), expiry, metadata, `verificationStatus`; `complianceDocuments[]` in the profile; the worker link for any own row; a citizenship PUT |
| U4b app | the mandatory steps on ticket/upload/confirm and the profile read |
| U4c app | trainings (NDIS modules; the infection-control key) |
| U4d | ABN + contract on `putAbn` and a contract confirm; the tax id out of the URL |
| U4e | Additional Credentials ("Other Documents") on the api |
| U4f | retire the dead routes; move the legacy public files (identity first) to the private bucket |

## Decisions (user, 2026-10-15)

- **DC1** C1 fixed now on its own: `fix/citizenship-patch` `edaffcc` (no use of the hole on the copy of production).
- **DC2** new compliance uploads go to the private bucket, viewed through the app link (as D1).
- **DC3** the existing public identity and police files move to the private bucket early, identity first (after U4a).
- **DC4** U4a (the compliance document api) next.
