// Two seeded workers on the local PostGIS database for the worker area's integration
// tests (U1 worker-area): a placed, well-filled worker with services, sections,
// requirement rows, a bank account and a HOME row at Parramatta; a bare unplaced one;
// and a WORKER account with no profile. Their catalogue rows carry the harness prefix
// so nothing collides with the seeded catalogue; everything is deleted by close().
// Needs TEST_DATABASE_URL on localhost and the suburb list loaded (CLAUDE.md).
import { contracts, platformContract, workerContract } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import type { PublicEndpoint } from '@remonta/api-contract'
import { platformHandlers } from '../../src/modules/platform/platform.handlers'
import { workerHandlers, type WorkerModuleDeps } from '../../src/modules/worker/worker.handlers'
import { clearCatalogueCache } from '../../src/modules/worker/persistence/profile-read'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, unreachableHandlers, type TestApp } from '../helpers'

export interface WorkerHarness {
  db: Db
  t: TestApp
  logs: Record<string, unknown>[]
  prefix: string
  /** The filled, placed worker. */
  a: { userId: string; profileId: string }
  /** The bare, unplaced worker. */
  b: { userId: string; profileId: string }
  /** A WORKER account with no worker_profiles row (R1.2). */
  orphan: { userId: string }
  /** The harness's catalogue document ids. */
  docs: { police: string; training: string; sub: string }
  queries: string[]
  get(userId: string, headers?: Record<string, string>): Promise<Awaited<ReturnType<TestApp['fastify']['inject']>>>
  close(): Promise<void>
}

export async function workerHarness(domain: string, opts: { read?: WorkerModuleDeps['read']; photos?: WorkerModuleDeps['photos']; pool?: { poolSize: number; poolTimeoutS: number } } = {}): Promise<WorkerHarness> {
  const url = process.env.TEST_DATABASE_URL!
  const db = createDb(url, opts.pool ?? { poolSize: 4, poolTimeoutS: 5 }, { queryEvents: true })
  const queries: string[] = []
  ;(db as unknown as { $on: (e: 'query', cb: (e: { query: string }) => void) => void }).$on('query', (e) => queries.push(e.query))
  const prefix = `${domain}-`
  const docs = { police: `${prefix}police`, training: `${prefix}training`, sub: `${prefix}sub-doc` }

  async function cleanup() {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${domain}` } }, select: { id: true } })
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } })
    await db.category.deleteMany({ where: { id: { startsWith: prefix } } })
    await db.document.deleteMany({ where: { id: { startsWith: prefix } } })
  }
  await cleanup()

  const parramatta = await db.auLocality.findFirstOrThrow({ where: { searchName: 'parramatta', postcode: '2150', retiredAt: null }, select: { id: true, latitude: true, longitude: true } })
  await db.document.createMany({
    data: [
      { id: docs.police, name: 'Harness Police Check', category: 'COMPLIANCE', description: 'test', updatedAt: new Date() },
      { id: docs.training, name: 'Harness Training', category: 'TRAINING', description: 'test', updatedAt: new Date() },
      { id: docs.sub, name: 'Harness Sub Document', category: 'COMPLIANCE', description: 'test', updatedAt: new Date() },
    ],
  })
  const categoryId = `${prefix}care`
  const categoryName = `Harness Care ${domain}`
  await db.category.create({
    data: {
      id: categoryId,
      name: categoryName,
      documents: { create: [{ documentId: docs.police, documentType: 'REQUIRED' }, { documentId: docs.training, documentType: 'REQUIRED' }] },
      subcategories: { create: [{ id: `${prefix}sub`, name: 'Harness Sub', additionalDocuments: { create: [{ documentId: docs.sub }] } }] },
    },
  })

  const createUser = async (email: string, profile: object | undefined) =>
    db.user.create({
      data: { email, passwordHash: 'x', role: 'WORKER', status: 'ACTIVE', updatedAt: new Date(), ...(profile ? { workerProfile: { create: profile as never } } : {}) },
      select: { id: true, workerProfile: { select: { id: true } } },
    })

  const a = await createUser(`a@${domain}`, {
    firstName: 'Mary',
    lastName: "O'Connor",
    mobile: '0412345678',
    photos: 'https://blob.test/a.jpg',
    additionalPhotos: '["https://blob.test/a2.jpg"]',
    introduction: 'I have supported people for ten years and love what I do every day.',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    hasVehicle: 'Yes',
    languages: ['English'],
    abn: { workerEngagementType: { type: 'abn', signed: true } },
    verificationStatus: 'NOT_STARTED',
    updatedAt: new Date(),
    workerServices: { create: [{ categoryId, categoryName, subcategoryIds: [`${prefix}sub`], subcategoryNames: ['Harness Sub'] }] },
    verificationRequirements: {
      create: [
        { requirementType: docs.police, requirementName: 'Police', status: 'APPROVED', documentUrl: 'https://blob.test/pc.pdf', updatedAt: new Date() },
        { requirementType: docs.sub, requirementName: 'Sub', status: 'SUBMITTED', documentUrl: 'https://blob.test/sub.pdf', updatedAt: new Date() },
        { requirementType: 'code-of-conduct', requirementName: 'Code', status: 'SUBMITTED', documentUrl: 'https://blob.test/coc.pdf', updatedAt: new Date() },
        { requirementType: docs.training, requirementName: 'Training', status: 'APPROVED', documentUrl: 'https://blob.test/t.pdf', updatedAt: new Date() },
        { requirementType: `${categoryName}:qualification-certificate`, requirementName: 'Qual', status: 'SUBMITTED', documentCategory: 'SERVICE_QUALIFICATION', documentUrl: 'https://blob.test/q.pdf', updatedAt: new Date() },
      ],
    },
    availability: { create: [{ dayOfWeek: 'MONDAY', startMinute: 540, endMinute: 1020, sortOrder: 0 }] },
    careExperience: { create: [{ domain: 'AGED_CARE', isProfessional: true, specificAreas: ['Dementia'] }] },
    jobHistoryEntries: { create: [{ jobTitle: 'Carer', company: 'Co', startYear: 2020, currentlyWorking: true, sortOrder: 0 }] },
    educationEntries: { create: [{ institution: 'TAFE', qualification: 'Cert III', startYear: 2018, endYear: 2019, sortOrder: 0 }] },
    workerAdditionalInfo: { create: { languages: ['English', 'Hindi'], personality: 'calm', bankAccount: { accountName: 'M', bankName: 'CBA', bsb: '062000', accountNumber: '55512399' } } },
    locations: { create: [{ kind: 'HOME', localityId: parramatta.id, latitude: parramatta.latitude, longitude: parramatta.longitude, travelRadiusKm: 50, precision: 'LOCALITY', source: 'REGISTRATION' }] },
  })
  const b = await createUser(`b@${domain}`, { firstName: 'Ben', lastName: 'Nguyen', mobile: '0499999999', updatedAt: new Date() })
  const orphan = await createUser(`orphan@${domain}`, undefined)

  // The catalogue is cached per process (audit P3): forget anything read before this harness seeded its own.
  clearCatalogueCache()
  const logs: Record<string, unknown>[] = []
  const t = await testApp({
    contracts,
    handlerSets: [
      platformHandlers({ db, clock: () => new Date() }),
      workerHandlers({ db, clock: () => new Date(), read: opts.read, photos: opts.photos }),
      ...contracts.filter((c) => c !== platformContract && c !== workerContract).map(unreachableHandlers),
    ],
    publicEndpoints: publicEndpoints as PublicEndpoint[],
    logs,
  })
  const get = (userId: string, headers: Record<string, string> = {}) => t.fastify.inject({ method: 'GET', url: '/v1/worker/profile', headers: { 'x-test-principal': `${userId}:WORKER`, ...headers } })

  return {
    db,
    t,
    logs,
    prefix,
    a: { userId: a.id, profileId: a.workerProfile!.id },
    b: { userId: b.id, profileId: b.workerProfile!.id },
    orphan: { userId: orphan.id },
    docs,
    queries,
    get,
    close: async () => {
      await t.close()
      await cleanup()
      await db.$disconnect()
    },
  }
}
