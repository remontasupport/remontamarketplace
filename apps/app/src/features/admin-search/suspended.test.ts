import { describe, expect, it } from 'vitest'
import { matchesNameOrEmail } from './suspended'

const mary = { firstName: 'Mary', lastName: "O'Connor", email: 'mary.oc@example.com' }

describe('the suspended accounts search', () => {
  it('matches the name or the email, any case, every word', () => {
    expect(matchesNameOrEmail(mary, '')).toBe(true)
    expect(matchesNameOrEmail(mary, '  ')).toBe(true)
    expect(matchesNameOrEmail(mary, 'mary')).toBe(true)
    expect(matchesNameOrEmail(mary, "MARY o'con")).toBe(true)
    expect(matchesNameOrEmail(mary, 'example.com')).toBe(true)
    expect(matchesNameOrEmail(mary, 'mary smith')).toBe(false)
    expect(matchesNameOrEmail({ ...mary, email: null }, 'example')).toBe(false)
  })
})
