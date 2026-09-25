import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { build } from './build.js'
import { writeFixtureRelease } from './fixtures.js'
import { planRefresh } from './plan.js'
import { readDataset } from './refresh.js'

let tmp: string
beforeAll(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'localities-'))
})
afterAll(async () => {
  await rm(tmp, { recursive: true, force: true })
})

async function buildFixture(which: 'A' | 'B', out: string = which) {
  const src = await writeFixtureRelease(join(tmp, `src-${which}`), which)
  const outDir = join(tmp, `out-${out}`)
  const result = await build({ src, release: '202608', outDir })
  return { ...result, outDir }
}

describe('localities:build on the fixture release', () => {
  it('keeps exactly the suburb-postcode pairs the rule allows', async () => {
    const { outDir } = await buildFixture('A')
    const { rows } = await readDataset(outDir)
    expect(rows.map((r) => `${r.suburb} ${r.state} ${r.postcode}`)).toEqual([
      "O'Connor ACT 2602",
      'McMahons Point NSW 2060',
      'Spring Flat NSW 2850', // unofficial, but has an address
      'Wee Jasper NSW 2582', // gazetted, no addresses: PRIMARY_POSTCODE
      'Oldtown QLD 4000',
      'Melbourne VIC 3000',
      'Melbourne VIC 3004', // second postcode; alias 3006 and retired 3141 not counted
    ])
    const mel = rows.find((r) => r.postcode === '3000')!
    expect(mel).toMatchObject({ localityPid: 'locMEL', searchName: 'melbourne', latitude: -37.814, longitude: 144.963 })
  })

  it('reports every drop with its reason, and every fallback for review', async () => {
    const { meta } = await buildFixture('A')
    expect(meta.sourceVersion).toBe('GNAF-202608')
    expect(meta.report.localities).toBe(10) // 11 in the fixture; OLD RETIRED is skipped before selection
    expect(meta.report.droppedByReason).toEqual({
      'no-addresses-not-gazetted': 2, // Gulargambone Community (I), Bonny View (U)
      'no-addresses-no-plausible-postcode': 1, // Hall ACT 9999
      'no-centroid': 1, // No Point
      'centroid-out-of-bounds': 0,
    })
    expect(meta.report.primaryPostcodeFallbacks).toEqual([
      { localityPid: 'locWJ', suburb: 'Wee Jasper', state: 'NSW', postcode: '2582' },
    ])
    expect(meta.report.multiPostcode).toEqual([
      { localityPid: 'locMEL', suburb: 'Melbourne', state: 'VIC', postcodes: ['3000', '3004'] },
    ])
  })

  it('rebuilds the same release byte-for-byte', async () => {
    const first = await buildFixture('A', 'A1')
    const second = await buildFixture('A', 'A2')
    for (const f of ['au_localities.csv', 'au_localities.meta.json', 'ATTRIBUTION.md']) {
      expect(await readFile(join(second.outDir, f), 'utf8')).toBe(await readFile(join(first.outDir, f), 'utf8'))
    }
  })

  it('plans release A -> B as one insert, one move and two retirements', async () => {
    const a = (await readDataset((await buildFixture('A', 'A3')).outDir)).rows
    const b = (await readDataset((await buildFixture('B')).outDir)).rows
    const existing = a.map((r, i) => ({ ...r, id: i + 1, retired: false }))
    const plan = planRefresh(existing, b)
    expect(plan.inserts.map((r) => r.suburb)).toEqual(['Newestate'])
    expect(plan.updates.map((u) => [u.before.latitude, u.after.latitude])).toEqual([[-33.846, -33.848]])
    // Retirements are ordered by id, which here is CSV order.
    expect(plan.retires.map((t) => [t.row.suburb, t.row.postcode, t.successorKey])).toEqual([
      ['Oldtown', '4000', null],
      ['Melbourne', '3004', 'locMEL|3000'],
    ])
    expect(plan.unchanged).toBe(4)
  })

  it('refuses a CSV that was edited by hand', async () => {
    const { outDir } = await buildFixture('A', 'A4')
    const csv = await readFile(join(outDir, 'au_localities.csv'), 'utf8')
    await writeFile(join(outDir, 'au_localities.csv'), csv.replace('Oldtown', 'Newtown'))
    await expect(readDataset(outDir)).rejects.toThrow(/does not match/)
  })

  it('rejects a malformed release label', async () => {
    await expect(build({ src: tmp, release: '2026-08' })).rejects.toThrow(/YYYYMM/)
  })
})
