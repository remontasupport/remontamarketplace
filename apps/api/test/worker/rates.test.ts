// worker-rates (2026-11-20): the row <-> view mapping, without a database.
import { RATE_NAMES, type RatesBody } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { ratesView, toColumns, type RatesRow } from '../../src/modules/worker/application/sections/rates'

describe('the rates mapping', () => {
  it('no row: every field null', () => {
    expect(ratesView(null)).toEqual({ weekday: null, saturday: null, sunday: null, publicHoliday: null, evening: null, inactiveSleepover: null, updatedAt: null })
  })

  it('a body to cents and back, exactly', () => {
    const body: RatesBody = { weekday: 42.5, saturday: 0.01, sunday: null, publicHoliday: 9999.99, evening: 33.33, inactiveSleepover: null }
    const cols = toColumns(body)
    expect(cols).toEqual({ weekdayCents: 4250, saturdayCents: 1, sundayCents: null, publicHolidayCents: 999999, eveningCents: 3333, inactiveSleepoverCents: null })
    const at = new Date('2026-11-20T01:02:03.000Z')
    expect(ratesView({ ...cols, updatedAt: at })).toEqual({ ...body, updatedAt: at.toISOString() })
  })

  it('property: any cents row survives view -> body -> columns', () => {
    const cents = fc.option(fc.integer({ min: 1, max: 999999 }), { nil: null })
    fc.assert(
      fc.property(fc.tuple(cents, cents, cents, cents, cents, cents), (values) => {
        const row = { ...Object.fromEntries(RATE_NAMES.map((n, i) => [`${n}Cents`, values[i]])), updatedAt: new Date(0) } as RatesRow
        const { updatedAt: _u, ...view } = ratesView(row)
        const { updatedAt: _v, ...cols } = row
        expect(toColumns({ ...view, weekday: view.weekday ?? 1 })).toEqual({ ...cols, weekdayCents: cols.weekdayCents ?? 100 })
      }),
    )
  })
})
