# API Documentation

**System**: Remonta Marketplace
**Analysis Date**: 2026-09-09T02:12:02Z
**Total route handlers**: 86

---

## Conventions

- **Location**: every endpoint is a `route.ts` file under `src/app/api/`, following Next.js App Router conventions. Exported `GET` / `POST` / `PATCH` / `PUT` / `DELETE` functions define the supported methods.
- **Response shape**: most handlers return `NextResponse.json`. Collection endpoints commonly use `{ success: boolean, data: [...], pagination: { total, page, pageSize, hasMore, totalPages } }`. Errors return `{ error: string }` with an appropriate status.
- **Authorization**: enforced **inside each handler**, not by middleware — `middleware.ts` matches only `/dashboard/:path*`, `/admin/:path*` and `/apply/:path*`, so it never runs for `/api/*`. Three guard styles are in use:
  - `requireRole(UserRole.X)` / `requireAnyRole([...])` from `src/lib/auth.ts` — used across `/api/admin/*`
  - `getServerSession(...)` then an inline `session?.user` check — used across `/api/worker/*`, `/api/client/*`, `/api/upload/*`
  - Shared-secret headers — `CRON_SECRET` (bearer) and `x-api-secret` for machine-to-machine endpoints
- **Rate limiting**: `src/lib/ratelimit.ts` provides Upstash limiters, applied selectively (for example `publicApiRateLimit` on `/api/contractors`).

---

## Authorization Summary

| Guard style | Endpoints |
|---|---|
| `requireRole(ADMIN)` | 17 |
| `requireAnyRole([...])` | 4 |
| `getServerSession` + inline check | 31 |
| Shared secret (`CRON_SECRET` / `x-api-secret`) | 4 |
| Share token | 1 |
| Intentionally public (auth, registration, reference data, public listings) | 28 |
| **Unguarded but should not be** | **1 — `POST /api/admin/fix-qualifications`** |

`POST /api/admin/fix-qualifications` performs an unbounded loop of
`verificationRequirement.update` calls with no authentication of any kind. See
`code-quality-assessment.md`, finding TD-1.

---

## Admin APIs

All require ADMIN unless noted.

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/api/admin/ai-search` | Natural-language contractor search, proxied to an n8n webhook (`AI_SEARCH_WEBHOOK`) | `requireRole(ADMIN)` |
| POST | `/api/admin/chat` | Admin chatbot, proxied to n8n | `requireRole(ADMIN)` |
| GET | `/api/admin/contractors` | Paginated, faceted contractor list. Filters: search, location, radius, type of support, gender, vehicle, worker type, languages, age, therapeutic subcategories, document categories and statuses, requirement types, experience domains. Redis-cached | `requireRole(ADMIN)` |
| GET | `/api/admin/contractors/[id]` | Single contractor detail | `requireRole(ADMIN)` |
| GET | `/api/admin/contractors/[id]/pdf` | Contractor profile as PDF | `requireRole(ADMIN)` |
| PATCH | `/api/admin/contractors/[id]/status` | Change contractor status | `requireAnyRole` |
| GET | `/api/admin/contractors/inactive` | Inactive contractors | `requireAnyRole` |
| GET | `/api/admin/compliance/pending` | Workers awaiting document review | `requireRole(ADMIN)` |
| GET | `/api/admin/compliance/compliant` | Fully compliant workers | `requireAnyRole` |
| GET | `/api/admin/compliance/[id]` | One worker's full compliance detail | `requireRole(ADMIN)` |
| POST | `/api/admin/compliance/[id]/publish` | Publish the worker profile (`isPublished = true`) | `requireAnyRole` |
| POST | `/api/admin/compliance/[id]/[documentId]/approve` | Approve one requirement | `requireRole(ADMIN)` |
| POST | `/api/admin/compliance/[id]/[documentId]/reject` | Reject one requirement with a reason | `requireRole(ADMIN)` |
| POST | `/api/admin/compliance/[id]/[documentId]/reset` | Reset one requirement to PENDING | `requireRole(ADMIN)` |
| POST | `/api/admin/compliance/[id]/[documentId]/update-expiry` | Set a requirement expiry date | `requireRole(ADMIN)` |
| GET, POST | `/api/admin/verification` | Read verification queue; submit approve/reject decisions | `requireRole(ADMIN)` |
| GET | `/api/admin/filters` | Filter option metadata for the admin search UI | `requireRole(ADMIN)` |
| GET | `/api/admin/users` | User search for impersonation, by email or profile name across all three profile types | `requireRole(ADMIN)` |
| POST, DELETE | `/api/admin/impersonate` | Start and end impersonation; writes `Session.impersonatedBy` and `AuditLog` | `requireRole(ADMIN)` |
| GET | `/api/admin/reports/daily` | Daily report | `requireRole(ADMIN)` |
| GET | `/api/admin/reports/weekly` | Weekly report | `requireRole(ADMIN)` |
| GET | `/api/admin/reports/worker-statistics` | Worker statistics | `requireRole(ADMIN)` |
| GET | `/api/admin/reports/agreement/[type]` | Service agreement document by type | `requireRole(ADMIN)` |
| POST | `/api/admin/fix-qualifications` | One-time migration rewriting `requirementName` from slug to display name across all non-required requirements | **NONE** |

---

## Authentication APIs

All intentionally public.

| Method | Path | Purpose |
|---|---|---|
| * | `/api/auth/[...nextauth]` | NextAuth handler — sign in, sign out, session, callbacks |
| POST | `/api/auth/register` | Worker registration |
| POST | `/api/auth/register-async` | Deferred worker registration (background processing) |
| POST | `/api/auth/register/client` | Client registration, creates `ClientProfile` |
| POST | `/api/auth/register/coordinator` | Coordinator registration, creates `CoordinatorProfile` |
| POST | `/api/auth/check-email` | Email availability check |
| POST | `/api/auth/forgot-password` | Issue a password reset token and email |
| POST | `/api/auth/reset-password` | Consume a reset token, set a new password |
| POST | `/api/auth/setup-password` | Initial password for a provisioned account |
| POST | `/api/auth/send-otp` | Send an SMS OTP |
| POST | `/api/auth/verify-otp` | Verify an SMS OTP |

Login security lives in `src/lib/auth.config.ts` and the `User` model: bcrypt hashes,
`failedLoginAttempts`, `accountLockedUntil`, `lastLoginAt`, `lastLoginIp`, and `AuditLog` entries
for LOGIN_SUCCESS, LOGIN_FAILED, ACCOUNT_LOCKED and related actions.

---

## Worker APIs

All guarded by `getServerSession` plus an inline session check.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/worker/profile/[userId]` | Fetch a worker profile |
| POST | `/api/worker/profile/update-step` | Persist one wizard step and update `setupProgress` |
| GET | `/api/worker/services` | The worker's selected `WorkerService` rows |
| GET | `/api/worker/requirements` | Derived `VerificationRequirement` list |
| GET, PATCH | `/api/worker/compliance-documents` | Read and update compliance documents |
| GET, DELETE | `/api/worker/identity-documents` | Manage identity documents |
| POST | `/api/worker/identity-documents/copy-reference` | Reuse an existing identity document reference |
| GET, DELETE | `/api/worker/service-documents` | Manage service-specific documents |
| GET | `/api/worker/other-requirements` | Additional requirements |
| DELETE | `/api/worker/other-requirements/[id]` | Remove an additional requirement |
| GET, DELETE | `/api/worker/vehicle-photo` | Manage the vehicle photo |
| GET | `/api/worker/jobs` | Job board listing for the worker |
| POST, PATCH | `/api/worker/jobs/apply` | Apply to a job, or withdraw (`JobApplicationStatus`) |

---

## Client and Coordinator APIs

All guarded by `getServerSession` plus an inline session check.

| Method | Path | Purpose |
|---|---|---|
| GET, POST | `/api/client/participants` | List and create participants |
| GET, PATCH, DELETE | `/api/client/participants/[id]` | Read, update and remove one participant |
| GET, POST | `/api/client/service-request` | List and create service requests |
| GET, PATCH, DELETE | `/api/client/service-request/[id]` | Read, update and remove one request |
| POST | `/api/client/service-request/[id]/reactivate` | Reactivate an archived or cancelled request |
| POST, DELETE | `/api/client/service-request/[id]/select-worker` | Add or remove a worker from `selectedWorkers` |
| POST | `/api/client/service-request/action-webhook` | Inbound action webhook for request state changes |
| GET | `/api/client/workers` | Worker search for the demand side |
| GET | `/api/client/workers/by-ids` | Batch worker fetch by id, for rendering a shortlist |
| GET, PATCH | `/api/coordinator/profile` | Read and update the coordinator profile |

---

## Upload APIs

All guarded by `getServerSession` except `worker-photo`. Files are stored in Vercel Blob via
`src/lib/blobStorage.ts`; `next.config.ts` allows Server Action bodies up to 50 MB and
`vercel.json` gives `/api/upload/**` a 30-second max duration.

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/api/upload/identity-documents` | Identity evidence | session |
| POST | `/api/upload/certificates` | Qualification certificates | session |
| POST | `/api/upload/service-documents` | Service-specific documents | session |
| POST | `/api/upload/other-requirements` | Additional requirement evidence | session |
| POST | `/api/upload/vehicle-photo` | Vehicle photo | session |
| POST | `/api/upload/worker-photo` | Profile photo **before** the account exists | **none, by design** |
| POST | `/api/compliance/upload` | Compliance document upload | session |
| POST | `/api/blob/upload-token` | Issue a client-side Blob upload token | session |

`POST /api/upload/worker-photo` is unauthenticated because it runs during registration before a
user exists. It validates the file through `validateImageFile` but accepts an arbitrary `email`
form field. See `code-quality-assessment.md`, finding TD-2.

---

## Public and Reference APIs

Intentionally unauthenticated.

| Method | Path | Purpose | Notes |
|---|---|---|---|
| GET | `/api/public/workers` | Public worker directory | Returns a deliberate `WorkerBio` projection — id, name, introduction, photo, city, state, services, optional distance. No contact details or documents. |
| GET | `/api/contractors` | Legacy contractor listing from `DATABASE_URL` | Rate-limited via `publicApiRateLimit`. Pagination capped at 100. Supports location, radius, city, state, postcode, gender and support-type filters. |
| GET | `/api/contractors/[id]` | Legacy contractor detail | |
| GET | `/api/jobs` | Public job listing | |
| GET | `/api/categories` | Service categories | |
| GET | `/api/subcategories` | Service subcategories | |
| GET | `/api/categories/therapeutic-supports/subcategories` | Therapeutic subcategories | |
| GET | `/api/suburbs` | Australian suburb lookup | Backed by `src/lib/data/australianPostcodes.ts` |
| GET | `/api/geocode` | Address to coordinates | Proxies `GEOMAP_API` |
| GET | `/api/articles`, `/api/articles/[slug]` | News and article content | |
| POST | `/api/sms/send-verification`, `/api/sms/verify-code` | SMS verification via Twilio | Honours `SMS_DEV_MODE` |
| POST | `/api/apply` | Job application intake, forwarded to `APPLY_WEBHOOK_URL` | Uses `getServerSession` |

---

## Sharing APIs

| Method | Path | Purpose | Guard |
|---|---|---|---|
| POST | `/api/share/generate` | Mint a share token for a worker profile | `getServerSession` |
| GET | `/api/share/profile` | Resolve a share token to a profile | `verifyShareToken` (`src/lib/shareToken.ts`) |

Consumed by the public page `/share/profile/[token]`.

---

## Machine-to-Machine APIs

| Method | Path | Purpose | Guard |
|---|---|---|---|
| GET | `/api/cron/sync-jobs` | Vercel cron entry point, hourly per `vercel.json` | `Authorization: Bearer ${CRON_SECRET}` |
| GET, POST | `/api/sync-jobs` | GET returns sync status (public); POST runs the Zoho lead sync | POST: `x-api-secret: ${SYNC_API_SECRET}` |
| POST | `/api/refresh-jobs` | Force a job refresh | `x-api-secret` |
| GET | `/api/zoho/leads` | Raw Zoho lead passthrough | `x-api-secret` |

`POST /api/sync-jobs` guards concurrency with a module-level `isSyncing` boolean. This is
per-instance only and does not prevent concurrent syncs across serverless instances — see
`code-quality-assessment.md`, finding TD-6.

---

## Internal APIs

### `src/lib/auth.ts` — authorization guards
| Function | Signature | Behaviour |
|---|---|---|
| `getSession` | `() => Promise<Session \| null>` | Current NextAuth session |
| `getCurrentUser` | `() => Promise<User \| undefined>` | Session user |
| `isAuthenticated` | `() => Promise<boolean>` | Session presence |
| `hasRole` | `(role: UserRole) => Promise<boolean>` | Non-throwing role check |
| `hasAnyRole` | `(roles: UserRole[]) => Promise<boolean>` | Non-throwing multi-role check |
| `requireAuth` | `() => Promise<Session>` | Throws when unauthenticated |
| `requireRole` | `(role: UserRole) => Promise<Session>` | Throws when the role does not match |
| `requireAnyRole` | `(roles: UserRole[]) => Promise<Session>` | Throws when no role matches |

### `src/lib/verification.ts` — verification lifecycle
`getWorkersAwaitingVerification()`, `getWorkersByVerificationStatus(status)`,
`getWorkerVerificationDetails(userId)`, `approveWorkerVerification(...)`,
`rejectWorkerVerification(...)`, `isWorkerVerified(userId)`, `getVerificationStatistics()`,
`submitForVerification(userId)`.

### `src/lib/feature-access.ts` — feature gating
`FeatureLevel` enum (BASIC, VERIFIED, PREMIUM) and the `FEATURE_REQUIREMENTS` map, consulted by
`canAccessFeature(userId, featureName)`. BASIC covers dashboard, profile editing, document upload
and verification status. VERIFIED covers client search, viewing client requests, accepting
bookings, messaging, public profile and notifications. PREMIUM covers priority listings, advanced
search and analytics, and is not yet implemented.

### `src/lib/zoho.ts` — CRM client
`ZohoService` with `getAccessToken()` (OAuth refresh-token grant), `getLeadsByStage(stage)` and
`getRawLeads(perPage)`, exported as the `zohoService` singleton.

### `src/services/worker/*` — worker domain services
Ten modules covering profile, profile preview, availability, compliance, experience, additional
info, service documents, setup progress and worker services, plus `services/user/account.service.ts`.

---

## Data Models

Two PostgreSQL databases, each with its own Prisma schema and client. Models below are from
`prisma/auth-schema.prisma` (the live domain) unless marked LEGACY.

### Identity and access

**`User`** (`users`)
- **Fields**: `id`, `email` (unique), `passwordHash`, `role` (UserRole), `status` (AccountStatus), `resetPasswordToken` (unique), `resetPasswordExpires`, `failedLoginAttempts`, `accountLockedUntil`, `lastLoginAt`, `lastLoginIp`, timestamps
- **Relationships**: `accounts`, `sessions`, `auditLogs`, `workerProfile`, `clientProfile`, `coordinatorProfile`, `participants`
- **Validation**: unique email; role and status constrained by enum; lockout enforced in `auth.config.ts`

**`Account`**, **`Session`**, **`VerificationToken`** — NextAuth adapter tables. `Session` carries the non-standard `impersonatedBy`.

**`AuditLog`** (`audit_logs`)
- **Fields**: `id`, `userId?`, `action` (AuditAction), `ipAddress?`, `userAgent?`, `metadata` (Json), `createdAt`
- **Actions**: 14 values covering login, logout, password change and reset, email change and verification, profile update, account lock and unlock, role change, impersonation start and end

### Worker domain

**`WorkerProfile`** (`worker_profiles`)
- **Fields**: identity (`firstName`, `middleName`, `lastName`, `mobile`, `dateOfBirth`, `age`, `gender`), location (`location`, `city`, `state`, `postalCode`, `latitude`, `longitude`), presentation (`introduction`, `qualifications`, `experience`, `funFact`, `hobbies`, `uniqueService`, `photos`, `additionalPhotos`), `languages` (String[]), `hasVehicle`, `abn` (Json), `setupProgress` (Json), `profileCompleted`, `isPublished`, `verificationStatus`
- **Relationships**: `user` (1:1), `verificationRequirements`, `workerServices`, `workerAdditionalInfo`, `availability`, `jobHistoryEntries`, `educationEntries`, `careExperience`
- **Indexes**: 18, including a GIN index on `languages` and composites on `isPublished` with city, gender and verification status

**`WorkerAdditionalInfo`** (`worker_additional_info`)
- **Fields**: `languages`, `culturalBackground`, `religion`, `interests`, `workPreferences`, `uniqueService` (all String[]), `lgbtqiaSupport`, `nonSmoker`, `petFriendly`, `personality`, `funFact`, `bankAccount` (Json)
- **Note**: the four Json columns `availability`, `experience`, `jobHistory` and `education` were **removed** by migration `20260907160000_w1_drop_json_columns`

**W1 typed tables** — the current source of truth for what were Json columns:
- **`WorkerJobHistory`** (`worker_job_history`) — `jobTitle`, `company`, start and end month/year, `currentlyWorking`, `sortOrder`
- **`WorkerEducation`** (`worker_education`) — `institution`, `qualification`, start and end month/year, `currentlyStudying`, `sortOrder`
- **`WorkerAvailability`** (`worker_availability`) — `dayOfWeek` (DayOfWeek), `startMinute`, `endMinute` as minutes from midnight (0–1439) so slots sort and compare and an overnight shift is expressible as `endMinute <= startMinute`. Unique on `(workerProfileId, dayOfWeek, startMinute, endMinute)` — deliberately on both start and end, because production data held two slots sharing a start
- **`WorkerExperience`** (`worker_experience`) — `domain` (CareDomain), `isProfessional`, `isPersonal`, `specificAreas`, `otherAreas`, `description`. Unique on `(workerProfileId, domain)`

**`WorkerService`** (`worker_services`)
- **Fields**: `categoryId`, `categoryName`, `subcategoryIds` (String[]), `subcategoryNames` (String[]), `metadata` (Json)
- **Validation**: unique on `(workerProfileId, categoryId)`
- **Note**: denormalises category and subcategory names alongside ids

**`VerificationRequirement`** (`verification_requirements`)
- **Fields**: `requirementType`, `requirementName`, `isRequired`, `status` (RequirementStatus), `documentUrl`, `documentCategory` (DocumentCategory), plus the audit trail `documentUploadedAt`, `submittedAt`, `reviewedAt`, `reviewedBy`, `approvedAt`, `rejectedAt`, `expiresAt`, `rejectionReason`, `notes`, `metadata`
- **Lifecycle**: PENDING → SUBMITTED → APPROVED / REJECTED / EXPIRED

### Service taxonomy

**`Category`** — `name`, `requiresQualification`
**`Subcategory`** — `categoryId`, `name`, `requiresRegistration` (for example "AHPRA")
**`Document`** — `name`, `category`, `description`, `hasExpiration`
**`CategoryDocument`** — join with `documentType` (REQUIRED / OPTIONAL / CONDITIONAL), plus `conditionKey` and `requiredIfTrue` for conditional requirements. Unique on `(categoryId, documentId, documentType, conditionKey)`
**`SubcategoryDocument`** — join for subcategory-specific extras. Unique on `(subcategoryId, documentId)`

> These five models are **duplicated in both schemas** with differing shapes. The legacy
> `schema.prisma` copies carry extra indexes and inline documentation.

### Demand domain

**`ClientProfile`** (`client_profiles`) — `firstName`, `lastName`, `mobile`, `isSelfManaged`
**`CoordinatorProfile`** (`coordinator_profiles`) — `firstName`, `lastName`, `mobile`, `organization`, `clientTypes` (String[])
**`Participant`** (`participants`) — `firstName`, `lastName`, `dateOfBirth`, `location`, `gender`, `conditions` (String[]), `fundingType` (FundingType), `relationshipToClient`, `isSelfManaged`, `servicesRequested` (Json), `additionalInfo`. `userId` is optional with `onDelete: SetNull`
**`ServiceRequest`** (`service_requests`) — `requesterId`, `participantId`, `services` (Json), `details` (Json), `location`, `zohoRecordId` (unique), `assignedWorker` (Json), `selectedWorkers` (String[]), `status` (ServiceRequestStatus)
- **Note**: `requesterId` is a bare String with no foreign key to `User`

### Jobs

**`Job`** (`jobs`) — `zohoId` (unique upsert key), `status`, `firstName`, `lastName`, `recruitmentTitle`, `service`, `description`, `jobDescription`, `city`, `state`, `postedAt`, `active`, `lastSyncedAt`
**`JobApplication`** (`job_applications`) — `jobId`, `workerId`, `status` (PENDING / WITHDRAWN), `appliedAt`. Unique on `(jobId, workerId)`
- **Note**: `workerId` references `User.id` by convention only — there is no foreign key

### Enumerations

`UserRole` (WORKER, CLIENT, COORDINATOR, ADMIN) · `AccountStatus` (ACTIVE, SUSPENDED, LOCKED,
PENDING_VERIFICATION) · `VerificationStatus` (NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED,
REJECTED) · `RequirementStatus` (PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED) ·
`DocumentCategory` (PRIMARY, SECONDARY, WORKING_RIGHTS, SERVICE_QUALIFICATION) ·
`ServiceRequestStatus` (PENDING, MATCHED, ACTIVE, COMPLETED, CANCELLED, ARCHIVED) · `FundingType`
(NDIS, AGED_CARE, INSURANCE, PRIVATE, OTHER) · `RepresentativeType` (SELF, PARENT, GUARDIAN,
FAMILY_MEMBER, LEGAL_REPRESENTATIVE, OTHER) · `JobApplicationStatus` (PENDING, WITHDRAWN) ·
`AuditAction` (14 values) · `DayOfWeek` (7 values) · `CareDomain` (DISABILITY, AGED_CARE,
WORKING_WITH_CHILDREN, MENTAL_HEALTH, CHRONIC_MEDICAL)

> `VerificationStatus` and `RepresentativeType` are declared but not referenced by any model
> field — `WorkerProfile.verificationStatus` is a plain `String` defaulting to `"NOT_STARTED"`.

### LEGACY models (`prisma/schema.prisma`, `DATABASE_URL`)

**`ContractorProfile`** — keyed on `zohoContactId` (unique). Mirrors worker data with
`lastSyncedAt` and soft delete via `deletedAt`. 14 indexes.
**`Job`** LEGACY — a materially different shape from the auth-schema `Job`, carrying
participant-matching fields: `disabilities`, `behaviouralConcerns`, `culturalConsiderations`,
`language`, `religion`, `age`, `gender`, `hobbies`, plus `clientZohoId`, `ownerZohoId`,
`requiredMoreWorker`, `anotherContractorNeeded`.
**`ContractorsbyArea`** — denormalised worker-by-suburb view.
Plus duplicate copies of `Document`, `Category`, `Subcategory`, `CategoryDocument` and
`SubcategoryDocument`.
