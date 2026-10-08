// The environment, parsed once at boot (S1-design 2.7). A missing or malformed
// value stops the service -- the opposite of today's fail-open CAPTCHA. Errors name
// the variable and the problem, never the value (P6).
import { availableParallelism } from 'node:os'
import * as z from 'zod'
import { isExactOrigin, isHostPattern, isOriginPattern } from './hosts'

const list = z
  .string()
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  )

const httpsUrl = z.url({ protocol: /^https$/, message: 'must be an https URL' })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  /** Proxy hops to trust for the client IP (rate limits key on it). 0 = the socket. */
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  REQUIRE_HTTPS: z.enum(['true', 'false']).optional(),

  AUTH_DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgresql:// URL'),

  /** Exact origins; staging may add ONE wildcard label, `https://*.vercel.app`, for Vercel previews (hosts.ts). */
  CORS_ORIGINS: list.pipe(z.array(z.string().refine(isOriginPattern, 'must be an origin like https://app.example.com (http only for localhost) or https://*.example.com, no path')).min(1, 'at least one origin')),

  RECAPTCHA_SECRET_KEY: z.string().min(20, 'missing or too short'),
  /** Hostnames Google reports for the page; staging may add `*.vercel.app` (one label). */
  RECAPTCHA_ALLOWED_HOSTNAMES: list.pipe(z.array(z.string().refine(isHostPattern, 'must be a hostname or *.example.com')).min(1)),
  RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),

  RESEND_API_KEY: z.string().min(10, 'missing or too short'),
  /** Sender for Remonta's emails, e.g. "Remonta <noreply@remontaservices.com.au>" (a Resend-verified domain). */
  EMAIL_FROM: z.string().min(3),
  /** apps/app's origin, for the links in emails (/login, /forgot-password). */
  APP_BASE_URL: z.string().refine(isExactOrigin, 'must be an origin like https://app.example.com (http only for localhost), no path, no wildcard'),
  RECONCILER_INTERVAL_MS: z.coerce.number().int().min(10_000).max(3_600_000).default(300_000),
  /** The CRM notification's webhook (deferred, user 2026-10-01): optional until that outbox handler exists. */
  N8N_REGISTRATION_WEBHOOK_URL: httpsUrl.optional(),

  /** Keys the IP hash stored with staged photos, so raw IPs are never stored. */
  IP_HASH_SECRET: z.string().min(32, 'missing or shorter than 32 characters'),
  /**
   * Verifies the api tokens apps/app mints (U1 api-identity). The SAME value as the app's
   * API_TOKEN_SECRET for this stage (Vercel Preview <-> staging, Production <-> prod);
   * a mismatch shows as `bad-signature` rejections.
   */
  API_TOKEN_SECRET: z.string().min(32, 'missing or shorter than 32 characters'),
  /** The previous value during a rotation (infra/README.md); always mounted on Cloud Run, optional locally. */
  API_TOKEN_SECRET_PREVIOUS: z.string().min(32, 'shorter than 32 characters').optional(),
  /** The Cloud Storage bucket sign-up photos are uploaded to (U3). One per stage; infra/lib/stages.ts. */
  PHOTO_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$/, 'must be a bucket name'),
  /** `https://storage.googleapis.com/<bucket>` in production; the fake server's URL for tests. */
  PHOTO_PUBLIC_BASE_URL: z.string().url().refine((u) => /^https:/.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u), 'must be https (http only for localhost)'),
  /** A fake Cloud Storage server (tests, local development). Unset in production. */
  GCS_API_ENDPOINT: z.string().url().optional(),
  /** Per-call deadline for the bucket. */
  GCS_TIMEOUT_MS: z.coerce.number().int().min(500).max(60_000).default(5000),
  /** Decodes in flight per instance (the processing bulkhead). */
  PHOTO_PROCESS_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(2),
  /** Vercel Blob: where every photo lives and is served from. The processing handler writes the clean copies here. */
  BLOB_READ_WRITE_TOKEN: z.string().min(20, 'missing or malformed'),

  OUTBOX_POLL_MS: z.coerce.number().int().min(100).max(60000).default(2000),

  // Overload protection (step 5b). Defaults suit one small instance; tune from the
  // k6 burst results (apps/api/load/README.md).
  /** Requests in flight on this instance before new ones get a fast 503. */
  MAX_IN_FLIGHT: z.coerce.number().int().min(1).max(10000).default(256),
  /** Event-loop delay (p99, ms) above which new requests get a fast 503. */
  MAX_EVENT_LOOP_DELAY_MS: z.coerce.number().int().min(10).max(10000).default(200),
  /** Database connections this instance may hold. Neon caps the total across instances. */
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
  /** Seconds a query waits for a free connection before failing with 503. */
  DB_POOL_TIMEOUT_S: z.coerce.number().int().min(1).max(60).default(5),
  /**
   * Worker threads hashing passwords at once; the rest queue briefly, then get 503.
   * Default: cores - 1 (at most 8). Capacity scales linearly: ~3.3 sign-ups/s per
   * thread at bcrypt cost 12 (k6 burst test, 2026-09-25).
   */
  HASH_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(Math.min(8, Math.max(1, availableParallelism() - 1))),
})

export type Env = z.output<typeof envSchema>

export interface Config extends Env {
  requireHttps: boolean
  /** Hosts SafeHttpClient may call. Nothing else is reachable (P5). */
  outboundHosts: string[]
}

export class ConfigError extends Error {
  constructor(readonly problems: string[]) {
    super(`apps/api will not start -- configuration problems:\n  ${problems.join('\n  ')}`)
    this.name = 'ConfigError'
  }
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  // Empty strings count as missing: a blank line in .env is not a secret.
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v.trim() !== ''))
  const parsed = envSchema.safeParse(cleaned)
  if (!parsed.success) {
    throw new ConfigError(parsed.error.issues.map((i) => `${i.path.join('.') || '(env)'}: ${i.code === 'invalid_type' ? 'required' : i.message}`))
  }
  const e = parsed.data
  const extra: string[] = []
  if (e.NODE_ENV === 'production' && e.GCS_API_ENDPOINT) extra.push('GCS_API_ENDPOINT: a fake storage server is not allowed in production')
  if (extra.length) throw new ConfigError(extra)
  return {
    ...e,
    requireHttps: e.REQUIRE_HTTPS ? e.REQUIRE_HTTPS === 'true' : e.NODE_ENV === 'production',
    outboundHosts: [
      'www.google.com', // reCAPTCHA siteverify
      'api.resend.com',
      'api.pwnedpasswords.com', // HIBP k-anonymity range API
      ...(e.N8N_REGISTRATION_WEBHOOK_URL ? [new URL(e.N8N_REGISTRATION_WEBHOOK_URL).hostname] : []),
    ].filter((h, i, all) => all.indexOf(h) === i),
  }
}
