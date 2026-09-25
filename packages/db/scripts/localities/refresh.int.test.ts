// localities:refresh against a real, migrated PostGIS database.
//
// Runs only when TEST_DATABASE_URL is set, and only against localhost: it
// TRUNCATEs au_localities, worker_locations and au_locality_refreshes. In CI the
// database is a service container (step 11); locally, see the migrations README.
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { build } from './build.js'
import type { LocalityRow } from './csv.js'
import { writeFixtureRelease } from './fixtures.js'
import { runRefresh } from './refresh-db.js'
import { readDataset } from './refresh.js'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname) : false
if (url && !local) throw new Error('TEST_DATABASE_URL must point at localhost: this test truncates tables')

describe.skipIf(!local)('localities:refresh on PostGIS', () => {
  let db: pg.Client
  let tmp: string
  const release: Record<'A' | 'B', LocalityRow[]> = { A: [], B: [] }

  beforeAll(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'localities-int-'))
    for (const which of ['A', 'B'] as const) {
      const outDir = join(tmp, `out-${which}`)
      await build({ src: await writeFixtureRelease(join(tmp, which), which), release: '202608', outDir })
      release[which] = (await readDataset(outDir)).rows
    }
    db = new pg.Client({ connectionString: url })
    await db.connect()
    await db.query('TRUNCATE worker_locations, au_locality_refreshes, au_localities RESTART IDENTITY CASCADE')
    await db.query(`DELETE FROM users WHERE id = 'int-user'`)
    await db.query(`INSERT INTO users (id, email, "passwordHash", role, "updatedAt")
                    VALUES ('int-user', 'int@example.test', 'x', (enum_range(NULL::"UserRole"))[1], now())`)
    await db.query(`INSERT INTO worker_profiles (id, "userId", "firstName", "lastName", mobile, "updatedAt")
                    VALUES ('int-profile', 'int-user', 'Int', 'Test', '+61400000000', now())`)
  })

  afterAll(async () => {
    if (db) {
      await db.query(`DELETE FROM users WHERE id = 'int-user'`) // cascades to the profile and locations
      await db.query('TRUNCATE au_locality_refreshes, au_localities RESTART IDENTITY CASCADE')
      await db.end()
    }
    await rm(tmp, { recursive: true, force: true })
  })

  const refresh = async (rows: LocalityRow[], sourceVersion: string) => {
    const dry = await runRefresh(db, { rows, sourceVersion, apply: false, appliedBy: 'test' })
    return runRefresh(db, { rows, sourceVersion, apply: true, expect: dry.hash, appliedBy: 'test' })
  }
  const current = async () =>
    (await db.query<{ k: string }>(`SELECT suburb||' '||postcode AS k FROM au_localities WHERE "retiredAt" IS NULL ORDER BY 1`)).rows.map((r) => r.k)
  const idOf = async (suburb: string, postcode: string) =>
    (await db.query<{ id: number }>(`SELECT id FROM au_localities WHERE suburb=$1 AND postcode=$2`, [suburb, postcode])).rows[0]!.id

  it('dry run writes nothing', async () => {
    const r = await runRefresh(db, { rows: release.A, sourceVersion: 'GNAF-202602', apply: false, appliedBy: 'test' })
    expect(r.plan.inserts).toHaveLength(7)
    expect(r.applied).toBe(false)
    expect(await current()).toEqual([])
  })

  it('refuses --apply without the reviewed plan hash', async () => {
    await expect(runRefresh(db, { rows: release.A, sourceVersion: 'GNAF-202602', apply: true, appliedBy: 'test' })).rejects.toThrow(/reviewed plan/)
    await expect(
      runRefresh(db, { rows: release.A, sourceVersion: 'GNAF-202602', apply: true, expect: 'deadbeefdeadbeef', appliedBy: 'test' }),
    ).rejects.toThrow(/reviewed plan/)
    expect(await current()).toEqual([])
  })

  it('loads release A, and the generated point matches the centroid', async () => {
    const r = await refresh(release.A, 'GNAF-202602')
    expect(r.applied).toBe(true)
    expect(await current()).toHaveLength(7)
    const { rows } = await db.query<{ lat: number; lng: number }>(
      `SELECT ST_Y(point::geometry) AS lat, ST_X(point::geometry) AS lng FROM au_localities WHERE suburb='Melbourne' AND postcode='3000'`,
    )
    expect(rows[0]).toEqual({ lat: -37.814, lng: 144.963 })
  })

  it('re-running the same release changes nothing and writes no audit row', async () => {
    const r = await refresh(release.A, 'GNAF-202602')
    expect(r.applied).toBe(false)
    expect(r.plan.unchanged).toBe(7)
    expect((await db.query('SELECT 1 FROM au_locality_refreshes')).rowCount).toBe(1)
  })

  it('release B retires, never deletes: workers placed at a dropped suburb keep their link', async () => {
    const mel3004 = await idOf('Melbourne', '3004')
    const oldtown = await idOf('Oldtown', '4000')
    const mcmahons = await idOf('McMahons Point', '2060')
    await db.query(
      `INSERT INTO worker_locations (id, "workerProfileId", kind, "localityId", latitude, longitude, "travelRadiusKm", precision, source, "updatedAt")
       VALUES ('int-home', 'int-profile', 'HOME', $1, -27.47, 153.02, 50, 'LOCALITY', 'REGISTRATION', now())`,
      [oldtown],
    )

    const r = await refresh(release.B, 'GNAF-202608')
    expect(r.workersAtRetired.get(oldtown)).toBe(1)
    expect(await current()).toEqual([
      'McMahons Point 2060', 'Melbourne 3000', 'Newestate 4001', "O'Connor 2602", 'Spring Flat 2850', 'Wee Jasper 2582',
    ])

    const { rows } = await db.query(
      `SELECT l.id, l."retiredAt" IS NOT NULL AS retired, l."supersededById", l."sourceVersion"
         FROM au_localities l WHERE l.id = ANY($1::int[]) ORDER BY l.id`,
      [[mel3004, oldtown, mcmahons]],
    )
    const byId = new Map(rows.map((x) => [x.id, x]))
    expect(byId.get(mel3004)).toMatchObject({ retired: true, supersededById: await idOf('Melbourne', '3000') })
    expect(byId.get(oldtown)).toMatchObject({ retired: true, supersededById: null })
    expect(byId.get(mcmahons)).toMatchObject({ retired: false, sourceVersion: 'GNAF-202608' }) // moved, same id
    const home = await db.query(`SELECT "localityId" FROM worker_locations WHERE id='int-home'`)
    expect(home.rows[0].localityId).toBe(oldtown)

    const audit = await db.query(`SELECT inserted, updated, restored, retired, unchanged, details FROM au_locality_refreshes ORDER BY id DESC LIMIT 1`)
    expect(audit.rows[0]).toMatchObject({ inserted: 1, updated: 1, restored: 0, retired: 2, unchanged: 4 })
    expect(audit.rows[0].details.retired.find((d: { id: number }) => d.id === oldtown).workers).toBe(1)
  })

  it('going back to release A restores the retired rows under their original ids', async () => {
    const oldtown = await idOf('Oldtown', '4000')
    const r = await refresh(release.A, 'GNAF-202602')
    expect(r.plan.restores.map((s) => s.id)).toContain(oldtown)
    expect(await idOf('Oldtown', '4000')).toBe(oldtown)
    expect(await current()).toHaveLength(7)
  })

  it('the database still refuses to delete a locality a worker is placed at', async () => {
    const oldtown = await idOf('Oldtown', '4000')
    await expect(db.query('DELETE FROM au_localities WHERE id=$1', [oldtown])).rejects.toThrow(/worker_locations_localityId_fkey/)
  })
})
