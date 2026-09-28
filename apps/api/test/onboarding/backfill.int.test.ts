// The step 10 onboarding backfill on PostGIS: dry run writes nothing; apply gives
// every unmarked worker a marker dated from the facts (source BACKFILL); a second
// run writes nothing; and the reconciler then agrees with every marker it wrote.
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { backfillWorkerOnboarding, formatOnboardingReport } from '../../src/modules/onboarding/backfill'
import { localityCandidates, reconcileWorker } from '../../src/modules/onboarding/reconciler'
import { createDb, unitOfWork, type Db } from '../../src/platform/persistence/db'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false
const DOMAIN = 's1-backfill-onboarding.example'
const DAY = 86_400_000
const NOW = new Date()
const daysAgo = (d: number) => new Date(NOW.getTime() - d * DAY)

describe.skipIf(!local)('onboarding backfill on PostGIS', () => {
  let db: Db
  const ids: Record<string, string> = {}

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    ids.fresh = await legacyWorker({ createdAt: daysAgo(30) })
    ids.inProgress = await legacyWorker({ createdAt: daysAgo(25) })
    await requirement(ids.inProgress, 'police-check', { status: 'SUBMITTED', documentUrl: 'u', documentUploadedAt: daysAgo(20), submittedAt: daysAgo(20), updatedAt: daysAgo(20) })
    await requirement(ids.inProgress, 'wwcc', {})
    ids.published = await legacyWorker({ createdAt: daysAgo(40), isPublished: true, updatedAt: daysAgo(5), lastLoginAt: daysAgo(1) })
    await requirement(ids.published, 'police-check', { status: 'APPROVED', documentUrl: 'u', documentUploadedAt: daysAgo(30), approvedAt: daysAgo(10), updatedAt: daysAgo(10) })
    await requirement(ids.published, 'wwcc', { status: 'APPROVED', documentUrl: 'u', documentUploadedAt: daysAgo(28), approvedAt: daysAgo(8), updatedAt: daysAgo(8) })
    // Already has a marker (the reconciler saw them): the backfill must not touch it.
    ids.marked = await legacyWorker({ createdAt: daysAgo(10) })
    await unitOfWork(db, (tx) => reconcileWorker(tx, ids.marked!, NOW, localityCandidates(db)))
  })
  afterAll(async () => {
    await cleanup()
    await db.$disconnect()
  })
  async function cleanup() {
    await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } })
  }

  async function legacyWorker(p: { createdAt: Date; updatedAt?: Date; isPublished?: boolean; lastLoginAt?: Date }) {
    const u = await db.user.create({
      data: {
        email: `${randomUUID().slice(0, 8)}@${DOMAIN}`,
        passwordHash: 'x',
        role: 'WORKER',
        status: 'ACTIVE',
        updatedAt: p.createdAt,
        lastLoginAt: p.lastLoginAt ?? null,
        workerProfile: {
          create: {
            firstName: 'Legacy', lastName: 'Worker', mobile: '0412 345 678', languages: [],
            location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786',
            isPublished: p.isPublished ?? false, createdAt: p.createdAt, updatedAt: p.updatedAt ?? p.createdAt,
          },
        },
      },
      include: { workerProfile: true },
    })
    return u.workerProfile!.id
  }
  const requirement = (workerProfileId: string, type: string, patch: Record<string, unknown>) =>
    db.verificationRequirement.create({ data: { workerProfileId, requirementType: type, requirementName: type, isRequired: true, createdAt: daysAgo(30), updatedAt: daysAgo(30), ...patch } })
  const ours = () => Object.values(ids)
  const markers = () => db.workerOnboarding.findMany({ where: { workerProfileId: { in: ours() } } })
  const transitions = () => db.workerOnboardingTransition.findMany({ where: { workerProfileId: { in: ours() } }, orderBy: { id: 'asc' } })

  it('dry run: reports the stages every unmarked worker would get, and writes nothing', async () => {
    const before = await transitions()
    const r = await backfillWorkerOnboarding(db, { apply: false, now: NOW, batch: 2 })
    expect(r.examined).toBeGreaterThanOrEqual(3)
    expect(r.byStage.SIGNED_UP).toBeGreaterThanOrEqual(1)
    expect(r.byStage.DOCUMENTS_IN_PROGRESS).toBeGreaterThanOrEqual(1)
    expect(r.byStage.PUBLISHED).toBeGreaterThanOrEqual(1)
    expect(r.approximations['publishedAt = profile updatedAt (apps/app does not record publication)']).toBeGreaterThanOrEqual(1)
    expect(r.written).toBe(0)
    expect((await markers()).map((m) => m.workerProfileId)).toEqual([ids.marked])
    expect(await transitions()).toEqual(before)
    expect(formatOnboardingReport(r)).toContain('DRY RUN (nothing written)')
  })

  it('apply: every unmarked worker gets a marker dated from the facts, with a BACKFILL transition; the marked one is untouched', async () => {
    const markedBefore = await db.workerOnboarding.findUniqueOrThrow({ where: { workerProfileId: ids.marked! } })
    const r = await backfillWorkerOnboarding(db, { apply: true, now: NOW, batch: 2 })
    expect(r.failed).toEqual([])
    expect(r.written).toBeGreaterThanOrEqual(3)

    const byId = new Map((await markers()).map((m) => [m.workerProfileId, m]))
    expect(byId.get(ids.fresh!)).toMatchObject({ stage: 'SIGNED_UP', stageEnteredAt: daysAgo(30), signedUpAt: daysAgo(30), mandatoryTotal: 0 })
    expect(byId.get(ids.inProgress!)).toMatchObject({ stage: 'DOCUMENTS_IN_PROGRESS', stageEnteredAt: daysAgo(20), firstDocumentAt: daysAgo(20), mandatoryTotal: 2, mandatoryUploaded: 1 })
    expect(byId.get(ids.published!)).toMatchObject({
      stage: 'PUBLISHED', stageEnteredAt: daysAgo(5), publishedAt: daysAgo(5), verifiedAt: daysAgo(8), documentsSubmittedAt: daysAgo(28), firstDocumentAt: daysAgo(30), firstSignInAt: daysAgo(1), mandatoryApproved: 2,
    })
    expect(byId.get(ids.marked!)).toEqual(markedBefore)

    const t = await transitions()
    const backfilled = t.filter((x) => x.workerProfileId !== ids.marked)
    expect(backfilled).toHaveLength(3)
    expect(backfilled).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ workerProfileId: ids.fresh, fromStage: null, toStage: 'SIGNED_UP', source: 'BACKFILL', cause: 'backfill', at: daysAgo(30) }),
        expect.objectContaining({ workerProfileId: ids.inProgress, fromStage: null, toStage: 'DOCUMENTS_IN_PROGRESS', source: 'BACKFILL', at: daysAgo(20) }),
        expect.objectContaining({ workerProfileId: ids.published, fromStage: null, toStage: 'PUBLISHED', source: 'BACKFILL', at: daysAgo(5) }),
      ]),
    )
    expect(t.filter((x) => x.workerProfileId === ids.marked)).toMatchObject([{ source: 'RECONCILER' }])
  })

  it('is idempotent: a second apply writes nothing and adds no history', async () => {
    const before = { markers: await markers(), transitions: await transitions() }
    const r = await backfillWorkerOnboarding(db, { apply: true, now: new Date(NOW.getTime() + 1000) })
    expect(ours().filter((id) => before.markers.some((m) => m.workerProfileId === id))).toHaveLength(4)
    expect(await markers()).toEqual(before.markers)
    expect(await transitions()).toEqual(before.transitions)
    expect(r.written).toBe(0)
  })

  it('the reconciler agrees with every backfilled marker: no stage change, no new transition', async () => {
    const before = await transitions()
    for (const id of ours()) {
      const o = await unitOfWork(db, (tx) => reconcileWorker(tx, id, new Date(NOW.getTime() + 2000), localityCandidates(db)))
      expect(o, id).toMatchObject({ created: false, changed: null })
    }
    expect(await transitions()).toEqual(before)
  })
}, 60_000)
