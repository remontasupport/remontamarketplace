// The api token (U1 api-identity, 2026-10-08): what apps/app mints from a signed-in
// session and apps/api verifies on every role-restricted request. One definition for
// both sides: the claims, the issuer and audience names, the lifetime and the
// algorithm. The signing itself is done by each side with `jose`; this package stays
// declarations only (P-6).
//
// No personal data travels in the token: the subject is an opaque user id.
import * as z from 'zod'
import { ROLES } from './meta'

/** `iss` of every token: the app that holds the session. */
export const API_TOKEN_ISSUER = 'remonta-app'
/** `aud` of every token: the api that verifies it. */
export const API_TOKEN_AUDIENCE = 'remonta-api'
/** Lifetime in seconds (functional design R1.2; NFR-03 allows at most 600). */
export const API_TOKEN_TTL_S = 300
/** The only accepted algorithm (R1.4). */
export const API_TOKEN_ALG = 'HS256'
/** The `kid` the minter sets; the verifier maps it to its current secret (NFR design P6). */
export const API_TOKEN_KID = 'current'
/** The `kid` of the previous secret during a rotation. */
export const API_TOKEN_KID_PREVIOUS = 'previous'

/**
 * The claims (R1.1). Strict: an unknown claim fails parsing. `act` names the
 * impersonating admin when the session is an impersonation (R2.6); the subject is then
 * the impersonated user and `role` is theirs, so impersonation never widens rights.
 */
export const apiTokenClaimsSchema = z.strictObject({
  sub: z.string().min(1),
  role: z.enum(ROLES),
  act: z.string().min(1).optional(),
  iss: z.literal(API_TOKEN_ISSUER),
  aud: z.literal(API_TOKEN_AUDIENCE),
  iat: z.number().int(),
  exp: z.number().int(),
  jti: z.string().min(8),
})
export type ApiTokenClaims = z.infer<typeof apiTokenClaimsSchema>

/** What the api's pipeline works with once a token verified. */
export interface ApiPrincipal {
  userId: string
  role: ApiTokenClaims['role']
  impersonatorId?: string
}

export function principalOf(claims: ApiTokenClaims): ApiPrincipal {
  return { userId: claims.sub, role: claims.role, ...(claims.act !== undefined ? { impersonatorId: claims.act } : {}) }
}
