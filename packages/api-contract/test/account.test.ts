// The account area (api-review U5d): the caller's own email and password, the sign-up's rules, audited.
import { describe, expect, it } from 'vitest'
import { accountContract, accountEmailBodySchema, accountPasswordBodySchema } from '../src/index'

describe('accountContract', () => {
  it('two writes for workers, clients and coordinators (never admins), each with its own audit action and tight limits', () => {
    const { putEmail, putPassword } = accountContract.entries
    for (const e of [putEmail, putPassword]) {
      expect(e.meta.access).toEqual({ roles: ['WORKER', 'CLIENT', 'COORDINATOR'] })
      expect(e.meta.rateLimit).toEqual([{ per: 'user', limit: 5, window: '1m' }, { per: 'ip', limit: 20, window: '1m' }])
      expect(e.meta.maxBodyKb).toBe(2)
    }
    expect(putEmail.meta.audit).toBe('EMAIL_CHANGE')
    expect(putPassword.meta.audit).toBe('PASSWORD_CHANGE')
  })

  it('the email is normalised as at sign-up; nothing else is accepted', () => {
    expect(accountEmailBodySchema.parse({ email: '  Sam@Example.COM ' })).toEqual({ email: 'sam@example.com' })
    expect(accountEmailBodySchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
    expect(accountEmailBodySchema.safeParse({ email: 'a@b.co', userId: 'x' }).success).toBe(false)
  })

  it("the password follows the sign-up's rules; no other field (no user id)", () => {
    expect(accountPasswordBodySchema.safeParse({ password: 'Str0ng!pass' }).success).toBe(true)
    expect(accountPasswordBodySchema.safeParse({ password: 'weakpass' }).success).toBe(false)
    expect(accountPasswordBodySchema.safeParse({ password: 'Str0ng!pass', userId: 'x' }).success).toBe(false)
  })
})
