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
// Added per unit: U1 getProfile · U2 the section writes · U3 services and documents ·
// U4 dashboard and jobs.
import * as z from 'zod'
import { CARE_DOMAINS } from './admin.contract'
import { defineContract } from './define'
import { meta } from './meta'

export const WORKER_READ_LIMITS = { user: 120, ip: 300 } as const
export const WORKER_WRITE_LIMITS = { user: 60, ip: 120 } as const
export const WORKER_PRIVATE_CACHE_SECONDS = 60

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

/** A write to the worker's own data: tighter limits, a body limit and a mandatory audit action (R8.1). */
export const workerWrite = (audit: string, opts: { maxBodyKb?: number } = {}) => {
  if (typeof audit !== 'string' || !audit) throw new Error('workerWrite: an audit action is required on every worker write (R8.1)')
  return meta({
    access: { roles: ['WORKER'] },
    bot: 'none',
    rateLimit: [
      { per: 'user', limit: WORKER_WRITE_LIMITS.user, window: '1m' },
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
})
export type RequirementItem = z.output<typeof requirementItemSchema>

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

export const workerServiceSchema = z.strictObject({
  categoryId: str(80),
  categoryName: str(120),
  subcategoryIds: z.array(str(80)).max(50),
  subcategoryNames: z.array(str(120)).max(50),
})

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
  photos: z.strictObject({ main: str(2048).nullable(), additional: z.array(str(2048)).max(10) }),
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
  requirements: z.strictObject({ mandatory: z.array(requirementItemSchema).max(100), trainings: z.array(requirementItemSchema).max(100) }),
  services: z.array(workerServiceSchema).max(50),
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
})
