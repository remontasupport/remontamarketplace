# The legacy routes behind the worker profile, one row each (2026-10-09, `main` `c51d430`)

Read from `apps/app/src/app/api/`; the per-route record behind `worker-profile-inventory.md` section 4. "Session"
means `getServerSession` + `session.user.id`, no role check, no validation library. All database access is the auth
database through `authPrisma` unless noted. "Not found" = no caller found by grep in `apps/app/src` and `apps/web`.

| Route | Methods | Lines | Auth | Tables (R = read, W = write) | External | Callers | Notes |
|---|---|---|---|---|---|---|---|
| `worker/profile/[userId]` | GET | 106 | session; 403 unless own id | R worker_profiles, worker_services, verification_requirements, Category/Document | Upstash `workerProfileBase`, `completionStatus` | `hooks/queries/useWorkerProfile.ts` (sidebar, home, requirements) | returns the legacy location columns; setupProgress recomputed |
| `worker/profile/update-step` | POST | 262 | session | step 7: W emergencyContact* (**columns do not exist: always 500**); 101: W worker_services (delete + create, tx); 102: RW verification_requirements (N+1) | Upstash invalidate, `revalidateTag` | `useUpdateProfileStep` (account/setup, additional-documents, requirements/setup, services/*) | every other step `default: break` saves nothing (300, 103+) |
| `worker/services` | GET | 70 | session | R worker_profiles, worker_services | `unstable_cache`; exports the tag update-step imports | `useServiceSubcategories.ts` | |
| `worker/requirements` | GET | 196 | session | R worker_services, Category/CategoryDocument/Subcategory/SubcategoryDocument/Document | Upstash (no params only) | `useWorkerRequirements.ts`, `Step2OtherDocuments.tsx` | **`Cache-Control: public, s-maxage=30`** on per-user data (`:188`) |
| `worker/other-requirements` | GET | 78 | session | R verification_requirements (`other-requirement`) | | `Step6OtherRequirements.tsx:130` | **`public, s-maxage=60`** (`:65`) |
| `worker/other-requirements/[id]` | DELETE | 90 | session; ownership via workerProfileId | W verification_requirements | Blob `del` | `Step6OtherRequirements.tsx:217` | the blob may be shared with a copied row |
| `worker/identity-documents` | GET, DELETE | 194 | session | R/W verification_requirements (`identity-*`, `driver-license-vehicle`) | blob delete is a TODO | `useIdentityDocuments.ts`, `Step1ProofOfIdentity.tsx`, `complianceDocumentMapping.ts` | GET swallows db errors as an empty list |
| `worker/identity-documents/copy-reference` | POST | 110 | session | RW verification_requirements | | not found | any target type can be marked SUBMITTED |
| `worker/compliance-documents` | GET, PATCH | 210 | session | RW verification_requirements; PATCH stores arbitrary `metadata` JSON | | `useComplianceDocuments.ts`, 6 step components, `dynamicComplianceSteps.ts`, `dynamicTrainingSteps.ts` | PATCH sets SUBMITTED on `metadata.isCitizen` |
| `worker/service-documents` | GET, DELETE | 118 | session | R/W verification_requirements (`SERVICE_QUALIFICATION`) | no blob delete | `useServiceDocuments.ts`, `services/[serviceName]/documents` | |
| `worker/vehicle-photo` | GET, DELETE | 92 | session | R/W verification_requirements (`vehicle-drivers-license`) | | not found | returns `error.message` in production |
| `worker/jobs` | GET | 75 | session + WORKER | R jobs (active) | | not found (the dashboard reads Prisma directly) | no row limit |
| `worker/jobs/apply` | POST, PATCH | 112 | session + WORKER | R jobs; W job_applications (upsert / WITHDRAWN) | | `ApplyModal.tsx:42`, `WithdrawButton.tsx:16` | `workerId` holds the user id |
| `upload/worker-photo` | POST | 79 | **none** | none | Blob `put` (`lib/blobStorage.ts`) | `Step2Photo`, `PhotoUpload`, `AdditionalPhotosModal`, `profile-preview`, admin `AdminPhotoPickerModal` | no rate limit |
| `upload/vehicle-photo` | POST | 99 | session | RW verification_requirements | Blob `put` before the profile check | not found | no type or size check |
| `upload/certificates` | POST | 139 | session | RW verification_requirements | Blob `put` | not found | `qualificationType` arbitrary, used in the blob path |
| `upload/identity-documents` | POST | 188 | session | RW verification_requirements; W worker_profiles.verificationStatus | Blob `put` | not found | |
| `upload/other-requirements` | POST | 139 | session | W verification_requirements (a new row each time) | Blob `put` | not found | |
| `upload/service-documents` | POST | 171 | session | RW verification_requirements; W worker_profiles.verificationStatus | Blob `put` | `services/[serviceName]/documents:134` | |
| `blob/upload-token` | POST | 288 | session for tokens; the completion callback relies on the signed payload | RW verification_requirements (tx); W verificationStatus (fire-and-forget) | Blob `handleUpload`, Upstash | not found (no `@vercel/blob/client` import) | client-chosen `documentType` overwrites any row |
| `compliance/upload` | POST | 290 | session; 20/min per user (Upstash) | RW verification_requirements; W setupProgress/profileCompleted via autoUpdate* | Blob `put` (streamed), Upstash | `lib/backgroundUploadQueue.ts:105` | raw db message in the error text |
| `contractors` | GET | 458 | **none**; 100/min per IP | R ContractorProfile (the main client) | Google Geocoding | `components/SearchSupport.tsx` | **email and phone public**; `limit=all`; distance after pagination |
| `contractors/[id]` | GET | 32 | **none** | R ContractorProfile (full row) | | none in apps/app (apps/web has its own) | |
| `categories` | GET | 88 | none | R Category, CategoryDocument, Document, Subcategory, SubcategoryDocument | Upstash 30 min | worker `useCategories`; client and coordinator request-service pages | shared |
| `categories/therapeutic-supports/subcategories` | GET | 38 | none | R Subcategory | | admin dashboard only | |
| `subcategories` | GET | 64 | none | R Category, Subcategory | | `useServiceSubcategories.ts` | |
| `suburbs` | GET | 14 | none | R au_localities (`$queryRaw`, parameterised) | Google fallback when the table is missing | worker `Step5Address`; client, coordinator, admin pickers; `apps/web` via its proxy | shared |
| `geocode` | GET | 68 | none, no limit | none | Nominatim | `NewsSlider.tsx:134` | apps/web has its own copy |
| `share/generate` | POST | 49 | ADMIN | none | AES-GCM with a hard-coded fallback key | admin profile page | |
| `share/profile` | GET | 53 | share token | R worker_profiles, worker_additional_info, verification_requirements, worker_services, job history, education, experience, availability | | the public share page | |
| `sms/send-verification` | POST | 137 | **none, no limit** | none; in-memory Map | Twilio | `usePhoneVerification.ts`, `phoneVerificationUtils.ts` | `Math.random` codes; `devCode` leaks on trial errors |
| `sms/verify-code` | POST | 61 | none | none; **its own** in-memory Map | | `phoneVerificationUtils.ts` | cannot find the sent code; unlimited guesses |
| `coordinator/profile` | GET, PATCH | 66 | COORDINATOR | RW coordinator_profiles | | `AccountSettingsPanel.tsx` | not worker-related |

Totals: `worker/**` 1,713 lines; `upload/**` 815; the rest 1,706 (66 of them `coordinator/profile`); **4,234**.

**The two Prisma clients.** `authPrisma` (`lib/auth-prisma.ts`) is generated from `packages/db/prisma/schema.prisma`
(`AUTH_DATABASE_URL`, the auth database, 33 models). `prisma` (`lib/prisma.ts`) is generated from
`apps/app/prisma/schema.prisma` (3 models: `ContractorProfile`, `ContractorsbyArea`, `Job`) but connects to
`ACCELERATE_DATABASE_URL || AUTH_DATABASE_URL || DATABASE_URL` (`prisma.ts:19`), so without Accelerate it points at the
auth database too. No route in scope uses both.

**Columns of `worker_profiles` written by routes**: `verificationStatus` (four upload routes), `setupProgress` and
`profileCompleted` (through the autoUpdate* functions). **The legacy location columns are written by no route**;
their writer is the server action `services/worker/profile.service.ts:535-563` (`updateWorkerAddress`: Google
geocode, then `location, city, state, postalCode, latitude, longitude`).
