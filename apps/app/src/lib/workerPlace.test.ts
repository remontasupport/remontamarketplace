// search-locations U4 (FR-7r): every screen reads the worker's place from the HOME row, and no app
// code reads the legacy worker_profiles location columns any more (they are dropped in U7).
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { filesUnder, SRC, topLevelSelectKeys, workerReads } from './sourceScan'
import { HOME_PLACE_SELECT, homePlaceOf } from './workerPlace'

const LEGACY = ['location', 'city', 'state', 'postalCode', 'latitude', 'longitude']

describe('homePlaceOf', () => {
  it('the HOME suburb under the screens field names', () => {
    expect(homePlaceOf({ locations: [{ locality: { suburb: 'Parramatta', state: 'NSW', postcode: '2150' } }] })).toEqual({
      city: 'Parramatta',
      state: 'NSW',
      postalCode: '2150',
      location: 'Parramatta, NSW 2150',
    })
  })

  it('no HOME row: no place (the screens show their empty case)', () => {
    expect(homePlaceOf({ locations: [] })).toEqual({ city: null, state: null, postalCode: null, location: null })
  })

  it('the select asks for the HOME row only', () => {
    expect(HOME_PLACE_SELECT.locations.where).toEqual({ kind: 'HOME' })
    expect(HOME_PLACE_SELECT.locations.take).toBe(1)
  })
})

describe('no app code reads the legacy location columns (FR-7r)', () => {
  const files = filesUnder('').filter((f) => !relative(SRC, f).startsWith('generated'))

  it('the scan finds the readers', () => {
    const readers = files.filter((f) => workerReads(readFileSync(f, 'utf8')).length > 0)
    expect(readers.length).toBeGreaterThan(5)
  })

  it.each(files.map((f) => [relative(SRC, f), f]))('%s', (_rel, f) => {
    for (const args of workerReads(readFileSync(f, 'utf8'))) {
      expect(topLevelSelectKeys(args).filter((k) => LEGACY.includes(k))).toEqual([])
    }
  })

  it('the check fails on a legacy column and ignores a nested relation select (a check that cannot fail proves nothing)', () => {
    const read = (s: string) => topLevelSelectKeys(workerReads(s)[0]!)
    expect(read('db.workerProfile.findUnique({ where: { id }, select: { id: true, city: true } })')).toContain('city')
    expect(read('db.workerProfile.findUnique({ where: { id }, select: { id: true,\n  location: true } })')).toContain('location')
    expect(read('db.workerProfile.findUnique({ select: { id: true, homeLocality: { select: { state: true } }, ...HOME_PLACE_SELECT } })')).toEqual(['id', 'homeLocality'])
  })
})
