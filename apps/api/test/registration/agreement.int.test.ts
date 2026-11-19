// signup-abn-agreement U1: the signed Contractor Agreement carried by the sign-up, end to end on PostGIS. The PDF lands
// where the dashboard's signing puts it and the rows are the ones it writes (R5, R7); an existing email or a refusal
// leaves no file (R6). Runs only when TEST_DATABASE_URL points at localhost (CI).
import { EXAMPLE_ABN } from '@remonta/schemas/validations/abn'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { InMemoryPhotoStore } from './fakes'
import { registrationHarness, type RegistrationHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false

const PDF = Buffer.from('%PDF-1.4\n% a signed Contractor Agreement\n%%EOF\n')

describe.skipIf(!local)('sign-up with the signed agreement (signup-abn-agreement U1)', () => {
  const bucket = new InMemoryPhotoStore()
  let h: RegistrationHarness

  beforeAll(async () => {
    h = await registrationHarness('agreement-test.example', { bucket })
  })
  afterAll(async () => {
    await h?.close()
  })

  /** The browser's part: a ticket, then the PDF under the ticket's key. */
  async function uploadedAgreement(data: Buffer = PDF, contentType = 'application/pdf') {
    const ticket = await h.t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/agreement-tickets', payload: { contentType: 'application/pdf', sizeBytes: data.byteLength } })
    expect(ticket.statusCode).toBe(201)
    const { uploadId, upload } = ticket.json() as { uploadId: string; upload: { fields: Record<string, string> } }
    bucket.putAsBrowser(upload.fields.key!, data, contentType)
    return { uploadId, fileName: 'Contractor_Agreement_Mary_OConnor_2026-11-19.pdf', abn: '51 824 753 556' }
  }

  const profileOf = (email: string) =>
    h.db.workerProfile.findFirstOrThrow({
      where: { user: { email } },
      select: { id: true, abn: true, verificationStatus: true, verificationRequirements: { select: { requirementType: true, documentUrl: true, status: true, metadata: true } } },
    })

  it('records the PDF as the contract-of-agreement row and the ABN engagement signed, in the worker folder', async () => {
    const agreement = await uploadedAgreement()
    const body = await h.body({ agreement })
    const res = await h.register(body)
    expect(res.statusCode).toBe(202)

    const p = await profileOf(body.email as string)
    expect(p.abn).toEqual({ workerEngagementType: { type: 'abn', signed: true, value: EXAMPLE_ABN } })
    const rows = p.verificationRequirements.filter((r) => r.requirementType === 'contract-of-agreement')
    expect(rows).toHaveLength(1)
    const row = rows[0]!
    expect(row.status).toBe('SUBMITTED')
    expect(row.documentUrl).toMatch(/^\/api\/documents\/[^/]+\/Contractor_Agreement_Mary_OConnor_2026-11-19\.pdf$/)
    const key = `documents/${p.id}/${agreement.uploadId}.pdf`
    expect(row.metadata).toMatchObject({ storageKey: key, uploadId: agreement.uploadId, contentType: 'application/pdf' })
    expect(bucket.objects.has(key)).toBe(true)
    expect(bucket.objects.has(`staging/${agreement.uploadId}`)).toBe(false)
    // As the dashboard's signing: a new document puts the worker in the review queue.
    expect(p.verificationStatus).toBe('PENDING_REVIEW')

    const audit = await h.db.auditLog.findFirstOrThrow({ where: { action: 'ACCOUNT_REGISTERED', metadata: { path: ['workerProfileId'], equals: p.id } }, select: { metadata: true } })
    expect(audit.metadata).toMatchObject({ agreement: true })
    expect(JSON.stringify(audit.metadata)).not.toContain(EXAMPLE_ABN)
  })

  it('without an agreement registers as before (the app before U2): no row, no engagement', async () => {
    const body = await h.body()
    expect((await h.register(body)).statusCode).toBe(202)
    const p = await profileOf(body.email as string)
    expect(p.abn).toBeNull()
    expect(p.verificationRequirements.filter((r) => r.requirementType === 'contract-of-agreement')).toHaveLength(0)
  })

  it('an existing email: the same 202, nothing recorded, the uploaded PDF deleted (R6)', async () => {
    const first = await h.body()
    expect((await h.register(first)).statusCode).toBe(202)
    const before = await profileOf(first.email as string)

    const agreement = await uploadedAgreement()
    const again = await h.body({ email: first.email, agreement })
    const res = await h.register(again)
    expect(res.statusCode).toBe(202)
    const after = await profileOf(first.email as string)
    expect(after.abn).toEqual(before.abn)
    expect(after.verificationRequirements).toHaveLength(before.verificationRequirements.length)
    expect(bucket.objects.has(`staging/${agreement.uploadId}`)).toBe(false)
  })

  it('an upload that never arrived is a field error on the agreement, and no account', async () => {
    const agreement = { ...(await uploadedAgreement()), uploadId: crypto.randomUUID() }
    const body = await h.body({ agreement })
    const res = await h.register(body)
    expect(res.statusCode).toBe(400)
    expect(JSON.stringify(res.json())).toContain('Please sign the agreement again')
    expect(await h.db.user.count({ where: { email: body.email as string } })).toBe(0)
  })

  it('a file that is not a PDF is refused, deleted, and no account is created', async () => {
    const agreement = await uploadedAgreement(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]), 'application/pdf')
    const body = await h.body({ agreement })
    const res = await h.register(body)
    expect(res.statusCode).toBe(415)
    expect(await h.db.user.count({ where: { email: body.email as string } })).toBe(0)
    expect(bucket.objects.has(`staging/${agreement.uploadId}`)).toBe(false)
  })

  it('a refusal inside the transaction deletes the copied PDF (no file without its account)', async () => {
    const agreement = await uploadedAgreement()
    // A photo id nobody uploaded: the transaction refuses after the PDF was copied.
    const body = await h.body({ agreement, photoUploadId: crypto.randomUUID() })
    const res = await h.register(body)
    expect(res.statusCode).toBe(400)
    expect([...bucket.objects.keys()].some((k) => k.endsWith(`/${agreement.uploadId}.pdf`))).toBe(false)
  })

  it('an invalid ABN is refused by the contract before anything is touched', async () => {
    const agreement = { ...(await uploadedAgreement()), abn: '51 824 753 557' }
    const res = await h.register(await h.body({ agreement }))
    expect(res.statusCode).toBe(400)
    expect(JSON.stringify(res.json())).toContain('That is not a valid ABN')
    expect(bucket.objects.has(`staging/${agreement.uploadId}`)).toBe(true) // never read: the bucket's lifecycle removes it
  })
})
