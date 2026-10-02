// A sign-up with an email that already has an account (S1-design 3.5): nothing
// changes, and the owner is told someone tried -- at most once per window, and not
// when it is the browser retrying its own sign-up seconds after it succeeded (R5).
//
// Decided here, when queueing, rather than in the email handler: a handler that
// counted before sending would lose the notice if the send failed and was retried.
// A per-account advisory lock makes simultaneous attempts queue one notice.
import { enqueue, queuedSince } from '../../../platform/outbox/outbox'
import { unitOfWork, type Db } from '../../../platform/persistence/db'
import { EXISTING_ACCOUNT_ATTEMPT, type ExistingAccountAttemptPayload } from '../domain/events'

/** At most one "someone tried" notice per account in this window. */
export const EXISTING_ACCOUNT_NOTICE_WINDOW_MS = 10 * 60_000

export async function noticeExistingAccount(db: Db, userId: string, now: Date): Promise<void> {
  await unitOfWork(db, async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'existing-account-notice:' + userId}))`
    const since = new Date(now.getTime() - EXISTING_ACCOUNT_NOTICE_WINDOW_MS)
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } })
    if (user.createdAt > since) return // R5: the owner's own retry
    if (await queuedSince(tx, EXISTING_ACCOUNT_ATTEMPT, 'userId', userId, since)) return
    const payload: ExistingAccountAttemptPayload = { userId }
    await enqueue(tx, { type: EXISTING_ACCOUNT_ATTEMPT, payload }, now)
  })
}
