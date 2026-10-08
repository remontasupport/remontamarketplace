// The api token's claims (U1, functional design R1; property P4): the one definition
// both apps/app (minting) and apps/api (verifying) compile against.
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { API_TOKEN_ALG, API_TOKEN_AUDIENCE, API_TOKEN_ISSUER, API_TOKEN_KID, API_TOKEN_TTL_S, apiTokenClaimsSchema, principalOf, ROLES } from '../src/index'

const base = { sub: 'user_1', role: 'ADMIN', iss: API_TOKEN_ISSUER, aud: API_TOKEN_AUDIENCE, iat: 1_700_000_000, exp: 1_700_000_300, jti: 'a1b2c3d4-e5f6' } as const

describe('api token claims', () => {
  it('pins the constants the two sides agree on', () => {
    expect(API_TOKEN_ISSUER).toBe('remonta-app')
    expect(API_TOKEN_AUDIENCE).toBe('remonta-api')
    expect(API_TOKEN_TTL_S).toBe(300)
    expect(API_TOKEN_ALG).toBe('HS256')
    expect(API_TOKEN_KID).toBe('current')
  })

  it('parses a valid set and maps it to a principal; `act` becomes the impersonator', () => {
    expect(principalOf(apiTokenClaimsSchema.parse(base))).toEqual({ userId: 'user_1', role: 'ADMIN' })
    expect(principalOf(apiTokenClaimsSchema.parse({ ...base, role: 'WORKER', act: 'admin_9' }))).toEqual({ userId: 'user_1', role: 'WORKER', impersonatorId: 'admin_9' })
  })

  it('is strict: an extra claim, an unknown role, a missing claim, a wrong issuer or audience, or a bad type is refused (P4)', () => {
    const bad: unknown[] = [
      { ...base, email: 'a@b.c' },
      { ...base, role: 'SUPER_ADMIN' },
      (({ jti: _jti, ...rest }) => rest)(base),
      { ...base, iss: 'someone-else' },
      { ...base, aud: 'another-api' },
      { ...base, exp: '1700000300' },
      { ...base, sub: '' },
      { ...base, act: '' },
      { ...base, jti: 'short' },
    ]
    for (const claims of bad) expect(apiTokenClaimsSchema.safeParse(claims).success, JSON.stringify(claims)).toBe(false)
  })

  it('property: any generated valid claim set parses unchanged and round-trips through the principal', () => {
    const claimsArb = fc.record({
      sub: fc.string({ minLength: 1, maxLength: 40 }),
      role: fc.constantFrom(...ROLES),
      act: fc.option(fc.string({ minLength: 1, maxLength: 40 }), { nil: undefined }),
      iss: fc.constant(API_TOKEN_ISSUER),
      aud: fc.constant(API_TOKEN_AUDIENCE),
      iat: fc.integer({ min: 0, max: 4_000_000_000 }),
      exp: fc.integer({ min: 0, max: 4_000_000_000 }),
      jti: fc.string({ minLength: 8, maxLength: 64 }),
    })
    fc.assert(
      fc.property(claimsArb, (c) => {
        const claims = c.act === undefined ? (({ act: _act, ...rest }) => rest)(c) : c
        const parsed = apiTokenClaimsSchema.parse(claims)
        expect(parsed).toEqual(claims)
        const p = principalOf(parsed)
        expect(p.userId).toBe(c.sub)
        expect(p.role).toBe(c.role)
        expect(p.impersonatorId).toBe(c.act)
      }),
      { numRuns: 200 },
    )
  })
})
