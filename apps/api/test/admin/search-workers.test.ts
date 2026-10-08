// search-workers.ts (U2, rules R2, R5.3, R6; property G10): shaping and orchestration
// with a fake statement runner and a fake locality read; no database.
import { workerRowSchema, workerSearchQuerySchema } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { calculateAge, searchWorkers, shapeRow } from '../../src/modules/admin/application/search-workers'
import type { RawWorkerRow, SearchResult } from '../../src/modules/admin/persistence/worker-search-sql'
import type { Db } from '../../src/platform/persistence/db'
import { ApiError } from '../../src/platform/errors'

const NOW = new Date('2026-10-08T00:00:00Z')

const raw = (patch: Partial<RawWorkerRow> = {}): RawWorkerRow => ({
  id: 'w1',
  userId: 'u1',
  firstName: 'Ann',
  lastName: 'Lee',
  mobile: '0400000000',
  gender: 'Female',
  age: 40,
  dateOfBirth: '1990-03-15',
  languages: ['English'],
  city: 'Parramatta',
  state: 'NSW',
  postalCode: '2150',
  photos: null,
  experience: null,
  introduction: 'hi',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  email: 'ann@example.test',
  userStatus: 'ACTIVE',
  infoLanguages: null,
  serviceNames: ['Support Worker'],
  serviceIds: ['support-worker'],
  homeSuburb: 'Parramatta',
  homeState: 'NSW',
  homePostcode: '2150',
  precision: 'LOCALITY',
  travelRadiusKm: 50,
  distance_m: 12345.6,
  total: 1,
  ...patch,
})

describe('shapeRow', () => {
  it('computes the age from the date of birth, falls back to the column, applies the language fallback (R6.2, R6.3)', () => {
    expect(shapeRow(raw(), NOW, true).age).toBe(36)
    expect(shapeRow(raw({ dateOfBirth: null }), NOW, true).age).toBe(40)
    expect(shapeRow(raw({ dateOfBirth: 'not a date', age: null }), NOW, true).age).toBeNull()
    expect(shapeRow(raw({ infoLanguages: ['Mandarin'] }), NOW, true).languages).toEqual(['Mandarin'])
    expect(shapeRow(raw({ infoLanguages: [] }), NOW, true).languages).toEqual(['English'])
  })

  it('distance to one decimal only when a suburb was given and the worker is placed; the home suburb when known (R6.4, R6.5)', () => {
    const r = shapeRow(raw(), NOW, true)
    expect(r.distanceKm).toBe(12.3)
    expect(r.location).toEqual({ localityLabel: 'Parramatta NSW 2150', precision: 'LOCALITY', travelRadiusKm: 50 })
    expect(shapeRow(raw(), NOW, false).distanceKm).toBeUndefined()
    expect(shapeRow(raw({ distance_m: null }), NOW, true).distanceKm).toBeUndefined()
    expect(shapeRow(raw({ homeSuburb: null, homeState: null, homePostcode: null, precision: null, travelRadiusKm: null, distance_m: null }), NOW, true).location).toBeUndefined()
  })

  it('G10: for any raw row the shaped row matches the contract and never carries abn or dateOfBirth', () => {
    const rowArb = fc.record({
      gender: fc.option(fc.constantFrom('Male', 'Female'), { nil: null }),
      age: fc.option(fc.integer({ min: 18, max: 90 }), { nil: null }),
      dateOfBirth: fc.option(fc.constantFrom('1980-01-01', '2000-12-31', 'garbage'), { nil: null }),
      infoLanguages: fc.option(fc.array(fc.constantFrom('English', 'Arabic'), { maxLength: 2 }), { nil: null }),
      serviceNames: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 8 }), { maxLength: 3 }), { nil: null }),
      distance_m: fc.option(fc.double({ min: 0, max: 500_000, noNaN: true }), { nil: null }),
      precision: fc.option(fc.constantFrom('LOCALITY', 'ADDRESS'), { nil: null }),
      userStatus: fc.constantFrom('ACTIVE', 'SUSPENDED'),
    })
    fc.assert(
      fc.property(rowArb, fc.boolean(), (patch, withDistance) => {
        const r = shapeRow(raw(patch as Partial<RawWorkerRow>), NOW, withDistance)
        expect(workerRowSchema.safeParse(r).success).toBe(true)
        expect(r).not.toHaveProperty('abn')
        expect(r).not.toHaveProperty('dateOfBirth')
        expect(r.isActive).toBe(patch.userStatus === 'ACTIVE')
        if (!withDistance || patch.distance_m === null) expect(r.distanceKm).toBeUndefined()
      }),
      { numRuns: 150 },
    )
  })
})

describe('searchWorkers', () => {
  const fakeDb = (found: boolean) => ({ auLocality: { findUnique: async () => (found ? { id: 42, suburb: 'Parramatta', state: 'NSW', postcode: '2150' } : null) } }) as unknown as Db
  const runner = (result: Partial<SearchResult>) => async () => ({ rows: [], total: 0, unplacedCount: 0, ...result })

  it('answers 400 naming localityId for an unknown suburb (R2.1)', async () => {
    await expect(searchWorkers({ db: fakeDb(false), clock: () => NOW, run: runner({}) }, workerSearchQuerySchema.parse({ localityId: '42' }))).rejects.toMatchObject({ status: 400, fields: { localityId: ['Unknown suburb'] } })
  })

  it('echoes the suburb used and computes the pagination (R5.3, R7)', async () => {
    const res = await searchWorkers({ db: fakeDb(true), clock: () => NOW, run: runner({ rows: [raw(), raw({ id: 'w2' })], total: 45, unplacedCount: 3 }) }, workerSearchQuerySchema.parse({ localityId: '42', withinKm: '10', page: '2', pageSize: '20' }))
    expect(res.appliedFilters).toMatchObject({ locality: { id: 42, label: 'Parramatta NSW 2150' }, withinKm: 10, sortBy: 'distance', sortOrder: 'asc' })
    expect(res.pagination).toEqual({ total: 45, page: 2, pageSize: 20, totalPages: 3, hasNext: true, hasPrev: true })
    expect(res.unplacedCount).toBe(3)
    expect(res.data[0]!.distanceKm).toBe(12.3)
  })

  it('a page past the end is empty with the right counts', async () => {
    const res = await searchWorkers({ db: fakeDb(true), clock: () => NOW, run: runner({ rows: [], total: 5 }) }, workerSearchQuerySchema.parse({ page: '9' }))
    expect(res.data).toEqual([])
    expect(res.pagination).toEqual({ total: 5, page: 9, pageSize: 20, totalPages: 1, hasNext: false, hasPrev: true })
  })

  it('surfaces the normalisation errors as ApiError 400', async () => {
    await expect(searchWorkers({ db: fakeDb(true), clock: () => NOW, run: runner({}) }, workerSearchQuerySchema.parse({ withinKm: '5' }))).rejects.toBeInstanceOf(ApiError)
  })
})

describe('calculateAge', () => {
  it('is month- and day-aware', () => {
    expect(calculateAge('1990-10-08', NOW)).toBe(36)
    expect(calculateAge('1990-10-09', NOW)).toBe(35)
    expect(calculateAge('2030-01-01', NOW)).toBeNull()
  })
})
