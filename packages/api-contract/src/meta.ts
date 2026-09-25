// Security metadata: what every contract entry must declare (NFR-ARCH-01, P1-P10).
// apps/api builds the central pipeline from it, so an entry cannot skip a step --
// it can only set that step's parameters. There are no defaults: an entry without
// access or a rate limit does not compile, and meta() re-checks at load time.
import * as z from 'zod'

/** The database's UserRole enum (packages/db). */
export const ROLES = ['WORKER', 'CLIENT', 'COORDINATOR', 'ADMIN'] as const
export type Role = (typeof ROLES)[number]

export const RATE_WINDOWS = { '1m': 60, '10m': 600, '1h': 3600, '1d': 86400 } as const
export type RateWindow = keyof typeof RATE_WINDOWS

export interface RateLimitRule {
  /** 'user' needs an authenticated caller, so it is refused on public entries. */
  per: 'ip' | 'user' | 'global'
  limit: number
  window: RateWindow
}

export type Access = 'public' | { roles: readonly [Role, ...Role[]] }

export interface Meta {
  /** Explicit, always. 'public' entries must also be on public-endpoints.json. */
  access: Access
  /** reCAPTCHA v3 with this action, failing closed; or none. */
  bot: 'none' | { captcha: { action: string } }
  /** At least one rule. Enforced before authentication, fails closed. */
  rateLimit: readonly [RateLimitRule, ...RateLimitRule[]]
  /** Request bodies larger than this are rejected before parsing (413). */
  maxBodyKb: number
  /** Written in the same transaction as the change. An AuditAction value. */
  audit?: string
  /** Cache-Control max-age for a public, non-personal GET. */
  cacheSeconds?: number
}

const metaSchema = z.strictObject({
  access: z.union([z.literal('public'), z.strictObject({ roles: z.array(z.enum(ROLES)).min(1) })]),
  bot: z.union([
    z.literal('none'),
    z.strictObject({ captcha: z.strictObject({ action: z.string().regex(/^[a-z][a-z_]{2,40}$/) }) }),
  ]),
  rateLimit: z
    .array(
      z.strictObject({
        per: z.enum(['ip', 'user', 'global']),
        limit: z.number().int().positive(),
        window: z.enum(Object.keys(RATE_WINDOWS) as [RateWindow, ...RateWindow[]]),
      }),
    )
    .min(1),
  maxBodyKb: z.number().int().positive().max(10240),
  audit: z.string().regex(/^[A-Z][A-Z_]+$/).optional(),
  cacheSeconds: z.number().int().positive().max(86400).optional(),
})

/** Declares an entry's security metadata; throws at load time if it is malformed. */
export function meta<const M extends Meta>(m: M): M {
  const parsed = metaSchema.safeParse(m)
  if (!parsed.success) throw new Error(`invalid contract metadata: ${z.prettifyError(parsed.error)}`)
  if (m.access === 'public' && m.rateLimit.some((r) => r.per === 'user')) {
    throw new Error("invalid contract metadata: a public entry cannot rate-limit per 'user'")
  }
  return m
}
