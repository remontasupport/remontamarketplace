// The direct photo upload end to end against a fake Cloud Storage server and the
// local PostGIS database (U3; FR-18): the real adapter, ticket, an upload standing in
// for the browser, confirm, the sign-up's claim, the processing handler, the purge.
// Skipped, and reported as skipped, unless GCS_API_ENDPOINT and a local
// TEST_DATABASE_URL are set (CI's API Quality job sets both; locally see the api's
// .env.example). The fake server ignores signatures, so the policy itself is proven
// offline (gcs-policy.test.ts) and the browser's form POST on staging.
import { randomUUID } from 'node:crypto'
import { Storage } from '@google-cloud/storage'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { GcsPhotoStore } from '../../src/modules/registration/adapters/gcs-photo-store'
import { photoUploadedHandler } from '../../src/modules/registration/application/photo-process'
import { PHOTO_UPLOADED } from '../../src/modules/registration/domain/events'
import { processedKey, stagingKey, thumbnailKey } from '../../src/modules/registration/domain/photo-upload'
import { purgeUnclaimedPhotosJob } from '../../src/modules/registration/jobs/purge-photos'
import { InMemoryBlobStore, jpegWithExif, throwawayCredentials, TINY_JPEG } from './fakes'
import { registrationHarness, type RegistrationHarness } from './harness'

const dbUrl = process.env.TEST_DATABASE_URL
const localDb = dbUrl ? ['localhost', '127.0.0.1'].includes(new URL(dbUrl).hostname) : false
const endpoint = process.env.GCS_API_ENDPOINT
const BUCKET = process.env.PHOTO_BUCKET ?? 'test-photos'

const log = { info() {}, warn() {}, error() {}, debug() {}, trace() {}, fatal() {}, child() { return this } } as never

describe.skipIf(!localDb || !endpoint)('the direct photo upload against the fake bucket', () => {
  let h: RegistrationHarness
  let store: GcsPhotoStore
  let raw: Storage
  const publicBaseUrl = `${endpoint}/${BUCKET}`

  beforeAll(async () => {
    raw = new Storage({ apiEndpoint: endpoint!, projectId: 'local' })
    const [exists] = await raw.bucket(BUCKET).exists()
    if (!exists) await raw.createBucket(BUCKET)
    // The fake server checks no signatures, but the client must still be able to sign: a throwaway key.
    store = new GcsPhotoStore({ bucket: BUCKET, publicBaseUrl, apiEndpoint: endpoint!, credentials: throwawayCredentials(), timeoutMs: 5000 })
    h = await registrationHarness('photo-gcs.example', { bucket: store, publicBaseUrl })
  })
  afterAll(async () => {
    await h?.close()
  })

  /** The browser: a ticket, then the bytes under the ticket's key (the fake accepts a plain save). */
  async function uploadAsBrowser(data: Buffer, contentType = 'image/jpeg') {
    const ticket = await h.t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/photo-tickets', payload: { contentType, sizeBytes: data.byteLength } })
    expect(ticket.statusCode).toBe(201)
    const { photoUploadId, upload } = ticket.json() as { photoUploadId: string; upload: { fields: Record<string, string> } }
    expect(upload.fields.key).toBe(stagingKey(photoUploadId))
    await raw.bucket(BUCKET).file(upload.fields.key!).save(data, { contentType, resumable: false })
    return photoUploadId
  }
  const confirm = (photoUploadId: string) => h.t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/photo-confirmations', payload: { photoUploadId } })

  it('adapter: write, inspect, read the prefix, read, delete', async () => {
    const key = `staging/${randomUUID()}`
    const url = await store.write(key, TINY_JPEG, 'image/jpeg', { cacheControl: 'no-store' })
    expect(url).toBe(`${publicBaseUrl}/${key}`)
    expect(await store.inspect(key)).toEqual({ sizeBytes: TINY_JPEG.byteLength, contentType: 'image/jpeg' })
    expect(Buffer.from(await store.readPrefix(key, 4))).toEqual(TINY_JPEG.subarray(0, 4))
    expect(await store.read(key)).toEqual(TINY_JPEG)
    await store.delete(key)
    expect(await store.inspect(key)).toBeNull()
    await store.delete(key) // missing is not an error
  })

  it('ticket, upload, confirm: a row exists only after the checks; the staged id registers; processing makes the copies and clears staging', async () => {
    const id = await uploadAsBrowser(await jpegWithExif(2400, 1200))
    expect(await h.db.registrationPhotoUpload.findUnique({ where: { id } })).toBeNull()
    const c = await confirm(id)
    expect(c.statusCode).toBe(200)
    const row = await h.db.registrationPhotoUpload.findUniqueOrThrow({ where: { id } })
    expect(row).toMatchObject({ blobKey: stagingKey(id), contentType: 'image/jpeg', claimedAt: null })
    expect((await confirm(id)).statusCode).toBe(200)

    const res = await h.register(await h.body({ photoUploadId: id }))
    expect(res.statusCode).toBe(202)
    const claimed = await h.db.registrationPhotoUpload.findUniqueOrThrow({ where: { id } })
    expect(claimed.claimedAt).not.toBeNull()
    const profileId = claimed.claimedByWorkerProfileId!
    expect((await h.db.workerProfile.findUniqueOrThrow({ where: { id: profileId } })).photos).toBeNull()
    const event = await h.db.outboxEvent.findFirstOrThrow({ where: { type: PHOTO_UPLOADED, payload: { path: ['photoUploadId'], equals: id } } })

    const blob = new InMemoryBlobStore() // the clean copies go to Vercel Blob; its SDK is not exercised here
    await photoUploadedHandler({ db: h.db, bucket: store, blob, log })({ id: event.id, type: event.type, payload: event.payload, attempts: 0 }, new AbortController().signal)
    const profile = await h.db.workerProfile.findUniqueOrThrow({ where: { id: profileId } })
    expect(profile.photos).toBe(`https://blob.test/${processedKey(profileId, id)}`)
    expect(blob.meta.get(processedKey(profileId, id))).toMatchObject({ contentType: 'image/jpeg' })
    expect(blob.meta.get(thumbnailKey(profileId, id))).toMatchObject({ contentType: 'image/jpeg' })
    expect(await store.inspect(stagingKey(id))).toBeNull() // the bucket is upload-only: nothing stays
    await h.db.outboxEvent.delete({ where: { id: event.id } })
  })

  it('refuses a missing object (409), an oversize one (413) and a non-image (415), leaving no row', async () => {
    const missing = randomUUID()
    expect((await confirm(missing)).statusCode).toBe(409)
    const big = await uploadAsBrowser(Buffer.concat([TINY_JPEG, Buffer.alloc(5 * 1024 * 1024)]))
    expect((await confirm(big)).statusCode).toBe(413)
    expect(await store.inspect(stagingKey(big))).toBeNull()
    const svg = await uploadAsBrowser(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))
    expect((await confirm(svg)).statusCode).toBe(415)
    expect(await h.db.registrationPhotoUpload.count({ where: { id: { in: [missing, big, svg] } } })).toBe(0)
  })

  it('a confirmed but unclaimed upload is purged after 24 h, object first', async () => {
    const id = await uploadAsBrowser(TINY_JPEG)
    expect((await confirm(id)).statusCode).toBe(200)
    await h.db.$executeRaw`UPDATE registration_photo_uploads SET "createdAt" = now() - interval '25 hours' WHERE id = ${id}::uuid`
    const r = await purgeUnclaimedPhotosJob(h.db, { gcs: store }).run({ watermark: null, now: new Date(), signal: new AbortController().signal })
    expect(r.summary).toMatchObject({ failed: 0 })
    expect(await store.inspect(stagingKey(id))).toBeNull()
    expect(await h.db.registrationPhotoUpload.count({ where: { id } })).toBe(0)
  })
})
