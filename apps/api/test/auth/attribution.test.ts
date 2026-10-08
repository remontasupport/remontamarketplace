// The pipeline with the real JwtAuthenticator (U1): a valid ADMIN token reaches the
// handler with the principal and an attributed logger; a worker's token is 403; no token
// is 401 (US-AS-17, R4.1, R4.2).
import { API_TOKEN_AUDIENCE, API_TOKEN_ISSUER, API_TOKEN_KID, API_TOKEN_TTL_S } from '@remonta/api-contract'
import { SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { HandlerContext } from '../../src/platform/contract/handlers'
import { JwtAuthenticator } from '../../src/platform/auth/jwt-authenticator'
import { privateContract } from '../fixtures/private-contract'
import { testApp, type TestApp } from '../helpers'

const SECRET = new TextEncoder().encode('attribution-test-secret-0123456789')
const mint = (sub: string, role: string, act?: string) => {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ sub, role, ...(act ? { act } : {}), iss: API_TOKEN_ISSUER, aud: API_TOKEN_AUDIENCE, jti: 'jti-attribution-1' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT', kid: API_TOKEN_KID })
    .setIssuedAt(now)
    .setExpirationTime(now + API_TOKEN_TTL_S)
    .sign(SECRET)
}

let t: TestApp
const seen: { principal: HandlerContext['principal']; bindings: Record<string, unknown> }[] = []
const warnLines: Record<string, unknown>[] = []

beforeAll(async () => {
  t = await testApp({
    contracts: [privateContract],
    handlerSets: [
      {
        contract: privateContract,
        handlers: {
          adminThing: async (_req, ctx) => {
            seen.push({ principal: ctx.principal, bindings: (ctx.log as unknown as { bindings(): Record<string, unknown> }).bindings() })
            return { status: 200, body: { ok: true } }
          },
        },
      },
    ],
    authenticator: new JwtAuthenticator({ secrets: { current: SECRET }, log: () => ({ warn: (obj) => warnLines.push(obj) }) }),
  })
})
afterAll(() => t.close())

const call = (authorization?: string) =>
  t.fastify.inject({ method: 'POST', url: '/v1/test/admin-thing/x1', headers: authorization ? { authorization } : {}, payload: { name: 'n' } })

describe('an admin entry behind the real verifier', () => {
  it('an ADMIN token reaches the handler; the request logger carries the user id', async () => {
    const res = await call(`Bearer ${await mint('admin_1', 'ADMIN')}`)
    expect(res.statusCode).toBe(200)
    expect(seen.at(-1)?.principal).toEqual({ userId: 'admin_1', role: 'ADMIN' })
    expect(seen.at(-1)?.bindings).toMatchObject({ userId: 'admin_1' })
    expect(seen.at(-1)?.bindings.impersonatorId).toBeUndefined()
  })

  it('an impersonating admin carries the worker as subject: 403 on an admin entry (US-AS-10)', async () => {
    const res = await call(`Bearer ${await mint('worker_1', 'WORKER', 'admin_1')}`)
    expect(res.statusCode).toBe(403)
    expect(res.json()).toMatchObject({ error: { code: 'FORBIDDEN' } })
  })

  it('no token: 401 with the generic envelope and a warn line without the token', async () => {
    const before = warnLines.length
    const res = await call()
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } })
    expect(warnLines.slice(before)).toEqual([{ auth: 'rejected', reason: 'missing' }])
  })

  it('a bad token: 401, reason bad-signature', async () => {
    const before = warnLines.length
    const res = await call(`Bearer ${(await mint('admin_1', 'ADMIN')).slice(0, -3)}xyz`)
    expect(res.statusCode).toBe(401)
    expect(warnLines.slice(before)).toEqual([{ auth: 'rejected', reason: 'bad-signature' }])
  })
})
