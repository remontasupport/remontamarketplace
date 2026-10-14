# Domain Entities -- unit `edit-profile` (U2)

The bodies of the 17 write entries, the migration, the groups and the option lists. Every string is trimmed and
bounded; every list value is an enumeration from `profileOptions.ts` (R7); every body is a strict object (P9).
U1's `profileSchema` (E1) is the read; the sections below are what its parts look like after a write.

## E1 The migration (C10; FR-PI-04, NFR-09)

`packages/db/prisma/migrations/<ts>_worker_home_address/migration.sql`, expand-only:

| Column | Type | Note |
|---|---|---|
| `worker_profiles.homeStreetLine` | `text null` | R3.1; never in a client-facing select |
| `worker_profiles.homeLocalityId` | `integer null references au_localities(id) on delete restrict` | + index `worker_profiles_homeLocalityId_idx` |

Prisma: `homeStreetLine String?`, `homeLocalityId Int?`, `homeLocality AuLocality? @relation("WorkerHomeLocality",
fields: [homeLocalityId], references: [id], onDelete: Restrict)`; `AuLocality` gains `workerHomes WorkerProfile[]
@relation("WorkerHomeLocality")`. No data change; no down migration ever needed (NFR-10).

## E2 The entries and their bodies (C1 additions)

| Entry | Method, path | Body | Response (200) | Audit | maxBodyKb |
|---|---|---|---|---|---|
| `putName` | PUT `/v1/worker/profile/name` | `NameBody` | `NameBody` | `WORKER_NAME_CHANGED` | 4 |
| `putBio` | PUT `/v1/worker/profile/bio` | `BioBody` | `BioBody` | `WORKER_BIO_CHANGED` | 4 |
| `putPersonalInfo` | PUT `/v1/worker/profile/personal-info` | `PersonalInfoBody` | `PersonalInfoBody` | `WORKER_PERSONAL_INFO_CHANGED` | 4 |
| `putAbn` | PUT `/v1/worker/profile/abn` | `AbnBody` | `AbnView` | `WORKER_ABN_CHANGED` | 4 |
| `putHomeAddress` | PUT `/v1/worker/profile/home-address` | `HomeAddressInput` | `HomeAddress` | `WORKER_HOME_ADDRESS_CHANGED` | 4 |
| `putServiceArea` | PUT `/v1/worker/profile/service-area` | `ServiceAreaInput` | `ServiceArea` (U1) | `WORKER_SERVICE_AREA_CHANGED` | 4 |
| `createPhotoTicket` | POST `/v1/worker/photos/tickets` | `photoTicketRequestSchema` (registration's) | 201 `photoTicketResponseSchema` | `WORKER_PHOTO_TICKET` (user limit 10/min) | 1 |
| `confirmPhoto` | POST `/v1/worker/photos` | `{ uploadId: uuid, slot: 'main' \| 'additional' }` | 201 `Photos` | `WORKER_PHOTO_ADDED` | 1 |
| `makeMainPhoto` | POST `/v1/worker/photos/main` | `{ url: string ≤ 2048 }` | `Photos` | `WORKER_PHOTO_MAIN` | 4 |
| `removePhoto` | POST `/v1/worker/photos/remove` | `{ url }` | `Photos` | `WORKER_PHOTO_REMOVED` | 4 |
| `putAvailability` | PUT `/v1/worker/availability` | `AvailabilityBody` | `AvailabilityBody` | `WORKER_AVAILABILITY_CHANGED` | 16 |
| `putExperience` | PUT `/v1/worker/experience` | `ExperienceBody` | `ExperienceBody` | `WORKER_EXPERIENCE_CHANGED` | 16 |
| `putJobHistory` | PUT `/v1/worker/job-history` | `JobHistoryBody` | `JobHistoryBody` (with ids) | `WORKER_JOB_HISTORY_CHANGED` | 16 |
| `putEducation` | PUT `/v1/worker/education` | `EducationBody` | `EducationBody` (with ids) | `WORKER_EDUCATION_CHANGED` | 16 |
| `putAdditionalInfo` | PUT `/v1/worker/additional-info/:group` | `AdditionalInfoBody` (union on `group`) | the group's fields | `WORKER_ADDITIONAL_INFO_CHANGED` | 16 |
| `putBankAccount` | PUT `/v1/worker/bank-account` | `BankAccountBody` | `MaskedBankAccount` (U1) | `WORKER_BANK_ACCOUNT_CHANGED` | 4 |

All `workerWrite(audit, { maxBodyKb })` (U1 R8.1): WORKER only, 60/min per user, 120/min per IP, `no-store`.
The ticket entry adds a per-user 10/min rule. The `audit` values join `AuditAction` in `packages/db`
(an enum? -- today `audit` is a string checked by regex; the audit table stores the string; no enum change).

## E3 The bodies

```ts
NameBody            { firstName: Name; middleName: Name | null; lastName: Name }
  Name = string, trim, 1..100, /^[\p{L}][\p{L}\p{M} '-]*$/u
BioBody             { bio: string, trim, 1..2000, no control chars but \n }
PersonalInfoBody    { dateOfBirth: IsoDate (YYYY-MM-DD, real date, age 16..100 at the write); gender: GENDERS; hasVehicle: 'Yes' | 'No' }
AbnBody             { abn: string -> digits only after removing spaces, /^\d{11}$/, abnChecksum }
AbnView             { type: 'abn'; value: string(11 digits); signed: boolean }
HomeAddressInput    { streetLine: string, trim, 1..120, printable; localityId: int > 0 }
HomeAddress         HomeAddressInput & { suburb: string; state: string; postcode: string }
ServiceAreaInput    { localityId: int > 0; travelRadiusKm: int 1..500 }
ServiceArea         { localityId; label; travelRadiusKm; precision: 'LOCALITY' | 'ADDRESS' }      (U1)
Photos              { main: string | null; additional: string[] (≤ 2) }
AvailabilityBody    { slots: Slot[] (0..28) }   Slot = { day: DAYS; startMinute: int 0..1440; endMinute: int 0..1440 }   + R2.7 (refine)
ExperienceBody      { domains: Domain[] (0..5, unique domain) }
  Domain = { domain: CARE_DOMAINS; isProfessional: boolean; isPersonal: boolean; specificAreas: string[] (0..3, ⊆ experienceAreasOf(domain), unique);
             otherAreas: string[] (0..10, each trim 1..60); description: string | null (trim 1..1000) }   + at least one of the two booleans
JobHistoryBody      { entries: Job[] (0..20) }
  Job = { jobTitle: Text100; company: Text100; startMonth: MONTHS; startYear: Year; endMonth: MONTHS | null; endYear: Year | null; currentlyWorking: boolean }
  Text100 = string trim 1..100; Year = int 1950..currentYear   + R2.9 (refine: currently ⇒ no end; else both and end ≥ start)
EducationBody       { entries: Course[] (0..20) }
  Course = { institution: Text100; qualification: Text100; startMonth; startYear; endMonth; endYear; currentlyStudying: boolean }   + R2.10
AdditionalInfoBody  = discriminated union on group:
  { group: 'good-to-know'; lgbtqiaSupport: boolean }
  { group: 'languages'; languages: LANGUAGES[] (0..20, unique) }
  { group: 'cultural-background'; culturalBackground: CULTURAL_BACKGROUNDS[] (0..20, unique) }
  { group: 'religion'; religion: RELIGIONS[] (0..20, unique) }
  { group: 'interests'; interests: INTERESTS[] (0..20, unique) }
  { group: 'about-me'; uniqueService: UNIQUE_SERVICES[] (1..10, unique); funFact: string trim 50..1000 }
  { group: 'preferences'; workPreferences: WORK_PREFERENCES[] (0..20, unique) }
  { group: 'personality'; personality: PERSONALITIES; nonSmoker: boolean; petFriendly: boolean }
BankAccountBody     { accountName: Text100; bankName: Text100; bsb: string -> digits after removing one dash, /^\d{6}$/; accountNumber: /^\d{6,10}$/ }
MaskedBankAccount   { accountName; bankName; bsbLast3; accountNumberLast3 }                               (U1)
```

The read's responses for job history and education carry `id` (U1 E1); the bodies do not: a replace assigns new ids.

## E4 The groups and the option lists (R7)

`packages/schemas/src/data/profileOptions.ts`:

| List | Source today | Count |
|---|---|---|
| `LANGUAGES` | `LanguagesSection.tsx` (`LANGUAGES` + `AUSLAN`) | 32 |
| `CULTURAL_BACKGROUNDS` | `CulturalBackgroundSection.tsx` | 21 |
| `RELIGIONS` | `ReligionSection.tsx` | 15 |
| `INTERESTS` | `InterestsHobbiesSection.tsx` | as listed there |
| `WORK_PREFERENCES` | `MyPreferencesSection.tsx` | 5 |
| `UNIQUE_SERVICES` | `constants/uniqueServices.ts` (the category items, flattened) | as listed there |
| `PERSONALITIES` | `PersonalitySection.tsx` / today's schema | 2 |
| `GENDERS` | today's schema | 2 |
| `MONTHS` | the job history/education pickers | 12 |
| `DAYS` | `DayOfWeek` | 7 |
| `ADDITIONAL_INFO_GROUPS` | R7.2 | 8 |

Values are copied exactly (a test compares each list with the component's array before PR 4 deletes it). The
admin search's `languages` filter keeps matching stored strings; a list change later is a data decision.

## E5 Source columns per section

| Section | Table and columns |
|---|---|
| name | `worker_profiles.firstName, middleName, lastName` |
| bio | `worker_profiles.introduction` |
| personal info | `worker_profiles.dateOfBirth, gender, hasVehicle` (`age` untouched) |
| ABN | `worker_profiles.abn` JSON |
| home address | `worker_profiles.homeStreetLine, homeLocalityId` (E1) |
| service area | `worker_locations` (kind HOME) + the six legacy columns |
| photos | `worker_profiles.photos, additionalPhotos`; `registration_photo_uploads` rows; the outbox |
| hours | `worker_availability` (dayOfWeek, startMinute, endMinute, sortOrder) |
| experience | `worker_experience` (domain, isProfessional, isPersonal, specificAreas, otherAreas, description) |
| work history | `worker_job_history` (jobTitle, company, startMonth, startYear, endMonth, endYear, currentlyWorking, sortOrder) |
| education | `worker_education` (institution, qualification, the same dates, currentlyStudying, sortOrder) |
| additional info | `worker_additional_info` (languages, culturalBackground, religion, interests, workPreferences, lgbtqiaSupport, nonSmoker, petFriendly, personality, uniqueService, funFact) |
| bank account | `worker_additional_info.bankAccount` JSON |

## E6 Audit actions and log line

Audit: the action, `userId`, `impersonatorId`, `{ profileId, section }` as the detail; never a value. Log: one
info line per write `{ entry, durationMs, userId }`; the redaction list (U1) already covers `bankAccount`, `bsb`,
`accountNumber`, `streetLine`; `abn` is added (the value is personal).
