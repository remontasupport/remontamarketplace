// Outbox handlers for the sign-up emails (S1-design 3.5). Payloads carry ids only;
// the address and name are read at send time, so no personal data sits in the
// outbox. Each send is idempotent on the event id.
import * as z from 'zod'
import type { Mailer } from '../../platform/email/mailer'
import { PermanentFailure, type OutboxEvent, type OutboxHandler } from '../../platform/outbox/outbox'
import type { Db } from '../../platform/persistence/db'
import { existingAccountNotice, registrationConfirmation } from './templates'

export const WORKER_REGISTERED = 'WorkerRegistered'
export const EXISTING_ACCOUNT_ATTEMPT = 'RegistrationAttemptOnExistingAccount'

const userPayload = z.object({ userId: z.string().min(1) })

export interface NotificationDeps {
  db: Db
  mailer: Mailer
  appBaseUrl: string
}

function payloadOf(event: OutboxEvent) {
  const p = userPayload.safeParse(event.payload)
  if (!p.success) throw new PermanentFailure(`${event.type} ${event.id}: malformed payload`)
  return p.data
}

async function recipient(db: Db, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, createdAt: true, status: true, workerProfile: { select: { firstName: true } } },
  })
  if (!user) throw new PermanentFailure(`user ${userId} no longer exists`)
  return user
}

export function notificationHandlers(deps: NotificationDeps): Map<string, OutboxHandler> {
  return new Map<string, OutboxHandler>([
    [
      WORKER_REGISTERED,
      async (event) => {
        const { userId } = payloadOf(event)
        const user = await recipient(deps.db, userId)
        const mail = registrationConfirmation(user.workerProfile?.firstName ?? 'there', deps.appBaseUrl)
        await deps.mailer.send({ to: user.email, ...mail, idempotencyKey: `registration-confirmation/${event.id}` })
      },
    ],
    [
      EXISTING_ACCOUNT_ATTEMPT,
      async (event) => {
        const { userId } = payloadOf(event)
        const user = await recipient(deps.db, userId)
        // Whether to notify at all (once per 10 minutes; not for the owner's own
        // retry) was decided when the event was queued -- see register-worker.ts.
        const mail = existingAccountNotice(user.workerProfile?.firstName ?? 'there', deps.appBaseUrl)
        await deps.mailer.send({ to: user.email, ...mail, idempotencyKey: `existing-account-notice/${event.id}` })
      },
    ],
  ])
}
