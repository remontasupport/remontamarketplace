// The worker area (worker-profile-api cycle, U1 worker-area, 2026-10-12): the worker's
// own profile behind the api token (role WORKER).
//
// Ownership (R1.1): every entry acts on the profile whose `userId` is the token's
// subject. No entry takes a user id or a profile id in its path, query or body; a
// child row named by id that is not the caller's is 404, never 403 (R1.3).
//
// Every entry is built with workerRead() or workerWrite(audit) (R8.1): the helpers set
// access, bot, the two limits, the body limit and either the private cache (reads) or
// the audit action (writes). A write without an audit action does not compile.
//
// Added per unit: U1 getProfile · U2 the section writes · U3a services · U3b service documents ·
// U4 dashboard and jobs.
import * as z from 'zod'
import { CARE_DOMAINS } from './admin.contract'
import { defineContract } from './define'
import { meta } from './meta'
import { photoTicketRequestSchema, photoTicketResponseSchema } from './registration.contract'
import {
  educationRowParamsSchema,
  jobHistoryRowParamsSchema,
  experienceDomainParamsSchema,
  abnBodySchema,
  abnViewSchema,
  availabilitySchema,
  bankAccountSchema,
  bioSchema,
  citizenshipSchema,
  complianceDocumentSchema,
  confirmComplianceDocumentSchema,
  signContractSchema,
  signedContractSchema,
  confirmServiceDocumentSchema,
  confirmPhotoSchema,
  culturalBackgroundSchema,
  dateOfBirthSchema,
  documentLinkSchema,
  educationSchema,
  educationViewSchema,
  experienceSchema,
  funFactSchema,
  genderSchema,
  goodToKnowSchema,
  homeAddressInputSchema,
  interestsSchema,
  jobHistorySchema,
  jobHistoryViewSchema,
  languagesSchema,
  nameSchema,
  personalitySchema,
  photosSchema,
  photoUrlSchema,
  preferencesSchema,
  religionSchema,
  serviceAreaInputSchema,
  supportActivitiesSchema,
  serviceDocumentParamsSchema,
  serviceDocumentSchema,
  serviceDocumentTicketRequestSchema,
  serviceDocumentTicketResponseSchema,
  serviceRegistrationBodySchema,
  serviceRegistrationParamsSchema,
  serviceRegistrationViewSchema,
  servicesBodySchema,
  vehicleSchema,
} from './worker.sections'

export const WORKER_READ_LIMITS = { user: 120, ip: 300 } as const
export const WORKER_WRITE_LIMITS = { user: 60, ip: 120 } as const
export const WORKER_PRIVATE_CACHE_SECONDS = 60
/**
 * The audit action of every section write (U2): the database's AuditAction enum value. The section
 * and the profile id travel in the audit row's metadata, so one enum value serves every write
 * without a migration per section.
 */
export const PROFILE_UPDATE = 'PROFILE_UPDATE'

/** A role-restricted GET for the worker's own data: per-user and per-IP limits, privately cacheable (R8.1). */
export const workerRead = (opts: { privateCacheSeconds?: number } = {}) =>
  meta({
    access: { roles: ['WORKER'] },
    bot: 'none',
    rateLimit: [
      { per: 'user', limit: WORKER_READ_LIMITS.user, window: '1m' },
      { per: 'ip', limit: WORKER_READ_LIMITS.ip, window: '1m' },
    ],
    maxBodyKb: 1,
    // Personal data: the browser's private cache and ETag/304 only, never a shared cache,
    // never the api's memo (the body is per user).
    privateCacheSeconds: opts.privateCacheSeconds ?? WORKER_PRIVATE_CACHE_SECONDS,
  })

/**
 * A write to the worker's own data: tighter limits, a body limit and a mandatory audit
 * action (R8.1). `limit` lowers the per-user rule for one entry (the photo ticket, U2).
 */
export const workerWrite = (audit: string, opts: { maxBodyKb?: number; limit?: number } = {}) => {
  if (typeof audit !== 'string' || !audit) throw new Error('workerWrite: an audit action is required on every worker write (R8.1)')
  return meta({
    access: { roles: ['WORKER'] },
    bot: 'none',
    rateLimit: [
      { per: 'user', limit: opts.limit ?? WORKER_WRITE_LIMITS.user, window: '1m' },
      { per: 'ip', limit: WORKER_WRITE_LIMITS.ip, window: '1m' },
    ],
    maxBodyKb: opts.maxBodyKb ?? 16,
    audit,
  })
}

// ---- Shared schemas (domain-entities.md E1-E3) -------------------------------------
// Strict objects, every string bounded: nothing unlisted leaves the api (P10).

const str = (max: number) => z.string().max(max)
const isoDate = z.iso.datetime({ offset: true })
const nullableInt = z.number().int().nullable()

export const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const
/** The values the app writes. The column is free text and one legacy row reads "Verified", so the field is a bounded string. */
export const VERIFICATION_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const
export const REQUIREMENT_ITEM_STATUSES = ['missing', 'submitted', 'approved', 'rejected', 'expired'] as const
export type RequirementItemStatus = (typeof REQUIREMENT_ITEM_STATUSES)[number]

/** E2: the four section flags, the overall flag and the sidebar's percentage (R3). */
export const completionSchema = z.strictObject({
  accountDetails: z.boolean(),
  compliance: z.boolean(),
  trainings: z.boolean(),
  services: z.boolean(),
  profileCompleted: z.boolean(),
  percent: z.number().int().min(0).max(100),
})
export type Completion = z.output<typeof completionSchema>

/** E3: one catalogue document the worker's services call for, with where the worker is on it (R4.3). */
export const requirementItemSchema = z.strictObject({
  id: str(80),
  name: str(120),
  requirementType: str(80),
  documentType: z.enum(['REQUIRED', 'OPTIONAL']),
  status: z.enum(REQUIREMENT_ITEM_STATUSES),
  /** U5b: what the setup step shows; absent from an older api, so they default. */
  description: z.string().max(1000).default(''),
  hasExpiration: z.boolean().default(false),
})
export type RequirementItem = z.output<typeof requirementItemSchema>

/** U4e: an insurance or transport document linked to the worker's services ("Other Documents" on the Services pages). */
export const additionalCredentialSchema = z.strictObject({
  id: str(80),
  name: str(120),
  category: z.enum(['INSURANCE', 'TRANSPORT']),
  description: z.string().max(1000),
  documentType: z.enum(['REQUIRED', 'OPTIONAL', 'CONDITIONAL']),
  /** A CONDITIONAL link's question (`hasVehicle`) and the answer that makes it required. */
  conditionKey: str(80).nullable(),
  requiredIfTrue: z.boolean().nullable(),
  status: z.enum(REQUIREMENT_ITEM_STATUSES),
})
export type AdditionalCredential = z.output<typeof additionalCredentialSchema>

/** R2.3: the stored bank account never leaves; the last three digits identify it to its owner. */
export const maskedBankAccountSchema = z.strictObject({
  accountName: str(100),
  bankName: str(100),
  bsbLast3: z.string().regex(/^\d{3}$/),
  accountNumberLast3: z.string().regex(/^\d{3}$/),
})
export type MaskedBankAccount = z.output<typeof maskedBankAccountSchema>

/** R2.5: the HOME worker_locations row joined to au_localities; null when the worker is unplaced. */
export const serviceAreaSchema = z.strictObject({
  localityId: z.number().int(),
  /** "Suburb, ST postcode" */
  label: str(120),
  travelRadiusKm: z.number().int(),
  precision: z.enum(['LOCALITY', 'ADDRESS']),
})

/** R2.4: U2's columns; declared now so clients need no change later, null in U1. */
export const homeAddressSchema = z.strictObject({
  streetLine: str(200),
  localityId: z.number().int(),
  suburb: str(100),
  state: str(10),
  postcode: str(10),
})
export type HomeAddress = z.output<typeof homeAddressSchema>

export const workerServiceSchema = z.strictObject({
  categoryId: str(80),
  categoryName: str(120),
  subcategoryIds: z.array(str(80)).max(50),
  subcategoryNames: z.array(str(120)).max(50),
})
/** U3a: the chosen services as stored, in the order they were first chosen. */
export const servicesViewSchema = z.strictObject({ services: z.array(workerServiceSchema).max(50) })

export const availabilitySlotSchema = z.strictObject({
  day: z.enum(DAYS_OF_WEEK),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(1440),
})

export const experienceRowSchema = z.strictObject({
  domain: z.enum(CARE_DOMAINS),
  isProfessional: z.boolean(),
  isPersonal: z.boolean(),
  specificAreas: z.array(str(120)).max(50),
  otherAreas: z.array(str(120)).max(50),
  description: str(2000).nullable(),
})

export const jobHistoryRowSchema = z.strictObject({
  id: str(40),
  jobTitle: str(200),
  company: str(200),
  startMonth: str(20).nullable(),
  startYear: nullableInt,
  endMonth: str(20).nullable(),
  endYear: nullableInt,
  currentlyWorking: z.boolean(),
})

export const educationRowSchema = z.strictObject({
  id: str(40),
  institution: str(200),
  qualification: str(200),
  startMonth: str(20).nullable(),
  startYear: nullableInt,
  endMonth: str(20).nullable(),
  endYear: nullableInt,
  currentlyStudying: z.boolean(),
})

export const additionalInfoSchema = z.strictObject({
  languages: z.array(str(40)).max(50),
  culturalBackground: z.array(str(80)).max(50),
  religion: z.array(str(80)).max(50),
  interests: z.array(str(80)).max(50),
  workPreferences: z.array(str(80)).max(50),
  lgbtqiaSupport: z.boolean().nullable(),
  nonSmoker: z.boolean().nullable(),
  petFriendly: z.boolean().nullable(),
  personality: str(2000).nullable(),
  uniqueService: z.array(str(200)).max(50),
  funFact: str(1000).nullable(),
})

/** E1: the body of GET /v1/worker/profile. Every field has one source column (R2.2). */
export const profileSchema = z.strictObject({
  id: str(40),
  names: z.strictObject({ firstName: str(100), middleName: str(100).nullable(), lastName: str(100) }),
  mobile: str(40),
  photos: z.strictObject({ main: str(2048).nullable() }),
  bio: str(2000).nullable(),
  personalInfo: z.strictObject({
    dateOfBirth: str(20).nullable(),
    age: nullableInt,
    gender: str(40).nullable(),
    hasVehicle: z.enum(['Yes', 'No']).nullable(),
    languages: z.array(str(40)).max(50),
  }),
  /**
   * D17: the engagement JSON. `type` is `abn` for every new write; `value` is the stored
   * number when there is one (a few rows carry it) and null otherwise; a stored `tfn` is
   * reported with `value: null` so the UI can say "contract on file" without a number.
   */
  abn: z.strictObject({ type: z.enum(['abn', 'tfn']), value: str(20).nullable(), signed: z.boolean() }).nullable(),
  homeAddress: homeAddressSchema.nullable(),
  serviceArea: serviceAreaSchema.nullable(),
  displayRole: str(200),
  verificationStatus: str(40),
  isPublished: z.boolean(),
  completion: completionSchema,
  requirements: z.strictObject({
    mandatory: z.array(requirementItemSchema).max(100),
    trainings: z.array(requirementItemSchema).max(100),
    /** U4e: absent from an api older than this field, so it defaults to none. */
    additional: z.array(additionalCredentialSchema).max(50).default([]),
  }),
  services: z.array(workerServiceSchema).max(50),
  /** U3a: the registrations of the chosen services that carry one (nursing, therapeutic). */
  serviceRegistrations: z.array(serviceRegistrationViewSchema).max(2),
  /** U3b: the worker's SERVICE_QUALIFICATION documents (a removed service's go with it). */
  serviceDocuments: z.array(serviceDocumentSchema).max(200),
  /** U4a: every other requirement row (identity, checks, trainings, contract, Code of Conduct). */
  complianceDocuments: z.array(complianceDocumentSchema).max(200),
  sections: z.strictObject({
    availability: z.array(availabilitySlotSchema).max(100),
    experience: z.array(experienceRowSchema).max(10),
    jobHistory: z.array(jobHistoryRowSchema).max(100),
    education: z.array(educationRowSchema).max(100),
    additionalInfo: additionalInfoSchema.nullable(),
    bankAccount: maskedBankAccountSchema.nullable(),
  }),
  updatedAt: isoDate,
})
export type Profile = z.output<typeof profileSchema>

export const workerContract = defineContract('worker', {
  getProfile: {
    method: 'GET',
    path: '/v1/worker/profile',
    summary: "The signed-in worker's own profile in one read: columns, sections, services, the completion flags and the requirement groups; privately cacheable for a minute with ETag/304.",
    responses: { 200: profileSchema },
    meta: workerRead(),
  },

  // ---- U2 edit-profile: whole-section writes (R1), each returning the section as stored.
  putName: { method: 'PUT', path: '/v1/worker/profile/name', summary: 'Replace the first, middle and last name.', body: json(nameSchema), responses: { 200: nameSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putBio: { method: 'PUT', path: '/v1/worker/profile/bio', summary: 'Replace the bio (1-2,000 characters).', body: json(bioSchema), responses: { 200: bioSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putDateOfBirth: { method: 'PUT', path: '/v1/worker/profile/date-of-birth', summary: 'Replace the date of birth (16-100 years old); nothing else.', body: json(dateOfBirthSchema), responses: { 200: dateOfBirthSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  putGender: { method: 'PUT', path: '/v1/worker/profile/gender', summary: 'Replace the gender; nothing else.', body: json(genderSchema), responses: { 200: genderSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  putVehicle: { method: 'PUT', path: '/v1/worker/profile/vehicle', summary: 'Replace the vehicle-access answer; nothing else.', body: json(vehicleSchema), responses: { 200: vehicleSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  putAbn: { method: 'PUT', path: '/v1/worker/profile/abn', summary: 'Record the ABN (11 digits, ATO checksum); a TFN record is replaced (D17).', body: json(abnBodySchema), responses: { 200: abnViewSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putHomeAddress: { method: 'PUT', path: '/v1/worker/profile/home-address', summary: 'Replace the private home address: a street line and a suburb of ours. Never a client-facing value.', body: json(homeAddressInputSchema), responses: { 200: homeAddressSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putServiceArea: { method: 'PUT', path: '/v1/worker/profile/service-area', summary: 'Move the service area: the suburb clients find the worker at, and the travel radius.', body: json(serviceAreaInputSchema), responses: { 200: serviceAreaSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  createPhotoTicket: { method: 'POST', path: '/v1/worker/photos/tickets', summary: 'A ticket to upload one photo straight to the bucket (the sign-up\'s rules).', body: json(photoTicketRequestSchema), responses: { 201: photoTicketResponseSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1, limit: 10 }) },
  confirmPhoto: { method: 'POST', path: '/v1/worker/photos', summary: 'Confirm an uploaded photo as the profile photo (it replaces the current one); the clean copy follows by outbox.', body: json(confirmPhotoSchema), responses: { 201: photosSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  removePhoto: { method: 'POST', path: '/v1/worker/photos/remove', summary: 'Remove the profile photo, named by its URL.', body: json(photoUrlSchema), responses: { 200: photosSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putAvailability: { method: 'PUT', path: '/v1/worker/availability', summary: 'Replace the week\'s preferred hours (no overlaps, at most 4 slots a day).', body: json(availabilitySchema), responses: { 200: availabilitySchema }, meta: workerWrite(PROFILE_UPDATE) },
  putExperience: { method: 'PUT', path: '/v1/worker/experience', summary: 'Replace the experience per care area.', body: json(experienceSchema), responses: { 200: experienceSchema }, meta: workerWrite(PROFILE_UPDATE) },
  deleteExperience: { method: 'DELETE', path: '/v1/worker/experience/:domain', summary: "Delete one care area from the worker's experience; returns the areas left. Deleting an area that is not there is a 200 (a retry).", pathParams: experienceDomainParamsSchema, responses: { 200: experienceSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  putJobHistory: { method: 'PUT', path: '/v1/worker/job-history', summary: 'Replace the ordered work history.', body: json(jobHistorySchema), responses: { 200: jobHistoryViewSchema }, meta: workerWrite(PROFILE_UPDATE) },
  deleteJobHistoryEntry: { method: 'DELETE', path: '/v1/worker/job-history/:entryId', summary: "Delete one work-history row by its id; returns the rows left in order. A row that is not the caller's, or is already gone, is 404 (never revealed).", pathParams: jobHistoryRowParamsSchema, responses: { 200: jobHistoryViewSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  putEducation: { method: 'PUT', path: '/v1/worker/education', summary: 'Replace the ordered education list.', body: json(educationSchema), responses: { 200: educationViewSchema }, meta: workerWrite(PROFILE_UPDATE) },
  deleteEducationEntry: { method: 'DELETE', path: '/v1/worker/education/:entryId', summary: "Delete one education row by its id; returns the rows left in order. A row that is not the caller's, or is already gone, is 404 (never revealed).", pathParams: educationRowParamsSchema, responses: { 200: educationViewSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  // The additional details: one entry per group (user, 2026-10-14; was one :group entry). Each writes its own columns only.
  putGoodToKnow: { method: 'PUT', path: '/v1/worker/additional-info/good-to-know', summary: 'Replace the LGBTQIA+ support answer.', body: json(goodToKnowSchema), responses: { 200: goodToKnowSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putLanguages: { method: 'PUT', path: '/v1/worker/additional-info/languages', summary: 'Replace the languages spoken.', body: json(languagesSchema), responses: { 200: languagesSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putCulturalBackground: { method: 'PUT', path: '/v1/worker/additional-info/cultural-background', summary: 'Replace the cultural background.', body: json(culturalBackgroundSchema), responses: { 200: culturalBackgroundSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putReligion: { method: 'PUT', path: '/v1/worker/additional-info/religion', summary: 'Replace the religion.', body: json(religionSchema), responses: { 200: religionSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putInterests: { method: 'PUT', path: '/v1/worker/additional-info/interests', summary: 'Replace the interests.', body: json(interestsSchema), responses: { 200: interestsSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putSupportActivities: { method: 'PUT', path: '/v1/worker/additional-info/support-activities', summary: 'Replace the support activities offered (at least one).', body: json(supportActivitiesSchema), responses: { 200: supportActivitiesSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putFunFact: { method: 'PUT', path: '/v1/worker/additional-info/fun-fact', summary: 'Replace the fun fact (50-1,000 characters).', body: json(funFactSchema), responses: { 200: funFactSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putPreferences: { method: 'PUT', path: '/v1/worker/additional-info/preferences', summary: 'Replace the work preferences.', body: json(preferencesSchema), responses: { 200: preferencesSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  putPersonality: { method: 'PUT', path: '/v1/worker/additional-info/personality', summary: 'Replace the personality, the non-smoker and the pet-friendly answers.', body: json(personalitySchema), responses: { 200: personalitySchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
  // ---- U3a services: the chosen services and their registrations.
  putServices: { method: 'PUT', path: '/v1/worker/services', summary: 'Replace the chosen services and sub-categories (checked against the catalogue). A removed service is deleted entirely: its registration, its documents and their files.', body: json(servicesBodySchema), responses: { 200: servicesViewSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 8 }) },
  putServiceRegistration: { method: 'PUT', path: '/v1/worker/services/:categoryId/registration', summary: 'Replace the registration of a chosen nursing or therapeutic service; 404 when the service is not chosen.', pathParams: serviceRegistrationParamsSchema, body: json(serviceRegistrationBodySchema), responses: { 200: serviceRegistrationViewSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 2 }) },
  // ---- U3b service documents: straight to a private bucket by ticket, confirmed, viewed through a short signed link.
  createServiceDocumentTicket: { method: 'POST', path: '/v1/worker/service-documents/tickets', summary: 'A ticket to upload one worker document (PDF or a photo, 50 MB) straight to the private bucket: a service document or (U4a) a compliance document.', body: json(serviceDocumentTicketRequestSchema), responses: { 201: serviceDocumentTicketResponseSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1, limit: 20 }) },
  confirmServiceDocument: { method: 'POST', path: '/v1/worker/service-documents', summary: 'Confirm an uploaded document as one the chosen service calls for -- or, with categoryId other-documents, an insurance or transport document: checked, kept privately, recorded (it replaces the previous file of that type).', body: json(confirmServiceDocumentSchema), responses: { 201: serviceDocumentSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 2 }) },
  deleteServiceDocument: { method: 'DELETE', path: '/v1/worker/service-documents/:documentId', summary: "Delete one of the worker's service documents and its file; 404 when it is not theirs.", pathParams: serviceDocumentParamsSchema, responses: { 200: serviceDocumentParamsSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  getServiceDocumentLink: { method: 'GET', path: '/v1/worker/service-documents/:documentId/link', summary: "A five-minute link to view one of the worker's own service documents.", pathParams: serviceDocumentParamsSchema, responses: { 200: documentLinkSchema }, meta: workerRead({ privateCacheSeconds: 30 }) },
  // ---- U4a compliance documents: the same ticket and bucket; one row per type; viewed through the app's link.
  confirmComplianceDocument: { method: 'POST', path: '/v1/worker/compliance-documents', summary: 'Confirm an uploaded compliance document (identity, a check, a training, the contract, the Code of Conduct): checked, kept privately, recorded for review (it replaces the previous file of that type).', body: json(confirmComplianceDocumentSchema), responses: { 201: complianceDocumentSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 2 }) },
  deleteComplianceDocument: { method: 'DELETE', path: '/v1/worker/compliance-documents/:documentId', summary: "Delete one of the worker's compliance documents and its file; 404 when it is not theirs.", pathParams: serviceDocumentParamsSchema, responses: { 200: serviceDocumentParamsSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  putCitizenship: { method: 'PUT', path: '/v1/worker/compliance/right-to-work/citizenship', summary: 'The Right to Work answer: an Australian citizen needs no document (SUBMITTED); a no takes back a claim with no file.', body: json(citizenshipSchema), responses: { 200: complianceDocumentSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 }) },
  signContract: { method: 'POST', path: '/v1/worker/contract', summary: 'Sign the contract of agreement: the signed PDF (uploaded by ticket) kept privately and the engagement (ABN or TFN) marked signed, together. No tax file number is stored.', body: json(signContractSchema), responses: { 201: signedContractSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 2 }) },
  getDocumentLink: { method: 'GET', path: '/v1/worker/documents/:documentId/link', summary: "A five-minute link to view any of the worker's own documents (a legacy row answers its stored URL).", pathParams: serviceDocumentParamsSchema, responses: { 200: documentLinkSchema }, meta: workerRead({ privateCacheSeconds: 30 }) },
  putBankAccount: { method: 'PUT', path: '/v1/worker/bank-account', summary: 'Replace the bank account (all four fields); every read returns it masked.', body: json(bankAccountSchema), responses: { 200: maskedBankAccountSchema }, meta: workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 }) },
})

function json<S extends z.ZodType>(schema: S): { kind: 'json'; schema: S } {
  return { kind: 'json', schema }
}
