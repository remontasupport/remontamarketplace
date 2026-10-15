// The bodies of the worker's section writes (worker-profile-api U2, domain-entities E3;
// rules R2-R7 of the edit-profile functional design). Every body is a strict object with
// every string trimmed and bounded and every list value an enumeration from
// @remonta/schemas (languages and interests also accept a worker's own label, as the
// pages do today). The refinements here ARE the rules apps/api applies (the form engine
// picks them up from the contract, so a page refuses before sending); the api re-runs
// them on the normalised body.
import { CARE_DOMAINS } from './admin.contract'
import { EXPERIENCE_DOMAINS, experienceAreasOf } from '@remonta/schemas/data/experienceAreas'
import {
  ADDITIONAL_INFO_GROUPS,
  CULTURAL_BACKGROUNDS,
  DAYS,
  GENDERS,
  INTERESTS,
  LANGUAGES,
  MONTHS,
  monthIndex,
  PERSONALITIES,
  RELIGIONS,
  UNIQUE_SERVICES,
  VEHICLE_ANSWERS,
  WORK_PREFERENCES,
} from '@remonta/schemas/data/profileOptions'
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES } from '@remonta/schemas/document-type'
import { abnChecksum, normaliseAbn } from '@remonta/schemas/validations/abn'
import * as z from 'zod'

// ---- Primitives ---------------------------------------------------------------------

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max)
/** A person's name part: letters of any script, marks, spaces, hyphens, apostrophes (R2.1). */
const namePart = trimmed(1, 100).regex(/^[\p{L}][\p{L}\p{M} '-]*$/u, 'Letters, spaces, hyphens and apostrophes only')
/** Plain text: no control characters other than a newline (R2.2). */
const plainText = (min: number, max: number) => trimmed(min, max).regex(/^[^\p{Cc}]*$|^[^\p{Cc}\n]*(\n[^\p{Cc}\n]*)*$/u, 'Plain text only')
/** An optional string: empty becomes null (R2.14). */
const optionalText = (max: number) => z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), trimmed(1, max).nullable())
const positiveInt = z.number().int().positive()
/** A listed value or a worker's own label (R7.1: languages and interests). */
const listedOrOwn = <T extends readonly [string, ...string[]]>(list: T, maxLen: number) => z.union([z.enum(list), trimmed(1, maxLen)])
const uniqueList = <S extends z.ZodType<string>>(item: S, max: number, min = 0) =>
  z.array(item).min(min).max(max).refine((a) => new Set(a).size === a.length, { message: 'No repeats' })

export const CURRENT_YEAR_MAX = 2100

// ---- Column sections (R2.1-R2.3, R5) ------------------------------------------------------

export const nameSchema = z.strictObject({ firstName: namePart, middleName: namePart.nullable(), lastName: namePart })
export type NameBody = z.output<typeof nameSchema>

export const bioSchema = z.strictObject({ bio: plainText(1, 2000) })
export type BioBody = z.output<typeof bioSchema>

/** A calendar date as YYYY-MM-DD; the age window (16-100) is checked against the api's clock (R2.3). */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
  }, 'Not a real date')

/** Whole years between a date of birth and a day, as a person counts them. */
export function ageOn(dateOfBirth: string, on: Date): number {
  const [y, m, d] = dateOfBirth.split('-').map(Number) as [number, number, number]
  let age = on.getUTCFullYear() - y
  if (on.getUTCMonth() + 1 < m || (on.getUTCMonth() + 1 === m && on.getUTCDate() < d)) age--
  return age
}
export const AGE_MIN = 16
export const AGE_MAX = 100

// R2.3: the three personal answers are three writes, each saving its own column only (user, 2026-10-14: each is
// asked on its own page; one write of all three made every page re-send the other two).
export const dateOfBirthSchema = z.strictObject({
  dateOfBirth: isoDateSchema.refine((s) => {
    const a = ageOn(s, new Date())
    return a >= AGE_MIN && a <= AGE_MAX
  }, `Between ${AGE_MIN} and ${AGE_MAX} years old`),
})
export type DateOfBirthBody = z.output<typeof dateOfBirthSchema>
export const genderSchema = z.strictObject({ gender: z.enum(GENDERS) })
export type GenderBody = z.output<typeof genderSchema>
export const vehicleSchema = z.strictObject({ hasVehicle: z.enum(VEHICLE_ANSWERS) })
export type VehicleBody = z.output<typeof vehicleSchema>

/** R5.1: spaces allowed while typing; stored as the eleven digits. */
export const abnBodySchema = z.strictObject({
  abn: z
    .string()
    .transform(normaliseAbn)
    .pipe(z.string().regex(/^\d{11}$/, 'An ABN has 11 digits').refine(abnChecksum, 'That is not a valid ABN')),
})
export type AbnBody = z.output<typeof abnBodySchema>
export const abnViewSchema = z.strictObject({ type: z.literal('abn'), value: z.string().regex(/^\d{11}$/), signed: z.boolean() })
export type AbnView = z.output<typeof abnViewSchema>

// ---- The two addresses (R3) ------------------------------------------------------------------

export const homeAddressInputSchema = z.strictObject({ streetLine: plainText(1, 120).refine((s) => !s.includes('\n'), 'One line'), localityId: positiveInt })
export type HomeAddressInput = z.output<typeof homeAddressInputSchema>
// The stored shape (`homeAddressSchema`, with suburb/state/postcode) lives in worker.contract.ts beside the read.

export const TRAVEL_RADIUS_MAX_KM = 500
export const serviceAreaInputSchema = z.strictObject({ localityId: positiveInt, travelRadiusKm: z.number().int().min(1).max(TRAVEL_RADIUS_MAX_KM) })
export type ServiceAreaInput = z.output<typeof serviceAreaInputSchema>

// ---- Photos (R4) -------------------------------------------------------------------------------

// One photo per worker (user, 2026-10-14: the additional photos removed). `worker_profiles.additionalPhotos` keeps what
// is stored; no worker entry reads or writes it (the admin pages still show it).
export const photosSchema = z.strictObject({ main: z.string().max(2048).nullable() })
export type Photos = z.output<typeof photosSchema>
export const confirmPhotoSchema = z.strictObject({ uploadId: z.uuid() })
export const photoUrlSchema = z.strictObject({ url: z.url().max(2048) })

// ---- Preferred hours (R2.7) -----------------------------------------------------------------------

export const MAX_SLOTS_PER_DAY = 4
export const MINUTES_IN_DAY = 1440
const slotSchema = z.strictObject({ day: z.enum(DAYS), startMinute: z.number().int().min(0).max(MINUTES_IN_DAY), endMinute: z.number().int().min(0).max(MINUTES_IN_DAY) })
export type Slot = z.output<typeof slotSchema>

/** The week's slots sorted by day order then start: the stored order (R2.7). */
export function sortSlots<S extends Slot>(slots: readonly S[]): S[] {
  const day = (d: string) => (DAYS as readonly string[]).indexOf(d)
  return [...slots].sort((a, b) => day(a.day) - day(b.day) || a.startMinute - b.startMinute)
}

/** R2.7 as issues on the offending slot: start < end, at most 4 a day, no overlap (end ≤ next start). */
export function slotIssues(slots: readonly Slot[]): { index: number; message: string }[] {
  const issues: { index: number; message: string }[] = []
  slots.forEach((s, i) => {
    if (s.startMinute >= s.endMinute) issues.push({ index: i, message: 'End must be after start' })
  })
  const byDay = new Map<string, { s: Slot; i: number }[]>()
  slots.forEach((s, i) => byDay.set(s.day, [...(byDay.get(s.day) ?? []), { s, i }]))
  for (const list of byDay.values()) {
    list.sort((a, b) => a.s.startMinute - b.s.startMinute)
    if (list.length > MAX_SLOTS_PER_DAY) issues.push({ index: list[MAX_SLOTS_PER_DAY]!.i, message: `At most ${MAX_SLOTS_PER_DAY} slots a day` })
    for (let k = 1; k < list.length; k++) if (list[k]!.s.startMinute < list[k - 1]!.s.endMinute) issues.push({ index: list[k]!.i, message: 'Overlaps another slot that day' })
  }
  return issues
}

export const availabilitySchema = z.strictObject({ slots: z.array(slotSchema).max(DAYS.length * MAX_SLOTS_PER_DAY) }).superRefine((b, ctx) => {
  for (const issue of slotIssues(b.slots)) ctx.addIssue({ code: 'custom', path: ['slots', issue.index, 'startMinute'], message: issue.message })
})
export type AvailabilityBody = z.output<typeof availabilitySchema>

// ---- Experience (R2.8) ------------------------------------------------------------------------------

/** Any of a domain's own areas (was 3 until 2026-10-13, user): the bound is the longest domain's list; the refine below keeps each to its domain. */
export const MAX_SPECIFIC_AREAS = Math.max(...EXPERIENCE_DOMAINS.map((d) => d.areas.length))
const domainSchema = z
  .strictObject({
    domain: z.enum(CARE_DOMAINS),
    isProfessional: z.boolean(),
    isPersonal: z.boolean(),
    specificAreas: uniqueList(z.string().max(120), MAX_SPECIFIC_AREAS),
    otherAreas: uniqueList(trimmed(1, 60), 10),
    description: optionalText(1000),
  })
  .superRefine((d, ctx) => {
    if (!d.isProfessional && !d.isPersonal) ctx.addIssue({ code: 'custom', path: ['isProfessional'], message: 'Professional, personal, or both' })
    const allowed = experienceAreasOf(d.domain)
    d.specificAreas.forEach((a, i) => {
      if (!allowed.includes(a)) ctx.addIssue({ code: 'custom', path: ['specificAreas', i], message: 'Not one of this area\'s options' })
    })
  })
export const experienceSchema = z.strictObject({ domains: z.array(domainSchema).max(CARE_DOMAINS.length) }).refine((b) => new Set(b.domains.map((d) => d.domain)).size === b.domains.length, { message: 'One entry per area', path: ['domains'] })
export type ExperienceBody = z.output<typeof experienceSchema>
/** DELETE /v1/worker/experience/:domain (2026-10-14): one care area, named by its domain (one row per worker per domain). */
export const experienceDomainParamsSchema = z.strictObject({ domain: z.enum(CARE_DOMAINS) })

// ---- Work history and education (R2.9, R2.10) ------------------------------------------------------------

export const YEAR_MIN = 1950
const yearSchema = z.number().int().min(YEAR_MIN).max(CURRENT_YEAR_MAX)
const monthSchema = z.enum(MONTHS)

/** R2.9: "currently" means no end; otherwise both end fields, not before the start. */
function dateIssues(e: { startMonth: string; startYear: number; endMonth: string | null; endYear: number | null }, currently: boolean, ctx: z.RefinementCtx, endField: string): void {
  if (currently) {
    if (e.endMonth !== null || e.endYear !== null) ctx.addIssue({ code: 'custom', path: ['endMonth'], message: `No end date while ${endField}` })
    return
  }
  if (e.endMonth === null || e.endYear === null) {
    ctx.addIssue({ code: 'custom', path: ['endMonth'], message: 'An end date, or tick the box' })
    return
  }
  if (e.endYear < e.startYear || (e.endYear === e.startYear && monthIndex(e.endMonth) < monthIndex(e.startMonth))) ctx.addIssue({ code: 'custom', path: ['endMonth'], message: 'The end is before the start' })
  if (e.endYear > new Date().getUTCFullYear()) ctx.addIssue({ code: 'custom', path: ['endYear'], message: 'In the future' })
}

const jobBase = z.strictObject({ jobTitle: trimmed(1, 100), company: trimmed(1, 100), startMonth: monthSchema, startYear: yearSchema, endMonth: monthSchema.nullable(), endYear: yearSchema.nullable(), currentlyWorking: z.boolean() })
const jobSchema = jobBase.superRefine((e, ctx) => dateIssues(e, e.currentlyWorking, ctx, 'currently working'))
export const MAX_LIST_ENTRIES = 20
export const jobHistorySchema = z.strictObject({ entries: z.array(jobSchema).max(MAX_LIST_ENTRIES) })
export type JobHistoryBody = z.output<typeof jobHistorySchema>
/** DELETE /v1/worker/job-history/:entryId (2026-10-14): one work-history row by its id (as the read and the PUT return it); `entryId`, never a bare `id` (R1.1's guard). */
export const jobHistoryRowParamsSchema = z.strictObject({ entryId: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'A row id') })
export const jobHistoryViewSchema = z.strictObject({ entries: z.array(jobBase.extend({ id: z.string().max(40) })).max(MAX_LIST_ENTRIES) })

const courseBase = z.strictObject({ institution: trimmed(1, 100), qualification: trimmed(1, 100), startMonth: monthSchema, startYear: yearSchema, endMonth: monthSchema.nullable(), endYear: yearSchema.nullable(), currentlyStudying: z.boolean() })
const courseSchema = courseBase.superRefine((e, ctx) => dateIssues(e, e.currentlyStudying, ctx, 'currently studying'))
export const educationSchema = z.strictObject({ entries: z.array(courseSchema).max(MAX_LIST_ENTRIES) })
export type EducationBody = z.output<typeof educationSchema>
/** DELETE /v1/worker/education/:entryId (2026-10-14): one education row by its id, as for work history. */
export const educationRowParamsSchema = z.strictObject({ entryId: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'A row id') })
export const educationViewSchema = z.strictObject({ entries: z.array(courseBase.extend({ id: z.string().max(40) })).max(MAX_LIST_ENTRIES) })

// ---- Additional info (R7.2) ---------------------------------------------------------------------------------

// One entry per group (user, 2026-10-14: each page its own api), each at /v1/worker/additional-info/<group>. The address
// names the group, so a body holds only that group's columns; it saves those and nothing else.
export const goodToKnowSchema = z.strictObject({ lgbtqiaSupport: z.boolean() })
export const languagesSchema = z.strictObject({ languages: uniqueList(listedOrOwn(LANGUAGES, 40), 20) })
export const culturalBackgroundSchema = z.strictObject({ culturalBackground: uniqueList(z.enum(CULTURAL_BACKGROUNDS), 20) })
export const religionSchema = z.strictObject({ religion: uniqueList(z.enum(RELIGIONS), 20) })
export const interestsSchema = z.strictObject({ interests: uniqueList(listedOrOwn(INTERESTS, 60), 20) })
export const supportActivitiesSchema = z.strictObject({ uniqueService: uniqueList(z.enum(UNIQUE_SERVICES), 10, 1) })
export const funFactSchema = z.strictObject({ funFact: plainText(50, 1000) })
export const preferencesSchema = z.strictObject({ workPreferences: uniqueList(z.enum(WORK_PREFERENCES), 20) })
export const personalitySchema = z.strictObject({ personality: z.enum(PERSONALITIES), nonSmoker: z.boolean(), petFriendly: z.boolean() })

/** Each group's address segment, entry and body: the one table the contract, the api and the tests read. */
export const ADDITIONAL_INFO_ENTRIES = {
  'good-to-know': { entry: 'putGoodToKnow', schema: goodToKnowSchema },
  languages: { entry: 'putLanguages', schema: languagesSchema },
  'cultural-background': { entry: 'putCulturalBackground', schema: culturalBackgroundSchema },
  religion: { entry: 'putReligion', schema: religionSchema },
  interests: { entry: 'putInterests', schema: interestsSchema },
  'support-activities': { entry: 'putSupportActivities', schema: supportActivitiesSchema },
  'fun-fact': { entry: 'putFunFact', schema: funFactSchema },
  preferences: { entry: 'putPreferences', schema: preferencesSchema },
  personality: { entry: 'putPersonality', schema: personalitySchema },
} as const satisfies Record<(typeof ADDITIONAL_INFO_GROUPS)[number], { entry: string; schema: z.ZodType }>
export type AdditionalInfoGroup = keyof typeof ADDITIONAL_INFO_ENTRIES
export type AdditionalInfoBody<G extends AdditionalInfoGroup = AdditionalInfoGroup> = z.output<(typeof ADDITIONAL_INFO_ENTRIES)[G]['schema']>

// ---- Bank account (R6) ----------------------------------------------------------------------------------------

export const bankAccountSchema = z.strictObject({
  accountName: trimmed(1, 100),
  bankName: trimmed(1, 100),
  bsb: z
    .string()
    .transform((s) => s.replace(/^(\d{3})-(\d{3})$/, '$1$2').trim())
    .pipe(z.string().regex(/^\d{6}$/, 'A BSB has 6 digits')),
  accountNumber: z.string().trim().regex(/^\d{6,10}$/, '6 to 10 digits'),
})
export type BankAccountBody = z.output<typeof bankAccountSchema>

// ---- Services (U3a, services-inventory.md) ---------------------------------------------------------------------

/** The services a worker chooses: catalogue category ids, and sub-category ids each belonging to one of them (checked by the api). */
export const servicesBodySchema = z.strictObject({
  services: uniqueList(trimmed(1, 80), 20, 1),
  subcategoryIds: uniqueList(trimmed(1, 80), 100),
})
export type ServicesBody = z.output<typeof servicesBodySchema>

/** The two services that carry a registration (stored on the worker_services row's metadata, as the pages write it today). */
export const REGISTRATION_SERVICES = ['nursing-services', 'therapeutic-supports'] as const
export type RegistrationService = (typeof REGISTRATION_SERVICES)[number]
export const NURSING_TYPES = ['registered', 'enrolled'] as const

const registrationNumber = trimmed(3, 30).regex(/^[A-Za-z0-9][A-Za-z0-9 -]*$/, 'Letters, digits, spaces and hyphens only')
/** A registration still in force: a real date, today or later (the api's clock). */
const expiryDate = isoDateSchema.refine((s) => s >= new Date().toISOString().slice(0, 10), 'This registration has expired')

export const nursingRegistrationSchema = z
  .strictObject({
    categoryId: z.literal('nursing-services'),
    nursingType: z.enum(NURSING_TYPES),
    hasExperience: z.boolean(),
    // A registered nurse gives the AHPRA number and its expiry; an enrolled nurse gives neither.
    registrationNumber: registrationNumber.nullable(),
    expiryDate: expiryDate.nullable(),
  })
  .superRefine((b, ctx) => {
    const registered = b.nursingType === 'registered'
    for (const k of ['registrationNumber', 'expiryDate'] as const) {
      if (registered && b[k] === null) ctx.addIssue({ code: 'custom', path: [k], message: 'Required for a registered nurse' })
      if (!registered && b[k] !== null) ctx.addIssue({ code: 'custom', path: [k], message: 'Only for a registered nurse' })
    }
  })
export const therapeuticRegistrationSchema = z.strictObject({ categoryId: z.literal('therapeutic-supports'), registrationNumber, expiryDate })
export const serviceRegistrationBodySchema = z.discriminatedUnion('categoryId', [nursingRegistrationSchema, therapeuticRegistrationSchema])
export type ServiceRegistrationBody = z.output<typeof serviceRegistrationBodySchema>
export const serviceRegistrationParamsSchema = z.strictObject({ categoryId: z.enum(REGISTRATION_SERVICES) })

/**
 * A registration as stored. Stored rows predate any rule (numbers of 0-2 characters, expiries such as "-01-00"), so
 * every field is nullable and a value that is not a real date reads as null; a write always stores the strict body.
 */
export const serviceRegistrationViewSchema = z.strictObject({
  categoryId: z.enum(REGISTRATION_SERVICES),
  nursingType: z.enum(NURSING_TYPES).nullable(),
  hasExperience: z.boolean().nullable(),
  registrationNumber: z.string().max(60).nullable(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
})
export type ServiceRegistrationView = z.output<typeof serviceRegistrationViewSchema>

// ---- Service documents (U3b, u3b-service-documents-design.md) ---------------------------------------------------

export const serviceDocumentTicketRequestSchema = z.strictObject({
  contentType: z.enum(DOCUMENT_TYPES),
  sizeBytes: z.int().min(1).max(DOCUMENT_MAX_BYTES),
})
export type ServiceDocumentTicketRequest = z.output<typeof serviceDocumentTicketRequestSchema>

export const serviceDocumentTicketResponseSchema = z.strictObject({
  uploadId: z.uuid(),
  upload: z.strictObject({
    url: z.url(),
    method: z.literal('POST'),
    /** The signed policy's form fields, sent before the file. */
    fields: z.record(z.string(), z.string()),
    fileField: z.literal('file'),
  }),
  expiresAt: z.iso.datetime(),
})
export type ServiceDocumentTicketResponse = z.output<typeof serviceDocumentTicketResponseSchema>

/** A type id of the requirement table (`qualification-certificate`, `cert3-aged-care`, ...); the api checks it against the service. */
const documentTypeId = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Not a document type')
/** The file's own name, for the worker and the reviewer to recognise it: a plain line, no path. */
const fileName = trimmed(1, 200).regex(/^[^\p{Cc}/\\]+$/u, 'A file name only')

export const confirmServiceDocumentSchema = z.strictObject({
  uploadId: z.uuid(),
  categoryId: trimmed(1, 80),
  requirementType: documentTypeId,
  fileName,
})
export type ConfirmServiceDocumentBody = z.output<typeof confirmServiceDocumentSchema>

export const serviceDocumentParamsSchema = z.strictObject({ documentId: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'Not a document id') })

/** One SERVICE_QUALIFICATION row as the worker sees it. `url` is what the row stores: an app path for a private file, a public URL for a legacy one. */
export const serviceDocumentSchema = z.strictObject({
  id: z.string().max(40),
  /** The service's name as the row names it (the part before the first colon of the requirement type). */
  serviceName: z.string().max(120),
  requirementType: z.string().max(80),
  name: z.string().max(200),
  status: z.string().max(20),
  url: z.string().max(2048).nullable(),
  fileName: z.string().max(200).nullable(),
  uploadedAt: z.iso.datetime({ offset: true }).nullable(),
})
export type ServiceDocument = z.output<typeof serviceDocumentSchema>

export const documentLinkSchema = z.strictObject({ url: z.url().max(4096), expiresAt: z.iso.datetime({ offset: true }).nullable() })
export type DocumentLink = z.output<typeof documentLinkSchema>
