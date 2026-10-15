// U3b service documents on PostGIS: ticket -> the browser's upload -> confirm -> the row, the link, the replace, the
// delete, the removal of the service; through the real pipeline and transactions, the bucket in memory. Runs only
// when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stagingKey } from '../../src/modules/registration/domain/photo-upload'
import { InMemoryPhotoStore } from '../registration/fakes'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
const PDF = Buffer.from('%PDF-1.7\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\n', 'binary')

describe.skipIf(!local)('U3b service documents on PostGIS', () => {
  let h: WorkerHarness
  let created = false
  const bucket = new InMemoryPhotoStore()
  const blobDeletes: string[] = []
  const photos = { bucket, publicBaseUrl: 'https://storage.test', ipHashSecret: 'x'.repeat(32), blob: { delete: async (u: string) => void blobDeletes.push(u) } }
  const as = (user: () => string) => ({ 'x-test-principal': `${user()}:WORKER` })
  const send = (method: string, path: string, body?: unknown, user = () => h.b.userId) => h.t.fastify.inject({ method: method as 'GET', url: path, headers: as(user), payload: body as object })
  const upload = async (data = PDF, contentType = 'application/pdf') => {
    const t = await send('POST', '/v1/worker/service-documents/tickets', { contentType, sizeBytes: data.byteLength })
    expect(t.statusCode, t.body).toBe(201)
    const uploadId = t.json().uploadId as string
    bucket.putAsBrowser(stagingKey(uploadId), data, contentType)
    return uploadId
  }
  const confirm = (uploadId: string, extra: object = {}) => send('POST', '/v1/worker/service-documents', { uploadId, categoryId: 'nursing-services', requirementType: 'ahpra-registration', fileName: 'AHPRA 2026.pdf', ...extra })

  beforeAll(async () => {
    h = await workerHarness('worker-service-docs.test', { photos })
    if (!(await h.db.category.findUnique({ where: { id: 'nursing-services' }, select: { id: true } }))) {
      await h.db.category.create({ data: { id: 'nursing-services', name: 'Nursing Services' } })
      created = true
    }
    const r = await send('PUT', '/v1/worker/services', { services: ['nursing-services'], subcategoryIds: [] })
    expect(r.statusCode, r.body).toBe(200)
  }, 60_000)
  afterAll(async () => {
    if (created) await h.db.category.deleteMany({ where: { id: 'nursing-services' } })
    await h.close()
  })

  let first = ''
  let firstKey = ''

  it('ticket, upload, confirm: the row as today, the file in the worker folder, the staging object gone', async () => {
    const uploadId = await upload()
    const res = await confirm(uploadId)
    expect(res.statusCode, res.body).toBe(201)
    const doc = res.json()
    first = doc.id
    expect(doc).toMatchObject({ serviceName: 'Nursing Services', requirementType: 'ahpra-registration', name: 'AHPRA Registration', status: 'SUBMITTED', fileName: 'AHPRA 2026.pdf', url: `/api/documents/${doc.id}/AHPRA%202026.pdf` })
    const row = await h.db.verificationRequirement.findUniqueOrThrow({ where: { id: doc.id } })
    expect(row).toMatchObject({ workerProfileId: h.b.profileId, requirementType: 'Nursing Services:ahpra-registration', documentCategory: 'SERVICE_QUALIFICATION', status: 'SUBMITTED' })
    firstKey = (row.metadata as { storageKey: string }).storageKey
    expect(firstKey).toBe(`documents/${h.b.profileId}/${uploadId}.pdf`)
    expect(bucket.objects.has(firstKey)).toBe(true)
    expect(bucket.objects.has(stagingKey(uploadId))).toBe(false)
    // A retry of the same confirm answers the same row.
    const again = await confirm(uploadId)
    expect(again.statusCode).toBe(201)
    expect(again.json().id).toBe(doc.id)
    expect((await h.get(h.b.userId)).json().serviceDocuments.map((d: any) => d.id)).toContain(doc.id)
  })

  it('the link: the owner gets a signed one; another worker gets 404 for the link and the delete', async () => {
    const link = await send('GET', `/v1/worker/service-documents/${first}/link`)
    expect(link.statusCode, link.body).toBe(200)
    expect(link.json().url).toContain(firstKey)
    expect((await send('GET', `/v1/worker/service-documents/${first}/link`, undefined, () => h.a.userId)).statusCode).toBe(404)
    expect((await send('DELETE', `/v1/worker/service-documents/${first}`, undefined, () => h.a.userId)).statusCode).toBe(404)
  })

  it('a new upload of the same type replaces it: the same row, SUBMITTED again, the old file deleted', async () => {
    await h.db.verificationRequirement.update({ where: { id: first }, data: { status: 'APPROVED', approvedAt: new Date(), reviewedBy: 'admin' } })
    const uploadId = await upload()
    const res = await confirm(uploadId, { fileName: 'AHPRA renewed.pdf' })
    expect(res.statusCode, res.body).toBe(201)
    expect(res.json().id).toBe(first)
    const row = await h.db.verificationRequirement.findUniqueOrThrow({ where: { id: first } })
    expect(row).toMatchObject({ status: 'SUBMITTED', approvedAt: null, reviewedBy: null })
    expect(bucket.objects.has(firstKey)).toBe(false)
    firstKey = (row.metadata as { storageKey: string }).storageKey
    expect(bucket.objects.has(firstKey)).toBe(true)
  })

  it('refused: a type the service does not ask for (400), a service not chosen (404), an upload never made (409); nothing recorded', async () => {
    const before = await h.db.verificationRequirement.count({ where: { workerProfileId: h.b.profileId } })
    const wrongType = await confirm(await upload(), { requirementType: 'trade-licence' })
    expect(wrongType.statusCode).toBe(400)
    expect(wrongType.json().error.fields).toHaveProperty('requirementType')
    expect((await confirm(await upload(), { categoryId: 'therapeutic-supports', requirementType: 'qualification-certificate' })).statusCode).toBe(404)
    expect((await confirm('7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b')).statusCode).toBe(409)
    expect(await h.db.verificationRequirement.count({ where: { workerProfileId: h.b.profileId } })).toBe(before)
  })

  it('delete: the row and its file', async () => {
    const res = await send('DELETE', `/v1/worker/service-documents/${first}`)
    expect(res.statusCode, res.body).toBe(200)
    expect(await h.db.verificationRequirement.findUnique({ where: { id: first } })).toBeNull()
    expect(bucket.objects.has(firstKey)).toBe(false)
  })

  it('D2 with the bucket: removing the service deletes its documents and their files', async () => {
    const res = await confirm(await upload(), { requirementType: 'qualification-certificate', fileName: 'Nursing degree.pdf' })
    expect(res.statusCode, res.body).toBe(201)
    const key = ((await h.db.verificationRequirement.findUniqueOrThrow({ where: { id: res.json().id } })).metadata as { storageKey: string }).storageKey
    const removed = await send('PUT', '/v1/worker/services', { services: [`${h.prefix}care`], subcategoryIds: [] })
    expect(removed.statusCode, removed.body).toBe(200)
    expect(await h.db.verificationRequirement.count({ where: { workerProfileId: h.b.profileId, requirementType: { startsWith: 'Nursing Services:' } } })).toBe(0)
    expect(bucket.objects.has(key)).toBe(false)
  })
})
