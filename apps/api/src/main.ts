// Boot order (S1-design 2.1): config check -> contract check -> listen.
// Any failure exits non-zero with the reason; nothing is served half-configured.
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { contracts, type PublicEndpoint } from '@remonta/api-contract'
import { createApp } from './app'
import { loadConfig } from './config/config'
import { JwtAuthenticator } from './platform/auth/jwt-authenticator'
import { RecaptchaV3Verifier } from './platform/captcha/captcha'
import { SafeHttpClient } from './platform/http/safe-http-client'
import { OutboxDispatcher } from './platform/outbox/dispatcher'
import type { OutboxHandler } from './platform/outbox/outbox'
import { LoadShedder } from './platform/load/load-shedder'
import { createDb } from './platform/persistence/db'
import { PostgresRateLimiter } from './platform/rate-limit/rate-limiter'
import { adminHandlers } from './modules/admin/admin.handlers'
import { workerHandlers } from './modules/worker/worker.handlers'
import { ResponseMemo } from './platform/cache/response-memo'
import { systemClock } from './platform/clock'
import { LocalityDirectory } from './modules/localities/locality-directory'
import { platformHandlers } from './modules/platform/platform.handlers'
import { GcsPhotoStore } from './modules/registration/adapters/gcs-photo-store'
import { VercelBlobPhotoStore } from './modules/registration/adapters/photo-store'
import { PwnedPasswordsChecker } from './modules/registration/adapters/pwned-passwords'
import { photoUploadedHandler } from './modules/registration/application/photo-process'
import { PHOTO_UPLOADED } from './modules/registration/domain/events'
import { registrationHandlers } from './modules/registration/registration.handlers'
import { WorkerPoolHasher } from './platform/security/password-hasher'
import { notificationHandlers } from './modules/notifications/notification.handlers'
import { onboardingReconcilerJob } from './modules/onboarding/reconciler'
import { purgeUnclaimedPhotosJob } from './modules/registration/jobs/purge-photos'
import { LogMailer, ResendMailer, type Mailer } from './platform/email/mailer'
import { Scheduler, type Job } from './platform/jobs/scheduler'
import { outboxRetentionJob } from './platform/outbox/retention'

async function main() {
  const config = loadConfig(process.env)
  const db = createDb(config.AUTH_DATABASE_URL, { poolSize: config.DB_POOL_SIZE, poolTimeoutS: config.DB_POOL_TIMEOUT_S })
  const http = new SafeHttpClient({ allowedHosts: config.outboundHosts })
  const rateLimiter = new PostgresRateLimiter(db)

  const hasher = new WorkerPoolHasher({ threads: config.HASH_CONCURRENCY })
  // EMAIL_MODE=log (local development on a copy of real data): nothing is sent, the email is printed.
  const mailer: Mailer = config.EMAIL_MODE === 'log' ? new LogMailer() : new ResendMailer(http, { apiKey: config.RESEND_API_KEY, from: config.EMAIL_FROM })
  // The bucket (U3): the browser uploads straight to it under a ticket; private, upload-only.
  // Vercel Blob: where every photo lives and is served from -- the clean copies go there.
  const bucket = new GcsPhotoStore({ bucket: config.PHOTO_BUCKET, publicBaseUrl: config.PHOTO_PUBLIC_BASE_URL, apiEndpoint: config.GCS_API_ENDPOINT, timeoutMs: config.GCS_TIMEOUT_MS })
  const blobStore = new VercelBlobPhotoStore(config.BLOB_READ_WRITE_TOKEN)
  const handlerSets = [
    platformHandlers({ db, clock: systemClock }),
    // The admin lists (U2): behind the api token; the search is memoised per instance.
    adminHandlers({ db, clock: systemClock }),
    // The worker's own profile (worker-profile-api U1): per-user bodies, never memoised.
    workerHandlers({ db, clock: systemClock, photos: { bucket, publicBaseUrl: config.PHOTO_PUBLIC_BASE_URL, ipHashSecret: config.IP_HASH_SECRET, blob: blobStore } }),
    registrationHandlers({
      db,
      hasher,
      breaches: new PwnedPasswordsChecker(http),
      localities: new LocalityDirectory(db),
      bucket,
      publicBaseUrl: config.PHOTO_PUBLIC_BASE_URL,
      ipHashSecret: config.IP_HASH_SECRET,
      mailer,
      // The server's keyed-hash secret also signs the 10-minute email-code tickets.
      codeSecret: config.IP_HASH_SECRET,
    }),
  ]
  // Outbox event handlers by type. The CRM notification is deferred (user, 2026-10-01).
  const outboxHandlers: Map<string, OutboxHandler> = notificationHandlers({ db, mailer, appBaseUrl: config.APP_BASE_URL })

  const shedder = new LoadShedder({ maxInFlight: config.MAX_IN_FLIGHT, maxEventLoopDelayMs: config.MAX_EVENT_LOOP_DELAY_MS })
  // The api token verifier (U1): the secret pair from Secret Manager; the logger exists
  // only after createApp, hence the getter.
  const utf8 = (s: string) => new TextEncoder().encode(s)
  const authenticator = new JwtAuthenticator({
    secrets: { current: utf8(config.API_TOKEN_SECRET), previous: config.API_TOKEN_SECRET_PREVIOUS ? utf8(config.API_TOKEN_SECRET_PREVIOUS) : undefined },
    log: () => app.getHttpAdapter().getInstance().log,
  })
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
      authenticator,
      memo: { store: new ResponseMemo({ clock: systemClock }), entries: new Set(['admin.searchWorkers']) },
      exemptIps: config.rateLimitExemptIps,
    },
  })
  const log = app.getHttpAdapter().getInstance().log
  // Staging drills only (RATE_LIMIT_EXEMPT_IPS): said loudly at boot, never silently in place.
  if (config.rateLimitExemptIps.size > 0) log.warn({ exemptIps: config.rateLimitExemptIps.size }, 'per-IP rate limits are skipped for RATE_LIMIT_EXEMPT_IPS (a load-test override; redeploy to remove)')
  outboxHandlers.set(PHOTO_UPLOADED, photoUploadedHandler({ db, bucket, blob: blobStore, log, concurrency: config.PHOTO_PROCESS_CONCURRENCY }))
  const dispatcher = new OutboxDispatcher(db, outboxHandlers, log)
  dispatcher.start(config.OUTBOX_POLL_MS)
  const jobs: Job[] = [
    onboardingReconcilerJob(db, log, { everyMs: config.RECONCILER_INTERVAL_MS }),
    purgeUnclaimedPhotosJob(db, { gcs: bucket }),
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
