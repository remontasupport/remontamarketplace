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
import { claimAsPhoto, deleteStoredPhoto, removeOne } from './application/photos'
import { replaceSection } from './application/replace-section'
import { GROUPS_WITH_COMPLETION, writeAdditionalInfo, writeBankAccount } from './application/sections/additional-info'
import { deleteExperienceArea, writeAvailability, writeEducation, writeExperience, writeJobHistory } from './application/sections/lists'
import { writeAbn, writeBio, writeDateOfBirth, writeGender, writeName, writeVehicle } from './application/sections/profile'

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
    // The vehicle answer also decides whether the licence documents are required: all three recompute completion.
    putDateOfBirth: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putDateOfBirth', completion: true }, (tx, p) => writeDateOfBirth(tx, p.id, req.body, deps.clock())) }),
    putGender: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putGender', completion: true }, (tx, p) => writeGender(tx, p.id, req.body)) }),
    putVehicle: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putVehicle', completion: true }, (tx, p) => writeVehicle(tx, p.id, req.body)) }),
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
      const body = await replaceSection(s, ctx, { section: 'confirmPhoto', completion: true }, (tx, prof) => claimAsPhoto(tx, prof.id, req.body.uploadId, deps.clock()))
      return { status: 201, body }
    },
    removePhoto: async (req, ctx) => {
      let profileId = ''
      const body = await replaceSection(s, ctx, { section: 'removePhoto', completion: true }, (tx, p) => {
        profileId = p.id
        return removeOne(tx, p.id, req.body.url)
      })
      // Only a file in the caller's own folder is deleted (F1): the URL being in their columns proves nothing.
      if (deps.photos) await deleteStoredPhoto(deps.photos.blob, req.body.url, profileId, ctx.log)
      return { status: 200, body }
    },

    putAvailability: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putAvailability', completion: true }, (tx, p) => writeAvailability(tx, p.id, req.body)) }),
    putExperience: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putExperience', completion: true }, (tx, p) => writeExperience(tx, p.id, req.body)) }),
    // Experience never changes a stored completion flag (the percentage is computed on read).
    deleteExperience: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: `deleteExperience.${req.params.domain}`, completion: false }, (tx, p) => deleteExperienceArea(tx, p.id, req.params.domain)) }),
    putJobHistory: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putJobHistory', completion: true }, (tx, p) => writeJobHistory(tx, p.id, req.body)) }),
    putEducation: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putEducation', completion: true }, (tx, p) => writeEducation(tx, p.id, req.body)) }),
    putAdditionalInfo: async (req, ctx) => ({
      status: 200,
      body: await replaceSection(s, ctx, { section: `putAdditionalInfo.${req.params.group}`, completion: GROUPS_WITH_COMPLETION.has(req.params.group) }, (tx, p) => writeAdditionalInfo(tx, p.id, req.params.group, req.body)),
    }),
    putBankAccount: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putBankAccount', completion: false }, (tx, p) => writeBankAccount(tx, p.id, req.body)) }),
  })
}
