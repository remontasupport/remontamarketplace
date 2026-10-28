// Who may call the two searches, through the real pipeline (search-locations U1): the client search needs a CLIENT
// or COORDINATOR; a bad query is a 400 before any statement. No database: the handlers never run.
import { searchContract } from '@remonta/api-contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { searchHandlers } from '../../src/modules/search/search.handlers'
import { testApp, type TestApp } from '../helpers'

describe('the search entries through the pipeline', () => {
  let t: TestApp
  beforeAll(async () => {
    t = await testApp({ contracts: [searchContract], handlerSets: [searchHandlers({ db: {} as never, clock: () => new Date() })], publicEndpoints: [{ route: 'GET /v1/public/workers', reason: 'The marketing site worker list, public cards only (test).' }] })
  })
  afterAll(async () => {
    await t.close()
  })
  const get = (url: string, headers: Record<string, string> = {}) => t.fastify.inject({ method: 'GET', url, headers })

  it('the client search: 401 without a caller, 403 for a worker or an admin', async () => {
    expect((await get('/v1/client/workers')).statusCode).toBe(401)
    expect((await get('/v1/client/workers', { 'x-test-principal': 'u_w:WORKER' })).statusCode).toBe(403)
    expect((await get('/v1/client/workers', { 'x-test-principal': 'u_a:ADMIN' })).statusCode).toBe(403)
  })

  it('a bad query is refused before the handler', async () => {
    expect((await get('/v1/client/workers?within=9999', { 'x-test-principal': 'u_c:COORDINATOR' })).statusCode).toBe(400)
    expect((await get('/v1/public/workers?pageSize=500')).statusCode).toBe(400)
  })
})
