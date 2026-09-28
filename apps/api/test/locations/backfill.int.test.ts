// The step 10 location backfill on PostGIS: dry run writes nothing; apply places
// every matchable worker (source BACKFILL) and lists the rest for review, never
// guessing; a second run writes nothing.
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { backfillWorkerLocations, formatLocationReport } from '../../src/modules/locations/backfill'
import { localityCandidates, reconcileWorker } from '../../src/modules/onboarding/reconciler'
import { createDb, unitOfWork, type Db } from '../../src/platform/persistence/db'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false
const DOMAIN = 's1-backfill-locations.example'

describe.skipIf(!local)('location backfill on PostGIS', () => {
  let db: Db
  const ids: Record<string, string> = {}
  let mountVictoria: { id: number }
  let parramatta: { id: number }
  let lonely: { id: number; postcode: string }

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    mountVictoria = await db.auLocality.findFirstOrThrow({ where: { searchName: 'mount victoria', state: 'NSW', postcode: '2786' } })
    parramatta = await db.auLocality.findFirstOrThrow({ where: { searchName: 'parramatta', state: 'NSW', postcode: '2150' } })
    // A postcode that belongs to exactly one current suburb.
    const [one] = await db.$queryRaw<{ postcode: string }[]>`SELECT postcode FROM au_localities WHERE "retiredAt" IS NULL GROUP BY postcode HAVING COUNT(*) = 1 ORDER BY postcode LIMIT 1`
    lonely = await db.auLocality.findFirstOrThrow({ where: { postcode: one!.postcode, retiredAt: null } })

    ids.byLocation = await legacyWorker({ location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786' })
    ids.byColumns = await legacyWorker({ location: null, city: 'Parramatta', state: 'NSW', postalCode: '2150' })
    ids.byPostcode = await legacyWorker({ location: null, city: null, state: null, postalCode: lonely.postcode })
    ids.ambiguous = await legacyWorker({ location: 'Somewhere nice', city: 'Somewhere nice', state: null, postalCode: '2000' })
    ids.unmatched = await legacyWorker({ location: 'Atlantis', city: 'Atlantis', state: null, postalCode: null })
    // Already placed by the reconciler: the backfill must not touch it.
    ids.placed = await legacyWorker({ location: 'Parramatta, NSW 2150', city: 'Parramatta', state: 'NSW', postalCode: '2150' })
    await unitOfWork(db, (tx) => reconcileWorker(tx, ids.placed!, new Date(), localityCandidates(db)))
  })
  afterAll(async () => {
    await cleanup()
    await db.$disconnect()
  })
  async function cleanup() {
    await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } })
  }

  async function legacyWorker(loc: { location: string | null; city: string | null; state: string | null; postalCode: string | null }) {
    const u = await db.user.create({
      data: {
        email: `${randomUUID().slice(0, 8)}@${DOMAIN}`,
        passwordHash: 'x',
        role: 'WORKER',
        status: 'ACTIVE',
        updatedAt: new Date(),
        workerProfile: { create: { firstName: 'Legacy', lastName: 'Worker', mobile: '0412 345 678', languages: [], ...loc, updatedAt: new Date() } },
      },
      include: { workerProfile: true },
    })
    return u.workerProfile!.id
  }
  const ours = () => Object.values(ids)
  const homes = () => db.workerLocation.findMany({ where: { workerProfileId: { in: ours() }, kind: 'HOME' }, orderBy: { workerProfileId: 'asc' } })

  it('dry run: counts the matches, lists ambiguous and unmatched rows for review, and writes nothing', async () => {
    const r = await backfillWorkerLocations(db, { apply: false, batch: 2 })
    expect(r.matched.location + r.matched.columns + r.matched.postcode).toBeGreaterThanOrEqual(3)
    expect(r.ambiguous).toContainEqual({ workerProfileId: ids.ambiguous, location: 'Somewhere nice', city: 'Somewhere nice', state: null, postalCode: '2000', why: expect.stringMatching(/^ambiguous: \d+ candidates$/) })
    expect(r.unmatched).toContainEqual({ workerProfileId: ids.unmatched, location: 'Atlantis', city: 'Atlantis', state: null, postalCode: null, why: 'unmatched: no-candidate' })
    expect(r.written).toBe(0)
    expect((await homes()).map((h) => h.workerProfileId)).toEqual([ids.placed])
    const text = formatLocationReport(r)
    expect(text).toContain('DRY RUN (nothing written)')
    expect(text).toContain(ids.unmatched!)
  })

  it('apply: places every matched worker at the locality centroid with source BACKFILL; the rest stay unplaced', async () => {
    const placedBefore = await db.workerLocation.findFirstOrThrow({ where: { workerProfileId: ids.placed!, kind: 'HOME' } })
    const r = await backfillWorkerLocations(db, { apply: true, batch: 2 })
    expect(r.failed).toEqual([])
    expect(r.written).toBeGreaterThanOrEqual(3)

    const byId = new Map((await homes()).map((h) => [h.workerProfileId, h]))
    for (const [id, locality] of [
      [ids.byLocation, mountVictoria],
      [ids.byColumns, parramatta],
      [ids.byPostcode, lonely],
    ] as const) {
      const l = await db.auLocality.findUniqueOrThrow({ where: { id: locality.id } })
      expect(byId.get(id!), id).toMatchObject({ kind: 'HOME', localityId: l.id, latitude: l.latitude, longitude: l.longitude, travelRadiusKm: 50, precision: 'LOCALITY', source: 'BACKFILL' })
    }
    expect(byId.has(ids.ambiguous!)).toBe(false)
    expect(byId.has(ids.unmatched!)).toBe(false)
    expect(byId.get(ids.placed!)).toEqual(placedBefore)
    // The geography column is GENERATED from latitude/longitude, so the GiST index can find them.
    const rows = await db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*)::bigint AS n FROM worker_locations WHERE "workerProfileId" IN (${ids.byLocation}, ${ids.byColumns}, ${ids.byPostcode}) AND point IS NOT NULL`
    expect(Number(rows[0]!.n)).toBe(3)
  })

  it('is idempotent: a second apply writes nothing and changes no row', async () => {
    const before = await homes()
    const r = await backfillWorkerLocations(db, { apply: true })
    expect(r.written).toBe(0)
    expect(r.unmatched.map((x) => x.workerProfileId)).toContain(ids.unmatched)
    expect(await homes()).toEqual(before)
  })

  it('the reconciler then finds every placed HOME unchanged', async () => {
    for (const id of [ids.byLocation, ids.byColumns, ids.byPostcode, ids.placed]) {
      const o = await unitOfWork(db, (tx) => reconcileWorker(tx, id!, new Date(), localityCandidates(db)))
      expect(o?.home, id).toBe('unchanged')
    }
  })
}, 60_000)
