// Boot order (S1-design 2.1): config check -> contract check -> listen.
// Any failure exits non-zero with the reason; nothing is served half-configured.
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { contracts, type PublicEndpoint } from '@remonta/api-contract'
import { createApp } from './app'
import { loadConfig } from './config/config'
import { DenyAllAuthenticator } from './platform/auth/authenticator'
import { RecaptchaV3Verifier } from './platform/captcha/captcha'
import type { HandlerSet } from './platform/contract/handlers'
import { SafeHttpClient } from './platform/http/safe-http-client'
import { OutboxDispatcher } from './platform/outbox/dispatcher'
import type { OutboxHandler } from './platform/outbox/outbox'
import { createDb } from './platform/persistence/db'
import { PostgresRateLimiter } from './platform/rate-limit/rate-limiter'
import { platformHandlers } from './modules/platform/platform.handlers'

async function main() {
  const config = loadConfig(process.env)
  const db = createDb(config.AUTH_DATABASE_URL)
  const http = new SafeHttpClient({ allowedHosts: config.outboundHosts })
  const rateLimiter = new PostgresRateLimiter(db)

  // Each module adds its handler set here (registration: step 7).
  const handlerSets: HandlerSet[] = [platformHandlers(db) as unknown as HandlerSet]
  // Outbox event handlers by type (step 8).
  const outboxHandlers = new Map<string, OutboxHandler>()

  const app = await createApp({
    config,
    contracts,
    handlerSets,
    publicEndpoints: publicEndpoints as PublicEndpoint[],
    deps: {
      rateLimiter,
      captcha: new RecaptchaV3Verifier(http, {
        secret: config.RECAPTCHA_SECRET_KEY,
        allowedHostnames: config.RECAPTCHA_ALLOWED_HOSTNAMES,
        minScore: config.RECAPTCHA_MIN_SCORE,
      }),
      authenticator: new DenyAllAuthenticator(),
    },
  })
  const log = app.getHttpAdapter().getInstance().log
  const dispatcher = new OutboxDispatcher(db, outboxHandlers, log)
  dispatcher.start(config.OUTBOX_POLL_MS)
  const purge = setInterval(() => void rateLimiter.purgeExpired().catch((err) => log.error({ err }, 'rate-limit purge failed')), 10 * 60_000)

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutting down')
    clearInterval(purge)
    await dispatcher.stop()
    await app.close()
    await db.$disconnect()
    process.exit(0)
  }
  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))

  await app.listen(config.PORT, config.HOST)
  log.info({ port: config.PORT }, 'apps/api listening')
}

main().catch((err: unknown) => {
  // ConfigError / BootError messages list variable and entry names only.
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
