// search-locations U7 (2026-11-10): after every migration, worker_profiles holds none of the six legacy location
// columns nor their five indexes, and the tables that replaced them are in place. Read-only on the test database.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDb, type Db } from '../../src/platform/persistence/db'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false

const LEGACY = ['location', 'city', 'state', 'postalCode', 'latitude', 'longitude']
const INDEXES = [
  'worker_profiles_city_idx',
  'worker_profiles_state_idx',
  'worker_profiles_postalCode_idx',
  'worker_profiles_latitude_longitude_idx',
  'worker_profiles_isPublished_city_idx',
]

describe.skipIf(!local)('U7: the legacy location columns are gone from the database', () => {
  let db: Db
  beforeAll(() => {
    db = createDb(url!)
  })
  afterAll(async () => {
    await db.$disconnect()
  })

  it('worker_profiles has none of the six columns', async () => {
    const rows = await db.$queryRaw<{ column_name: string }[]>`
      SELECT column_name::text FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'worker_profiles' AND column_name = ANY(${LEGACY}::text[])`
    expect(rows).toEqual([])
  })

  it('none of the five indexes remains', async () => {
    const rows = await db.$queryRaw<{ indexname: string }[]>`
      SELECT indexname::text FROM pg_indexes WHERE schemaname = 'public' AND indexname = ANY(${INDEXES}::text[])`
    expect(rows).toEqual([])
  })

  it('where a worker is lives in worker_locations (with the locality), which is untouched', async () => {
    const rows = await db.$queryRaw<{ column_name: string }[]>`
      SELECT column_name::text FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'worker_locations' AND column_name IN ('workerProfileId', 'kind', 'localityId', 'latitude', 'longitude')`
    expect(rows.map((r) => r.column_name).sort()).toEqual(['kind', 'latitude', 'localityId', 'longitude', 'workerProfileId'])
  })
})
