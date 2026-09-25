import { readFile } from 'node:fs/promises'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
// Parity targets: the committed suburb list, and apps/app's own parser for the
// legacy location string. The parser is loaded at runtime so that apps/app's file
// is not type-checked under apps/api's stricter settings.
import { fromCsv } from '../../../../packages/db/scripts/localities/csv'
import { DEFAULT_TRAVEL_RADIUS_KM, localityLabel, placeHome, type Locality } from '../../src/modules/locations/domain/home'

type ParseLocation = (s: string) => { city: string | null; state: string | null; postalCode: string | null }
const PARSER = '../../../app/src/lib/location-parser'

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

describe('legacy parity over every real suburb', () => {
  it('writes the location string as the form did, and its postcode reads back, for every suburb', async () => {
    const { parseLocation } = (await import(PARSER)) as { parseLocation: ParseLocation }
    const rows = fromCsv(await readFile(new URL('../../../../packages/db/data/au_localities.csv', import.meta.url), 'utf8'))
    expect(rows.length).toBeGreaterThan(15000)
    const cityOrStateDiffers: string[] = []
    rows.forEach((row, i) => {
      const r = placeHome({ id: i + 1, suburb: row.suburb, state: row.state, postcode: row.postcode, latitude: row.latitude, longitude: row.longitude, retiredAt: null }, 'BACKFILL')
      if (!r.ok) throw new Error('unexpected retired row')
      // Step1Location.tsx builds: name + ", " + state abbreviation + " " + postcode
      expect(r.legacy.location).toBe(row.suburb + ', ' + row.state + ' ' + row.postcode)
      const parsed = parseLocation(r.legacy.location)
      expect(parsed.postalCode).toBe(row.postcode)
      if (parsed.city !== r.legacy.city || parsed.state !== r.legacy.state) cityOrStateDiffers.push(r.legacy.location)
    })
    // apps/app's parser is wrong for exactly two kinds of suburb, and the columns we
    // write are right where it is wrong (step 6 finding):
    //  - a name containing a state's full name: "Mount Victoria, NSW 2786" -> city "Mount"
    //  - the OT territories, which it does not know: state null
    const FULL_STATE = /Victoria|Queensland|Tasmania|New South Wales|South Australia|Western Australia|Northern Territory|Australian Capital Territory/i
    expect(cityOrStateDiffers.filter((l) => !FULL_STATE.test(l) && !l.includes(', OT '))).toEqual([])
    expect(cityOrStateDiffers).toHaveLength(23) // pinned: a change means the parser or the data changed
  })
})
