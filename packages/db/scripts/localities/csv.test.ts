import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { localityRows } from './arbitraries.js'
import { compareRows, fromCsv, toCsv } from './csv.js'

describe('au_localities.csv', () => {
  it('round-trips any rows, in canonical order, including commas, quotes and newlines in names', () => {
    fc.assert(
      fc.property(localityRows(), (rows) => {
        const back = fromCsv(toCsv(rows))
        expect(back).toEqual([...rows].sort(compareRows).map((r) => ({ ...r, latitude: r.latitude + 0, longitude: r.longitude + 0 })))
      }),
    )
  })

  it('is independent of input order (stable diffs)', () => {
    fc.assert(
      fc.property(localityRows(), (rows) => {
        expect(toCsv([...rows].reverse())).toBe(toCsv(rows))
      }),
    )
  })

  it('reads CRLF checkouts', () => {
    const csv = toCsv([
      { localityPid: 'loc1', state: 'NSW', suburb: 'A, B', searchName: 'a, b', postcode: '2000', latitude: -33.8, longitude: 151.2 },
    ])
    expect(fromCsv(csv.replace(/\n/g, '\r\n'))).toEqual(fromCsv(csv))
  })

  it('rejects an unexpected header', () => {
    expect(() => fromCsv('pid,name\n')).toThrow(/header/)
  })
})
