// JwtAuthenticator (U1 api-identity): every rejection reason of R3, the previous-secret
// path of P6, and the properties P1 (round-trip), P2 (single-field corruption), P3
// (the tolerance window) and P7 (purity). Tokens are minted here exactly as apps/app
// mints them: `jose` SignJWT with the contract's constants.
import { API_TOKEN_ALG, API_TOKEN_AUDIENCE, API_TOKEN_ISSUER, API_TOKEN_KID, API_TOKEN_KID_PREVIOUS, API_TOKEN_TTL_S, ROLES } from '@remonta/api-contract'
import fc from 'fast-check'
import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { JwtAuthenticator, MAX_TOKEN_LENGTH, type RejectionReason } from '../../src/platform/auth/jwt-authenticator'

const utf8 = (s: string) => new TextEncoder().encode(s)
const CURRENT = utf8('test-secret-current-0123456789abcdef')
const PREVIOUS = utf8('test-secret-previous-0123456789abcdef')
const OTHER = utf8('test-secret-other-0123456789abcdefgh')
const NOW = new Date('2026-10-08T10:00:00Z')
const nowS = Math.floor(NOW.getTime() / 1000)

/** Loose on purpose: the tests mint deliberately wrong claims. */
type Claims = Record<string, unknown>

/** The app's recipe: the claims, HS256, `kid: current`, iat/exp as numbers. */
async function mint(claims: Claims, key: Uint8Array = CURRENT, opts: { kid?: string | null; alg?: string } = {}): Promise<string> {
  const { iat = nowS, exp = nowS + API_TOKEN_TTL_S, ...rest } = { sub: 'user_1', role: 'ADMIN', iss: API_TOKEN_ISSUER, aud: API_TOKEN_AUDIENCE, jti: 'jti-0001-abcd', ...claims }
  const header: Record<string, string> = { alg: opts.alg ?? API_TOKEN_ALG, typ: 'JWT' }
  if (opts.kid !== null) header.kid = opts.kid ?? API_TOKEN_KID
  return new SignJWT(rest as Record<string, unknown>)
    .setProtectedHeader(header as { alg: string })
    .setIssuedAt(iat as number)
    .setExpirationTime(exp as number)
    .sign(key)
}

function harness(opts: { previous?: Uint8Array; now?: Date } = {}) {
  const lines: { obj: Record<string, unknown>; msg?: string }[] = []
  const auth = new JwtAuthenticator({
    secrets: { current: CURRENT, previous: opts.previous },
    log: () => ({ warn: (obj, msg) => lines.push({ obj, msg }) }),
    clock: () => opts.now ?? NOW,
  })
  const run = (authorization?: string | string[]) => auth.authenticate(authorization === undefined ? {} : { authorization })
  const reasons = () => lines.map((l) => l.obj.reason as RejectionReason)
  return { auth, run, lines, reasons }
}

describe('JwtAuthenticator accepts', () => {
  it('a token minted the way the app mints it, and maps it to the principal (P1 example)', async () => {
    const h = harness()
    expect(await h.run(`Bearer ${await mint({})}`)).toEqual({ userId: 'user_1', role: 'ADMIN' })
    expect(h.lines).toEqual([])
  })

  it('an impersonation token: the subject is the worker, the admin is the impersonator (US-AS-10)', async () => {
    const h = harness()
    expect(await h.run(`Bearer ${await mint({ sub: 'worker_7', role: 'WORKER', act: 'admin_1' })}`)).toEqual({ userId: 'worker_7', role: 'WORKER', impersonatorId: 'admin_1' })
  })

  it('the scheme case-insensitively and with extra spaces', async () => {
    const h = harness()
    expect(await h.run(`  bearer   ${await mint({})}  `)).not.toBeNull()
  })

  it('a token signed with the previous secret when one is configured: by kid, and with no kid', async () => {
    const h = harness({ previous: PREVIOUS })
    expect(await h.run(`Bearer ${await mint({}, PREVIOUS, { kid: API_TOKEN_KID_PREVIOUS })}`)).not.toBeNull()
    expect(await h.run(`Bearer ${await mint({}, PREVIOUS, { kid: null })}`)).not.toBeNull()
    expect(await h.run(`Bearer ${await mint({}, CURRENT, { kid: null })}`)).not.toBeNull()
    expect(h.lines).toEqual([])
  })
})

describe('JwtAuthenticator refuses, with exactly one warn line naming the reason (R3.9)', () => {
  const cases: [string, () => Promise<string | string[] | undefined>, RejectionReason][] = [
    ['no header', async () => undefined, 'missing'],
    ['two headers', async () => [`Bearer ${await mint({})}`, `Bearer ${await mint({})}`], 'missing'],
    ['not a Bearer scheme', async () => `Basic ${await mint({})}`, 'malformed'],
    ['an empty token', async () => 'Bearer ', 'malformed'],
    ['a token longer than the cap', async () => `Bearer ${'a'.repeat(MAX_TOKEN_LENGTH + 1)}`, 'malformed'],
    ['not a JWT at all', async () => 'Bearer not.a.jwt', 'malformed'],
    ['a signature from another secret', async () => `Bearer ${await mint({}, OTHER)}`, 'bad-signature'],
    ['the previous secret when none is configured', async () => `Bearer ${await mint({}, PREVIOUS, { kid: API_TOKEN_KID_PREVIOUS })}`, 'malformed'],
    ['an unknown kid', async () => `Bearer ${await mint({}, CURRENT, { kid: 'v3' })}`, 'malformed'],
    ['expired past the tolerance', async () => `Bearer ${await mint({ iat: nowS - 400, exp: nowS - 31 })}`, 'expired'],
    ['not yet valid past the tolerance', async () => `Bearer ${await mint({ iat: nowS + 31, exp: nowS + 400, nbf: nowS + 31 })}`, 'not-yet-valid'],
    ['a wrong issuer', async () => `Bearer ${await mint({ iss: 'someone-else' })}`, 'bad-issuer'],
    ['a wrong audience', async () => `Bearer ${await mint({ aud: 'another-api' })}`, 'bad-audience'],
    ['an unknown role', async () => `Bearer ${await mint({ role: 'SUPER_ADMIN' })}`, 'bad-claims'],
    ['an extra claim', async () => `Bearer ${await mint({ email: 'a@b.c' })}`, 'bad-claims'],
    ['a missing claim', async () => `Bearer ${await mint({ jti: undefined })}`, 'bad-claims'],
    ['HS512 instead of HS256', async () => `Bearer ${await mint({}, utf8('x'.repeat(64)), { alg: 'HS512' })}`, 'malformed'],
    ['alg none', async () => {
      const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
      return `Bearer ${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'user_1', role: 'ADMIN', iss: API_TOKEN_ISSUER, aud: API_TOKEN_AUDIENCE, iat: nowS, exp: nowS + 300, jti: 'jti-0001-abcd' })}.`
    }, 'malformed'],
  ]
  it.each(cases)('%s', async (_name, header, reason) => {
    const h = harness({ previous: undefined })
    expect(await h.run(await header())).toBeNull()
    expect(h.reasons()).toEqual([reason])
    expect(JSON.stringify(h.lines)).not.toMatch(/eyJ|Bearer/)
  })

  it('a token in a cookie or in the query string: ignored, the header decides (R3.1)', async () => {
    const h = harness()
    const token = await mint({})
    expect(await h.auth.authenticate({ cookie: `token=${token}`, 'x-token': token })).toBeNull()
    expect(h.reasons()).toEqual(['missing'])
  })
})

describe('properties', () => {
  const claimsArb = fc.record({
    sub: fc.string({ minLength: 1, maxLength: 30 }),
    role: fc.constantFrom(...ROLES),
    act: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
    jti: fc.string({ minLength: 8, maxLength: 40 }),
  })

  it('P1: for any valid claims, mint-then-verify yields the principal {sub, role, act}', async () => {
    await fc.assert(
      fc.asyncProperty(claimsArb, async (c) => {
        const h = harness()
        const claims: Claims = c.act === undefined ? { sub: c.sub, role: c.role, jti: c.jti } : { ...c }
        const p = await h.run(`Bearer ${await mint(claims)}`)
        expect(p).toEqual({ userId: c.sub, role: c.role, ...(c.act !== undefined ? { impersonatorId: c.act } : {}) })
      }),
      { numRuns: 60 },
    )
  })

  it('P2: corrupting any one part of the compact token makes it fail', async () => {
    const token = await mint({})
    const parts = token.split('.')
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 2 }), fc.integer({ min: 0, max: 200 }), async (part, pos) => {
        const h = harness()
        const s = parts[part]!
        const i = pos % s.length
        const flipped = s[i] === 'A' ? 'B' : 'A'
        const mutated = [...parts]
        mutated[part] = s.slice(0, i) + flipped + s.slice(i + 1)
        expect(await h.run(`Bearer ${mutated.join('.')}`)).toBeNull()
        expect(h.lines).toHaveLength(1)
      }),
      { numRuns: 60 },
    )
  })

  it('P3: a token is accepted iff now is within [iat - skew, exp + skew]', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: -600, max: 600 }), async (offsetS) => {
        const token = await mint({ iat: nowS, exp: nowS + API_TOKEN_TTL_S })
        const h = harness({ now: new Date((nowS + offsetS) * 1000) })
        const accepted = (await h.run(`Bearer ${token}`)) !== null
        const expected = offsetS <= API_TOKEN_TTL_S + 30
        expect(accepted).toBe(expected)
      }),
      { numRuns: 100 },
    )
  })

  it('P7: verification is pure: the same input gives the same answer however many times and in any order', async () => {
    const good = `Bearer ${await mint({})}`
    const bad = `Bearer ${await mint({}, OTHER)}`
    const h = harness()
    const results = await Promise.all([good, bad, good, bad, good].map((x) => h.run(x)))
    expect(results.map((r) => r !== null)).toEqual([true, false, true, false, true])
  })
})
