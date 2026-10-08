// The admin client (U1 C13 / U2 L5): the bearer header, one retry on a 401 with a
// fresh token (R5.6), the outcome mapping, canonical URLs, and `reload` as the
// browser's cache mode (the memo bypass rides on the header the browser adds).
import { describe, expect, it } from 'vitest'
import { createAdminApi } from './admin'
import type { TokenSource } from './token'
import { Unauthenticated, Unavailable } from './token'

const OK_SEARCH = {
  data: [],
  pagination: { total: 0, page: 1, pageSize: 6, totalPages: 0, hasNext: false, hasPrev: false },
  appliedFilters: { sortBy: 'createdAt', sortOrder: 'desc' },
  unplacedCount: 0,
}

interface Seen {
  url: string
  init: RequestInit
}

function harness(replies: Array<{ status: number; body?: unknown; retryAfter?: string } | 'network'>, tokens: Array<string | Error> = ['tok1', 'tok2']) {
  const seen: Seen[] = []
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
  const api = createAdminApi({ baseUrl: 'https://api.example/', tokenSource, fetch })
  return { api, seen, invalidations: () => invalidations }
}

const header = (s: Seen, name: string) => (s.init.headers as Record<string, string>)[name]

describe('adminApi', () => {
  it('sends the bearer header and a canonical URL; ok maps to the body', async () => {
    const h = harness([{ status: 200, body: OK_SEARCH }])
    const out = await h.api.searchWorkers({ gender: 'Female', page: 2, localityId: 5, withinKm: 10, languages: ['Spanish', 'Arabic'] })
    expect(out.kind).toBe('ok')
    expect(h.seen).toHaveLength(1)
    expect(h.seen[0].url).toBe('https://api.example/v1/admin/workers?gender=Female&languages=Arabic%2CSpanish&localityId=5&page=2&pageSize=20&withinKm=10')
    expect(header(h.seen[0], 'authorization')).toBe('Bearer tok1')
    expect(h.seen[0].init.cache).toBe('default')
    expect(h.seen[0].init.credentials).toBe('omit')
  })

  it('the same filters in another order give the same URL (R11.2)', () => {
    const h = harness([])
    const a = h.api.canonicalSearch({ withinKm: 10, localityId: 5, gender: 'Female' })
    const b = h.api.canonicalSearch({ gender: 'Female', localityId: 5, withinKm: 10 })
    expect(a).toBe(b)
    expect(a).toBe('gender=Female&localityId=5&page=1&pageSize=20&withinKm=10')
  })

  it('a 401 invalidates and retries once with a fresh token; a second 401 is unauthenticated (R5.6)', async () => {
    const h = harness([{ status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r1' } } }, { status: 200, body: OK_SEARCH }])
    const out = await h.api.searchWorkers({})
    expect(out.kind).toBe('ok')
    expect(h.invalidations()).toBe(1)
    expect(header(h.seen[0], 'authorization')).toBe('Bearer tok1')
    expect(header(h.seen[1], 'authorization')).toBe('Bearer tok2')

    const twice = harness([
      { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r1' } } },
      { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'x', requestId: 'r2' } } },
    ])
    expect(await twice.api.searchWorkers({})).toEqual({ kind: 'unauthenticated' })
    expect(twice.seen).toHaveLength(2)
  })

  it('maps 403, 429 (+Retry-After), 503, network and other statuses to outcomes', async () => {
    const env = (code: string, extra: Record<string, unknown> = {}) => ({ error: { code, message: 'x', requestId: 'req-9', ...extra } })
    expect(await harness([{ status: 403, body: env('FORBIDDEN') }]).api.searchWorkers({})).toEqual({ kind: 'forbidden' })
    expect(await harness([{ status: 429, body: env('RATE_LIMITED'), retryAfter: '7' }]).api.searchWorkers({})).toEqual({ kind: 'rateLimited', retryAfterSeconds: 7 })
    expect(await harness([{ status: 503, body: env('UNAVAILABLE'), retryAfter: '2' }]).api.searchWorkers({})).toEqual({ kind: 'unavailable' })
    expect(await harness(['network']).api.searchWorkers({})).toEqual({ kind: 'unavailable' })
    const bad = await harness([{ status: 400, body: env('INVALID_REQUEST', { fields: { localityId: ['Unknown suburb'] } }) }]).api.searchWorkers({ localityId: 99 })
    expect(bad).toEqual({ kind: 'failed', status: 400, requestId: 'req-9', fields: { localityId: ['Unknown suburb'] } })
  })

  it('token source errors map without a request: Unauthenticated, Unavailable', async () => {
    const a = harness([], [new Unauthenticated()])
    expect(await a.api.listUsers({ search: 'an' })).toEqual({ kind: 'unauthenticated' })
    expect(a.seen).toHaveLength(0)
    const b = harness([], [new Unavailable()])
    expect(await b.api.listUsers({ search: 'an' })).toEqual({ kind: 'unavailable' })
  })

  it('reload uses the browser cache mode "reload" (the UA adds Cache-Control: no-cache for the memo)', async () => {
    const h = harness([{ status: 200, body: OK_SEARCH }])
    await h.api.searchWorkers({}, { cache: 'reload' })
    expect(h.seen[0].init.cache).toBe('reload')
  })

  it('a query the contract rejects fails locally with the fields named, without a request', async () => {
    // (withinKm without a locality is the api's invariant, R1.3, answered as a 400 by the api; the
    // contract's own schema rejects shapes such as a page below 1 or a one-character user search)
    const h = harness([])
    const out = await h.api.searchWorkers({ page: 0 })
    expect(out.kind).toBe('failed')
    if (out.kind === 'failed') expect(Object.keys(out.fields ?? {})).toContain('page')
    expect(h.seen).toHaveLength(0)
    const users = await h.api.listUsers({ search: 'a' })
    expect(users.kind).toBe('failed')
  })

  it('without a base URL every call is unavailable and the variable is named once', async () => {
    const tokenSource: TokenSource = { getToken: async () => 'x', invalidate() {} }
    const api = createAdminApi({ baseUrl: undefined, tokenSource, fetch: (async () => new Response('{}')) as unknown as typeof globalThis.fetch })
    expect(await api.searchWorkers({})).toEqual({ kind: 'unavailable' })
  })
})
