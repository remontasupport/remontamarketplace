// signup-abn-agreement U1: the agreement's ticket and its staging rules on in-memory doubles. No database.
import { AGREEMENT_MAX_BYTES } from '@remonta/schemas/schema/workerRegistrationSchema'
import { describe, expect, it } from 'vitest'
import { createAgreementTicket, discardAgreement, stageAgreement } from '../../src/modules/registration/application/agreement'
import { TICKET_TTL_MS } from '../../src/modules/registration/domain/photo-upload'
import { InMemoryPhotoStore, TINY_JPEG } from './fakes'

const log = { info() {}, warn() {}, error() {}, debug() {}, trace() {}, fatal() {}, child() { return this } } as never
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n')
const PROFILE = '7c9e6679-7425-40de-944b-e07fc1f90ae7'

describe('createAgreementTicket', () => {
  it('signs a policy for staging/<fresh uuid>, a PDF, 5 MB and ten minutes; writes nothing', async () => {
    const bucket = new InMemoryPhotoStore()
    const now = new Date('2026-11-19T01:00:00Z')
    const r = await createAgreementTicket({ contentType: 'application/pdf', sizeBytes: 1234 }, { bucket, now: () => now }, log)
    expect(r.uploadId).toMatch(/^[0-9a-f-]{36}$/)
    expect(bucket.tickets).toEqual([{ key: `staging/${r.uploadId}`, contentType: 'application/pdf', maxBytes: AGREEMENT_MAX_BYTES, expiresAt: new Date(now.getTime() + TICKET_TTL_MS) }])
    expect(r.upload).toMatchObject({ method: 'POST', fileField: 'file' })
    expect(bucket.objects.size).toBe(0)
  })

  it('answers 503 with Retry-After naming the agreement when the store cannot sign', async () => {
    const bucket = new InMemoryPhotoStore()
    bucket.failNext('createUploadTicket')
    await expect(createAgreementTicket({ contentType: 'application/pdf', sizeBytes: 1 }, { bucket }, log)).rejects.toMatchObject({ status: 503, headers: { 'retry-after': '2' }, fields: { agreement: [expect.any(String)] } })
  })
})

describe('stageAgreement', () => {
  const agreement = (uploadId: string) => ({ uploadId, fileName: 'a.pdf', abn: '51824753556' })

  it('copies a PDF into the worker folder and removes the staging object', async () => {
    const bucket = new InMemoryPhotoStore()
    const id = crypto.randomUUID()
    bucket.putAsBrowser(`staging/${id}`, PDF, 'application/pdf')
    const staged = await stageAgreement(bucket, agreement(id), PROFILE, log)
    expect(staged).toMatchObject({ key: `documents/${PROFILE}/${id}.pdf`, type: 'application/pdf' })
    expect(bucket.objects.has(`staging/${id}`)).toBe(false)
  })

  it('refuses an image (a worker document, but not an agreement) on the agreement field and deletes it', async () => {
    const bucket = new InMemoryPhotoStore()
    const id = crypto.randomUUID()
    bucket.putAsBrowser(`staging/${id}`, TINY_JPEG, 'image/jpeg')
    await expect(stageAgreement(bucket, agreement(id), PROFILE, log)).rejects.toMatchObject({ status: 415, fields: { agreement: ['Please sign the agreement again'] } })
    expect(bucket.objects.size).toBe(0)
  })

  it('a missing upload is a 400 on the agreement', async () => {
    await expect(stageAgreement(new InMemoryPhotoStore(), agreement(crypto.randomUUID()), PROFILE, log)).rejects.toMatchObject({ status: 400, fields: { agreement: ['Please sign the agreement again'] } })
  })

  it('discard removes the copy when there is one, else the staging object', async () => {
    const bucket = new InMemoryPhotoStore()
    const id = crypto.randomUUID()
    bucket.putAsBrowser(`staging/${id}`, PDF, 'application/pdf')
    await discardAgreement(bucket, agreement(id), null, log)
    expect(bucket.objects.size).toBe(0)
    bucket.putAsBrowser(`documents/${PROFILE}/${id}.pdf`, PDF, 'application/pdf')
    await discardAgreement(bucket, agreement(id), { key: `documents/${PROFILE}/${id}.pdf`, type: 'application/pdf', sizeBytes: PDF.byteLength }, log)
    expect(bucket.objects.size).toBe(0)
  })
})
