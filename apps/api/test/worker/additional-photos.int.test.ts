// The extra photos on PostGIS (2026-10-23): the claim into additionalPhotos (limit, main-if-none, refused without a main
// when asked, idempotent, never another's), the worker's read, removal and make-main (by the staging address too, a file
// deleted only from the own folder). The admin entries were removed the same day. The bucket is never reached: uploads are seeded rows,
// as in sections.int.test.ts. Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { claimAsAdditional } from '../../src/modules/worker/application/photos'
import { writeTransaction } from '../../src/platform/persistence/db'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

describe.skipIf(!local)('the extra photos on PostGIS', () => {
  let h: WorkerHarness
  const blobDeletes: string[] = []
  const blob = { delete: async (u: string) => void blobDeletes.push(u) }
  const photos = { bucket: {} as never, publicBaseUrl: 'https://storage.test', ipHashSecret: 'x'.repeat(32), blob }
  const uploads: string[] = []
  const as = (userId: string) => ({ 'x-test-principal': `${userId}:WORKER` })
  const stored = async (profileId: string) => h.db.workerProfile.findUniqueOrThrow({ where: { id: profileId }, select: { photos: true, additionalPhotos: true } })
  const upload = async () => {
    const id = randomUUID()
    uploads.push(id)
    await h.db.registrationPhotoUpload.create({ data: { id, blobKey: `staging/${id}`, url: `https://storage.test/staging/${id}`, contentType: 'image/jpeg', sizeBytes: 10, ipHash: 'x' } })
    return id
  }
  const claim = (profileId: string, id: string, mainIfNone: boolean) => writeTransaction(h.db, (tx) => claimAsAdditional(tx, profileId, id, new Date(), mainIfNone))

  beforeAll(async () => {
    h = await workerHarness('worker-additional-photos.test', { photos })
  }, 60_000)
  afterAll(async () => {
    if (h) {
      await h.db.outboxEvent.deleteMany({ where: { type: 'PhotoUploaded', OR: uploads.map((id) => ({ payload: { path: ['photoUploadId'], equals: id } })) } })
      await h.db.registrationPhotoUpload.deleteMany({ where: { id: { in: uploads } } })
      await h.close()
    }
  })
  beforeEach(async () => {
    blobDeletes.length = 0
    await h.db.workerProfile.updateMany({ where: { id: { in: [h.a.profileId, h.b.profileId] } }, data: { photos: null, additionalPhotos: null } })
  })

  it('the worker: with no main the first upload becomes the main; then two extras; a third is refused and not claimed', async () => {
    const [m, x1, x2, x3] = [await upload(), await upload(), await upload(), await upload()]
    expect(await claim(h.a.profileId, m, true)).toEqual({ main: `https://storage.test/staging/${m}`, additional: [] })
    await claim(h.a.profileId, x1, true)
    const two = await claim(h.a.profileId, x2, true)
    expect(two.additional).toEqual([`https://storage.test/staging/${x1}`, `https://storage.test/staging/${x2}`])
    await expect(claim(h.a.profileId, x3, true)).rejects.toMatchObject({ status: 400 })
    expect((await h.db.registrationPhotoUpload.findUniqueOrThrow({ where: { id: x3 } })).claimedByWorkerProfileId).toBeNull() // rolled back
    expect(await stored(h.a.profileId)).toEqual({ photos: two.main, additionalPhotos: JSON.stringify(two.additional) })
    expect(await claim(h.a.profileId, x2, true)).toEqual(two) // a repeat
    await expect(claim(h.b.profileId, x2, true)).rejects.toMatchObject({ status: 404 }) // never another's
    expect(await h.db.outboxEvent.count({ where: { type: 'PhotoUploaded', OR: [m, x1, x2].map((id) => ({ payload: { path: ['photoUploadId'], equals: id } })) } })).toBe(3)

    const read = await h.t.fastify.inject({ method: 'GET', url: '/v1/worker/photos', headers: as(h.a.userId) })
    expect(read.statusCode).toBe(200)
    expect(read.json()).toEqual(two)
    expect(read.headers['cache-control']).toBe('no-store')
    // The profile read's photos keep their shape.
    expect((await h.get(h.a.userId)).json().photos).toEqual({ main: two.main })
  })

  it('the worker removes an extra photo, by the staging address after the clean copy too; only an own-folder file is deleted', async () => {
    const [m, x] = [await upload(), await upload()]
    await claim(h.a.profileId, m, true)
    await claim(h.a.profileId, x, true)
    const clean = `https://store.public.blob.vercel-storage.com/workers/${h.a.profileId}/${x}.jpg`
    const s = await stored(h.a.profileId)
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { additionalPhotos: JSON.stringify([clean]) } }) // the handler's repoint
    expect((await h.t.fastify.inject({ method: 'POST', url: '/v1/worker/photos/additional/remove', headers: as(h.b.userId), payload: { url: `https://storage.test/staging/${x}` } })).statusCode).toBe(400)
    const res = await h.t.fastify.inject({ method: 'POST', url: '/v1/worker/photos/additional/remove', headers: as(h.a.userId), payload: { url: `https://storage.test/staging/${x}` } })
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ main: s.photos, additional: [] })
    expect(blobDeletes).toEqual([clean, clean.replace(/\.jpg$/, '-256.jpg')])
    expect((await h.t.fastify.inject({ method: 'POST', url: '/v1/worker/photos/additional/remove', headers: as(h.a.userId), payload: { url: s.photos! } })).statusCode).toBe(400) // never the main
  })

  it('make-main: an extra photo becomes the main and the old main takes its place; by the staging address too; not another worker’s', async () => {
    const [m, x] = [await upload(), await upload()]
    await claim(h.a.profileId, m, true)
    const two = await claim(h.a.profileId, x, true)
    const call = (url: string, user = h.a.userId) => h.t.fastify.inject({ method: 'POST', url: '/v1/worker/photos/additional/make-main', headers: as(user), payload: { url } })
    expect((await call(two.additional[0]!, h.b.userId)).statusCode).toBe(400)
    const res = await call(`https://storage.test/staging/${x}`)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ main: two.additional[0], additional: [two.main] })
    expect(await stored(h.a.profileId)).toEqual({ photos: two.additional[0], additionalPhotos: JSON.stringify([two.main]) })
    expect((await h.get(h.a.userId)).json().photos).toEqual({ main: two.additional[0] })
    expect(blobDeletes).toEqual([]) // no file touched
  })

  it('without a main photo, an extra is refused when the caller asks (mainIfNone false) and the claim rolled back', async () => {
    const x = await upload()
    await expect(claim(h.b.profileId, x, false)).rejects.toMatchObject({ status: 400 })
    expect((await h.db.registrationPhotoUpload.findUniqueOrThrow({ where: { id: x } })).claimedByWorkerProfileId).toBeNull()
  })
})
