# Component Methods

**Stage**: INCEPTION — Application Design
**Date**: 2026-09-09

Method signatures and interface contracts. **Detailed business rules are deferred to Functional
Design** (per-unit, CONSTRUCTION phase) — this document defines shapes, not logic.

---

## 1. Core Types (`packages/domain-core`)

These types are the vocabulary every other signature in this document is written in.

### `Actor` — who is acting (AD-04)

```ts
type Actor =
  | { kind: "user"; id: string; role: UserRole; status: AccountStatus;
      impersonatedBy?: string }
  | { kind: "system"; reason: string }        // cron, sync, migration scripts
  | { kind: "anonymous" };
```

Every domain function takes `actor` as its **first parameter**. Domain packages never read a
session — the transport layer resolves it and passes it in. This is what makes one function serve
a Server Action, an HTTP handler and a future mobile endpoint unchanged.

`impersonatedBy` is carried explicitly so audit records can distinguish a genuine action from an
admin acting as someone else.

### `Result` — expected failures (AD-06)

```ts
type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### `DomainError` — the failure taxonomy

```ts
type DomainErrorCode =
  | "VALIDATION_FAILED" | "NOT_FOUND" | "CONFLICT"
  | "PRECONDITION_FAILED" | "RATE_LIMITED" | "EXTERNAL_SERVICE_FAILED";

interface DomainError {
  code: DomainErrorCode;
  message: string;              // safe for user display (SECURITY-09)
  details?: Record<string, unknown>;
}
```

### Thrown errors — never returned (AD-06)

```ts
class UnauthorizedError extends Error {}   // no valid actor
class ForbiddenError extends Error {}      // actor lacks permission
class InvariantError extends Error {}      // programmer error
```

Authorization failures **throw**, deliberately. A caller who forgets to check a `Result` would
otherwise proceed as though permitted — throwing makes the omission fail closed, satisfying
SECURITY-15.

### Authorization primitives

```ts
function assertRole(actor: Actor, ...roles: UserRole[]): asserts actor is UserActor;
function assertSelfOrRole(actor: Actor, ownerUserId: string, ...roles: UserRole[]): void;
function assertOwns<T extends { ownerUserId: string }>(actor: Actor, resource: T): void;
```

`assertSelfOrRole` and `assertOwns` are the object-level checks AD-05 requires in the domain
layer — the control that prevents IDOR (SECURITY-08).

### Pagination

```ts
interface Paginated<T> {
  items: T[]; total: number; page: number; pageSize: number; hasMore: boolean;
}
```

---

## 2. Data Access (`packages/db`)

Repository functions grouped by aggregate (AD-07). The Prisma client is **not** exported from the
package root. Repositories perform no authorization — that is the domain's responsibility — and
no business logic.

### Worker repository

```ts
findWorkerProfileById(id: string): Promise<WorkerProfileRecord | null>;
findWorkerProfileByUserId(userId: string): Promise<WorkerProfileRecord | null>;
createWorkerProfile(data: CreateWorkerProfileData): Promise<WorkerProfileRecord>;
updateWorkerProfile(id: string, data: UpdateWorkerProfileData): Promise<WorkerProfileRecord>;
setWorkerPublished(id: string, published: boolean): Promise<void>;

listWorkerAvailability(workerProfileId: string): Promise<AvailabilityRecord[]>;
replaceWorkerAvailability(workerProfileId: string, slots: AvailabilitySlot[]): Promise<void>;
listWorkerEducation(workerProfileId: string): Promise<EducationRecord[]>;
replaceWorkerEducation(workerProfileId: string, entries: EducationEntry[]): Promise<void>;
listWorkerJobHistory(workerProfileId: string): Promise<JobHistoryRecord[]>;
replaceWorkerJobHistory(workerProfileId: string, entries: JobHistoryEntry[]): Promise<void>;
listWorkerExperience(workerProfileId: string): Promise<ExperienceRecord[]>;
upsertWorkerExperience(workerProfileId: string, domain: CareDomain,
                       data: ExperienceData): Promise<void>;

listWorkerServices(workerProfileId: string): Promise<WorkerServiceRecord[]>;
replaceWorkerServices(workerProfileId: string, services: WorkerServiceInput[]): Promise<void>;
findWorkerAdditionalInfo(workerProfileId: string): Promise<AdditionalInfoRecord | null>;
upsertWorkerAdditionalInfo(workerProfileId: string,
                           data: AdditionalInfoData): Promise<AdditionalInfoRecord>;
```

`replace*` rather than `update*` for the four W1 child collections, because they are edited as
whole lists in the UI and each has a uniqueness constraint that a partial update would fight.

### Search repository

```ts
searchWorkers(criteria: WorkerSearchCriteria): Promise<Paginated<WorkerSearchRecord>>;
countWorkersNear(lat: number, lon: number, radiusKm: number): Promise<number>;
```

`WorkerSearchCriteria` carries the twelve optional filters the current implementation already
accepts as an object — location and radius, services, support-worker categories, languages,
gender, age range, vehicle, verification status, therapeutic subcategories, document categories
and statuses, and experience domains — **plus an explicit `visibility` discriminator**:

```ts
type SearchVisibility = "public" | "admin";
```

Making visibility a required field of the criteria means no call site can omit it and
accidentally fall back to the permissive behaviour. This is the FR-10.7 boundary expressed in
the type system.

### Verification repository

```ts
listRequirements(workerProfileId: string): Promise<RequirementRecord[]>;
findRequirement(id: string): Promise<RequirementRecord | null>;
createRequirements(workerProfileId: string, specs: RequirementSpec[]): Promise<void>;
updateRequirementStatus(id: string, status: RequirementStatus,
                        review: ReviewMetadata): Promise<RequirementRecord>;
listWorkersByVerificationStatus(status: string,
                                page: PageRequest): Promise<Paginated<WorkerProfileRecord>>;
getVerificationCounts(): Promise<Record<string, number>>;
```

### Identity repository

```ts
findUserByEmail(email: string): Promise<UserRecord | null>;
findUserById(id: string): Promise<UserRecord | null>;
createUser(data: CreateUserData): Promise<UserRecord>;
updateUserCredentials(id: string, data: CredentialUpdate): Promise<void>;
recordLoginAttempt(id: string, outcome: LoginOutcome): Promise<void>;
findUserByResetToken(token: string): Promise<UserRecord | null>;
appendAuditLog(entry: AuditLogEntry): Promise<void>;
searchUsers(query: UserSearchQuery): Promise<Paginated<UserRecord>>;
```

### Demand repository

```ts
listParticipants(requesterId: string): Promise<ParticipantRecord[]>;
findParticipant(id: string): Promise<ParticipantRecord | null>;
createParticipant(data: CreateParticipantData): Promise<ParticipantRecord>;
updateParticipant(id: string, data: UpdateParticipantData): Promise<ParticipantRecord>;
deleteParticipant(id: string): Promise<void>;

listServiceRequests(requesterId: string,
                    filter: ServiceRequestFilter): Promise<Paginated<ServiceRequestRecord>>;
findServiceRequest(id: string): Promise<ServiceRequestRecord | null>;
createServiceRequest(data: CreateServiceRequestData): Promise<ServiceRequestRecord>;
updateServiceRequest(id: string, data: UpdateServiceRequestData): Promise<ServiceRequestRecord>;
setSelectedWorkers(id: string, workerIds: string[]): Promise<void>;
```

`findParticipant` and `findServiceRequest` return the record including its `requesterId` so the
domain can perform the ownership check AD-05 requires.

### Jobs repository

```ts
listActiveJobs(filter: JobFilter): Promise<Paginated<JobRecord>>;
findJobById(id: string): Promise<JobRecord | null>;
upsertJobsByZohoId(jobs: JobUpsertInput[]): Promise<UpsertSummary>;
deactivateJobsNotIn(zohoIds: string[]): Promise<number>;
findApplication(jobId: string, workerId: string): Promise<ApplicationRecord | null>;
createApplication(jobId: string, workerId: string): Promise<ApplicationRecord>;
updateApplicationStatus(id: string, status: JobApplicationStatus): Promise<ApplicationRecord>;
listApplicationsForWorker(workerId: string): Promise<ApplicationRecord[]>;
```

### Taxonomy repository

```ts
listCategories(): Promise<CategoryRecord[]>;
listSubcategories(categoryId?: string): Promise<SubcategoryRecord[]>;
listCategoryDocuments(categoryIds: string[]): Promise<CategoryDocumentRecord[]>;
listSubcategoryDocuments(subcategoryIds: string[]): Promise<SubcategoryDocumentRecord[]>;
```

---

## 3. Domain Methods

Representative signatures per package. Each takes `actor` first (AD-04) and returns `Result`
for expected failures (AD-06). Exhaustive enumeration of all 56 actions is deferred to Functional
Design.

### `packages/domain-identity`

```ts
registerWorker(actor: Actor, data: WorkerRegistrationData): Promise<Result<{ userId: string }>>;
registerClient(actor: Actor, data: ClientRegistrationData): Promise<Result<{ userId: string }>>;
registerCoordinator(actor: Actor,
                    data: CoordinatorRegistrationData): Promise<Result<{ userId: string }>>;

verifyCredentials(actor: Actor,
                  email: string, password: string): Promise<Result<AuthenticatedUser>>;
requestPasswordReset(actor: Actor, email: string): Promise<Result<void>>;
resetPassword(actor: Actor, token: string, newPassword: string): Promise<Result<void>>;
setInitialPassword(actor: Actor, token: string, password: string): Promise<Result<void>>;

startImpersonation(actor: Actor, targetUserId: string): Promise<Result<ImpersonationGrant>>;
endImpersonation(actor: Actor): Promise<Result<void>>;
searchUsers(actor: Actor, query: UserSearchQuery): Promise<Result<Paginated<UserSummary>>>;
```

`registerWorker` accepts an `anonymous` actor by design — registration is the boundary at which an
actor comes into existence. `startImpersonation` calls `assertRole(actor, ADMIN)`.

`requestPasswordReset` returns `ok` regardless of whether the email exists, so the response cannot
be used to enumerate accounts (SECURITY-09).

### `packages/domain-worker`

```ts
getWorkerProfile(actor: Actor, userId: string): Promise<Result<WorkerProfile>>;
updateWorkerBio(actor: Actor, data: UpdateBioData): Promise<Result<WorkerProfile>>;
updateWorkerPersonalInfo(actor: Actor, data: UpdatePersonalInfoData): Promise<Result<WorkerProfile>>;
updateWorkerAddress(actor: Actor, data: UpdateAddressData): Promise<Result<WorkerProfile>>;
updateWorkerPhoto(actor: Actor, data: UpdatePhotoData): Promise<Result<WorkerProfile>>;

setWorkerAvailability(actor: Actor, slots: AvailabilitySlot[]): Promise<Result<void>>;
setWorkerEducation(actor: Actor, entries: EducationEntry[]): Promise<Result<void>>;
setWorkerJobHistory(actor: Actor, entries: JobHistoryEntry[]): Promise<Result<void>>;
setWorkerExperience(actor: Actor, domain: CareDomain,
                    data: ExperienceData): Promise<Result<void>>;

selectWorkerServices(actor: Actor, selections: ServiceSelection[]): Promise<Result<void>>;
getSetupProgress(actor: Actor): Promise<Result<SetupProgress>>;
advanceSetupStep(actor: Actor, step: SetupStepId,
                 payload: unknown): Promise<Result<SetupProgress>>;
getProfilePreview(actor: Actor, userId: string): Promise<Result<WorkerProfilePreview>>;
```

Every mutator here calls `assertSelfOrRole(actor, ownerUserId, ADMIN)` — a worker edits their own
profile; an admin may edit any. That single check is the object-level control AD-05 requires, and
it is what makes an IDOR through these paths impossible regardless of transport.

`selectWorkerServices` has a documented side effect: it triggers requirement derivation in
`domain-verification`. See `services.md`.

### `packages/domain-verification`

```ts
deriveRequirements(actor: Actor, workerProfileId: string): Promise<Result<RequirementSummary>>;
listRequirements(actor: Actor, workerProfileId: string): Promise<Result<Requirement[]>>;
submitRequirementDocument(actor: Actor, requirementId: string,
                          document: DocumentRef): Promise<Result<Requirement>>;

approveRequirement(actor: Actor, requirementId: string,
                   note?: string): Promise<Result<Requirement>>;
rejectRequirement(actor: Actor, requirementId: string,
                  reason: string): Promise<Result<Requirement>>;
resetRequirement(actor: Actor, requirementId: string): Promise<Result<Requirement>>;
setRequirementExpiry(actor: Actor, requirementId: string,
                     expiresAt: Date): Promise<Result<Requirement>>;

submitForVerification(actor: Actor): Promise<Result<VerificationState>>;
approveVerification(actor: Actor, workerProfileId: string): Promise<Result<VerificationState>>;
rejectVerification(actor: Actor, workerProfileId: string,
                   reason: string): Promise<Result<VerificationState>>;
publishWorkerProfile(actor: Actor, workerProfileId: string): Promise<Result<void>>;

canAccessFeature(actor: Actor, feature: FeatureName): Promise<boolean>;
getVerificationStatistics(actor: Actor): Promise<Result<VerificationStatistics>>;
```

The four review methods and both verification decisions call `assertRole(actor, ADMIN)`.
`submitRequirementDocument` calls `assertSelfOrRole` against the requirement's owning worker.

`canAccessFeature` returns a bare `boolean` rather than a `Result` — it is a predicate, and a
failure to determine access is an authorization matter that throws.

### `packages/domain-search`

```ts
searchWorkersPublic(actor: Actor,
                    criteria: PublicSearchCriteria): Promise<Result<Paginated<WorkerBio>>>;
searchWorkersAdmin(actor: Actor,
                   criteria: AdminSearchCriteria): Promise<Result<Paginated<WorkerSummary>>>;
getWorkerBio(actor: Actor, workerId: string): Promise<Result<WorkerBio>>;
geocodeLocation(actor: Actor, query: string): Promise<Result<Coordinates>>;
```

**Two functions, deliberately, not one with a flag.** This is the FR-10.7 / RISK-2 boundary:

- `searchWorkersPublic` forces `visibility: "public"` internally, returns only the `WorkerBio`
  projection (id, name, introduction, photo, city, state, services), and accepts an `anonymous`
  actor. It cannot be made to return unpublished or unverified workers.
- `searchWorkersAdmin` calls `assertRole(actor, ADMIN)` as its first statement, and returns the
  richer `WorkerSummary`. It cannot be reached without an admin actor.

Separating them means the dangerous capability has no anonymous-reachable code path at all,
rather than depending on a correctly-passed parameter. `PublicSearchCriteria` has no visibility
field to set.

### `packages/domain-demand`

```ts
listParticipants(actor: Actor): Promise<Result<Participant[]>>;
createParticipant(actor: Actor, data: CreateParticipantData): Promise<Result<Participant>>;
updateParticipant(actor: Actor, id: string,
                  data: UpdateParticipantData): Promise<Result<Participant>>;
deleteParticipant(actor: Actor, id: string): Promise<Result<void>>;

listServiceRequests(actor: Actor,
                    filter: ServiceRequestFilter): Promise<Result<Paginated<ServiceRequest>>>;
createServiceRequest(actor: Actor,
                     data: CreateServiceRequestData): Promise<Result<ServiceRequest>>;
updateServiceRequest(actor: Actor, id: string,
                     data: UpdateServiceRequestData): Promise<Result<ServiceRequest>>;
selectWorkers(actor: Actor, requestId: string,
              workerIds: string[]): Promise<Result<ServiceRequest>>;
transitionServiceRequest(actor: Actor, id: string,
                         to: ServiceRequestStatus): Promise<Result<ServiceRequest>>;
```

Every method operating on an existing record loads it and calls `assertOwns` against
`requesterId` before proceeding. This matters more here than anywhere else: `ServiceRequest.requesterId`
and `Participant.userId` have **no foreign key** to `User` (TD-9), so the database enforces no
ownership. The domain layer is the only control.

### `packages/domain-jobs`

```ts
listJobsForWorker(actor: Actor, filter: JobFilter): Promise<Result<Paginated<Job>>>;
applyToJob(actor: Actor, jobId: string): Promise<Result<JobApplication>>;
withdrawApplication(actor: Actor, jobId: string): Promise<Result<JobApplication>>;
listMyApplications(actor: Actor): Promise<Result<JobApplication[]>>;
syncJobsFromZoho(actor: Actor, leads: ZohoLead[]): Promise<Result<SyncSummary>>;
```

`syncJobsFromZoho` requires a `system` actor — it is the one method reached by cron rather than a
person, and typing it that way makes the distinction explicit rather than implicit in a shared
secret.

---

## 4. Transport Layer (`apps/app`)

Server Action wrappers are thin (AD-08). The canonical shape:

```ts
"use server";

export async function updateWorkerBioAction(data: UpdateBioData) {
  const actor = await resolveActor();                 // session -> Actor
  assertRole(actor, UserRole.WORKER, UserRole.ADMIN); // coarse check (AD-05)
  const result = await updateWorkerBio(actor, data);  // domain does the rest
  if (result.ok) revalidatePath("/dashboard/worker/profile-building");
  return result;
}
```

Three responsibilities, and no more: resolve the actor, apply the coarse role check, invalidate
Next's cache. Business logic and ownership checks live in the domain.

Route handlers follow the same pattern, mapping `Result` onto HTTP status:

```ts
export async function POST(req: NextRequest) {
  const actor = await resolveActor(req);
  assertRole(actor, UserRole.ADMIN);
  const input = updateSchema.parse(await req.json());   // SECURITY-05
  const result = await approveRequirement(actor, input.id, input.note);
  return result.ok
    ? NextResponse.json({ success: true, data: result.value })
    : NextResponse.json({ error: result.error.message }, { status: statusFor(result.error) });
}
```

### Shared transport helpers

```ts
resolveActor(req?: NextRequest): Promise<Actor>;   // NextAuth session -> Actor
statusFor(error: DomainError): number;             // DomainErrorCode -> HTTP status
toErrorResponse(error: unknown): NextResponse;     // global handler (SECURITY-15)
```

`toErrorResponse` maps `UnauthorizedError` to 401 and `ForbiddenError` to 403, and returns a
generic message for anything unrecognised so internal details never reach the client
(SECURITY-09).

---

## 5. `packages/api-client`

Hand-written (AD-09), typed against `packages/schemas`, normalising HTTP failures onto the same
`Result` shape the domain uses so consumers handle one error model.

```ts
createApiClient(config: { baseUrl: string; getToken?: () => Promise<string | null> }): ApiClient;

interface ApiClient {
  workers: {
    listPublic(params: PublicWorkerQuery): Promise<Result<Paginated<WorkerBio>>>;
    getPublic(id: string): Promise<Result<WorkerBio>>;
  };
}
```

The initial surface is exactly what `apps/web` needs under D-35 — the public worker directory and
nothing more. `getToken` is present but unused until mobile authentication exists; it is included
now because retrofitting it into every call site later is more disruptive than carrying an
optional field.

**Note**: this client exposes only public endpoints. It has no method that reaches
`searchWorkersAdmin`, which is a deliberate structural expression of FR-10.7 — `apps/web` cannot
call the admin search because `api-client` gives it no way to.
