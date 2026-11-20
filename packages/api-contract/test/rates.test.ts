// worker-rates (2026-11-20): the rates' body, view and entries.
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { adminContract, RATE_NAMES, rateAmountSchema, ratesBodySchema, ratesReadSchema, toCents, toDollars, workerContract } from '../src'

const body = { weekday: 42.5, saturday: 55, sunday: null, publicHoliday: 90.25, evening: null, inactiveSleepover: 250 }

describe('the rates body', () => {
  it('takes the weekday rate and nulls for the rest', () => {
    expect(ratesBodySchema.safeParse(body).success).toBe(true)
    expect(ratesBodySchema.safeParse({ ...body, saturday: null, publicHoliday: null, inactiveSleepover: null }).success).toBe(true)
  })

  it('requires the weekday rate', () => {
    expect(ratesBodySchema.safeParse({ ...body, weekday: null }).success).toBe(false)
    const { weekday: _w, ...rest } = body
    expect(ratesBodySchema.safeParse(rest).success).toBe(false)
  })

  it('refuses unknown fields, a missing optional field, strings, zero, negatives, more than $9,999.99 and fractions of a cent', () => {
    expect(ratesBodySchema.safeParse({ ...body, night: 1 }).success).toBe(false)
    const { evening: _e, ...noEvening } = body
    expect(ratesBodySchema.safeParse(noEvening).success).toBe(false)
    for (const bad of ['42', 0, -1, 10000, 9999.995, 12.345, Number.NaN, Number.POSITIVE_INFINITY]) expect(rateAmountSchema.safeParse(bad).success, String(bad)).toBe(false)
    for (const ok of [0.01, 1, 12.3, 12.34, 9999.99]) expect(rateAmountSchema.safeParse(ok).success, String(ok)).toBe(true)
  })

  it('round-trips every valid amount through cents exactly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 999999 }), (cents) => {
        const dollars = toDollars(cents)!
        expect(rateAmountSchema.safeParse(dollars).success).toBe(true)
        expect(toCents(dollars)).toBe(cents)
      }),
    )
    expect(toDollars(null)).toBeNull()
  })

  it('names the six rates in page order', () => {
    expect(RATE_NAMES).toEqual(['weekday', 'saturday', 'sunday', 'publicHoliday', 'evening', 'inactiveSleepover'])
  })
})

describe('the rates entries', () => {
  it('reads and replaces the worker rates at /v1/worker/rates; the read is never cached', () => {
    expect(workerContract.entries.getRates).toMatchObject({ method: 'GET', path: '/v1/worker/rates' })
    expect((workerContract.entries.getRates.meta as { privateCacheSeconds?: number }).privateCacheSeconds).toBeUndefined()
    expect(workerContract.entries.putRates).toMatchObject({ method: 'PUT', path: '/v1/worker/rates' })
    expect(workerContract.entries.putRates.meta.audit).toBe('PROFILE_UPDATE')
  })

  it('gives the admin one worker\'s rates, every field null before the worker saves them', () => {
    expect(adminContract.entries.getWorkerRates).toMatchObject({ method: 'GET', path: '/v1/admin/workers/:workerId/rates' })
    const empty = { rates: { weekday: null, saturday: null, sunday: null, publicHoliday: null, evening: null, inactiveSleepover: null, updatedAt: null } }
    expect(ratesReadSchema.safeParse(empty).success).toBe(true)
    expect(ratesReadSchema.safeParse({ rates: { ...empty.rates, updatedAt: '2026-11-20T01:02:03.000Z' }, extra: 1 }).success).toBe(false)
  })
})
