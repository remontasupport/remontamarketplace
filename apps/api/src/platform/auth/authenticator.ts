// Pipeline steps 5-6: who is asking. The port is one method; the api ships one
// implementation, `JwtAuthenticator` (jwt-authenticator.ts, U1 api-identity 2026-10-08),
// which verifies the token apps/app mints from a signed-in session. A service with no
// secret does not start (config.ts), and the tests use a header-based fake (test/helpers.ts);
// the DenyAllAuthenticator that once filled both roles went with U1 worker-area (U1-MNT-03).
// Deny by default (P1): an entry that is not public cannot be reached unchecked.
import type { Role } from '@remonta/api-contract'

export interface Principal {
  userId: string
  role: Role
  /** The admin impersonating `userId`, when the session is an impersonation (R2.6). */
  impersonatorId?: string
}

export interface Authenticator {
  /** The caller, or null if the request carries no valid token. Reads only the headers. */
  authenticate(headers: Record<string, string | string[] | undefined>): Promise<Principal | null>
}
