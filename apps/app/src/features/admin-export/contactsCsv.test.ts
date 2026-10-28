import { describe, expect, it } from 'vitest'
import { contactsCsv, datedCsvName } from './contactsCsv'

const row = (firstName: string, lastName: string, email: string | null, mobile: string) => ({ firstName, lastName, email, mobile, participantCount: 1 })

describe('the admin contact list CSV', () => {
  it('has the four columns only, in order; a worker without an email gets an empty cell', () => {
    expect(contactsCsv([row('Ann', 'Lee', 'ann@x.au', '0412 345 678'), row('Bo', "O'Neil, Jr", 'bo@x.au', '+61 400 000 000'), row('Cy', 'Ng', null, '0400 111 222')])).toBe(
      'First name,Last name,Email,Mobile\r\nAnn,Lee,ann@x.au,0412 345 678\r\nBo,"O\'Neil, Jr",bo@x.au,+61 400 000 000\r\nCy,Ng,,0400 111 222\r\n',
    )
  })

  it('names the file after the tab and the day', () => {
    expect(datedCsvName('clients', new Date(2026, 9, 28))).toBe('clients-2026-10-28.csv')
    expect(datedCsvName('contractors', new Date(2026, 0, 5))).toBe('contractors-2026-01-05.csv')
  })
})
