// worker-zoho-sync U1: an Account Details change is detected either way (FR-1), and the handler tells n8n the worker's
// current value with the identifiers it matches Zoho on (FR-2), sends nothing when off (FR-4), and leaves retries to
// the shared webhook post (FR-3, its split is proven in admin/service-request-webhook.test.ts).
import { describe, expect, it, vi } from 'vitest'
import fc from 'fast-check'
import type { FastifyBaseLogger } from 'fastify'
import { accountDetailsBodyOf, accountDetailsWebhookHandler, type WebhookWorker } from '../../src/modules/worker/outbox/account-details-webhook'
import { WORKER_ACCOUNT_DETAILS_CHANGED } from '../../src/modules/worker/domain/events'
import { accountDetailsChanged } from '../../src/modules/worker/domain/persist-completion'
import { PermanentFailure } from '../../src/platform/errors'
import type { HttpResult, SafeHttpClient } from '../../src/platform/http/safe-http-client'
import type { Db } from '../../src/platform/persistence/db'

const flags = (accountDetails: boolean) => ({ accountDetails, compliance: false, trainings: true, services: false })

describe('accountDetailsChanged (FR-1)', () => {
  it('is true exactly when the stored flag (anything not true is false) differs from the next one', () => {
    const stored = fc.oneof(fc.constant(null), fc.constant('junk'), fc.record({ accountDetails: fc.oneof(fc.boolean(), fc.constant('true'), fc.constant(1)), compliance: fc.boolean() }))
    fc.assert(
      fc.property(stored, fc.boolean(), (s, next) => {
        const was = !!s && typeof s === 'object' && s.accountDetails === true
        expect(accountDetailsChanged(s, flags(next))).toBe(was !== next)
      }),
    )
  })

  it('ignores the other three flags', () => {
    expect(accountDetailsChanged({ accountDetails: true, compliance: false }, { accountDetails: true, compliance: true, trainings: true, services: true })).toBe(false)
  })
})

const worker = (setupProgress: unknown, zohoLeadId: string | null = '12345'): WebhookWorker => ({
  id: 'wp_1',
  userId: 'u_1',
  firstName: 'Sam',
  lastName: 'Ng',
  zohoLeadId,
  setupProgress: setupProgress as WebhookWorker['setupProgress'],
  user: { email: 'sam@example.test' },
})

describe('accountDetailsBodyOf (FR-2)', () => {
  it('carries the current flag and the identifiers n8n matches Zoho on', () => {
    expect(accountDetailsBodyOf('ev_1', worker({ accountDetails: true }))).toEqual({
      event: WORKER_ACCOUNT_DETAILS_CHANGED,
      eventId: 'ev_1',
      accountDetails: true,
      workerProfileId: 'wp_1',
      userId: 'u_1',
      email: 'sam@example.test',
      firstName: 'Sam',
      lastName: 'Ng',
      zohoLeadId: '12345',
    })
    expect(accountDetailsBodyOf('ev_2', worker(null, null))).toMatchObject({ accountDetails: false, zohoLeadId: null })
  })
})

describe('accountDetailsWebhookHandler', () => {
  const log = { warn: vi.fn() } as unknown as FastifyBaseLogger
  const event = { id: 'ev_1', type: WORKER_ACCOUNT_DETAILS_CHANGED, payload: { workerProfileId: 'wp_1' }, attempts: 0 }
  const dbWith = (w: WebhookWorker | null) => ({ workerProfile: { findUnique: vi.fn(async () => w) } }) as unknown as Db
  const httpAnswering = (result: HttpResult<undefined>) => {
    const request = vi.fn(async () => result)
    return { http: { request } as unknown as SafeHttpClient, request }
  }
  const OK = { ok: true, status: 200, data: undefined } as const
  const URL_ON = 'https://flows.example.test/wp'
  const run = (db: Db, http: SafeHttpClient, url: string | null = URL_ON, payload: unknown = event.payload) =>
    accountDetailsWebhookHandler({ db, http, url: url ?? undefined, log })({ ...event, payload } as never, new AbortController().signal)

  it('posts the body read at send time to the configured URL', async () => {
    const { http, request } = httpAnswering(OK)
    await run(dbWith(worker({ accountDetails: false })), http)
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: 'POST', url: 'https://flows.example.test/wp' }))
    expect(JSON.parse((request.mock.calls[0] as unknown as [{ body: string }])[0].body)).toMatchObject({ eventId: 'ev_1', accountDetails: false, email: 'sam@example.test' })
  })

  it('sends nothing when off', async () => {
    const { http, request } = httpAnswering(OK)
    await run(dbWith(worker({ accountDetails: true })), http, null)
    expect(request).not.toHaveBeenCalled()
  })

  it('retries a 5xx; gives up on a 404, a malformed payload and a deleted worker', async () => {
    const err = await run(dbWith(worker({})), httpAnswering({ ok: false, error: { kind: 'status', status: 502 } }).http).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err).not.toBeInstanceOf(PermanentFailure)
    await expect(run(dbWith(worker({})), httpAnswering({ ok: false, error: { kind: 'status', status: 404 } }).http)).rejects.toBeInstanceOf(PermanentFailure)
    await expect(run(dbWith(worker({})), httpAnswering(OK).http, URL_ON, {})).rejects.toBeInstanceOf(PermanentFailure)
    await expect(run(dbWith(null), httpAnswering(OK).http)).rejects.toBeInstanceOf(PermanentFailure)
  })
})
