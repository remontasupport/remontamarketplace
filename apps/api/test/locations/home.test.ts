import { readFile } from 'node:fs/promises'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
// Parity target: the committed suburb list. (Until 2026-10-02 this also loaded
// apps/app's legacy location parser as an oracle; that parser went with the pre-S1
// sign-up page, and the columns are now asserted directly.)
import { fromCsv } from '../../../../packages/db/scripts/localities/csv'
import { DEFAULT_TRAVEL_RADIUS_KM, localityLabel, placeHome, type Locality } from '../../src/modules/locations/domain/home'

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
      legacy: { location: 'Parramatta, NSW 2150', city: 'Parramatta', state: 'NSW', postalCode: '2150', latitude: -33.8148, longitude: 151.0017 },
    })
    expect(DEFAULT_TRAVEL_RADIUS_KM).toBe(50)
  })

  it('refuses a retired suburb for a new placement', () => {
    expect(placeHome(loc({ retiredAt: new Date() }), 'REGISTRATION')).toEqual({ ok: false, error: { kind: 'locality-retired', localityId: 7 } })
  })

  it('refuses a radius the database would reject', () => {
    for (const r of [0, 501, 2.5]) expect(() => placeHome(loc(), 'ADMIN', r)).toThrow(RangeError)
  })

  it('labels: autocomplete "Parramatta NSW 2150", legacy column "Parramatta, NSW 2150"', () => {
    expect(localityLabel(loc())).toBe('Parramatta NSW 2150')
    expect(localityLabel(loc(), ', ')).toBe('Parramatta, NSW 2150')
  })

  it('the HOME point and the legacy columns always carry the same coordinates', () => {
    fc.assert(
      fc.property(fc.double({ min: -55, max: -9, noNaN: true }), fc.double({ min: 72, max: 169, noNaN: true }), (latitude, longitude) => {
        const r = placeHome(loc({ latitude, longitude }), 'BACKFILL')
        return r.ok && r.home.latitude === r.legacy.latitude && r.home.longitude === r.legacy.longitude
      }),
    )
  })
})

describe('legacy columns over every real suburb', () => {
  it('writes the location string as the pre-S1 form did, and the city, state and postcode columns it implies, for every suburb', async () => {
    const rows = fromCsv(await readFile(new URL('../../../../packages/db/data/au_localities.csv', import.meta.url), 'utf8'))
    expect(rows.length).toBeGreaterThan(15000)
    rows.forEach((row, i) => {
      const r = placeHome({ id: i + 1, suburb: row.suburb, state: row.state, postcode: row.postcode, latitude: row.latitude, longitude: row.longitude, retiredAt: null }, 'BACKFILL')
      if (!r.ok) throw new Error('unexpected retired row')
      // The pre-S1 form built: name + ", " + state abbreviation + " " + postcode. The
      // search readers still read these columns (follow-up 1), so the format holds.
      expect(r.legacy.location).toBe(row.suburb + ', ' + row.state + ' ' + row.postcode)
      expect(r.legacy.city).toBe(row.suburb)
      expect(r.legacy.state).toBe(row.state)
      expect(r.legacy.postalCode).toBe(row.postcode)
      expect(r.legacy.latitude).toBe(row.latitude)
      expect(r.legacy.longitude).toBe(row.longitude)
    })
  })
})
