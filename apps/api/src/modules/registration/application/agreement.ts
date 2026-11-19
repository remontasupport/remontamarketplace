// The sign-up's signed Contractor Agreement (signup-abn-agreement U1). The browser builds the PDF the dashboard's
// agreement page builds, uploads it by ticket, and the sign-up carries its id and the ABN. The api then does what
// `signContract` does for a signed-in worker: the PDF checked and copied into the worker's private folder before the
// transaction, and in it the `contract-of-agreement` row and the engagement `{type: 'abn', value, signed: true}`, so
// the dashboard's agreement, the admin's compliance page and completion read it unchanged (R7).
import type { AgreementTicketRequest, AgreementTicketResponse } from '@remonta/api-contract'
import { AGREEMENT_MAX_BYTES, type SignupAgreement } from '@remonta/schemas/schema/workerRegistrationSchema'
import type { FastifyBaseLogger } from 'fastify'
import { ApiError } from '../../../platform/errors'
import type { Tx } from '../../../platform/persistence/db'
import { recordComplianceDocument } from '../../worker/application/compliance-documents'
import { writeSignedEngagement } from '../../worker/application/sections/profile'
import { stageDocument, type StagedDocument, type StageRules } from '../../worker/application/service-documents'
import { complianceSpecOf } from '../../worker/domain/compliance-documents'
import type { PhotoStore } from '../adapters/photo-store'
import { stagingKey } from '../domain/photo-upload'
import { issueUploadTicket } from './upload-ticket'

export const AGREEMENT_REQUIREMENT_TYPE = 'contract-of-agreement'
export const AGREEMENT_SIGN_AGAIN = 'Please sign the agreement again'
export const AGREEMENT_STORE_UNAVAILABLE = "We couldn't save your signed agreement right now. Please try again in a moment."

const AGREEMENT_RULES: StageRules = {
  maxBytes: AGREEMENT_MAX_BYTES,
  only: ['application/pdf'],
  field: 'agreement',
  tooLarge: AGREEMENT_SIGN_AGAIN,
  notAccepted: AGREEMENT_SIGN_AGAIN,
}

export async function createAgreementTicket(input: AgreementTicketRequest, deps: { bucket: PhotoStore; now?: () => Date }, log: FastifyBaseLogger): Promise<AgreementTicketResponse> {
  const now = (deps.now ?? (() => new Date()))()
  const { id, ...ticket } = await issueUploadTicket(deps.bucket, { contentType: input.contentType, maxBytes: AGREEMENT_MAX_BYTES, unavailable: { field: 'agreement', message: AGREEMENT_STORE_UNAVAILABLE, reason: 'agreement' } }, now, log)
  log.info({ uploadId: id, sizeBytes: input.sizeBytes }, 'agreement-ticket')
  return { uploadId: id, ...ticket }
}

/** The uploaded PDF checked and copied to `documents/<profileId>/<uploadId>.pdf`; a missing upload is the worker's to redo. */
export async function stageAgreement(bucket: PhotoStore, agreement: SignupAgreement, profileId: string, log: FastifyBaseLogger): Promise<StagedDocument> {
  const staged = await stageDocument(bucket, agreement.uploadId, profileId, log, AGREEMENT_RULES)
  if (!staged) throw new ApiError(400, 'agreement upload missing, used or expired', { agreement: [AGREEMENT_SIGN_AGAIN] })
  return staged
}

/** Inside the sign-up's transaction: the agreement row and the signed engagement, as `signContract` writes them. */
export async function recordAgreement(tx: Tx, profileId: string, agreement: SignupAgreement, staged: StagedDocument, now: Date): Promise<void> {
  const spec = complianceSpecOf(AGREEMENT_REQUIREMENT_TYPE, null)!
  await recordComplianceDocument(
    tx,
    { profileId, type: AGREEMENT_REQUIREMENT_TYPE, spec },
    { uploadId: agreement.uploadId, requirementType: AGREEMENT_REQUIREMENT_TYPE, fileName: agreement.fileName, expiryDate: null, acknowledgement: null },
    staged,
    now,
  )
  await writeSignedEngagement(tx, profileId, 'abn', agreement.abn)
}

/** A sign-up that records nothing (an existing email, a failed transaction) leaves no file: best effort, logged. */
export async function discardAgreement(bucket: PhotoStore | undefined, agreement: SignupAgreement | undefined, staged: StagedDocument | null, log: FastifyBaseLogger): Promise<void> {
  if (!bucket || !agreement) return
  const key = staged?.key ?? stagingKey(agreement.uploadId)
  await bucket.delete(key).catch((err: unknown) => log.warn({ uploadId: agreement.uploadId, err: err instanceof Error ? err.message : String(err) }, 'agreement discard failed'))
}
