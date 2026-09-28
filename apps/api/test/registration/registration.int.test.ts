// The registration area end to end on PostGIS: HTTP in, rows out. The real
// pipeline, handlers, transaction and hasher (cost 4 to keep the suite fast); fakes
// only for the CAPTCHA, the rate limiter and the breached-password service.
// Runs only when TEST_DATABASE_URL points at localhost.
import { randomUUID } from 'node:crypto'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { contracts, platformContract, type PublicEndpoint } from '@remonta/api-contract'
import publicEndpoints from '@remonta/api-contract/public-endpoints.json'
import { CONSENT_WORDING_VERSION, workerRegistrationSchema } from '@remonta/schemas/schema/workerRegistrationSchema'
import pino from 'pino'
import { registerWorker } from '../../src/modules/registration/application/register-worker'
import bcrypt from 'bcryptjs'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { LocalityDirectory } from '../../src/modules/localities/locality-directory'
import { LocalDiskPhotoStore } from '../../src/modules/registration/adapters/photo-store'
import type { BreachCheck } from '../../src/modules/registration/adapters/pwned-passwords'
import { EMAIL_CODE_MESSAGES } from '../../src/modules/registration/application/email-code'
import { EMAIL_NOT_VERIFIED } from '../../src/modules/registration/application/register-worker'
import { EMAIL_CODE_TTL_MS, signEmailCode } from '../../src/modules/registration/domain/email-code'
import { registrationHandlers } from '../../src/modules/registration/registration.handlers'
import type { Email } from '../../src/platform/email/mailer'
import { PermanentFailure } from '../../src/platform/outbox/outbox'
import type { HandlerSet } from '../../src/platform/contract/handlers'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { WorkerPoolHasher } from '../../src/platform/security/password-hasher'
import { multipart, testApp, unreachableHandlers, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false
if (url && !local) throw new Error('TEST_DATABASE_URL must point at localhost')

const DOMAIN = 's1-test.example'
const CODE_SECRET = 'code-secret-'.repeat(4)
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9])

describe.skipIf(!local)('registration on PostGIS', () => {
  let db: Db
  let t: TestApp
  let photos: string
  let hasher: WorkerPoolHasher
  let hashCalls = 0
  let breach: BreachCheck = { status: 'clear' }
  let parramatta: { id: number; suburb: string; state: string; postcode: string; latitude: number; longitude: number }
  let retiredId: number
  /** Every email the fake provider was asked to send. */
  const sent: Email[] = []
  let mailerDown: false | 'outage' | 'refused' = false

  beforeAll(async () => {
    db = createDb(url!)
    photos = await mkdtemp(join(tmpdir(), 'photos-'))
    hasher = new WorkerPoolHasher({ threads: 2, cost: 4 })
    await cleanup()
    await db.category.create({ data: { id: 'test-support', name: 'Test Support Work', subcategories: { create: [{ id: 'test-personal-care', name: 'Test Personal Care' }] } } })
    await db.category.create({ data: { id: 'test-cleaning', name: 'Test Cleaning', subcategories: { create: [{ id: 'test-windows', name: 'Test Windows' }] } } })
    parramatta = await db.auLocality.findFirstOrThrow({ where: { searchName: 'parramatta', postcode: '2150', retiredAt: null } })
    retiredId = (
      await db.$queryRaw<{ id: number }[]>`
        INSERT INTO au_localities ("localityPid", suburb, "searchName", state, postcode, latitude, longitude, "sourceVersion", "retiredAt", "updatedAt")
        VALUES ('test-retired', 'Oldtown', 'oldtown', 'NSW', '2999', -33, 151, 'test', now(), now()) RETURNING id`
    )[0]!.id

    const counting = { hash: (pw: string) => (hashCalls++, hasher.hash(pw)), verify: (a: string, b: string) => hasher.verify(a, b), close: () => hasher.close() }
    const handlers = registrationHandlers({
      db,
      hasher: counting,
      breaches: { check: async () => breach },
      localities: new LocalityDirectory(db),
      store: new LocalDiskPhotoStore(photos),
      ipHashSecret: 'test-secret-'.repeat(4),
      mailer: {
        send: async (e: Email) => {
          if (mailerDown === 'outage') throw new Error('resend unavailable: timeout')
          if (mailerDown === 'refused') throw new PermanentFailure('resend refused the email: HTTP 403')
          sent.push(e)
          return { id: `msg_${sent.length}` }
        },
      },
      codeSecret: CODE_SECRET,
    })
    t = await testApp({
      contracts,
      handlerSets: [unreachableHandlers(platformContract), handlers as unknown as HandlerSet],
      publicEndpoints: publicEndpoints as PublicEndpoint[],
    })
  })

  afterAll(async () => {
    await t?.close()
    await cleanup()
    await hasher?.close()
    await db?.$disconnect()
    await rm(photos, { recursive: true, force: true })
  })

  async function cleanup() {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } })
    const userIds = users.map((u) => u.id)
    await db.$executeRaw`DELETE FROM outbox_events WHERE payload->>'userId' = ANY(${userIds}::text[])`
    await db.auditLog.deleteMany({ where: { userId: { in: userIds } } })
    await db.user.deleteMany({ where: { id: { in: userIds } } })
    await db.registrationPhotoUpload.deleteMany({ where: { blobKey: { startsWith: 'workers/registration/' }, ipHash: { not: '' }, url: { startsWith: 'local-photo://' } } })
    await db.subcategory.deleteMany({ where: { id: { startsWith: 'test-' } } })
    await db.category.deleteMany({ where: { id: { startsWith: 'test-' } } })
    await db.auLocality.deleteMany({ where: { localityPid: 'test-retired' } })
  }

  async function uploadPhoto(data: Buffer = JPEG, type = 'image/jpeg') {
    const res = await t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/photo', ...multipart([{ name: 'photo', filename: 'me.jpg', type, data }]) })
    return res
  }
  async function stagedPhotoId() {
    const res = await uploadPhoto()
    expect(res.statusCode).toBe(201)
    return res.json().photoUploadId as string
  }
  const email = () => `worker-${randomUUID().slice(0, 8)}@${DOMAIN}`
  const requestCode = (email: string) => t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/email-codes', payload: { email, captchaToken: 'test-token' } })
  const verifyCode = (payload: object) => t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/email-codes/verify', payload })
  const codeIn = (mail: Email) => /\b([0-9]{6})\b/.exec(mail.text)![1]!
  /** Asks for a code, reads it from the email, verifies it: the proof the sign-up carries (S1 step 13). */
  async function verifiedEmail(email: string) {
    const res = await requestCode(email)
    expect(res.statusCode).toBe(202)
    const { token, expiresAt } = res.json() as { token: string; expiresAt: number }
    const code = codeIn(sent.at(-1)!)
    expect((await verifyCode({ email, code, token, expiresAt })).statusCode).toBe(200)
    return { token, expiresAt, code }
  }
  const body = async (patch: Record<string, unknown> = {}) => {
    const e = (patch.email as string | undefined) ?? email()
    return {
      localityId: parramatta.id,
      firstName: ' Mary-Jane ',
      lastName: "O'Connor",
      email: e,
      emailVerification: await verifiedEmail(e),
      mobile: '0412 345 678',
      password: 'Str0ng!pass',
      services: ['test-support', 'test-cleaning'],
      supportWorkerCategories: ['test-personal-care'],
      photoUploadId: await stagedPhotoId(),
      consentProfileShare: true,
      consentWordingVersion: CONSENT_WORDING_VERSION,
      zohoLeadId: '5725767000012345678',
      captchaToken: 'test-token',
      ...patch,
    }
  }
  const register = (payload: object) => t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker', payload })

  describe('photo upload', () => {
    it('stages the photo under a server-generated name and returns only an id', async () => {
      const res = await uploadPhoto()
      expect(res.statusCode).toBe(201)
      expect(Object.keys(res.json())).toEqual(['photoUploadId'])
      const row = await db.registrationPhotoUpload.findUniqueOrThrow({ where: { id: res.json().photoUploadId } })
      expect(row.blobKey).toMatch(/^workers\/registration\/[0-9a-f-]{36}\.jpg$/)
      expect(row).toMatchObject({ contentType: 'image/jpeg', sizeBytes: JPEG.length, claimedAt: null })
      expect(row.ipHash).toMatch(/^[0-9a-f]{64}$/) // never the raw IP
      expect((await readdir(join(photos, 'workers/registration'))).length).toBeGreaterThan(0)
    })

    it('refuses a file whose bytes are not an image, whatever it claims to be', async () => {
      const res = await uploadPhoto(Buffer.from('<html><script>alert(1)</script>'), 'image/jpeg')
      expect(res.statusCode).toBe(415)
      expect(res.json().error.fields).toEqual({ photo: ['Please upload a JPEG, PNG, WebP or HEIC photo'] })
    })
  })

  describe('suburb search', () => {
    it('returns current suburbs only, labelled for the autocomplete', async () => {
      const res = await t.fastify.inject({ method: 'GET', url: '/v1/localities?q=parramatta%202150' })
      expect(res.statusCode).toBe(200)
      expect(res.headers['cache-control']).toBe('public, max-age=3600')
      expect(res.json().localities[0]).toEqual({ id: parramatta.id, suburb: 'Parramatta', state: 'NSW', postcode: '2150', label: 'Parramatta NSW 2150' })
      const old = await t.fastify.inject({ method: 'GET', url: '/v1/localities?q=oldtown' })
      expect(old.json().localities).toEqual([])
    })
  })

  describe('email verification before the password (S1 step 13)', () => {
    it('emails a 6-digit code to the address and answers only a signed ticket -- nothing is stored', async () => {
      const to = email()
      const before = Date.now()
      const res = await requestCode(to)
      expect(res.statusCode).toBe(202)
      const ticket = res.json() as { token: string; expiresAt: number }
      expect(Object.keys(ticket).sort()).toEqual(['expiresAt', 'token'])
      expect(ticket.token).toMatch(/^[0-9a-f]{64}$/)
      expect(ticket.expiresAt).toBeGreaterThanOrEqual(before + EMAIL_CODE_TTL_MS)
      expect(ticket.expiresAt).toBeLessThanOrEqual(Date.now() + EMAIL_CODE_TTL_MS)
      const mail = sent.at(-1)!
      expect(mail.to).toBe(to)
      expect(mail.subject).toContain(codeIn(mail))
      expect(mail.idempotencyKey).toBe(`email-code/${ticket.token}`)
      expect(ticket.token).toBe(signEmailCode(CODE_SECRET, { email: to, code: codeIn(mail), expiresAt: ticket.expiresAt }))
    })

    it('answers the same 202 whether or not the address already has an account (R1)', async () => {
      const b = await body()
      expect((await register(b)).statusCode).toBe(202)
      const again = await requestCode(b.email)
      expect(again.statusCode).toBe(202)
      expect(Object.keys(again.json()).sort()).toEqual(['expiresAt', 'token'])
    })

    it('accepts the right code; refuses a wrong code, another address, and an expired ticket', async () => {
      const to = email()
      const { token, expiresAt } = (await requestCode(to)).json() as { token: string; expiresAt: number }
      const code = codeIn(sent.at(-1)!)
      const ok = await verifyCode({ email: to, code, token, expiresAt })
      expect(ok.statusCode).toBe(200)
      expect(ok.json()).toEqual({ verified: true })

      const wrong = await verifyCode({ email: to, code: code === '000000' ? '000001' : '000000', token, expiresAt })
      expect(wrong.statusCode).toBe(400)
      expect(wrong.json().error.fields).toEqual({ code: [EMAIL_CODE_MESSAGES.mismatch] })

      const other = await verifyCode({ email: email(), code, token, expiresAt })
      expect(other.json().error.fields).toEqual({ code: [EMAIL_CODE_MESSAGES.mismatch] })

      const past = Date.now() - 1
      const expired = await verifyCode({ email: to, code, token: signEmailCode(CODE_SECRET, { email: to, code, expiresAt: past }), expiresAt: past })
      expect(expired.statusCode).toBe(400)
      expect(expired.json().error.fields).toEqual({ code: [EMAIL_CODE_MESSAGES.expired] })
    })

    it('R6: the sign-up refuses a proof for another address or a wrong code, the same way for a new and an existing email', async () => {
      const forOther = await body({ emailVerification: await verifiedEmail(email()) })
      const res = await register(forOther)
      expect(res.statusCode).toBe(400)
      expect(res.json().error.fields).toEqual({ emailVerification: [EMAIL_NOT_VERIFIED] })
      expect(await db.user.count({ where: { email: forOther.email } })).toBe(0)

      const existing = await body()
      await register(existing)
      const proof = await verifiedEmail(existing.email)
      const badCode = await register(await body({ email: existing.email, emailVerification: { ...proof, code: proof.code === '000000' ? '000001' : '000000' } }))
      const badCodeNew = await register(await body({ emailVerification: { ...proof, code: proof.code === '000000' ? '000001' : '000000' } }))
      expect(badCode.statusCode).toBe(400)
      expect(badCode.json().error.fields).toEqual(badCodeNew.json().error.fields)
    })

    it('a sign-up without the proof is refused by the contract, naming the field', async () => {
      const b = await body()
      const res = await register({ ...b, emailVerification: undefined })
      expect(res.statusCode).toBe(400)
      expect(res.json().error.fields).toEqual({ emailVerification: ['Please verify your email address'] })
    })

    it('a provider outage is a 503 with Retry-After; a provider refusal is a 500 with none (not worth retrying); no code goes out', async () => {
      const n = sent.length
      mailerDown = 'outage'
      try {
        const res = await requestCode(email())
        expect(res.statusCode).toBe(503)
        expect(res.headers['retry-after']).toBe('30')
        mailerDown = 'refused'
        const refused = await requestCode(email())
        expect(refused.statusCode).toBe(500)
        expect(refused.headers['retry-after']).toBeUndefined()
        expect(sent.length).toBe(n)
      } finally {
        mailerDown = false
      }
    })
  })

  describe('a new worker', () => {
    it('gets 202 and every row of the registration transaction', async () => {
      const b = await body()
      const res = await register(b)
      expect(res.statusCode).toBe(202)
      expect(res.json()).toEqual({ status: 'accepted', message: 'Check your inbox — if this email is new, your account is ready and you can sign in now.' })

      const user = await db.user.findUniqueOrThrow({ where: { email: b.email }, include: { workerProfile: true } })
      expect(user).toMatchObject({ role: 'WORKER', status: 'ACTIVE' })
      expect(await bcrypt.compare('Str0ng!pass', user.passwordHash)).toBe(true) // apps/app's sign-in will accept it
      const p = user.workerProfile!
      expect(p).toMatchObject({
        firstName: 'Mary-Jane',
        lastName: "O'Connor",
        mobile: '+61412345678',
        location: 'Parramatta, NSW 2150',
        city: 'Parramatta',
        state: 'NSW',
        postalCode: '2150',
        latitude: parramatta.latitude,
        longitude: parramatta.longitude,
        isPublished: false,
        verificationStatus: 'NOT_STARTED',
        consentWordingVersion: CONSENT_WORDING_VERSION,
        zohoLeadId: '5725767000012345678',
      })
      expect(p.consentProfileShareAt).toBeInstanceOf(Date)
      expect(p.photos).toMatch(/^local-photo:\/\/workers\/registration\//)

      const services = await db.workerService.findMany({ where: { workerProfileId: p.id }, orderBy: { categoryId: 'asc' } })
      expect(services.map((s) => [s.categoryId, s.categoryName, s.subcategoryIds, s.subcategoryNames])).toEqual([
        ['test-cleaning', 'Test Cleaning', [], []],
        ['test-support', 'Test Support Work', ['test-personal-care'], ['Test Personal Care']],
      ])
      expect(await db.workerLocation.findMany({ where: { workerProfileId: p.id } })).toMatchObject([
        { kind: 'HOME', localityId: parramatta.id, travelRadiusKm: 50, precision: 'LOCALITY', source: 'REGISTRATION', latitude: parramatta.latitude },
      ])
      expect(await db.workerOnboarding.findUniqueOrThrow({ where: { workerProfileId: p.id } })).toMatchObject({ stage: 'SIGNED_UP', mandatoryTotal: 0, firstSignInAt: null })
      expect(await db.workerOnboardingTransition.findMany({ where: { workerProfileId: p.id } })).toMatchObject([{ fromStage: null, toStage: 'SIGNED_UP', cause: 'WorkerRegistered', source: 'API' }])
      expect(await db.auditLog.findMany({ where: { userId: user.id } })).toMatchObject([{ action: 'ACCOUNT_REGISTERED', metadata: { workerProfileId: p.id, breachedPasswordCheck: 'clear' } }])
      expect(await db.$queryRaw`SELECT type FROM outbox_events WHERE payload->>'userId' = ${user.id}`).toEqual([{ type: 'WorkerRegistered' }])
      expect(await db.registrationPhotoUpload.findUniqueOrThrow({ where: { id: b.photoUploadId } })).toMatchObject({ claimedByWorkerProfileId: p.id })
    })

    it('keeps registering when the breached-password service is down, and records that', async () => {
      breach = { status: 'unknown', reason: 'timeout' }
      try {
        const b = await body()
        expect((await register(b)).statusCode).toBe(202)
        const user = await db.user.findUniqueOrThrow({ where: { email: b.email } })
        expect(await db.auditLog.findFirst({ where: { userId: user.id } })).toMatchObject({ metadata: { breachedPasswordCheck: 'unknown' } })
      } finally {
        breach = { status: 'clear' }
      }
    })

    it('drops a malformed zohoLeadId and registers anyway (US-REG-04)', async () => {
      const b = await body({ zohoLeadId: 'not-a-lead' })
      expect((await register(b)).statusCode).toBe(202)
      expect((await db.user.findUniqueOrThrow({ where: { email: b.email }, include: { workerProfile: true } })).workerProfile!.zohoLeadId).toBeNull()
    })
  })

  describe('an existing email (R1: no enumeration)', () => {
    it('gets the byte-identical response, changes nothing, and queues the owner notice', async () => {
      const first = await body()
      const created = await register(first)
      const hashesBefore = hashCalls
      const again = await register(await body({ email: first.email.toUpperCase(), firstName: 'Someone', password: 'Other!pass9' }))
      expect(hashCalls - hashesBefore).toBe(1) // hashed anyway, so the timing matches a new sign-up
      expect(again.statusCode).toBe(created.statusCode)
      expect(again.body).toBe(created.body)
      const users = await db.user.findMany({ where: { email: first.email }, include: { workerProfile: true } })
      expect(users).toHaveLength(1)
      expect(users[0]!.workerProfile!.firstName).toBe('Mary-Jane')
      expect(await bcrypt.compare('Str0ng!pass', users[0]!.passwordHash)).toBe(true)
      // R5: seconds after creating the account, a repeat is the browser retrying -- no notice.
      const types = await db.$queryRaw<{ type: string }[]>`SELECT type FROM outbox_events WHERE payload->>'userId' = ${users[0]!.id} ORDER BY "createdAt"`
      expect(types.map((r) => r.type)).toEqual(['WorkerRegistered'])
    })

    it('an attempt on an older account queues one notice per 10 minutes, even when attempts arrive together', async () => {
      const first = await body()
      await register(first)
      const user = await db.user.findUniqueOrThrow({ where: { email: first.email } })
      await db.user.update({ where: { id: user.id }, data: { createdAt: new Date(Date.now() - 3_600_000) } })
      const notices = async () => (await db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM outbox_events WHERE type = 'RegistrationAttemptOnExistingAccount' AND payload->>'userId' = ${user.id}`)[0]!.n
      const attempts = await Promise.all([1, 2, 3].map(async () => register(await body({ email: first.email }))))
      expect(attempts.map((r) => r.statusCode)).toEqual([202, 202, 202])
      expect(await notices()).toBe(1n)
      await register(await body({ email: first.email }))
      expect(await notices()).toBe(1n)
      // Outside the window, the next attempt notifies again.
      await db.$executeRaw`UPDATE outbox_events SET "createdAt" = now() - interval '11 minutes' WHERE type = 'RegistrationAttemptOnExistingAccount' AND payload->>'userId' = ${user.id}`
      await register(await body({ email: first.email }))
      expect(await notices()).toBe(2n)
    })

    it('property: for any valid sign-up, the response for an existing email equals the one for a new email', async () => {
      await fc.assert(
        fc.asyncProperty(fc.stringMatching(/^[A-Z][a-z]{1,10}$/), fc.constantFrom('0412345678', '+61 498 765 432', '61400111222'), async (firstName, mobile) => {
          const b = await body({ firstName, mobile })
          const fresh = await register(b)
          const repeat = await register({ ...b, photoUploadId: await stagedPhotoId() })
          expect(repeat.statusCode).toBe(fresh.statusCode)
          expect(repeat.body).toBe(fresh.body)
          const headers = (r: typeof fresh) => Object.keys(r.headers).filter((h) => h !== 'x-request-id' && h !== 'date').sort()
          expect(headers(repeat)).toEqual(headers(fresh))
        }),
        { numRuns: 8 },
      )
    })

    it('two simultaneous sign-ups with one email create one account and answer both the same', async () => {
      const b = await body()
      const [x, y] = await Promise.all([register(b), register({ ...b, photoUploadId: await stagedPhotoId() })])
      expect([x.statusCode, y.statusCode]).toEqual([202, 202])
      expect(x.body).toBe(y.body)
      expect(await db.user.count({ where: { email: b.email } })).toBe(1)
    })
  })

  it('the per-account lock: 20 truly simultaneous attempts queue exactly one notice', async () => {
    const first = await body()
    await register(first)
    const user = await db.user.findUniqueOrThrow({ where: { email: first.email } })
    await db.user.update({ where: { id: user.id }, data: { createdAt: new Date(Date.now() - 3_600_000) } })
    const instant = { hash: async () => 'x', verify: async () => false, close: async () => {} }
    const input = workerRegistrationSchema.parse(await body({ email: first.email }))
    const quiet = { audit: { record: async () => {}, skip: () => {} }, log: pino({ level: 'silent' }), rawZohoLeadId: undefined }
    await Promise.all(Array.from({ length: 20 }, () => registerWorker(input, { db, hasher: instant, breaches: { check: async () => ({ status: 'clear' }) }, codeSecret: CODE_SECRET }, quiet)))
    const n = (await db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM outbox_events WHERE type = 'RegistrationAttemptOnExistingAccount' AND payload->>'userId' = ${user.id}`)[0]!.n
    expect(n).toBe(1n)
  })

  describe('refusals', () => {
    it.each([
      ['an unknown service', { services: ['no-such-service'] }, 'services'],
      ['a sub-category outside the chosen services', { services: ['test-cleaning'], supportWorkerCategories: ['test-personal-care'] }, 'supportWorkerCategories'],
      ['a retired suburb', 'retired', 'localityId'],
      ['an unknown suburb', { localityId: 999999999 }, 'localityId'],
    ] as const)('%s -> 400 on %s', async (_label, patch, field) => {
      const b = await body(patch === 'retired' ? { localityId: retiredId } : patch)
      const res = await register(b)
      expect(res.statusCode).toBe(400)
      expect(Object.keys(res.json().error.fields)).toEqual([field])
      expect(await db.user.count({ where: { email: b.email } })).toBe(0)
    })

    it('a breached password -> 400, whether or not the email exists', async () => {
      const existing = await body()
      await register(existing)
      breach = { status: 'breached', count: 42 }
      try {
        const forNew = await register(await body())
        const forExisting = await register(await body({ email: existing.email }))
        expect(forNew.statusCode).toBe(400)
        expect(forExisting.statusCode).toBe(400)
        expect(forNew.json().error.fields).toEqual(forExisting.json().error.fields)
      } finally {
        breach = { status: 'clear' }
      }
    })

    it('R4: a photo can be claimed once', async () => {
      const first = await body()
      expect((await register(first)).statusCode).toBe(202)
      const reuse = await register(await body({ photoUploadId: first.photoUploadId }))
      expect(reuse.statusCode).toBe(400)
      expect(reuse.json().error.fields).toEqual({ photoUploadId: ['Please upload your photo again'] })
    })

    it('R4: a photo staged more than 24 h ago has expired', async () => {
      const b = await body()
      await db.$executeRaw`UPDATE registration_photo_uploads SET "createdAt" = now() - interval '25 hours' WHERE id = ${b.photoUploadId}::uuid`
      const res = await register(b)
      expect(res.statusCode).toBe(400)
      expect(Object.keys(res.json().error.fields)).toEqual(['photoUploadId'])
    })

    it('R4: a photo id that was never issued', async () => {
      const res = await register(await body({ photoUploadId: randomUUID() }))
      expect(res.statusCode).toBe(400)
    })
  })

  describe('R3: atomic', () => {
    it('a failure late in the transaction leaves no user, profile, location, marker, audit, outbox row or photo claim', async () => {
      const b = await body()
      const counts = async () => [
        await db.user.count(),
        await db.workerProfile.count(),
        await db.workerService.count(),
        await db.workerLocation.count(),
        await db.workerOnboarding.count(),
        await db.workerOnboardingTransition.count(),
        await db.auditLog.count(),
        await db.outboxEvent.count(),
      ]
      const before = await counts()
      await db.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION s1_test_fail() RETURNS trigger AS $$
        BEGIN RAISE EXCEPTION 's1 test: injected failure'; END $$ LANGUAGE plpgsql`)
      await db.$executeRawUnsafe(`CREATE TRIGGER s1_test_fail BEFORE INSERT ON outbox_events FOR EACH ROW WHEN (NEW.type = 'WorkerRegistered') EXECUTE FUNCTION s1_test_fail()`)
      try {
        const res = await register(b)
        expect(res.statusCode).toBe(500)
      } finally {
        await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS s1_test_fail ON outbox_events')
        await db.$executeRawUnsafe('DROP FUNCTION IF EXISTS s1_test_fail()')
      }
      expect(await counts()).toEqual(before)
      expect(await db.registrationPhotoUpload.findUniqueOrThrow({ where: { id: b.photoUploadId } })).toMatchObject({ claimedAt: null, claimedByWorkerProfileId: null })
      // And the same sign-up then succeeds.
      expect((await register(b)).statusCode).toBe(202)
    })
  })
}, 120_000)
