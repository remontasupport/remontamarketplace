// admin-clients U1 (BR-8, D3): the n8n body mirrors the client's routes per status, marked admin; the handler sends it
// through the safe client, retries what may recover, gives up on what will not, and sends nothing when off.
import { describe, expect, it, vi } from 'vitest'
import type { FastifyBaseLogger } from 'fastify'
import { serviceRequestWebhookHandler, webhookBodyOf, type WebhookRequest } from '../../src/modules/admin/outbox/service-request-webhook'
import { SERVICE_REQUEST_STATUS_CHANGED } from '../../src/modules/admin/domain/events'
import { PermanentFailure } from '../../src/platform/errors'
import type { HttpResult, SafeHttpClient } from '../../src/platform/http/safe-http-client'
import type { Db } from '../../src/platform/persistence/db'

const request = (status: WebhookRequest['status']): WebhookRequest => ({
  id: 'sr_1',
  requesterId: 'u_client',
  participantId: 'p_1',
  zohoRecordId: 'zoho_9',
  status,
  services: { 'support-worker': { categoryName: 'Support Worker', subCategories: [] } },
  details: { description: 'Weekly shopping' },
  location: 'Parramatta NSW 2150',
  participant: { firstName: 'Pat', lastName: 'Lee', dateOfBirth: null, gender: null, relationshipToClient: 'Son', fundingType: 'NDIS', conditions: ['Autism'], additionalInfo: null },
})

describe('webhookBodyOf (D3)', () => {
  it('sends Cancel and Archive as the client buttons do, marked admin', () => {
    expect(webhookBodyOf(request('CANCELLED'))).toEqual({ action: 'Cancel', zohoRecordId: 'zoho_9', changedBy: 'admin' })
    expect(webhookBodyOf(request('ARCHIVED'))).toEqual({ action: 'Archive', zohoRecordId: 'zoho_9', changedBy: 'admin' })
  })

  it('sends any other status as the client Edit, with the request and participant fields', () => {
    for (const status of ['PENDING', 'MATCHING', 'MATCHED', 'ACTIVE', 'COMPLETED'] as const) {
      expect(webhookBodyOf(request(status))).toMatchObject({ action: 'Edit', status, serviceRequestId: 'sr_1', userId: 'u_client', participantId: 'p_1', firstName: 'Pat', conditions: ['Autism'], changedBy: 'admin' })
    }
  })
})

describe('serviceRequestWebhookHandler', () => {
  const log = { warn: vi.fn() } as unknown as FastifyBaseLogger
  const db = { serviceRequest: { findUnique: vi.fn(async () => request('ACTIVE')) } } as unknown as Db
  const event = { id: 'ev_1', type: SERVICE_REQUEST_STATUS_CHANGED, payload: { serviceRequestId: 'sr_1', adminUserId: 'u_admin' }, attempts: 0 }
  const httpAnswering = (result: HttpResult<undefined>) => {
    const request = vi.fn(async () => result)
    return { http: { request } as unknown as SafeHttpClient, request }
  }
  const URL_ON = 'https://flows.example.test/sr'
  const run = (http: SafeHttpClient, url: string | undefined = URL_ON) =>
    serviceRequestWebhookHandler({ db, http, url, log })(event as never, new AbortController().signal)

  it('posts the body as JSON to the configured URL', async () => {
    const { http, request: sent } = httpAnswering({ ok: true, status: 200, data: undefined })
    await run(http)
    expect(sent).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST', url: 'https://flows.example.test/sr' }))
    expect(JSON.parse((sent.mock.calls[0] as unknown as [{ body: string }])[0].body)).toMatchObject({ action: 'Edit', changedBy: 'admin' })
  })

  it('sends nothing when off', async () => {
    const { http, request: sent } = httpAnswering({ ok: true, status: 200, data: undefined })
    await serviceRequestWebhookHandler({ db, http, url: undefined, log })(event as never, new AbortController().signal)
    expect(sent).not.toHaveBeenCalled()
  })

  it('retries a 5xx, a 429 and a timeout; gives up on another 4xx and a blocked host', async () => {
    for (const error of [{ kind: 'status', status: 503 }, { kind: 'status', status: 429 }, { kind: 'timeout' }] as const) {
      const err = await run(httpAnswering({ ok: false, error }).http).catch((e: unknown) => e)
      expect(err, JSON.stringify(error)).toBeInstanceOf(Error)
      expect(err, JSON.stringify(error)).not.toBeInstanceOf(PermanentFailure)
    }
    for (const error of [{ kind: 'status', status: 404 }, { kind: 'blocked', reason: 'host' }] as const) {
      await expect(run(httpAnswering({ ok: false, error }).http), JSON.stringify(error)).rejects.toBeInstanceOf(PermanentFailure)
    }
  })

  it('gives up on a malformed payload', async () => {
    const handler = serviceRequestWebhookHandler({ db, http: httpAnswering({ ok: true, status: 200, data: undefined }).http, url: 'https://flows.example.test/sr', log })
    await expect(handler({ ...event, payload: {} } as never, new AbortController().signal)).rejects.toBeInstanceOf(PermanentFailure)
  })
})
