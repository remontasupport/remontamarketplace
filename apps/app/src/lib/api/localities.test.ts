import { afterEach, describe, expect, it, vi } from 'vitest'
import { localitySuggestions, suburbSuggestions } from './localities'

const PARRAMATTA = { id: 5410, suburb: 'Parramatta', state: 'NSW', postcode: '2150', label: 'Parramatta NSW 2150' }

afterEach(() => vi.unstubAllGlobals())

describe('suburb suggestions from apps/api (GET /v1/localities)', () => {
  it('asks the api and answers its rows', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ localities: [PARRAMATTA] }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetch)
    expect(await localitySuggestions('parra', 'https://api.test')).toEqual([PARRAMATTA])
    expect(String((fetch.mock.calls[0] as unknown[])[0])).toBe('https://api.test/v1/localities?q=parra')
  })

  it("the dashboards' shape: { id, name, postcode, state: { abbreviation } }", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ localities: [PARRAMATTA] }), { status: 200, headers: { 'content-type': 'application/json' } })))
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.test')
    expect(await suburbSuggestions('parra')).toEqual([{ id: 5410, name: 'Parramatta', postcode: '2150', state: { abbreviation: 'NSW' } }])
    vi.unstubAllEnvs()
  })

  it('nothing, without a call, for one character or no base URL; nothing when the api fails', async () => {
    const fetch = vi.fn(async () => new Response('{}', { status: 503 }))
    vi.stubGlobal('fetch', fetch)
    expect(await localitySuggestions('p', 'https://api.test')).toEqual([])
    expect(await localitySuggestions('parra', undefined)).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
    expect(await localitySuggestions('parra', 'https://api.test')).toEqual([])
  })
})
