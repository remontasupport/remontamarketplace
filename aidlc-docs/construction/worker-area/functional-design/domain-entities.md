# Domain Entities -- unit `worker-area` (U1)

No new table or column in U1 (the home address and `storageKey` columns are U2's and U3's migrations; the read
declares their fields now and returns `null`). The entities are the read's body, the completion value, the
requirement item, and the services table.

## E1 `Profile` (the body of `GET /v1/worker/profile`)

| Field | Type | Source | Note |
|---|---|---|---|
| `id` | string | `worker_profiles.id` | the worker's own profile id (used by nothing in requests: R1.1) |
| `names` | `{ firstName, middleName: string \| null, lastName }` | columns | |
| `mobile` | string | column | |
| `photos` | `{ main: string \| null; additional: string[] }` | `photos`, `additionalPhotos` | today's format parsed (R2.6) |
| `bio` | string \| null | `introduction` | |
| `personalInfo` | `{ dateOfBirth: string \| null; age: number \| null; gender: string \| null; hasVehicle: 'Yes' \| 'No' \| null; languages: string[] }` | columns | today's values (follow-up 13 untouched) |
| `abn` | `{ type: 'abn'; value: string \| null; signed: boolean } \| null` | `abn` JSON | D17: `type` is always `abn` for new writes; a stored `tfn` is reported as `{ type: 'tfn', value: null, signed }` so the UI can show "contract on file" without the number |
| `homeAddress` | `{ streetLine; localityId; suburb; state; postcode } \| null` | U2 columns + locality | `null` in U1 |
| `serviceArea` | `{ localityId; label; travelRadiusKm; precision: 'LOCALITY' \| 'ADDRESS' } \| null` | HOME row + locality | `null` when unplaced |
| `displayRole` | string | services | R5.1 |
| `verificationStatus` | enum | column | |
| `isPublished` | boolean | column | |
| `completion` | `Completion` (E2) | computed | |
| `requirements` | `{ mandatory: RequirementItem[]; trainings: RequirementItem[] }` | catalogue + rows | E3, R4 |
| `services` | `{ categoryId; categoryName; subcategoryIds: string[]; subcategoryNames: string[] }[]` | `worker_services` | creation order |
| `sections.availability` | `{ day; startMinute; endMinute }[]` | `worker_availability` | sortOrder |
| `sections.experience` | `{ domain; isProfessional; isPersonal; specificAreas; otherAreas; description }[]` | `worker_experience` | |
| `sections.jobHistory` | `{ id; jobTitle; company; startMonth; startYear; endMonth; endYear; currentlyWorking }[]` | `worker_job_history` | sortOrder |
| `sections.education` | `{ id; institution; qualification; startMonth; startYear; endMonth; endYear; currentlyStudying }[]` | `worker_education` | sortOrder |
| `sections.additionalInfo` | `{ languages; culturalBackground; religion; interests; workPreferences; lgbtqiaSupport; nonSmoker; petFriendly; personality; uniqueService; funFact } \| null` | `worker_additional_info` | |
| `sections.bankAccount` | `MaskedBankAccount \| null` | `worker_additional_info.bankAccount` | R2.3 |
| `updatedAt` | string | column | the ETag is of the body, not of this |

Strict object (P10: no pass-through); every string bounded in the schema (names 100, bio 2,000, labels 120).

## E2 `Completion`

| Field | Type | Rule |
|---|---|---|
| `accountDetails`, `compliance`, `trainings`, `services` | boolean | R3.1-R3.7 |
| `profileCompleted` | boolean | R3.8 |
| `percent` | integer 0-100 | R3.10 |

Persisted subset: `setupProgress = { accountDetails, compliance, trainings, services }`, `profileCompleted` (R3.9).

## E3 `RequirementItem`

| Field | Type | Note |
|---|---|---|
| `id` | string | the catalogue `Document.id` (e.g. `police-check`) |
| `name` | string | `Document.name` |
| `requirementType` | string | the id (what the row's `requirementType` is or aliases to) |
| `documentType` | `'REQUIRED' \| 'OPTIONAL'` | from `CategoryDocument` (sub-category links are REQUIRED) |
| `status` | `'missing' \| 'submitted' \| 'approved' \| 'rejected' \| 'expired'` | R4.3 |

## E4 `ServiceRequirement` (the table, `domain/service-requirements.ts`)

`Record<ServiceKey, { bySubcategory?: Record<string, Spec>; default: Spec }>` with `Spec = { required: string[];
optional: string[] }`; the 11 rows of `completion-today.md`. One test asserts the table equals today's
`getServiceDocumentRequirements` for every known service and sub-category id (the function is copied into the test
as the oracle, then deleted from the app in PR 4).

## E5 `CompletionInput`

`{ profile: ProfileColumns; services: ServiceRow[]; requirements: RequirementRow[]; catalogue: CatalogueRows;
availabilityCount; experienceCount; jobHistoryCount; educationCount; additionalInfo: AdditionalInfoRow | null }`,
with `CatalogueRows = { categories: { id; name; documents: { document: Doc; documentType; conditionKey;
requiredIfTrue }[]; subcategories: { id; name; additionalDocuments: { document: Doc }[] }[] }[] }` and
`Doc = { id; name; category: string }`.

## Principal use

`Principal { userId, role, impersonatorId? }` unchanged; U1 adds no claim.
