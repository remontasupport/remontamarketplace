// The worker search client and the shared token call (search-locations U2): the bearer header, a canonical URL, one
// retry on a 401 with a fresh token, the outcome mapping; and the account client still behaving the same on the
// shared call it now uses.
import { describe, expect, it } from 'vitest'
import { createAccountApi } from './account'
import { createSearchApi } from './search'
import type { TokenSource } from './token'
import { Unauthenticated } from './token'

const OK = { success: true, data: [], pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrev: false } }

function harness(replies: Array<{ status: number; body?: unknown; retryAfter?: string } | 'network'>, tokens: Array<string | Error> = ['tok1', 'tok2']) {
  const seen: { url: string; init: RequestInit }[] = []
  let invalidations = 0
  const tokenSource: TokenSource = {
    async getToken() {
      const t = tokens.shift() ?? 'tokN'
      if (t instanceof Error) throw t
      return t
    },
    invalidate() {
      invalidations++
    },
  }
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push({ url: String(input), init: init ?? {} })
    const r = replies.shift() ?? { status: 500 }
    if (r === 'network') throw new TypeError('failed to fetch')
    const headers = new Headers({ 'content-type': 'application/json' })
    if (r.retryAfter) headers.set('retry-after', r.retryAfter)
    return new Response(r.body === undefined ? 'null' : JSON.stringify(r.body), { status: r.status, headers })
  }) as unknown as typeof globalThis.fetch
  return { tokenSource, fetch, seen, invalidations: () => invalidations }
}
const bearer = (init: RequestInit) => (init.headers as Record<string, string>).authorization

describe('searchApi', () => {
  it('sends the bearer header and a canonical URL; ok maps to the body', async () => {
    const h = harness([{ status: 200, body: OK }])
    const api = createSearchApi({ baseUrl: 'https://api.example/', tokenSource: h.tokenSource, fetch: h.fetch })
    const out = await api.searchWorkersForClient({ services: 'Support Worker,Nursing Services', location: 'Parramatta, NSW 2150', search: 'cooking' })
    expect(out).toEqual({ kind: 'ok', body: OK })
    expect(h.seen[0]!.url).toBe('https://api.example/v1/client/workers?location=Parramatta%2C+NSW+2150&page=1&pageSize=20&search=cooking&services=Nursing+Services%2CSupport+Worker&within=50')
    expect(bearer(h.seen[0]!.init)).toBe('Bearer tok1')
    expect(h.seen[0]!.init.credentials).toBe('omit')
  })

  it('the same filters in another order give the same URL', async () => {
    const h = harness([{ status: 200, body: OK }, { status: 200, body: OK }])
    const api = createSearchApi({ baseUrl: 'https://api.example', tokenSource: h.tokenSource, fetch: h.fetch })
    await api.searchWorkersForClient({ services: 'B,A', page: 2 })
    await api.searchWorkersForClient({ page: 2, services: 'A,B' })
    expect(h.seen[0]!.url).toBe(h.seen[1]!.url)
  })

  it('a 401 is retried once with a fresh token, then reported', async () => {
    const h = harness([{ status: 401 }, { status: 200, body: OK }])
    const api = createSearchApi({ baseUrl: 'https://api.example', tokenSource: h.tokenSource, fetch: h.fetch })
    expect((await api.searchWorkersForClient({})).kind).toBe('ok')
    expect(h.invalidations()).toBe(1)
    expect(bearer(h.seen[1]!.init)).toBe('Bearer tok2')

    const h2 = harness([{ status: 401 }, { status: 401 }])
    const api2 = createSearchApi({ baseUrl: 'https://api.example', tokenSource: h2.tokenSource, fetch: h2.fetch })
    expect(await api2.searchWorkersForClient({})).toEqual({ kind: 'unauthenticated' })
    expect(h2.seen).toHaveLength(2)
  })

  it('maps the failures: signed out, unreachable, rate limited, no api configured, a bad query', async () => {
    const signedOut = harness([], [new Unauthenticated()])
    expect(await createSearchApi({ baseUrl: 'https://a', tokenSource: signedOut.tokenSource, fetch: signedOut.fetch }).searchWorkersForClient({})).toEqual({ kind: 'unauthenticated' })
    const down = harness(['network'])
    expect(await createSearchApi({ baseUrl: 'https://a', tokenSource: down.tokenSource, fetch: down.fetch }).searchWorkersForClient({})).toEqual({ kind: 'unavailable' })
    const limited = harness([{ status: 429, retryAfter: '7' }])
    expect(await createSearchApi({ baseUrl: 'https://a', tokenSource: limited.tokenSource, fetch: limited.fetch }).searchWorkersForClient({})).toEqual({ kind: 'rateLimited', retryAfterSeconds: 7 })
    const none = harness([])
    expect(await createSearchApi({ baseUrl: undefined, tokenSource: none.tokenSource, fetch: none.fetch }).searchWorkersForClient({})).toEqual({ kind: 'unavailable' })
    expect(none.seen).toHaveLength(0)
    expect((await createSearchApi({ baseUrl: 'https://a', tokenSource: none.tokenSource, fetch: none.fetch }).searchWorkersForClient({ pageSize: 500 })).kind).toBe('failed')
    expect(none.seen).toHaveLength(0)
  })
})

describe('accountApi on the shared call', () => {
  it('sends the body with the bearer header, retries a 401 once, never caches', async () => {
    const h = harness([{ status: 401 }, { status: 200, body: { email: 'a@b.co' } }])
    const api = createAccountApi({ baseUrl: 'https://api.example', tokenSource: h.tokenSource, fetch: h.fetch })
    expect(await api.putEmail({ email: 'a@b.co', currentPassword: 'x' } as never)).toEqual({ kind: 'ok', body: { email: 'a@b.co' } })
    expect(h.invalidations()).toBe(1)
    expect(h.seen[1]!.init.method).toBe('PUT')
    expect(h.seen[1]!.init.cache).toBe('no-store')
  })
})
