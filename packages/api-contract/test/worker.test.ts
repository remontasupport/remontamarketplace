// The worker area (U1 worker-area): the one entry, its helpers and the strict profile shape.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import publicEndpoints from '../public-endpoints.json'
import {
  checkContracts,
  contracts,
  CARE_DOMAINS,
  DAYS_OF_WEEK,
  profileSchema,
  REQUIREMENT_ITEM_STATUSES,
  toOpenApi,
  tourViewSchema,
  completionViewSchema,
  MY_PROFILE_PAGES,
  VERIFICATION_STATUSES,
  workerContract,
  workerRead,
  workerWrite,
  type EntryDef,
  type Profile,
  type PublicEndpoint,
} from '../src/index'

describe('the worker contract', () => {
  it('passes every check beside the other areas', () => {
    expect(contracts.map((c) => c.area)).toEqual(['platform', 'registration', 'admin', 'worker', 'account'])
    expect(checkContracts(contracts, publicEndpoints as PublicEndpoint[])).toEqual([])
  })

  it('getProfile: a WORKER-only GET, both limits, privately cacheable, no memo-style public cache (R8.1, R8.2)', () => {
    expect(Object.keys(workerContract.entries)[0]).toBe('getProfile')
    const e = workerContract.entries.getProfile as EntryDef
    expect([e.method, e.path]).toEqual(['GET', '/v1/worker/profile'])
    expect(e.meta.access).toEqual({ roles: ['WORKER'] })
    expect(e.meta.bot).toBe('none')
    expect(e.meta.rateLimit).toEqual([
      { per: 'user', limit: 120, window: '1m' },
      { per: 'ip', limit: 300, window: '1m' },
    ])
    expect(e.meta.maxBodyKb).toBe(1)
    expect(e.meta.privateCacheSeconds).toBe(60)
    expect((e.meta as { cacheSeconds?: number }).cacheSeconds).toBeUndefined()
    expect((e.meta as { probe?: true }).probe).toBeUndefined()
    expect(e.query).toBeUndefined()
    expect(e.pathParams).toBeUndefined()
  })

  it('no worker entry names a user or a profile in its path, query or body (R1.1)', () => {
    for (const [name, e] of Object.entries(workerContract.entries as Record<string, EntryDef>)) {
      expect(e.path, name).not.toMatch(/:(userId|profileId|workerId|id)\b/)
      expect(Object.keys(e.query?.shape ?? {}), name).not.toEqual(expect.arrayContaining(['userId']))
    }
  })

  it('every non-GET worker entry carries an audit action, and workerWrite cannot be called without one (R8.1)', () => {
    for (const [name, e] of Object.entries(workerContract.entries as Record<string, EntryDef>)) {
      if (e.method !== 'GET') expect(e.meta.audit, name).toMatch(/^[A-Z][A-Z_]+$/)
    }
    const w = workerWrite('WORKER_PROFILE_UPDATED')
    expect(w.audit).toBe('WORKER_PROFILE_UPDATED')
    expect(w.maxBodyKb).toBe(16)
    expect(w.rateLimit).toEqual([
      { per: 'user', limit: 60, window: '1m' },
      { per: 'ip', limit: 120, window: '1m' },
    ])
    expect((w as { privateCacheSeconds?: number }).privateCacheSeconds).toBeUndefined()
    // @ts-expect-error the audit action is not optional
    expect(() => workerWrite()).toThrow()
    expect(workerRead({ privateCacheSeconds: 30 }).privateCacheSeconds).toBe(30)
  })

  it('the OpenAPI inventory lists 304 on the cached read and 503 on every entry (U1-MNT-03)', () => {
    const doc = toOpenApi(contracts, { title: 't', version: '1' }) as { paths: Record<string, Record<string, { responses: Record<string, unknown> }>> }
    const read = doc.paths['/v1/worker/profile']!.get!
    expect(Object.keys(read.responses)).toEqual(expect.arrayContaining(['200', '304', '401', '403', '429', '500', '503']))
    expect(read.responses['304']).not.toHaveProperty('content')
    for (const ops of Object.values(doc.paths)) for (const op of Object.values(ops)) expect(Object.keys(op.responses)).toContain('503')
    const health = doc.paths['/v1/health']!.get!
    expect(Object.keys(health.responses)).not.toContain('304')
  })
})

// ---- The profile shape (E1): a generated Profile parses; an extra key anywhere is rejected (P10).

const str = (max: number) => fc.string({ maxLength: max })
const nstr = (max: number) => fc.option(str(max), { nil: null })
const month = fc.option(fc.constantFrom('January', 'Feb', 'Dec'), { nil: null })
const year = fc.option(fc.integer({ min: 1950, max: 2030 }), { nil: null })

const requirementItem = fc.record({
  id: str(80),
  name: str(120),
  requirementType: str(80),
  documentType: fc.constantFrom('REQUIRED', 'OPTIONAL'),
  status: fc.constantFrom(...REQUIREMENT_ITEM_STATUSES),
  description: fc.string({ maxLength: 1000 }),
  hasExpiration: fc.boolean(),
})

const additionalCredential = fc.record({
  id: str(80),
  name: str(120),
  category: fc.constantFrom('INSURANCE' as const, 'TRANSPORT' as const),
  description: fc.string({ maxLength: 1000 }),
  documentType: fc.constantFrom('REQUIRED' as const, 'OPTIONAL' as const, 'CONDITIONAL' as const),
  conditionKey: nstr(80),
  requiredIfTrue: fc.option(fc.boolean(), { nil: null }),
  status: fc.constantFrom(...REQUIREMENT_ITEM_STATUSES),
})

export const profileArb: fc.Arbitrary<Profile> = fc.record({
  id: str(40),
  names: fc.record({ firstName: str(100), middleName: nstr(100), lastName: str(100) }),
  mobile: str(40),
  photos: fc.record({ main: nstr(2048) }),
  bio: nstr(2000),
  personalInfo: fc.record({
    dateOfBirth: nstr(20),
    age: fc.option(fc.integer({ min: 0, max: 120 }), { nil: null }),
    gender: nstr(40),
    hasVehicle: fc.constantFrom('Yes', 'No', null),
    languages: fc.array(str(40), { maxLength: 50 }),
  }),
  abn: fc.option(fc.record({ type: fc.constantFrom('abn', 'tfn'), value: nstr(20), signed: fc.boolean() }), { nil: null }),
  homeAddress: fc.option(fc.record({ streetLine: nstr(200), localityId: fc.integer({ min: 1 }), suburb: str(100), state: str(10), postcode: str(10) }), { nil: null }),
  serviceArea: fc.option(fc.record({ localityId: fc.integer({ min: 1 }), label: str(120), travelRadiusKm: fc.integer({ min: 1, max: 500 }), precision: fc.constantFrom('LOCALITY', 'ADDRESS') }), { nil: null }),
  displayRole: str(200),
  verificationStatus: fc.constantFrom(...VERIFICATION_STATUSES),
  isPublished: fc.boolean(),
  completion: fc.record({
    accountDetails: fc.boolean(),
    compliance: fc.boolean(),
    trainings: fc.boolean(),
    services: fc.boolean(),
    profileCompleted: fc.boolean(),
    percent: fc.integer({ min: 0, max: 100 }),
  }),
  requirements: fc.record({ mandatory: fc.array(requirementItem, { maxLength: 20 }), trainings: fc.array(requirementItem, { maxLength: 20 }), additional: fc.array(additionalCredential, { maxLength: 6 }) }),
  services: fc.array(fc.record({ categoryId: str(80), categoryName: str(120), subcategoryIds: fc.array(str(80), { maxLength: 5 }), subcategoryNames: fc.array(str(120), { maxLength: 5 }) }), { maxLength: 10 }),
  serviceRegistrations: fc.array(
    fc.record({
      categoryId: fc.constantFrom('nursing-services' as const, 'therapeutic-supports' as const),
      nursingType: fc.option(fc.constantFrom('registered' as const, 'enrolled' as const), { nil: null }),
      hasExperience: fc.option(fc.boolean(), { nil: null }),
      registrationNumber: nstr(60),
      expiryDate: fc.option(fc.constantFrom('2027-05-31', '2035-06-22'), { nil: null }),
    }),
    { maxLength: 2 },
  ),
  serviceDocuments: fc.array(
    fc.record({
      id: str(40),
      serviceName: str(120),
      requirementType: str(80),
      name: str(200),
      status: fc.constantFrom('SUBMITTED', 'APPROVED', 'REJECTED'),
      url: nstr(2048),
      fileName: nstr(200),
      uploadedAt: fc.option(fc.constant('2026-10-15T01:02:03.000Z'), { nil: null }),
    }),
    { maxLength: 3 },
  ),
  complianceDocuments: fc.array(
    fc.record({
      id: str(40),
      requirementType: str(120),
      name: str(200),
      status: fc.constantFrom('SUBMITTED', 'APPROVED', 'PENDING'),
      documentCategory: fc.option(fc.constantFrom('PRIMARY', 'SECONDARY', 'WORKING_RIGHTS'), { nil: null }),
      url: nstr(2048),
      fileName: nstr(200),
      uploadedAt: fc.option(fc.constant('2026-10-15T01:02:03.000Z'), { nil: null }),
      expiresAt: fc.option(fc.constant('2027-01-01T00:00:00.000Z'), { nil: null }),
      isCitizen: fc.option(fc.boolean(), { nil: null }),
    }),
    { maxLength: 3 },
  ),
  sections: fc.record({
    availability: fc.array(fc.record({ day: fc.constantFrom(...DAYS_OF_WEEK), startMinute: fc.integer({ min: 0, max: 1440 }), endMinute: fc.integer({ min: 0, max: 1440 }) }), { maxLength: 20 }),
    experience: fc.array(fc.record({ domain: fc.constantFrom(...CARE_DOMAINS), isProfessional: fc.boolean(), isPersonal: fc.boolean(), specificAreas: fc.array(str(120), { maxLength: 5 }), otherAreas: fc.array(str(120), { maxLength: 5 }), description: nstr(2000) }), { maxLength: 5 }),
    jobHistory: fc.array(fc.record({ id: str(40), jobTitle: str(200), company: str(200), startMonth: month, startYear: year, endMonth: month, endYear: year, currentlyWorking: fc.boolean() }), { maxLength: 10 }),
    education: fc.array(fc.record({ id: str(40), institution: str(200), qualification: str(200), startMonth: month, startYear: year, endMonth: month, endYear: year, currentlyStudying: fc.boolean() }), { maxLength: 10 }),
    additionalInfo: fc.option(
      fc.record({
        languages: fc.array(str(40), { maxLength: 10 }),
        culturalBackground: fc.array(str(80), { maxLength: 10 }),
        religion: fc.array(str(80), { maxLength: 10 }),
        interests: fc.array(str(80), { maxLength: 10 }),
        workPreferences: fc.array(str(80), { maxLength: 10 }),
        lgbtqiaSupport: fc.option(fc.boolean(), { nil: null }),
        nonSmoker: fc.option(fc.boolean(), { nil: null }),
        petFriendly: fc.option(fc.boolean(), { nil: null }),
        personality: nstr(2000),
        uniqueService: fc.array(str(200), { maxLength: 10 }),
        funFact: nstr(1000),
      }),
      { nil: null },
    ),
    bankAccount: fc.option(fc.record({ accountName: str(100), bankName: str(100), bsbLast3: fc.stringMatching(/^\d{3}$/), accountNumberLast3: fc.stringMatching(/^\d{3}$/) }), { nil: null }),
  }),
  updatedAt: fc.date({ min: new Date('2000-01-01'), max: new Date('2100-01-01'), noInvalidDate: true }).map((d) => d.toISOString()),
})

describe('profileSchema (E1)', () => {
  it('accepts every generated profile and rejects an extra key at any level', () => {
    fc.assert(
      fc.property(profileArb, fc.constantFrom('top', 'names', 'completion', 'sections', 'additionalInfo'), (p, where) => {
        expect(profileSchema.safeParse(p).success).toBe(true)
        const extra = structuredClone(p) as Record<string, unknown>
        if (where === 'top') extra.passwordHash = 'x'
        else if (where === 'names') (extra.names as Record<string, unknown>).email = 'x'
        else if (where === 'completion') (extra.completion as Record<string, unknown>).internal = 1
        else if (where === 'sections') (extra.sections as Record<string, unknown>).storageKey = 'x'
        else {
          const sections = extra.sections as { additionalInfo: Record<string, unknown> | null }
          sections.additionalInfo = { ...(sections.additionalInfo ?? (p.sections.additionalInfo ?? emptyInfo())), bankAccount: { bsb: '123456' } }
        }
        expect(profileSchema.safeParse(extra).success).toBe(false)
      }),
      { numRuns: 60 },
    )
  })

  it('U5b: an item from an api older than its description and expiry flag reads with neither', () => {
    const p = fc.sample(profileArb, 1)[0]!
    const old = { id: 'police-check', name: 'Police Check', requirementType: 'police-check', documentType: 'REQUIRED', status: 'missing' }
    const parsed = profileSchema.safeParse({ ...p, requirements: { ...p.requirements, mandatory: [old] } })
    expect(parsed.success && parsed.data.requirements.mandatory[0]).toEqual({ ...old, description: '', hasExpiration: false })
  })

  it('U4e: an api older than requirements.additional still reads (none); an unknown category does not', () => {
    const p = fc.sample(profileArb, 1)[0]!
    const { additional: _gone, ...older } = p.requirements
    const parsed = profileSchema.safeParse({ ...p, requirements: older })
    expect(parsed.success && parsed.data.requirements.additional).toEqual([])
    const bad = { ...p, requirements: { ...p.requirements, additional: [{ id: 'x', name: 'X', category: 'IDENTITY', description: '', documentType: 'REQUIRED', conditionKey: null, requiredIfTrue: null, status: 'missing' }] } }
    expect(profileSchema.safeParse(bad).success).toBe(false)
  })

  it('never carries the stored bank account: only the masked shape fits', () => {
    const p = fc.sample(profileArb, 1)[0]!
    const leaked = { ...p, sections: { ...p.sections, bankAccount: { accountName: 'A', bankName: 'B', bsb: '123456', accountNumber: '12345678' } } }
    expect(profileSchema.safeParse(leaked).success).toBe(false)
  })
})

function emptyInfo() {
  return { languages: [], culturalBackground: [], religion: [], interests: [], workPreferences: [], lgbtqiaSupport: null, nonSmoker: null, petFriendly: null, personality: null, uniqueService: [], funFact: null }
}

describe('the tour entries (onboarding-tour U1)', () => {
  const entries = workerContract.entries as Record<string, EntryDef>

  it('getTour: a WORKER-only GET with the read limits and no private cache, so the api answers no-store (BR-6, BR-7)', () => {
    const e = entries.getTour!
    expect([e.method, e.path]).toEqual(['GET', '/v1/worker/tour'])
    expect(e.meta.access).toEqual({ roles: ['WORKER'] })
    expect(e.meta.rateLimit).toEqual([
      { per: 'user', limit: 120, window: '1m' },
      { per: 'ip', limit: 300, window: '1m' },
    ])
    expect(e.meta.privateCacheSeconds).toBeUndefined()
    expect(e.responses[200]).toBe(tourViewSchema)
  })

  it('putTourSeen: a WORKER-only PUT with no body, the write limits, a 1 KB body limit and the profile audit action (BR-4..BR-6)', () => {
    const e = entries.putTourSeen!
    expect([e.method, e.path]).toEqual(['PUT', '/v1/worker/tour/seen'])
    expect(e.meta.access).toEqual({ roles: ['WORKER'] })
    expect(e.body).toBeUndefined()
    expect(e.meta.maxBodyKb).toBe(1)
    expect(e.meta.audit).toBe('PROFILE_UPDATE')
    expect(e.meta.rateLimit).toEqual([
      { per: 'user', limit: 60, window: '1m' },
      { per: 'ip', limit: 120, window: '1m' },
    ])
  })

  it('the profile read is unchanged by the tour (BR-8: the deployed app parses it strictly)', () => {
    expect(Object.keys(profileSchema.shape)).not.toContain('seenAt')
    expect(Object.keys(profileSchema.shape)).not.toContain('tourSeenAt')
  })

  it('workerRead({ noCache: true }) sets no private cache; the default stays 60 s', () => {
    expect(workerRead({ noCache: true }).privateCacheSeconds).toBeUndefined()
    expect(workerRead().privateCacheSeconds).toBe(60)
  })

  it('property (P8 U1-3): any stored instant or null, sent as the api sends it, parses and round-trips', () => {
    fc.assert(
      fc.property(fc.option(fc.date({ min: new Date('2000-01-01T00:00:00Z'), max: new Date('2100-01-01T00:00:00Z'), noInvalidDate: true }), { nil: null }), (d) => {
        const body = JSON.parse(JSON.stringify({ seenAt: d === null ? null : d.toISOString() }))
        const parsed = tourViewSchema.parse(body)
        expect(parsed.seenAt === null ? null : new Date(parsed.seenAt).getTime()).toBe(d === null ? null : d.getTime())
      }),
    )
  })

  it('refuses anything but the one field', () => {
    expect(tourViewSchema.safeParse({ seenAt: null, extra: 1 }).success).toBe(false)
    expect(tourViewSchema.safeParse({}).success).toBe(false)
    expect(tourViewSchema.safeParse({ seenAt: 'yesterday' }).success).toBe(false)
  })
})

describe('the completion entry (onboarding-tour C1)', () => {
  const e = (workerContract.entries as Record<string, EntryDef>).getCompletion!

  it('getCompletion: a WORKER-only GET with the read limits, privately cacheable for a minute (CR-9)', () => {
    expect([e.method, e.path]).toEqual(['GET', '/v1/worker/completion'])
    expect(e.meta.access).toEqual({ roles: ['WORKER'] })
    expect(e.meta.privateCacheSeconds).toBe(60)
    expect(e.responses[200]).toBe(completionViewSchema)
  })

  it('the My Profile pages: 18 slugs, unique, 11 required (CD3)', () => {
    expect(MY_PROFILE_PAGES).toHaveLength(18)
    expect(new Set(MY_PROFILE_PAGES.map((p) => p.slug)).size).toBe(18)
    expect(MY_PROFILE_PAGES.filter((p) => p.required)).toHaveLength(11)
  })

  it('the view is strict: three groups, bounded lists, no extra field', () => {
    const ok = { percent: 91, profileCompleted: false, groups: ['my-profile', 'services', 'compliance'].map((id) => ({ id, complete: false, done: 0, total: 1, firstUnfinished: 'name' })), items: [], serviceDocuments: [] }
    expect(completionViewSchema.safeParse(ok).success).toBe(true)
    expect(completionViewSchema.safeParse({ ...ok, extra: 1 }).success).toBe(false)
    expect(completionViewSchema.safeParse({ ...ok, groups: ok.groups.slice(0, 2) }).success).toBe(false)
    expect(completionViewSchema.safeParse({ ...ok, percent: 101 }).success).toBe(false)
  })

  it('the profile read is unchanged by it (NFR-C1)', () => {
    expect(Object.keys(profileSchema.shape)).not.toContain('items')
  })
})
