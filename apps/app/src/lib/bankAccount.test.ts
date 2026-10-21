// The app's mask equals the api's on every fixture (U2 H6): the admin page and the worker's
// own read show the same last three digits, and neither ever shows more.
import { describe, expect, it } from 'vitest'
import { maskBankAccount as apiMask } from '../../../api/src/modules/worker/domain/bank-account'
import { maskBankAccount } from './bankAccount'

const fixtures: unknown[] = [
  { accountName: 'M Lee', bankName: 'CBA', bsb: '062-000', accountNumber: '12345678' },
  { accountName: 'M Lee', bankName: 'CBA', bsb: '062000', accountNumber: '1234 5678 9' },
  { accountName: 'x'.repeat(150), bankName: 'y'.repeat(150), bsb: '123456', accountNumber: '000123' },
  { accountName: 'M', bankName: 'CBA', bsb: '12', accountNumber: '12345678' },
  { accountName: 'M', bankName: 'CBA', bsb: 123456, accountNumber: '12345678' },
  { accountName: 'M', bankName: 'CBA' },
  null,
  'a string',
  [],
]

describe('maskBankAccount (app) equals the api', () => {
  it.each(fixtures.map((f) => [JSON.stringify(f), f]))('%s', (_l, f) => {
    expect(maskBankAccount(f)).toEqual(apiMask(f))
  })
  it('never carries the full numbers', () => {
    const m = maskBankAccount(fixtures[0])
    expect(JSON.stringify(m)).not.toMatch(/12345678|062-?000/)
  })
})
