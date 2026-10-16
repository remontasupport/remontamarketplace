// Small pure pieces of the worker area (U1): displayRole (R5.1), the bank mask (R2.3),
// the stored flags (R3.9), the photo parsing (R2.6) and the shaping of a full row set.
import { profileSchema } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { shapeProfile } from '../../src/modules/worker/application/get-profile'
import { assertOwned } from '../../src/modules/worker/application/own-profile'
import { maskBankAccount } from '../../src/modules/worker/domain/bank-account'
import { DEFAULT_DISPLAY_ROLE, displayRoleOf } from '../../src/modules/worker/domain/display-role'
import { parseStoredFlags, sameFlags } from '../../src/modules/worker/domain/persist-completion'
import type { ProfileRows } from '../../src/modules/worker/persistence/profile-read'

describe('displayRoleOf (R5.1)', () => {
  const at = (s: number) => new Date(2026, 0, 1 + s)
  it('no service -> Support Worker; the first by creation; therapeutic shows its sub-categories joined by " / "', () => {
    expect(displayRoleOf([])).toBe(DEFAULT_DISPLAY_ROLE)
    expect(displayRoleOf([{ categoryName: 'Cleaning Services', subcategoryNames: ['General Cleaning'], createdAt: at(2) }, { categoryName: 'Support Worker', subcategoryNames: [], createdAt: at(1) }])).toBe('Support Worker')
    expect(displayRoleOf([{ categoryName: 'Therapeutic Supports', subcategoryNames: ['Occupational Therapist', 'Dietitian'], createdAt: at(0) }, { categoryName: 'Support Worker', subcategoryNames: [], createdAt: at(1) }])).toBe('Occupational Therapist / Dietitian')
    expect(displayRoleOf([{ categoryName: 'Therapeutic Supports', subcategoryNames: [], createdAt: at(0) }])).toBe('Therapeutic Supports')
  })
})

describe('maskBankAccount (R2.3)', () => {
  it('keeps the names and the last three digits only; null for null or malformed', () => {
    expect(maskBankAccount({ accountName: 'M Lee', bankName: 'CBA', bsb: '062000', accountNumber: '12345678' })).toEqual({ accountName: 'M Lee', bankName: 'CBA', bsbLast3: '000', accountNumberLast3: '678' })
    expect(maskBankAccount({ accountName: 'M Lee', bankName: 'CBA', bsb: '062-000', accountNumber: '12345678' })?.bsbLast3).toBe('000')
    expect(maskBankAccount(null)).toBeNull()
    expect(maskBankAccount('{"bsb":"062000"}')).toBeNull()
    expect(maskBankAccount({ accountName: 'x', bankName: 'y', bsb: '12', accountNumber: '12345678' })).toBeNull()
    expect(maskBankAccount({ bsb: '062000', accountNumber: '12345678' })).toBeNull()
  })
  it('never contains more than three digits of either number', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{6}$/), fc.stringMatching(/^\d{6,10}$/), (bsb, accountNumber) => {
        const m = maskBankAccount({ accountName: 'a', bankName: 'b', bsb, accountNumber })!
        expect(JSON.stringify(m)).not.toContain(accountNumber)
        expect(JSON.stringify(m)).not.toContain(bsb)
        expect(accountNumber.endsWith(m.accountNumberLast3)).toBe(true)
      }),
    )
  })
})

describe('the stored flags (R3.9)', () => {
  it('parse like today: anything not a boolean true is false', () => {
    expect(parseStoredFlags(null)).toEqual({ accountDetails: false, compliance: false, trainings: false, services: false })
    expect(parseStoredFlags({ accountDetails: true, compliance: 'yes', trainings: 1, services: false })).toEqual({ accountDetails: true, compliance: false, trainings: false, services: false })
    expect(sameFlags(parseStoredFlags({ accountDetails: true }), { accountDetails: true, compliance: false, trainings: false, services: false })).toBe(true)
  })
})

describe('assertOwned (R1.3)', () => {
  it('404 for a missing row and for another owner; passes for the owner', () => {
    const owner = { profileId: 'p1', userId: 'u1' }
    expect(() => assertOwned('document', null, owner)).toThrow(expect.objectContaining({ status: 404 }))
    expect(() => assertOwned('document', { workerProfileId: 'p2' }, owner)).toThrow(expect.objectContaining({ status: 404 }))
    expect(() => assertOwned('document', { workerProfileId: 'p1' }, owner)).not.toThrow()
    expect(() => assertOwned('jobApplication', { workerId: 'u2' }, owner)).toThrow(expect.objectContaining({ status: 404 }))
    expect(() => assertOwned('jobApplication', { workerId: 'u1' }, owner)).not.toThrow()
  })
})

export function sampleRows(patch: Partial<ProfileRows['profile']> = {}): ProfileRows {
  return {
    profile: {
      id: 'wp_1',
      userId: 'u1',
      firstName: 'Mary',
      middleName: null,
      lastName: "O'Connor",
      mobile: '0412345678',
      photos: 'https://blob.test/main.jpg',
      introduction: 'I have supported people for ten years and love what I do.',
      city: 'Parramatta',
      state: 'NSW',
      postalCode: '2150',
      age: null,
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      hasVehicle: 'yes',
      languages: ['English'],
      abn: { workerEngagementType: { type: 'abn', signed: true } },
      setupProgress: null,
      profileCompleted: false,
      verificationStatus: 'Verified',
      isPublished: true,
      updatedAt: new Date('2026-10-01T00:00:00Z'),
      workerServices: [{ categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryIds: ['personal-care'], subcategoryNames: ['Personal Care'], metadata: null, createdAt: new Date('2026-01-01') }],
      verificationRequirements: [{ id: 'vr1', requirementType: 'police-check', requirementName: 'Police Check', status: 'APPROVED', documentCategory: null, documentUrl: 'https://blob.test/pc.pdf', expiresAt: null, documentUploadedAt: null, metadata: null }],
      availability: [{ dayOfWeek: 'MONDAY', startMinute: 540, endMinute: 1020 }],
      careExperience: [{ domain: 'AGED_CARE', isProfessional: true, isPersonal: false, specificAreas: ['Dementia'], otherAreas: [], description: null }],
      jobHistoryEntries: [{ id: 'j1', jobTitle: 'Carer', company: 'Co', startMonth: 'January', startYear: 2020, endMonth: null, endYear: null, currentlyWorking: true }],
      educationEntries: [],
      workerAdditionalInfo: { languages: ['English', 'Hindi'], culturalBackground: [], religion: [], interests: ['music'], workPreferences: [], lgbtqiaSupport: true, nonSmoker: null, petFriendly: false, personality: 'calm', uniqueService: [], funFact: null, bankAccount: { accountName: 'M', bankName: 'CBA', bsb: '062000', accountNumber: '55512399' } },
      homeStreetLine: null,
      homeLocality: null,
      locations: [{ localityId: 42, travelRadiusKm: 50, precision: 'LOCALITY', locality: { suburb: 'Parramatta', state: 'NSW', postcode: '2150' } }],
      ...patch,
    },
    catalogue: [{ id: 'support-worker', name: 'Support Worker', documents: [{ documentType: 'REQUIRED', conditionKey: null, requiredIfTrue: null, document: { id: 'police-check', name: 'Police Check', category: 'COMPLIANCE', description: '', hasExpiration: false } }], subcategories: [] }],
  }
}

describe('shapeProfile (L2 step 4, E1)', () => {
  it('produces a body the contract accepts, with every field from its column', () => {
    const body = shapeProfile(sampleRows())
    expect(profileSchema.safeParse(body).success).toBe(true)
    expect(body).toMatchObject({
      id: 'wp_1',
      names: { firstName: 'Mary', middleName: null, lastName: "O'Connor" },
      photos: { main: 'https://blob.test/main.jpg' },
      personalInfo: { hasVehicle: 'Yes', dateOfBirth: '1990-01-01', age: null, languages: ['English'] },
      abn: { type: 'abn', value: null, signed: true },
      homeAddress: null,
      serviceArea: { localityId: 42, label: 'Parramatta, NSW 2150', travelRadiusKm: 50, precision: 'LOCALITY' },
      displayRole: 'Support Worker',
      verificationStatus: 'Verified',
      sections: { bankAccount: { accountName: 'M', bankName: 'CBA', bsbLast3: '000', accountNumberLast3: '399' }, availability: [{ day: 'MONDAY', startMinute: 540, endMinute: 1020 }] },
      updatedAt: '2026-10-01T00:00:00.000Z',
    })
    expect(body.completion.percent).toBe(92) // 12 of 13: every section but education
    expect(body.requirements.mandatory.map((i) => [i.id, i.status])).toEqual([['police-check', 'approved'], ['code-of-conduct-part1', 'approved']])
    expect(JSON.stringify(body)).not.toContain('55512399')
    expect(JSON.stringify(body)).not.toContain('062000')
  })

  it('an unplaced worker has serviceArea null; an empty photo is null; a TFN never reports a value', () => {
    const body = shapeProfile(sampleRows({ locations: [], photos: '', abn: { workerEngagementType: { type: 'tfn', value: '883636086' } }, hasVehicle: null }))
    expect(body.serviceArea).toBeNull()
    expect(body.photos.main).toBeNull()
    expect(body.abn).toEqual({ type: 'tfn', value: null, signed: false })
    expect(body.personalInfo.hasVehicle).toBeNull()
    expect(JSON.stringify(body)).not.toContain('883636086')
  })
})
