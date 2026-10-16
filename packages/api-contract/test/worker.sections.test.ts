// The section bodies (U2 edit-profile, rules R2-R7): one accept and one refuse case per rule,
// and a property per body that a generated valid body parses and an extra key is rejected.
import { CULTURAL_BACKGROUNDS, DAYS, INTERESTS, LANGUAGES, MONTHS, PERSONALITIES, UNIQUE_SERVICES, WORK_PREFERENCES } from '@remonta/schemas/data/profileOptions'
import { experienceAreasOf } from '@remonta/schemas/data/experienceAreas'
import { EXAMPLE_ABN } from '@remonta/schemas/validations/abn'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type * as z from 'zod'
import {
  abnBodySchema,
  ADDITIONAL_INFO_ENTRIES,
  signContractSchema,
  ageOn,
  availabilitySchema,
  bankAccountSchema,
  bioSchema,
  confirmPhotoSchema,
  culturalBackgroundSchema,
  funFactSchema,
  goodToKnowSchema,
  interestsSchema,
  languagesSchema,
  personalitySchema,
  preferencesSchema,
  religionSchema,
  supportActivitiesSchema,
  photosSchema,
  dateOfBirthSchema,
  educationSchema,
  experienceSchema,
  genderSchema,
  homeAddressInputSchema,
  jobHistorySchema,
  nameSchema,
  serviceAreaInputSchema,
  serviceRegistrationBodySchema,
  servicesBodySchema,
  confirmServiceDocumentSchema,
  confirmComplianceDocumentSchema,
  citizenshipSchema,
  serviceDocumentTicketRequestSchema,
  slotIssues,
  sortSlots,
  vehicleSchema,
  workerContract,
} from '../src/index'

const ok = (schema: z.ZodType, v: unknown) => expect(schema.safeParse(v).success, JSON.stringify(v)).toBe(true)
const bad = (schema: z.ZodType, v: unknown, path?: string) => {
  const r = schema.safeParse(v)
  expect(r.success, JSON.stringify(v)).toBe(false)
  if (path && !r.success) expect(r.error.issues.map((i) => i.path.join('.'))).toContain(path)
}
const yearsAgo = (n: number) => {
  const d = new Date()
  d.setUTCFullYear(d.getUTCFullYear() - n)
  return d.toISOString().slice(0, 10)
}

describe('the entries (E2)', () => {
  it('declares the 18 U2 writes (personal info is three since 2026-10-14) beside the read, every write with an audit action, a body limit and both rate limits', () => {
    const names = Object.keys(workerContract.entries)
    expect(names).toHaveLength(40) // makeMainPhoto removed, the additional-info entry split in nine, deleteExperience, deleteJobHistoryEntry and deleteEducationEntry added (2026-10-14); U3a putServices, putServiceRegistration; U3b four document entries; U4a four more; U4d signContract
    expect(workerContract.entries.deleteEducationEntry).toMatchObject({ method: 'DELETE', path: '/v1/worker/education/:entryId' })
    expect(workerContract.entries.deleteEducationEntry.pathParams.safeParse({ entryId: 'cm12abc_9-Z' }).success).toBe(true)
    expect(workerContract.entries.deleteEducationEntry.pathParams.safeParse({ entryId: '../x' }).success).toBe(false)
    expect(workerContract.entries.deleteJobHistoryEntry).toMatchObject({ method: 'DELETE', path: '/v1/worker/job-history/:entryId' })
    expect(workerContract.entries.deleteJobHistoryEntry.pathParams.safeParse({ entryId: 'cm12abc_9-Z' }).success).toBe(true)
    expect(workerContract.entries.deleteJobHistoryEntry.pathParams.safeParse({ entryId: "x' OR 1=1" }).success).toBe(false)
    expect(workerContract.entries.deleteJobHistoryEntry.pathParams.safeParse({ entryId: 'a'.repeat(41) }).success).toBe(false)
    expect(workerContract.entries.deleteExperience).toMatchObject({ method: 'DELETE', path: '/v1/worker/experience/:domain' })
    expect(workerContract.entries.deleteExperience.pathParams.safeParse({ domain: 'DISABILITY' }).success).toBe(true)
    expect(workerContract.entries.deleteExperience.pathParams.safeParse({ domain: 'disability' }).success).toBe(false)
    expect(names).not.toContain('makeMainPhoto')
    for (const [name, e] of Object.entries(workerContract.entries)) {
      if (e.method === 'GET') continue
      expect(e.meta.audit, name).toBe('PROFILE_UPDATE')
      expect(e.meta.rateLimit.map((r) => r.per).sort(), name).toEqual(['ip', 'user'])
      expect(e.meta.maxBodyKb, name).toBeLessThanOrEqual(16)
      expect((e.meta as { privateCacheSeconds?: number }).privateCacheSeconds, name).toBeUndefined()
    }
    expect(workerContract.entries.createPhotoTicket.meta.rateLimit[0]).toEqual({ per: 'user', limit: 10, window: '1m' })
    for (const [group, { entry }] of Object.entries(ADDITIONAL_INFO_ENTRIES)) expect(workerContract.entries[entry].path, entry).toBe(`/v1/worker/additional-info/${group}`)
    expect(names).not.toContain('putAdditionalInfo') // one entry per group since 2026-10-14
  })
})

describe('U4d signContract', () => {
  it('takes the upload, the engagement and the file name only: never a tax number', () => {
    ok(signContractSchema, { uploadId: '7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b', engagementType: 'tfn', fileName: 'Contract.pdf' })
    bad(signContractSchema, { uploadId: '7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b', engagementType: 'acn', fileName: 'Contract.pdf' }, 'engagementType')
    expect(signContractSchema.safeParse({ uploadId: '7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b', engagementType: 'tfn', fileName: 'Contract.pdf', tfn: '123456782' }).success).toBe(false)
    expect(workerContract.entries.signContract).toMatchObject({ method: 'POST', path: '/v1/worker/contract' })
  })
})

describe('R2.1 name', () => {
  it('accepts letters of any script with spaces, hyphens and apostrophes; trims; refuses digits, empties and 101 characters', () => {
    ok(nameSchema, { firstName: " Mary-Jane ", middleName: null, lastName: "O'Connor" })
    expect(nameSchema.parse({ firstName: ' Mary ', middleName: null, lastName: 'Lee' }).firstName).toBe('Mary')
    ok(nameSchema, { firstName: 'Zoë', middleName: 'Ngọc', lastName: 'Nguyễn' })
    bad(nameSchema, { firstName: 'R2', middleName: null, lastName: 'Lee' }, 'firstName')
    bad(nameSchema, { firstName: '', middleName: null, lastName: 'Lee' }, 'firstName')
    bad(nameSchema, { firstName: 'a'.repeat(101), middleName: null, lastName: 'Lee' }, 'firstName')
    bad(nameSchema, { firstName: 'Mary', lastName: 'Lee' }, 'middleName')
  })
})

describe('R2.2 bio', () => {
  it('1-2,000 characters, newlines allowed, other control characters refused', () => {
    ok(bioSchema, { bio: 'Hi.\nI care.' })
    ok(bioSchema, { bio: 'x'.repeat(2000) })
    bad(bioSchema, { bio: '   ' })
    bad(bioSchema, { bio: 'x'.repeat(2001) })
    bad(bioSchema, { bio: 'bad\u0007bell' })
  })
})

describe('R2.3 personal info', () => {
  it('a real date, 16-100 years old, the two genders, a vehicle answer', () => {
    ok(dateOfBirthSchema, { dateOfBirth: yearsAgo(30) })
    bad(dateOfBirthSchema, { dateOfBirth: yearsAgo(15) }, 'dateOfBirth')
    bad(dateOfBirthSchema, { dateOfBirth: yearsAgo(101) }, 'dateOfBirth')
    bad(dateOfBirthSchema, { dateOfBirth: '1990-02-30' }, 'dateOfBirth')
    ok(genderSchema, { gender: 'Female' })
    bad(genderSchema, { gender: 'Other' }, 'gender')
    ok(vehicleSchema, { hasVehicle: 'No' })
    bad(vehicleSchema, { hasVehicle: 'Maybe' }, 'hasVehicle')
    // Each saves alone (split 2026-10-14): a body carrying another answer is refused.
    bad(dateOfBirthSchema, { dateOfBirth: yearsAgo(30), gender: 'Female' })
    bad(genderSchema, { gender: 'Male', hasVehicle: 'Yes' })
    bad(vehicleSchema, { hasVehicle: 'Yes', dateOfBirth: yearsAgo(30) })
    expect(ageOn('1990-06-15', new Date('2026-06-14T00:00:00Z'))).toBe(35)
    expect(ageOn('1990-06-15', new Date('2026-06-15T00:00:00Z'))).toBe(36)
  })
})

describe('R5 ABN', () => {
  it('normalises spaces, needs 11 digits and the checksum', () => {
    expect(abnBodySchema.parse({ abn: '51 824 753 556' })).toEqual({ abn: EXAMPLE_ABN })
    bad(abnBodySchema, { abn: '51824753557' }, 'abn')
    bad(abnBodySchema, { abn: '5182475355' }, 'abn')
    bad(abnBodySchema, { abn: '51-824-753-556' }, 'abn')
  })
})

describe('R3 the addresses', () => {
  it('home: a one-line street and a positive locality id; service area: the id and 1-500 km', () => {
    ok(homeAddressInputSchema, { streetLine: ' 12 Example St ', localityId: 42 })
    bad(homeAddressInputSchema, { streetLine: '12 Example St\nUnit 1', localityId: 42 }, 'streetLine')
    bad(homeAddressInputSchema, { streetLine: 'x'.repeat(121), localityId: 42 }, 'streetLine')
    bad(homeAddressInputSchema, { streetLine: '12 Example St', localityId: 0 }, 'localityId')
    ok(serviceAreaInputSchema, { localityId: 1, travelRadiusKm: 500 })
    bad(serviceAreaInputSchema, { localityId: 1, travelRadiusKm: 0 }, 'travelRadiusKm')
    bad(serviceAreaInputSchema, { localityId: 1, travelRadiusKm: 501 }, 'travelRadiusKm')
    bad(serviceAreaInputSchema, { localityId: 1, travelRadiusKm: 12.5 }, 'travelRadiusKm')
  })
})

describe('R4 photos', () => {
  it('confirm needs a uuid and nothing else: one photo, no slot (2026-10-14)', () => {
    ok(confirmPhotoSchema, { uploadId: '6f1c2c1e-6d8a-4b7e-9f3d-2b0e1d4c5a6b' })
    bad(confirmPhotoSchema, { uploadId: 'nope' }, 'uploadId')
    bad(confirmPhotoSchema, { uploadId: '6f1c2c1e-6d8a-4b7e-9f3d-2b0e1d4c5a6b', slot: 'main' })
  })
  it('the photos are the main photo only', () => {
    ok(photosSchema, { main: null })
    bad(photosSchema, { main: null, additional: [] })
  })
})

const slot = (day: string, startMinute: number, endMinute: number) => ({ day: day as (typeof DAYS)[number], startMinute, endMinute })

describe('R2.7 preferred hours', () => {
  it('start < end, at most 4 a day, no overlap; touching slots are fine', () => {
    ok(availabilitySchema, { slots: [slot('MONDAY', 540, 720), slot('MONDAY', 720, 1020), slot('TUESDAY', 0, 1440)] })
    ok(availabilitySchema, { slots: [] })
    bad(availabilitySchema, { slots: [slot('MONDAY', 720, 720)] }, 'slots.0.startMinute')
    bad(availabilitySchema, { slots: [slot('MONDAY', 540, 720), slot('MONDAY', 700, 800)] }, 'slots.1.startMinute')
    bad(availabilitySchema, { slots: [1, 2, 3, 4, 5].map((i) => slot('MONDAY', i * 100, i * 100 + 50)) }, 'slots.4.startMinute')
    bad(availabilitySchema, { slots: [slot('FUNDAY', 0, 10)] }, 'slots.0.day')
    bad(availabilitySchema, { slots: [slot('MONDAY', 0, 1441)] }, 'slots.0.endMinute')
  })
  it('P3: a generated week with no overlaps and ≤ 4 a day is accepted; adding an overlapping slot is refused', () => {
    const week = fc
      .array(fc.record({ day: fc.constantFrom(...DAYS), start: fc.integer({ min: 0, max: 1380 }), len: fc.integer({ min: 5, max: 60 }) }), { maxLength: 28 })
      .map((raw) => {
        const out: ReturnType<typeof slot>[] = []
        for (const r of raw) {
          const s = slot(r.day, r.start, Math.min(1440, r.start + r.len))
          const same = out.filter((o) => o.day === s.day)
          if (same.length >= 4 || same.some((o) => s.startMinute < o.endMinute && o.startMinute < s.endMinute)) continue
          out.push(s)
        }
        return out
      })
    fc.assert(
      fc.property(week, (slots) => {
        expect(slotIssues(slots)).toEqual([])
        ok(availabilitySchema, { slots })
        const sorted = sortSlots(slots)
        for (let i = 1; i < sorted.length; i++) if (sorted[i]!.day === sorted[i - 1]!.day) expect(sorted[i]!.startMinute >= sorted[i - 1]!.endMinute).toBe(true)
        if (slots.length > 0 && slots.filter((s) => s.day === slots[0]!.day).length < 4) {
          const s0 = slots[0]!
          bad(availabilitySchema, { slots: [...slots, slot(s0.day, s0.startMinute, s0.endMinute)] })
        }
      }),
      { numRuns: 200 },
    )
  })
})

describe('R2.8 experience', () => {
  const dom = (patch: Record<string, unknown> = {}) => ({ domain: 'AGED_CARE', isProfessional: true, isPersonal: false, specificAreas: ['Dementia'], otherAreas: [], description: null, ...patch })
  it('areas from the domain\'s list, at most 3, one entry per domain, professional or personal', () => {
    ok(experienceSchema, { domains: [dom(), dom({ domain: 'DISABILITY', specificAreas: [] })] })
    bad(experienceSchema, { domains: [dom({ specificAreas: ['Not an area'] })] }, 'domains.0.specificAreas.0')
    ok(experienceSchema, { domains: [dom({ specificAreas: [...experienceAreasOf('AGED_CARE')] })] }) // every one of the area's options (no 3 limit since 2026-10-13)
    bad(experienceSchema, { domains: [dom({ specificAreas: ['Dementia', 'Dementia'] })] }, 'domains.0.specificAreas')
    bad(experienceSchema, { domains: [dom({ isProfessional: false })] }, 'domains.0.isProfessional')
    bad(experienceSchema, { domains: [dom(), dom()] }, 'domains')
    bad(experienceSchema, { domains: [dom({ otherAreas: ['x'.repeat(61)] })] }, 'domains.0.otherAreas.0')
    expect(experienceSchema.parse({ domains: [dom({ description: '  ' })] }).domains[0]!.description).toBeNull()
  })
})

describe('R2.9 / R2.10 work history and education', () => {
  const job = (patch: Record<string, unknown> = {}) => ({ jobTitle: 'Carer', company: 'Co', startMonth: 'March', startYear: 2020, endMonth: 'June', endYear: 2021, currentlyWorking: false, ...patch })
  it('month names, years 1950..now, currently ⇒ no end, else both and not before the start, up to 20 entries', () => {
    ok(jobHistorySchema, { entries: [job(), job({ endMonth: null, endYear: null, currentlyWorking: true })] })
    ok(jobHistorySchema, { entries: [] })
    bad(jobHistorySchema, { entries: [job({ currentlyWorking: true })] }, 'entries.0.endMonth')
    bad(jobHistorySchema, { entries: [job({ endMonth: null })] }, 'entries.0.endMonth')
    bad(jobHistorySchema, { entries: [job({ endYear: 2019 })] }, 'entries.0.endMonth')
    bad(jobHistorySchema, { entries: [job({ startYear: 2021, startMonth: 'June', endMonth: 'May', endYear: 2021 })] }, 'entries.0.endMonth')
    bad(jobHistorySchema, { entries: [job({ startMonth: 'Mar' })] }, 'entries.0.startMonth')
    bad(jobHistorySchema, { entries: [job({ startYear: 1949 })] }, 'entries.0.startYear')
    bad(jobHistorySchema, { entries: Array.from({ length: 21 }, () => job()) }, 'entries')
    ok(educationSchema, { entries: [{ institution: 'TAFE', qualification: 'Cert III', startMonth: 'January', startYear: 2018, endMonth: null, endYear: null, currentlyStudying: true }] })
  })
})

describe('R7 additional info', () => {
  it('each group its own fields; list values from the lists (languages and interests also free labels); the group must match', () => {
    ok(goodToKnowSchema, { lgbtqiaSupport: true })
    ok(languagesSchema, { languages: [LANGUAGES[0], 'Klingon'] })
    bad(languagesSchema, { languages: ['English', 'English'] }, 'languages')
    ok(culturalBackgroundSchema, { culturalBackground: [CULTURAL_BACKGROUNDS[0]] })
    bad(culturalBackgroundSchema, { culturalBackground: ['Martian'] }, 'culturalBackground.0')
    ok(interestsSchema, { interests: [INTERESTS[0], 'Beekeeping'] })
    ok(supportActivitiesSchema, { uniqueService: [UNIQUE_SERVICES[0]] })
    bad(supportActivitiesSchema, { uniqueService: [] }, 'uniqueService')
    bad(supportActivitiesSchema, { uniqueService: [UNIQUE_SERVICES[0]], funFact: 'f'.repeat(50) }) // each saves alone
    ok(funFactSchema, { funFact: 'f'.repeat(50) })
    bad(funFactSchema, { funFact: 'short' }, 'funFact')
    ok(preferencesSchema, { workPreferences: [WORK_PREFERENCES[0]] })
    ok(personalitySchema, { personality: PERSONALITIES[0], nonSmoker: true, petFriendly: false })
    bad(personalitySchema, { personality: 'Shy', nonSmoker: true, petFriendly: false }, 'personality')
    bad(goodToKnowSchema, { lgbtqiaSupport: true, languages: [] }) // another group's field
    bad(religionSchema, { group: 'religion', religion: [] }) // the group is the address, not a field (2026-10-14)
  })
})

describe('R6 bank account', () => {
  it('all four fields; BSB 6 digits with an optional dash; number 6-10 digits', () => {
    expect(bankAccountSchema.parse({ accountName: ' M Lee ', bankName: 'CBA', bsb: '062-000', accountNumber: '12345678' })).toEqual({ accountName: 'M Lee', bankName: 'CBA', bsb: '062000', accountNumber: '12345678' })
    bad(bankAccountSchema, { accountName: 'M', bankName: 'CBA', bsb: '06200', accountNumber: '12345678' }, 'bsb')
    bad(bankAccountSchema, { accountName: 'M', bankName: 'CBA', bsb: '062000', accountNumber: '12345' }, 'accountNumber')
    bad(bankAccountSchema, { accountName: 'M', bankName: 'CBA', bsb: '062000', accountNumber: '12345678901' }, 'accountNumber')
    bad(bankAccountSchema, { accountName: 'M', bsb: '062000', accountNumber: '12345678' }, 'bankName')
  })
})

// ---- Properties: a generated valid body parses; an extra key is refused (P9, NFR-04).

const str = (max: number) => fc.string({ minLength: 1, maxLength: max }).filter((s) => s.trim().length > 0 && !/[\p{Cc}]/u.test(s))
const name = fc.stringMatching(/^[A-Za-z][A-Za-z '-]{0,20}$/)
const month = fc.constantFrom(...MONTHS)
const year = fc.integer({ min: 1950, max: 2026 })
const job = fc
  .record({ jobTitle: str(100), company: str(100), startMonth: month, startYear: year, endMonth: month, endYear: year, currentlyWorking: fc.boolean() })
  .map((j) => (j.currentlyWorking ? { ...j, endMonth: null, endYear: null } : j.endYear < j.startYear ? { ...j, endYear: j.startYear, endMonth: j.startMonth } : j.endYear === j.startYear && MONTHS.indexOf(j.endMonth) < MONTHS.indexOf(j.startMonth) ? { ...j, endMonth: j.startMonth } : j))

const bodies: [string, z.ZodType, fc.Arbitrary<unknown>][] = [
  ['name', nameSchema, fc.record({ firstName: name, middleName: fc.option(name, { nil: null }), lastName: name })],
  ['bio', bioSchema, fc.record({ bio: str(2000) })],
  ['abn', abnBodySchema, fc.constant({ abn: EXAMPLE_ABN })],
  ['home address', homeAddressInputSchema, fc.record({ streetLine: str(120).filter((s) => !s.includes('\n')), localityId: fc.integer({ min: 1, max: 20000 }) })],
  ['service area', serviceAreaInputSchema, fc.record({ localityId: fc.integer({ min: 1, max: 20000 }), travelRadiusKm: fc.integer({ min: 1, max: 500 }) })],
  ['job history', jobHistorySchema, fc.record({ entries: fc.array(job, { maxLength: 20 }) })],
  ['bank account', bankAccountSchema, fc.record({ accountName: str(100), bankName: str(100), bsb: fc.stringMatching(/^\d{6}$/), accountNumber: fc.stringMatching(/^\d{6,10}$/) })],
]

describe('every body: generated valid values parse, an extra key does not', () => {
  it.each(bodies)('%s', (_label, schema, arb) => {
    fc.assert(
      fc.property(arb, (body) => {
        ok(schema, body)
        bad(schema, { ...(body as object), passwordHash: 'x' })
      }),
      { numRuns: 60 },
    )
  })
})

describe('U3a services', () => {
  it('at least one service, no repeats; sub-categories may be empty', () => {
    ok(servicesBodySchema, { services: ['support-worker'], subcategoryIds: [] })
    ok(servicesBodySchema, { services: ['support-worker', 'nursing-services'], subcategoryIds: ['a', 'b'] })
    bad(servicesBodySchema, { services: [], subcategoryIds: [] }, 'services')
    bad(servicesBodySchema, { services: ['x', 'x'], subcategoryIds: [] }, 'services')
    bad(servicesBodySchema, { services: ['x'], subcategoryIds: ['a', 'a'] }, 'subcategoryIds')
    bad(servicesBodySchema, { services: ['x'], subcategoryIds: [], extra: 1 })
  })

  const nextYear = `${new Date().getUTCFullYear() + 1}-05-31`
  it('a registered nurse gives a number and a current expiry; an enrolled nurse gives neither', () => {
    ok(serviceRegistrationBodySchema, { categoryId: 'nursing-services', nursingType: 'registered', hasExperience: false, registrationNumber: 'NMW0001234567', expiryDate: nextYear })
    ok(serviceRegistrationBodySchema, { categoryId: 'nursing-services', nursingType: 'enrolled', hasExperience: true, registrationNumber: null, expiryDate: null })
    bad(serviceRegistrationBodySchema, { categoryId: 'nursing-services', nursingType: 'registered', hasExperience: false, registrationNumber: null, expiryDate: nextYear }, 'registrationNumber')
    bad(serviceRegistrationBodySchema, { categoryId: 'nursing-services', nursingType: 'enrolled', hasExperience: false, registrationNumber: 'NMW1', expiryDate: null }, 'registrationNumber')
    bad(serviceRegistrationBodySchema, { categoryId: 'nursing-services', nursingType: 'registered', hasExperience: false, registrationNumber: 'NMW0001234567', expiryDate: '2020-01-01' }, 'expiryDate')
  })

  it('a therapeutic registration: number and expiry; dates must be real; stored junk is refused on write', () => {
    ok(serviceRegistrationBodySchema, { categoryId: 'therapeutic-supports', registrationNumber: 'PSY 0001-23', expiryDate: nextYear })
    bad(serviceRegistrationBodySchema, { categoryId: 'therapeutic-supports', registrationNumber: '12', expiryDate: nextYear }, 'registrationNumber')
    bad(serviceRegistrationBodySchema, { categoryId: 'therapeutic-supports', registrationNumber: 'ABC123', expiryDate: '-01-00' }, 'expiryDate')
    bad(serviceRegistrationBodySchema, { categoryId: 'therapeutic-supports', registrationNumber: 'ABC123', expiryDate: `${new Date().getUTCFullYear() + 1}-02-30` }, 'expiryDate')
    bad(serviceRegistrationBodySchema, { categoryId: 'therapeutic-supports', registrationNumber: '<b>x</b>', expiryDate: nextYear }, 'registrationNumber')
    bad(serviceRegistrationBodySchema, { categoryId: 'cleaning-services', registrationNumber: 'ABC123', expiryDate: nextYear })
  })
})

describe('U3b service documents', () => {
  it('a ticket: the six document types, 1 byte to 50 MB', () => {
    for (const t of ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']) ok(serviceDocumentTicketRequestSchema, { contentType: t, sizeBytes: 1000 })
    bad(serviceDocumentTicketRequestSchema, { contentType: 'application/zip', sizeBytes: 1000 }, 'contentType')
    bad(serviceDocumentTicketRequestSchema, { contentType: 'application/pdf', sizeBytes: 50 * 1024 * 1024 + 1 }, 'sizeBytes')
    bad(serviceDocumentTicketRequestSchema, { contentType: 'application/pdf', sizeBytes: 0 }, 'sizeBytes')
  })
  it('a confirm: a type id, a file name without a path', () => {
    const base = { uploadId: '7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b', categoryId: 'nursing-services', requirementType: 'ahpra-registration', fileName: 'AHPRA 2026.pdf' }
    ok(confirmServiceDocumentSchema, base)
    bad(confirmServiceDocumentSchema, { ...base, requirementType: 'Nursing Services:ahpra' }, 'requirementType')
    bad(confirmServiceDocumentSchema, { ...base, fileName: '../../etc/passwd' }, 'fileName')
    bad(confirmServiceDocumentSchema, { ...base, fileName: 'C:\\Users\\x.pdf' }, 'fileName')
    bad(confirmServiceDocumentSchema, { ...base, uploadId: 'staging/x' }, 'uploadId')
  })
  it('the document id in a path: an id, never a path', () => {
    const p = workerContract.entries.deleteServiceDocument.pathParams
    expect(p.safeParse({ documentId: 'cm12abc_9-Z' }).success).toBe(true)
    expect(p.safeParse({ documentId: '../x' }).success).toBe(false)
  })
})

describe('U4a compliance documents', () => {
  const base = { uploadId: '7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b', requirementType: 'police-check', fileName: 'Police check.pdf' }
  const nextYear = `${new Date().getUTCFullYear() + 1}-03-01`
  it('a confirm: expiry and acknowledgement default to null; an expiry is a real date in force', () => {
    expect(confirmComplianceDocumentSchema.parse(base)).toMatchObject({ expiryDate: null, acknowledgement: null })
    ok(confirmComplianceDocumentSchema, { ...base, requirementType: 'right-to-work', expiryDate: nextYear })
    bad(confirmComplianceDocumentSchema, { ...base, expiryDate: '2020-01-01' }, 'expiryDate')
    bad(confirmComplianceDocumentSchema, { ...base, expiryDate: '2030-02-30' }, 'expiryDate')
  })
  it('the Code of Conduct acknowledgement: a name and a date, nothing else', () => {
    ok(confirmComplianceDocumentSchema, { ...base, requirementType: 'code-of-conduct', acknowledgement: { workerName: "Mary O'Connor", signatureDate: '2026-10-15' } })
    bad(confirmComplianceDocumentSchema, { ...base, acknowledgement: { workerName: 'M', signatureDate: '2026-10-15', approved: true } })
    bad(confirmComplianceDocumentSchema, { ...base, requirementType: 'Police Check' }, 'requirementType')
  })
  it('the citizenship answer is a boolean and nothing else (C1)', () => {
    ok(citizenshipSchema, { isCitizen: true })
    bad(citizenshipSchema, { isCitizen: 'yes' }, 'isCitizen')
    bad(citizenshipSchema, { isCitizen: true, documentType: 'police-check' })
  })
})
