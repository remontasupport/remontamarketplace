// admin-clients U1 (BR-8, D3): an admin's status change, told to the n8n workflow the client's own changes reach
// (Vercel's Cancel_Archive_Webhook), so Zoho stays in step. The body mirrors what the client's routes send for the
// same status, plus `changedBy: 'admin'`. Built from the rows as they are at send time: the outbox holds ids only.
// Delivery is the dispatcher's (retries with backoff, then DEAD); the POST and its failure split are postWebhook's.
import type { FastifyBaseLogger } from 'fastify'
import { PermanentFailure } from '../../../platform/errors'
import type { SafeHttpClient } from '../../../platform/http/safe-http-client'
import type { OutboxEvent, OutboxHandler } from '../../../platform/outbox/outbox'
import { postWebhook } from '../../../platform/outbox/webhook'
import type { Db, Prisma } from '../../../platform/persistence/db'
import { serviceRequestStatusChangedPayload } from '../domain/events'

const REQUEST_SELECT = {
  id: true,
  requesterId: true,
  participantId: true,
  zohoRecordId: true,
  status: true,
  services: true,
  details: true,
  location: true,
  participant: {
    select: { firstName: true, lastName: true, dateOfBirth: true, gender: true, relationshipToClient: true, fundingType: true, conditions: true, additionalInfo: true },
  },
} satisfies Prisma.ServiceRequestSelect

export type WebhookRequest = Prisma.ServiceRequestGetPayload<{ select: typeof REQUEST_SELECT }>

/** D3: Cancel and Archive as the client's buttons send them; any other status as the client's Save Changes (Edit). */
export function webhookBodyOf(r: WebhookRequest): Record<string, unknown> {
  const zohoRecordId = r.zohoRecordId ?? null
  if (r.status === 'CANCELLED') return { action: 'Cancel', zohoRecordId, changedBy: 'admin' }
  if (r.status === 'ARCHIVED') return { action: 'Archive', zohoRecordId, changedBy: 'admin' }
  const p = r.participant
  return {
    action: 'Edit',
    zohoRecordId,
    userId: r.requesterId,
    serviceRequestId: r.id,
    services: r.services,
    location: r.location,
    details: r.details,
    status: r.status,
    participantId: r.participantId,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    gender: p.gender,
    relationshipToClient: p.relationshipToClient,
    fundingType: p.fundingType,
    conditions: p.conditions,
    additionalInfo: p.additionalInfo,
    changedBy: 'admin',
  }
}

export interface ServiceRequestWebhookDeps {
  db: Db
  http: SafeHttpClient
  /** Absent (staging: `off`): the event completes with a warning, nothing is sent (NFR-6). */
  url: string | undefined
  log: FastifyBaseLogger
}

export function serviceRequestWebhookHandler(deps: ServiceRequestWebhookDeps): OutboxHandler {
  return async (event: OutboxEvent) => {
    const p = serviceRequestStatusChangedPayload.safeParse(event.payload)
    if (!p.success) throw new PermanentFailure(`${event.type} ${event.id}: malformed payload`)
    if (!deps.url) {
      deps.log.warn({ eventId: event.id, serviceRequestId: p.data.serviceRequestId }, 'service request webhook off: nothing sent')
      return
    }
    const request = await deps.db.serviceRequest.findUnique({ where: { id: p.data.serviceRequestId }, select: REQUEST_SELECT })
    if (!request) throw new PermanentFailure(`service request ${p.data.serviceRequestId} no longer exists`)
    await postWebhook(deps.http, deps.url, webhookBodyOf(request), 'service request')
  }
}
