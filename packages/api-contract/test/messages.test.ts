// Plain-English validation messages (2026-10-14): what a person reads for each kind of check, through the real
// section schemas; a schema's own message always wins.
import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { bankAccountSchema, friendlyError, jobHistorySchema, nameSchema, supportActivitiesSchema } from '../src/index'

const messages = (schema: z.ZodType, input: unknown) => {
  const r = schema.safeParse(input, { error: friendlyError })
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]))
}
const job = { jobTitle: 'Carer', company: 'Acme', startMonth: 'January', startYear: 2019, endMonth: 'March', endYear: 2020, currentlyWorking: false }

describe('friendlyError', () => {
  it('an empty required text field and an unchosen year read "This field is required." (the two reported)', () => {
    const m = messages(jobHistorySchema, { entries: [{ ...job, jobTitle: '', startYear: '' }] })
    expect(m['entries.0.jobTitle']).toBe('This field is required.')
    expect(m['entries.0.startYear']).toBe('This field is required.')
    expect(JSON.stringify(m)).not.toMatch(/Too small|Invalid input|expected/)
  })
  it('a typed value of the wrong kind, an option not in the list, too long, too many', () => {
    expect(messages(jobHistorySchema, { entries: [{ ...job, startYear: 'abc' }] })['entries.0.startYear']).toBe('Please enter a number.')
    expect(messages(jobHistorySchema, { entries: [{ ...job, startMonth: 'Smarch' }] })['entries.0.startMonth']).toBe('Please choose one of the options.')
    expect(messages(jobHistorySchema, { entries: [{ ...job, company: 'x'.repeat(101) }] })['entries.0.company']).toBe('Please keep this to 100 characters or fewer.')
    expect(messages(jobHistorySchema, { entries: Array.from({ length: 21 }, () => job) })['entries']).toBe('Please choose no more than 20.')
    expect(messages(jobHistorySchema, { entries: [{ ...job, startYear: 1900 }] })['entries.0.startYear']).toBe('Please enter 1950 or more.')
  })
  it('an empty required list, an unknown field', () => {
    expect(messages(supportActivitiesSchema, { uniqueService: [] })['uniqueService']).toBe('Please choose at least one.')
    expect(messages(nameSchema, { firstName: 'A', middleName: null, lastName: 'B', nickname: 'x' })['']).toBe('This is not accepted here: nickname.')
  })
  it("a schema's own message wins", () => {
    expect(messages(bankAccountSchema, { accountName: 'A', bankName: 'B', bsb: '12', accountNumber: '123456' })['bsb']).toBe('A BSB has 6 digits')
    expect(messages(nameSchema, { firstName: '1', middleName: null, lastName: 'B' })['firstName']).toBe('Letters, spaces, hyphens and apostrophes only')
  })
})
