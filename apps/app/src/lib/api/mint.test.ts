// The token route's logic (U1 C11): every branch of L1/R2 with fakes, the claims
// shape (P6: parses with the contract's schema, exp - iat = 300), no-store on
// every answer, impersonation (R2.6), S4 (suspended between two mints), S7 (the
// limiter failing open is the helper's job; here it answers), S8 (database error
// = 503 with Retry-After, never 401). Interop: a token minted here verifies with
// jose under the same secret and the api's verification options.
import { describe, expect, it } from 'vitest'
import { decodeProtectedHeader, jwtVerify } from 'jose'
import { API_TOKEN_TTL_S, apiTokenClaimsSchema } from '@remonta/api-contract'
import { mintApiToken, type MintDeps } from './mint'

const SECRET = 'test-secret-with-at-least-thirty-two-characters'
const NOW_MS = 1_800_000_000_000

function deps(over: Partial<MintDeps> = {}): MintDeps {
  return {
    session: { user: { id: 'admin-1', role: 'ADMIN' } },
    readAccount: async () => ({ status: 'ACTIVE', role: 'ADMIN' }),
    rateLimit: async () => ({ success: true }),
    secret: SECRET,
    now: () => NOW_MS,
    randomId: () => 'jti-0000',
    log: () => {},
    ...over,
  }
}

describe('mintApiToken', () => {
  it('mints a token whose claims parse with the contract schema; exp - iat = 300; no-store (R1, R2.5, P6)', async () => {
    const r = await mintApiToken(deps())
    expect(r.status).toBe(200)
    expect(r.headers['cache-control']).toBe('no-store')
    const { payload, protectedHeader } = await jwtVerify(String(r.body.token), new TextEncoder().encode(SECRET), {
      algorithms: ['HS256'],
      issuer: 'remonta-app',
      audience: 'remonta-api',
      currentDate: new Date(NOW_MS),
    })
    expect(protectedHeader).toEqual({ alg: 'HS256', typ: 'JWT', kid: 'current' })
    const claims = apiTokenClaimsSchema.parse(payload)
    expect(claims.sub).toBe('admin-1')
    expect(claims.role).toBe('ADMIN')
    expect(claims.act).toBeUndefined()
    expect(claims.exp - claims.iat).toBe(API_TOKEN_TTL_S)
    expect(claims.iat).toBe(Math.floor(NOW_MS / 1000))
    expect(r.body.expiresAt).toBe(new Date((Math.floor(NOW_MS / 1000) + API_TOKEN_TTL_S) * 1000).toISOString())
  })

  it('no session: 401, no token (R2.1)', async () => {
    const r = await mintApiToken(deps({ session: null }))
    expect(r.status).toBe(401)
    expect(r.body.token).toBeUndefined()
    expect(r.headers['cache-control']).toBe('no-store')
  })

  it('a missing or short secret: 500 misconfigured, logged by name, no token', async () => {
    const lines: string[] = []
    const r = await mintApiToken(deps({ secret: 'short', log: (_l, _d, msg) => void lines.push(msg) }))
    expect(r.status).toBe(500)
    expect(lines[0]).toContain('API_TOKEN_SECRET')
    expect((await mintApiToken(deps({ secret: undefined }))).status).toBe(500)
  })

  it('inactive or missing account: 401 account-inactive (R2.2, S4)', async () => {
    const logged: Record<string, unknown>[] = []
    const log: MintDeps['log'] = (_l, d) => void logged.push(d)
    expect((await mintApiToken(deps({ readAccount: async () => ({ status: 'SUSPENDED', role: 'ADMIN' }), log }))).status).toBe(401)
    expect((await mintApiToken(deps({ readAccount: async () => null, log }))).status).toBe(401)
    expect(logged.every((d) => d.reason === 'account-inactive')).toBe(true)
  })

  it('a role that differs from the session: 401 role-changed (R2.3)', async () => {
    const logged: Record<string, unknown>[] = []
    const r = await mintApiToken(deps({ readAccount: async () => ({ status: 'ACTIVE', role: 'WORKER' }), log: (_l, d) => void logged.push(d) }))
    expect(r.status).toBe(401)
    expect(logged[0]?.reason).toBe('role-changed')
  })

  it('a database error: 503 with Retry-After, never 401 (S8)', async () => {
    const r = await mintApiToken(deps({ readAccount: async () => Promise.reject(new Error("Can't reach database server")) }))
    expect(r.status).toBe(503)
    expect(r.headers['retry-after']).toBe('2')
    expect(r.headers['cache-control']).toBe('no-store')
  })

  it('the limiter exceeded: 429 with Retry-After (R2.4)', async () => {
    const r = await mintApiToken(deps({ rateLimit: async () => ({ success: false, retryAfter: 17 }) }))
    expect(r.status).toBe(429)
    expect(r.headers['retry-after']).toBe('17')
  })

  it('impersonation: sub = the impersonated user, role = their account role, act = the admin (R2.6)', async () => {
    const r = await mintApiToken(
      deps({
        session: { user: { id: 'worker-7', role: 'WORKER', impersonatedBy: 'admin-1' } },
        readAccount: async (id) => (id === 'worker-7' ? { status: 'ACTIVE', role: 'WORKER' } : null),
      }),
    )
    expect(r.status).toBe(200)
    const { payload } = await jwtVerify(String(r.body.token), new TextEncoder().encode(SECRET), { currentDate: new Date(NOW_MS) })
    const claims = apiTokenClaimsSchema.parse(payload)
    expect(claims.sub).toBe('worker-7')
    expect(claims.role).toBe('WORKER')
    expect(claims.act).toBe('admin-1')
    expect(decodeProtectedHeader(String(r.body.token)).kid).toBe('current')
  })

  it('the account is read on every mint: suspended between two mints refuses the second (S4)', async () => {
    let status = 'ACTIVE'
    const d = deps({ readAccount: async () => ({ status, role: 'ADMIN' }) })
    expect((await mintApiToken(d)).status).toBe(200)
    status = 'SUSPENDED'
    expect((await mintApiToken(d)).status).toBe(401)
  })
})
