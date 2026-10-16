// The U2 section writes on PostGIS (edit-profile properties P1, P2, P4-P7, P9; rules R1-R7):
// through the real pipeline and transactions, on the seeded worker harness. Runs only when
// TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { ageOn } from '@remonta/api-contract'
import { CULTURAL_BACKGROUNDS, INTERESTS, LANGUAGES, PERSONALITIES, RELIGIONS, UNIQUE_SERVICES, WORK_PREFERENCES } from '@remonta/schemas/data/profileOptions'
import { EXAMPLE_ABN } from '@remonta/schemas/validations/abn'
import pino from 'pino'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { claimAsPhoto } from '../../src/modules/worker/application/photos'
import { parseStoredFlags } from '../../src/modules/worker/domain/persist-completion'
import { onboardingReconcilerJob } from '../../src/modules/onboarding/reconciler'
import { writeTransaction } from '../../src/platform/persistence/db'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const LEGACY = { location: true, city: true, state: true, postalCode: true, latitude: true, longitude: true } as const

describe.skipIf(!local)('the section writes on PostGIS', () => {
  let h: WorkerHarness
  // The Blob store: deletes are recorded, never sent (F1). The bucket is never reached by these tests.
  const blobDeletes: string[] = []
  const photos = { bucket: {} as never, publicBaseUrl: 'https://storage.test', ipHashSecret: 'x'.repeat(32), blob: { delete: async (u: string) => void blobDeletes.push(u) } }
  const put = (path: string, body: unknown, user = () => h.a.userId) => h.t.fastify.inject({ method: 'PUT', url: path, headers: { 'x-test-principal': `${user()}:WORKER` }, payload: body as object })
  const post = (path: string, body: unknown, user = () => h.a.userId) => h.t.fastify.inject({ method: 'POST', url: path, headers: { 'x-test-principal': `${user()}:WORKER` }, payload: body as object })
  const profile = async (user = () => h.a.userId) => (await h.get(user())).json()

  beforeAll(async () => {
    h = await workerHarness('worker-sections.test', { photos })
  }, 60_000)
  afterAll(async () => {
    await h.close()
  })

  const cases: [string, string, unknown, (p: any) => unknown][] = [
    ['name', '/v1/worker/profile/name', { firstName: 'Zoë', middleName: null, lastName: "O'Neil" }, (p) => p.names],
    ['bio', '/v1/worker/profile/bio', { bio: 'A bio with\na second line.' }, (p) => ({ bio: p.bio })],
    ['date of birth', '/v1/worker/profile/date-of-birth', { dateOfBirth: '1991-04-02' }, (p) => ({ dateOfBirth: p.personalInfo.dateOfBirth })],
    ['gender', '/v1/worker/profile/gender', { gender: 'Male' }, (p) => ({ gender: p.personalInfo.gender })],
    ['gender, prefer not to say (2026-10-14)', '/v1/worker/profile/gender', { gender: 'Prefer not to say' }, (p) => ({ gender: p.personalInfo.gender })],
    ['vehicle', '/v1/worker/profile/vehicle', { hasVehicle: 'No' }, (p) => ({ hasVehicle: p.personalInfo.hasVehicle })],
    ['availability', '/v1/worker/availability', { slots: [{ day: 'TUESDAY', startMinute: 600, endMinute: 720 }, { day: 'MONDAY', startMinute: 540, endMinute: 600 }] }, (p) => ({ slots: p.sections.availability })],
    ['job history', '/v1/worker/job-history', { entries: [{ jobTitle: 'Lead', company: 'B', startMonth: 'May', startYear: 2022, endMonth: null, endYear: null, currentlyWorking: true }, { jobTitle: 'Carer', company: 'A', startMonth: 'January', startYear: 2019, endMonth: 'April', endYear: 2022, currentlyWorking: false }] }, (p) => ({ entries: p.sections.jobHistory.map(({ id: _id, ...e }: any) => e) })],
    ['education', '/v1/worker/education', { entries: [] }, (p) => ({ entries: p.sections.education })],
    ['experience', '/v1/worker/experience', { domains: [{ domain: 'DISABILITY', isProfessional: false, isPersonal: true, specificAreas: [], otherAreas: ['Sign language'], description: null }] }, (p) => ({ domains: p.sections.experience })],
  ]

  it.each(cases)('P1/P2 %s: write, read back equal; the same body twice gives the same answer', async (_label, path, body, view) => {
    const first = await put(path, body)
    expect(first.statusCode, first.body).toBe(200)
    const second = await put(path, body)
    // Equal answers; a list replace gives its rows new ids each time (PR2-summary deviation 6), so ids are left out.
    const noIds = (b: any) => (b.entries ? { entries: b.entries.map(({ id: _id, ...e }: any) => e) } : b)
    expect(noIds(second.json())).toEqual(noIds(first.json()))
    const read = view(await profile())
    if (path.endsWith('availability')) expect(read).toEqual({ slots: [{ day: 'MONDAY', startMinute: 540, endMinute: 600 }, { day: 'TUESDAY', startMinute: 600, endMinute: 720 }] }) // stored in week order
    else expect(read).toEqual(first.json().entries ? { entries: first.json().entries.map(({ id: _id, ...e }: any) => e) } : first.json())
  })

  it('audit P2/P4/P5: a section write is the lookup (with the timeout), the work, the re-read, the audit -- nothing more', async () => {
    await put('/v1/worker/profile/bio', { bio: 'Warm the catalogue cache.' })
    h.queries.length = 0
    const res = await put('/v1/worker/profile/bio', { bio: 'Counting the round trips of one write.' })
    expect(res.statusCode, res.body).toBe(200)
    const data = h.queries.filter((q) => !/^(BEGIN|COMMIT|ROLLBACK|DEALLOCATE)/i.test(q.trim()))
    expect(h.queries.some((q) => /^SET TRANSACTION/i.test(q.trim()))).toBe(false) // P2
    expect(data.filter((q) => /set_config\('statement_timeout'/.test(q))).toHaveLength(1)
    expect(data.find((q) => /set_config/.test(q))).toMatch(/FROM worker_profiles/) // P5: one statement with the lookup
    // lookup, UPDATE, the re-read (catalogue cached), the audit insert; a changed flag would add its UPDATE.
    expect(data.length).toBeLessThanOrEqual(5)
    expect(data.filter((q) => /"setupProgress"/.test(q) && /^SELECT/i.test(q.trim()) && !/"firstName"/.test(q))).toHaveLength(0) // P4
  })

  it('the ABN: stored with the value, signed kept as stored; the read shows it', async () => {
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { abn: { workerEngagementType: { type: 'abn', signed: true } } } })
    const res = await put('/v1/worker/profile/abn', { abn: '51 824 753 556' })
    expect(res.json()).toEqual({ type: 'abn', value: EXAMPLE_ABN, signed: true })
    await h.db.workerProfile.update({ where: { id: h.b.profileId }, data: { abn: { workerEngagementType: { type: 'tfn', signed: true } } } })
    const b = await put('/v1/worker/profile/abn', { abn: EXAMPLE_ABN }, () => h.b.userId)
    expect(b.json()).toEqual({ type: 'abn', value: EXAMPLE_ABN, signed: false }) // a TFN record is replaced (D17)
    expect((await profile()).abn).toEqual({ type: 'abn', value: EXAMPLE_ABN, signed: true })
  })

  it('P7: a group write changes only that group', async () => {
    await put('/v1/worker/additional-info/languages', { languages: ['English', 'Hindi'] })
    await put('/v1/worker/additional-info/personality', { personality: 'Calm and relaxed', nonSmoker: true, petFriendly: true })
    const before = (await profile()).sections.additionalInfo
    const res = await put('/v1/worker/additional-info/religion', { religion: ['Buddhist'] })
    expect(res.json()).toEqual({ religion: ['Buddhist'] })
    const after = (await profile()).sections.additionalInfo
    expect(after).toEqual({ ...before, religion: ['Buddhist'] })
    expect((await put('/v1/worker/additional-info/religion', { languages: [] })).statusCode).toBe(400) // another group's field
  })

  it('every group entry saves its own columns and records its own audit section (2026-10-14: one entry per group)', async () => {
    const bodies: Record<string, object> = {
      'good-to-know': { lgbtqiaSupport: true },
      languages: { languages: [LANGUAGES[0]] },
      'cultural-background': { culturalBackground: [CULTURAL_BACKGROUNDS[0]] },
      religion: { religion: [RELIGIONS[0]] },
      interests: { interests: [INTERESTS[0]] },
      'support-activities': { uniqueService: [UNIQUE_SERVICES[0]] },
      'fun-fact': { funFact: 'I once cycled from Brisbane to the Gold Coast for a fundraiser.' },
      preferences: { workPreferences: [WORK_PREFERENCES[0]] },
      personality: { personality: PERSONALITIES[0], nonSmoker: true, petFriendly: false },
    }
    for (const [g, body] of Object.entries(bodies)) {
      const res = await put(`/v1/worker/additional-info/${g}`, body)
      expect(res.statusCode, `${g}: ${res.body}`).toBe(200)
      expect(res.json(), g).toEqual(body)
      expect(await h.db.auditLog.count({ where: { userId: h.a.userId, action: 'PROFILE_UPDATE', metadata: { path: ['section'], equals: `putAdditionalInfo.${g}` } } }), g).toBeGreaterThan(0)
    }
  })

  it('the activities and the fun fact save alone, each leaving the other as it was (2026-10-13: about-me split in two)', async () => {
    const fact = 'I once cycled from Brisbane to the Gold Coast for a fundraiser.'
    expect((await put('/v1/worker/additional-info/fun-fact', { funFact: fact })).json()).toEqual({ funFact: fact })
    await put('/v1/worker/additional-info/support-activities', { uniqueService: ['Fishing trips'] })
    expect((await profile()).sections.additionalInfo).toMatchObject({ funFact: fact, uniqueService: ['Fishing trips'] })
    await put('/v1/worker/additional-info/fun-fact', { funFact: fact.replace('cycled', 'walked') })
    expect((await profile()).sections.additionalInfo).toMatchObject({ uniqueService: ['Fishing trips'] })
    expect((await put('/v1/worker/additional-info/about-me', { uniqueService: ['Fishing trips'], funFact: fact })).statusCode).toBe(404)
  })

  it("deleting an education row removes that row only; another worker's row or a gone one is 404 (2026-10-14)", async () => {
    const del = (id: string) => h.t.fastify.inject({ method: 'DELETE', url: `/v1/worker/education/${id}`, headers: { 'x-test-principal': `${h.a.userId}:WORKER` } })
    const course = (qualification: string) => ({ institution: 'TAFE', qualification, startMonth: 'February', startYear: 2018, endMonth: 'November', endYear: 2018, currentlyStudying: false })
    const mine = (await put('/v1/worker/education', { entries: [course('Cert III'), course('Cert IV'), course('Diploma')] })).json().entries as { id: string }[]
    const theirs = (await put('/v1/worker/education', { entries: [course('Theirs')] }, () => h.b.userId)).json().entries as { id: string }[]
    const res = await del(mine[0]!.id)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json().entries.map((e: { qualification: string }) => e.qualification)).toEqual(['Cert IV', 'Diploma'])
    expect((await del(mine[0]!.id)).statusCode).toBe(404) // already gone
    expect((await del(theirs[0]!.id)).statusCode).toBe(404) // another worker's row: not revealed, not deleted
    expect(await h.db.workerEducation.count({ where: { id: theirs[0]!.id } })).toBe(1)
    expect(await h.db.auditLog.count({ where: { userId: h.a.userId, action: 'PROFILE_UPDATE', metadata: { path: ['section'], equals: 'deleteEducationEntry' } } })).toBeGreaterThan(0)
    expect((await profile()).sections.education.map((e: { qualification: string }) => e.qualification)).toEqual(['Cert IV', 'Diploma'])
  })

  it("deleting a work-history row removes that row only; another worker's row or a gone one is 404 (2026-10-14)", async () => {
    const del = (id: string, user = () => h.a.userId) => h.t.fastify.inject({ method: 'DELETE', url: `/v1/worker/job-history/${id}`, headers: { 'x-test-principal': `${user()}:WORKER` } })
    const job = (jobTitle: string) => ({ jobTitle, company: 'Co', startMonth: 'January', startYear: 2019, endMonth: 'March', endYear: 2020, currentlyWorking: false })
    const mine = (await put('/v1/worker/job-history', { entries: [job('First'), job('Second'), job('Third')] })).json().entries as { id: string; jobTitle: string }[]
    const theirs = (await put('/v1/worker/job-history', { entries: [job('Theirs')] }, () => h.b.userId)).json().entries as { id: string }[]
    const res = await del(mine[1]!.id)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json().entries.map((e: { jobTitle: string }) => e.jobTitle)).toEqual(['First', 'Third']) // the order kept
    expect(await h.db.workerJobHistory.count({ where: { id: mine[1]!.id } })).toBe(0)
    expect((await del(mine[1]!.id)).statusCode).toBe(404) // already gone
    expect((await del(theirs[0]!.id)).statusCode).toBe(404) // another worker's row: not revealed, not deleted
    expect(await h.db.workerJobHistory.count({ where: { id: theirs[0]!.id } })).toBe(1)
    expect(await h.db.auditLog.count({ where: { userId: h.a.userId, action: 'PROFILE_UPDATE', metadata: { path: ['section'], equals: 'deleteJobHistoryEntry' } } })).toBeGreaterThan(0)
    expect((await profile()).sections.jobHistory.map((e: { jobTitle: string }) => e.jobTitle)).toEqual(['First', 'Third'])
  })

  it("deleting an experience area removes that row only, the caller's own; a repeat is a 200 (2026-10-14)", async () => {
    const del = (domain: string, user = () => h.a.userId) => h.t.fastify.inject({ method: 'DELETE', url: `/v1/worker/experience/${domain}`, headers: { 'x-test-principal': `${user()}:WORKER` } })
    const area = (domain: string) => ({ domain, isProfessional: true, isPersonal: false, specificAreas: [], otherAreas: [], description: null })
    expect((await put('/v1/worker/experience', { domains: [area('AGED_CARE'), area('DISABILITY')] })).statusCode).toBe(200)
    expect((await put('/v1/worker/experience', { domains: [area('DISABILITY')] }, () => h.b.userId)).statusCode).toBe(200)
    const res = await del('DISABILITY')
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ domains: [area('AGED_CARE')] })
    expect(await h.db.workerExperience.findMany({ where: { workerProfileId: h.a.profileId }, select: { domain: true } })).toEqual([{ domain: 'AGED_CARE' }])
    expect(await h.db.workerExperience.count({ where: { workerProfileId: h.b.profileId, domain: 'DISABILITY' } })).toBe(1) // worker B untouched
    expect((await del('DISABILITY')).json()).toEqual({ domains: [area('AGED_CARE')] }) // already gone: same answer
    expect(await h.db.auditLog.count({ where: { userId: h.a.userId, action: 'PROFILE_UPDATE', metadata: { path: ['section'], equals: 'deleteExperience.DISABILITY' } } })).toBeGreaterThan(0)
    expect((await profile()).sections.experience).toEqual([area('AGED_CARE')])
  })

  it('the date of birth, the gender and the vehicle answer save alone, each leaving the other two as they were (2026-10-14: personal-info split in three)', async () => {
    // A worker with none of the three answers can save any one of them first: no page needs the others.
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { dateOfBirth: null, gender: null, hasVehicle: null } })
    expect((await put('/v1/worker/profile/gender', { gender: 'Female' })).json()).toEqual({ gender: 'Female' })
    expect((await profile()).personalInfo).toMatchObject({ dateOfBirth: null, gender: 'Female', hasVehicle: null })
    expect((await put('/v1/worker/profile/vehicle', { hasVehicle: 'Yes' })).json()).toEqual({ hasVehicle: 'Yes' })
    expect((await put('/v1/worker/profile/date-of-birth', { dateOfBirth: '1988-11-30' })).json()).toEqual({ dateOfBirth: '1988-11-30' })
    expect((await profile()).personalInfo).toMatchObject({ dateOfBirth: '1988-11-30', gender: 'Female', hasVehicle: 'Yes' })
    // Fix 2026-10-14: a new date moves the age, in the read and in the stored column the old readers use.
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { age: 99 } })
    await put('/v1/worker/profile/date-of-birth', { dateOfBirth: '1995-01-01' })
    const expected = ageOn('1995-01-01', new Date())
    expect((await profile()).personalInfo.age).toBe(expected)
    expect((await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { age: true } })).age).toBe(expected)
    await put('/v1/worker/profile/date-of-birth', { dateOfBirth: '1988-11-30' })
    await put('/v1/worker/profile/vehicle', { hasVehicle: 'No' })
    expect((await profile()).personalInfo).toMatchObject({ dateOfBirth: '1988-11-30', gender: 'Female', hasVehicle: 'No' })
    expect((await put('/v1/worker/profile/gender', { gender: 'Male', hasVehicle: 'Yes' })).statusCode).toBe(400) // one answer per write
    expect((await put('/v1/worker/profile/personal-info', { dateOfBirth: '1988-11-30', gender: 'Female', hasVehicle: 'No' })).statusCode).toBe(404) // the combined write is gone
  })

  it('P4: the bank account is stored whole and every response and log line shows only the last three digits', async () => {
    h.logs.length = 0
    const res = await put('/v1/worker/bank-account', { accountName: 'M Lee', bankName: 'CBA', bsb: '062-917', accountNumber: '87654321' })
    expect(res.json()).toEqual({ accountName: 'M Lee', bankName: 'CBA', bsbLast3: '917', accountNumberLast3: '321' })
    const stored = await h.db.workerAdditionalInfo.findUniqueOrThrow({ where: { workerProfileId: h.a.profileId }, select: { bankAccount: true } })
    expect(stored.bankAccount).toEqual({ accountName: 'M Lee', bankName: 'CBA', bsb: '062917', accountNumber: '87654321' })
    const read = await h.get(h.a.userId)
    for (const text of [res.body, read.body, JSON.stringify(h.logs)]) {
      expect(text).not.toContain('87654321')
      expect(text).not.toContain('062917')
    }
    const audit = await h.db.auditLog.findFirst({ where: { userId: h.a.userId }, orderBy: { createdAt: 'desc' }, select: { action: true, metadata: true } })
    expect(audit?.action).toBe('PROFILE_UPDATE')
    expect(JSON.stringify(audit?.metadata)).not.toContain('87654321')
  })

  it('P5: the home address writes its two columns only; the legacy columns and the HOME row are untouched', async () => {
    const before = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: LEGACY })
    const homeBefore = await h.db.workerLocation.findFirst({ where: { workerProfileId: h.a.profileId, kind: 'HOME' } })
    const locality = await h.db.auLocality.findFirstOrThrow({ where: { searchName: 'north sydney', retiredAt: null }, select: { id: true, suburb: true, state: true, postcode: true } })
    const res = await put('/v1/worker/profile/home-address', { streetLine: '12 Example St', localityId: locality.id })
    expect(res.json()).toEqual({ streetLine: '12 Example St', localityId: locality.id, suburb: locality.suburb, state: locality.state, postcode: locality.postcode })
    expect((await profile()).homeAddress).toEqual(res.json()) // the read returns it to its owner
    expect(await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: LEGACY })).toEqual(before)
    expect(await h.db.workerLocation.findFirst({ where: { workerProfileId: h.a.profileId, kind: 'HOME' } })).toEqual(homeBefore)
    expect((await put('/v1/worker/profile/home-address', { streetLine: '1 A St', localityId: 999_999_999 })).json().error.fields).toHaveProperty('localityId')
    // The street line is optional (2026-10-16): a suburb alone is saved and read back with no street.
    const suburbOnly = await put('/v1/worker/profile/home-address', { streetLine: '', localityId: locality.id })
    expect(suburbOnly.statusCode, suburbOnly.body).toBe(200)
    expect(suburbOnly.json()).toEqual({ streetLine: null, localityId: locality.id, suburb: locality.suburb, state: locality.state, postcode: locality.postcode })
    expect((await profile()).homeAddress).toEqual(suburbOnly.json())
    expect((await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { homeStreetLine: true } })).homeStreetLine).toBeNull()
  })

  it('P6: the service area places the worker (an unplaced one too), writes the legacy columns, and the reconciler keeps it', async () => {
    const north = await h.db.auLocality.findFirstOrThrow({ where: { searchName: 'north sydney', retiredAt: null }, select: { id: true, suburb: true, state: true, postcode: true, latitude: true } })
    const res = await put('/v1/worker/profile/service-area', { localityId: north.id, travelRadiusKm: 25 }, () => h.b.userId)
    expect(res.json()).toMatchObject({ localityId: north.id, travelRadiusKm: 25, precision: 'LOCALITY' })
    const home = await h.db.workerLocation.findFirstOrThrow({ where: { workerProfileId: h.b.profileId, kind: 'HOME' } })
    expect(home).toMatchObject({ localityId: north.id, source: 'ONBOARDING', travelRadiusKm: 25 })
    const legacy = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId }, select: LEGACY })
    expect(legacy).toMatchObject({ city: north.suburb, state: north.state, postalCode: north.postcode, latitude: north.latitude })
    await h.db.workerProfile.update({ where: { id: h.b.profileId }, data: { updatedAt: new Date() } }) // the reconciler's watermark sees it
    await onboardingReconcilerJob(h.db, pino({ level: 'silent' }), { everyMs: 60_000 }).run({ watermark: new Date(Date.now() - 60_000), now: new Date(), signal: new AbortController().signal })
    expect(await h.db.workerLocation.findFirstOrThrow({ where: { workerProfileId: h.b.profileId, kind: 'HOME' } })).toMatchObject({ localityId: north.id, source: 'ONBOARDING' })
    const again = await put('/v1/worker/profile/service-area', { localityId: north.id, travelRadiusKm: 30 }, () => h.b.userId)
    expect(again.statusCode).toBe(200)
    expect(await h.db.workerLocation.count({ where: { workerProfileId: h.b.profileId, kind: 'HOME' } })).toBe(1)
  })

  it('completion is persisted by the writes that can change it, and the read\'s ETag moves', async () => {
    const etag = (await h.get(h.b.userId)).headers['etag']
    await put('/v1/worker/profile/name', { firstName: 'Benjamin', middleName: null, lastName: 'Nguyen' }, () => h.b.userId) // a real change (the harness seeds Ben)
    expect((await h.get(h.b.userId)).headers['etag']).not.toBe(etag)
    // The invariant: after a write, the stored flags equal the flags the read computes. persistCompletion writes only
    // on a change (U1 P7), so the bare worker (all false before and after) keeps a null setupProgress -- still equal.
    // The filled worker's flags differ from its never-written null, so its write must land.
    await put('/v1/worker/profile/bio', { bio: 'A bio long enough to count toward the profile badge, written in one go.' })
    for (const w of [h.a, h.b]) {
      const stored = await h.db.workerProfile.findUniqueOrThrow({ where: { id: w.profileId }, select: { setupProgress: true, profileCompleted: true } })
      const c = (await profile(() => w.userId)).completion
      expect(parseStoredFlags(stored.setupProgress), w.userId).toEqual({ accountDetails: c.accountDetails, compliance: c.compliance, trainings: c.trainings, services: c.services })
      expect(stored.profileCompleted).toBe(c.profileCompleted)
    }
    const a = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true } })
    expect(a.setupProgress).not.toBeNull()
  })

  it('P9: a WORKER with no profile is 404 on every write; nothing is written', async () => {
    for (const [, path, body] of cases) expect((await put(path, body, () => h.orphan.userId)).statusCode, path).toBe(404)
  })

  it('photos: a confirmed upload becomes the one photo, claimed once by its first claimer only; the additionalPhotos column is left as stored', async () => {
    const id = crypto.randomUUID()
    const old = 'https://x.public.blob.vercel-storage.com/workers/a/main.jpg'
    const kept = '["https://blob.test/a2.jpg"]'
    await h.db.registrationPhotoUpload.create({ data: { id, blobKey: `staging/${id}`, url: `https://storage.test/staging/${id}`, contentType: 'image/jpeg', sizeBytes: 10, ipHash: 'x' } })
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { photos: old, additionalPhotos: kept } })
    const photos = await writeTransaction(h.db, (tx) => claimAsPhoto(tx, h.a.profileId, id, new Date()))
    expect(photos).toEqual({ main: `https://storage.test/staging/${id}` })
    expect(await writeTransaction(h.db, (tx) => claimAsPhoto(tx, h.a.profileId, id, new Date()))).toEqual(photos) // idempotent
    await expect(writeTransaction(h.db, (tx) => claimAsPhoto(tx, h.b.profileId, id, new Date()))).rejects.toMatchObject({ status: 404 })
    expect(await h.db.outboxEvent.count({ where: { type: 'PhotoUploaded', payload: { path: ['photoUploadId'], equals: id } } })).toBe(1)
    expect((await post('/v1/worker/photos/main', { url: old })).statusCode).toBe(404) // make-main is gone
    expect((await post('/v1/worker/photos/remove', { url: old })).statusCode).toBe(400) // no longer this worker's photo
    const removed = await post('/v1/worker/photos/remove', { url: `https://storage.test/staging/${id}` })
    expect(removed.json()).toEqual({ main: null })
    expect(await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { photos: true, additionalPhotos: true } })).toEqual({ photos: null, additionalPhotos: kept })
    await h.db.outboxEvent.deleteMany({ where: { type: 'PhotoUploaded', payload: { path: ['photoUploadId'], equals: id } } })
    await h.db.registrationPhotoUpload.delete({ where: { id } })
  })

  it("bug 2026-10-16: after the clean copy replaced the staging address, removing by the staging address the page still holds removes the photo and deletes the clean copy; another worker's staging address is refused", async () => {
    const id = crypto.randomUUID()
    const staged = `https://storage.test/staging/${id}`
    const clean = `https://x.public.blob.vercel-storage.com/workers/${h.a.profileId}/${id}.jpg`
    await h.db.registrationPhotoUpload.create({ data: { id, blobKey: `staging/${id}`, url: staged, contentType: 'image/jpeg', sizeBytes: 10, ipHash: 'x' } })
    await writeTransaction(h.db, (tx) => claimAsPhoto(tx, h.a.profileId, id, new Date()))
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { photos: clean } }) // the outbox handler's repoint
    expect((await post('/v1/worker/photos/remove', { url: staged }, () => h.b.userId)).statusCode).toBe(400) // B never claimed it
    blobDeletes.length = 0
    const res = await post('/v1/worker/photos/remove', { url: staged })
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ main: null })
    expect(blobDeletes).toEqual([clean, clean.replace(/\.jpg$/, '-256.jpg')])
    await h.db.outboxEvent.deleteMany({ where: { type: 'PhotoUploaded', payload: { path: ['photoUploadId'], equals: id } } })
    await h.db.registrationPhotoUpload.delete({ where: { id } })
  })

  it("F1: removing a photo deletes the file only from the caller's own folder; another worker's URL in their columns is cleared, never deleted", async () => {
    const upload = crypto.randomUUID()
    const blobOf = (profileId: string) => `https://x.public.blob.vercel-storage.com/workers/${profileId}/${upload}.jpg`
    // A's columns hold B's file, as the legacy updateWorkerPhoto action allows.
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { photos: blobOf(h.b.profileId), additionalPhotos: null } })
    blobDeletes.length = 0
    const res = await post('/v1/worker/photos/remove', { url: blobOf(h.b.profileId) })
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ main: null })
    expect(blobDeletes).toEqual([])
    // B's own file in B's folder: deleted with its thumbnail.
    await h.db.workerProfile.update({ where: { id: h.b.profileId }, data: { photos: blobOf(h.b.profileId), additionalPhotos: null } })
    const own = await post('/v1/worker/photos/remove', { url: blobOf(h.b.profileId) }, () => h.b.userId)
    expect(own.statusCode, own.body).toBe(200)
    expect(blobDeletes).toEqual([blobOf(h.b.profileId), blobOf(h.b.profileId).replace(/\.jpg$/, '-256.jpg')])
  })
})
