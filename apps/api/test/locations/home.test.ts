import { readFile } from 'node:fs/promises'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
// Parity target: the committed suburb list. The legacy worker_profiles columns are no
// longer written (search-locations FR-10); the HOME row is asserted directly.
import { fromCsv } from '../../../../packages/db/scripts/localities/csv'
import { DEFAULT_TRAVEL_RADIUS_KM, placeHome, type Locality } from '../../src/modules/locations/domain/home'

const loc = (p: Partial<Locality> = {}): Locality => ({
  id: 7,
  suburb: 'Parramatta',
  state: 'NSW',
  postcode: '2150',
  latitude: -33.8148,
  longitude: 151.0017,
  retiredAt: null,
  ...p,
})

describe('placeHome', () => {
  it('places the worker at the centroid with the default 50 km radius', () => {
    expect(placeHome(loc(), 'REGISTRATION')).toEqual({
      ok: true,
      home: { kind: 'HOME', localityId: 7, latitude: -33.8148, longitude: 151.0017, travelRadiusKm: 50, precision: 'LOCALITY', source: 'REGISTRATION' },
    })
    expect(DEFAULT_TRAVEL_RADIUS_KM).toBe(50)
  })

  it('refuses a retired suburb for a new placement', () => {
    expect(placeHome(loc({ retiredAt: new Date() }), 'REGISTRATION')).toEqual({ ok: false, error: { kind: 'locality-retired', localityId: 7 } })
  })

  it('refuses a radius the database would reject', () => {
    for (const r of [0, 501, 2.5]) expect(() => placeHome(loc(), 'ADMIN', r)).toThrow(RangeError)
  })

  it('the HOME point is the suburb centroid', () => {
    fc.assert(
      fc.property(fc.double({ min: -55, max: -9, noNaN: true }), fc.double({ min: 72, max: 169, noNaN: true }), (latitude, longitude) => {
        const r = placeHome(loc({ latitude, longitude }), 'BACKFILL')
        return r.ok && r.home.latitude === latitude && r.home.longitude === longitude
      }),
    )
  })
})

describe('every real suburb', () => {
  it('places a HOME row at every current suburb, at its centroid, and nothing else', async () => {
    const rows = fromCsv(await readFile(new URL('../../../../packages/db/data/au_localities.csv', import.meta.url), 'utf8'))
    expect(rows.length).toBeGreaterThan(15000)
    rows.forEach((row, i) => {
      const r = placeHome({ id: i + 1, suburb: row.suburb, state: row.state, postcode: row.postcode, latitude: row.latitude, longitude: row.longitude, retiredAt: null }, 'BACKFILL')
      expect(r).toEqual({ ok: true, home: { kind: 'HOME', localityId: i + 1, latitude: row.latitude, longitude: row.longitude, travelRadiusKm: DEFAULT_TRAVEL_RADIUS_KM, precision: 'LOCALITY', source: 'BACKFILL' } })
    })
  })
})
