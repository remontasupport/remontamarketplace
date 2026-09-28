// Email verification codes for sign-up (S1 step 13), stateless as apps/app's client
// sign-up already is (lib/otp.ts): the server signs `email:code:expiresAt` with a
// secret and keeps nothing. Whoever presents the email, the code and the expiry
// with a matching signature has read the email. Pure: no clock, no I/O.
//
// The signed string has the same shape as the client flow's, on purpose, so the
// two can share one secret later; the secret is not shared today (see main.ts).
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

export const EMAIL_CODE_TTL_MS = 10 * 60_000
export const EMAIL_CODE_TTL_MINUTES = EMAIL_CODE_TTL_MS / 60_000

/** Six digits, uniformly random, leading zeros kept. */
export function newEmailCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export interface EmailCodeClaim {
  email: string
  code: string
  expiresAt: number
}

export function signEmailCode(secret: string, c: EmailCodeClaim): string {
  return createHmac('sha256', secret).update(`${c.email}:${c.code}:${c.expiresAt}`).digest('hex')
}

export type EmailCodeCheck = 'ok' | 'expired' | 'mismatch'

/**
 * Expiry first, so a guess against an expired ticket learns nothing about the
 * code; then a constant-time signature comparison.
 */
export function checkEmailCode(secret: string, c: EmailCodeClaim & { token: string }, now: Date): EmailCodeCheck {
  if (now.getTime() >= c.expiresAt) return 'expired'
  const expected = Buffer.from(signEmailCode(secret, c), 'hex')
  const given = Buffer.from(c.token, 'hex')
  if (given.length !== expected.length) return 'mismatch'
  return timingSafeEqual(given, expected) ? 'ok' : 'mismatch'
}
