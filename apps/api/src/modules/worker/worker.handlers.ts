// The worker area: one handler per entry of worker.contract.ts (U1 worker-area, U2
// edit-profile). The pipeline has already verified the token, checked the WORKER role,
// applied the per-user and per-IP limits and parsed the body strictly; the private-cache
// headers and the 304 are its job too. Every section write runs through replaceSection
// (ownership, one transaction, completion, audit). One info line per request with ids and
// timing, never a name, a value or a row (U1-SEC-06).
import { workerContract } from '@remonta/api-contract'
import type { Clock } from '../../platform/clock'
import { defineHandlers } from '../../platform/contract/handlers'
import type { Db } from '../../platform/persistence/db'
import type { PhotoStore } from '../registration/adapters/photo-store'
import { confirmPhotoUpload } from '../registration/application/photo-confirm'
import { createPhotoTicket } from '../registration/application/photo-ticket'
import { writeHomeAddress, writeServiceArea } from './application/addresses'
import { getProfile, type GetProfileDeps } from './application/get-profile'
import { claimIntoSlot, deleteStoredPhoto, makeMain, removeOne } from './application/photos'
import { replaceSection } from './application/replace-section'
import { GROUPS_WITH_COMPLETION, writeAdditionalInfo, writeBankAccount } from './application/sections/additional-info'
import { writeAvailability, writeEducation, writeExperience, writeJobHistory } from './application/sections/lists'
import { writeAbn, writeBio, writeName, writePersonalInfo } from './application/sections/profile'

export interface WorkerModuleDeps {
  db: Db
  clock: Clock
  /** Test seam: the read used instead of the transaction. */
  read?: GetProfileDeps['read']
  /** The sign-up photo bucket and its settings (U2 photos reuse the direct upload). Absent: the photo entries answer 503. */
  photos?: { bucket: PhotoStore; publicBaseUrl: string; ipHashSecret: string; blob: { delete(urlOrKey: string): Promise<void> } }
}

export function workerHandlers(deps: WorkerModuleDeps) {
  const s = { db: deps.db, clock: deps.clock }
  const photoDeps = () => {
    if (!deps.photos) throw new Error('worker photos: the photo store is not configured')
    return deps.photos
  }
  return defineHandlers(workerContract, {
    getProfile: async (_req, ctx) => {
      const started = Date.now()
      // The pipeline admits WORKER principals only (R1.5); ctx.principal is never null here.
      const body = await getProfile({ db: deps.db, read: deps.read }, ctx.principal!, ctx.log)
      ctx.log.info({ entry: 'worker.getProfile', durationMs: Date.now() - started, userId: ctx.principal!.userId, percent: body.completion.percent }, 'worker profile read')
      return { status: 200, body }
    },

    putName: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putName', completion: true }, (tx, p) => writeName(tx, p.id, req.body)) }),
    putBio: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putBio', completion: true }, (tx, p) => writeBio(tx, p.id, req.body)) }),
    putPersonalInfo: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putPersonalInfo', completion: true }, (tx, p) => writePersonalInfo(tx, p.id, req.body, deps.clock())) }),
    putAbn: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putAbn', completion: true }, (tx, p) => writeAbn(tx, p.id, req.body)) }),
    putHomeAddress: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putHomeAddress', completion: false }, (tx, p) => writeHomeAddress(tx, p.id, req.body)) }),
    putServiceArea: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putServiceArea', completion: true }, (tx, p) => writeServiceArea(tx, p.id, req.body)) }),

    createPhotoTicket: async (req, ctx) => {
      // Nothing is stored at ticket time (the sign-up's rule): there is nothing to audit yet.
      ctx.audit.skip('a ticket stores nothing')
      return { status: 201, body: await createPhotoTicket(req.body, { bucket: photoDeps().bucket, now: deps.clock }, ctx.log) }
    },
    confirmPhoto: async (req, ctx) => {
      const p = photoDeps()
      // Inspect what landed and create the upload row (idempotent); then claim it for this profile.
      await confirmPhotoUpload(req.body.uploadId, ctx.ip, { db: deps.db, bucket: p.bucket, publicBaseUrl: p.publicBaseUrl, ipHashSecret: p.ipHashSecret, now: deps.clock }, ctx.log)
      const body = await replaceSection(s, ctx, { section: 'confirmPhoto', completion: true }, (tx, prof) => claimIntoSlot(tx, prof.id, req.body.uploadId, req.body.slot, deps.clock()))
      return { status: 201, body }
    },
    makeMainPhoto: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'makeMainPhoto', completion: true }, (tx, p) => makeMain(tx, p.id, req.body.url)) }),
    removePhoto: async (req, ctx) => {
      const body = await replaceSection(s, ctx, { section: 'removePhoto', completion: true }, (tx, p) => removeOne(tx, p.id, req.body.url))
      if (deps.photos) await deleteStoredPhoto(deps.photos.blob, req.body.url, ctx.log)
      return { status: 200, body }
    },

    putAvailability: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putAvailability', completion: true }, (tx, p) => writeAvailability(tx, p.id, req.body)) }),
    putExperience: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putExperience', completion: true }, (tx, p) => writeExperience(tx, p.id, req.body)) }),
    putJobHistory: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putJobHistory', completion: true }, (tx, p) => writeJobHistory(tx, p.id, req.body)) }),
    putEducation: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putEducation', completion: true }, (tx, p) => writeEducation(tx, p.id, req.body)) }),
    putAdditionalInfo: async (req, ctx) => ({
      status: 200,
      body: await replaceSection(s, ctx, { section: `putAdditionalInfo.${req.params.group}`, completion: GROUPS_WITH_COMPLETION.has(req.params.group) }, (tx, p) => writeAdditionalInfo(tx, p.id, req.params.group, req.body)),
    }),
    putBankAccount: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putBankAccount', completion: false }, (tx, p) => writeBankAccount(tx, p.id, req.body)) }),
  })
}
