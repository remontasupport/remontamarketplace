# API Documentation — in-scope surface (switch-over map)

Everything `apps/app` exposes today for the six first-release domains. It is the **switch-over surface** for FR-MIG-01: each row must be redirected to `apps/api`, kept temporarily, or retired. Paths are relative to `apps/app/src/`. "SA" = server action.

Legend for **Fate**:
- **→API**: replaced by an `apps/api` endpoint.
- **KEEP**: stays in `apps/app` (C5 A: sign-in screens and NextAuth).
- **RETIRE**: removed (dead or unsafe).

## Identity & Sessions / Account & Access

| Endpoint / action | Method | Purpose | Auth today | Fate |
|---|---|---|---|---|
| `api/auth/[...nextauth]` | * | NextAuth Credentials sign-in, JWT 30 d | — | KEEP (hardened; issues backend tokens) |
| `api/auth/forgot-password` | POST | Reset link (1 h token in `users.resetPasswordToken`) | rate limit 30/min | →API (FR-ACC-02) |
| `api/auth/reset-password` | POST | Consume reset token | token | →API |
| `api/auth/setup-password` | POST | First password for workers on the default password | **none** (H2) | →API with a single-use token |
| `api/auth/send-otp` / `verify-otp` | POST | Stateless HMAC OTP (10 min) | none | →API (FR-ACC-03) |
| `api/auth/check-email` | GET/POST | `{exists}` | none (M9) | RETIRE (US-REG-03) |
| `api/sms/send-verification` / `verify-code` | POST | Twilio code in in-memory Maps | none | RETIRE (unreachable, broken); SMS OTP re-scoped if needed |
| `api/admin/impersonate` | POST/DELETE | Start/end impersonation via 60 s VerificationToken | requireRole ADMIN | →API (FR-ID-07) + NextAuth hook KEEP |
| `api/admin/contractors/[id]/status` | PATCH | Suspend/reactivate (`{isActive}`) | requireAnyRole incl. undefined SUPER_ADMIN | →API (FR-ID-05) |
| `api/admin/users` | GET | List users | requireRole ADMIN | out of scope (J7) — KEEP |
| SA `services/user/account.service.ts` `updateUserEmail` :74, `updateUserPassword` :147, `updateUserPhone` :210 | SA | Account changes | session | →API |

## Registration (J1)

| Endpoint | Method | Purpose | Auth | Fate |
|---|---|---|---|---|
| `api/auth/register-async` | POST | Worker registration (the live path) | rate limit (fails open); CAPTCHA skipped | →API (E2) |
| `api/auth/register` (498 lines) | POST | Legacy worker registration | same | RETIRE (no caller) |
| `api/auth/register/client`, `/coordinator` | POST | Demand-side signup | — | out of scope — KEEP |
| `api/upload/worker-photo` | POST | Registration photo | **none** (M2) | →API (authorised upload) |

## Onboarding (J2)

| Endpoint / action | Purpose | Fate |
|---|---|---|
| SA `services/worker/profile.service.ts`: `updateWorkerName` :47, `updateWorkerPhoto` :191, `updateWorkerAdditionalPhotos` :283, `swapMainPhoto` :337, `updateWorkerBio` :393, `updateWorkerAddress` :482, `updateWorkerPersonalInfo` :614 | Account setup | →API |
| SA `services/worker/additionalInfo.service.ts`: bank :168, work history :269, education :373, good-to-know :473, languages :569, cultural :664, religion :765, interests :865, about me :963, preferences :1066, personality :1164, read :52 | Profile building | →API |
| SA `services/worker/availability.service.ts` :47/:94/:205; `experience.service.ts` :41/:93/:208 | Availability, experience | →API |
| SA `services/worker/workerServices.service.ts` :28/:197/:326/:554/:763 | Services, nursing/therapeutic registration | →API |
| SA `services/worker/compliance.service.ts` `updateWorkerABN` :35 and document helpers | ABN/TFN, documents | →API |
| SA `services/worker/setupProgress.service.ts` `updateSectionCompletion` :33, `getAllCompletionStatusOptimized` :1332 (no auth, M12/M13) | Progress | →API (derived server-side only) |
| SA `services/worker/profilePreview.service.ts` `getWorkerProfilePreview` :80 (**H1**) | Preview | →API (owner-only, no bank data) |
| SA `services/worker/serviceDocuments.service.ts` | Service documents | →API |
| `api/worker/profile/update-step` | Emergency contact, services, qualifications (no zod) | →API |
| `api/worker/profile/[userId]` | Worker's own profile read | →API |
| `api/worker/requirements` | DB-driven requirement list (`Cache-Control: public`, M15) | →API (requirements engine) |
| `api/compliance/upload` | Main document upload (used by `lib/backgroundUploadQueue.ts:105`) | →API |
| `api/upload/identity-documents`, `certificates`, `other-requirements`, `service-documents`, `vehicle-photo` | Per-type uploads (8 upload paths in total) | →API (one upload endpoint) |
| `api/worker/identity-documents` (GET/DELETE), `copy-reference`, `service-documents`, `other-requirements/[id]`, `vehicle-photo`, `compliance-documents` | Document list/delete/copy | →API |
| `api/blob/upload-token` | Client-upload token | RETIRE (no caller; FR-ONB-14) |
| `components/profile-building/sections/IndicativeRatesSection.tsx` | Rates (UI only) | RETIRE (FR-ONB-14) |

## Compliance Verification (J3)

| Endpoint | Method | Auth position | Fate |
|---|---|---|---|
| `api/admin/compliance/pending` | GET | before; **unbounded** | →API (paginated) |
| `api/admin/compliance/compliant` | GET | before; unbounded | →API |
| `api/admin/compliance/[id]` | GET | before; returns public `documentUrl` | →API (short-lived links) |
| `api/admin/compliance/[id]/[documentId]/approve` | POST | **after** DB read (M3) | →API |
| `…/reject` | POST | **after** | →API |
| `…/reset` | POST | **after** | →API |
| `…/update-expiry` | POST | before; no date validation | →API |
| `api/admin/compliance/[id]/publish` | POST | before; no preconditions; writes `'Verified'` | →API (publication rule) |
| `api/admin/verification` + `lib/verification.ts` | GET/POST | before; references non-existent fields | RETIRE (FR-CMP-11) |
| `api/admin/fix-qualifications` | POST | **none** (M1) | RETIRE (FR-CMP-11) |
| `api/categories`, `api/subcategories`, `api/categories/therapeutic-supports/subcategories` | GET | public, Redis-cached | →API (catalogue read), public stays public |

## Notifications
Only two emails exist today: `sendVerificationEmail` (OTP; the template says 15 min, the code says 10) and `sendPasswordResetEmail` (`lib/email.ts:27,105`). `sendWelcomeEmail` :186 is never called. All E6 emails are new.

## Out-of-scope endpoints that read in-scope tables (regression surface, FR-MIG-03)

| Endpoint | Reads | Risk when schema changes |
|---|---|---|
| `api/public/workers` (no auth; used by `apps/web`) | WorkerProfile basic fields, `user.status`, services — **no `isPublished` filter** (H3) | High: public output |
| `api/client/workers`, `…/by-ids` | WorkerProfile, `verificationRequirements` APPROVED (any → "NDIS compliant") | High |
| `api/share/profile` + `lib/profileData.ts` | Profile + requirements + **bankAccount** (H1) | High |
| `api/admin/contractors`, `[id]`, `[id]/pdf`, `inactive`, `admin/filters` (raw SQL `:72-86`) | Requirement status/type, `user.status` | Medium: raw SQL breaks silently |
| `lib/reports.ts`, `api/admin/reports/*` | WorkerProfile, WorkerService | Low |
| Worker dashboard pages/components (`dashboard/worker/*`, `Sidebar.tsx`, `ProfileCompletionReminder.tsx`) | setupProgress, verificationStatus | Medium |
| Dead: `lib/worker-search.ts`, `lib/feature-access.ts` | verificationStatus `'APPROVED'` | None (no importers) |

## Data Models (in-scope, `packages/db/prisma/schema.prisma`)

| Model | Key fields / notes |
|---|---|
| **User** :147 | email @unique; passwordHash (bcryptjs); role UserRole; status AccountStatus @default(ACTIVE); resetPasswordToken @unique + expires; failedLoginAttempts; accountLockedUntil; `updatedAt` isn't `@updatedAt` |
| **WorkerProfile** :225 | `verificationStatus String` (not an enum) :255; `dateOfBirth String?` :237; `gender String?` :238; `age Int?` (goes stale); `abn Json?`; `setupProgress Json?` (4 flags); `photos` / `additionalPhotos` String; lat/long; `isPublished` |
| **VerificationRequirement** :180 | requirementType slug; status RequirementStatus; documentUrl (public); reviewedBy (email string); expiresAt; **(workerProfileId, requirementType) is only an index** :208 |
| **WorkerAdditionalInfo** :444 | `bankAccount Json?` :458 **plaintext**; languages, interests, etc. |
| **Document / Category / Subcategory / CategoryDocument / SubcategoryDocument** :292–:354 | Catalogue tables; **no seeder**, data lives only in the DB |
| **WorkerService** :359 | Category + subcategory arrays |
| **AuditLog** :54 | userId?, action AuditAction, metadata Json; ipAddress/userAgent never populated |
| **Session** :132 | Unused (JWT strategy); has `impersonatedBy` |
| **VerificationToken** :215 | Used for impersonation tokens (60 s) |
| Enums | RequirementStatus :498 (EXPIRED never written); VerificationStatus :513 (orphaned); AccountStatus :467 (LOCKED, PENDING_VERIFICATION never written); UserRole :506; AuditAction :474 (LOGOUT, PASSWORD_CHANGE, EMAIL_CHANGE, ACCOUNT_LOCKED/UNLOCKED never written) |

Not yet built (only in `schema.target.prisma`, a reference, never generated): WorkerPhoto, WorkerServiceCategory/Subcategory, **WorkerBankAccount (`encryptedPayload`)**, the Gender enum, setup booleans, documentId/reviewedById FKs.
