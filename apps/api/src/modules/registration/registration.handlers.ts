// The registration area: one handler per entry of registration.contract.ts.
import { registrationContract } from '@remonta/api-contract'
import { defineHandlers } from '../../platform/contract/handlers'
import type { LocalityDirectory } from '../localities/locality-directory'
import { registerWorker, type RegisterDeps } from './application/register-worker'
import { stagePhoto, type StagePhotoDeps } from './application/stage-photo'

export interface RegistrationModuleDeps extends RegisterDeps, Omit<StagePhotoDeps, 'db'> {
  localities: LocalityDirectory
}

export function registrationHandlers(deps: RegistrationModuleDeps) {
  return defineHandlers(registrationContract, {
    searchLocalities: async (req) => ({ status: 200, body: { localities: await deps.localities.search(req.query.q) } }),

    uploadRegistrationPhoto: async (req, ctx) => ({ status: 201, body: await stagePhoto(req.files.photo, ctx.ip, deps) }),

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
