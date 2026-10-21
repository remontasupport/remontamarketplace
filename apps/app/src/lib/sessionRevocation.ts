// U5d (user, 2026-10-16): a password change signs out the other sessions. The decision, kept pure for its tests: given
// a session's sign-in time and the account's last password change (both in seconds), whether the session is refused,
// and the sign-in time to keep on it.

export interface SessionTimes {
  /** When the session signed in; undefined for a session from before this check existed. */
  authAt?: number
}

/**
 * A session from before this check existed has no sign-in time: it is kept (given "now") unless a change has happened,
 * in which case it predates the change and is refused. A change in the same second as the sign-in keeps the session.
 */
export function sessionAfterPasswordCheck(token: SessionTimes, changedAtS: number | null, nowS: number): { authAt: number; revoked: boolean } {
  const authAt = token.authAt ?? (changedAtS === null ? nowS : 0)
  return { authAt, revoked: changedAtS !== null && authAt < changedAtS }
}
