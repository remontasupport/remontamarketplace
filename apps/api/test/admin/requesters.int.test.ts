// admin-clients U1 on PostGIS: the clients / coordinators list (BR-1, BR-2) against the fixture as an oracle, the detail
// (BR-3, BR-9) and the status change (BR-7: row, audit and outbox in one transaction; nothing on a repeat). Accounts
// isolated by an email domain (the list's search keeps the rest of the database out). Runs only when TEST_DATABASE_URL
// points at localhost (CI).
import { adminContract } from '@remonta/api-contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { SERVICE_REQUEST_STATUS_CHANGED } from '../../src/modules/admin/domain/events'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const DOMAIN = 'admin-requesters.test'
const REQUEST = { services: { 'support-worker': { categoryName: 'Support Worker', subCategories: [] } }, details: { fundingType: 'NDIS', description: 'Weekly shopping' }, location: 'Parramatta NSW 2150' }

describe.skipIf(!local)('admin-clients U1: clients and coordinators on PostGIS', () => {
  let db: Db
  let t: TestApp
  let adminHeader: Record<string, string>
  let adminId = ''
  const id = {} as Record<'workerUser' | 'workerProfile' | 'c1' | 'c2' | 'k1' | 'p1' | 'p2old' | 'p2new' | 'pGone' | 'r1' | 'r2' | 'r2b' | 'rGone', string>

  const cleanup = async () => {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } })
    const userIds = users.map((u) => u.id)
    const requests = await db.serviceRequest.findMany({ where: { requesterId: { in: userIds } }, select: { id: true } })
    for (const r of requests) await db.outboxEvent.deleteMany({ where: { type: SERVICE_REQUEST_STATUS_CHANGED, payload: { path: ['serviceRequestId'], equals: r.id } } })
    await db.serviceRequest.deleteMany({ where: { requesterId: { in: userIds } } })
    await db.participant.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { lastName: 'Requestersharness' }] } })
    await db.auditLog.deleteMany({ where: { userId: { in: userIds } } })
    await db.user.deleteMany({ where: { id: { in: userIds } } }) // profiles cascade
  }
  const now = () => new Date()
  const user = (email: string, role: 'ADMIN' | 'CLIENT' | 'COORDINATOR' | 'WORKER', createdAt: Date, profile: object = {}) =>
    db.user.create({ data: { email: `${email}@${DOMAIN}`, passwordHash: 'x', role, status: 'ACTIVE', createdAt, updatedAt: now(), ...profile }, select: { id: true } })
  const participant = (userId: string | null, firstName: string, fundingType: 'NDIS' | 'PRIVATE' | null, createdAt: Date) =>
    db.participant.create({ data: { userId, firstName, lastName: 'Requestersharness', fundingType, conditions: ['Autism'], dateOfBirth: new Date('1990-05-01T00:00:00Z'), createdAt }, select: { id: true } })
  const request = (requesterId: string, participantId: string, status: 'PENDING' | 'ACTIVE' | 'COMPLETED', createdAt: Date, extra: object = {}) =>
    db.serviceRequest.create({ data: { requesterId, participantId, status, createdAt, selectedWorkers: ['w1'], ...REQUEST, ...extra }, select: { id: true } })
  const list = async (q: Record<string, string>) => {
    const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/requesters?${new URLSearchParams({ search: DOMAIN, ...q })}`, headers: adminHeader })
    expect(res.statusCode, res.body).toBe(200)
    return res.json() as { data: { userId: string; organisation?: string; participantCount: number; requestCount: number }[]; pagination: { total: number; hasNext: boolean } }
  }
  const putStatus = (requestId: string, status: string, headers = adminHeader) =>
    t.fastify.inject({ method: 'PUT', url: `/v1/admin/service-requests/${requestId}/status`, headers, payload: { status } })

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    const day = (n: number) => new Date(Date.UTC(2026, 0, n))
    adminId = (await user('admin', 'ADMIN', day(1))).id
    adminHeader = { 'x-test-principal': `${adminId}:ADMIN` }
    const worker = await user('worker', 'WORKER', day(1), { workerProfile: { create: { firstName: 'Wendy', lastName: 'Worker', mobile: '0410000000', updatedAt: now() } } })
    id.workerUser = worker.id
    id.workerProfile = (await db.workerProfile.findUniqueOrThrow({ where: { userId: worker.id }, select: { id: true } })).id
    // c1 (older): one NDIS participant with an ACTIVE request; c2 (newer): a PRIVATE participant with a PENDING request,
    // and an unowned participant whose request c2 filed (removed: not counted, FR-5).
    id.c1 = (await user('c1', 'CLIENT', day(2), { clientProfile: { create: { firstName: 'Cara', lastName: 'One', mobile: '0400000001' } } })).id
    id.c2 = (await user('c2', 'CLIENT', day(3), { clientProfile: { create: { firstName: 'Cody', lastName: 'Two', mobile: '0400000002' } } })).id
    id.k1 = (await user('k1', 'COORDINATOR', day(4), { coordinatorProfile: { create: { firstName: 'Kim', lastName: 'Coord', mobile: '0400000003', organization: 'Care Co' } } })).id
    id.p1 = (await participant(id.c1, 'Pat', 'NDIS', day(5))).id
    id.p2old = (await participant(id.c2, 'Penny', 'PRIVATE', day(5))).id
    id.p2new = (await participant(id.c2, 'Paul', null, day(6))).id
    id.pGone = (await participant(null, 'Gone', 'NDIS', day(5))).id
    id.r1 = (await request(id.c1, id.p1, 'ACTIVE', day(7), { assignedWorker: [id.workerUser, 'no-such-user'] })).id
    id.r2 = (await request(id.c2, id.p2old, 'PENDING', day(7))).id
    id.r2b = (await request(id.c2, id.p2old, 'COMPLETED', day(8))).id
    id.rGone = (await request(id.c2, id.pGone, 'PENDING', day(7))).id
    t = await testApp({ contracts: [adminContract], handlerSets: [adminHandlers({ db, clock: now })] })
  }, 60_000)
  afterAll(async () => {
    await t?.close()
    if (db) {
      await cleanup()
      await db.$disconnect()
    }
  })

  it('BR-1: each role lists its own accounts, newest first, with owned-participant and request counts', async () => {
    const clients = await list({ role: 'CLIENT' })
    expect(clients.data.map((r) => r.userId)).toEqual([id.c2, id.c1])
    expect(clients.data.map((r) => [r.participantCount, r.requestCount])).toEqual([[2, 3], [1, 1]])
    expect(clients.data.every((r) => !('organisation' in r))).toBe(true)
    const coordinators = await list({ role: 'COORDINATOR' })
    expect(coordinators.data).toEqual([expect.objectContaining({ userId: id.k1, organisation: 'Care Co', participantCount: 0, requestCount: 0 })])
  })

  it('BR-2: the status and funding filters, alone and together; the search; the page', async () => {
    const ids = async (q: Record<string, string>) => (await list({ role: 'CLIENT', ...q })).data.map((r) => r.userId)
    expect(await ids({ requestStatus: 'ACTIVE' })).toEqual([id.c1])
    expect(await ids({ requestStatus: 'PENDING' })).toEqual([id.c2])
    expect(await ids({ fundingType: 'NDIS' })).toEqual([id.c1]) // the unowned NDIS participant does not count for c2
    expect(await ids({ fundingType: 'PRIVATE', requestStatus: 'ACTIVE' })).toEqual([])
    // The participants filter: owned ones only (the unowned participant is nobody's).
    expect(await ids({ participants: 'with' })).toEqual([id.c2, id.c1])
    expect(await ids({ participants: 'without' })).toEqual([])
    expect((await list({ role: 'COORDINATOR', participants: 'without' })).data.map((r) => r.userId)).toEqual([id.k1])
    expect((await list({ role: 'COORDINATOR', participants: 'with' })).data).toEqual([])
    expect(await ids({ search: `c1@${DOMAIN}` })).toEqual([id.c1])
    expect(await ids({ search: 'cody' })).toEqual(expect.arrayContaining([id.c2]))
    const page = await list({ role: 'CLIENT', pageSize: '1' })
    expect(page.pagination).toMatchObject({ total: 2, hasNext: true })
  })

  it('BR-3/BR-9: the detail holds owned participants newest first with every field and their requests; the view is audited', async () => {
    const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/requesters/${id.c2}`, headers: adminHeader })
    expect(res.statusCode, res.body).toBe(200)
    expect(res.headers['cache-control']).toBe('no-store')
    const body = res.json() as { requester: { userId: string }; participants: { id: string; dateOfBirth: string; conditions: string[]; requests: { id: string }[] }[] }
    expect(body.requester.userId).toBe(id.c2)
    expect(body.participants.map((p) => p.id)).toEqual([id.p2new, id.p2old])
    expect(body.participants[1]).toMatchObject({ dateOfBirth: '1990-05-01T00:00:00.000Z', conditions: ['Autism'] })
    expect(body.participants[1]!.requests.map((r) => r.id)).toEqual([id.r2b, id.r2])
    const audit = await db.auditLog.findMany({ where: { userId: adminId, action: 'ADMIN_RECORD_VIEW' }, select: { metadata: true } })
    expect(audit.map((a) => (a.metadata as { requesterUserId: string }).requesterUserId)).toContain(id.c2)
  })

  it('BR-3: assigned workers resolve to their profile; an unknown one is left out', async () => {
    const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/requesters/${id.c1}`, headers: adminHeader })
    const body = res.json() as { participants: { requests: { assignedWorkers: unknown[] }[] }[] }
    expect(body.participants[0]!.requests[0]!.assignedWorkers).toEqual([{ workerProfileId: id.workerProfile, name: 'Wendy Worker' }])
  })

  it('BR-3/N2: 404 for a worker or unknown id; 403 for anyone but an admin', async () => {
    for (const userId of [id.workerUser, 'nobody']) {
      const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/requesters/${userId}`, headers: adminHeader })
      expect(res.statusCode, userId).toBe(404)
    }
    const res = await t.fastify.inject({ method: 'GET', url: `/v1/admin/requesters/${id.c1}`, headers: { 'x-test-principal': `${id.c1}:CLIENT` } })
    expect(res.statusCode).toBe(403)
    expect((await putStatus(id.r1, 'COMPLETED', { 'x-test-principal': `${id.c1}:CLIENT` })).statusCode).toBe(403)
  })

  it('BR-7: a change writes the row, its audit and one outbox event; a repeat writes nothing; CANCELLED clears the selection', async () => {
    const events = () => db.outboxEvent.count({ where: { type: SERVICE_REQUEST_STATUS_CHANGED, payload: { path: ['serviceRequestId'], equals: id.r2 } } })
    const audits = () => db.auditLog.count({ where: { userId: adminId, action: 'SERVICE_REQUEST_STATUS_CHANGE' } })
    const before = await audits()

    const res = await putStatus(id.r2, 'CANCELLED')
    expect(res.statusCode, res.body).toBe(200)
    expect(res.json()).toEqual({ requestId: id.r2, status: 'CANCELLED' })
    expect(await db.serviceRequest.findUniqueOrThrow({ where: { id: id.r2 }, select: { status: true, selectedWorkers: true } })).toEqual({ status: 'CANCELLED', selectedWorkers: [] })
    expect(await events()).toBe(1)
    expect(await audits()).toBe(before + 1)

    expect((await putStatus(id.r2, 'CANCELLED')).statusCode).toBe(200)
    expect(await events()).toBe(1)
    expect(await audits()).toBe(before + 1)

    // An ACTIVE request, which the client cannot edit, moves too; another status keeps the selection.
    expect((await putStatus(id.r1, 'MATCHING')).statusCode).toBe(200)
    expect(await db.serviceRequest.findUniqueOrThrow({ where: { id: id.r1 }, select: { status: true, selectedWorkers: true } })).toEqual({ status: 'MATCHING', selectedWorkers: ['w1'] })
  })

  it('BR-7: 404 for an unknown request; 400 for an unknown status', async () => {
    expect((await putStatus('nope', 'ACTIVE')).statusCode).toBe(404)
    expect((await putStatus(id.r1, 'DONE')).statusCode).toBe(400)
  })
})
