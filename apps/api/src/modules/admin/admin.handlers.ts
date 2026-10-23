// The admin area: one handler per entry of admin.contract.ts (U2). The pipeline has
// already verified the token, checked the ADMIN role, applied the per-user limits and
// parsed the query; the memo and the private-cache headers are its job too.
import { adminContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import type { Db } from '../../platform/persistence/db'
import { ApiError } from '../../platform/errors'
import type { PhotoStore } from '../registration/adapters/photo-store'
import { confirmPhotoUpload } from '../registration/application/photo-confirm'
import { createPhotoTicket } from '../registration/application/photo-ticket'
import { claimAsAdditional, deleteStoredPhoto, removeAdditional, workerPhotosOf } from '../worker/application/photos'
import { linkFor } from '../worker/application/service-documents'
import { listSuspendedWorkers, listUsers } from './application/lists'
import { searchWorkers } from './application/search-workers'
import { getWorkerServices } from './application/worker-services'
import { setWorkerActivation, setWorkerSuspension } from './application/worker-status'

export interface AdminModuleDeps {
  db: Db
  clock: Clock
  /** The private bucket (U3b): service documents are viewed through a signed link. Absent: their links answer 503. */
  bucket?: PhotoStore
  /** The photo upload's settings and the Blob store (2026-10-23: an admin manages a worker's extra photos). Absent: those entries answer 503. */
  photos?: { publicBaseUrl: string; ipHashSecret: string; blob: { delete(urlOrKey: string): Promise<void> } }
}

export function adminHandlers(deps: AdminModuleDeps) {
  const photoDeps = () => {
    if (!deps.bucket || !deps.photos) throw new ApiError(503, 'photo store not configured', undefined, { 'retry-after': '2' })
    return { bucket: deps.bucket, ...deps.photos }
  }
  /** The worker profile must exist (404 otherwise), read inside the write's transaction. */
  const ensureWorker = async (tx: { workerProfile: Db['workerProfile'] }, workerId: string) => {
    if (!(await tx.workerProfile.findUnique({ where: { id: workerId }, select: { id: true } }))) throw new ApiError(404, 'worker not found')
  }
  return defineHandlers(adminContract, {
    searchWorkers: async (req, ctx) => {
      const started = Date.now()
      const body = await searchWorkers(deps, req.query)
      // One line per search (U2-REL-01): counts and timing, never filter values or rows.
      ctx.log.info({ entry: 'admin.searchWorkers', durationMs: Date.now() - started, total: body.pagination.total, locality: body.appliedFilters.locality !== undefined, withinKm: body.appliedFilters.withinKm ?? null, unplaced: body.appliedFilters.unplaced === true }, 'admin search')
      return { status: 200, body }
    },

    listUsers: async (req) => ({ status: 200, body: await listUsers(deps, req.query) }),

    listSuspendedWorkers: async (req) => ({ status: 200, body: await listSuspendedWorkers(deps, req.query) }),

    // U3b: any worker's document, for the compliance review (the app route redirects to the link).
    getDocumentLink: async (req, ctx) => {
      const row = await deps.db.verificationRequirement.findUnique({ where: { id: req.params.documentId }, select: { workerProfileId: true, documentUrl: true, metadata: true } })
      if (!row) throw new ApiError(404, 'document not found')
      ctx.log.info({ entry: 'admin.getDocumentLink', documentId: req.params.documentId, workerProfileId: row.workerProfileId }, 'admin document link')
      return { status: 200, body: await linkFor(deps.bucket, row, deps.clock()) }
    },

    // worker-tools U1 (BR-14): the worker's admin page; logged with the profile id, as the document link.
    getWorkerServices: async (req, ctx) => {
      const body = await getWorkerServices(deps, req.params.workerId)
      ctx.log.info({ entry: 'admin.getWorkerServices', workerProfileId: req.params.workerId, services: body.services.length }, 'admin worker services')
      return { status: 200, body }
    },

    // A worker's extra photos (2026-10-23): the worker's own direct upload, placed by an admin. Extras only: the worker
    // must have a main photo (an admin never sets it), at most 2. Logged with the admin and the worker; no audit row.
    createAdminPhotoTicket: async (req, ctx) => {
      ctx.audit.skip('a ticket stores nothing')
      return { status: 201, body: await createPhotoTicket(req.body, { bucket: photoDeps().bucket, now: deps.clock }, ctx.log) }
    },

    getWorkerPhotos: async (req) => {
      const row = await deps.db.workerProfile.findUnique({ where: { id: req.params.workerId }, select: { photos: true, additionalPhotos: true } })
      if (!row) throw new ApiError(404, 'worker not found')
      return { status: 200, body: workerPhotosOf(row) }
    },

    addWorkerAdditionalPhoto: async (req, ctx) => {
      const p = photoDeps()
      await confirmPhotoUpload(req.body.uploadId, ctx.ip, { db: deps.db, bucket: p.bucket, publicBaseUrl: p.publicBaseUrl, ipHashSecret: p.ipHashSecret, now: deps.clock }, ctx.log)
      const body = await deps.db.$transaction(async (tx) => {
        await ensureWorker(tx, req.params.workerId)
        return claimAsAdditional(tx, req.params.workerId, req.body.uploadId, deps.clock(), false)
      })
      ctx.log.info({ entry: 'admin.addWorkerAdditionalPhoto', adminUserId: ctx.principal!.userId, workerProfileId: req.params.workerId, additional: body.additional.length }, 'admin worker photo added')
      return { status: 201, body }
    },

    removeWorkerAdditionalPhoto: async (req, ctx) => {
      const p = photoDeps()
      const out = await deps.db.$transaction(async (tx) => {
        await ensureWorker(tx, req.params.workerId)
        return removeAdditional(tx, req.params.workerId, req.body.url)
      })
      await deleteStoredPhoto(p.blob, out.removed, req.params.workerId, ctx.log)
      ctx.log.info({ entry: 'admin.removeWorkerAdditionalPhoto', adminUserId: ctx.principal!.userId, workerProfileId: req.params.workerId, additional: out.photos.additional.length }, 'admin worker photo removed')
      return { status: 200, body: out.photos }
    },

    // worker-activation U1 (BR-10): one line per switch is the record (Q8 c): the admin, the worker, the new state.
    setWorkerActivation: async (req, ctx) => {
      const body = await setWorkerActivation(deps, req.params.workerId, req.body.activated)
      ctx.log.info({ entry: 'admin.setWorkerActivation', adminUserId: ctx.principal!.userId, workerProfileId: body.workerId, activated: body.activated }, 'admin worker activation')
      return { status: 200, body }
    },

    setWorkerSuspension: async (req, ctx) => {
      const body = await setWorkerSuspension(deps, req.params.workerId, req.body.suspended)
      ctx.log.info({ entry: 'admin.setWorkerSuspension', adminUserId: ctx.principal!.userId, workerProfileId: body.workerId, suspended: body.suspended }, 'admin worker suspension')
      return { status: 200, body }
    },
  })
}
