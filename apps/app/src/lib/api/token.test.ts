// The token source (U1 C12): the retry table of R5.3/R5.4 (S3), the shared in-flight
// fetch (R5.2), invalidate (R5.5), and property P5 as a model-based test: over any
// sequence of getToken / invalidate / clock advances the source never hands out a
// token with less than 60 s of life, and it fetches exactly once per expiry or
// invalidation.
import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import { createTokenSource, RENEW_BEFORE_S, Unauthenticated, Unavailable } from './token'

type Reply = { status: number; body?: unknown; retryAfter?: string } | 'network'

function fakeFetch(replies: Reply[], onCall?: () => void) {
  let calls = 0
  const fetch = async (): Promise<Response> => {
    calls++
    onCall?.()
    const r = replies.shift() ?? { status: 500 }
    if (r === 'network') throw new TypeError('failed to fetch')
    const headers = new Headers()
    if (r.retryAfter !== undefined) headers.set('retry-after', r.retryAfter)
    return new Response(r.body === undefined ? '' : JSON.stringify(r.body), { status: r.status, headers })
  }
  return { fetch: fetch as unknown as typeof globalThis.fetch, calls: () => calls }
}

const tokenBody = (nowMs: number, ttlS = 300) => ({ token: `t${nowMs}`, expiresAt: new Date(nowMs + ttlS * 1000).toISOString() })

describe('createTokenSource', () => {
  it('returns the cached token while more than 60 s remain, then renews once (R5.1)', async () => {
    let nowMs = 1_000_000
    const f = fakeFetch([{ status: 200, body: tokenBody(nowMs) }, { status: 200, body: { token: 'second', expiresAt: new Date(nowMs + 600_000).toISOString() } }])
    const src = createTokenSource({ fetch: f.fetch, now: () => nowMs, sleep: async () => {} })
    expect(await src.getToken()).toBe(`t${nowMs}`)
    nowMs += (300 - RENEW_BEFORE_S - 1) * 1000
    expect(await src.getToken()).toBe(`t${1_000_000}`)
    expect(f.calls()).toBe(1)
    nowMs += 2000
    expect(await src.getToken()).toBe('second')
    expect(f.calls()).toBe(2)
  })

  it('shares one in-flight fetch between concurrent callers (R5.2)', async () => {
    const f = fakeFetch([{ status: 200, body: tokenBody(0) }])
    const src = createTokenSource({ fetch: f.fetch, now: () => 0, sleep: async () => {} })
    const [a, b, c] = await Promise.all([src.getToken(), src.getToken(), src.getToken()])
    expect(a).toBe(b)
    expect(b).toBe(c)
    expect(f.calls()).toBe(1)
  })

  it('a 401 clears and throws Unauthenticated at once (R5.3, S3)', async () => {
    const f = fakeFetch([{ status: 401, body: { error: 'unauthenticated' } }])
    const src = createTokenSource({ fetch: f.fetch, now: () => 0, sleep: async () => {} })
    await expect(src.getToken()).rejects.toBeInstanceOf(Unauthenticated)
    expect(f.calls()).toBe(1)
  })

  it('a 429 waits Retry-After (capped at 10 s) once and retries (R5.4)', async () => {
    const waits: number[] = []
    const f = fakeFetch([{ status: 429, retryAfter: '30' }, { status: 200, body: tokenBody(0) }])
    const src = createTokenSource({ fetch: f.fetch, now: () => 0, sleep: async (ms) => void waits.push(ms) })
    expect(await src.getToken()).toBe('t0')
    expect(waits).toEqual([10_000])
    expect(f.calls()).toBe(2)
  })

  it('a 5xx or a network failure waits 1 s once; a second failure is Unavailable (R5.4)', async () => {
    const waits: number[] = []
    const f = fakeFetch(['network', { status: 503 }])
    const src = createTokenSource({ fetch: f.fetch, now: () => 0, sleep: async (ms) => void waits.push(ms) })
    await expect(src.getToken()).rejects.toBeInstanceOf(Unavailable)
    expect(waits).toEqual([1000])
    expect(f.calls()).toBe(2)
    const g = fakeFetch([{ status: 500 }, { status: 200, body: tokenBody(0) }])
    const src2 = createTokenSource({ fetch: g.fetch, now: () => 0, sleep: async () => {} })
    expect(await src2.getToken()).toBe('t0')
  })

  it('a malformed 200 body counts as a failure, never as a token', async () => {
    const f = fakeFetch([{ status: 200, body: { nope: true } }, { status: 200, body: 'not an object' }])
    const src = createTokenSource({ fetch: f.fetch, now: () => 0, sleep: async () => {} })
    await expect(src.getToken()).rejects.toBeInstanceOf(Unavailable)
  })

  it('invalidate drops the token but not an in-flight fetch (R5.5)', async () => {
    let release: (() => void) | undefined
    const gate = new Promise<void>((r) => (release = r))
    let calls = 0
    const fetch = (async () => {
      calls++
      await gate
      return new Response(JSON.stringify(tokenBody(0)), { status: 200 })
    }) as unknown as typeof globalThis.fetch
    const src = createTokenSource({ fetch, now: () => 0, sleep: async () => {} })
    const p = src.getToken()
    src.invalidate()
    release?.()
    expect(await p).toBe('t0')
    expect(calls).toBe(1)
    src.invalidate()
    void src.getToken()
    expect(calls).toBe(2)
  })

  it('P5: never a token with < 60 s of life; fetches = expiries + invalidations (model-based)', async () => {
    type Cmd = { kind: 'get' } | { kind: 'invalidate' } | { kind: 'advance'; s: number }
    const cmd = fc.oneof(
      fc.constant<Cmd>({ kind: 'get' }),
      fc.constant<Cmd>({ kind: 'invalidate' }),
      fc.record({ kind: fc.constant('advance' as const), s: fc.integer({ min: 1, max: 400 }) }),
    )
    await fc.assert(
      fc.asyncProperty(fc.array(cmd, { minLength: 1, maxLength: 40 }), async (cmds) => {
        let nowMs = 0
        let fetches = 0
        const fetch = (async () => {
          fetches++
          return new Response(JSON.stringify(tokenBody(nowMs)), { status: 200 })
        }) as unknown as typeof globalThis.fetch
        const src = createTokenSource({ fetch, now: () => nowMs, sleep: async () => {} })
        // the model: the token's expiry (epoch s) and whether the cache is empty
        let modelExp: number | undefined
        let expectedFetches = 0
        for (const c of cmds) {
          if (c.kind === 'advance') nowMs += c.s * 1000
          else if (c.kind === 'invalidate') {
            src.invalidate()
            modelExp = undefined
          } else {
            const t = await src.getToken()
            const issuedMs = Number(t.slice(1))
            const expS = issuedMs / 1000 + 300
            expect(expS - nowMs / 1000).toBeGreaterThan(RENEW_BEFORE_S)
            if (modelExp === undefined || modelExp - nowMs / 1000 <= RENEW_BEFORE_S) {
              expectedFetches++
              modelExp = nowMs / 1000 + 300
            }
            expect(expS).toBe(modelExp)
          }
        }
        expect(fetches).toBe(expectedFetches)
      }),
      { numRuns: 200 },
    )
  })
})
