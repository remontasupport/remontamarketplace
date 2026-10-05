// The sign-up photo's pure rules and use cases on in-memory doubles (U3 functional
// design R1-R5, L1-L5; PBT-01 properties). No database, no network. The upload
// bucket is private and upload-only; the clean copies go to Vercel Blob (user
// decision 2026-10-05), so processing tests look at the Blob double for the output.
import { randomUUID } from 'node:crypto'
import { PHOTO_MAX_BYTES } from '@remonta/api-contract'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { confirmPhotoUpload } from '../../src/modules/registration/application/photo-confirm'
import { createPhotoTicket } from '../../src/modules/registration/application/photo-ticket'
import { PHOTO_CACHE_S, photoUploadedHandler, processPhoto } from '../../src/modules/registration/application/photo-process'
import { asIsKey, idFromStagingKey, isClaimable, processedKey, profilePrefix, publicUrl, stagingKey, storeOf, thumbnailKey, TICKET_TTL_MS } from '../../src/modules/registration/domain/photo-upload'
import { purgeUnclaimedPhotosJob } from '../../src/modules/registration/jobs/purge-photos'
import { PermanentFailure } from '../../src/platform/errors'
import type { Db } from '../../src/platform/persistence/db'
import { InMemoryBlobStore, InMemoryPhotoStore, jpegWithExif, pngOf, TINY_JPEG } from './fakes'
import { confirmCase, profileId, purgeRow, uuid } from './generators'

const log = { info() {}, warn() {}, error() {}, debug() {}, trace() {}, fatal() {}, child() { return this } } as never

const SAFE = /^[a-z0-9/._-]+$/i

describe('keys and stores (R1.3, E2)', () => {
  it('derive safe keys that carry the id, and tell the stores apart by prefix', () => {
    fc.assert(
      fc.property(uuid, profileId, (id, pid) => {
        const s = stagingKey(id)
        expect(s).toBe(`staging/${id}`)
        expect(idFromStagingKey(s)).toBe(id)
        for (const k of [s, processedKey(pid, id), thumbnailKey(pid, id), asIsKey(pid, id, 'image/png')]) {
          expect(k).toMatch(SAFE)
          expect(k.startsWith('/')).toBe(false)
          expect(k.includes('..')).toBe(false)
        }
        expect(processedKey(pid, id).startsWith(profilePrefix(pid, id))).toBe(true)
        expect(storeOf(s)).toBe('gcs')
        expect(storeOf(processedKey(pid, id))).toBe('gcs')
        expect(storeOf(`workers/registration/${id}.jpg`)).toBe('vercel-blob')
      }),
    )
    expect(() => stagingKey('not-a-uuid')).toThrow()
    expect(() => profilePrefix('../x', randomUUID())).toThrow()
    expect(publicUrl('https://storage.googleapis.com/b/', 'staging/x')).toBe('https://storage.googleapis.com/b/staging/x')
  })

  it('isClaimable: unclaimed and younger than 24 h, for any times (R3.1)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 72 * 3600 }), fc.boolean(), (ageS, claimed) => {
        const now = new Date('2026-10-05T00:00:00Z')
        const row = { claimedAt: claimed ? now : null, createdAt: new Date(now.getTime() - ageS * 1000) }
        expect(isClaimable(row, now)).toBe(!claimed && ageS < 24 * 3600)
      }),
    )
  })
})

describe('createPhotoTicket (R1)', () => {
  it('signs a policy for staging/<fresh uuid>, the declared type, the cap and ten minutes; writes nothing', async () => {
    const bucket = new InMemoryPhotoStore()
    const now = new Date('2026-10-05T01:00:00Z')
    const r = await createPhotoTicket({ contentType: 'image/png', sizeBytes: 1234 }, { bucket, now: () => now }, log)
    expect(r.photoUploadId).toMatch(/^[0-9a-f-]{36}$/)
    expect(bucket.tickets).toEqual([{ key: `staging/${r.photoUploadId}`, contentType: 'image/png', maxBytes: PHOTO_MAX_BYTES, expiresAt: new Date(now.getTime() + TICKET_TTL_MS) }])
    expect(r.upload).toMatchObject({ method: 'POST', fileField: 'file' })
    expect(r.expiresAt).toBe(new Date(now.getTime() + TICKET_TTL_MS).toISOString())
    expect(bucket.objects.size).toBe(0)
  })

  it('answers 503 with Retry-After when the store cannot sign (R1.5)', async () => {
    const bucket = new InMemoryPhotoStore()
    bucket.failNext('createUploadTicket')
    await expect(createPhotoTicket({ contentType: 'image/jpeg', sizeBytes: 1 }, { bucket }, log)).rejects.toMatchObject({ status: 503, headers: { 'retry-after': '2' } })
  })
})

/** A fake of the two Prisma delegates confirm and processing touch. */
function fakeDb() {
  const uploads = new Map<string, { id: string; blobKey: string; url: string; contentType: string; sizeBytes: number; createdAt: Date; claimedAt: Date | null }>()
  const profiles = new Map<string, { photos: string | null }>()
  const db = {
    registrationPhotoUpload: {
      findUnique: async ({ where }: { where: { id: string } }) => uploads.get(where.id) ?? null,
      create: async ({ data }: { data: { id: string; blobKey: string; url: string; contentType: string; sizeBytes: number; createdAt: Date } }) => {
        if (uploads.has(data.id)) {
          const { Prisma } = await import('../../src/platform/persistence/db')
          throw new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' })
        }
        uploads.set(data.id, { ...data, claimedAt: null })
        return data
      },
    },
    workerProfile: {
      findUnique: async ({ where }: { where: { id: string } }) => profiles.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: { photos: string } }) => {
        const p = profiles.get(where.id)
        if (!p) throw new Error('no profile')
        p.photos = data.photos
        return p
      },
    },
  }
  return { db: db as unknown as Db, uploads, profiles }
}

describe('confirmPhotoUpload (R2)', () => {
  const deps = (bucket: InMemoryPhotoStore, db: Db) => ({ db, bucket, publicBaseUrl: bucket.publicBaseUrl, ipHashSecret: 'secret-'.repeat(6) })

  it('creates the row only after the object passed size, bytes and type (R2.6), and is idempotent (R2.1)', async () => {
    const bucket = new InMemoryPhotoStore()
    const { db, uploads } = fakeDb()
    const id = randomUUID()
    bucket.putAsBrowser(stagingKey(id), TINY_JPEG, 'image/jpeg')
    expect(await confirmPhotoUpload(id, '203.0.113.9', deps(bucket, db), log)).toEqual({ photoUploadId: id })
    const row = uploads.get(id)!
    expect(row).toMatchObject({ blobKey: `staging/${id}`, contentType: 'image/jpeg', sizeBytes: TINY_JPEG.byteLength })
    expect(row.url).toBe(`${bucket.publicBaseUrl}/staging/${id}`)
    const before = bucket.calls.length
    expect(await confirmPhotoUpload(id, '203.0.113.9', deps(bucket, db), log)).toEqual({ photoUploadId: id })
    expect(bucket.calls.length).toBe(before) // nothing touched the second time
  })

  it.each([
    ['missing object', 409, (b: InMemoryPhotoStore, id: string) => void b],
    ['too large', 413, (b: InMemoryPhotoStore, id: string) => b.putAsBrowser(stagingKey(id), Buffer.concat([TINY_JPEG, Buffer.alloc(PHOTO_MAX_BYTES)]), 'image/jpeg')],
    ['not an image', 415, (b: InMemoryPhotoStore, id: string) => b.putAsBrowser(stagingKey(id), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'image/jpeg')],
    ['HEIC', 415, (b: InMemoryPhotoStore, id: string) => b.putAsBrowser(stagingKey(id), Buffer.from('\u0000\u0000\u0000\u0018ftypheic\u0000\u0000\u0000\u0000\u0000\u0000', 'latin1'), 'image/jpeg')],
    ['bytes differ from the bound type', 415, (b: InMemoryPhotoStore, id: string) => b.putAsBrowser(stagingKey(id), TINY_JPEG, 'image/png')],
  ])('%s -> %i, the object is gone and no row exists', async (_label, status, arrange) => {
    const bucket = new InMemoryPhotoStore()
    const { db, uploads } = fakeDb()
    const id = randomUUID()
    arrange(bucket, id)
    await expect(confirmPhotoUpload(id, '1.1.1.1', deps(bucket, db), log)).rejects.toMatchObject({ status })
    expect(bucket.objects.has(stagingKey(id))).toBe(false)
    expect(uploads.has(id)).toBe(false)
  })

  it('answers 503 and writes nothing when the store is unreachable (R2.7)', async () => {
    const bucket = new InMemoryPhotoStore()
    bucket.failNext('inspect')
    const { db, uploads } = fakeDb()
    const id = randomUUID()
    await expect(confirmPhotoUpload(id, '1.1.1.1', deps(bucket, db), log)).rejects.toMatchObject({ status: 503 })
    expect(uploads.size).toBe(0)
  })

  it('matches the decision table for any inputs, and confirming twice equals once (oracle, idempotence)', async () => {
    await fc.assert(
      fc.asyncProperty(confirmCase, uuid, async (c, id) => {
        const bucket = new InMemoryPhotoStore()
        const { db, uploads } = fakeDb()
        if (c.rowExists) uploads.set(id, { id, blobKey: `staging/${id}`, url: 'u', contentType: 'image/jpeg', sizeBytes: 1, createdAt: new Date(), claimedAt: null })
        if (c.objectPresent) bucket.putAsBrowser(stagingKey(id), Buffer.concat([c.header.bytes, Buffer.alloc(Math.max(0, c.sizeBytes - c.header.bytes.length))]), c.objectContentType)
        const expected = c.rowExists
          ? 200
          : !c.objectPresent
            ? 409
            : c.sizeBytes > PHOTO_MAX_BYTES
              ? 413
              : c.header.type === null || c.header.type === 'image/heic' || c.header.type !== c.objectContentType
                ? 415
                : 200
        const run = () => confirmPhotoUpload(id, '9.9.9.9', deps(bucket, db), log).then(() => 200, (e: { status: number }) => e.status)
        expect(await run()).toBe(expected)
        const snapshot = JSON.stringify([...uploads.keys(), ...bucket.objects.keys()])
        expect(await run()).toBe(expected === 200 ? 200 : c.rowExists ? 200 : 409) // after a rejection the object is gone: 409
        if (expected === 200) expect(JSON.stringify([...uploads.keys(), ...bucket.objects.keys()])).toBe(snapshot)
        if (expected !== 200 && !c.rowExists) expect(uploads.has(id)).toBe(false)
      }),
      { numRuns: 60 },
    )
  })
})

describe('processPhoto (R4): reads the bucket, writes the clean copies to Blob', () => {
  const setup = async (original: Buffer, type = 'image/jpeg') => {
    const bucket = new InMemoryPhotoStore()
    const blob = new InMemoryBlobStore()
    const { db, uploads, profiles } = fakeDb()
    const id = randomUUID()
    const pid = 'profile-1'
    bucket.putAsBrowser(stagingKey(id), original, type)
    uploads.set(id, { id, blobKey: stagingKey(id), url: 'u', contentType: type, sizeBytes: original.byteLength, createdAt: new Date(), claimedAt: new Date() })
    profiles.set(pid, { photos: null })
    return { bucket, blob, db, uploads, profiles, id, pid, deps: { db, bucket, blob, log } }
  }
  const signal = () => new AbortController().signal

  it('writes a 1600 px metadata-free JPEG and a 256 px thumbnail to Blob, points the profile at the copy, deletes the original; re-runs are no-ops', async () => {
    const sharp = (await import('sharp')).default
    const { bucket, blob, deps, id, pid, profiles } = await setup(await jpegWithExif(3000, 2000))
    expect(await processPhoto(id, pid, deps, signal())).toBe('processed')
    const main = blob.objects.get(processedKey(pid, id))!
    const thumb = blob.objects.get(thumbnailKey(pid, id))!
    expect(blob.meta.get(processedKey(pid, id))).toEqual({ contentType: 'image/jpeg', cacheControlMaxAge: PHOTO_CACHE_S })
    const m = await sharp(main).metadata()
    // orientation 6 was applied: the 3000x2000 source becomes portrait, longest edge 1600
    expect(Math.max(m.width!, m.height!)).toBe(1600)
    expect(m.exif).toBeUndefined()
    expect(m.icc).toBeUndefined()
    expect(m.orientation).toBeUndefined()
    const t = await sharp(thumb).metadata()
    expect(Math.max(t.width!, t.height!)).toBe(256)
    expect(profiles.get(pid)!.photos).toBe(`https://blob.test/${processedKey(pid, id)}`)
    expect(bucket.objects.has(stagingKey(id))).toBe(false)
    expect(bucket.objects.size).toBe(0) // the bucket is upload-only: nothing stays in it
    const calls = bucket.calls.length
    expect(await processPhoto(id, pid, deps, signal())).toBe('already')
    expect(bucket.calls.length - calls).toBe(1) // one best-effort delete, nothing written
    expect(blob.objects.size).toBe(2)
  })

  it('never enlarges a small image, and converts PNG to JPEG', async () => {
    const sharp = (await import('sharp')).default
    const { blob, deps, id, pid } = await setup(await pngOf(300, 200), 'image/png')
    expect(await processPhoto(id, pid, deps, signal())).toBe('processed')
    const m = await sharp(blob.objects.get(processedKey(pid, id))!).metadata()
    expect([m.width, m.height, m.format]).toEqual([300, 200, 'jpeg'])
  })

  it('stores undecodable bytes as uploaded under the profile and completes (R4.8)', async () => {
    const { bucket, blob, deps, id, pid, profiles } = await setup(TINY_JPEG)
    expect(await processPhoto(id, pid, deps, signal())).toBe('fallback')
    expect(profiles.get(pid)!.photos).toBe(`https://blob.test/${asIsKey(pid, id, 'image/jpeg')}`)
    expect(blob.objects.has(thumbnailKey(pid, id))).toBe(false)
    expect(bucket.objects.has(stagingKey(id))).toBe(false)
  })

  it('fails permanently when the staging object is gone before any copy exists (R4.2)', async () => {
    const { bucket, deps, id, pid } = await setup(TINY_JPEG)
    bucket.objects.clear()
    await expect(processPhoto(id, pid, deps, signal())).rejects.toBeInstanceOf(PermanentFailure)
  })

  it('throws (so the outbox retries) when the bucket is unavailable, leaving the profile untouched (R4.9)', async () => {
    const { bucket, blob, deps, id, pid, profiles } = await setup(await pngOf(10, 10), 'image/png')
    bucket.failNext('read')
    await expect(processPhoto(id, pid, deps, signal())).rejects.toThrow(/injected failure/)
    expect(profiles.get(pid)!.photos).toBeNull()
    expect(bucket.objects.has(stagingKey(id))).toBe(true)
    expect(blob.objects.size).toBe(0)
  })

  it('keeps at most `concurrency` decodes in flight (the bulkhead, P3)', async () => {
    const { bucket, blob, db, uploads, profiles } = await setup(await pngOf(10, 10), 'image/png')
    let inFlight = 0
    let peak = 0
    const slow: typeof bucket.read = async (key) => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise((r) => setTimeout(r, 20))
      inFlight--
      return bucket.objects.get(key)!.data
    }
    const b2 = Object.assign(Object.create(Object.getPrototypeOf(bucket)), bucket, { read: slow }) as InMemoryPhotoStore
    const handler = photoUploadedHandler({ db, bucket: b2, blob, log, concurrency: 2 })
    const events = [] as Promise<void>[]
    for (let i = 0; i < 5; i++) {
      const id = randomUUID()
      const pid = `p${i}`
      bucket.putAsBrowser(stagingKey(id), await pngOf(10, 10), 'image/png')
      uploads.set(id, { id, blobKey: stagingKey(id), url: 'u', contentType: 'image/png', sizeBytes: 1, createdAt: new Date(), claimedAt: new Date() })
      profiles.set(pid, { photos: null })
      events.push(handler({ id: `e${i}`, type: 'PhotoUploaded', payload: { photoUploadId: id, workerProfileId: pid }, attempts: 0 }, signal()))
    }
    await Promise.all(events)
    expect(peak).toBeLessThanOrEqual(2)
    expect([...profiles.values()].filter((p) => p.photos).length).toBe(5)
  })

  it('rejects a malformed payload permanently', async () => {
    const { db, bucket, blob } = await setup(TINY_JPEG)
    const handler = photoUploadedHandler({ db, bucket, blob, log })
    await expect(handler({ id: 'e', type: 'PhotoUploaded', payload: { nope: 1 }, attempts: 0 }, signal())).rejects.toBeInstanceOf(PermanentFailure)
  })
})

describe('purge over two stores (R5, model-based)', () => {
  it('deletes exactly the unclaimed rows older than 24 h, object first, from the store the key names; skips a store with no adapter', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(purgeRow, { maxLength: 12 }), fc.boolean(), async (rows, blobConfigured) => {
        const now = new Date('2026-10-05T12:00:00Z')
        const gcs = new InMemoryPhotoStore()
        const blob = new InMemoryBlobStore()
        const table = new Map<string, { id: string; store: string; blobKey: string; createdAt: Date; claimedAt: Date | null }>(
          rows.map((r) => [r.id, { id: r.id, store: r.store, blobKey: r.store === 'gcs' ? `staging/${r.id}` : `workers/registration/${r.id}.jpg`, createdAt: new Date(now.getTime() - r.hoursAgo * 3_600_000), claimedAt: r.claimed ? now : null }]),
        )
        for (const r of table.values()) (r.store === 'gcs' ? gcs.putAsBrowser(r.blobKey, TINY_JPEG, 'image/jpeg') : blob.objects.set(r.blobKey, TINY_JPEG))
        const db = {
          registrationPhotoUpload: {
            findMany: async ({ where, take }: { where: { createdAt: { lt: Date } }; take: number }) =>
              [...table.values()].filter((r) => r.claimedAt === null && r.createdAt < where.createdAt.lt).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).slice(0, take),
            deleteMany: async ({ where }: { where: { id: string } }) => {
              const r = table.get(where.id)
              if (r && r.claimedAt === null) {
                table.delete(where.id)
                return { count: 1 }
              }
              return { count: 0 }
            },
          },
        } as unknown as Db
        const result = await purgeUnclaimedPhotosJob(db, { gcs, blob: blobConfigured ? blob : undefined }).run({ watermark: null, now, signal: new AbortController().signal })
        for (const r of rows) {
          // The job's window is strict: createdAt < now - 24 h, so exactly 24 h is not yet stale.
          const stale = !r.claimed && r.hoursAgo > 24
          const purgeable = stale && (r.store === 'gcs' || blobConfigured)
          expect(table.has(r.id), `${r.store} ${r.hoursAgo}h claimed=${r.claimed}`).toBe(!purgeable)
          const objectThere = r.store === 'gcs' ? gcs.objects.has(`staging/${r.id}`) : blob.objects.has(`workers/registration/${r.id}.jpg`)
          expect(objectThere).toBe(!purgeable)
        }
        const expectedSkipped = rows.filter((r) => !r.claimed && r.hoursAgo > 24 && r.store === 'vercel-blob' && !blobConfigured).length
        expect(result.summary).toMatchObject({ skippedUnknownStore: expectedSkipped, failed: 0 })
      }),
      { numRuns: 40 },
    )
  })
})
