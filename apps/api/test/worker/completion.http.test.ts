// GET /v1/worker/completion through the real pipeline with a fake read (onboarding-tour C1, CR-9): the contract shape,
// the private cache and ETag, ownership (404 without a profile row), access (401, 403).
import { completionViewSchema, contracts, platformContract, workerContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { afterEach, describe, expect, it } from 'vitest'
import { platformHandlers } from '../../src/modules/platform/platform.handlers'
import type { ProfileRows } from '../../src/modules/worker/persistence/profile-read'
import { workerHandlers } from '../../src/modules/worker/worker.handlers'
import type { Db } from '../../src/platform/persistence/db'
import { testApp, unreachableHandlers, workerToken, type TestApp } from '../helpers'
import { sampleRows } from './units.test'

let t: TestApp | undefined
afterEach(async () => {
  await t?.close()
  t = undefined
})

async function app() {
  const rows = new Map<string, ProfileRows>([['u_a', sampleRows()]])
  const db = {} as Db
  t = await testApp({
    contracts,
    handlerSets: [
      platformHandlers({ db, clock: () => new Date(), lastSuccessAt: () => Date.now() }),
      workerHandlers({ db, clock: () => new Date(), read: async (_db, userId) => rows.get(userId) ?? null }),
      ...contracts.filter((c) => c !== platformContract && c !== workerContract).map(unreachableHandlers),
    ],
    publicEndpoints: publicEndpoints as PublicEndpoint[],
  })
}
const get = (headers: Record<string, string> = {}) => t!.fastify.inject({ method: 'GET', url: '/v1/worker/completion', headers })

describe('GET /v1/worker/completion', () => {
  it('answers the contract shape for the signed-in worker, privately cacheable with an ETag', async () => {
    await app()
    const res = await get(workerToken('u_a'))
    expect(res.statusCode).toBe(200)
    const body = completionViewSchema.parse(res.json())
    expect(body.percent).toBe(91)
    expect(body.groups.map((g) => g.id)).toEqual(['my-profile', 'services', 'compliance'])
    expect(res.headers['cache-control']).toBe('private, max-age=60')
    expect(String(res.headers['etag'])).toMatch(/^"sha256-/)
  })
  it('an unchanged body answers 304 to If-None-Match', async () => {
    await app()
    const a = await get(workerToken('u_a'))
    const b = await get({ ...workerToken('u_a'), 'if-none-match': String(a.headers['etag']) })
    expect(b.statusCode).toBe(304)
  })
  it('a worker without a profile row is 404; no token is 401; another role is 403', async () => {
    await app()
    expect((await get(workerToken('u_none'))).statusCode).toBe(404)
    expect((await get()).statusCode).toBe(401)
    expect((await get({ 'x-test-principal': 'u_a:ADMIN' })).statusCode).toBe(403)
  })
})
