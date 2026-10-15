// U3b service documents without a database: the checks on what landed, the keys, the stored path, the link, and the
// documents each service may carry (u3b-service-documents-design.md).
import { randomUUID } from 'node:crypto'
import { DOCUMENT_MAX_BYTES } from '@remonta/schemas/document-type'
import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { inlineDisposition } from '../../src/modules/registration/adapters/gcs-photo-store'
import { stagingKey } from '../../src/modules/registration/domain/photo-upload'
import { documentKey, documentPath, documentView, isOwnDocumentKey, linkFor, stageDocument } from '../../src/modules/worker/application/service-documents'
import { uploadableDocuments } from '../../src/modules/worker/domain/service-requirements'
import { InMemoryPhotoStore, TINY_JPEG } from '../registration/fakes'

const log = pino({ level: 'silent' })
const PDF = Buffer.from('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\n', 'binary')

describe('stageDocument: what landed is checked, then copied into the worker folder', () => {
  it('a PDF declared as a PDF: copied to documents/<profile>/<id>.pdf, the staging object gone', async () => {
    const bucket = new InMemoryPhotoStore()
    const id = randomUUID()
    bucket.putAsBrowser(stagingKey(id), PDF, 'application/pdf')
    const staged = await stageDocument(bucket, id, 'p1', log)
    expect(staged).toEqual({ key: `documents/p1/${id}.pdf`, type: 'application/pdf', sizeBytes: PDF.byteLength })
    expect(bucket.objects.has(`documents/p1/${id}.pdf`)).toBe(true)
    expect(bucket.objects.has(stagingKey(id))).toBe(false)
  })

  it('a photo of a certificate (JPEG) is a document too', async () => {
    const bucket = new InMemoryPhotoStore()
    const id = randomUUID()
    bucket.putAsBrowser(stagingKey(id), TINY_JPEG, 'image/jpeg')
    expect((await stageDocument(bucket, id, 'p1', log))?.key).toBe(`documents/p1/${id}.jpg`)
  })

  it('refused and deleted: not a document, bytes that are not what was declared, over 50 MB', async () => {
    const cases: [Buffer, string, number][] = [
      [Buffer.from('PK\x03\x04 a docx'), 'application/pdf', 415],
      [TINY_JPEG, 'application/pdf', 415],
      [PDF, 'image/jpeg', 415],
    ]
    for (const [data, type, status] of cases) {
      const bucket = new InMemoryPhotoStore()
      const id = randomUUID()
      bucket.putAsBrowser(stagingKey(id), data, type)
      await expect(stageDocument(bucket, id, 'p1', log)).rejects.toMatchObject({ status })
      expect(bucket.objects.size).toBe(0)
    }
    const bucket = new InMemoryPhotoStore()
    const id = randomUUID()
    bucket.putAsBrowser(stagingKey(id), Buffer.concat([PDF, Buffer.alloc(DOCUMENT_MAX_BYTES)]), 'application/pdf')
    await expect(stageDocument(bucket, id, 'p1', log)).rejects.toMatchObject({ status: 413 })
    expect(bucket.objects.size).toBe(0)
  })

  it('nothing at the key: null (the handler then looks for a recorded retry); the store down: 503', async () => {
    const bucket = new InMemoryPhotoStore()
    expect(await stageDocument(bucket, randomUUID(), 'p1', log)).toBeNull()
    bucket.failNext('inspect')
    await expect(stageDocument(bucket, randomUUID(), 'p1', log)).rejects.toMatchObject({ status: 503 })
  })
})

describe('keys and the stored path', () => {
  it('a key is the worker folder and the upload id; only such a key is the worker own', () => {
    const id = randomUUID()
    expect(documentKey('p1', id, 'image/heif')).toBe(`documents/p1/${id}.heif`)
    expect(isOwnDocumentKey(`documents/p1/${id}.pdf`, 'p1')).toBe(true)
    for (const k of [`documents/p2/${id}.pdf`, `documents/p1/../p2/${id}.pdf`, `staging/${id}`, 'documents/p10/x.pdf', 42, null]) expect(isOwnDocumentKey(k, 'p1'), String(k)).toBe(false)
  })

  it('the app path ends in the real extension (the admin page picks its viewer by it), the name encoded', () => {
    expect(documentPath('r1', 'AHPRA 2026.pdf', 'application/pdf')).toBe('/api/documents/r1/AHPRA%202026.pdf')
    expect(documentPath('r1', 'scan', 'image/jpeg')).toBe('/api/documents/r1/scan.jpg')
    expect(documentPath('r1', 'Cert#3?.PDF', 'application/pdf')).toBe('/api/documents/r1/Cert%233%3F.PDF')
  })

  it('a row as the worker sees it: the service and the type from the composite key', () => {
    const v = documentView({ id: 'r1', requirementType: 'Nursing Services:ahpra-registration', requirementName: 'AHPRA Registration', status: 'SUBMITTED', documentUrl: '/api/documents/r1/a.pdf', documentUploadedAt: new Date('2026-10-15T00:00:00Z'), metadata: { fileName: 'a.pdf' } })
    expect(v).toEqual({ id: 'r1', serviceName: 'Nursing Services', requirementType: 'ahpra-registration', name: 'AHPRA Registration', status: 'SUBMITTED', url: '/api/documents/r1/a.pdf', fileName: 'a.pdf', uploadedAt: '2026-10-15T00:00:00.000Z' })
    expect(documentView({ id: 'r2', requirementType: 'legacy', requirementName: 'x', status: 'APPROVED', documentUrl: null, documentUploadedAt: null, metadata: null })).toMatchObject({ serviceName: '', requirementType: 'legacy', fileName: null, uploadedAt: null })
  })

  it('the disposition header: the exact name as UTF-8, a safe ASCII copy', () => {
    expect(inlineDisposition('Zoë "cert"\\x.pdf')).toBe(`inline; filename="Zo_ _cert__x.pdf"; filename*=UTF-8''Zo%C3%AB%20%22cert%22%5Cx.pdf`)
  })
})

describe('linkFor', () => {
  const now = new Date('2026-10-15T00:00:00Z')
  it('the api own file: a five-minute signed link under the file name', async () => {
    const bucket = new InMemoryPhotoStore()
    const link = await linkFor(bucket, { workerProfileId: 'p1', documentUrl: '/api/documents/r1/a.pdf', metadata: { storageKey: 'documents/p1/x.pdf', fileName: 'a.pdf', contentType: 'application/pdf' } }, now)
    expect(link.expiresAt).toBe('2026-10-15T00:05:00.000Z')
    expect(link.url).toContain('documents/p1/x.pdf')
    expect(link.url).toContain('name=a.pdf')
  })
  it('a legacy public file: its URL; a key outside the row worker folder is never signed; nothing: 404; no store: 503', async () => {
    const bucket = new InMemoryPhotoStore()
    expect(await linkFor(bucket, { workerProfileId: 'p1', documentUrl: 'https://x.public.blob.vercel-storage.com/a.pdf', metadata: null }, now)).toEqual({ url: 'https://x.public.blob.vercel-storage.com/a.pdf', expiresAt: null })
    await expect(linkFor(bucket, { workerProfileId: 'p1', documentUrl: '/api/documents/r1/a.pdf', metadata: { storageKey: 'documents/p2/x.pdf' } }, now)).rejects.toMatchObject({ status: 404 })
    await expect(linkFor(bucket, { workerProfileId: 'p1', documentUrl: null, metadata: null }, now)).rejects.toMatchObject({ status: 404 })
    await expect(linkFor(undefined, { workerProfileId: 'p1', documentUrl: null, metadata: { storageKey: 'documents/p1/x.pdf' } }, now)).rejects.toMatchObject({ status: 503 })
  })
})

describe('uploadableDocuments: what a service may carry (S3) and what each is called', () => {
  it('nursing: AHPRA and the nursing qualification, both required', () => {
    const d = uploadableDocuments('Nursing Services', [])
    expect([...d.keys()].sort()).toEqual(['ahpra-registration', 'qualification-certificate'])
    expect(d.get('qualification-certificate')).toEqual({ name: 'Nursing Qualification Certificate', kind: 'QUALIFICATION', required: true })
  })
  it('the Support Worker services list the Cert III/IV types; no other service does', () => {
    expect(uploadableDocuments('Support Worker', []).get('cert3-individual-support')).toEqual({ name: 'Certificate 3 Individual Support', kind: 'QUALIFICATION', required: false })
    expect(uploadableDocuments('support worker (high intensity)', []).has('cert4-disabilities')).toBe(true)
    expect(uploadableDocuments('Cleaning Services', []).has('cert3-aged-care')).toBe(false)
  })
  it('therapeutic: by sub-category (AHPRA for a psychologist, association for a dietitian); an unknown service carries nothing', () => {
    expect(uploadableDocuments('Therapeutic Supports', ['psychologist']).has('ahpra-registration')).toBe(true)
    expect(uploadableDocuments('Therapeutic Supports', ['dietitian']).has('professional-association-membership')).toBe(true)
    expect(uploadableDocuments('Therapeutic Supports', ['dietitian']).has('ahpra-registration')).toBe(false)
    expect(uploadableDocuments('No Such Service', []).size).toBe(0)
  })
})
