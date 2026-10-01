// The route-security enumeration (S1-design 2.3, "Automated proof"): for EVERY
// contract entry, the pipeline refuses what it must, before the handler runs.
// Real contracts are all public in S1, so a synthetic signed-in contract covers
// 401/403; it runs through exactly the same binder and pipeline.
import { contracts, defineContract, errorResponseSchema, meta, platformContract, type Contract, type EntryDef, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as z from 'zod'
import type { HandlerSet } from '../src/platform/contract/handlers'
import { multipart, testApp, unreachableHandlers, type TestApp } from './helpers'

const privateContract = defineContract('testPrivate', {
  adminThing: {
    method: 'POST',
    path: '/v1/test/admin-thing/:thingId',
    summary: 'test only',
    pathParams: z.strictObject({ thingId: z.string().max(10) }),
    body: { kind: 'json', schema: z.strictObject({ name: z.string().max(20) }) },
    responses: { 200: z.strictObject({ ok: z.literal(true) }) },
    meta: meta({
      access: { roles: ['ADMIN'] },
      bot: 'none',
      rateLimit: [{ per: 'ip', limit: 10, window: '1m' }, { per: 'user', limit: 5, window: '1m' }],
      maxBodyKb: 1,
    }),
  },
})

const all: readonly Contract[] = [...contracts, privateContract]
const entries = all.flatMap((c) => Object.entries(c.entries).map(([name, entry]) => ({ id: `${c.area}.${name}`, entry: entry as EntryDef })))

const url = (e: EntryDef, query = '') => e.path.replace(/:[a-zA-Z0-9]+/g, 'x1') + query
const VALID_TOKEN = { captchaToken: 'test-token' }

let t: TestApp
beforeAll(async () => {
  t = await testApp({ contracts: all, handlerSets: all.map(unreachableHandlers), publicEndpoints: publicEndpoints as PublicEndpoint[] })
})
afterAll(async () => {
  await t.close()
})

async function send(e: EntryDef, opts: { body?: unknown; raw?: { payload: Buffer; headers: Record<string, string> }; query?: string; headers?: Record<string, string> } = {}) {
  const res = await t.fastify.inject({
    method: e.method,
    url: url(e, opts.query),
    headers: { ...(opts.raw?.headers ?? {}), ...(opts.headers ?? {}) },
    ...(opts.raw ? { payload: opts.raw.payload } : opts.body !== undefined ? { payload: opts.body as object } : {}),
  })
  return res
}

function expectErrorShape(res: Awaited<ReturnType<typeof send>>, status: number) {
  expect(res.statusCode).toBe(status)
  const body = errorResponseSchema.parse(res.json())
  expect(body.error.requestId).toBe(res.headers['x-request-id'])
  expect(res.body).not.toMatch(/at .*\.(ts|js):\d+|HANDLER REACHED|stack/i)
  return body
}

describe.each(entries)('$id', ({ entry: e }) => {
  const signedInAdmin: Record<string, string> = e.meta.access === 'public' ? {} : { 'x-test-principal': 'u1:ADMIN' }

  it('carries the security headers and a request id', async () => {
    t.rateLimiter.mode = 'deny'
    const res = await send(e)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('DENY')
    expect(res.headers['content-security-policy']).toContain("default-src 'none'")
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('429 with Retry-After when the rate limit is reached', async () => {
    t.rateLimiter.mode = 'deny'
    const res = await send(e, { headers: signedInAdmin })
    expectErrorShape(res, 429)
    expect(res.headers['retry-after']).toBe('42')
  })

  it('503 when the rate limiter is unavailable (fails closed)', async () => {
    t.rateLimiter.mode = 'down'
    expectErrorShape(await send(e, { headers: signedInAdmin }), 503)
  })

  if (e.meta.access !== 'public') {
    it('401 for an anonymous caller', async () => {
      t.rateLimiter.mode = 'allow'
      expectErrorShape(await send(e, { body: {} }), 401)
    })
    it('403 for a caller with the wrong role', async () => {
      t.rateLimiter.mode = 'allow'
      expectErrorShape(await send(e, { body: {}, headers: { 'x-test-principal': 'u2:WORKER' } }), 403)
    })
  } else {
    it('never asks a public caller to sign in', async () => {
      t.rateLimiter.mode = 'allow'
      t.captcha.outcome = { ok: true, score: 0.9 }
      const res = await send(e, { body: e.body?.kind === 'json' ? VALID_TOKEN : undefined })
      expect(res.statusCode).not.toBe(401)
    })
  }

  if (e.meta.bot !== 'none') {
    const action = e.meta.bot.captcha.action
    it('403 without a CAPTCHA token, before validation', async () => {
      t.rateLimiter.mode = 'allow'
      expectErrorShape(await send(e, { body: { nonsense: true } }), 403)
    })
    it('403 when the CAPTCHA is rejected', async () => {
      t.rateLimiter.mode = 'allow'
      t.captcha.outcome = { ok: false, reason: 'rejected', detail: 'score' }
      expectErrorShape(await send(e, { body: VALID_TOKEN }), 403)
      expect(t.captcha.calls.at(-1)?.action).toBe(action)
    })
    it('503 when the CAPTCHA provider is unreachable (fails closed)', async () => {
      t.rateLimiter.mode = 'allow'
      t.captcha.outcome = { ok: false, reason: 'unavailable', detail: 'timeout' }
      expectErrorShape(await send(e, { body: VALID_TOKEN }), 503)
    })
  }

  if (e.body?.kind === 'json') {
    it('413 for a body over maxBodyKb, before parsing', async () => {
      t.rateLimiter.mode = 'allow'
      t.captcha.outcome = { ok: true, score: 0.9 }
      const big = { ...VALID_TOKEN, pad: 'x'.repeat(e.meta.maxBodyKb * 1024 + 1) }
      expectErrorShape(await send(e, { body: big, headers: signedInAdmin }), 413)
    })
    it('400 for unknown fields', async () => {
      t.rateLimiter.mode = 'allow'
      t.captcha.outcome = { ok: true, score: 0.9 }
      const body = expectErrorShape(await send(e, { body: { ...VALID_TOKEN, notAField: 1 }, headers: signedInAdmin }), 400)
      expect(JSON.stringify(body.error.fields)).toMatch(/Unrecognized key/)
    })
  }

  if (e.body?.kind === 'multipart') {
    const [field, rule] = Object.entries(e.body.files)[0]!
    it('413 for a file over its limit', async () => {
      t.rateLimiter.mode = 'allow'
      const raw = multipart([{ name: field, filename: 'a.jpg', type: rule.mimeTypes[0], data: Buffer.alloc(rule.maxBytes + 1, 1) }])
      expectErrorShape(await send(e, { raw, headers: signedInAdmin }), 413)
    })
    it('415 for a file type the contract does not accept', async () => {
      t.rateLimiter.mode = 'allow'
      const raw = multipart([{ name: field, filename: 'a.svg', type: 'image/svg+xml', data: '<svg/>' }])
      expectErrorShape(await send(e, { raw, headers: signedInAdmin }), 415)
    })
    it('415 for a body that is not multipart', async () => {
      t.rateLimiter.mode = 'allow'
      expectErrorShape(await send(e, { body: { [field]: 'x' }, headers: signedInAdmin }), 415)
    })
    it('400 for an extra part and for a missing file', async () => {
      t.rateLimiter.mode = 'allow'
      const extra = multipart([{ name: 'note', data: 'hello' }, { name: field, filename: 'a.jpg', type: rule.mimeTypes[0], data: 'x' }])
      expectErrorShape(await send(e, { raw: extra, headers: signedInAdmin }), 400)
      const other = multipart([{ name: 'notTheField', filename: 'a.jpg', type: rule.mimeTypes[0], data: 'x' }])
      expectErrorShape(await send(e, { raw: other, headers: signedInAdmin }), 400)
    })
  }

  if (e.method === 'GET') {
    it('400 for unknown query parameters', async () => {
      t.rateLimiter.mode = 'allow'
      expectErrorShape(await send(e, { query: '?q=abc&notAParam=1' }), 400)
    })
  }
})

describe('outside the contracts', () => {
  it('an undeclared route is a 404 in the error shape', async () => {
    t.rateLimiter.mode = 'allow'
    const res = await t.fastify.inject({ method: 'GET', url: '/v1/admin/users' })
    expectErrorShape(res, 404)
  })
  it('an undeclared method on a declared path is a 404', async () => {
    const res = await t.fastify.inject({ method: 'DELETE', url: '/v1/localities' })
    expectErrorShape(res, 404)
  })
  it('CORS answers only the allowed origin', async () => {
    const ok = await t.fastify.inject({ method: 'OPTIONS', url: '/v1/localities', headers: { origin: 'http://localhost:3000', 'access-control-request-method': 'GET' } })
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    const evil = await t.fastify.inject({ method: 'OPTIONS', url: '/v1/localities', headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' } })
    expect(evil.headers['access-control-allow-origin']).toBeUndefined()
  })
  it('a well-formed incoming x-request-id is kept; a malformed one is replaced', async () => {
    t.rateLimiter.mode = 'deny'
    const kept = await t.fastify.inject({ method: 'GET', url: '/v1/health', headers: { 'x-request-id': 'trace-abc-12345' } })
    expect(kept.headers['x-request-id']).toBe('trace-abc-12345')
    const replaced = await t.fastify.inject({ method: 'GET', url: '/v1/health', headers: { 'x-request-id': '<script>' } })
    expect(replaced.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('HTTPS only', () => {
  it('refuses plain HTTP on every entry except the probe, which the load balancer checks without X-Forwarded-Proto', async () => {
    // The real health handler shape, so that the probe can answer 200 when let through.
    const health: HandlerSet = { contract: platformContract, handlers: { health: async () => ({ status: 200, body: { status: 'ok' } }) } } as unknown as HandlerSet
    const others = contracts.filter((c) => c !== platformContract)
    const h = await testApp({ contracts, handlerSets: [health, ...others.map(unreachableHandlers)], publicEndpoints: publicEndpoints as PublicEndpoint[], config: { requireHttps: true, TRUST_PROXY: 1 } })
    try {
      const probe = await h.fastify.inject({ method: 'GET', url: '/v1/health' })
      expect(probe.statusCode).toBe(200)
      expect(probe.headers['strict-transport-security']).toContain('max-age=')
      // Exactly one entry is a probe: every other entry over plain HTTP is 403, before its handler.
      const probes = entries.filter(({ entry }) => entry.meta.probe)
      expect(probes.map((p) => p.id)).toEqual(['platform.health'])
      for (const { entry } of entries.filter(({ entry }) => !entry.meta.probe)) {
        const res = await h.fastify.inject({ method: entry.method, url: url(entry, entry.query ? '?q=pa' : '') })
        expect(res.statusCode, `${entry.method} ${entry.path}`).toBe(403)
        expect(res.headers['strict-transport-security']).toContain('max-age=')
      }
      // And with X-Forwarded-Proto from a trusted proxy the same entries pass the HTTPS check (a proxied request).
      const proxied = await h.fastify.inject({ method: 'GET', url: '/v1/localities?q=pa', headers: { 'x-forwarded-proto': 'https' } })
      expect(proxied.statusCode).not.toBe(403)
    } finally {
      await h.close()
    }
  })
})
