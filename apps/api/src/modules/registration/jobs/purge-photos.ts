// PurgeUnclaimedRegistrationPhotos (S1-design 3.2, 3.5): daily. A photo staged for
// a sign-up that never completed is deleted after 24 h -- the blob first, then the
// row, so a failure leaves the row for the next run rather than an orphan blob.
import type { Job } from '../../../platform/jobs/scheduler'
import type { Db } from '../../../platform/persistence/db'
import type { PhotoStore } from '../adapters/photo-store'
import { PHOTO_CLAIM_WINDOW_HOURS } from '../application/stage-photo'

export function purgeUnclaimedPhotosJob(db: Db, store: PhotoStore, opts: { batch?: number } = {}): Job {
  return {
    name: 'purge-unclaimed-registration-photos',
    everyMs: 24 * 3_600_000,
    timeoutMs: 10 * 60_000,
    async run({ now, signal }) {
      const before = new Date(now.getTime() - PHOTO_CLAIM_WINDOW_HOURS * 3_600_000)
      const stale = await db.registrationPhotoUpload.findMany({
        where: { claimedAt: null, createdAt: { lt: before } },
        select: { id: true, blobKey: true },
        take: opts.batch ?? 1000,
        orderBy: { createdAt: 'asc' },
      })
      let deleted = 0
      let failed = 0
      for (const p of stale) {
        if (signal.aborted) break
        try {
          await store.delete(p.blobKey)
          // Only if still unclaimed: a registration could claim it between the read and now.
          const gone = await db.registrationPhotoUpload.deleteMany({ where: { id: p.id, claimedAt: null } })
          deleted += gone.count
        } catch {
          failed++
        }
      }
      return { summary: { candidates: stale.length, deleted, failed } }
    },
  }
}
