import { describe, expect, it } from 'vitest'
import { csvFilename, requestersCsv } from './exportCsv'

const row = (firstName: string, lastName: string, email: string, mobile: string) => ({ userId: email, role: 'CLIENT' as const, firstName, lastName, email, mobile, participantCount: 1, requestCount: 2 })

describe('the clients / coordinators CSV', () => {
  it('has the four columns only, in order', () => {
    expect(requestersCsv([row('Ann', 'Lee', 'ann@x.au', '0412 345 678'), row('Bo', "O'Neil, Jr", 'bo@x.au', '+61 400 000 000')])).toBe(
      'First name,Last name,Email,Mobile\r\nAnn,Lee,ann@x.au,0412 345 678\r\nBo,"O\'Neil, Jr",bo@x.au,+61 400 000 000\r\n',
    )
  })

  it('names the file after the list and the day', () => {
    expect(csvFilename('CLIENT', new Date(2026, 9, 28))).toBe('clients-2026-10-28.csv')
    expect(csvFilename('COORDINATOR', new Date(2026, 0, 5))).toBe('support-coordinators-2026-01-05.csv')
  })
})
