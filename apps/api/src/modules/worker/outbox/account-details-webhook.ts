// worker-zoho-sync U1 (FR-2..FR-4): a change of the worker's Account Details flag, told to the n8n workflow that finds
// the worker's Zoho record (D1: n8n decides, by zohoLeadId or email) and sets one status field (D3). The body is built
// from the rows at send time, so `accountDetails` is the current value, never a stale one (a quick true -> false -> true
// sends the current state twice). `eventId` is the idempotency key: a retry can deliver the same event twice.
import type { FastifyBaseLogger } from 'fastify'
import { PermanentFailure } from '../../../platform/errors'
import type { SafeHttpClient } from '../../../platform/http/safe-http-client'
import type { OutboxEvent, OutboxHandler } from '../../../platform/outbox/outbox'
import { postWebhook } from '../../../platform/outbox/webhook'
import type { Db, Prisma } from '../../../platform/persistence/db'
import { parseStoredFlags } from '../domain/persist-completion'
import { WORKER_ACCOUNT_DETAILS_CHANGED, workerAccountDetailsChangedPayload } from '../domain/events'

const WORKER_SELECT = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  zohoLeadId: true,
  setupProgress: true,
  user: { select: { email: true } },
} satisfies Prisma.WorkerProfileSelect

export type WebhookWorker = Prisma.WorkerProfileGetPayload<{ select: typeof WORKER_SELECT }>

/** The body n8n receives (the workflow's contract; docs/worker/README.md). */
export function accountDetailsBodyOf(eventId: string, w: WebhookWorker): Record<string, unknown> {
  return {
    event: WORKER_ACCOUNT_DETAILS_CHANGED,
    eventId,
    accountDetails: parseStoredFlags(w.setupProgress).accountDetails,
    workerProfileId: w.id,
    userId: w.userId,
    email: w.user.email,
    firstName: w.firstName,
    lastName: w.lastName,
    zohoLeadId: w.zohoLeadId ?? null,
  }
}

export interface AccountDetailsWebhookDeps {
  db: Db
  http: SafeHttpClient
  /** Absent (staging: `off`): the event completes with a warning, nothing is sent (FR-4). */
  url: string | undefined
  log: FastifyBaseLogger
}

export function accountDetailsWebhookHandler(deps: AccountDetailsWebhookDeps): OutboxHandler {
  return async (event: OutboxEvent) => {
    const p = workerAccountDetailsChangedPayload.safeParse(event.payload)
    if (!p.success) throw new PermanentFailure(`${event.type} ${event.id}: malformed payload`)
    if (!deps.url) {
      deps.log.warn({ eventId: event.id, workerProfileId: p.data.workerProfileId }, 'worker profile webhook off: nothing sent')
      return
    }
    const worker = await deps.db.workerProfile.findUnique({ where: { id: p.data.workerProfileId }, select: WORKER_SELECT })
    if (!worker) throw new PermanentFailure(`worker profile ${p.data.workerProfileId} no longer exists`)
    await postWebhook(deps.http, deps.url, accountDetailsBodyOf(event.id, worker), 'worker profile')
  }
}
