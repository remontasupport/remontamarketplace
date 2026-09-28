// The stateless email code (S1 step 13): what a signed ticket proves, as properties.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { emailVerificationCode } from '../../src/modules/notifications/templates'
import { checkEmailCode, EMAIL_CODE_TTL_MS, newEmailCode, signEmailCode } from '../../src/modules/registration/domain/email-code'

const SECRET = 'secret-'.repeat(6)
const NOW = new Date('2026-09-28T10:00:00Z')
const claim = fc.record({
  email: fc.emailAddress().map((e) => e.toLowerCase()),
  code: fc.stringMatching(/^[0-9]{6}$/),
  expiresAt: fc.integer({ min: NOW.getTime() + 1, max: NOW.getTime() + EMAIL_CODE_TTL_MS }),
})

describe('email code tickets', () => {
  it('a code is always six digits, leading zeros kept', () => {
    for (let i = 0; i < 2000; i++) expect(newEmailCode()).toMatch(/^[0-9]{6}$/)
  })

  it('what was signed verifies, until it expires', () => {
    fc.assert(
      fc.property(claim, (c) => {
        const token = signEmailCode(SECRET, c)
        expect(token).toMatch(/^[0-9a-f]{64}$/)
        expect(checkEmailCode(SECRET, { ...c, token }, NOW)).toBe('ok')
        expect(checkEmailCode(SECRET, { ...c, token }, new Date(c.expiresAt))).toBe('expired')
        expect(checkEmailCode(SECRET, { ...c, token }, new Date(c.expiresAt - 1))).toBe('ok')
      }),
    )
  })

  it('changing the address, the code, the expiry, the token or the secret breaks it', () => {
    fc.assert(
      fc.property(claim, fc.stringMatching(/^[0-9]{6}$/), (c, otherCode) => {
        const token = signEmailCode(SECRET, c)
        expect(checkEmailCode(SECRET, { ...c, email: `x${c.email}`, token }, NOW)).toBe('mismatch')
        if (otherCode !== c.code) expect(checkEmailCode(SECRET, { ...c, code: otherCode, token }, NOW)).toBe('mismatch')
        // A later expiry on the same token: the expiry is part of what was signed.
        expect(checkEmailCode(SECRET, { ...c, expiresAt: c.expiresAt + 1, token }, NOW)).toBe('mismatch')
        expect(checkEmailCode(SECRET, { ...c, token: token.slice(0, 63) + (token.endsWith('0') ? '1' : '0') }, NOW)).toBe('mismatch')
        expect(checkEmailCode(SECRET, { ...c, token: 'ab' }, NOW)).toBe('mismatch')
        expect(checkEmailCode('another-secret'.repeat(3), { ...c, token }, NOW)).toBe('mismatch')
      }),
    )
  })

  it('an expired ticket is reported expired even when the token is wrong (nothing to learn from a guess)', () => {
    expect(checkEmailCode(SECRET, { email: 'a@b.test', code: '123456', expiresAt: NOW.getTime() - 1, token: 'ab' }, NOW)).toBe('expired')
  })
})

describe('the verification-code email', () => {
  it('carries the code in the subject, the HTML and the text, with the expiry', () => {
    const m = emailVerificationCode('042817', 10)
    expect(m.subject).toBe('042817 is your Remonta verification code')
    expect(m.html).toContain('042817')
    expect(m.text).toContain('042817')
    expect(m.text).toContain('10 minutes')
  })
})
