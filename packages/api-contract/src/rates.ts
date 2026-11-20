// worker-rates (2026-11-20): the worker's own rates, one set per worker (Services -> Rates). Dollars with cents on the
// wire; the api stores cents (worker_rates). Weekdays, Saturdays, Sundays, Public Holidays and Evenings per hour, the
// inactive sleepover per night. The weekday rate is required, the others optional. Read by the worker and the admin;
// not part of completion. Its own file: both the worker and the admin contracts use it.
import * as z from 'zod'

/** The rates in page order; each name is a body field and a `<name>Cents` column. */
export const RATE_NAMES = ['weekday', 'saturday', 'sunday', 'publicHoliday', 'evening', 'inactiveSleepover'] as const
export type RateName = (typeof RATE_NAMES)[number]

export const RATE_MIN = 0.01
export const RATE_MAX = 9999.99

/** Dollars, at most two decimals, $0.01..$9,999.99. */
export const rateAmountSchema = z
  .number('Enter an amount in dollars')
  .min(RATE_MIN, 'Enter an amount of at least $0.01')
  .max(RATE_MAX, 'Enter an amount of at most $9,999.99')
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Use at most two decimals (cents)')

/** PUT /v1/worker/rates: all six; the weekday rate is required, a blank other is null. */
export const ratesBodySchema = z.strictObject({
  weekday: rateAmountSchema,
  saturday: rateAmountSchema.nullable(),
  sunday: rateAmountSchema.nullable(),
  publicHoliday: rateAmountSchema.nullable(),
  evening: rateAmountSchema.nullable(),
  inactiveSleepover: rateAmountSchema.nullable(),
})
export type RatesBody = z.output<typeof ratesBodySchema>

/** The stored rates; every field null until the worker saves them (`updatedAt` null too). */
export const ratesViewSchema = z.strictObject({
  weekday: rateAmountSchema.nullable(),
  saturday: rateAmountSchema.nullable(),
  sunday: rateAmountSchema.nullable(),
  publicHoliday: rateAmountSchema.nullable(),
  evening: rateAmountSchema.nullable(),
  inactiveSleepover: rateAmountSchema.nullable(),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
})
export type RatesView = z.output<typeof ratesViewSchema>

/** The read's response: `{ rates }`, the shape a section picks from. */
export const ratesReadSchema = z.strictObject({ rates: ratesViewSchema })
export type RatesRead = z.output<typeof ratesReadSchema>

export const toCents = (dollars: number): number => Math.round(dollars * 100)
export const toDollars = (cents: number | null): number | null => (cents === null ? null : cents / 100)
