// The worker read on PostGIS (U1 worker-area, C6/C7/C9): the seeded fixture through the
// real transaction. Runs only when TEST_DATABASE_URL points at localhost (CI's API
// Quality job); the database-free half is profile.http.test.ts.
import { profileSchema, type Profile } from '@remonta/api-contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { persistCompletion } from '../../src/modules/worker/domain/persist-completion'
import { readProfileRows, readProfileRowsPage, type ProfileRows } from '../../src/modules/worker/persistence/profile-read'
import { statusOf } from '../../src/platform/errors'
import { createDb, lastDbSuccessAt, Prisma, readTransaction, unitOfWork } from '../../src/platform/persistence/db'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

/**
 * Statements the handler's transaction issues, BEGIN/COMMIT and the timeout excluded: the profile, its nine
 * relations (the HOME row's suburb nested), the catalogue category and its five nested relations -- 17 on
 * CI's first run, one per relation, none per row (U1-PRF-01; summary deviation 3).
 */
export const MAX_READ_STATEMENTS = 20

describe.skipIf(!local)('GET /v1/worker/profile on PostGIS', () => {
  let h: WorkerHarness
  beforeAll(async () => {
    h = await workerHarness('worker-profile.test')
  }, 60_000)
  afterAll(async () => {
    await h.close()
  })

  it('returns the seeded worker in the contract shape, every field from its column (E1, R2.2-R2.6)', async () => {
    const res = await h.get(h.a.userId)
    expect(res.statusCode).toBe(200)
    const body: Profile = profileSchema.parse(res.json())
    expect(body).toMatchObject({
      id: h.a.profileId,
      names: { firstName: 'Mary', middleName: null, lastName: "O'Connor" },
      mobile: '0412345678',
      photos: { main: 'https://blob.test/a.jpg', additional: ['https://blob.test/a2.jpg'] },
      personalInfo: { dateOfBirth: '1990-01-01', age: null, gender: 'Female', hasVehicle: 'Yes', languages: ['English'] },
      abn: { type: 'abn', value: null, signed: true },
      homeAddress: null,
      serviceArea: { label: 'Parramatta, NSW 2150', travelRadiusKm: 50, precision: 'LOCALITY' },
      displayRole: `Harness Care worker-profile.test`,
      verificationStatus: 'NOT_STARTED',
      isPublished: false,
      services: [{ categoryId: `${h.prefix}care`, subcategoryIds: [`${h.prefix}sub`], subcategoryNames: ['Harness Sub'] }],
      sections: {
        availability: [{ day: 'MONDAY', startMinute: 540, endMinute: 1020 }],
        experience: [{ domain: 'AGED_CARE', isProfessional: true, isPersonal: false, specificAreas: ['Dementia'] }],
        bankAccount: { accountName: 'M', bankName: 'CBA', bsbLast3: '000', accountNumberLast3: '399' },
      },
    })
    expect(body.sections.jobHistory).toHaveLength(1)
    expect(body.sections.education).toHaveLength(1)
    expect(body.sections.additionalInfo?.languages).toEqual(['English', 'Hindi'])
    // Completion: every flag true for the seeded worker (R3), the percentage from the 13 sections.
    expect(body.completion).toEqual({ accountDetails: true, compliance: true, trainings: true, services: true, profileCompleted: true, percent: 100 })
    // The groups: the harness documents with their statuses; part 1 appended; the sub-category document listed (R4).
    expect(body.requirements.mandatory.map((i) => [i.id, i.status])).toEqual([
      [h.docs.police, 'approved'],
      [h.docs.sub, 'submitted'],
      ['code-of-conduct-part1', 'approved'],
    ])
    expect(body.requirements.trainings.map((i) => [i.id, i.status])).toEqual([[h.docs.training, 'approved']])
    expect(res.body).not.toContain('55512399')
    expect(res.body).not.toContain('062000')
  })

  it('P4 and R2.7: the same ETag twice, 304 on If-None-Match; R2.8: the read persists nothing', async () => {
    const before = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true, updatedAt: true } })
    const a = await h.get(h.a.userId)
    const b = await h.get(h.a.userId)
    expect(a.headers['etag']).toBe(b.headers['etag'])
    expect(a.json()).toEqual(b.json())
    const c = await h.get(h.a.userId, { 'if-none-match': String(a.headers['etag']) })
    expect(c.statusCode).toBe(304)
    const after = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true, updatedAt: true } })
    expect(after).toEqual(before)
    expect(after.profileCompleted).toBe(false)
  })

  it('P1: the bare worker sees only its own rows; the orphan account is 404; the read commits a success for the health check', async () => {
    const res = await h.get(h.b.userId)
    expect(res.statusCode).toBe(200)
    const body = profileSchema.parse(res.json())
    expect(body.id).toBe(h.b.profileId)
    expect(body.serviceArea).toBeNull()
    expect(body.services).toEqual([])
    expect(body.requirements).toEqual({ mandatory: [], trainings: [] })
    expect(body.completion).toMatchObject({ accountDetails: false, compliance: false, trainings: false, services: false, profileCompleted: false })
    for (const foreign of [h.a.profileId, 'Mary', 'Parramatta', '0412345678']) expect(res.body).not.toContain(foreign)
    const none = await h.get(h.orphan.userId)
    expect(none.statusCode).toBe(404)
    expect(none.json().error.code).toBe('NOT_FOUND')
    expect(lastDbSuccessAt()).not.toBeNull()
    expect(Date.now() - lastDbSuccessAt()!).toBeLessThan(10_000)
  })

  it('U1-PRF-01: one transaction, a bounded number of statements, none per row', async () => {
    h.queries.length = 0
    await h.get(h.a.userId)
    const isPlumbing = (q: string) => /^(BEGIN|COMMIT|ROLLBACK|DEALLOCATE)/i.test(q.trim()) || /set_config\('statement_timeout'/.test(q)
    const statements = h.queries.filter((q) => !isPlumbing(q))
    expect(h.queries.filter((q) => /^BEGIN/i.test(q)).length).toBe(1)
    expect(h.queries.some((q) => /set_config\('statement_timeout'/.test(q))).toBe(true)
    expect(statements.length).toBeLessThanOrEqual(MAX_READ_STATEMENTS)
    // Twice the rows, the same number of statements.
    await h.db.workerJobHistory.create({ data: { workerProfileId: h.a.profileId, jobTitle: 'Second', company: 'Co', sortOrder: 1 } })
    await h.db.verificationRequirement.create({ data: { workerProfileId: h.a.profileId, requirementType: 'working-with-children', requirementName: 'WWC', status: 'SUBMITTED', updatedAt: new Date() } })
    h.queries.length = 0
    await h.get(h.a.userId)
    expect(h.queries.filter((q) => !isPlumbing(q)).length).toBe(statements.length)
  })

  it('the page read (the backfill) returns the same rows as the single read, one transaction per page', async () => {
    const singles = await Promise.all([h.a.userId, h.b.userId].map((u) => readProfileRows(h.db, u)))
    h.queries.length = 0
    const pages: ProfileRows[] = []
    let after = ''
    for (;;) {
      const page = await readProfileRowsPage(h.db, after, 50)
      if (page.length === 0) break
      pages.push(...page)
      after = page[page.length - 1]!.profile.id
    }
    const mine = pages.filter((r) => [h.a.profileId, h.b.profileId].includes(r.profile.id))
    expect(mine.map((r) => r.profile.id).sort()).toEqual([h.a.profileId, h.b.profileId].sort())
    for (const s of singles) expect(mine.find((r) => r.profile.id === s!.profile.id)).toEqual(s)
    // One transaction per page (plus the final empty page), whatever the row count.
    expect(h.queries.filter((q) => /^BEGIN/i.test(q)).length).toBe(Math.ceil(pages.length / 50) + 1)
  })

  it('P7: persistCompletion writes once, moves NOT_STARTED to IN_PROGRESS, and is a no-op the second time', async () => {
    const rows = (await readProfileRows(h.db, h.a.userId))!
    const { completionInputOf } = await import('../../src/modules/worker/application/get-profile')
    const { completionOf } = await import('../../src/modules/worker/domain/completion')
    const completion = completionOf(completionInputOf(rows))
    expect(completion.profileCompleted).toBe(true)
    const first = await unitOfWork(h.db, (tx) => persistCompletion(tx, h.a.profileId, completion))
    expect(first).toEqual({ changed: true, verificationStatus: 'IN_PROGRESS' })
    const stored = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true } })
    expect(stored).toEqual({ setupProgress: { accountDetails: true, compliance: true, trainings: true, services: true }, profileCompleted: true, verificationStatus: 'IN_PROGRESS' })
    const second = await unitOfWork(h.db, (tx) => persistCompletion(tx, h.a.profileId, completion))
    expect(second).toEqual({ changed: false, verificationStatus: 'IN_PROGRESS' })
    // A status past NOT_STARTED is never touched (the document paths own PENDING_REVIEW and beyond).
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { verificationStatus: 'PENDING_REVIEW', setupProgress: Prisma.JsonNull } })
    expect(await unitOfWork(h.db, (tx) => persistCompletion(tx, h.a.profileId, completion))).toEqual({ changed: true, verificationStatus: 'PENDING_REVIEW' })
    // The bare worker: all four false, nothing to move.
    const bRows = (await readProfileRows(h.db, h.b.userId))!
    const bCompletion = completionOf(completionInputOf(bRows))
    expect(await unitOfWork(h.db, (tx) => persistCompletion(tx, h.b.profileId, bCompletion))).toEqual({ changed: false, verificationStatus: 'NOT_STARTED' })
  })

  it('P13 b: a statement past its timeout is 503 with Retry-After and reason timeout; the next read succeeds', async () => {
    const slow = await workerHarness('worker-timeout.test', {
      read: (db, userId) =>
        readTransaction(db, 100, async (tx) => {
          await tx.$executeRaw`SELECT pg_sleep(1)`
          return readProfileRows(db, userId)
        }),
    })
    try {
      const res = await slow.get(slow.a.userId)
      expect(res.statusCode).toBe(503)
      expect(res.headers['retry-after']).toBe('2')
      expect(slow.logs.some((l) => l.msg === 'request failed' && l.reason === 'timeout')).toBe(true)
      expect((await slow.t.fastify.inject({ method: 'GET', url: '/v1/health' })).statusCode).toBe(200)
    } finally {
      await slow.close()
    }
  }, 30_000)

  it('P13 a: with a pool of one held by another transaction, the read is 503 (reason: pool) within the pool timeout, the health probe stays 200', async () => {
    const one = await workerHarness('worker-pool.test', { pool: { poolSize: 1, poolTimeoutS: 1 } })
    try {
      expect((await one.get(one.a.userId)).statusCode).toBe(200) // a recent success for the health check
      const holder = one.db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_sleep(2.5)`
      }, { timeout: 10_000 })
      await new Promise((r) => setTimeout(r, 200))
      const started = Date.now()
      const res = await one.get(one.a.userId)
      expect(res.statusCode).toBe(503)
      expect(res.headers['retry-after']).toBe('2')
      expect(Date.now() - started).toBeLessThan(2500)
      expect(one.logs.some((l) => l.msg === 'request failed' && l.reason === 'pool')).toBe(true)
      expect((await one.t.fastify.inject({ method: 'GET', url: '/v1/health' })).statusCode).toBe(200)
      await holder
      expect((await one.get(one.a.userId)).statusCode).toBe(200)
    } finally {
      await one.close()
    }
  }, 30_000)
})

describe('the overload mapping (P5, P12)', () => {
  it('P2024, 57014 and an unreachable database are 503', () => {
    expect(statusOf({ code: 'P2024' })).toBe(503)
    expect(statusOf({ meta: { code: '57014' } })).toBe(503)
    expect(statusOf(Object.assign(new Error('x'), { name: 'PrismaClientInitializationError' }))).toBe(503)
    expect(statusOf(new Error('canceling statement due to statement timeout'))).toBe(503)
  })
  it('createDb can emit query events for the tests only', async () => {
    if (!local) return
    const db = createDb(url!, { poolSize: 1, poolTimeoutS: 1 }, { queryEvents: true })
    const seen: string[] = []
    ;(db as unknown as { $on: (e: 'query', cb: (e: { query: string }) => void) => void }).$on('query', (e) => seen.push(e.query))
    await db.$queryRaw`SELECT 1`
    await db.$disconnect()
    expect(seen.some((q) => /SELECT 1/.test(q))).toBe(true)
  })
})
