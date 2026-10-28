// search-locations U1: the two search entries read the query strings the app's Next routes read (FR-5, E1, E2).
import { describe, expect, it } from 'vitest'
import publicEndpoints from '../public-endpoints.json'
import {
  CLIENT_DEFAULT_WITHIN_KM,
  clientWorkerQuerySchema,
  PUBLIC_DEFAULT_WITHIN_KM,
  publicWorkerQuerySchema,
  searchContract,
} from '../src'

describe('the client search query (E1)', () => {
  it('has the route defaults', () => {
    expect(clientWorkerQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20, within: CLIENT_DEFAULT_WITHIN_KM })
  })

  it('treats empty text as absent and trims it', () => {
    const q = clientWorkerQuerySchema.parse({ search: '   ', location: '  Parramatta,  NSW 2150 ' })
    expect(q.search).toBeUndefined()
    expect(q.location).toBe('Parramatta, NSW 2150')
  })

  it('splits services on commas, dropping empties and repeats', () => {
    expect(clientWorkerQuerySchema.parse({ services: 'Support Worker, ,Nursing Services,Support Worker' }).services).toEqual(['Support Worker', 'Nursing Services'])
  })

  it('bounds the page size and the radius', () => {
    expect(clientWorkerQuerySchema.safeParse({ pageSize: '51' }).success).toBe(false)
    expect(clientWorkerQuerySchema.safeParse({ within: '501' }).success).toBe(false)
    expect(clientWorkerQuerySchema.safeParse({ location: 'x'.repeat(121) }).success).toBe(false)
  })
})

describe('the public search query (E2)', () => {
  it('reads within as km, `none` or absent (any distance)', () => {
    expect(publicWorkerQuerySchema.parse({}).within).toBe(PUBLIC_DEFAULT_WITHIN_KM)
    expect(publicWorkerQuerySchema.parse({ within: 'none' }).within).toBe(PUBLIC_DEFAULT_WITHIN_KM)
    expect(publicWorkerQuerySchema.parse({ within: '20' }).within).toBe(20)
    expect(publicWorkerQuerySchema.parse({}).pageSize).toBe(12)
  })

  it('refuses parameters the route never read', () => {
    expect(publicWorkerQuerySchema.safeParse({ search: 'nurse' }).success).toBe(false)
  })
})

describe('the entries', () => {
  it('the client search is for clients and coordinators, privately cached', () => {
    const m = searchContract.entries.searchWorkersForClient.meta
    expect(m.access).toEqual({ roles: ['CLIENT', 'COORDINATOR'] })
    expect(m.privateCacheSeconds).toBe(60)
  })

  it('the public search is public, listed, and shared-cacheable', () => {
    const m = searchContract.entries.searchPublicWorkers.meta
    expect(m.access).toBe('public')
    expect(m.cacheSeconds).toBe(60)
    expect(publicEndpoints.some((p) => p.route === 'GET /v1/public/workers')).toBe(true)
  })
})
