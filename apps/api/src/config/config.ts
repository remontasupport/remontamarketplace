// The environment, parsed once at boot (S1-design 2.7). A missing or malformed
// value stops the service -- the opposite of today's fail-open CAPTCHA. Errors name
// the variable and the problem, never the value (P6).
import * as z from 'zod'

const list = z
  .string()
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  )

const origin = z.string().refine((o) => {
  try {
    const u = new URL(o)
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    return (u.protocol === 'https:' || (u.protocol === 'http:' && local)) && u.origin === o
  } catch {
    return false
  }
}, 'must be an origin like https://app.example.com (http only for localhost), no path, no wildcard')

const httpsUrl = z.url({ protocol: /^https$/, message: 'must be an https URL' })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  /** Proxy hops to trust for the client IP (rate limits key on it). 0 = the socket. */
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  REQUIRE_HTTPS: z.enum(['true', 'false']).optional(),

  AUTH_DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgresql:// URL'),

  CORS_ORIGINS: list.pipe(z.array(origin).min(1, 'at least one origin')),

  RECAPTCHA_SECRET_KEY: z.string().min(20, 'missing or too short'),
  RECAPTCHA_ALLOWED_HOSTNAMES: list.pipe(z.array(z.string().regex(/^[a-z0-9.-]+$/)).min(1)),
  RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),

  RESEND_API_KEY: z.string().min(10, 'missing or too short'),
  N8N_REGISTRATION_WEBHOOK_URL: httpsUrl,
  N8N_WEBHOOK_URL: httpsUrl,

  OUTBOX_POLL_MS: z.coerce.number().int().min(100).max(60000).default(2000),
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
  return {
    ...e,
    requireHttps: e.REQUIRE_HTTPS ? e.REQUIRE_HTTPS === 'true' : e.NODE_ENV === 'production',
    outboundHosts: [
      'www.google.com', // reCAPTCHA siteverify
      'api.resend.com',
      'api.pwnedpasswords.com', // HIBP k-anonymity range API
      new URL(e.N8N_REGISTRATION_WEBHOOK_URL).hostname,
      new URL(e.N8N_WEBHOOK_URL).hostname,
    ].filter((h, i, all) => all.indexOf(h) === i),
  }
}
