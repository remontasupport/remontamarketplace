// PurgeUnclaimedRegistrationPhotos (S1-design 3.2, 3.5; U3 R5): daily. A photo
// confirmed for a sign-up that never completed is deleted after 24 h -- the object
// first, from whichever store holds it (the key's prefix says), then the row, so a
// failure leaves the row for the next run rather than an orphan object. Objects that
// were never confirmed have no row: the bucket's lifecycle rule removes them.
import type { Job } from '../../../platform/jobs/scheduler'
import type { Db } from '../../../platform/persistence/db'
import type { BlobPhotoStore, PhotoStore } from '../adapters/photo-store'
import { PHOTO_CLAIM_WINDOW_HOURS, storeOf } from '../domain/photo-upload'

export interface PurgeStores {
  gcs: PhotoStore
  /** Absent once the Blob token is gone; remaining Blob rows are then skipped and counted. */
  blob?: BlobPhotoStore
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
      let deletedBlob = 0
      let skippedUnknownStore = 0
      let failed = 0
      for (const p of stale) {
        if (signal.aborted) break
        const store = storeOf(p.blobKey)
        const adapter = store === 'gcs' ? stores.gcs : stores.blob
        if (!adapter) {
          skippedUnknownStore++
          continue
        }
        try {
          await adapter.delete(p.blobKey)
          // Only if still unclaimed: a registration could claim it between the read and now.
          const gone = await db.registrationPhotoUpload.deleteMany({ where: { id: p.id, claimedAt: null } })
          if (store === 'gcs') deletedGcs += gone.count
          else deletedBlob += gone.count
        } catch {
          failed++
        }
      }
      return { summary: { candidates: stale.length, deletedGcs, deletedBlob, skippedUnknownStore, failed } }
    },
  }
}
