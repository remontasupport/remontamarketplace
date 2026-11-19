// The registration area: one handler per entry of registration.contract.ts.
import { registrationContract } from '@remonta/api-contract'
import { defineHandlers } from '../../platform/contract/handlers'
import type { LocalityDirectory } from '../localities/locality-directory'
import { emailAvailable } from './application/email-availability'
import { createAgreementTicket } from './application/agreement'
import { confirmEmailCode, requestEmailCode, type EmailCodeDeps } from './application/email-code'
import { confirmPhotoUpload, type PhotoConfirmDeps } from './application/photo-confirm'
import { createPhotoTicket, type PhotoTicketDeps } from './application/photo-ticket'
import { registerWorker, type RegisterDeps } from './application/register-worker'
import { listServiceCategories } from './application/service-categories'
import { listServiceRequirements } from './application/service-requirements'

export interface RegistrationModuleDeps extends Omit<RegisterDeps, 'bucket'>, Omit<PhotoConfirmDeps, 'db' | 'now'>, PhotoTicketDeps, EmailCodeDeps {
  localities: LocalityDirectory
}

export function registrationHandlers(deps: RegistrationModuleDeps) {
  return defineHandlers(registrationContract, {
    listServiceCategories: async () => ({ status: 200, body: { categories: await listServiceCategories(deps.db) } }),

    listServiceRequirements: async (req) => ({ status: 200, body: await listServiceRequirements(deps.db, req.query) }),

    searchLocalities: async (req) => ({ status: 200, body: { localities: await deps.localities.search(req.query.q) } }),

    // The direct upload (U3): a ticket for the bucket, then confirm what landed.
    createPhotoUploadTicket: async (req, ctx) => ({ status: 201, body: await createPhotoTicket(req.body, deps, ctx.log) }),

    // signup-abn-agreement U1: the signed agreement's upload; it is recorded with the sign-up.
    createAgreementUploadTicket: async (req, ctx) => {
      ctx.audit.skip('a ticket stores nothing')
      return { status: 201, body: await createAgreementTicket(req.body, deps, ctx.log) }
    },

    confirmPhotoUpload: async (req, ctx) => ({ status: 200, body: await confirmPhotoUpload(req.body.photoUploadId, ctx.ip, deps, ctx.log) }),

    checkEmailAvailability: async (req) => ({ status: 200, body: await emailAvailable(deps.db, req.body) }),

    // captchaToken was verified by the pipeline; the use case never sees it.
    requestEmailCode: async (req, ctx) => ({ status: 202, body: await requestEmailCode(req.body, deps, ctx.log) }),

    verifyEmailCode: async (req) => ({ status: 200, body: confirmEmailCode(req.body, deps) }),

    submitWorkerRegistration: async (req, ctx) => {
      // captchaToken was verified by pipeline step 4; the use case ignores it.
      return registerWorker(req.body, deps, {
        audit: ctx.audit,
        log: ctx.log,
        rawZohoLeadId: (ctx.rawBody as { zohoLeadId?: unknown } | null)?.zohoLeadId,
      })
    },
  })
}
