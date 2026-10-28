// The admin area: one handler per entry of admin.contract.ts (U2). The pipeline has
// already verified the token, checked the ADMIN role, applied the per-user limits and
// parsed the query; the memo and the private-cache headers are its job too.
import { adminContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import type { Db } from '../../platform/persistence/db'
import { ApiError } from '../../platform/errors'
import type { PhotoStore } from '../registration/adapters/photo-store'
import { linkFor } from '../worker/application/service-documents'
import { listSuspendedWorkers, listUsers } from './application/lists'
import { getRequester, listRequesters, setRequestStatus } from './application/requesters'
import { searchWorkers } from './application/search-workers'
import { getWorkerServices } from './application/worker-services'
import { setWorkerActivation, setWorkerSuspension } from './application/worker-status'

export interface AdminModuleDeps {
  db: Db
  clock: Clock
  /** The private bucket (U3b): service documents are viewed through a signed link. Absent: their links answer 503. */
  bucket?: PhotoStore
}

export function adminHandlers(deps: AdminModuleDeps) {
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

    // admin-clients U1 (N10): one line per entry, ids and counts only; the role, status and funding filters are not personal.
    listRequesters: async (req, ctx) => {
      const started = Date.now()
      const body = await listRequesters(deps, req.query)
      ctx.log.info({ entry: 'admin.listRequesters', durationMs: Date.now() - started, role: req.query.role, total: body.pagination.total, search: req.query.search !== undefined, requestStatus: req.query.requestStatus ?? null, fundingType: req.query.fundingType ?? null }, 'admin requesters')
      return { status: 200, body }
    },

    getRequester: async (req, ctx) => {
      const body = await getRequester(deps, ctx.audit, ctx.principal!.userId, req.params.userId)
      ctx.log.info({ entry: 'admin.getRequester', adminUserId: ctx.principal!.userId, requesterUserId: req.params.userId, participants: body.participants.length }, 'admin requester view')
      return { status: 200, body }
    },

    setRequestStatus: async (req, ctx) => {
      const body = await setRequestStatus(deps, ctx.audit, ctx.principal!.userId, req.params.requestId, req.body.status)
      ctx.log.info({ entry: 'admin.setRequestStatus', adminUserId: ctx.principal!.userId, requestId: body.requestId, status: body.status }, 'admin request status')
      return { status: 200, body }
    },
  })
}
