# U4b the Compliance steps on the api -- design (2026-10-16)

Decisions in force: DC2 private storage, DC5 an expiry date already passed is refused (the api's "This document has
expired"; nothing saved). Builds on U4a (`feat/compliance-documents-api`, on main `813107d`, staging) and U3c's pattern
(`features/worker/services.ts`, `hooks/queries/useServiceDocuments.ts`). Branch `feat/compliance-app` stacked on
`feat/services-app` (app only; no api change).

## Shape: move the hooks, keep the shapes the steps read

The steps reach the server through four hooks and three direct calls. The hooks keep their names and the shapes the
steps already read, so most steps do not change.

| Piece | Today | U4b |
|---|---|---|
| `useComplianceDocuments(type)` / `useSingleComplianceDocument(_, type)` | GET `/api/worker/compliance-documents` (Next, Prisma) | a `select` on the profile read's `complianceDocuments` (one cache entry, `PROFILE_QUERY_KEY`): `{documents, metadata: {isCitizen}}` and `{document}` (rows with a file only, as the legacy "single" format) |
| `useIdentityDocuments` | GET `/api/worker/identity-documents` | the same select: the `identity-*` rows and `driver-license-vehicle`, with their category |
| `useUploadComplianceDocument` | `backgroundUploadQueue` -> POST `/api/compliance/upload` (public Blob) | the queue keeps the promise alive across navigation; its job is now ticket -> straight to the private bucket -> `POST /v1/worker/compliance-documents` (`uploadComplianceDocument` in `features/worker/compliance.ts`). A refusal (4xx) is not retried; the api's field message is shown (an expired date: "This document has expired") |
| `useDeleteComplianceDocument` | the `deleteComplianceDocument` action | `DELETE /v1/worker/compliance-documents/:id` |
| Proof of Identity (`Step1`) upload / delete | the action / DELETE `/api/worker/identity-documents` | the same upload function / the api delete |
| Right to Work citizenship | PATCH `/api/worker/compliance-documents` (C1-fixed) | `PUT /v1/worker/compliance/right-to-work/citizenship` |
| Code of Conduct (`Part2`) | the action with `metadata` | the upload function with `acknowledgement {workerName, signatureDate}` |
| `/api/documents/<id>/<name>` (app route) | a worker's link from `getServiceDocumentLink` (service rows only) | `getDocumentLink` (any own row); admins unchanged |

The setup page's step list (`/api/worker/requirements`) and the legacy profile (`useWorkerProfile`, the sidebar's
ticks, the Code of Conduct and contract documents read from it) stay; each change refreshes both the api profile and
the legacy one, as U3c.

**Trainings move with the hooks.** The training steps (NDIS modules, infection control, catalogue TRAINING documents)
use the same hooks, and U4a's allow-list takes their keys, so they upload to the api in U4b. U4c is left with a check
of each training step and the dead fallback steps.

## Retired in U4b

`/api/compliance/upload`, `/api/worker/compliance-documents` (GET + PATCH), `/api/worker/identity-documents`
(GET + DELETE), `lib/backgroundUploadQueue.ts`'s fetch, the `deleteComplianceDocument` action, the dead
`Step4PersonalInfo` (no importer). `uploadComplianceDocument` (the action) stays for the contract (U4d) and
`Step6OtherRequirements` (fallback only, U4c/U4f).

## Not in U4b

The contract and ABN (U4d), Additional Credentials (U4e), the dead routes and the legacy public files (U4f), the step
list on the api.

## Order

App only, but it needs the U4a api: production goes U4a promoted -> PR #57 -> this. The preview (staging api + bucket)
is where an upload runs end to end.

## Built (2026-10-16)

`feat/compliance-app` `a26ff55`, stacked on `feat/services-app` `e49438a` (pushed; the local servers run it). New
`features/worker/compliance.ts` (the shapes, the upload, the citizenship answer) on a shared `stageDocument` (the ticket
and the bucket, split out of U3c's upload, with `retryable`); the worker client gains the confirm/delete/citizenship
entries; the profile helpers (`reloadProfileInto`, `currentProfile`, `refreshLegacyProfile`) moved to
`features/worker/profile.ts` for both hook files. The vehicle licence in the account setup's "Other personal info"
(`Step4PersonalInfo`, live: first thought dead) moves too. App gate: 228 tests (7 new), baselines 123 -> 118 type,
434 -> 413 lint.

Local smoke on the dev copy (browser, a minted session for dev-copy workers; every row put back and compared by id):
the setup page and the police, identity, right-to-work, Code of Conduct and training steps render from
`GET /v1/worker/profile` with no console error; the right-to-work dropdown "Yes" -> `PUT .../citizenship` (api log) ->
the row `isCitizen: true`; "Remove document" on a police check -> `DELETE /v1/worker/compliance-documents/<id>` -> the
row gone; an upload -> three ticket attempts 503 (no bucket credentials here) -> "Upload Failed / We couldn't save your
document right now."; `/api/documents/<own police check>` 302 to its stored URL, unknown id 404; the three retired
routes 404. An upload end to end is for the preview (staging api + bucket).
