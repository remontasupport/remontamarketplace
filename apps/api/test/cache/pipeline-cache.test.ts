// The pipeline's private-cache step and the memo (U2, R8.1-R8.3, property G8), through
// the real app with a synthetic role-restricted GET.
import { defineContract, meta } from '@remonta/api-contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as z from 'zod'
import { ResponseMemo } from '../../src/platform/cache/response-memo'
import { testApp, type TestApp } from '../helpers'

const cached = defineContract('testCached', {
  things: {
    method: 'GET',
    path: '/v1/test/things',
    summary: 'test only',
    query: z.strictObject({ q: z.string().max(20).optional(), n: z.coerce.number().int().min(1).default(1) }),
    responses: { 200: z.strictObject({ q: z.string().nullable(), n: z.number(), calls: z.number() }) },
    meta: meta({ access: { roles: ['ADMIN'] }, bot: 'none', rateLimit: [{ per: 'ip', limit: 1000, window: '1m' }], maxBodyKb: 1, privateCacheSeconds: 60 }),
  },
  plain: {
    method: 'GET',
    path: '/v1/test/plain',
    summary: 'test only',
    responses: { 200: z.strictObject({ calls: z.number() }) },
    meta: meta({ access: { roles: ['ADMIN'] }, bot: 'none', rateLimit: [{ per: 'ip', limit: 1000, window: '1m' }], maxBodyKb: 1 }),
  },
})

let t: TestApp
let calls = 0
let now = 0
const memo = new ResponseMemo({ maxEntries: 10, ttlMs: 60_000, clock: () => new Date(now) })

beforeAll(async () => {
  t = await testApp({
    contracts: [cached],
    handlerSets: [
      {
        contract: cached,
        handlers: {
          things: async (req) => {
            calls++
            const q = (req.query as { q?: string; n: number }) ?? { n: 1 }
            return { status: 200, body: { q: q.q ?? null, n: q.n, calls } }
          },
          plain: async () => {
            calls++
            return { status: 200, body: { calls } }
          },
        },
      },
    ],
    memo: { store: memo, entries: new Set(['testCached.things']) },
  })
})
afterAll(() => t.close())

const admin = { 'x-test-principal': 'admin_1:ADMIN' }
const get = (url: string, headers: Record<string, string> = {}) => t.fastify.inject({ method: 'GET', url, headers: { ...admin, ...headers } })

describe('privateCacheSeconds', () => {
  it('sets ETag, Cache-Control: private and Vary: Authorization on a 200 (R8.1)', async () => {
    const res = await get('/v1/test/things?q=a')
    expect(res.statusCode).toBe(200)
    expect(res.headers['cache-control']).toBe('private, max-age=60')
    expect(res.headers['vary']).toBe('Authorization')
    expect(String(res.headers['etag'])).toMatch(/^"sha256-[A-Za-z0-9_-]+"$/)
  })

  it('answers 304 with no body to a matching If-None-Match, with the same headers (R8.2, G8)', async () => {
    const first = await get('/v1/test/things?q=b')
    const etag = String(first.headers['etag'])
    const again = await get('/v1/test/things?q=b', { 'if-none-match': etag })
    expect(again.statusCode).toBe(304)
    expect(again.body).toBe('')
    expect(again.headers['etag']).toBe(etag)
    expect(again.headers['cache-control']).toBe('private, max-age=60')
    const other = await get('/v1/test/things?q=b', { 'if-none-match': '"sha256-nope"' })
    expect(other.statusCode).toBe(200)
  })

  it('equal bodies give equal ETags; a different body a different one (G8)', async () => {
    const a = await get('/v1/test/things?q=same')
    const b = await get('/v1/test/things?q=same') // memo hit: the same body
    const c = await get('/v1/test/things?q=other')
    expect(a.headers['etag']).toBe(b.headers['etag'])
    expect(a.headers['etag']).not.toBe(c.headers['etag'])
  })

  it('puts no cache headers on an error', async () => {
    const res = await get('/v1/test/things?q=' + 'x'.repeat(21))
    expect(res.statusCode).toBe(400)
    expect(res.headers['etag']).toBeUndefined()
    expect(res.headers['cache-control']).toBe('no-store')
    const unauth = await t.fastify.inject({ method: 'GET', url: '/v1/test/things' })
    expect(unauth.statusCode).toBe(401)
    expect(unauth.headers['etag']).toBeUndefined()
  })
})

describe('the memo', () => {
  it('serves a repeat of the same canonical query without the handler; the key ignores parameter order (R8.3)', async () => {
    const before = calls
    const a = await get('/v1/test/things?q=memo&n=2')
    const b = await get('/v1/test/things?n=2&q=memo')
    expect(calls).toBe(before + 1)
    expect(a.json()).toEqual(b.json())
  })

  it('Cache-Control: no-cache bypasses the memo and refills it', async () => {
    const before = calls
    await get('/v1/test/things?q=fresh')
    const fresh = await get('/v1/test/things?q=fresh', { 'cache-control': 'no-cache' })
    expect(calls).toBe(before + 2)
    const after = await get('/v1/test/things?q=fresh')
    expect(after.json()).toEqual(fresh.json())
    expect(calls).toBe(before + 2)
  })

  it('forgets after the window', async () => {
    const before = calls
    await get('/v1/test/things?q=ttl')
    now += 60_000
    await get('/v1/test/things?q=ttl')
    expect(calls).toBe(before + 2)
  })

  it('does not touch entries that are not bound to it', async () => {
    const before = calls
    await get('/v1/test/plain')
    await get('/v1/test/plain')
    expect(calls).toBe(before + 2)
    const res = await get('/v1/test/plain')
    expect(res.headers['cache-control']).toBe('no-store')
  })
})
