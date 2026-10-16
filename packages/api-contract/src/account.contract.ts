/**
 * The signed-in user's own sign-in details (api-review U5d): Account Settings for workers, clients and coordinators.
 *
 * Decisions (user, 2026-10-16): no current password and no email confirmation are asked for; an admin impersonating
 * the user cannot change either (403); a password change signs out the user's other sessions -- the api stores
 * `passwordChangedAt`, and the app refuses a session or an api token issued before it.
 */
import * as z from 'zod'
import { accountEmailSchema, accountPasswordSchema } from '@remonta/schemas/schema/workerRegistrationSchema'
import { defineContract } from './define'
import { meta } from './meta'

const json = <S extends z.ZodType>(schema: S): { kind: 'json'; schema: S } => ({ kind: 'json', schema })

/** A change to the caller's own sign-in details: few per minute, audited with its own action. */
const accountWrite = (audit: 'EMAIL_CHANGE' | 'PASSWORD_CHANGE') =>
  meta({
    access: { roles: ['WORKER', 'CLIENT', 'COORDINATOR'] },
    bot: 'none',
    rateLimit: [
      { per: 'user', limit: 5, window: '1m' },
      { per: 'ip', limit: 20, window: '1m' },
    ],
    maxBodyKb: 2,
    audit,
  })

export const accountEmailBodySchema = z.strictObject({ email: accountEmailSchema })
export type AccountEmailBody = z.output<typeof accountEmailBodySchema>
export const accountPasswordBodySchema = z.strictObject({ password: accountPasswordSchema })
export type AccountPasswordBody = z.output<typeof accountPasswordBodySchema>

export const accountContract = defineContract('account', {
  putEmail: {
    method: 'PUT',
    path: '/v1/account/email',
    summary: "Change the caller's sign-in email (409 when another account has it; 403 while impersonated).",
    body: json(accountEmailBodySchema),
    responses: { 200: z.strictObject({ email: z.string().max(254) }) },
    meta: accountWrite('EMAIL_CHANGE'),
  },
  putPassword: {
    method: 'PUT',
    path: '/v1/account/password',
    summary: "Change the caller's password (the sign-up's rules and breach check; 403 while impersonated). Sessions and tokens issued before the change are refused.",
    body: json(accountPasswordBodySchema),
    responses: { 200: z.strictObject({ passwordChangedAt: z.iso.datetime({ offset: true }) }) },
    meta: accountWrite('PASSWORD_CHANGE'),
  },
})
