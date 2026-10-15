// The worker area: one handler per entry of worker.contract.ts (U1 worker-area, U2
// edit-profile, U3a services). The pipeline has already verified the token, checked the WORKER role,
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
import { writeAvailability, writeEducation, writeExperience, writeJobHistory } from './application/sections/lists'
import { ApiError } from '../../platform/errors'
import { ownServiceDocument, writeServiceRegistration, writeServices } from './application/sections/services'
import { complianceAlreadyRecorded, complianceTargetOf, ownComplianceBlobUrl, recordComplianceDocument, removeComplianceDocument, writeCitizenship } from './application/compliance-documents'
import { alreadyRecorded, confirmTargetOf, createDocumentTicket, deleteDocumentFiles, DOCUMENT_UPLOAD_INCOMPLETE, linkFor, recordDocument, removeDocument, stageDocument, type DocumentFile } from './application/service-documents'
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
  // The bucket (documents, U3b) and the Blob store (legacy files): absent in a test or a local run without them.
  const stores = () => ({ bucket: deps.photos?.bucket, blob: deps.photos?.blob })
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
    putJobHistory: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putJobHistory', completion: true }, (tx, p) => writeJobHistory(tx, p.id, req.body)) }),
    putEducation: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putEducation', completion: true }, (tx, p) => writeEducation(tx, p.id, req.body)) }),
    putAdditionalInfo: async (req, ctx) => ({
      status: 200,
      body: await replaceSection(s, ctx, { section: `putAdditionalInfo.${req.params.group}`, completion: GROUPS_WITH_COMPLETION.has(req.params.group) }, (tx, p) => writeAdditionalInfo(tx, p.id, req.params.group, req.body)),
    }),
    // U3a: the services decide the requirement groups and the services flag; a registration can complete a service.
    putServices: async (req, ctx) => {
      const out = await replaceSection(s, ctx, { section: 'putServices', completion: true }, (tx, p) => writeServices(tx, p.id, req.body, deps.clock()))
      // A removed service's documents went with it (D2); their files follow after the commit, own folders only.
      if (out.files.length) await deleteDocumentFiles(stores(), out.files, { userId: ctx.principal!.userId, profileId: out.profileId }, ownServiceDocument, ctx.log)
      return { status: 200, body: out.body }
    },
    putServiceRegistration: async (req, ctx) => ({
      status: 200,
      body: await replaceSection(s, ctx, { section: `putServiceRegistration.${req.params.categoryId}`, completion: true }, (tx, p) => writeServiceRegistration(tx, p.id, req.params.categoryId, req.body)),
    }),
    // U3b service documents (u3b-service-documents-design.md).
    createServiceDocumentTicket: async (req, ctx) => {
      // Nothing is stored at ticket time (the photo's rule): there is nothing to audit yet.
      ctx.audit.skip('a ticket stores nothing')
      return { status: 201, body: await createDocumentTicket(req.body, { bucket: photoDeps().bucket, now: deps.clock() }, ctx.log) }
    },
    confirmServiceDocument: async (req, ctx) => {
      const bucket = photoDeps().bucket
      // The service and the type first (no bucket call for a request that cannot be recorded), then the file.
      const target = await confirmTargetOf(deps.db, ctx.principal!.userId, req.body)
      const staged = await stageDocument(bucket, req.body.uploadId, target.profileId, ctx.log)
      if (!staged) {
        // Nothing at the ticket's key: a retry of a confirm already recorded answers the same row; otherwise the upload never finished.
        const done = await alreadyRecorded(deps.db, target.profileId, req.body.uploadId)
        if (done) {
          ctx.audit.skip('a repeat of a recorded confirm')
          return { status: 201, body: done }
        }
        throw new ApiError(409, 'document upload incomplete', { file: [DOCUMENT_UPLOAD_INCOMPLETE] })
      }
      let replaced: DocumentFile | null = null
      let view
      try {
        view = await replaceSection(s, ctx, { section: 'confirmServiceDocument', completion: true }, async (tx) => {
          const out = await recordDocument(tx, target, req.body, staged, deps.clock())
          replaced = out.replaced
          return out.view
        })
      } catch (err) {
        // Not recorded: the copy is nobody's file.
        await bucket.delete(staged.key).catch(() => undefined)
        throw err
      }
      if (replaced) await deleteDocumentFiles(stores(), [replaced], { userId: ctx.principal!.userId, profileId: target.profileId }, ownServiceDocument, ctx.log)
      return { status: 201, body: view }
    },
    deleteServiceDocument: async (req, ctx) => {
      let profileId = ''
      const file = await replaceSection(s, ctx, { section: 'deleteServiceDocument', completion: true }, (tx, p) => {
        profileId = p.id
        return removeDocument(tx, p.id, req.params.documentId)
      })
      await deleteDocumentFiles(stores(), [file], { userId: ctx.principal!.userId, profileId }, ownServiceDocument, ctx.log)
      return { status: 200, body: { documentId: req.params.documentId } }
    },
    getServiceDocumentLink: async (req, ctx) => {
      // Ownership in the query: a row of another worker is the same 404 as no row.
      const row = await deps.db.verificationRequirement.findFirst({
        where: { id: req.params.documentId, documentCategory: 'SERVICE_QUALIFICATION', workerProfile: { userId: ctx.principal!.userId } },
        select: { workerProfileId: true, documentUrl: true, metadata: true },
      })
      if (!row) throw new ApiError(404, 'service document not found')
      return { status: 200, body: await linkFor(deps.photos?.bucket, row, deps.clock()) }
    },

    // U4a compliance documents (u4a-compliance-documents-design.md): the same ticket, staging check and copy as U3b.
    confirmComplianceDocument: async (req, ctx) => {
      const bucket = photoDeps().bucket
      // The type and its rules first (no bucket call for a request that cannot be recorded), then the file.
      const target = await complianceTargetOf(deps.db, ctx.principal!.userId, req.body)
      const staged = await stageDocument(bucket, req.body.uploadId, target.profileId, ctx.log)
      if (!staged) {
        const done = await complianceAlreadyRecorded(deps.db, target.profileId, req.body.uploadId)
        if (done) {
          ctx.audit.skip('a repeat of a recorded confirm')
          return { status: 201, body: done }
        }
        throw new ApiError(409, 'document upload incomplete', { file: [DOCUMENT_UPLOAD_INCOMPLETE] })
      }
      let replaced: DocumentFile | null = null
      let view
      try {
        view = await replaceSection(s, ctx, { section: `confirmComplianceDocument.${target.type}`, completion: true }, async (tx) => {
          const out = await recordComplianceDocument(tx, target, req.body, staged, deps.clock())
          replaced = out.replaced
          return out.view
        })
      } catch (err) {
        await bucket.delete(staged.key).catch(() => undefined)
        throw err
      }
      if (replaced) await deleteDocumentFiles(stores(), [replaced], { userId: ctx.principal!.userId, profileId: target.profileId }, ownComplianceBlobUrl, ctx.log)
      return { status: 201, body: view }
    },
    deleteComplianceDocument: async (req, ctx) => {
      let profileId = ''
      const file = await replaceSection(s, ctx, { section: 'deleteComplianceDocument', completion: true }, (tx, p) => {
        profileId = p.id
        return removeComplianceDocument(tx, p.id, req.params.documentId)
      })
      await deleteDocumentFiles(stores(), [file], { userId: ctx.principal!.userId, profileId }, ownComplianceBlobUrl, ctx.log)
      return { status: 200, body: { documentId: req.params.documentId } }
    },
    putCitizenship: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putCitizenship', completion: true }, (tx, p) => writeCitizenship(tx, p.id, req.body.isCitizen, deps.clock())) }),
    getDocumentLink: async (req, ctx) => {
      // Any of the worker's own rows; another worker's is the same 404 as no row.
      const row = await deps.db.verificationRequirement.findFirst({
        where: { id: req.params.documentId, workerProfile: { userId: ctx.principal!.userId } },
        select: { workerProfileId: true, documentUrl: true, metadata: true },
      })
      if (!row) throw new ApiError(404, 'document not found')
      return { status: 200, body: await linkFor(deps.photos?.bucket, row, deps.clock()) }
    },

    putBankAccount: async (req, ctx) => ({ status: 200, body: await replaceSection(s, ctx, { section: 'putBankAccount', completion: false }, (tx, p) => writeBankAccount(tx, p.id, req.body)) }),
  })
}
