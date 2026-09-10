# Phase 1 — Domain vocabulary

Source: `prisma/auth-schema.prisma` (21 models, 10 enums, the live schema) and
`prisma/schema.prisma` (8 models, 0 enums, the legacy schema). Line citations are to those
two files unless stated.

## 1.1 Models — the primary schema (`auth-schema.prisma`)

| Model / table | The real-world thing | Created by whom, when | Mutated by | Deleted? |
|---|---|---|---|---|
| `User` → `users` (`:125-156`) | A login account. Carries exactly one role and one status. | Self-service signup, one route per role (`api/auth/register-async`, `.../register/client`, `.../register/coordinator`); admins are created only by CLI script (`scripts/create-admin-user.ts`) | Login writes `lastLoginAt`, `failedLoginAttempts`, `accountLockedUntil` (`src/lib/auth.config.ts:143-146`); admin writes `status` (`api/admin/contractors/[id]/status`) | No delete path in any route. Cascades to profiles if ever deleted |
| `WorkerProfile` → `worker_profiles` (`:203-260`) | A support worker's public listing and onboarding record. 33 columns. The system's centre of gravity. | Created in the same statement as the worker's `User` (`src/lib/workers/workerRegistrationProcessor.ts:82-111`) | ~20 worker-side routes and 10 service files; admin sets `isPublished` (`api/admin/compliance/[id]/publish`) | No delete path |
| `WorkerAdditionalInfo` → `worker_additional_info` (`:414-439`) | The optional, marketing-facing half of a worker profile: work history, education, languages, cultural background, religion, interests, availability, **bank account**. | Created lazily on first save of any "additional info" section | `src/services/worker/additionalInfo.service.ts`, `availability.service.ts`, `experience.service.ts` | Cascade with profile only |
| `WorkerService` → `worker_services` (`:329-347`) | One service category a worker offers, with its chosen subcategories as arrays. Unique per `(worker, category)` (`:341`). | At registration from the signup form's service picks (`workerRegistrationProcessor.ts:134-198`), then edited in the services wizard | `src/services/worker/workerServices.service.ts` | Replaced wholesale on edit |
| `VerificationRequirement` → `verification_requirements` (`:158-191`) | **One compliance document obligation for one worker** — its type, whether it is mandatory, its uploaded file, its review status, its expiry. This is the compliance ledger. | Generated per worker from the document catalogue; rows appear on upload (`api/compliance/upload`) | Worker uploads; admin approves / rejects / resets / sets expiry (4 admin routes) | Row deleted on identity-document removal (`api/worker/identity-documents`), blob left behind |
| `ClientProfile` → `client_profiles` (`:48-63`) | A person arranging support — either for themselves or on behalf of someone. Stores name, mobile, and a self-managed flag. **No address.** | Self-service signup (`api/auth/register/client`) | `api/client/...` routes | No delete path |
| `CoordinatorProfile` → `coordinator_profiles` (`:65-80`) | A support coordinator acting for one or more participants, optionally under an organisation, with the `clientTypes` they serve. **No address.** | Self-service signup (`api/auth/register/coordinator`) | `api/coordinator/profile` | No delete path |
| `Participant` → `participants` (`:82-108`) | **The person who actually receives support.** Holds date of birth, location, gender, `conditions String[]` (health data), funding type, relationship to the account holder. | Created with the client's account (`api/auth/register/client:76-88`) or from a client/coordinator dashboard (`api/client/participants`) | `api/client/participants/[id]`, and via a service-request update | `userId onDelete: SetNull` (`:101`) — **the row survives account deletion as ownerless health data** |
| `ServiceRequest` → `service_requests` (`:528-548`) | **A request for support against a named participant** — what services, where, when, and which workers were shortlisted or assigned. The demand-side transaction. | Client or coordinator, from the dashboard (`api/client/service-request`) | Client/coordinator edits; worker selection (`.../select-worker`); reactivation (`.../reactivate`); an external webhook (`.../action-webhook`) | Never deleted — `CANCELLED` and `ARCHIVED` statuses instead |
| `Job` → `jobs` (`:349-390`) | **A recruitment vacancy mirrored from a Zoho CRM lead.** Not a marketplace job — a Remonta staffing requisition. Keyed on `zohoId`. | The Zoho sync only (`api/sync-jobs`) — no human creates one in the product | Same sync; `active: false` when it leaves the source stage | Never deleted (`docs/Zoho_Jobs_To_DB.md:737`) |
| `JobApplication` → `job_applications` (`:392-407`) | A worker's application to a mirrored vacancy. Unique per `(job, worker)` (`:402`). | Worker (`api/worker/jobs/apply`) | Status only | No delete path |
| `AuditLog` → `audit_logs` (`:32-46`) | A security/behaviour event record. | Login success, login failure, and each registration | Append-only | No retention policy |
| `Document` (`:262-275`) | **A named compliance artefact the business requires** — "Police Check", "100 Points of ID". Catalogue, not per-worker. | No seed script exists in the repo; inserted by hand | — | — |
| `Category` (`:277-285`) | **A service line** a worker can offer, e.g. "Support Worker", "Nursing Services". `requiresQualification` marks the gated ones. | Hand-inserted | — | — |
| `Subcategory` (`:287-298`) | A specialisation within a service line; `requiresRegistration` names the external register ("AHPRA"). | Hand-inserted | — | — |
| `CategoryDocument` (`:300-314`) | **The rule linking a service line to a document it requires** — with `documentType` (required / optional / conditional) and a `conditionKey` for "only if the worker does X". | Hand-inserted | — | — |
| `SubcategoryDocument` (`:316-327`) | The same rule at specialisation level (e.g. AHPRA for an OT). | Hand-inserted | — | — |
| `Session` → `sessions` (`:110-122`) | **Dead.** Sessions are JWTs (`src/lib/auth.config.ts:250`) and no adapter is installed. Table can never be written. Its `impersonatedBy` column shows impersonation was once meant to be server-side. | — | — | — |
| `Account` → `accounts` (`:12-30`) | **Dead.** OAuth provider links; only a credentials provider exists. | — | — | — |
| `VerificationToken` → `verification_tokens` (`:193-201`) | Repurposed: the **only** live use is one-time admin impersonation tokens, keyed `impersonation:<email>` (`src/lib/auth.config.ts:30`). Never used for email verification. | `api/admin/impersonate` | — | Consumed and deleted on use (`auth.config.ts:57`) |
| `worker_services_backup_20260108` (`:442-454`) | A dated backup table checked into the production schema. Not a domain concept. | — | — | — |

## 1.2 Models — the legacy schema (`schema.prisma`), and what they tell us

This second schema is a **prior product concept**, not a second product. Evidence:

| Model | Reading | Live? |
|---|---|---|
| `ContractorProfile` (`schema.prisma:11-54`) | A **CRM-sourced** worker directory entry, keyed on `zohoContactId @unique` (`:13`) with `lastSyncedAt` (`:35`) and a soft-delete `deletedAt` (`:38`). Its fields (`titleRole`, `yearsOfExperience`, `aboutYou`, `qualificationsAndCertifications`, `whatMakesBusinessUnique`, `funFact`, `hobbiesAndInterests`) are **the same profile concept as `WorkerProfile`, sourced from Zoho instead of from the worker.** | Read by `api/contractors` and `api/contractors/[id]` (`api/contractors/route.ts:301,350`), rendered on `/remontaadmin/findsupport`. **No code in the repo ever writes it** — the writer is external (see the missing `API_SYNC_CONTRACTORS.md`, Phase 0). |
| `ContractorsbyArea` (`schema.prisma:56-66`) | A denormalised "workers in this suburb" list: `workerName`, `suburbState`, `image`, `bio`. A marketing/SEO directory shape. | **Zero references anywhere in `src/`.** Dead. |
| `Job` (`schema.prisma:68-114`) | **A different `Job` from the live one.** Sourced from Zoho *Deals*, and it carries the *participant's* matching attributes: `disabilities`, `behaviouralConcerns`, `culturalConsiderations`, `language`, `religion`, `age`, `gender`, `hobbies`, `relationshipToParticipant`, plus `requiredMoreWorker` and `anotherContractorNeeded`. | Superseded. The live `Job` (`auth-schema.prisma:349-390`) sourced from Zoho *Leads* keeps only `status/recruitmentTitle/service/city` and **drops every participant-matching field.** |
| `Document`, `Category`, `Subcategory`, `CategoryDocument`, `SubcategoryDocument` | Byte-for-byte the same concepts as in the live schema. Pure duplication. | Duplicated |

**The single most business-relevant fact in this phase.** The two `Job` models are the
same product concept modelled twice, and the newer one is **poorer**. The old model
carried the participant's disability, behavioural, cultural, language, religion, age,
gender and hobby attributes onto the vacancy — i.e. **enough information to match a worker
to a participant**. The live model carries none of them. Whatever matching intelligence
the first design intended was dropped when the source moved from Deals to Leads. Question
for the founders: was matching-by-participant-attributes abandoned deliberately, or lost?

### Duplicate concepts across the two schemas — questions, not defects

| Concept | Modelled as | Question for the business |
|---|---|---|
| A support worker | `WorkerProfile` (worker-authored) **and** `ContractorProfile` (CRM-authored) | Are these the same people? Is `/remontaadmin/findsupport` still used, and is anything still syncing into `contractor_profiles`? |
| A vacancy | `Job` ×2, structurally different, one per schema | Which is the source of truth in production? |
| The document catalogue | `Document`/`Category`/`Subcategory`/`CategoryDocument`/`SubcategoryDocument` ×2 | — (mechanical duplication; audit DB-03) |
| A worker's own name for their trade | `WorkerProfile` has no `titleRole`; `ContractorProfile` does | Was "title/role" dropped from the self-service profile on purpose? |

## 1.3 Enums — the domain's controlled vocabulary

Every value is listed. An enum is a decision someone made.

**`UserRole`** (`:495-500`) — 4 values: `WORKER`, `CLIENT`, `COORDINATOR`, `ADMIN`.
There is no `SUPER_ADMIN`, yet two admin routes gate on one (audit API-02). There is no
role for Remonta's own operations staff distinct from `ADMIN`.

**`AccountStatus`** (`:456-461`) — 4 values: `ACTIVE`, `SUSPENDED`, `LOCKED`,
`PENDING_VERIFICATION`. **All three signup paths write `ACTIVE` directly**
(`workerRegistrationProcessor.ts:86`, `register/client/route.ts:65`,
`register/coordinator/route.ts:109`) — `PENDING_VERIFICATION` is never written by any
code. The business decided at some point that accounts should await verification, and
then decided not to.

**`VerificationStatus`** (`:502-508`) — 5 values: `NOT_STARTED`, `IN_PROGRESS`,
`PENDING_REVIEW`, `APPROVED`, `REJECTED`. **This is the worker's compliance state — the
gate on being listed.** Note it is a declared Prisma enum that the column does not use:
`WorkerProfile.verificationStatus` is `String @default("NOT_STARTED")` (`:233`), so the
database does not enforce the vocabulary.

**`RequirementStatus`** (`:487-493`) — 5 values: `PENDING`, `SUBMITTED`, `APPROVED`,
`REJECTED`, `EXPIRED`. Per-document review state. `EXPIRED` implies a recurring
re-verification obligation.

**`DocumentCategory`** (`:480-485`) — 4 values: `PRIMARY`, `SECONDARY`, `WORKING_RIGHTS`,
`SERVICE_QUALIFICATION`. `PRIMARY`/`SECONDARY` are the Australian 100-point
identity-check tiers; `WORKING_RIGHTS` is visa/citizenship evidence; the fourth is
service-specific credentials. **This enum is the compliance obligation set in miniature.**

**`ServiceRequestStatus`** (`:550-557`) — 6 values: `PENDING`, `MATCHED`, `ACTIVE`,
`COMPLETED`, `CANCELLED`, `ARCHIVED`. The demand-side lifecycle. `MATCHED` sits between
request and delivery: **someone must match.**

**`FundingType`** (`:519-525`) — 5 values: `NDIS`, `AGED_CARE`, `INSURANCE`, `PRIVATE`,
`OTHER`. **Decisive for positioning: the system was built for four funding regimes, not
only NDIS.** Aged care and insurance (e.g. workers' compensation / CTP) are separate
markets with separate rules. Whether they were ever pursued is not derivable.

**`AuditAction`** (`:463-478`) — 14 values: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`,
`PASSWORD_CHANGE`, `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_SUCCESS`, `EMAIL_CHANGE`,
`PROFILE_UPDATE`, `ACCOUNT_LOCKED`, `ACCOUNT_UNLOCKED`, `EMAIL_VERIFIED`, `ROLE_CHANGE`,
`IMPERSONATION_START`, `IMPERSONATION_END`. **Only 3 are ever written** (audit XC-02) —
`LOGIN_SUCCESS` (also misused for registration, `workerRegistrationProcessor.ts:210`),
`LOGIN_FAILED`, and nothing else. Eleven declared audit events, including
`IMPERSONATION_START`/`END` for a *live* impersonation feature, are never recorded.

**`JobApplicationStatus`** (`:409-412`) — **only 2 values: `PENDING`, `WITHDRAWN`.**
There is no `ACCEPTED`, `SHORTLISTED` or `REJECTED`. A worker can apply and un-apply;
**the product has no way to record the outcome of an application.** Outcomes happen in
Zoho, outside the system.

**`RepresentativeType`** (`:510-517`) — 6 values: `SELF`, `PARENT`, `GUARDIAN`,
`FAMILY_MEMBER`, `LEGAL_REPRESENTATIVE`, `OTHER`. **Referenced by no model.** Orphan.
The live equivalent is a free-text `Participant.relationshipToClient` (`:90`) plus a
*third* vocabulary in zod: `PARENT`, `LEGAL_GUARDIAN`, `SPOUSE_PARTNER`, `CHILDREN`,
`OTHER`, `MYSELF` (`src/schema/registrationSchema.ts:84`). **Three vocabularies for
"who is this person to the participant".** High-churn business concept; question for
the founders.

## 1.4 Relations — the business relationships encoded

- A `User` has **at most one** worker, client or coordinator profile (`:142-144`) — a
  person cannot be both a worker and a client. One account, one side of the market.
- A `User` has **many** `Participant`s (`:145`) — one account can arrange support for
  several people. This is what makes the coordinator role work.
- A `Participant` has **many** `ServiceRequest`s (`:99`) — repeat demand per person.
- A `ServiceRequest` belongs to **exactly one** `Participant` (`:542`) and carries a
  separate `requesterId` (`:530`) that is **not a foreign key** — so the record of "who
  asked" is unenforced text.
- A `WorkerProfile` has many `VerificationRequirement`s (`:236`), many `WorkerService`s
  (`:239`), and at most one `WorkerAdditionalInfo` (`:237`).
- A `Category` has many `Subcategory`s and many `CategoryDocument`s (`:283-284`) — the
  catalogue is a two-level service tree with document rules hung off both levels.
- A `Job` has many `JobApplication`s (`:379`); `JobApplication.workerId` "references
  `User.id`" **by comment only** (`:395`) — no foreign key. Applications can outlive the
  worker.
- **There is no relation between `ServiceRequest` and `WorkerProfile`.** The chosen
  workers are `selectedWorkers String[]` and `assignedWorker Json?` (`:536-537`). The
  marketplace's central match is stored as untyped, unjoined, unconstrained data. This is
  the clearest signal that matching is not a product function — it is a staff function.

## 1.5 Reference and seed data — the product's catalogue

No seed script exists. The catalogue lives in the database (inserted by hand) and is
mirrored in TypeScript source. What the source files declare:

**Nine service lines** (`src/config/serviceQualificationRequirements.ts:21-149`,
`src/config/serviceDocumentRequirements.ts:28-233`):
Support Worker · Support Worker (High Intensity) · Therapeutic Supports ·
Nursing Services · Cleaning Services · Home and Yard Maintenance · Home Modifications ·
Fitness and Rehabilitation · Personal Trainer.

**Credential rules per service line** (`src/config/serviceDocumentRequirements.ts`) —
this table *is* the marketplace's quality bar:

| Service line | Mandatory credentials | Citation |
|---|---|---|
| Support Worker | none — qualification and training both optional | `:28-45` |
| Support Worker (High Intensity) | highest relevant qualification certificate | `:48-85` |
| Cleaning Services / Home and Yard Maintenance | none | `:89-99` |
| Nursing Services | AHPRA registration + nursing qualification | `:102-118` |
| Personal Trainer | professional association membership + fitness qualification | `:122-138` |
| Therapeutic Supports | professional association membership (AHPRA for OT, orthoptist, physio, podiatrist, psychologist) + qualification + **professional indemnity insurance** | `:142-172`, `:242-286` |
| Home Modifications | trade qualification + trade licence + **public liability insurance, minimum $10M** | `:175-199` |
| Fitness and Rehabilitation | association membership + qualification + First Aid & CPR; public liability optional | `:202-233` |

**Ten mandatory-for-everyone compliance artefacts**
(`src/config/complianceDocumentMapping.ts:44-146`, `src/config/mandatoryRequirementsSetupSteps.ts:27-70`):
100 Points of ID · ABN/TFN engagement election · NDIS Worker Screening Check ·
National Police Check · Working with Children Check · NDIS Worker Orientation Module ·
New Worker NDIS Induction Module · Supporting Effective Communication ·
Supporting Safe and Enjoyable Meals · Infection Control Training · Right to Work
evidence · Code of Conduct (2 parts).

**Worker skill taxonomy** (`src/config/serviceSkills.ts`, 27 528 B) — four service lines
have skill trees; ~30 skill groups in all. Support Worker alone has eleven:
Personal & Daily Living Support · Health & Medication Support · Manual Handling &
Physical Support · Complex & Behavioural Support · Mental Health & Cognitive Support ·
Clinical & High-Needs Experience · Age-Specific Experience · Communication & Cultural
Support · Transport & Community Engagement · Compliance & Reporting · Household &
Practical Support (`:24-340`). Cleaning, Home & Yard Maintenance and Nursing have their
own trees (`:370,637,842`). **No skill tree exists for Therapeutic Supports, Home
Modifications, Fitness and Rehabilitation or Personal Trainer** — the four
highest-credential service lines are the least developed in the product.

**Eight concrete personal-care service offerings** a Support Worker declares
(`src/config/serviceOfferings.ts:19-64`): assistance with eating · assist with
medication · exercise assistance · hoist and transfer · light massage · manual transfer
and mobility · showering, dressing & grooming · toileting. `getServiceOfferings` returns
these **only** for "Support Worker" and "Support Worker (High Intensity)"; every other
service line returns an empty list (`:73-83`).

**Location data:** `src/lib/data/australianPostcodes.ts` (22 896 B) — Australian
postcode/suburb reference, compiled as source. Geography is Australia only.

**Legal content shipped as source:** `src/config/contractContent.ts` (20 603 B) — the
worker engagement contract; `src/config/codeOfConductContent.ts` (11 217 B) — the code of
conduct workers must accept. **Both are versioned only by git**, with no version field
anywhere in the schema, so there is no record of which contract text a given worker
accepted. Compliance question.

## 1.6 Glossary — use these terms consistently

| Term | Plain-English meaning | Where it lives |
|---|---|---|
| **Worker** (also "contractor", "support worker") | An individual offering paid disability or care support, engaged as a contractor. Called *worker* in the schema, *contractor* in every admin route and page. | `WorkerProfile` (`auth-schema.prisma:203`); admin UI at `/admin/contractors` |
| **Client** | The account holder arranging support — the participant themselves, or a family member / representative. | `ClientProfile` (`:48`) |
| **Support coordinator** | A funded professional who arranges support for several participants, usually inside an organisation. | `CoordinatorProfile` (`:65`); UI path `/dashboard/supportcoordinators` |
| **Participant** | The person who receives the support. Distinct from the account holder. | `Participant` (`:82`) |
| **Administrator** | Remonta staff. Verifies documents, publishes profiles, suspends accounts, impersonates users, runs reports. | `UserRole.ADMIN` (`:499`) |
| **Service line / category** | One of nine kinds of support a worker can offer. | `Category` (`:277`); `src/config/serviceQualificationRequirements.ts:21` |
| **Specialisation / subcategory** | A named specialism within a service line, sometimes tied to an external register. | `Subcategory` (`:287`) |
| **Worker service** | The record that a given worker offers a given service line, with chosen specialisations. | `WorkerService` (`:329`) |
| **Skill** | A self-declared competency inside a service line, from a fixed taxonomy. Not verified. | `src/config/serviceSkills.ts` |
| **Service offering** | A specific task a worker will perform (e.g. toileting). Support Worker lines only. | `src/config/serviceOfferings.ts:19` |
| **Compliance document / requirement** | One document obligation for one worker, with a review status and optional expiry. | `VerificationRequirement` (`:158`) |
| **Document catalogue** | The business's master list of document types and which service lines require them. | `Document` + `CategoryDocument` + `SubcategoryDocument` (`:262-327`) |
| **Verification status** | The worker's overall compliance state; gates publication. | `WorkerProfile.verificationStatus` (`:233`) |
| **Published** | Whether a worker appears in demand-side search results. Set by an administrator. | `WorkerProfile.isPublished` (`:232`) |
| **Setup progress** | A JSON blob tracking which onboarding sections a worker has completed. Recomputed on read because the stored value is not trusted (audit FE-01). | `WorkerProfile.setupProgress` (`:230`) |
| **Service request** | A structured request for support for a named participant. | `ServiceRequest` (`:528`) |
| **Selected workers** | The shortlist a client/coordinator picked for a request. Untyped array. | `ServiceRequest.selectedWorkers` (`:537`) |
| **Assigned worker** | The worker actually engaged. Untyped JSON. | `ServiceRequest.assignedWorker` (`:536`) |
| **Job** | A recruitment vacancy mirrored from Zoho CRM. Not a marketplace listing. | `Job` (`:349`); `docs/Zoho_Jobs_To_DB.md` |
| **Job application** | A worker's expression of interest in a mirrored vacancy. Can only be pending or withdrawn. | `JobApplication` (`:392`) |
| **Funding type** | Which payer regime funds the support: NDIS, aged care, insurance, private or other. | `FundingType` (`:519`) |
| **Worker engagement type** | Whether the worker is engaged under an ABN or a TFN, and whether they have signed. | `WorkerProfile.abn` JSON (`:229`); `src/schema/workerProfileSchema.ts:173-183` |
| **Impersonation** | An administrator signing in as another user via a one-time token. | `api/admin/impersonate`; `src/lib/auth.config.ts:28-69` |
| **Share token** | An encrypted link letting someone view a worker's profile without an account. | `api/share/generate`; `src/lib/shareToken.ts` |

## 1.7 Where the NDIS number actually lives — correction worth recording

`Participant` has no NDIS number field. The number **is** collected, but only inside the
service request's free-form `details` JSON:
`src/schema/serviceRequestSchema.ts:72-81` defines `ndisDetails` with `ndisNumber`,
`managementType`, `planManagerName`, `invoiceEmail`, `emailToCC`, `planStartDate`,
`planEndDate` — all optional, all stored in `ServiceRequest.details Json` (`:533`).

Consequences, all derivable: a participant's NDIS number is not queryable, not unique,
not required, and is duplicated across every request for that person. The plan-management
and invoicing details are captured **but there is no invoicing code anywhere in the
repository** (Phase 10). The business collects billing inputs and does nothing with them
in-product.
