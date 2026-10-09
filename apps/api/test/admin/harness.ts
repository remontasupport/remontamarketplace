// A seeded worker population on the local PostGIS database for the admin search's
// integration tests (U2, NFR plan Q3 A): about 300 workers with users, profiles,
// services, experience, additional info and HOME rows at real au_localities points,
// a share of them unplaced; deterministic from a seed; isolated by an email domain and
// deleted by close(). Needs TEST_DATABASE_URL on localhost and the suburb list loaded.
import { experienceAreasOf } from '@remonta/schemas/data/experienceAreas'
import { expect } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

export interface SeededWorker {
  id: string
  userId: string
  firstName: string
  lastName: string
  gender: 'Male' | 'Female'
  hasVehicle: 'Yes' | 'No'
  workerType: 'tfn' | 'abn'
  dateOfBirth: string | null
  age: number | null
  languages: string[]
  infoLanguages: string[]
  serviceIds: string[]
  therapeuticSubcategoryIds: string[]
  domains: string[]
  /** The specific areas ticked under each of `domains` (some rows have none). */
  specificAreas: Record<string, string[]>
  status: 'ACTIVE' | 'SUSPENDED'
  home: { localityId: number; latitude: number; longitude: number } | null
}

export interface Locality {
  id: number
  suburb: string
  state: string
  postcode: string
  latitude: number
  longitude: number
}

export interface AdminHarness {
  db: Db
  t: TestApp
  workers: SeededWorker[]
  localities: Locality[]
  domain: string
  search(query: Record<string, string>, headers?: Record<string, string>): Promise<Awaited<ReturnType<TestApp['fastify']['inject']>>>
  get(path: string, headers?: Record<string, string>): Promise<Awaited<ReturnType<TestApp['fastify']['inject']>>>
  close(): Promise<void>
}

/** A small deterministic PRNG (mulberry32), so the population is the same on every run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Ann', 'Ben', 'Chloe', 'Dev', 'Emma', 'Farid', 'Grace', 'Hugo', 'Isla', 'Jun', 'Test']
const LAST = ['Lee', 'Nguyen', 'Smith', 'Patel', 'Terson', 'Okafor', 'Rossi', 'Kaur', 'Brown', 'Ivanova']
const LANGS = ['English', 'Mandarin', 'Arabic', 'Hindi', 'Vietnamese']
const DOMAINS = ['DISABILITY', 'AGED_CARE', 'WORKING_WITH_CHILDREN', 'MENTAL_HEALTH', 'CHRONIC_MEDICAL']

/** Haversine distance in metres: the oracle for the geography predicate (G1). */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_008.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function adminHarness(domain: string, opts: { workers?: number; seed?: number } = {}): Promise<AdminHarness> {
  const url = process.env.TEST_DATABASE_URL!
  const db = createDb(url)
  const count = opts.workers ?? 300
  const rand = rng(opts.seed ?? 20261008)
  const prefix = `${domain}-`

  async function cleanup() {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${domain}` } }, select: { id: true } })
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } }) // profiles, services, locations, experience cascade
    await db.subcategory.deleteMany({ where: { id: { startsWith: prefix } } })
    await db.category.deleteMany({ where: { id: { startsWith: prefix } } })
  }
  await cleanup()

  // Real suburbs, spread over the country: every 400th current row, then a cluster around Parramatta.
  const all = await db.auLocality.findMany({ where: { retiredAt: null }, select: { id: true, suburb: true, state: true, postcode: true, latitude: true, longitude: true }, orderBy: { id: 'asc' } })
  const parramatta = all.find((l) => l.suburb.toLowerCase() === 'parramatta' && l.postcode === '2150')
  if (!parramatta) throw new Error('adminHarness: Parramatta 2150 missing from au_localities (load the suburb list)')
  const near = all.filter((l) => haversineM(l.latitude, l.longitude, parramatta.latitude, parramatta.longitude) < 25_000)
  const far = all.filter((_, i) => i % 400 === 0)
  const localities: Locality[] = [parramatta, ...near.slice(0, 40), ...far]

  await db.category.create({ data: { id: `${prefix}support-worker`, name: 'Harness Support', subcategories: { create: [{ id: `${prefix}sub-a`, name: 'A' }, { id: `${prefix}sub-b`, name: 'B' }] } } })
  await db.category.create({ data: { id: 'therapeutic-supports', name: 'Therapeutic Supports' } }).catch(() => undefined) // may already exist (the seeded catalogue)

  const workers: SeededWorker[] = []
  for (let i = 0; i < count; i++) {
    const firstName = FIRST[Math.floor(rand() * FIRST.length)]!
    const lastName = LAST[Math.floor(rand() * LAST.length)]!
    const gender = rand() < 0.5 ? 'Male' : 'Female'
    const hasVehicle = rand() < 0.6 ? 'Yes' : 'No'
    const workerType = rand() < 0.7 ? 'abn' : 'tfn'
    const hasDob = rand() < 0.8
    const year = 1950 + Math.floor(rand() * 55)
    const dateOfBirth = hasDob ? `${year}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}` : null
    const age = hasDob ? null : 20 + Math.floor(rand() * 50)
    const languages = [LANGS[Math.floor(rand() * LANGS.length)]!]
    const infoLanguages = rand() < 0.5 ? [LANGS[Math.floor(rand() * LANGS.length)]!, 'English'] : []
    const serviceIds = rand() < 0.7 ? [`${prefix}support-worker`] : []
    const therapeutic = rand() < 0.3
    const therapeuticSubcategoryIds = therapeutic ? [rand() < 0.5 ? `${prefix}sub-a` : `${prefix}sub-b`] : []
    const domains = DOMAINS.filter(() => rand() < 0.3)
    // Under each domain, up to three of its areas (the profile page's limit), or none.
    const specificAreas: Record<string, string[]> = {}
    for (const d of domains) {
      const picked = experienceAreasOf(d).filter(() => rand() < 0.4).slice(0, 3)
      if (picked.length) specificAreas[d] = picked
    }
    const status: 'ACTIVE' | 'SUSPENDED' = rand() < 0.1 ? 'SUSPENDED' : 'ACTIVE'
    const placed = rand() < 0.7
    const loc = placed ? localities[Math.floor(rand() * localities.length)]! : null
    const email = `w${i}@${domain}`
    const user = await db.user.create({
      data: {
        email,
        passwordHash: 'x',
        role: 'WORKER',
        status,
        updatedAt: new Date(),
        workerProfile: {
          create: {
            firstName,
            lastName,
            mobile: `04${String(10_000_000 + i).padStart(8, '0')}`,
            gender,
            hasVehicle,
            dateOfBirth,
            age,
            languages,
            abn: { workerEngagementType: { type: workerType, signed: true } },
            city: loc?.suburb ?? 'Nowhere',
            state: loc?.state ?? 'XX',
            postalCode: loc?.postcode ?? '0000',
            updatedAt: new Date(Date.now() - i * 1000),
            createdAt: new Date(Date.now() - i * 60_000),
            workerServices: {
              create: [
                ...serviceIds.map((categoryId) => ({ categoryId, categoryName: 'Harness Support' })),
                ...(therapeutic ? [{ categoryId: 'therapeutic-supports', categoryName: 'Therapeutic Supports', subcategoryIds: therapeuticSubcategoryIds }] : []),
              ],
            },
            careExperience: { create: domains.map((domain) => ({ domain: domain as never, specificAreas: specificAreas[domain] ?? [] })) },
            ...(infoLanguages.length ? { workerAdditionalInfo: { create: { languages: infoLanguages } } } : {}),
            ...(loc ? { locations: { create: [{ kind: 'HOME', localityId: loc.id, latitude: loc.latitude, longitude: loc.longitude, travelRadiusKm: 50, precision: 'LOCALITY', source: 'BACKFILL' }] } } : {}),
          },
        },
      },
      select: { id: true, workerProfile: { select: { id: true } } },
    })
    workers.push({ id: user.workerProfile!.id, userId: user.id, firstName, lastName, gender, hasVehicle, workerType, dateOfBirth, age, languages, infoLanguages, serviceIds, therapeuticSubcategoryIds, domains, specificAreas, status, home: loc ? { localityId: loc.id, latitude: loc.latitude, longitude: loc.longitude } : null })
  }

  const t = await testApp({ contracts: [(await import('@remonta/api-contract')).adminContract], handlerSets: [adminHandlers({ db, clock: () => new Date() })] })
  const admin = { 'x-test-principal': 'admin_1:ADMIN' }
  const get = (path: string, headers: Record<string, string> = {}) => t.fastify.inject({ method: 'GET', url: path, headers: { ...admin, ...headers } })
  const search = (query: Record<string, string>, headers: Record<string, string> = {}) => get(`/v1/admin/workers?${new URLSearchParams(query)}`, headers)

  // The fixture's workers only: every search in these tests adds the harness's own
  // service or name constraints, or the tests filter the fixture's ids themselves.
  expect(workers.length).toBe(count)

  return {
    db,
    t,
    workers,
    localities,
    domain,
    search,
    get,
    close: async () => {
      await t.close()
      await cleanup()
      await db.$disconnect()
    },
  }
}
