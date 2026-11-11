// document-history U1 on PostGIS: the admin's history entries (R3, R4) and the 7-year retention job (R5), through the
// real pipeline and transactions, the bucket in memory and the Blob store recorded. The worker paths that write the
// versions are in test/worker/{service,compliance}-documents.int.test.ts and services.int.test.ts. Runs only when
// TEST_DATABASE_URL points at localhost (CI).
import { adminContract } from '@remonta/api-contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { documentVersionRetentionJob } from '../../src/modules/worker/document-version-retention.job'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'
import { InMemoryPhotoStore } from '../registration/fakes'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
const DOMAIN = 'admin-document-versions.test'
const BLOB = 'https://abc.public.blob.vercel-storage.com'
const PDF = Buffer.from('%PDF-1.7\n', 'binary')

describe.skipIf(!local)('document-history U1: the admin history entries and the retention job on PostGIS', () => {
  let db: Db
  let t: TestApp
  let adminId = ''
  let workerUserId = ''
  let profileId = ''
  const bucket = new InMemoryPhotoStore()
  const blobDeletes: string[] = []
  const blob = { delete: async (u: string) => void blobDeletes.push(u) }
  const admin = () => ({ 'x-test-principal': `${adminId}:ADMIN` })
  const send = (method: 'GET' | 'DELETE', path: string, headers = admin()) => t.fastify.inject({ method, url: path, headers })

  const cleanup = async () => {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } })
    await db.auditLog.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } })
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } }) // profiles, requirements and versions cascade
  }
  const version = (over: { key?: string; url?: string; supersededAt: Date; reason?: 'REPLACED' | 'DELETED_BY_WORKER' | 'SERVICE_REMOVED'; fileName?: string; status?: 'APPROVED' | 'SUBMITTED' | 'REJECTED' }) =>
    db.documentVersion.create({
      data: {
        workerProfileId: profileId,
        requirementId: 'req-gone',
        requirementType: 'police-check',
        requirementName: 'National Police Check',
        status: over.status ?? 'APPROVED',
        reviewedBy: 'reviewer@remonta.test',
        documentUrl: over.url ?? '/api/documents/req-gone/scan.pdf',
        metadata: over.key ? { storageKey: over.key, fileName: over.fileName ?? 'scan.pdf', contentType: 'application/pdf' } : { fileName: over.fileName ?? 'old.pdf' },
        uploadedAt: new Date(over.supersededAt.getTime() - 86_400_000),
        reason: over.reason ?? 'REPLACED',
        supersededAt: over.supersededAt,
      },
      select: { id: true },
    })
  const key = (name: string) => {
    const k = `documents/${profileId}/${name}.pdf`
    bucket.putAsBrowser(k, PDF, 'application/pdf')
    return k
  }

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    adminId = (await db.user.create({ data: { email: `admin@${DOMAIN}`, passwordHash: 'x', role: 'ADMIN', status: 'ACTIVE', updatedAt: new Date() }, select: { id: true } })).id
    const w = await db.user.create({
      data: { email: `worker@${DOMAIN}`, passwordHash: 'x', role: 'WORKER', status: 'ACTIVE', updatedAt: new Date(), workerProfile: { create: { firstName: 'Vera', lastName: 'Versions', mobile: '0410000009', updatedAt: new Date() } } },
      select: { id: true, workerProfile: { select: { id: true } } },
    })
    workerUserId = w.id
    profileId = w.workerProfile!.id
    t = await testApp({ contracts: [adminContract], handlerSets: [adminHandlers({ db, clock: () => new Date(), bucket, blob })] })
  }, 60_000)
  afterAll(async () => {
    await t?.close()
    if (db) {
      await cleanup()
      await db.$disconnect()
    }
  })

  it('the list: newest first, the review each had, never a storage key; 404 for no worker; ADMIN only', async () => {
    const older = await version({ key: key('older'), supersededAt: new Date('2026-01-02T00:00:00Z'), fileName: 'first.pdf' })
    const newer = await version({ key: key('newer'), supersededAt: new Date('2026-03-04T00:00:00Z'), reason: 'DELETED_BY_WORKER', status: 'REJECTED' })
    const res = await send('GET', `/v1/admin/workers/${profileId}/document-versions`)
    expect(res.statusCode, res.body).toBe(200)
    const body = res.json()
    expect(body.truncated).toBe(false)
    expect(body.versions.map((v: { id: string }) => v.id)).toEqual([newer.id, older.id])
    expect(body.versions[1]).toMatchObject({ requirementId: 'req-gone', requirementType: 'police-check', name: 'National Police Check', status: 'APPROVED', reviewedBy: 'reviewer@remonta.test', fileName: 'first.pdf', reason: 'REPLACED', supersededAt: '2026-01-02T00:00:00.000Z' })
    expect(body.versions[0]).toMatchObject({ reason: 'DELETED_BY_WORKER', status: 'REJECTED' })
    expect(res.body).not.toContain('documents/') // the key stays in the api
    expect((await send('GET', '/v1/admin/workers/no-such-worker/document-versions')).statusCode).toBe(404)
    expect((await send('GET', `/v1/admin/workers/${profileId}/document-versions`, { 'x-test-principal': `${workerUserId}:WORKER` })).statusCode).toBe(403)
  })

  it('the link: a signed one for a private file, the stored URL for a legacy one; 404 for no version', async () => {
    const k = key('linked')
    const v = await version({ key: k, supersededAt: new Date('2026-05-01T00:00:00Z') })
    const link = await send('GET', `/v1/admin/document-versions/${v.id}/link`)
    expect(link.statusCode, link.body).toBe(200)
    expect(link.json().url).toContain(k)
    expect(link.json().expiresAt).not.toBeNull()
    const legacy = await version({ url: `${BLOB}/compliance/${workerUserId}/old.pdf`, supersededAt: new Date('2026-05-02T00:00:00Z') })
    expect((await send('GET', `/v1/admin/document-versions/${legacy.id}/link`)).json()).toEqual({ url: `${BLOB}/compliance/${workerUserId}/old.pdf`, expiresAt: null })
    expect((await send('GET', '/v1/admin/document-versions/no-such-version/link')).statusCode).toBe(404)
  })

  it('the delete: the row and its file, audited with the admin; a file a current document still uses is kept; a repeat is 404', async () => {
    const k = key('to-delete')
    const v = await version({ key: k, supersededAt: new Date('2026-06-01T00:00:00Z') })
    const res = await send('DELETE', `/v1/admin/document-versions/${v.id}`)
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ versionId: v.id })
    expect(await db.documentVersion.findUnique({ where: { id: v.id } })).toBeNull()
    expect(bucket.objects.has(k)).toBe(false)
    const audit = await db.auditLog.findFirstOrThrow({ where: { userId: adminId, action: 'DOCUMENT_VERSION_DELETE' }, orderBy: { createdAt: 'desc' } })
    expect(audit.metadata).toMatchObject({ versionId: v.id, workerProfileId: profileId, fileDeleted: true })
    expect((await send('DELETE', `/v1/admin/document-versions/${v.id}`)).statusCode).toBe(404)

    // The same key on the worker's current row (a copy that was never replaced): the version goes, the file stays.
    const shared = key('shared')
    await db.verificationRequirement.create({ data: { workerProfileId: profileId, requirementType: 'first-aid', requirementName: 'First Aid', status: 'SUBMITTED', documentUrl: '/api/documents/x/fa.pdf', metadata: { storageKey: shared }, updatedAt: new Date() } })
    const s = await version({ key: shared, supersededAt: new Date('2026-06-02T00:00:00Z') })
    expect((await send('DELETE', `/v1/admin/document-versions/${s.id}`)).statusCode).toBe(200)
    expect(bucket.objects.has(shared)).toBe(true)
  })

  it('the delete of a legacy file: the worker own Blob file goes, another folder is never touched', async () => {
    blobDeletes.length = 0
    const own = `${BLOB}/workers/${workerUserId}/service-documents/nursing/ahpra.pdf`
    const foreign = `${BLOB}/workers/someone-else/service-documents/nursing/x.pdf`
    const a = await version({ url: own, supersededAt: new Date('2026-07-01T00:00:00Z') })
    const b = await version({ url: foreign, supersededAt: new Date('2026-07-02T00:00:00Z') })
    expect((await send('DELETE', `/v1/admin/document-versions/${a.id}`)).statusCode).toBe(200)
    expect((await send('DELETE', `/v1/admin/document-versions/${b.id}`)).statusCode).toBe(200)
    expect(blobDeletes).toEqual([own])
  })

  it('retention: report counts and deletes nothing; apply deletes versions over seven years old with their files, and keeps the rest', async () => {
    const now = new Date('2033-07-01T00:00:00Z')
    const oldKey = key('eight-years')
    const old = await version({ key: oldKey, supersededAt: new Date('2025-06-30T00:00:00Z') })
    const recentKey = key('six-years')
    const recent = await version({ key: recentKey, supersededAt: new Date('2027-07-01T00:00:00Z') })
    const run = (mode: 'report' | 'apply') => documentVersionRetentionJob({ db, stores: { bucket, blob }, log: { warn: () => undefined }, mode }).run({ now, signal: new AbortController().signal, watermark: null })
    // Every version of this file is older than 2026-07-01 except `recent`: report counts them all, deletes none.
    const before = await db.documentVersion.count({ where: { supersededAt: { lt: new Date('2026-07-01T00:00:00Z') } } })
    expect((await run('report')).summary).toMatchObject({ mode: 'report', due: before })
    expect(await db.documentVersion.findUnique({ where: { id: old.id } })).not.toBeNull()
    expect((await run('apply')).summary).toMatchObject({ mode: 'apply', failed: 0 })
    expect(await db.documentVersion.findUnique({ where: { id: old.id } })).toBeNull()
    expect(bucket.objects.has(oldKey)).toBe(false)
    expect(await db.documentVersion.findUnique({ where: { id: recent.id } })).not.toBeNull()
    expect(bucket.objects.has(recentKey)).toBe(true)
  })
})
