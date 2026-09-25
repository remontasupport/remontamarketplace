import { contracts, defineContract, meta, platformContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { BootError, planBindings, verifyRoutes } from '../src/platform/contract/binder'
import { defineHandlers, type HandlerSet } from '../src/platform/contract/handlers'
import { ApiError } from '../src/platform/errors'
import { testApp, unreachableHandlers } from './helpers'

const allow = (...routes: string[]): PublicEndpoint[] => routes.map((route) => ({ route, reason: 'test entry, reviewed' }))
const open = meta({ access: 'public', bot: 'none', rateLimit: [{ per: 'ip', limit: 100, window: '1m' }], maxBodyKb: 4 })

const shaping = defineContract('testShaping', {
  echo: {
    method: 'POST',
    path: '/v1/test/echo',
    summary: 'test',
    body: { kind: 'json', schema: z.strictObject({ name: z.string().trim().toLowerCase().max(20) }) },
    responses: { 200: z.strictObject({ name: z.string() }) },
    meta: open,
  },
  leaky: { method: 'GET', path: '/v1/test/leaky', summary: 'test', responses: { 200: z.strictObject({ id: z.string() }) }, meta: open },
  wrongStatus: { method: 'GET', path: '/v1/test/wrong-status', summary: 'test', responses: { 200: z.strictObject({}) }, meta: open },
  refuses: { method: 'GET', path: '/v1/test/refuses', summary: 'test', responses: { 200: z.strictObject({}) }, meta: open },
  crashes: { method: 'GET', path: '/v1/test/crashes', summary: 'test', responses: { 200: z.strictObject({}) }, meta: open },
  audited: {
    method: 'POST',
    path: '/v1/test/audited',
    summary: 'test',
    body: { kind: 'json', schema: z.strictObject({ mode: z.enum(['forget', 'skip']) }) },
    responses: { 200: z.strictObject({}) },
    meta: { ...open, audit: 'ACCOUNT_REGISTERED' },
  },
})

const shapingHandlers = defineHandlers(shaping, {
  echo: async (req) => ({ status: 200, body: { name: req.body.name } }), // receives the normalised value
  leaky: async () => ({ status: 200, body: { id: 'u1', passwordHash: '$2b$12$...' } as never }),
  wrongStatus: async () => ({ status: 201, body: {} }) as never,
  refuses: async () => {
    throw new ApiError(409, 'internal detail: row 42 locked by txn 9')
  },
  crashes: async () => {
    throw new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2')
  },
  audited: async (req, ctx) => {
    if (req.body.mode === 'skip') ctx.audit.skip('no change')
    return { status: 200, body: {} }
  },
})

async function shapingApp() {
  const routes = Object.values(shaping.entries).map((e) => `${e.method} ${e.path}`)
  return testApp({ contracts: [shaping], handlerSets: [shapingHandlers as unknown as HandlerSet], publicEndpoints: allow(...routes) })
}

describe('steps 8-11 once a request is through', () => {
  it('hands the handler the validated, normalised body', async () => {
    const t = await shapingApp()
    const res = await t.fastify.inject({ method: 'POST', url: '/v1/test/echo', payload: { name: '  ALICE ' } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ name: 'alice' })
    await t.close()
  })

  it('never sends a field the contract does not declare (P10): 500, not a leak', async () => {
    const t = await shapingApp()
    const res = await t.fastify.inject({ method: 'GET', url: '/v1/test/leaky' })
    expect(res.statusCode).toBe(500)
    expect(res.body).not.toContain('passwordHash')
    await t.close()
  })

  it('refuses a status the contract does not declare', async () => {
    const t = await shapingApp()
    expect((await t.fastify.inject({ method: 'GET', url: '/v1/test/wrong-status' })).statusCode).toBe(500)
    await t.close()
  })

  it('maps a thrown ApiError to its status with the generic message only', async () => {
    const t = await shapingApp()
    const res = await t.fastify.inject({ method: 'GET', url: '/v1/test/refuses' })
    expect(res.statusCode).toBe(409)
    expect(res.json().error.message).toBe('That conflicts with the current state.')
    expect(res.body).not.toContain('row 42')
    await t.close()
  })

  it('turns an unexpected error into a bare 500: no message, no stack, no secrets', async () => {
    const t = await shapingApp()
    const res = await t.fastify.inject({ method: 'GET', url: '/v1/test/crashes' })
    expect(res.statusCode).toBe(500)
    expect(res.json()).toEqual({ error: { code: 'INTERNAL', message: 'Something went wrong.', requestId: res.headers['x-request-id'] } })
    await t.close()
  })

  it('refuses a success that neither recorded nor skipped its declared audit', async () => {
    const t = await shapingApp()
    expect((await t.fastify.inject({ method: 'POST', url: '/v1/test/audited', payload: { mode: 'forget' } })).statusCode).toBe(500)
    expect((await t.fastify.inject({ method: 'POST', url: '/v1/test/audited', payload: { mode: 'skip' } })).statusCode).toBe(200)
    await t.close()
  })

  it('rejects malformed JSON as a 400 in the error shape', async () => {
    const t = await shapingApp()
    const res = await t.fastify.inject({ method: 'POST', url: '/v1/test/echo', headers: { 'content-type': 'application/json' }, payload: '{"name":' })
    expect(res.statusCode).toBe(400)
    expect(res.json().error.code).toBe('INVALID_REQUEST')
    await t.close()
  })

  it('keys rate limits by entry, rule and caller', async () => {
    const t = await shapingApp()
    await t.fastify.inject({ method: 'POST', url: '/v1/test/echo', payload: { name: 'a' } })
    expect(t.rateLimiter.keys.at(-1)).toBe('testShaping.echo:ip:127.0.0.1:100/1m')
    await t.close()
  })
})

describe('the service refuses to boot', () => {
  it('when a contract entry has no handler -- exactly today, until step 7 binds registration', () => {
    const run = () =>
      planBindings({ contracts, handlerSets: [unreachableHandlers(platformContract)], publicEndpoints: publicEndpoints as PublicEndpoint[] })
    expect(run).toThrow(BootError)
    expect(run).toThrow(/registration\.submitWorkerRegistration: no handler/)
  })

  it('when a handler has no contract entry', () => {
    const set = { contract: platformContract, handlers: { health: async () => ({}), debugDump: async () => ({}) } } as unknown as HandlerSet
    expect(() => planBindings({ contracts: [platformContract], handlerSets: [set], publicEndpoints: allow('GET /v1/health') })).toThrow(/debugDump: handler with no contract entry/)
  })

  it('when handlers are bound twice or for a contract that is not served', () => {
    const set = unreachableHandlers(platformContract)
    expect(() => planBindings({ contracts: [platformContract], handlerSets: [set, set], publicEndpoints: allow('GET /v1/health') })).toThrow(/bound twice/)
    expect(() => planBindings({ contracts: [], handlerSets: [set], publicEndpoints: [] })).toThrow(/not served/)
  })

  it('when a public entry is not on the reviewed allow-list', () => {
    expect(() => planBindings({ contracts: [platformContract], handlerSets: [unreachableHandlers(platformContract)], publicEndpoints: [] })).toThrow(/public but not on public-endpoints\.json/)
  })

  it('when a route exists that no contract declares', () => {
    expect(() => verifyRoutes([{ method: 'GET', url: '/v1/health' }, { method: 'GET', url: '/debug/vars' }], [platformContract])).toThrow(/GET \/debug\/vars: route not declared/)
    expect(() => verifyRoutes([{ method: 'GET', url: '/v1/health' }, { method: 'OPTIONS', url: '*' }], [platformContract])).not.toThrow()
  })

  it('and createApp itself refuses before listening', async () => {
    await expect(testApp({ contracts, handlerSets: [unreachableHandlers(platformContract)], publicEndpoints: publicEndpoints as PublicEndpoint[] })).rejects.toThrow(BootError)
  })
})
