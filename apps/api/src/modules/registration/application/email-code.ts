// Sending and checking a sign-up email code (S1 step 13).
//
//   R1 no enumeration: the send never looks at `users`; every address gets a code
//      and the same 202. An existing email verifies like a new one and meets the
//      R1 branch at sign-up.
//   Synchronous send, not the outbox: the code exists only in this call. A
//      provider outage is a 503 the form retries; a provider REFUSAL (a 4xx: an
//      unverified sender, an address it will not deliver to) is permanent, so it
//      is a 500 the form does not retry. Nothing is left behind either way.
import type { EmailAvailability, EmailCodeRequest, EmailCodeTicket, EmailCodeVerify } from '@remonta/schemas/schema/workerRegistrationSchema'
import type { Db } from '../../../platform/persistence/db'
import type { FastifyBaseLogger } from 'fastify'
import type { Mailer } from '../../../platform/email/mailer'
import { ApiError } from '../../../platform/errors'
import { PermanentFailure } from '../../../platform/outbox/outbox'
import { emailVerificationCode } from '../../notifications/templates'
import { checkEmailCode, EMAIL_CODE_TTL_MINUTES, EMAIL_CODE_TTL_MS, newEmailCode, signEmailCode, type EmailCodeCheck } from '../domain/email-code'

export interface EmailCodeDeps {
  mailer: Mailer
  /** Signs the tickets. Rotating it invalidates codes in flight (10 minutes at most). */
  codeSecret: string
  now?: () => Date
}

/**
 * Whether the address can sign up: no account with it, ignoring case (user
 * decision, 2026-09-28: this entry reveals existence; the send and the sign-up do
 * not). One lookup on users_lower_email_idx (0.009 ms at 100 k users, step 9b).
 */
export async function emailAvailable(db: Db, input: EmailAvailability): Promise<{ available: boolean }> {
  const rows = await db.$queryRaw<{ one: number }[]>`SELECT 1 AS one FROM users WHERE lower(email) = lower(${input.email}) LIMIT 1`
  return { available: rows.length === 0 }
}

export const EMAIL_CODE_MESSAGES: Record<Exclude<EmailCodeCheck, 'ok'>, string> = {
  expired: 'This code has expired. Please request a new one.',
  mismatch: 'That code is not right. Please check the email and try again.',
}

export async function requestEmailCode(input: EmailCodeRequest, deps: EmailCodeDeps, log: FastifyBaseLogger): Promise<EmailCodeTicket> {
  const now = (deps.now ?? (() => new Date()))()
  const code = newEmailCode()
  const expiresAt = now.getTime() + EMAIL_CODE_TTL_MS
  const token = signEmailCode(deps.codeSecret, { email: input.email, code, expiresAt })
  try {
    // Idempotent on the ticket: a retried request that already delivered sends no second copy.
    await deps.mailer.send({ to: input.email, ...emailVerificationCode(code, EMAIL_CODE_TTL_MINUTES), idempotencyKey: `email-code/${token}` })
  } catch (err) {
    log.error({ err }, 'verification code could not be sent')
    if (err instanceof PermanentFailure) throw new ApiError(500, `email provider refused the send: ${err.message}`)
    throw new ApiError(503, 'email provider unavailable', undefined, { 'retry-after': '30' })
  }
  return { token, expiresAt }
}

export function confirmEmailCode(input: EmailCodeVerify, deps: EmailCodeDeps): { verified: true } {
  const now = (deps.now ?? (() => new Date()))()
  const check = checkEmailCode(deps.codeSecret, input, now)
  if (check !== 'ok') throw new ApiError(400, `email code ${check}`, { code: [EMAIL_CODE_MESSAGES[check]] })
  return { verified: true }
}
