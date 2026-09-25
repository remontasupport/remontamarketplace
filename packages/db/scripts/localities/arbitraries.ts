// fast-check generators shared by the localities tests.
import fc from 'fast-check'
import { roundCoord, type LocalityRow } from './csv.js'

export const localityRow: fc.Arbitrary<LocalityRow> = fc.record({
  localityPid: fc.stringMatching(/^loc[0-9a-f]{4}$/),
  state: fc.constantFrom('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'OT'),
  suburb: fc.string({ minLength: 1, maxLength: 20 }),
  searchName: fc.string({ minLength: 1, maxLength: 20 }),
  postcode: fc.stringMatching(/^[0-9]{4}$/),
  latitude: fc.double({ min: -55, max: -9, noNaN: true }).map(roundCoord),
  longitude: fc.double({ min: 72, max: 169, noNaN: true }).map(roundCoord),
})

/** Rows with distinct (localityPid, postcode) keys, as a real CSV has. */
export const localityRows = (maxLength = 30) =>
  fc.uniqueArray(localityRow, { maxLength, selector: (r) => `${r.localityPid}|${r.postcode}` })
