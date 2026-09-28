// Sending and checking a sign-up email code (S1 step 13).
//
//   R1 no enumeration: the send never looks at `users`; every address gets a code
//      and the same 202. An existing email verifies like a new one and meets the
//      R1 branch at sign-up.
//   Synchronous send, not the outbox: the code exists only in this call. A
//      provider failure is a 503 the form retries; nothing is left behind.
import type { EmailCodeRequest, EmailCodeTicket, EmailCodeVerify } from '@remonta/schemas/schema/workerRegistrationSchema'
import type { FastifyBaseLogger } from 'fastify'
import type { Mailer } from '../../../platform/email/mailer'
import { ApiError } from '../../../platform/errors'
import { emailVerificationCode } from '../../notifications/templates'
import { checkEmailCode, EMAIL_CODE_TTL_MINUTES, EMAIL_CODE_TTL_MS, newEmailCode, signEmailCode, type EmailCodeCheck } from '../domain/email-code'

export interface EmailCodeDeps {
  mailer: Mailer
  /** Signs the tickets. Rotating it invalidates codes in flight (10 minutes at most). */
  codeSecret: string
  now?: () => Date
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
