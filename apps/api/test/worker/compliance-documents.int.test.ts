// U4a compliance documents on PostGIS: ticket -> the browser's upload -> confirm -> the row, the review status, the
// link, the replace, the citizenship answer, the delete; through the real pipeline and transactions, the bucket in
// memory. Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stagingKey } from '../../src/modules/registration/domain/photo-upload'
import { InMemoryPhotoStore } from '../registration/fakes'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
const PDF = Buffer.from('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\n', 'binary')
const CATALOGUE_DOC = 'harness-u4a-first-aid'

describe.skipIf(!local)('U4a compliance documents on PostGIS', () => {
  let h: WorkerHarness
  const bucket = new InMemoryPhotoStore()
  const photos = { bucket, publicBaseUrl: 'https://storage.test', ipHashSecret: 'x'.repeat(32), blob: { delete: async () => undefined } }
  const send = (method: string, path: string, body?: unknown, user = () => h.b.userId) =>
    h.t.fastify.inject({ method: method as 'GET', url: path, headers: { 'x-test-principal': `${user()}:WORKER` }, payload: body as object })
  const upload = async () => {
    const t = await send('POST', '/v1/worker/service-documents/tickets', { contentType: 'application/pdf', sizeBytes: PDF.byteLength })
    expect(t.statusCode, t.body).toBe(201)
    bucket.putAsBrowser(stagingKey(t.json().uploadId), PDF, 'application/pdf')
    return t.json().uploadId as string
  }
  const confirm = async (extra: object) => send('POST', '/v1/worker/compliance-documents', { uploadId: await upload(), fileName: 'scan.pdf', ...extra })
  const nextYear = `${new Date().getUTCFullYear() + 1}-03-01`

  beforeAll(async () => {
    h = await workerHarness('worker-compliance.test', { photos })
    await h.db.document.upsert({ where: { id: CATALOGUE_DOC }, create: { id: CATALOGUE_DOC, name: 'Harness First Aid', category: 'TRAINING', description: 'test', updatedAt: new Date() }, update: {} })
  }, 60_000)
  afterAll(async () => {
    await h.db.document.deleteMany({ where: { id: CATALOGUE_DOC } })
    await h.close()
  })

  let police = ''
  let policeKey = ''

  it('a police check: the row as today, the worker in the review queue, the file private', async () => {
    const res = await confirm({ requirementType: 'police-check' })
    expect(res.statusCode, res.body).toBe(201)
    police = res.json().id
    expect(res.json()).toMatchObject({ requirementType: 'police-check', name: 'National Police Check', status: 'SUBMITTED', documentCategory: null, fileName: 'scan.pdf', url: `/api/documents/${police}/scan.pdf` })
    const row = await h.db.verificationRequirement.findUniqueOrThrow({ where: { id: police } })
    policeKey = (row.metadata as { storageKey: string }).storageKey
    expect(policeKey).toMatch(new RegExp(`^documents/${h.b.profileId}/`))
    expect(bucket.objects.has(policeKey)).toBe(true)
    expect((await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId } })).verificationStatus).toBe('PENDING_REVIEW')
    expect((await h.get(h.b.userId)).json().complianceDocuments.map((d: any) => d.id)).toContain(police)
  })

  it('identity carries its category; right to work needs an expiry; the Code of Conduct its acknowledgement', async () => {
    expect((await confirm({ requirementType: 'identity-passport' })).json().documentCategory).toBe('PRIMARY')
    expect((await confirm({ requirementType: 'identity-medicare-card' })).json().documentCategory).toBe('SECONDARY')
    const noExpiry = await confirm({ requirementType: 'right-to-work' })
    expect(noExpiry.statusCode).toBe(400)
    expect(noExpiry.json().error.fields).toHaveProperty('expiryDate')
    const rtw = await confirm({ requirementType: 'right-to-work', expiryDate: nextYear })
    expect(rtw.statusCode, rtw.body).toBe(201)
    expect(rtw.json().expiresAt).toBe(`${nextYear}T00:00:00.000Z`)
    expect((await confirm({ requirementType: 'code-of-conduct' })).statusCode).toBe(400)
    const coc = await confirm({ requirementType: 'code-of-conduct', acknowledgement: { workerName: 'Ben Nguyen', signatureDate: '2026-10-15' } })
    expect(coc.statusCode, coc.body).toBe(201)
    const meta = (await h.db.verificationRequirement.findUniqueOrThrow({ where: { id: coc.json().id } })).metadata as Record<string, unknown>
    expect(meta).toMatchObject({ workerName: 'Ben Nguyen', signatureDate: '2026-10-15' })
    expect(typeof meta.acknowledgedAt).toBe('string')
  })

  it('a catalogue training under its own id and name; a type we do not ask for is refused (C4)', async () => {
    const t = await confirm({ requirementType: CATALOGUE_DOC })
    expect(t.statusCode, t.body).toBe(201)
    expect(t.json().name).toBe('Harness First Aid')
    const bad = await confirm({ requirementType: 'made-up-document' })
    expect(bad.statusCode).toBe(400)
    expect(bad.json().error.fields).toHaveProperty('requirementType')
  })

  it('a new file of the same type: the same row, SUBMITTED again, the review cleared, the old file deleted', async () => {
    await h.db.verificationRequirement.update({ where: { id: police }, data: { status: 'APPROVED', approvedAt: new Date(), reviewedBy: 'admin' } })
    const res = await confirm({ requirementType: 'police-check' })
    expect(res.json().id).toBe(police)
    expect(await h.db.verificationRequirement.findUniqueOrThrow({ where: { id: police } })).toMatchObject({ status: 'SUBMITTED', approvedAt: null, reviewedBy: null })
    expect(bucket.objects.has(policeKey)).toBe(false)
  })

  it('the link: the owner gets one for any own row; another worker gets 404 for the link and the delete', async () => {
    const link = await send('GET', `/v1/worker/documents/${police}/link`)
    expect(link.statusCode, link.body).toBe(200)
    expect(link.json().expiresAt).not.toBeNull()
    expect((await send('GET', `/v1/worker/documents/${police}/link`, undefined, () => h.a.userId)).statusCode).toBe(404)
    expect((await send('DELETE', `/v1/worker/compliance-documents/${police}`, undefined, () => h.a.userId)).statusCode).toBe(404)
  })

  it('citizenship: yes is SUBMITTED; no keeps an uploaded document and takes back a fileless claim', async () => {
    const yes = await send('PUT', '/v1/worker/compliance/right-to-work/citizenship', { isCitizen: true })
    expect(yes.statusCode, yes.body).toBe(200)
    expect(yes.json()).toMatchObject({ requirementType: 'right-to-work', status: 'SUBMITTED', isCitizen: true })
    // b uploaded a right-to-work file above: a "no" leaves it SUBMITTED.
    expect((await send('PUT', '/v1/worker/compliance/right-to-work/citizenship', { isCitizen: false })).json()).toMatchObject({ status: 'SUBMITTED', isCitizen: false })
    // a has no right-to-work row: yes then no ends PENDING.
    await send('PUT', '/v1/worker/compliance/right-to-work/citizenship', { isCitizen: true }, () => h.a.userId)
    expect((await send('PUT', '/v1/worker/compliance/right-to-work/citizenship', { isCitizen: false }, () => h.a.userId)).json()).toMatchObject({ status: 'PENDING' })
  })

  it('U4d the contract: the PDF kept privately and the engagement signed, together; a TFN is never stored; an ABN number stays', async () => {
    const sign = async (engagementType: string, extra: object = {}) => send('POST', '/v1/worker/contract', { uploadId: await upload(), engagementType, fileName: 'Contract.pdf', ...extra })
    await h.db.workerProfile.update({ where: { id: h.b.profileId }, data: { abn: { workerEngagementType: { type: 'abn', value: '51824753556', signed: false } } } })
    const abn = await sign('abn')
    expect(abn.statusCode, abn.body).toBe(201)
    expect(abn.json()).toMatchObject({ document: { requirementType: 'contract-of-agreement', name: 'Contract of Agreement', status: 'SUBMITTED', fileName: 'Contract.pdf' }, engagement: { type: 'abn', signed: true } })
    let p = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId }, select: { abn: true } })
    expect(p.abn).toEqual({ workerEngagementType: { type: 'abn', signed: true, value: '51824753556' } })
    const row = await h.db.verificationRequirement.findUniqueOrThrow({ where: { id: abn.json().document.id } })
    const key = (row.metadata as { storageKey: string }).storageKey
    expect(key).toMatch(new RegExp(`^documents/${h.b.profileId}/`))
    // Signing again as TFN: the same row, the old file gone, the engagement TFN with no number.
    const tfn = await sign('tfn')
    expect(tfn.statusCode, tfn.body).toBe(201)
    expect(tfn.json().document.id).toBe(row.id)
    expect(bucket.objects.has(key)).toBe(false)
    p = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId }, select: { abn: true } })
    expect(p.abn).toEqual({ workerEngagementType: { type: 'tfn', signed: true } })
    // Refused before anything is written: a type that is neither, a tax number in the body, nothing uploaded.
    const before = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId }, select: { abn: true, updatedAt: true } })
    expect((await sign('acn')).statusCode).toBe(400)
    expect((await sign('tfn', { tfn: '123456782' })).statusCode).toBe(400)
    const none = await send('POST', '/v1/worker/contract', { uploadId: '7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b', engagementType: 'abn', fileName: 'Contract.pdf' })
    expect(none.statusCode).toBe(409)
    expect(await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId }, select: { abn: true, updatedAt: true } })).toEqual(before)
  })

  it('delete: the row and its file; a service document is not this entry', async () => {
    const del = await send('DELETE', `/v1/worker/compliance-documents/${police}`)
    expect(del.statusCode, del.body).toBe(200)
    expect(await h.db.verificationRequirement.findUnique({ where: { id: police } })).toBeNull()
    const sq = await h.db.verificationRequirement.findFirstOrThrow({ where: { workerProfileId: h.a.profileId, documentCategory: 'SERVICE_QUALIFICATION' } })
    expect((await send('DELETE', `/v1/worker/compliance-documents/${sq.id}`, undefined, () => h.a.userId)).statusCode).toBe(404)
  })
})
