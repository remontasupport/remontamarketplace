// The browser's source of api tokens (U1 api-identity, C12: L4, R5.1-R5.5, R5.7).
// One per page load, in memory only. It asks this app's own route for a token,
// keeps it while more than a minute of life remains, shares one fetch between
// concurrent callers, and turns the route's answers into two typed errors the
// admin client maps to outcomes. No React, no storage, no timers between calls.

export const TOKEN_ROUTE = '/api/auth/api-token'
/** A token is renewed when fewer than this many seconds remain (R5.1). */
export const RENEW_BEFORE_S = 60
/** A 429 from the route is waited out at most this long before the one retry (R5.4). */
export const MAX_RETRY_AFTER_S = 10

/** The route answered 401: no session, a suspended account or a changed role (R5.3). */
export class Unauthenticated extends Error {
  constructor() {
    super('unauthenticated')
    this.name = 'Unauthenticated'
  }
}

/** The route could not answer after one retry (R5.4). */
export class Unavailable extends Error {
  constructor() {
    super('unavailable')
    this.name = 'Unavailable'
  }
}

export interface TokenSource {
  getToken(): Promise<string>
  /** Drops the cached token; an in-flight fetch continues (R5.5). */
  invalidate(): void
}

export interface TokenSourceDeps {
  fetch?: typeof globalThis.fetch
  /** Epoch milliseconds. */
  now?: () => number
  sleep?: (ms: number) => Promise<void>
  url?: string
}

interface Attempt {
  status: number
  body: { token?: unknown; expiresAt?: unknown } | null
  retryAfterS?: number
}

export function createTokenSource(deps: TokenSourceDeps = {}): TokenSource {
  const doFetch = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))
  const now = deps.now ?? (() => Date.now())
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
  const url = deps.url ?? TOKEN_ROUTE

  let token: string | undefined
  let expiresAt: number | undefined // epoch seconds
  let inflight: Promise<string> | undefined

  async function attempt(): Promise<Attempt> {
    try {
      const res = await doFetch(url, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } })
      const body = (await res.json().catch(() => null)) as Attempt['body']
      const header = res.headers.get('retry-after')
      const retryAfter = header === null ? NaN : Number(header)
      return { status: res.status, body, retryAfterS: Number.isFinite(retryAfter) && retryAfter >= 0 ? retryAfter : undefined }
    } catch {
      return { status: 0, body: null } // network failure: treated like a 5xx (R5.4)
    }
  }

  function accept(a: Attempt): string | undefined {
    if (a.status !== 200 || !a.body || typeof a.body.token !== 'string' || typeof a.body.expiresAt !== 'string') return undefined
    const exp = Date.parse(a.body.expiresAt)
    if (!Number.isFinite(exp)) return undefined
    token = a.body.token
    expiresAt = Math.floor(exp / 1000)
    return token
  }

  function clear(): void {
    token = undefined
    expiresAt = undefined
  }

  async function fetchToken(): Promise<string> {
    const first = await attempt()
    const got = accept(first)
    if (got !== undefined) return got
    if (first.status === 401) {
      clear()
      throw new Unauthenticated()
    }
    // One wait, one retry: Retry-After (capped) on a 429, a second on anything else.
    const waitS = first.status === 429 ? Math.min(first.retryAfterS ?? 1, MAX_RETRY_AFTER_S) : 1
    await sleep(waitS * 1000)
    const second = await attempt()
    const again = accept(second)
    if (again !== undefined) return again
    clear()
    if (second.status === 401) throw new Unauthenticated()
    throw new Unavailable()
  }

  return {
    getToken() {
      if (token !== undefined && expiresAt !== undefined && expiresAt - now() / 1000 > RENEW_BEFORE_S) return Promise.resolve(token)
      if (inflight) return inflight
      inflight = fetchToken().finally(() => {
        inflight = undefined
      })
      return inflight
    },
    invalidate() {
      clear()
    },
  }
}
