// Boot order (S1-design 2.1): config check -> contract check -> listen.
// Any failure exits non-zero with the reason; nothing is served half-configured.
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { contracts, type PublicEndpoint } from '@remonta/api-contract'
import { createApp } from './app'
import { loadConfig } from './config/config'
import { DenyAllAuthenticator } from './platform/auth/authenticator'
import { RecaptchaV3Verifier } from './platform/captcha/captcha'
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
import { notificationHandlers } from './modules/notifications/notification.handlers'
import { onboardingReconcilerJob } from './modules/onboarding/reconciler'
import { purgeUnclaimedPhotosJob } from './modules/registration/jobs/purge-photos'
import { ResendMailer } from './platform/email/mailer'
import { Scheduler, type Job } from './platform/jobs/scheduler'
import { outboxRetentionJob } from './platform/outbox/retention'

async function main() {
  const config = loadConfig(process.env)
  const db = createDb(config.AUTH_DATABASE_URL, { poolSize: config.DB_POOL_SIZE, poolTimeoutS: config.DB_POOL_TIMEOUT_S })
  const http = new SafeHttpClient({ allowedHosts: config.outboundHosts })
  const rateLimiter = new PostgresRateLimiter(db)

  const hasher = new WorkerPoolHasher({ threads: config.HASH_CONCURRENCY })
  const mailer = new ResendMailer(http, { apiKey: config.RESEND_API_KEY, from: config.EMAIL_FROM })
  const photoStore = config.PHOTO_STORE === 'vercel-blob' ? new VercelBlobPhotoStore(config.BLOB_READ_WRITE_TOKEN!) : new LocalDiskPhotoStore(config.PHOTO_LOCAL_DIR)
  const handlerSets = [
    platformHandlers(db),
    registrationHandlers({
      db,
      hasher,
      breaches: new PwnedPasswordsChecker(http),
      localities: new LocalityDirectory(db),
      store: photoStore,
      ipHashSecret: config.IP_HASH_SECRET,
      mailer,
      // The server's keyed-hash secret also signs the 10-minute email-code tickets.
      codeSecret: config.IP_HASH_SECRET,
    }),
  ]
  // Outbox event handlers by type. The CRM notification is deferred (user, 2026-10-01).
  const outboxHandlers: Map<string, OutboxHandler> = notificationHandlers({ db, mailer, appBaseUrl: config.APP_BASE_URL })

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
  const jobs: Job[] = [
    onboardingReconcilerJob(db, log, { everyMs: config.RECONCILER_INTERVAL_MS }),
    purgeUnclaimedPhotosJob(db, photoStore),
    outboxRetentionJob(db),
    {
      name: 'rate-limit-purge',
      everyMs: 10 * 60_000,
      timeoutMs: 60_000,
      run: async () => ({ summary: { deleted: await rateLimiter.purgeExpired() } }),
    },
  ]
  const scheduler = new Scheduler(db, jobs, log)
  scheduler.start()

  const shutdown = async (signal: string) => {
    log.info({ signal }, 'shutting down')
    await scheduler.stop()
    await dispatcher.stop()
    shedder.stop()
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
