// Load harness for the k6 burst test (step 5b). The real createApp and pipeline,
// with a synthetic sign-up-shaped endpoint that does what dominates a real sign-up:
// one bcrypt cost-12 hash with bcryptjs, the library apps/app uses today (pure JS,
// so it runs on the event loop). Local tooling only: fake rate limiter and CAPTCHA,
// no database.
//
//   PROTECT=on|off PORT=4100 pnpm --filter @remonta/api load:harness
import { defineContract, meta, platformContract, type PublicEndpoint } from '@remonta/api-contract'
import bcrypt from 'bcryptjs'
import * as z from 'zod'
import { createApp } from '../src/app'
import { defineHandlers, type HandlerSet } from '../src/platform/contract/handlers'
import { LoadShedder } from '../src/platform/load/load-shedder'
import { WorkerPoolHasher } from '../src/platform/security/password-hasher'

const protect = process.env.PROTECT !== 'off'
const port = Number(process.env.PORT ?? 4100)
const open = meta({ access: 'public', bot: 'none', rateLimit: [{ per: 'global', limit: 1_000_000, window: '1m' }], maxBodyKb: 1 })

const harness = defineContract('loadHarness', {
  signup: { method: 'POST', path: '/v1/load/signup', summary: 'bcrypt cost 12, like a sign-up', responses: { 202: z.strictObject({}) }, meta: open },
})
// OFF: bcryptjs on the event loop, as apps/app does today. ON: the worker pool.
const pool = protect ? new WorkerPoolHasher({ threads: Number(process.env.HASH_CONCURRENCY ?? 2) }) : undefined
const hash = () => (pool ? pool.hash('Str0ng!password') : bcrypt.hash('Str0ng!password', 12))

const sets = [
  defineHandlers(platformContract, { health: async () => ({ status: 200, body: { status: 'ok' } }) }),
  defineHandlers(harness, {
    signup: async () => {
      await hash()
      return { status: 202, body: {} }
    },
  }),
] as unknown as HandlerSet[]

const app = await createApp({
  config: { CORS_ORIGINS: ['http://localhost:3000'], TRUST_PROXY: 0, requireHttps: false, NODE_ENV: 'development' },
  contracts: [platformContract, harness],
  handlerSets: sets,
  publicEndpoints: ['GET /v1/health', 'POST /v1/load/signup'].map((route): PublicEndpoint => ({ route, reason: 'local load harness' })),
  deps: {
    rateLimiter: { hit: async () => ({ allowed: true, retryAfter: 1 }) },
    captcha: { verify: async () => ({ ok: true, score: 1 }) },
    authenticator: { authenticate: async () => null },
  },
  shedder: protect ? new LoadShedder({ maxInFlight: Number(process.env.MAX_IN_FLIGHT ?? 256), maxEventLoopDelayMs: Number(process.env.MAX_EVENT_LOOP_DELAY_MS ?? 200) }) : undefined,
  logLevel: 'warn',
})
await app.listen(port, '127.0.0.1')
console.log(`load harness on :${port}, protection ${protect ? 'ON' : 'OFF'}`)
