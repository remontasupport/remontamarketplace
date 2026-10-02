// The registration area: one handler per entry of registration.contract.ts.
import { registrationContract } from '@remonta/api-contract'
import { defineHandlers } from '../../platform/contract/handlers'
import type { LocalityDirectory } from '../localities/locality-directory'
import { emailAvailable } from './application/email-availability'
import { confirmEmailCode, requestEmailCode, type EmailCodeDeps } from './application/email-code'
import { registerWorker, type RegisterDeps } from './application/register-worker'
import { listServiceCategories } from './application/service-categories'
import { stagePhoto, type StagePhotoDeps } from './application/stage-photo'

export interface RegistrationModuleDeps extends RegisterDeps, Omit<StagePhotoDeps, 'db'>, EmailCodeDeps {
  localities: LocalityDirectory
}

export function registrationHandlers(deps: RegistrationModuleDeps) {
  return defineHandlers(registrationContract, {
    listServiceCategories: async () => ({ status: 200, body: { categories: await listServiceCategories(deps.db) } }),

    searchLocalities: async (req) => ({ status: 200, body: { localities: await deps.localities.search(req.query.q) } }),

    uploadRegistrationPhoto: async (req, ctx) => ({ status: 201, body: await stagePhoto(req.files.photo, ctx.ip, deps) }),

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
