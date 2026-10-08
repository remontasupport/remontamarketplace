// The api token verifier (U1 api-identity; functional design L2, rules R3). A pure
// function of (headers, secrets, clock): no database, no network. Every refusal is one
// warn line {auth: 'rejected', reason} -- the auth-failure metric counts those -- and a
// null, which the pipeline turns into a generic 401. Nothing about the token is logged.
//
// Two secrets may be configured (NFR design P6): the minter names the key it used in
// `kid`; with no `kid` the current secret is tried first, then the previous one.
import { API_TOKEN_ALG, API_TOKEN_AUDIENCE, API_TOKEN_ISSUER, API_TOKEN_KID, API_TOKEN_KID_PREVIOUS, apiTokenClaimsSchema, principalOf } from '@remonta/api-contract'
import { decodeProtectedHeader, errors as joseErrors, jwtVerify } from 'jose'
import type { Clock } from '../clock'
import { systemClock } from '../clock'
import type { Authenticator, Principal } from './authenticator'

export type RejectionReason = 'missing' | 'malformed' | 'bad-signature' | 'expired' | 'not-yet-valid' | 'bad-issuer' | 'bad-audience' | 'bad-claims'

export interface WarnLogger {
  warn(obj: Record<string, unknown>, msg?: string): void
}

export interface JwtAuthenticatorOptions {
  secrets: { current: Uint8Array; previous?: Uint8Array }
  /** The app logger, resolved per call: Fastify creates it after this object exists. */
  log: () => WarnLogger
  clock?: Clock
  /** Clock tolerance on exp/nbf, seconds (R3.5, R3.6). */
  skewS?: number
}

/** A token is at most this long in the header; longer is refused before any parsing (R3.3). */
export const MAX_TOKEN_LENGTH = 4096

export class JwtAuthenticator implements Authenticator {
  private readonly clock: Clock
  private readonly skewS: number

  constructor(private readonly opts: JwtAuthenticatorOptions) {
    this.clock = opts.clock ?? systemClock
    this.skewS = opts.skewS ?? 30
  }

  async authenticate(headers: Record<string, string | string[] | undefined>): Promise<Principal | null> {
    const header = headers['authorization']
    if (header === undefined) return this.reject('missing')
    if (typeof header !== 'string') return this.reject('missing') // more than one header
    const token = bearerToken(header)
    if (!token) return this.reject('malformed')

    const keys = this.keysFor(token)
    // No header to read, or a `kid` naming a key this instance does not hold (R3.3).
    if (keys === null || keys.length === 0) return this.reject('malformed')

    let payload: unknown
    let outcome: RejectionReason | null = null
    for (const key of keys) {
      const r = await this.verifyWith(token, key)
      if (r.ok) {
        payload = r.payload
        outcome = null
        break
      }
      outcome = r.reason
      // Only a signature failure is worth trying the other key for; anything else is final.
      if (r.reason !== 'bad-signature') break
    }
    if (outcome !== null) return this.reject(outcome)

    const claims = apiTokenClaimsSchema.safeParse(payload)
    if (!claims.success) return this.reject('bad-claims')
    return principalOf(claims.data)
  }

  /** The keys to try, in order, from the token's `kid`; null when the header cannot be read. */
  private keysFor(token: string): Uint8Array[] | null {
    let kid: string | undefined
    try {
      kid = decodeProtectedHeader(token).kid
    } catch {
      return null
    }
    const { current, previous } = this.opts.secrets
    if (kid === undefined) return previous ? [current, previous] : [current]
    if (kid === API_TOKEN_KID) return [current]
    if (kid === API_TOKEN_KID_PREVIOUS) return previous ? [previous] : []
    return []
  }

  private async verifyWith(token: string, key: Uint8Array): Promise<{ ok: true; payload: unknown } | { ok: false; reason: RejectionReason }> {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: [API_TOKEN_ALG],
        issuer: API_TOKEN_ISSUER,
        audience: API_TOKEN_AUDIENCE,
        clockTolerance: this.skewS,
        currentDate: this.clock(),
      })
      return { ok: true, payload }
    } catch (err) {
      return { ok: false, reason: reasonOf(err) }
    }
  }

  private reject(reason: RejectionReason): null {
    this.opts.log().warn({ auth: 'rejected', reason }, 'auth rejected')
    return null
  }
}

/** The token of `Bearer <token>` (scheme case-insensitive), or null. */
function bearerToken(header: string): string | null {
  const m = /^\s*Bearer\s+(\S+)\s*$/i.exec(header)
  if (!m) return null
  const token = m[1]!
  return token.length <= MAX_TOKEN_LENGTH ? token : null
}

function reasonOf(err: unknown): RejectionReason {
  if (err instanceof joseErrors.JWTExpired) return 'expired'
  if (err instanceof joseErrors.JWSSignatureVerificationFailed) return 'bad-signature'
  if (err instanceof joseErrors.JWTClaimValidationFailed) {
    if (err.claim === 'nbf') return 'not-yet-valid'
    if (err.claim === 'iss') return 'bad-issuer'
    if (err.claim === 'aud') return 'bad-audience'
    return 'bad-claims'
  }
  // JOSEAlgNotAllowed, JWSInvalid, JWTInvalid, a key of the wrong type, anything else.
  return 'malformed'
}
