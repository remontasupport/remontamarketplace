// Every My Profile write, checked in the database (user, 2026-10-13: "check if all the apis are working and if they
// have been saved to their respective table/columns"). Each case calls the real endpoint through the pipeline, then
// reads the rows straight from the tables -- not through the api's own read -- and asserts:
//   1. the answer is 200;
//   2. each value is in its table and column, as stored (the column map below is the reference);
//   3. nothing else moved: the rest of worker_profiles and worker_additional_info is as it was, apart from
//      updatedAt and the completion columns a write may recompute;
//   4. one PROFILE_UPDATE audit row names the section;
//   5. the other worker's rows are untouched.
// Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { PROFILE_UPDATE } from '@remonta/api-contract'
import { experienceAreasOf } from '@remonta/schemas/data/experienceAreas'
import { CULTURAL_BACKGROUNDS, INTERESTS, RELIGIONS, WORK_PREFERENCES } from '@remonta/schemas/data/profileOptions'
import { EXAMPLE_ABN } from '@remonta/schemas/validations/abn'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

/** Columns any write may touch besides its own: the row's timestamp and the completion persistCompletion keeps. */
const ALWAYS_MAY_CHANGE = ['updatedAt', 'setupProgress', 'profileCompleted', 'verificationStatus']

type Row = Record<string, unknown>

/** The keys whose values differ between two rows (JSON-compared, so dates and JSON columns compare by value). */
function changedKeys(before: Row | null, after: Row | null): string[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])
  return [...keys].filter((k) => JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after?.[k] ?? null)).sort()
}

describe.skipIf(!local)('My Profile writes land in their tables and columns', () => {
  let h: WorkerHarness
  let otherSuburb: { id: number; suburb: string; state: string; postcode: string; latitude: number; longitude: number }

  const send = (method: 'PUT' | 'POST', path: string, body: unknown) =>
    h.t.fastify.inject({ method, url: path, headers: { 'x-test-principal': `${h.a.userId}:WORKER` }, payload: body as object })
  const profileRow = () => h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId } }) as Promise<Row>
  const infoRow = () => h.db.workerAdditionalInfo.findUnique({ where: { workerProfileId: h.a.profileId } }) as Promise<Row | null>
  /** Worker B's rows, for the isolation check. */
  const otherWorker = async () => ({
    profile: await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId } }),
    info: await h.db.workerAdditionalInfo.findUnique({ where: { workerProfileId: h.b.profileId } }),
    lists: await Promise.all([
      h.db.workerAvailability.count({ where: { workerProfileId: h.b.profileId } }),
      h.db.workerExperience.count({ where: { workerProfileId: h.b.profileId } }),
      h.db.workerJobHistory.count({ where: { workerProfileId: h.b.profileId } }),
      h.db.workerEducation.count({ where: { workerProfileId: h.b.profileId } }),
      h.db.workerLocation.count({ where: { workerProfileId: h.b.profileId } }),
    ]),
  })
  const audits = (section: string) =>
    h.db.auditLog.count({ where: { userId: h.a.userId, action: PROFILE_UPDATE as never, metadata: { path: ['section'], equals: section } } })

  /**
   * Sends the write and runs the four checks. `profileCols` / `infoCols` are the columns the write owns on
   * worker_profiles / worker_additional_info (exactly these may change); `expect` checks the stored values.
   */
  async function write(o: { section: string; method?: 'PUT' | 'POST'; path: string; body: unknown; profileCols?: string[]; infoCols?: string[]; check: () => Promise<void> }) {
    const [p0, i0, b0, a0] = [await profileRow(), await infoRow(), await otherWorker(), await audits(o.section)]
    const res = await send(o.method ?? 'PUT', o.path, o.body)
    expect(res.statusCode, `${o.path}: ${res.body}`).toBe(o.method === 'POST' && o.path.endsWith('/photos') ? 201 : 200)
    await o.check()
    const [p1, i1] = [await profileRow(), await infoRow()]
    const allowedP = new Set([...ALWAYS_MAY_CHANGE, ...(o.profileCols ?? [])])
    expect(changedKeys(p0, p1).filter((k) => !allowedP.has(k)), `worker_profiles columns ${o.section} must not touch`).toEqual([])
    const allowedI = new Set(['updatedAt', 'createdAt', 'id', 'workerProfileId', ...(o.infoCols ?? [])])
    expect(changedKeys(i0, i1).filter((k) => !allowedI.has(k)), `worker_additional_info columns ${o.section} must not touch`).toEqual([])
    expect(await audits(o.section), `one audit row for ${o.section}`).toBe(a0 + 1)
    expect(JSON.stringify(await otherWorker()), 'the other worker is untouched').toBe(JSON.stringify(b0))
    return res
  }

  beforeAll(async () => {
    h = await workerHarness('worker-columns.test')
    otherSuburb = await h.db.auLocality.findFirstOrThrow({
      where: { searchName: 'blacktown', state: 'NSW', retiredAt: null },
      select: { id: true, suburb: true, state: true, postcode: true, latitude: true, longitude: true },
    })
  }, 60_000)
  afterAll(async () => {
    await h.close()
  })

  // ---- Personal Information ---------------------------------------------------------------------------------

  it('Name -> worker_profiles.firstName, middleName, lastName', async () => {
    await write({
      section: 'putName',
      path: '/v1/worker/profile/name',
      body: { firstName: 'Zoë', middleName: 'Anne', lastName: "O'Neil" },
      profileCols: ['firstName', 'middleName', 'lastName'],
      check: async () => expect(await profileRow()).toMatchObject({ firstName: 'Zoë', middleName: 'Anne', lastName: "O'Neil" }),
    })
  })

  it('Profile Photo (make main, remove) -> worker_profiles.photos, additionalPhotos (a JSON array)', async () => {
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { photos: 'https://blob.test/main.jpg', additionalPhotos: JSON.stringify(['https://blob.test/extra.jpg']) } })
    await write({
      section: 'makeMainPhoto',
      method: 'POST',
      path: '/v1/worker/photos/main',
      body: { url: 'https://blob.test/extra.jpg' },
      profileCols: ['photos', 'additionalPhotos'],
      check: async () => expect(await profileRow()).toMatchObject({ photos: 'https://blob.test/extra.jpg', additionalPhotos: JSON.stringify(['https://blob.test/main.jpg']) }),
    })
    await write({
      section: 'removePhoto',
      method: 'POST',
      path: '/v1/worker/photos/remove',
      body: { url: 'https://blob.test/main.jpg' },
      profileCols: ['photos', 'additionalPhotos'],
      check: async () => expect(await profileRow()).toMatchObject({ photos: 'https://blob.test/extra.jpg', additionalPhotos: null }),
    })
  })

  it('Bio -> worker_profiles.introduction', async () => {
    const bio = 'I support people at home and in the community.\nSecond line kept.'
    await write({ section: 'putBio', path: '/v1/worker/profile/bio', body: { bio }, profileCols: ['introduction'], check: async () => expect((await profileRow()).introduction).toBe(bio) })
  })

  it('Address -> worker_profiles.homeStreetLine, homeLocalityId (the HOME location and legacy columns untouched)', async () => {
    const home0 = await h.db.workerLocation.findFirst({ where: { workerProfileId: h.a.profileId, kind: 'HOME' } })
    await write({
      section: 'putHomeAddress',
      path: '/v1/worker/profile/home-address',
      body: { streetLine: '12 Example St', localityId: otherSuburb.id },
      profileCols: ['homeStreetLine', 'homeLocalityId'],
      check: async () => expect(await profileRow()).toMatchObject({ homeStreetLine: '12 Example St', homeLocalityId: otherSuburb.id }),
    })
    expect(await h.db.workerLocation.findFirst({ where: { workerProfileId: h.a.profileId, kind: 'HOME' } })).toEqual(home0)
  })

  // Date of birth, gender, vehicle: three writes since 2026-10-14, each moving its own column only.
  it.each([
    ['putDateOfBirth', 'date-of-birth', { dateOfBirth: '1988-07-15' }],
    ['putGender', 'gender', { gender: 'Male' }],
    ['putVehicle', 'vehicle', { hasVehicle: 'No' }],
  ] as const)('%s -> worker_profiles, its one column', async (section, slug, body) => {
    await write({
      section,
      path: `/v1/worker/profile/${slug}`,
      body,
      profileCols: Object.keys(body),
      check: async () => expect(await profileRow()).toMatchObject(body),
    })
  })

  it('ABN -> worker_profiles.abn = { workerEngagementType: { type, value, signed } }', async () => {
    await write({
      section: 'putAbn',
      path: '/v1/worker/profile/abn',
      body: { abn: EXAMPLE_ABN },
      profileCols: ['abn'],
      check: async () => expect((await profileRow()).abn).toEqual({ workerEngagementType: { type: 'abn', value: EXAMPLE_ABN, signed: true } }),
    })
  })

  // ---- Professional Information (row tables: each save replaces the worker's rows, in order) ---------------

  it('Experience -> worker_experience rows (domain, isProfessional, isPersonal, specificAreas, otherAreas, description)', async () => {
    const domains = [
      // Four of Aged Care's own areas: valid only since the limit of 3 went (2026-10-13).
      { domain: 'AGED_CARE', isProfessional: true, isPersonal: false, specificAreas: experienceAreasOf('AGED_CARE').slice(0, 4), otherAreas: ['Hearing loss'], description: 'Ten years in residential care.' },
      { domain: 'DISABILITY', isProfessional: false, isPersonal: true, specificAreas: [], otherAreas: [], description: null },
    ]
    const byDomain = <T extends { domain: string }>(a: T[]) => [...a].sort((x, y) => x.domain.localeCompare(y.domain))
    await write({
      section: 'putExperience',
      path: '/v1/worker/experience',
      body: { domains },
      check: async () => {
        const rows = await h.db.workerExperience.findMany({ where: { workerProfileId: h.a.profileId }, select: { domain: true, isProfessional: true, isPersonal: true, specificAreas: true, otherAreas: true, description: true } })
        expect(byDomain(rows)).toEqual(byDomain(domains))
      },
    })
  })

  it('Work History -> worker_job_history rows, sortOrder 0.. in the order sent', async () => {
    const entries = [
      { jobTitle: 'Team Leader', company: 'Care Co', startMonth: 'May', startYear: 2022, endMonth: null, endYear: null, currentlyWorking: true },
      { jobTitle: 'Support Worker', company: 'Home Help', startMonth: 'January', startYear: 2019, endMonth: 'April', endYear: 2022, currentlyWorking: false },
    ]
    await write({
      section: 'putJobHistory',
      path: '/v1/worker/job-history',
      body: { entries },
      check: async () => {
        const rows = await h.db.workerJobHistory.findMany({ where: { workerProfileId: h.a.profileId }, orderBy: { sortOrder: 'asc' }, select: { jobTitle: true, company: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyWorking: true, sortOrder: true } })
        expect(rows).toEqual(entries.map((e, i) => ({ ...e, sortOrder: i })))
      },
    })
  })

  it('Education -> worker_education rows, sortOrder 0.. in the order sent', async () => {
    const entries = [
      { institution: 'TAFE NSW', qualification: 'Cert IV Disability', startMonth: 'February', startYear: 2021, endMonth: 'November', endYear: 2021, currentlyStudying: false },
      { institution: 'Open Uni', qualification: 'Diploma of Nursing', startMonth: 'March', startYear: 2024, endMonth: null, endYear: null, currentlyStudying: true },
    ]
    await write({
      section: 'putEducation',
      path: '/v1/worker/education',
      body: { entries },
      check: async () => {
        const rows = await h.db.workerEducation.findMany({ where: { workerProfileId: h.a.profileId }, orderBy: { sortOrder: 'asc' }, select: { institution: true, qualification: true, startMonth: true, startYear: true, endMonth: true, endYear: true, currentlyStudying: true, sortOrder: true } })
        expect(rows).toEqual(entries.map((e, i) => ({ ...e, sortOrder: i })))
      },
    })
  })

  it('Preferred Hours -> worker_availability rows (dayOfWeek, startMinute, endMinute), stored in week order', async () => {
    await write({
      section: 'putAvailability',
      path: '/v1/worker/availability',
      body: { slots: [{ day: 'WEDNESDAY', startMinute: 780, endMinute: 900 }, { day: 'MONDAY', startMinute: 480, endMinute: 720 }, { day: 'MONDAY', startMinute: 780, endMinute: 1020 }] },
      check: async () => {
        const rows = await h.db.workerAvailability.findMany({ where: { workerProfileId: h.a.profileId }, orderBy: { sortOrder: 'asc' }, select: { dayOfWeek: true, startMinute: true, endMinute: true, sortOrder: true } })
        expect(rows).toEqual([
          { dayOfWeek: 'MONDAY', startMinute: 480, endMinute: 720, sortOrder: 0 },
          { dayOfWeek: 'MONDAY', startMinute: 780, endMinute: 1020, sortOrder: 1 },
          { dayOfWeek: 'WEDNESDAY', startMinute: 780, endMinute: 900, sortOrder: 2 },
        ])
      },
    })
  })

  // ---- Additional Information (worker_additional_info: one group, its own columns only) ----------------------

  // [page, group, the columns sent = the columns stored]. List values come from today's lists, so a list edit
  // cannot break the case; languages and interests also take a worker's own label.
  const groups: [string, string, Row][] = [
    ['Language', 'languages', { languages: ['English', 'Auslan', 'Klingon'] }],
    ['Cultural Background', 'cultural-background', { culturalBackground: [CULTURAL_BACKGROUNDS[0]] }],
    ['Religion', 'religion', { religion: [RELIGIONS[0]] }],
    ['Interests', 'interests', { interests: [INTERESTS[0], 'Beekeeping'] }],
    ['Good to Know (on Interests)', 'good-to-know', { lgbtqiaSupport: true }],
    ['Support & Activities', 'support-activities', { uniqueService: ['Fishing trips', 'Walking programs'] }],
    ['Fun fact (on Bio)', 'fun-fact', { funFact: 'I once cycled from Brisbane to the Gold Coast for a fundraiser.' }],
    ['Preferences', 'preferences', { workPreferences: [WORK_PREFERENCES[0]] }],
    ['Personality', 'personality', { personality: 'Calm and relaxed', nonSmoker: true, petFriendly: false }],
  ]

  it.each(groups)('%s -> worker_additional_info, only the columns of group %s', async (_page, group, columns) => {
    await write({
      section: `putAdditionalInfo.${group}`,
      path: `/v1/worker/additional-info/${group}`,
      body: { group, ...columns },
      infoCols: Object.keys(columns),
      check: async () => expect(await infoRow()).toMatchObject(columns),
    })
  })

  // ---- Services and Account ----------------------------------------------------------------------------------

  it('Service Area -> the HOME worker_locations row (ONBOARDING source) + the legacy worker_profiles location columns', async () => {
    await write({
      section: 'putServiceArea',
      path: '/v1/worker/profile/service-area',
      body: { localityId: otherSuburb.id, travelRadiusKm: 35 },
      profileCols: ['location', 'city', 'state', 'postalCode', 'latitude', 'longitude'],
      check: async () => {
        const homes = await h.db.workerLocation.findMany({ where: { workerProfileId: h.a.profileId, kind: 'HOME' }, select: { localityId: true, latitude: true, longitude: true, travelRadiusKm: true, precision: true, source: true } })
        expect(homes).toEqual([{ localityId: otherSuburb.id, latitude: otherSuburb.latitude, longitude: otherSuburb.longitude, travelRadiusKm: 35, precision: 'LOCALITY', source: 'ONBOARDING' }])
        expect(await profileRow()).toMatchObject({ city: otherSuburb.suburb, state: otherSuburb.state, postalCode: otherSuburb.postcode, latitude: otherSuburb.latitude, longitude: otherSuburb.longitude })
      },
    })
  })

  it('Bank Account (Account page tab) -> worker_additional_info.bankAccount JSON, whole; the answer is masked', async () => {
    const res = await write({
      section: 'putBankAccount',
      path: '/v1/worker/bank-account',
      body: { accountName: 'Z O Neil', bankName: 'Westpac', bsb: '032-001', accountNumber: '123456789' },
      infoCols: ['bankAccount'],
      check: async () => expect((await infoRow())?.bankAccount).toEqual({ accountName: 'Z O Neil', bankName: 'Westpac', bsb: '032001', accountNumber: '123456789' }),
    })
    expect(res.body).not.toContain('123456789')
  })

  // ---- After all the writes ----------------------------------------------------------------------------------

  it('the api read shows what the tables hold (the pages read this)', async () => {
    const p = (await h.get(h.a.userId)).json()
    const row = await profileRow()
    expect(p.names).toEqual({ firstName: row.firstName, middleName: row.middleName, lastName: row.lastName })
    expect(p.bio).toBe(row.introduction)
    expect(p.personalInfo).toMatchObject({ dateOfBirth: row.dateOfBirth, gender: row.gender, hasVehicle: row.hasVehicle })
    expect(p.homeAddress).toMatchObject({ streetLine: row.homeStreetLine, localityId: row.homeLocalityId })
    expect(p.serviceArea).toMatchObject({ localityId: otherSuburb.id, travelRadiusKm: 35 })
    const info = (await infoRow())!
    expect(p.sections.additionalInfo).toMatchObject({ languages: info.languages, funFact: info.funFact, uniqueService: info.uniqueService, lgbtqiaSupport: info.lgbtqiaSupport })
    expect(p.sections.bankAccount).toEqual({ accountName: 'Z O Neil', bankName: 'Westpac', bsbLast3: '001', accountNumberLast3: '789' })
  })
})
