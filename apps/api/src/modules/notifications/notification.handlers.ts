// Outbox handlers for the sign-up emails (S1-design 3.5). Payloads carry ids only;
// the address and name are read at send time, so no personal data sits in the
// outbox. Each send is idempotent on the event id.
import type * as z from 'zod'
import type { Mailer } from '../../platform/email/mailer'
import { PermanentFailure } from '../../platform/errors'
import type { OutboxEvent, OutboxHandler } from '../../platform/outbox/outbox'
import type { Db } from '../../platform/persistence/db'
import { EXISTING_ACCOUNT_ATTEMPT, existingAccountAttemptPayload, WORKER_REGISTERED, workerRegisteredPayload } from '../registration/domain/events'
import { existingAccountNotice, registrationConfirmation, type RenderedEmail } from './templates'

export interface NotificationDeps {
  db: Db
  mailer: Mailer
  appBaseUrl: string
}

function payloadOf<S extends z.ZodType>(event: OutboxEvent, schema: S): z.output<S> {
  const p = schema.safeParse(event.payload)
  if (!p.success) throw new PermanentFailure(`${event.type} ${event.id}: malformed payload`)
  return p.data
}

async function recipient(db: Db, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, workerProfile: { select: { firstName: true } } } })
  if (!user) throw new PermanentFailure(`user ${userId} no longer exists`)
  return { email: user.email, firstName: user.workerProfile?.firstName ?? 'there' }
}

/**
 * One email to the account named in the payload, idempotent on the event: a retry
 * after a delivered send sends no second copy (the mailer's idempotency key).
 */
function emailToUser<S extends z.ZodType<{ userId: string }>>(
  deps: NotificationDeps,
  payload: S,
  render: (firstName: string, appBaseUrl: string) => RenderedEmail,
  keyPrefix: string,
): OutboxHandler {
  return async (event) => {
    const { userId } = payloadOf(event, payload)
    const to = await recipient(deps.db, userId)
    await deps.mailer.send({ to: to.email, ...render(to.firstName, deps.appBaseUrl), idempotencyKey: `${keyPrefix}/${event.id}` })
  }
}

export function notificationHandlers(deps: NotificationDeps): Map<string, OutboxHandler> {
  return new Map<string, OutboxHandler>([
    [WORKER_REGISTERED, emailToUser(deps, workerRegisteredPayload, registrationConfirmation, 'registration-confirmation')],
    // Whether to notify at all (once per 10 minutes; not for the owner's own retry)
    // was decided when the event was queued: registration/application/existing-account.ts.
    [EXISTING_ACCOUNT_ATTEMPT, emailToUser(deps, existingAccountAttemptPayload, existingAccountNotice, 'existing-account-notice')],
  ])
}
