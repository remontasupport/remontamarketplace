// Pipeline steps 5-6. Authentication arrives in slice 2 (Identity); until then the
// only implementation denies every non-public request. Deny by default (P1): an
// entry that is not public cannot be reached at all, rather than reached unchecked.
import type { Role } from '@remonta/api-contract'

export interface Principal {
  userId: string
  role: Role
}

export interface Authenticator {
  /** The caller, or null if the request carries no valid session. */
  authenticate(headers: Record<string, string | string[] | undefined>): Promise<Principal | null>
}

export class DenyAllAuthenticator implements Authenticator {
  async authenticate(): Promise<Principal | null> {
    return null
  }
}
