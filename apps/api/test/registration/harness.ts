// The registration area on the local PostGIS database, for suites that drive it
// over HTTP: the real pipeline, handlers, transaction and hasher (cost 4); fakes
// for the CAPTCHA, the rate limiter, the breached-password service and the mailer.
import { randomUUID } from 'node:crypto'
import { contracts, platformContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { CONSENT_WORDING_VERSION } from '@remonta/schemas/schema/workerRegistrationSchema'
import { expect } from 'vitest'
import { LocalityDirectory } from '../../src/modules/localities/locality-directory'
import type { PhotoStore } from '../../src/modules/registration/adapters/photo-store'
import { InMemoryPhotoStore } from './fakes'
import { registrationHandlers } from '../../src/modules/registration/registration.handlers'
import type { Email } from '../../src/platform/email/mailer'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { WorkerPoolHasher } from '../../src/platform/security/password-hasher'
import { testApp, unreachableHandlers, type TestApp } from '../helpers'

export const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9])

export interface RegistrationHarness {
  db: Db
  t: TestApp
  sent: Email[]
  parramatta: { id: number }
  email(): string
  /** A complete, valid sign-up body for a fresh address; `patch` overrides any field. */
  body(patch?: Record<string, unknown>): Promise<Record<string, unknown>>
  register(payload: unknown, init?: { headers?: Record<string, string> }): Promise<Awaited<ReturnType<TestApp['fastify']['inject']>>>
  stagedPhotoId(): Promise<string>
  verifiedEmail(email: string): Promise<{ token: string; expiresAt: number; code: string }>
  close(): Promise<void>
}

export interface HarnessOptions {
  /** The bucket the direct upload uses (U3); in-memory unless a suite passes the real adapter against the fake server. */
  bucket?: PhotoStore
  publicBaseUrl?: string
  /** Stands in for the browser's upload to the bucket; defaults to the in-memory store's. A suite on the real adapter passes its own. */
  putAsBrowser?: (key: string, data: Buffer, contentType: string) => Promise<void>
}

/** `domain` isolates this suite's rows: everything it creates is deleted by close(). */
export async function registrationHarness(domain: string, options: HarnessOptions = {}): Promise<RegistrationHarness> {
  const url = process.env.TEST_DATABASE_URL!
  const db = createDb(url)
  const bucket = options.bucket ?? new InMemoryPhotoStore()
  const publicBaseUrl = options.publicBaseUrl ?? 'http://bucket.test/photos'
  const putAsBrowser =
    options.putAsBrowser ??
    (async (key: string, data: Buffer, contentType: string) => {
      if (!(bucket instanceof InMemoryPhotoStore)) throw new Error('registrationHarness: pass putAsBrowser for a bucket that is not the in-memory store')
      bucket.putAsBrowser(key, data, contentType)
    })
  const hasher = new WorkerPoolHasher({ threads: 2, cost: 4 })
  const sent: Email[] = []
  const prefix = `${domain}-`

  async function cleanup() {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${domain}` } }, select: { id: true } })
    const ids = users.map((u) => u.id)
    await db.$executeRaw`DELETE FROM outbox_events WHERE payload->>'userId' = ANY(${ids}::text[])`
    await db.auditLog.deleteMany({ where: { userId: { in: ids } } })
    await db.user.deleteMany({ where: { id: { in: ids } } })
    await db.$executeRaw`DELETE FROM outbox_events WHERE type = 'PhotoUploaded' AND payload->>'photoUploadId' IN (SELECT id::text FROM registration_photo_uploads WHERE url LIKE ${publicBaseUrl + '/%'})`
    await db.registrationPhotoUpload.deleteMany({ where: { url: { startsWith: `${publicBaseUrl}/` } } })
    await db.subcategory.deleteMany({ where: { id: { startsWith: prefix } } })
    await db.category.deleteMany({ where: { id: { startsWith: prefix } } })
  }
  await cleanup()
  await db.category.create({ data: { id: `${prefix}support`, name: 'Harness Support', subcategories: { create: [{ id: `${prefix}care`, name: 'Harness Care' }] } } })
  const parramatta = await db.auLocality.findFirstOrThrow({ where: { searchName: 'parramatta', postcode: '2150', retiredAt: null }, select: { id: true } })

  const handlers = registrationHandlers({
    db,
    hasher,
    breaches: { check: async () => ({ status: 'clear' }) },
    localities: new LocalityDirectory(db),
    bucket,
    publicBaseUrl,
    ipHashSecret: 'test-secret-'.repeat(4),
    mailer: { send: async (e) => (sent.push(e), { id: `msg_${sent.length}` }) },
    codeSecret: 'code-secret-'.repeat(4),
  })
  const t = await testApp({
    contracts,
    handlerSets: [unreachableHandlers(platformContract), handlers],
    publicEndpoints: publicEndpoints as PublicEndpoint[],
  })

  const email = () => `worker-${randomUUID().slice(0, 8)}@${domain}`
  /** The direct upload as the browser does it: a ticket, the object under the ticket's key, confirm. */
  async function stagedPhotoId() {
    const ticket = await t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/photo-tickets', payload: { contentType: 'image/jpeg', sizeBytes: JPEG.byteLength } })
    expect(ticket.statusCode).toBe(201)
    const { photoUploadId, upload } = ticket.json() as { photoUploadId: string; upload: { fields: Record<string, string> } }
    await putAsBrowser(upload.fields.key!, JPEG, 'image/jpeg')
    const confirm = await t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/photo-confirmations', payload: { photoUploadId } })
    expect(confirm.statusCode).toBe(200)
    return photoUploadId
  }
  async function verifiedEmail(to: string) {
    const res = await t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/email-codes', payload: { email: to, captchaToken: 'test-token' } })
    expect(res.statusCode).toBe(202)
    const { token, expiresAt } = res.json() as { token: string; expiresAt: number }
    const code = /\b([0-9]{6})\b/.exec(sent.at(-1)!.text)![1]!
    expect((await t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/email-codes/verify', payload: { email: to, code, token, expiresAt } })).statusCode).toBe(200)
    return { token, expiresAt, code }
  }
  const body = async (patch: Record<string, unknown> = {}) => {
    const e = (patch.email as string | undefined) ?? email()
    return {
      localityId: parramatta.id,
      firstName: 'Mary',
      lastName: "O'Connor",
      email: e,
      emailVerification: await verifiedEmail(e),
      mobile: '0412 345 678',
      password: 'Str0ng!pass',
      services: [`${prefix}support`],
      supportWorkerCategories: [`${prefix}care`],
      photoUploadId: (patch.photoUploadId as string | undefined) ?? (await stagedPhotoId()),
      consentProfileShare: true,
      consentWordingVersion: CONSENT_WORDING_VERSION,
      captchaToken: 'test-token',
      ...patch,
    }
  }
  const register = async (payload: unknown, init: { headers?: Record<string, string> } = {}) =>
    await t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker', payload: payload as never, headers: init.headers })

  return {
    db, t, sent, parramatta, email, body, register, stagedPhotoId, verifiedEmail,
    close: async () => {
      await t.close()
      await cleanup()
      await hasher.close()
      await db.$disconnect()
    },
  }
}
