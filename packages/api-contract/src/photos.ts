// A worker's photos, shared by the worker and admin areas (2026-10-23: the additional photos back, for workers and
// admins). Its own module because worker.sections imports admin.contract, so admin.contract cannot import it.
import * as z from 'zod'

/** Extra photos beside the main one (the limit before 2026-10-14). Older rows may hold more; they are shown, not added to. */
export const MAX_ADDITIONAL_PHOTOS = 2
/** What a read returns: every stored extra photo (legacy rows up to this many), so an admin can still remove them. */
export const STORED_ADDITIONAL_PHOTOS_MAX = 10

const photoUrl = z.string().max(2048)

/** The main photo (`worker_profiles.photos`) and the extra ones (the JSON array `worker_profiles.additionalPhotos`). */
export const workerPhotosSchema = z.strictObject({ main: photoUrl.nullable(), additional: z.array(photoUrl).max(STORED_ADDITIONAL_PHOTOS_MAX) })
export type WorkerPhotos = z.output<typeof workerPhotosSchema>

/** A confirmed upload, by the id its ticket gave. */
export const photoUploadBodySchema = z.strictObject({ uploadId: z.uuid() })
/** A stored photo, by its address. */
export const photoUrlBodySchema = z.strictObject({ url: z.url().max(2048) })
