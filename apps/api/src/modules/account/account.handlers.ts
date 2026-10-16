// The signed-in user's own sign-in details (api-review U5d): Account Settings for workers, clients and coordinators.
// Replaces the app's updateUserEmail / updateUserPassword actions.
//
// Decisions (user, 2026-10-16): no current password and no email confirmation; an admin impersonating the user is
// refused (403); a password change stores `passwordChangedAt`, which the app compares with the age of a session and of
// an api token, so the user's other devices are signed out. A password change also voids any outstanding reset link.
import { accountContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import { ApiError } from '../../platform/errors'
import { Prisma, unitOfWork, type Db } from '../../platform/persistence/db'
import type { PasswordHasher } from '../../platform/security/password-hasher'
import type { BreachedPasswordChecker } from '../registration/adapters/pwned-passwords'

export interface AccountModuleDeps {
  db: Db
  clock: Clock
  hasher: PasswordHasher
  breaches: BreachedPasswordChecker
}

export const NOT_WHILE_IMPERSONATING = "Sign-in details can only be changed by the account's owner, not while impersonating."
export const EMAIL_TAKEN = 'This email is already in use by another account.'
export const BREACHED_PASSWORD = 'This password has appeared in a data breach. Please choose a different one.'

const notImpersonating = (principal: { impersonatorId?: string }) => {
  if (principal.impersonatorId) throw new ApiError(403, 'account change while impersonating', { general: [NOT_WHILE_IMPERSONATING] })
}

export function accountHandlers(deps: AccountModuleDeps) {
  return defineHandlers(accountContract, {
    putEmail: async (req, ctx) => {
      const principal = ctx.principal!
      notImpersonating(principal)
      const email = req.body.email
      try {
        return await unitOfWork(deps.db, async (tx) => {
          const user = await tx.user.findUnique({ where: { id: principal.userId }, select: { email: true } })
          if (!user) throw new ApiError(404, 'account not found')
          if (user.email === email) {
            ctx.audit.skip('the same email')
            return { status: 200 as const, body: { email } }
          }
          const taken = await tx.user.findUnique({ where: { email }, select: { id: true } })
          if (taken) throw new ApiError(409, 'email taken', { email: [EMAIL_TAKEN] })
          await tx.user.update({ where: { id: principal.userId }, data: { email, updatedAt: deps.clock() }, select: { id: true } })
          await ctx.audit.record(tx, { action: 'EMAIL_CHANGE', userId: principal.userId, metadata: { from: user.email, to: email } })
          return { status: 200 as const, body: { email } }
        })
      } catch (err) {
        // Two accounts taking the same address at once: the unique index decides.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw new ApiError(409, 'email taken (race)', { email: [EMAIL_TAKEN] })
        throw err
      }
    },

    putPassword: async (req, ctx) => {
      const principal = ctx.principal!
      notImpersonating(principal)
      const breach = await deps.breaches.check(req.body.password)
      if (breach.status === 'breached') throw new ApiError(400, 'breached password', { password: [BREACHED_PASSWORD] })
      if (breach.status === 'unknown') ctx.log.warn({ reason: breach.reason }, 'breached-password check unavailable; accepted')
      const passwordHash = await deps.hasher.hash(req.body.password)
      // Whole seconds: the app compares it with a token's issue time, which is in seconds.
      const now = new Date(Math.floor(deps.clock().getTime() / 1000) * 1000)
      return unitOfWork(deps.db, async (tx) => {
        const updated = await tx.user.updateMany({
          where: { id: principal.userId },
          data: { passwordHash, passwordChangedAt: now, resetPasswordToken: null, resetPasswordExpires: null, updatedAt: now },
        })
        if (updated.count === 0) throw new ApiError(404, 'account not found')
        await ctx.audit.record(tx, { action: 'PASSWORD_CHANGE', userId: principal.userId })
        return { status: 200 as const, body: { passwordChangedAt: now.toISOString() } }
      })
    },
  })
}
