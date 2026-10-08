// Minting an api token for the signed-in session (U1 api-identity, C11: L1, R1, R2).
// Pure of Next and Prisma so the route handler stays a thin adapter and every
// branch is tested with fakes: no session, inactive account, changed role, the
// limiter, a database error (503, never 401), impersonation, the claims shape.
import { SignJWT } from 'jose'
import { API_TOKEN_ALG, API_TOKEN_AUDIENCE, API_TOKEN_ISSUER, API_TOKEN_KID, API_TOKEN_TTL_S, ROLES, type Role } from '@remonta/api-contract'

export const SECRET_MIN_LENGTH = 32
export const DB_RETRY_AFTER_S = 2

export interface MintSession {
  user: { id: string; role: string; impersonatedBy?: string }
}

export interface MintDeps {
  session: MintSession | null
  /** The subject's account by id: `{status, role}` or null when it does not exist. May throw on a database error. */
  readAccount: (userId: string) => Promise<{ status: string; role: string } | null>
  /** The app's strict limiter keyed by the subject (R2.4); fails open inside. */
  rateLimit: (userId: string) => Promise<{ success: boolean; retryAfter?: number }>
  secret: string | undefined
  /** Epoch milliseconds. */
  now?: () => number
  randomId?: () => string
  log?: (level: 'info' | 'warn' | 'error', data: Record<string, unknown>, msg: string) => void
}

export interface MintResult {
  status: number
  body: Record<string, unknown>
  headers: Record<string, string>
}

const NO_STORE = { 'cache-control': 'no-store' } as const

export async function mintApiToken(deps: MintDeps): Promise<MintResult> {
  const log = deps.log ?? defaultLog
  const session = deps.session
  if (!session?.user?.id) return { status: 401, body: { error: 'unauthenticated' }, headers: NO_STORE } // R2.1

  const secret = (deps.secret ?? '').trim()
  if (secret.length < SECRET_MIN_LENGTH) {
    log('error', { route: 'api-token' }, 'API_TOKEN_SECRET missing or shorter than 32 characters; no token can be minted')
    return { status: 500, body: { error: 'misconfigured' }, headers: NO_STORE }
  }

  // R2.2 / R2.6: the subject is the signed-in user; during impersonation that is the impersonated user.
  const subject = session.user.id
  let account: { status: string; role: string } | null
  try {
    account = await deps.readAccount(subject)
  } catch (err) {
    log('warn', { route: 'api-token', userId: subject, error: err instanceof Error ? err.message : String(err) }, 'account read failed')
    return { status: 503, body: { error: 'unavailable' }, headers: { ...NO_STORE, 'retry-after': String(DB_RETRY_AFTER_S) } }
  }
  if (!account || account.status !== 'ACTIVE') {
    log('info', { route: 'api-token', userId: subject, reason: 'account-inactive' }, 'token refused')
    return { status: 401, body: { error: 'unauthenticated' }, headers: NO_STORE }
  }
  if (account.role !== session.user.role || !(ROLES as readonly string[]).includes(account.role)) {
    log('info', { route: 'api-token', userId: subject, reason: 'role-changed' }, 'token refused') // R2.3
    return { status: 401, body: { error: 'unauthenticated' }, headers: NO_STORE }
  }

  const limit = await deps.rateLimit(subject) // R2.4
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil(limit.retryAfter ?? 60))
    return { status: 429, body: { error: 'rate-limited' }, headers: { ...NO_STORE, 'retry-after': String(retryAfter) } }
  }

  const nowS = Math.floor((deps.now ?? Date.now)() / 1000)
  const exp = nowS + API_TOKEN_TTL_S
  const claims: Record<string, unknown> = { role: account.role as Role, jti: (deps.randomId ?? (() => crypto.randomUUID()))() }
  if (session.user.impersonatedBy) claims.act = session.user.impersonatedBy // R2.6
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: API_TOKEN_ALG, typ: 'JWT', kid: API_TOKEN_KID })
    .setSubject(subject)
    .setIssuer(API_TOKEN_ISSUER)
    .setAudience(API_TOKEN_AUDIENCE)
    .setIssuedAt(nowS)
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret))

  return { status: 200, body: { token, expiresAt: new Date(exp * 1000).toISOString() }, headers: NO_STORE } // R2.5
}

function defaultLog(level: 'info' | 'warn' | 'error', data: Record<string, unknown>, msg: string): void {
  const line = JSON.stringify({ level, msg, ...data })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}
