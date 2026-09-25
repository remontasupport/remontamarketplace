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
import { LoadShedder } from './platform/load/load-shedder'
import { createDb } from './platform/persistence/db'
import { PostgresRateLimiter } from './platform/rate-limit/rate-limiter'
import { LocalityDirectory } from './modules/localities/locality-directory'
import { platformHandlers } from './modules/platform/platform.handlers'
import { LocalDiskPhotoStore, VercelBlobPhotoStore } from './modules/registration/adapters/photo-store'
import { PwnedPasswordsChecker } from './modules/registration/adapters/pwned-passwords'
import { registrationHandlers } from './modules/registration/registration.handlers'
import { WorkerPoolHasher } from './platform/security/password-hasher'

async function main() {
  const config = loadConfig(process.env)
  const db = createDb(config.AUTH_DATABASE_URL, { poolSize: config.DB_POOL_SIZE, poolTimeoutS: config.DB_POOL_TIMEOUT_S })
  const http = new SafeHttpClient({ allowedHosts: config.outboundHosts })
  const rateLimiter = new PostgresRateLimiter(db)

  const hasher = new WorkerPoolHasher({ threads: config.HASH_CONCURRENCY })
  const handlerSets = [
    platformHandlers(db),
    registrationHandlers({
      db,
      hasher,
      breaches: new PwnedPasswordsChecker(http),
      localities: new LocalityDirectory(db),
      store: config.PHOTO_STORE === 'vercel-blob' ? new VercelBlobPhotoStore(config.BLOB_READ_WRITE_TOKEN!) : new LocalDiskPhotoStore(config.PHOTO_LOCAL_DIR),
      ipHashSecret: config.IP_HASH_SECRET,
    }),
  ] as unknown as HandlerSet[]
  // Outbox event handlers by type (step 8).
  const outboxHandlers = new Map<string, OutboxHandler>()

  const shedder = new LoadShedder({ maxInFlight: config.MAX_IN_FLIGHT, maxEventLoopDelayMs: config.MAX_EVENT_LOOP_DELAY_MS })
  const app = await createApp({
    config,
    shedder,
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
    await hasher.close()
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
