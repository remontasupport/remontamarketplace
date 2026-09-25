import { describe, expect, it } from 'vitest'
import { createClient, registrationContract, REGISTRATION_ACCEPTED_MESSAGE } from '../src/index'

function fakeFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const calls: { url: string; init: RequestInit }[] = []
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
  }) as unknown as typeof fetch
  return { fn, calls }
}

describe('createClient', () => {
  it('builds the request from the contract and returns the typed success', async () => {
    const f = fakeFetch(200, { localities: [{ id: 7, suburb: 'Parramatta', state: 'NSW', postcode: '2150', label: 'Parramatta NSW 2150' }] })
    const api = createClient(registrationContract, { baseUrl: 'https://api.example/', fetch: f.fn })
    const r = await api.searchLocalities({ query: { q: 'parra matta' } })
    expect(f.calls[0]?.url).toBe('https://api.example/v1/localities?q=parra+matta')
    expect(f.calls[0]?.init.method).toBe('GET')
    expect(r.ok && r.status === 200 && r.body.localities[0]?.label).toBe('Parramatta NSW 2150')
  })

  it('sends JSON bodies as JSON', async () => {
    const f = fakeFetch(202, { status: 'accepted', message: REGISTRATION_ACCEPTED_MESSAGE })
    const api = createClient(registrationContract, { baseUrl: 'https://api.example', fetch: f.fn })
    const r = await api.submitWorkerRegistration({ body: { x: 1 } as never })
    expect(f.calls[0]?.init.method).toBe('POST')
    expect((f.calls[0]?.init.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect(f.calls[0]?.init.body).toBe('{"x":1}')
    expect(r.ok).toBe(true)
  })

  it('returns contract errors as data, not exceptions', async () => {
    const f = fakeFetch(429, { error: { code: 'RATE_LIMITED', message: 'Too many requests', requestId: 'req-1' } })
    const api = createClient(registrationContract, { baseUrl: 'https://api.example', fetch: f.fn })
    const r = await api.searchLocalities({ query: { q: 'pa' } })
    expect(r).toEqual({ ok: false, status: 429, body: { error: { code: 'RATE_LIMITED', message: 'Too many requests', requestId: 'req-1' } } })
  })

  it('passes Retry-After through on a refusal, so the caller can wait that long', async () => {
    const f = fakeFetch(503, { error: { code: 'UNAVAILABLE', message: 'm', requestId: 'r' } }, { 'retry-after': '2' })
    const api = createClient(registrationContract, { baseUrl: 'https://api.example', fetch: f.fn })
    expect(await api.searchLocalities({ query: { q: 'pa' } })).toMatchObject({ ok: false, status: 503, retryAfterSeconds: 2 })
  })

  it('fails loudly when a success response drifts from the contract', async () => {
    const f = fakeFetch(202, { status: 'accepted', message: 'Please verify your email' }) // the old, false text
    const api = createClient(registrationContract, { baseUrl: 'https://api.example', fetch: f.fn })
    await expect(api.submitWorkerRegistration({ body: {} as never })).rejects.toThrow(/does not match the contract/)
  })

  it('does not trust an unexpected error body', async () => {
    const f = fakeFetch(500, { stack: 'Error at ...' })
    const api = createClient(registrationContract, { baseUrl: 'https://api.example', fetch: f.fn })
    expect(await api.searchLocalities({ query: { q: 'pa' } })).toEqual({ ok: false, status: 500, body: null })
  })
})
