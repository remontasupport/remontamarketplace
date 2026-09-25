import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { RecaptchaV3Verifier } from '../src/platform/captcha/captcha'
import { SafeHttpClient } from '../src/platform/http/safe-http-client'

function fakeFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: string[] = []
  const fn = (async (url: URL | string, init: RequestInit) => {
    calls.push(String(url))
    return respond(String(url), init)
  }) as unknown as typeof fetch
  return { fn, calls }
}
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })

describe('SafeHttpClient', () => {
  const schema = z.object({ ok: z.boolean() })

  it.each([
    ['plain http', 'http://api.resend.com/x'],
    ['a host not on the allow-list', 'https://169.254.169.254/latest/meta-data'],
    ['a look-alike host', 'https://api.resend.com.evil.example/x'],
    ['credentials in the URL', 'https://user:pass@api.resend.com/x'],
    ['a non-standard port', 'https://api.resend.com:8443/x'],
    ['not a URL', 'api.resend.com/x'],
  ])('blocks %s without sending anything', async (_label, url) => {
    const f = fakeFetch(() => json({ ok: true }))
    const c = new SafeHttpClient({ allowedHosts: ['api.resend.com'], fetch: f.fn })
    const r = await c.request({ method: 'GET', url, schema })
    expect(r).toMatchObject({ ok: false, error: { kind: 'blocked' } })
    expect(f.calls).toEqual([])
  })

  it('does not follow redirects', async () => {
    const f = fakeFetch((_u, init) => {
      expect(init.redirect).toBe('manual')
      return new Response(null, { status: 302, headers: { location: 'https://evil.example/' } })
    })
    const r = await new SafeHttpClient({ allowedHosts: ['api.resend.com'], fetch: f.fn }).request({ method: 'GET', url: 'https://api.resend.com/x', schema })
    expect(r).toEqual({ ok: false, error: { kind: 'status', status: 302 } })
  })

  it('times out', async () => {
    const f = fakeFetch((_u, init) => new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('t'), { name: 'TimeoutError' })))))
    const r = await new SafeHttpClient({ allowedHosts: ['api.resend.com'], fetch: f.fn }).request({ method: 'GET', url: 'https://api.resend.com/x', schema, timeoutMs: 20 })
    expect(r).toEqual({ ok: false, error: { kind: 'timeout' } })
  })

  it('bounds the response size, declared or streamed', async () => {
    const c = (resp: Response) => new SafeHttpClient({ allowedHosts: ['api.resend.com'], fetch: fakeFetch(() => resp).fn, maxResponseBytes: 100 })
    expect(await c(json({ ok: true }, 200, { 'content-length': '5000' })).request({ method: 'GET', url: 'https://api.resend.com/x', schema })).toMatchObject({ error: { kind: 'too-large' } })
    expect(await c(new Response('x'.repeat(500))).request({ method: 'GET', url: 'https://api.resend.com/x', schema })).toMatchObject({ error: { kind: 'too-large' } })
  })

  it('validates the response with its schema', async () => {
    const c = new SafeHttpClient({ allowedHosts: ['api.resend.com'], fetch: fakeFetch(() => json({ ok: 'yes' })).fn })
    expect(await c.request({ method: 'GET', url: 'https://api.resend.com/x', schema })).toMatchObject({ ok: false, error: { kind: 'invalid-response' } })
    const good = new SafeHttpClient({ allowedHosts: ['API.Resend.com'], fetch: fakeFetch(() => json({ ok: true, extra: 1 })).fn })
    expect(await good.request({ method: 'GET', url: 'https://api.resend.com/x', schema })).toEqual({ ok: true, status: 200, data: { ok: true } })
  })

  it('reports a network failure as data', async () => {
    const c = new SafeHttpClient({ allowedHosts: ['api.resend.com'], fetch: fakeFetch(() => Promise.reject(new TypeError('fetch failed'))).fn })
    expect(await c.request({ method: 'GET', url: 'https://api.resend.com/x' })).toEqual({ ok: false, error: { kind: 'network', message: 'fetch failed' } })
  })
})

describe('RecaptchaV3Verifier (fails closed)', () => {
  const verifier = (respond: () => Response | Promise<Response>) => {
    const f = fakeFetch(respond)
    const v = new RecaptchaV3Verifier(new SafeHttpClient({ allowedHosts: ['www.google.com'], fetch: f.fn }), {
      secret: 'secret',
      allowedHostnames: ['localhost'],
      minScore: 0.5,
    })
    return { v, calls: f.calls }
  }
  const good = { success: true, score: 0.9, action: 'worker_register', hostname: 'localhost' }

  it('passes a good token', async () => {
    expect(await verifier(() => json(good)).v.verify('tok', 'worker_register', '1.2.3.4')).toEqual({ ok: true, score: 0.9 })
  })

  it.each([
    ['success false', { ...good, success: false }],
    ['the wrong action', { ...good, action: 'login' }],
    ['the wrong hostname', { ...good, hostname: 'evil.example' }],
    ['a low score', { ...good, score: 0.3 }],
    ['no score', { success: true, action: 'worker_register', hostname: 'localhost' }],
  ])('rejects %s', async (_label, body) => {
    expect(await verifier(() => json(body)).v.verify('tok', 'worker_register', '1.2.3.4')).toMatchObject({ ok: false, reason: 'rejected' })
  })

  it.each([
    ['the provider is down', () => Promise.reject(new TypeError('fetch failed'))],
    ['the provider returns 500', () => json({}, 500)],
    ['the response is malformed', () => json({ success: 'yes' })],
  ])('treats %s as unavailable -- never as a pass', async (_label, respond) => {
    expect(await verifier(respond).v.verify('tok', 'worker_register', '1.2.3.4')).toMatchObject({ ok: false, reason: 'unavailable' })
  })

  it('does not call the provider without a token', async () => {
    const { v, calls } = verifier(() => json(good))
    expect(await v.verify(undefined, 'worker_register', '1.2.3.4')).toMatchObject({ ok: false, reason: 'missing' })
    expect(calls).toEqual([])
  })
})
