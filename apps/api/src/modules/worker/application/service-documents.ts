// Service documents (api-review U3b, u3b-service-documents-design.md): a worker's qualifications, registrations,
// licences and insurances for the services they chose, kept in the private bucket (D1) and viewed through a short
// signed link. Replaces the app's uploadServiceDocument / deleteServiceDocument actions and the routes around them.
//
// The upload goes straight from the browser to `staging/<uuid>` (the photo ticket's pattern; the bucket's lifecycle
// rule removes an abandoned one after a day). The confirm checks what landed, copies it inside the bucket to
// `documents/<profileId>/<uuid>.<ext>` -- outside `staging/`, never public -- and records the row as the app does today:
// `"<service name>:<type>"`, SERVICE_QUALIFICATION, SUBMITTED. The row's `documentUrl` is an app path ending in the
// file's extension (`/api/documents/<id>/<name>`): the admin compliance page and the worker's pages open `documentUrl`
// directly and choose the viewer by extension, and the app route (U3c) answers it with a redirect to a signed link.
import { randomUUID } from 'node:crypto'
import type { ConfirmServiceDocumentBody, DocumentLink, ServiceDocument, ServiceDocumentTicketRequest, ServiceDocumentTicketResponse } from '@remonta/api-contract'
import { DOCUMENT_HEADER_BYTES, DOCUMENT_MAX_BYTES, detectDocumentType, documentExtensionOf, matchesDeclared, type DocumentType } from '@remonta/schemas/document-type'
import type { FastifyBaseLogger } from 'fastify'
import { ApiError } from '../../../platform/errors'
import type { Prisma, Tx } from '../../../platform/persistence/db'
import { StoreUnavailable, type PhotoStore } from '../../registration/adapters/photo-store'
import { stagingKey, TICKET_TTL_MS } from '../../registration/domain/photo-upload'
import { uploadableDocuments } from '../domain/service-requirements'
import { ADDITIONAL_CATEGORIES, OTHER_DOCUMENTS_NAME } from '../domain/requirement-groups'

export const DOCUMENT_LINK_TTL_MS = 5 * 60_000
export const DOCUMENTS_PREFIX = 'documents/'
export const DOCUMENT_STORE_UNAVAILABLE = "We couldn't upload your document right now. Please try again in a moment."
export const DOCUMENT_UPLOAD_INCOMPLETE = 'Your document upload did not finish. Please try again.'
export const DOCUMENT_TOO_LARGE = 'Your document is too large. Please choose a file under 50 MB.'
export const DOCUMENT_NOT_ACCEPTED = 'Please upload a PDF, or a photo (JPEG, PNG, WebP or HEIC).'

/** Where a confirmed document lives: the worker's own folder, named by the upload id. */
export function documentKey(profileId: string, uploadId: string, type: DocumentType): string {
  return `${DOCUMENTS_PREFIX}${profileId}/${uploadId}.${documentExtensionOf(type)}`
}

/** A key the api wrote for this profile, and nothing else (never a path that walks out of the folder). */
export function isOwnDocumentKey(key: unknown, profileId: string): key is string {
  return typeof key === 'string' && key.startsWith(`${DOCUMENTS_PREFIX}${profileId}/`) && !key.includes('..') && /^[A-Za-z0-9._/-]+$/.test(key)
}

/**
 * The app path stored as `documentUrl`: the row id and the file's name, ending in the real extension so a viewer
 * that decides by extension (the admin compliance page) shows it.
 */
export function documentPath(id: string, fileName: string, type: DocumentType): string {
  const ext = documentExtensionOf(type)
  const name = fileName.toLowerCase().endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`
  return `/api/documents/${id}/${encodeURIComponent(name)}`
}

function storeUnavailable(log: FastifyBaseLogger, err: StoreUnavailable): never {
  log.warn({ err: err.message }, 'service-document store unavailable')
  throw new ApiError(503, 'document store unavailable', { file: [DOCUMENT_STORE_UNAVAILABLE] }, { 'retry-after': '2' })
}

export async function createDocumentTicket(input: ServiceDocumentTicketRequest, deps: { bucket: PhotoStore; now: Date }, log: FastifyBaseLogger): Promise<ServiceDocumentTicketResponse> {
  const id = randomUUID()
  const expiresAt = new Date(deps.now.getTime() + TICKET_TTL_MS)
  let ticket
  try {
    ticket = await deps.bucket.createUploadTicket(stagingKey(id), input.contentType, DOCUMENT_MAX_BYTES, expiresAt)
  } catch (err) {
    if (err instanceof StoreUnavailable) storeUnavailable(log, err)
    throw err
  }
  log.info({ uploadId: id, contentType: input.contentType, sizeBytes: input.sizeBytes }, 'service-document ticket')
  return { uploadId: id, upload: { url: ticket.url, method: 'POST', fields: ticket.fields, fileField: 'file' }, expiresAt: expiresAt.toISOString() }
}

/** The chosen service and what it may carry, read before the bucket is touched. */
export interface ConfirmTarget {
  profileId: string
  categoryName: string
  name: string
  kind: string
  required: boolean
}

/**
 * "Other Documents" (U4e): insurance and transport are not a service. The fixed target `other-documents` takes any
 * catalogue document of those categories, and records it as the app always has: `Other Documents:<id>`,
 * SERVICE_QUALIFICATION, metadata category QUALIFICATION (as the 467 rows on the copy of production carry).
 */
export const OTHER_DOCUMENTS_ID = 'other-documents'

async function otherDocumentsTarget(db: Tx | Prisma.TransactionClient, userId: string, body: ConfirmServiceDocumentBody): Promise<ConfirmTarget> {
  const profile = await db.workerProfile.findUnique({ where: { userId }, select: { id: true } })
  if (!profile) throw new ApiError(404, 'worker profile not found')
  const doc = await db.document.findUnique({ where: { id: body.requirementType }, select: { name: true, category: true } })
  if (!doc || !ADDITIONAL_CATEGORIES.has(doc.category)) {
    throw new ApiError(400, `document type ${body.requirementType} not an additional credential`, { requirementType: ['We do not ask for that document here'] })
  }
  return { profileId: profile.id, categoryName: OTHER_DOCUMENTS_NAME, name: doc.name, kind: 'QUALIFICATION', required: false }
}

export async function confirmTargetOf(db: Tx | Prisma.TransactionClient, userId: string, body: ConfirmServiceDocumentBody): Promise<ConfirmTarget> {
  if (body.categoryId === OTHER_DOCUMENTS_ID) return otherDocumentsTarget(db, userId, body)
  const profile = await db.workerProfile.findUnique({
    where: { userId },
    select: { id: true, workerServices: { where: { categoryId: body.categoryId }, select: { categoryName: true, subcategoryIds: true } } },
    relationLoadStrategy: 'join',
  })
  if (!profile) throw new ApiError(404, 'worker profile not found')
  const service = profile.workerServices[0]
  if (!service) throw new ApiError(404, `service ${body.categoryId} not chosen`)
  const doc = uploadableDocuments(service.categoryName, service.subcategoryIds).get(body.requirementType)
  // S3: today any type string became a row; only the types the service calls for are accepted.
  if (!doc) throw new ApiError(400, `document type ${body.requirementType} not for ${body.categoryId}`, { requirementType: ['This service does not ask for that document'] })
  return { profileId: profile.id, categoryName: service.categoryName, name: doc.name, kind: doc.kind, required: doc.required }
}

export interface StagedDocument {
  key: string
  type: DocumentType
  sizeBytes: number
}

/**
 * Checks what landed at the ticket's key (one ranged read: size, stored type, first bytes) and copies it into the
 * worker's folder; the staging object is deleted. null when nothing is there (never uploaded, or already confirmed).
 */
export async function stageDocument(bucket: PhotoStore, uploadId: string, profileId: string, log: FastifyBaseLogger): Promise<StagedDocument | null> {
  const staging = stagingKey(uploadId)
  try {
    const found = await bucket.inspectWithPrefix(staging, DOCUMENT_HEADER_BYTES)
    if (!found) return null
    const reject = async (reason: string, status: 413 | 415, message: string): Promise<never> => {
      await bucket.delete(staging).catch((err: unknown) => log.warn({ uploadId, err: err instanceof Error ? err.message : String(err) }, 'service-document delete failed'))
      log.warn({ uploadId, reason }, 'service-document rejected')
      throw new ApiError(status, `document rejected: ${reason}`, { file: [message] })
    }
    if (found.info.sizeBytes > DOCUMENT_MAX_BYTES) await reject('too-large', 413, DOCUMENT_TOO_LARGE)
    const detected = detectDocumentType(found.head)
    if (!detected || !matchesDeclared(detected, found.info.contentType)) await reject(detected ? 'wrong-type' : 'not-document', 415, DOCUMENT_NOT_ACCEPTED)
    const key = documentKey(profileId, uploadId, detected!)
    await bucket.copy(staging, key)
    await bucket.delete(staging).catch((err: unknown) => log.warn({ uploadId, err: err instanceof Error ? err.message : String(err) }, 'service-document staging delete failed'))
    return { key, type: detected!, sizeBytes: found.info.sizeBytes }
  } catch (err) {
    if (err instanceof StoreUnavailable) storeUnavailable(log, err)
    throw err
  }
}

/** The file a row points at: the api's own key (new rows) or the legacy public URL. */
export interface DocumentFile {
  storageKey: string | null
  url: string | null
}

const metaOf = (m: Prisma.JsonValue | null | undefined): Record<string, unknown> => (m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, unknown>) : {})

export function fileOf(row: { documentUrl: string | null; metadata: Prisma.JsonValue | null }): DocumentFile {
  const key = metaOf(row.metadata).storageKey
  return { storageKey: typeof key === 'string' ? key : null, url: row.documentUrl }
}

const ROW_SELECT = { id: true, requirementType: true, requirementName: true, status: true, documentUrl: true, documentUploadedAt: true, metadata: true } as const

export function documentView(row: { id: string; requirementType: string; requirementName: string; status: string; documentUrl: string | null; documentUploadedAt: Date | null; metadata: Prisma.JsonValue | null }): ServiceDocument {
  const parts = row.requirementType.split(':')
  const fileName = metaOf(row.metadata).fileName
  return {
    id: row.id.slice(0, 40),
    serviceName: (parts.length > 1 ? parts[0]! : '').slice(0, 120),
    requirementType: (parts[parts.length - 1] ?? '').slice(0, 80),
    name: row.requirementName.slice(0, 200),
    status: String(row.status).slice(0, 20),
    url: row.documentUrl ? row.documentUrl.slice(0, 2048) : null,
    fileName: typeof fileName === 'string' ? fileName.slice(0, 200) : null,
    uploadedAt: row.documentUploadedAt ? row.documentUploadedAt.toISOString() : null,
  }
}

/**
 * Records the confirmed document as the row of its service and type (found, then updated or created, as today). A
 * replaced file is returned for deletion after the commit. A new upload is SUBMITTED again: the review fields go.
 */
export async function recordDocument(
  tx: Tx,
  target: ConfirmTarget,
  body: ConfirmServiceDocumentBody,
  staged: StagedDocument,
  now: Date,
): Promise<{ view: ServiceDocument; replaced: DocumentFile | null }> {
  const requirementType = `${target.categoryName}:${body.requirementType}`
  const existing = await tx.verificationRequirement.findFirst({
    where: { workerProfileId: target.profileId, requirementType, documentCategory: 'SERVICE_QUALIFICATION' },
    select: { id: true, documentUrl: true, metadata: true },
    orderBy: { updatedAt: 'desc' },
  })
  const id = existing?.id ?? randomUUID()
  const metadata = {
    ...metaOf(existing?.metadata),
    serviceTitle: target.categoryName,
    category: target.kind,
    storageKey: staged.key,
    fileName: body.fileName,
    contentType: staged.type,
    sizeBytes: staged.sizeBytes,
    uploadId: body.uploadId,
  }
  const data = {
    requirementName: target.name,
    documentCategory: 'SERVICE_QUALIFICATION' as const,
    status: 'SUBMITTED' as const,
    documentUrl: documentPath(id, body.fileName, staged.type),
    documentUploadedAt: now,
    reviewedAt: null,
    reviewedBy: null,
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    updatedAt: now,
    metadata,
  }
  const row = existing
    ? await tx.verificationRequirement.update({ where: { id }, data, select: ROW_SELECT })
    : await tx.verificationRequirement.create({ data: { id, workerProfileId: target.profileId, requirementType, isRequired: target.required, ...data }, select: ROW_SELECT })
  const old = existing ? fileOf(existing) : null
  return { view: documentView(row), replaced: old && (old.storageKey !== staged.key || old.url !== row.documentUrl) ? old : null }
}

/** The confirm of an upload already recorded (a retry after the staging object was moved): its row, or null. */
export async function alreadyRecorded(tx: Tx | Prisma.TransactionClient, profileId: string, uploadId: string): Promise<ServiceDocument | null> {
  const row = await tx.verificationRequirement.findFirst({
    where: { workerProfileId: profileId, documentCategory: 'SERVICE_QUALIFICATION', metadata: { path: ['uploadId'], equals: uploadId } },
    select: ROW_SELECT,
  })
  return row ? documentView(row) : null
}

export async function removeDocument(tx: Tx, profileId: string, documentId: string): Promise<DocumentFile> {
  const row = await tx.verificationRequirement.findFirst({ where: { id: documentId, workerProfileId: profileId, documentCategory: 'SERVICE_QUALIFICATION' }, select: { id: true, documentUrl: true, metadata: true } })
  if (!row) throw new ApiError(404, 'service document not found') // another worker's is never revealed
  await tx.verificationRequirement.delete({ where: { id: row.id } })
  return fileOf(row)
}

/** A short link for a row: a signed GET for the api's own file, the stored URL for a legacy public one. */
export async function linkFor(
  bucket: PhotoStore | undefined,
  row: { workerProfileId: string; documentUrl: string | null; metadata: Prisma.JsonValue | null },
  now: Date,
): Promise<DocumentLink> {
  const m = metaOf(row.metadata)
  if (isOwnDocumentKey(m.storageKey, row.workerProfileId)) {
    if (!bucket) throw new ApiError(503, 'document store not configured', undefined, { 'retry-after': '2' })
    const expiresAt = new Date(now.getTime() + DOCUMENT_LINK_TTL_MS)
    const fileName = typeof m.fileName === 'string' && m.fileName ? m.fileName : 'document'
    const contentType = typeof m.contentType === 'string' ? m.contentType : 'application/octet-stream'
    try {
      return { url: await bucket.signedReadUrl(m.storageKey, expiresAt, { fileName, contentType }), expiresAt: expiresAt.toISOString() }
    } catch (err) {
      if (err instanceof StoreUnavailable) throw new ApiError(503, 'document store unavailable', undefined, { 'retry-after': '2' })
      throw err
    }
  }
  if (row.documentUrl && /^https:\/\//.test(row.documentUrl)) return { url: row.documentUrl, expiresAt: null }
  throw new ApiError(404, 'document has no file')
}

/**
 * After a commit, best-effort: each file is deleted only where the api can prove it is this worker's -- its own key in
 * the bucket, or a legacy Blob URL in the worker's own folder (ownServiceDocument). Anything else is left and logged.
 */
export async function deleteDocumentFiles(
  stores: { bucket?: PhotoStore; blob?: { delete(urlOrKey: string): Promise<void> } },
  files: readonly DocumentFile[],
  owner: { userId: string; profileId: string },
  ownBlobUrl: (url: string, userId: string) => boolean,
  log: { warn(o: object, m: string): void },
): Promise<void> {
  for (const f of files) {
    if (isOwnDocumentKey(f.storageKey, owner.profileId) && stores.bucket) {
      await stores.bucket.delete(f.storageKey).catch((err: unknown) => log.warn({ userId: owner.userId, err: err instanceof Error ? err.message : String(err) }, 'service document file delete failed'))
      continue
    }
    if (f.url && stores.blob && ownBlobUrl(f.url, owner.userId)) {
      await stores.blob.delete(f.url).catch((err: unknown) => log.warn({ userId: owner.userId, err: err instanceof Error ? err.message : String(err) }, 'service document file delete failed'))
      continue
    }
    if (f.storageKey || f.url) log.warn({ userId: owner.userId, reason: 'not-own-file' }, 'service document file left')
  }
}
