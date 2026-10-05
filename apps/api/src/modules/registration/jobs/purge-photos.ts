// PurgeUnclaimedRegistrationPhotos (S1-design 3.2, 3.5; U3 R5): daily. A photo
// confirmed for a sign-up that never completed is deleted after 24 h -- the staging
// object first, then the row, so a failure leaves the row for the next run rather
// than an orphan object. Objects that were never confirmed have no row: the bucket's
// lifecycle rule removes them. A row whose key is not the bucket's (the removed
// multipart entry wrote Vercel Blob keys) is skipped and counted, never deleted.
import type { Job } from '../../../platform/jobs/scheduler'
import type { Db } from '../../../platform/persistence/db'
import type { PhotoStore } from '../adapters/photo-store'
import { PHOTO_CLAIM_WINDOW_HOURS, storeOf } from '../domain/photo-upload'

export interface PurgeStores {
  gcs: PhotoStore
}

export function purgeUnclaimedPhotosJob(db: Db, stores: PurgeStores, opts: { batch?: number } = {}): Job {
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
      let deletedGcs = 0
      let skippedUnknownStore = 0
      let failed = 0
      for (const p of stale) {
        if (signal.aborted) break
        if (storeOf(p.blobKey) !== 'gcs') {
          skippedUnknownStore++
          continue
        }
        try {
          await stores.gcs.delete(p.blobKey)
          // Only if still unclaimed: a registration could claim it between the read and now.
          const gone = await db.registrationPhotoUpload.deleteMany({ where: { id: p.id, claimedAt: null } })
          deletedGcs += gone.count
        } catch {
          failed++
        }
      }
      return { summary: { candidates: stale.length, deletedGcs, skippedUnknownStore, failed } }
    },
  }
}
