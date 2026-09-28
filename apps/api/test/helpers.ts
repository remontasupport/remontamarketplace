// Test harness: the real app (createApp) with fakes for the ports.
import type { Contract, PublicEndpoint, RateWindow, Role } from '@remonta/api-contract'
import type { FastifyInstance } from 'fastify'
import { createApp, type AppOptions } from '../src/app'
import type { Authenticator, Principal } from '../src/platform/auth/authenticator'
import type { CaptchaOutcome, CaptchaVerifier } from '../src/platform/captcha/captcha'
import type { HandlerSet } from '../src/platform/contract/handlers'
import type { RateDecision, RateLimiter } from '../src/platform/rate-limit/rate-limiter'

export class FakeRateLimiter implements RateLimiter {
  mode: 'allow' | 'deny' | 'down' = 'allow'
  keys: string[] = []
  async hit(key: string, _limit: number, _window: RateWindow): Promise<RateDecision> {
    this.keys.push(key)
    if (this.mode === 'down') throw new Error('store unreachable')
    return { allowed: this.mode === 'allow', retryAfter: 42 }
  }
}

export class FakeCaptcha implements CaptchaVerifier {
  outcome: CaptchaOutcome = { ok: true, score: 0.9 }
  calls: { token: unknown; action: string }[] = []
  async verify(token: unknown, action: string): Promise<CaptchaOutcome> {
    this.calls.push({ token, action })
    if (typeof token !== 'string' || !token) return { ok: false, reason: 'missing', detail: 'no token' }
    return this.outcome
  }
}

/** Reads the caller from `x-test-principal: <userId>:<ROLE>`. */
export class FakeAuthenticator implements Authenticator {
  async authenticate(headers: Record<string, string | string[] | undefined>): Promise<Principal | null> {
    const h = headers['x-test-principal']
    if (typeof h !== 'string') return null
    const [userId, role] = h.split(':')
    return userId && role ? { userId, role: role as Role } : null
  }
}

export interface TestApp {
  fastify: FastifyInstance
  rateLimiter: FakeRateLimiter
  captcha: FakeCaptcha
  close: () => Promise<void>
}

export async function testApp(opts: {
  contracts: readonly Contract[]
  handlerSets: readonly HandlerSet[]
  publicEndpoints?: readonly PublicEndpoint[]
  config?: Partial<AppOptions['config']>
  shedder?: AppOptions['shedder']
}): Promise<TestApp> {
  const rateLimiter = new FakeRateLimiter()
  const captcha = new FakeCaptcha()
  const app = await createApp({
    config: { CORS_ORIGINS: ['http://localhost:3000'], TRUST_PROXY: 0, requireHttps: false, NODE_ENV: 'test', ...opts.config },
    contracts: opts.contracts,
    handlerSets: opts.handlerSets,
    publicEndpoints: opts.publicEndpoints ?? [],
    deps: { rateLimiter, captcha, authenticator: new FakeAuthenticator() },
    shedder: opts.shedder,
  })
  return { fastify: app.getHttpAdapter().getInstance() as unknown as FastifyInstance, rateLimiter, captcha, close: () => app.close() }
}

/** A multipart/form-data body with one file part (and optional extra parts). */
export function multipart(parts: { name: string; filename?: string; type?: string; data: Buffer | string }[]) {
  const boundary = '----remonta-test-boundary'
  const chunks: Buffer[] = []
  for (const p of parts) {
    const disposition = p.filename ? `form-data; name="${p.name}"; filename="${p.filename}"` : `form-data; name="${p.name}"`
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: ${disposition}\r\n${p.type ? `Content-Type: ${p.type}\r\n` : ''}\r\n`))
    chunks.push(Buffer.isBuffer(p.data) ? p.data : Buffer.from(p.data))
    chunks.push(Buffer.from('\r\n'))
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`))
  return { payload: Buffer.concat(chunks), headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}

/** Handlers that fail loudly if the pipeline ever lets a request reach them. */
export function unreachableHandlers(contract: Contract): HandlerSet {
  const handlers = Object.fromEntries(
    Object.keys(contract.entries).map((name) => [
      name,
      async () => {
        throw new Error(`HANDLER REACHED: ${contract.area}.${name}`)
      },
    ]),
  )
  return { contract, handlers } as HandlerSet
}
