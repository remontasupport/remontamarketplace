# Component methods -- the worker profile on `apps/api`

Signatures and types only; the rules behind them are Functional Design's (per unit). Types named here are Zod
inferences from `worker.contract.ts` unless marked.

## C1/C2 Contract

```ts
// worker.contract.ts (packages/api-contract)
export const workerContract = defineContract('worker', {
  getProfile:        { method: 'GET',    path: '/v1/worker/profile',                     responses: { 200: profileSchema },         meta: workerRead() },
  putName:           { method: 'PUT',    path: '/v1/worker/profile/name',                body: json(nameSchema),        responses: { 200: nameSchema },         meta: workerWrite('WORKER_NAME_CHANGED') },
  putBio:            { method: 'PUT',    path: '/v1/worker/profile/bio',                 body: json(bioSchema),         responses: { 200: bioSchema },          meta: workerWrite('WORKER_BIO_CHANGED') },
  putHomeAddress:    { method: 'PUT',    path: '/v1/worker/profile/home-address',        body: json(homeAddressInput),  responses: { 200: homeAddressSchema },  meta: workerWrite('WORKER_HOME_ADDRESS_CHANGED') },
  putServiceArea:    { method: 'PUT',    path: '/v1/worker/profile/service-area',        body: json(serviceAreaInput),  responses: { 200: serviceAreaSchema },  meta: workerWrite('WORKER_SERVICE_AREA_CHANGED') },
  putPersonalInfo:   { method: 'PUT',    path: '/v1/worker/profile/personal-info',       body: json(personalInfoSchema),responses: { 200: personalInfoSchema }, meta: workerWrite('WORKER_PERSONAL_INFO_CHANGED') },
  putAbn:            { method: 'PUT',    path: '/v1/worker/profile/abn',                 body: json(abnSchema),         responses: { 200: abnSchema },          meta: workerWrite('WORKER_ABN_CHANGED') },
  confirmPhoto:      { method: 'POST',   path: '/v1/worker/photos',                      body: json({ uploadId }),      responses: { 201: photosSchema },       meta: workerWrite('WORKER_PHOTO_ADDED') },
  makeMainPhoto:     { method: 'POST',   path: '/v1/worker/photos/{id}/main', pathParams: { id },                      responses: { 200: photosSchema },       meta: workerWrite('WORKER_PHOTO_MAIN') },
  removePhoto:       { method: 'DELETE', path: '/v1/worker/photos/{id}',      pathParams: { id },                      responses: { 200: photosSchema },       meta: workerWrite('WORKER_PHOTO_REMOVED') },
  putAvailability:   { method: 'PUT',    path: '/v1/worker/availability',                body: json(availabilitySchema),responses: { 200: availabilitySchema }, meta: workerWrite('WORKER_AVAILABILITY_CHANGED') },
  putExperience:     { method: 'PUT',    path: '/v1/worker/experience',                  body: json(experienceSchema),  responses: { 200: experienceSchema },   meta: workerWrite('WORKER_EXPERIENCE_CHANGED') },
  putJobHistory:     { method: 'PUT',    path: '/v1/worker/job-history',                 body: json(jobHistorySchema),  responses: { 200: jobHistorySchema },   meta: workerWrite('WORKER_JOB_HISTORY_CHANGED') },
  putEducation:      { method: 'PUT',    path: '/v1/worker/education',                   body: json(educationSchema),   responses: { 200: educationSchema },    meta: workerWrite('WORKER_EDUCATION_CHANGED') },
  putBankAccount:    { method: 'PUT',    path: '/v1/worker/bank-account',                body: json(bankAccountSchema), responses: { 200: maskedBankAccountSchema }, meta: workerWrite('WORKER_BANK_ACCOUNT_CHANGED') },
  putAdditionalInfo: { method: 'PUT',    path: '/v1/worker/additional-info/{group}', pathParams: { group: additionalInfoGroup }, body: json(additionalInfoBody), responses: { 200: additionalInfoBody }, meta: workerWrite('WORKER_ADDITIONAL_INFO_CHANGED') },
  // U3
  putServices:       { method: 'PUT',    path: '/v1/worker/services',                    body: json(servicesSchema),    responses: { 200: servicesSchema },     meta: workerWrite('WORKER_SERVICES_CHANGED') },
  listRequirements:  { method: 'GET',    path: '/v1/worker/requirements',                                               responses: { 200: requirementsSchema }, meta: workerRead() },
  listDocuments:     { method: 'GET',    path: '/v1/worker/documents',                                                  responses: { 200: documentsSchema },    meta: workerRead() },
  putDocument:       { method: 'PUT',    path: '/v1/worker/documents/{requirementType}', pathParams: { requirementType }, body: json(documentInput), responses: { 200: documentSchema }, meta: workerWrite('WORKER_DOCUMENT_SUBMITTED') },
  deleteDocument:    { method: 'DELETE', path: '/v1/worker/documents/{id}',   pathParams: { id },                      responses: { 204: z.undefined() },      meta: workerWrite('WORKER_DOCUMENT_DELETED') },
  getDocumentLink:   { method: 'GET',    path: '/v1/worker/documents/{id}/link', pathParams: { id },                   responses: { 200: signedLinkSchema },   meta: workerRead({ privateCacheSeconds: undefined }) },
  createUploadTicket:{ method: 'POST',   path: '/v1/worker/uploads/tickets',             body: json(ticketRequest),     responses: { 201: ticketResponse },     meta: workerWrite('WORKER_UPLOAD_TICKET', { limit: 10 }) },
  confirmUpload:     { method: 'POST',   path: '/v1/worker/uploads/confirmations',       body: json(confirmRequest),    responses: { 200: confirmResponse },    meta: workerWrite('WORKER_UPLOAD_CONFIRMED') },
  // U4
  listJobs:          { method: 'GET',    path: '/v1/worker/jobs', query: jobsQuery,                                     responses: { 200: jobsPage },           meta: workerRead() },
  listApplications:  { method: 'GET',    path: '/v1/worker/job-applications',                                           responses: { 200: applicationsSchema }, meta: workerRead() },
  applyToJob:        { method: 'POST',   path: '/v1/worker/job-applications',            body: json({ jobId }),         responses: { 201: applicationSchema },  meta: workerWrite('WORKER_JOB_APPLIED') },
  withdrawApplication:{ method: 'POST',  path: '/v1/worker/job-applications/{id}/withdraw', pathParams: { id },         responses: { 200: applicationSchema },  meta: workerWrite('WORKER_JOB_WITHDRAWN') },
})

// helpers (worker.contract.ts): every entry declares access and limits through these, so none can be forgotten
function workerRead(opts?): Meta   // access WORKER; bot none; rateLimit user 120/min + ip 300/min; maxBodyKb 1; privateCacheSeconds 60
function workerWrite(audit: string, opts?: { limit?: number; maxBodyKb?: number }): Meta  // access WORKER; rateLimit user 60/min (+ per-entry); maxBodyKb 16; audit

// admin.contract.ts (U3)
getDocumentLink: { method: 'GET', path: '/v1/admin/documents/{id}/link', pathParams: { id }, responses: { 200: signedLinkSchema }, meta: adminRead({ audit: 'ADMIN_DOCUMENT_OPENED' }) }
```

Key types (Zod in C2): `Profile` = `{ id, names, photos: { main: string | null; additional: PhotoRef[] }, bio,
personalInfo, abn, homeAddress: HomeAddress | null, serviceArea: ServiceArea | null, completion: Completion,
verificationStatus, displayRole, sections: { availability, experience, jobHistory, education, additionalInfo,
bankAccount: MaskedBankAccount | null, services } }`; `HomeAddressInput = { streetLine: string(1..120); localityId:
int+ }`; `HomeAddress = HomeAddressInput & { suburb, state, postcode }`; `ServiceAreaInput = { localityId;
travelRadiusKm: int 1..500 }`; `ServiceArea = { localityId, label, travelRadiusKm, precision }`;
`BankAccount = { accountName, bsb: /^\d{6}$/, accountNumber: /^\d{6,10}$/ }`; `MaskedBankAccount = { accountName,
bsbMasked, accountNumberMasked }`; `TicketRequest = { kind: 'profile-photo' | 'document'; contentType; sizeBytes }`;
`TicketResponse = { uploadId, target: UploadTarget, expiresAt }`; `ConfirmRequest = { uploadId }`;
`DocumentInput = { uploadId, metadata: DocumentMetadata }` (a discriminated union by document kind).

## C3 Handlers

```ts
export function workerHandlers(deps: WorkerModuleDeps): HandlerSet
// each: async (req, ctx) => { const profileId = await profileIdOf(deps.db, ctx.principal!); ...; return { status, body } }
```

## C4 Ownership

```ts
export async function profileIdOf(db: Db, principal: Principal): Promise<string>                 // 404 WORKER_PROFILE_NOT_FOUND
export async function assertOwned(tx: Tx, kind: OwnedKind, id: string, profileId: string): Promise<void>  // 404 when not owned
type OwnedKind = 'verificationRequirement' | 'photo' | 'jobApplication'   // jobApplication is owned by userId
```

## C5 Profile read

```ts
export async function getProfile(deps: ReadDeps, profileId: string): Promise<Profile>
// persistence/profile-read.ts
export async function readProfileRows(db: Db, profileId: string): Promise<ProfileRows>   // one transaction, ReadCommitted, 5 s
```

## C6 Completion

```ts
export interface CompletionInput { profile: ProfileColumns; services: ServiceRow[]; requirements: RequirementRow[]; catalogue: RequiredDocsByService; availabilityCount: number; experienceCount: number }
export interface Completion { accountDetails: boolean; compliance: boolean; trainings: boolean; services: boolean; profileCompleted: boolean; percent: number }
export function completionOf(input: CompletionInput): Completion
export async function persistCompletion(tx: Tx, profileId: string, c: Completion): Promise<void>
```

## C7 Sections

```ts
export async function putName(deps, profileId, body: NameBody, ctx): Promise<NameBody>
export async function putBio(deps, profileId, body: BioBody, ctx): Promise<BioBody>
export async function putPersonalInfo(deps, profileId, body: PersonalInfoBody, ctx): Promise<PersonalInfoBody>
export async function putAbn(deps, profileId, body: AbnBody, ctx): Promise<AbnBody>
export async function putAvailability(deps, profileId, body: AvailabilityBody, ctx): Promise<AvailabilityBody>   // domain: noOverlap(slots)
export async function putExperience(deps, profileId, body: ExperienceBody, ctx): Promise<ExperienceBody>         // domain: areasInDomain
export async function putJobHistory(deps, profileId, body: JobHistoryBody, ctx): Promise<JobHistoryBody>
export async function putEducation(deps, profileId, body: EducationBody, ctx): Promise<EducationBody>
export async function putAdditionalInfo(deps, profileId, group: AdditionalInfoGroup, body, ctx): Promise<AdditionalInfoBody>
export async function putBankAccount(deps, profileId, body: BankAccount, ctx): Promise<MaskedBankAccount>
export async function confirmPhoto(deps, profileId, uploadId, ctx): Promise<Photos>
export async function makeMainPhoto(deps, profileId, photoId, ctx): Promise<Photos>
export async function removePhoto(deps, profileId, photoId, ctx): Promise<Photos>
// shared
export async function replaceSection<T>(deps, profileId, work: (tx) => Promise<T>, opts: { completion?: boolean }): Promise<T>  // unitOfWork + persistCompletion
```

## C8 Addresses

```ts
export async function putHomeAddress(deps, profileId, input: HomeAddressInput): Promise<HomeAddress>     // 400 fields.localityId when unknown/retired
export async function putServiceArea(deps, profileId, input: ServiceAreaInput): Promise<ServiceArea>     // placeHome(locality, 'ONBOARDING', radius) → upsert HOME row + legacy columns
```

## C9 Bank account

```ts
export function maskBankAccount(stored: StoredBankAccount): MaskedBankAccount
export function toStored(input: BankAccount): StoredBankAccount      // today's JSON shape
export const BANK_REDACT_PATHS: string[]                              // for the logger's redaction list
```

## C11 Storage and uploads

```ts
export interface ObjectStore {
  createUploadTicket(key: string, contentType: string, maxBytes: number, expiresAt: Date): Promise<UploadTicket>
  inspect(key: string): Promise<ObjectInfo | null>
  readPrefix(key: string, bytes: number): Promise<Uint8Array>
  read(key: string): Promise<Buffer>
  write(key: string, data: Buffer, contentType: string, opts: { cacheControl: string }): Promise<string>
  delete(key: string): Promise<void>
  signedReadUrl(key: string, ttlSeconds: number): Promise<string>
}
export interface UploadKindSpec { contentTypes: readonly string[]; maxBytes: number; prefix: string; ticketTtlMs: number; afterConfirm: 'process-photo' | 'none' }
export const UPLOAD_KINDS: Record<UploadKind, UploadKindSpec>
export class UploadsService {
  createTicket(kind: UploadKind, ownerKey: string, req: { contentType: string; sizeBytes: number }): Promise<TicketResponse>
  confirmUpload(uploadId: string, ownerKey: string): Promise<ConfirmedUpload>    // inspects the object; 404 when not the owner's; idempotent
  signedReadUrl(key: string, ttlSeconds?: number): Promise<string>
  delete(key: string): Promise<void>
  purgeUnclaimed(now: Date): Promise<number>
}
```

## C12 Documents

```ts
export async function allowedRequirementTypes(deps, profileId): Promise<Set<string>>
export async function listRequirements(deps, profileId): Promise<Requirements>
export async function listDocuments(deps, profileId): Promise<Documents>
export async function putDocument(deps, profileId, requirementType: string, input: DocumentInput, ctx): Promise<Document>   // 400 when the type is not allowed
export async function deleteDocument(deps, profileId, id: string, ctx): Promise<void>
export async function documentLink(deps, profileId, id: string): Promise<SignedLink>
export async function adminDocumentLink(deps, id: string): Promise<SignedLink>
```

## C23 Jobs

```ts
export async function listJobs(deps, query: JobsQuery): Promise<JobsPage>
export async function listApplications(deps, userId: string): Promise<Applications>
export async function apply(deps, principal: Principal, profileId: string, jobId: string, ctx): Promise<Application>   // upsert + enqueue JobApplied in one tx
export async function withdraw(deps, principal: Principal, id: string, ctx): Promise<Application>
```

## C24 CRM handler

```ts
export function crmHandlers(deps: { http: SafeHttpClient; urls: { jobApplication: URL; registration: URL }; db: Db }): Record<'JobApplied' | 'WorkerRegistered', OutboxHandler>
```

## C14/C15 Form engine

```ts
export function defineSection<C extends ContractDef>(def: SectionDefinition<C>): SectionDefinition
export interface SectionDefinition<C> { name: string; title: string; contract: Contract<C>; readEntry: keyof C; pick: string; writeEntry: keyof C; fields: FieldDef[]; constants?: Record<string, unknown> }
export function seedSection(def: SectionDefinition, readBody: unknown): FormValues
export function sectionBody(def: SectionDefinition, values: FormValues): unknown
// kinds.ts: KINDS gains select, multiSelect, date, monthYear, number, textarea, timeRanges, orderedList, maskedSecret, abn
```

## C16/C19 App

```ts
export const workerApi: WorkerApi                                   // createWorkerApi({ baseUrl, tokenSource: apiToken })
export function useWorkerProfile(): { data?: Profile; error?: ApiOutcome; reload(): Promise<void> }
export function useSection(def: SectionDefinition): { values, errors, save(): Promise<SaveOutcome>, draftRestored: boolean }
export const WORKER_MENU: MenuItem[]
export type MenuItem = { id: string; label: string; icon: Icon; href: string; badge?: (p: Profile) => string | null } | { id: string; label: string; icon: Icon; children: (p: Profile) => SubItem[] }
```
