# Worker Services section -- targeted inventory (2026-10-15)

Scope (user, 2026-10-15): move the worker **Services** section's server actions and Next.js routes onto `apps/api`.
Read on `feat/edit-profile-app` `22d82b3`. Paths under `apps/app/src` unless stated. Service Area is already on the
api (`PUT /v1/worker/profile/service-area`) and is out of scope.

## Pages

| Route | What the worker does | Data calls today |
|---|---|---|
| `/dashboard/worker/services/manage` | add/remove categories, pick subcategories | `/api/worker/profile/[userId]`, `/api/categories`, `update-step` step 101, `deleteWorkerService` |
| `/services/setup?step=<svc>&view=registration` | Nursing: type, registration number, expiry | `get/saveNursingRegistration` |
| `...&view=qualifications` | tick qualifications, one upload each | `/api/worker/service-documents` GET, `uploadServiceDocument`, `deleteServiceDocument` |
| `...&view=offerings` | read-only subcategories; Therapeutic: registration number + expiry | `/api/worker/services`, `get/saveTherapeuticRegistration` |
| `...&view=documents` | per-service / per-subcategory documents | the same upload/delete actions |
| every finishing Next | -- | `update-step` step 100+N: **a no-op** (no case matches); ticked qualifications are never saved |
| `/services/[serviceName]/documents` | **orphan, nothing links to it** | `/api/worker/requirements`, `/api/upload/service-documents`, `DELETE /api/worker/service-documents` |

## Operations to move (live callers)

| Today | R/W | Tables / external |
|---|---|---|
| `update-step` step 101 (`app/api/worker/profile/update-step/route.ts:40`) | W | `worker_services` delete-all + recreate (keeps metadata), catalogue check, Redis, revalidateTag |
| `deleteWorkerService` (`services/worker/workerServices.service.ts:763`) | W | `worker_services` |
| `save/getNursingRegistration` (:326/:453), `save/getTherapeuticRegistration` (:554/:671) | W/R | `worker_services.metadata` |
| `uploadServiceDocument` (`services/worker/serviceDocuments.service.ts:220`) | W | Vercel Blob **public** `put`; `verification_requirements` upsert key `"<service>:<type>"`, `SERVICE_QUALIFICATION`; `setupProgress` |
| `deleteServiceDocument` (:111) | W | `verification_requirements` delete; blob left behind |
| `GET /api/worker/services`, `GET /api/worker/service-documents` | R | `worker_services`; `verification_requirements` |
| also used by Additional Documents (`Step2OtherDocuments`) | | the same upload/delete actions |

Dead: `toggleWorkerSubcategory`, `updateWorkerSubcategories`, `getServiceDocuments`, `useSubcategories` +
`/api/subcategories`, `Step2AdditionalTraining`, `ServiceDocumentsDialog`, `useOptimisticProfileUpdate`,
`documentsByService` in the profile route (reads `metadata.documentUrls`, never written).

## Already on the api

`GET /v1/worker/profile` returns `services[]` and `completion.services` (no registrations, no service documents);
the contract header plans "U3 services and documents". Reusable: `resolve-services.ts` (catalogue check),
`GET /v1/service-categories`, `worker/domain/service-requirements.ts` (port of `serviceDocumentRequirements.ts`),
`completion.ts`, the photo ticket/confirm pattern (private GCS + outbox).

## Findings (verified in code 2026-10-15)

| # | Sev | Finding | Where |
|---|---|---|---|
| S1 | High | Per-worker requirements response sent `Cache-Control: public, s-maxage=30`: a shared cache may serve one worker's list to another | `app/api/worker/requirements/route.ts:188` |
| S2 | Med | Service documents (certificates, registrations) stored as **public** Blob URLs; replaced/deleted files never removed | `serviceDocuments.service.ts:335`, `upload/service-documents/route.ts:79` |
| S3 | Med | `serviceTitle`/`requirementType`/`documentType` unchecked against the config: any caller creates arbitrary requirement rows and blob paths | `serviceDocuments.service.ts:304`, `upload/.../route.ts:76` |
| S4 | Med | Registration saves create a `worker_services` row for a service the worker never chose; number/expiry unvalidated | `workerServices.service.ts:401, :619` |
| S5 | Low | Orphan upload route: no rate limit, flips `verificationStatus` to `PENDING_REVIEW` on any upload; update-step unrated | `upload/.../route.ts:147` |
| S6 | Low | Removing a service orphans its documents and loses its registration | `update-step/route.ts:95`, `deleteWorkerService` |
| S7 | Low | Registration saves create rows without `revalidateTag`: the services list can be stale | `workerServices.service.ts` |
| S8 | Bug | Upload result read as `result.data.url`, the action returns `documentUrl`: the step's stored URL is undefined | `ServiceQualificationStep.tsx:338` vs `serviceDocuments.service.ts:410` |
| S9 | Bug | The step save is a no-op: ticked qualifications without an upload are lost | `setup/page.tsx:361`, `update-step/route.ts:41` |

No IDOR found in the deletes (both scoped to the caller's profile).

## Proposed units (to confirm)

- **U3a services** (api PR from `main`): `PUT /v1/worker/services` (categories + subcategories, catalogue-checked,
  replaces step 101 and `deleteWorkerService`); `PUT /v1/worker/services/{categoryId}/registration` (nursing,
  therapeutic; refuses a service not chosen); registrations in `getProfile`.
- **U3b service documents** (api PR from `main`): ticket / confirm / delete, keys checked against
  `service-requirements.ts`; the documents in `getProfile`; storage per the decision below.
- **U3c app** (stacked on `feat/edit-profile-app`): the Services pages on the api through `features/worker/`; retire the
  actions, routes, orphan page and dead code above.
- **S1** as a one-line app fix PR from `main` (independent).

## Decisions (user, 2026-10-15)

- **D1** service documents on private storage (the photo pattern: private bucket, signed links for the worker and
  admins); existing public files stay until a separate migration.
- **D2** removing a service keeps its documents and registration, hidden; they return if the service is added again.
- **D3** S1 fixed on its own: `fix/private-cache-worker-routes` `36e0d24` (also `other-requirements`, which returned
  document links); merged into PR #57.
- **D4** an uploaded file is the tick: no stored ticks (S9 closes by removing the no-op save).
