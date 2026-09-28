// The onboarding reconciler on PostGIS, fed the way apps/app writes today: users,
// worker_profiles (legacy location columns) and verification_requirements.
import { randomUUID } from 'node:crypto'
import pino from 'pino'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { onboardingReconcilerJob, reconcileWorker } from '../../src/modules/onboarding/reconciler'
import { createDb, unitOfWork, type Db } from '../../src/platform/persistence/db'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false
const DOMAIN = 's1-reconciler.example'
const DAY = 86_400_000

describe.skipIf(!local)('onboarding reconciler on PostGIS', () => {
  let db: Db
  let mountVictoria: { id: number }
  const candidatesFor = (postcode: string) =>
    db.auLocality.findMany({ where: { postcode, retiredAt: null }, select: { id: true, searchName: true, state: true, postcode: true } })

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    mountVictoria = await db.auLocality.findFirstOrThrow({ where: { searchName: 'mount victoria', state: 'NSW', postcode: '2786' } })
  })
  afterAll(async () => {
    await cleanup()
    await db.$disconnect()
  })
  async function cleanup() {
    await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } })
  }

  /** A worker as apps/app's processWorkerRegistration creates one today. */
  async function legacyWorker(loc: { location: string; city: string | null; state: string | null; postalCode: string | null }) {
    const u = await db.user.create({
      data: {
        email: `${randomUUID().slice(0, 8)}@${DOMAIN}`,
        passwordHash: 'x',
        role: 'WORKER',
        status: 'ACTIVE',
        updatedAt: new Date(),
        workerProfile: { create: { firstName: 'Legacy', lastName: 'Worker', mobile: '0412 345 678', ...loc, languages: [], updatedAt: new Date() } },
      },
      include: { workerProfile: true },
    })
    return u.workerProfile!.id
  }
  const requirement = (workerProfileId: string, type: string, patch: Record<string, unknown> = {}) =>
    db.verificationRequirement.create({ data: { workerProfileId, requirementType: type, requirementName: type, isRequired: true, updatedAt: new Date(), ...patch } })
  const reconcile = (pid: string, now = new Date()) => unitOfWork(db, (tx) => reconcileWorker(tx, pid, now, candidatesFor))
  const marker = (pid: string) => db.workerOnboarding.findUniqueOrThrow({ where: { workerProfileId: pid } })
  const history = async (pid: string) =>
    (await db.workerOnboardingTransition.findMany({ where: { workerProfileId: pid }, orderBy: { id: 'asc' } })).map((t) => `${t.fromStage ?? '-'} -> ${t.toStage} (${t.source})`)

  it('gives a legacy sign-up its marker and HOME -- matching "Mount Victoria" despite apps/app storing city "Mount"', async () => {
    const pid = await legacyWorker({ location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786' })
    const o = await reconcile(pid)
    expect(o).toMatchObject({ created: true, home: 'created' })
    expect(await marker(pid)).toMatchObject({ stage: 'SIGNED_UP', mandatoryTotal: 0 })
    expect(await history(pid)).toEqual(['- -> SIGNED_UP (RECONCILER)'])
    expect(await db.workerLocation.findMany({ where: { workerProfileId: pid } })).toMatchObject([
      { kind: 'HOME', localityId: mountVictoria.id, travelRadiusKm: 50, precision: 'LOCALITY', source: 'RECONCILER' },
    ])
  })

  it('follows the documents through the stages, one transition per change, and is idempotent', async () => {
    const pid = await legacyWorker({ location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786' })
    const police = await requirement(pid, 'police-check')
    const wwcc = await requirement(pid, 'wwcc')
    await reconcile(pid)
    expect((await marker(pid)).stage).toBe('SIGNED_UP')
    expect(await marker(pid)).toMatchObject({ mandatoryTotal: 2, mandatoryUploaded: 0 })

    await db.verificationRequirement.update({ where: { id: police.id }, data: { status: 'SUBMITTED', documentUrl: 'https://x/p.pdf', documentUploadedAt: new Date(), submittedAt: new Date(), updatedAt: new Date() } })
    await reconcile(pid)
    expect((await marker(pid)).stage).toBe('DOCUMENTS_IN_PROGRESS')
    expect((await marker(pid)).firstDocumentAt).toBeInstanceOf(Date)

    await db.verificationRequirement.update({ where: { id: wwcc.id }, data: { status: 'SUBMITTED', documentUrl: 'https://x/w.pdf', documentUploadedAt: new Date(), updatedAt: new Date() } })
    await reconcile(pid)
    expect((await marker(pid)).stage).toBe('DOCUMENTS_SUBMITTED')

    const soon = new Date(Date.now() + 2 * DAY)
    for (const r of [police, wwcc]) await db.verificationRequirement.update({ where: { id: r.id }, data: { status: 'APPROVED', approvedAt: new Date(), expiresAt: soon, updatedAt: new Date() } })
    await reconcile(pid)
    expect(await marker(pid)).toMatchObject({ stage: 'VERIFIED', mandatoryApproved: 2 })
    expect((await marker(pid)).verifiedAt).toBeInstanceOf(Date)

    // Nothing changed: no new transition, no new version churn in the history.
    const before = await history(pid)
    await reconcile(pid)
    expect(await history(pid)).toEqual(before)

    // Time passes: the approval lapses with no row changing.
    await reconcile(pid, new Date(Date.now() + 3 * DAY))
    expect((await marker(pid)).stage).toBe('ACTION_REQUIRED')
    expect(await history(pid)).toEqual([
      '- -> SIGNED_UP (RECONCILER)',
      'SIGNED_UP -> DOCUMENTS_IN_PROGRESS (RECONCILER)',
      'DOCUMENTS_IN_PROGRESS -> DOCUMENTS_SUBMITTED (RECONCILER)',
      'DOCUMENTS_SUBMITTED -> VERIFIED (RECONCILER)',
      'VERIFIED -> ACTION_REQUIRED (RECONCILER)',
    ])
  })

  it('treats a requirement apps/app marked EXPIRED as a lapsed approval', async () => {
    const pid = await legacyWorker({ location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786' })
    await requirement(pid, 'police-check', { status: 'EXPIRED', approvedAt: new Date(Date.now() - 400 * DAY), expiresAt: null, documentUrl: 'u' })
    await reconcile(pid)
    expect((await marker(pid)).stage).toBe('ACTION_REQUIRED')
  })

  it('records a jump when several things changed between runs', async () => {
    const pid = await legacyWorker({ location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786' })
    await reconcile(pid)
    await requirement(pid, 'police-check', { status: 'APPROVED', approvedAt: new Date(), documentUrl: 'u' })
    await reconcile(pid)
    const t = await db.workerOnboardingTransition.findMany({ where: { workerProfileId: pid }, orderBy: { id: 'asc' } })
    expect(t.at(-1)).toMatchObject({ fromStage: 'SIGNED_UP', toStage: 'VERIFIED', cause: 'reconciled (several changes at once)' })
  })

  it('moves HOME when the worker changes suburb in legacy onboarding, keeping their radius', async () => {
    const pid = await legacyWorker({ location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786' })
    await reconcile(pid)
    await db.workerLocation.updateMany({ where: { workerProfileId: pid }, data: { travelRadiusKm: 80 } })
    const parramatta = await db.auLocality.findFirstOrThrow({ where: { searchName: 'parramatta', postcode: '2150' } })
    await db.workerProfile.update({ where: { id: pid }, data: { location: 'Parramatta, NSW 2150', city: 'Parramatta', postalCode: '2150', updatedAt: new Date() } })
    expect((await reconcile(pid))?.home).toBe('moved')
    expect(await db.workerLocation.findFirstOrThrow({ where: { workerProfileId: pid } })).toMatchObject({ localityId: parramatta.id, travelRadiusKm: 80, source: 'RECONCILER' })
  })

  it('never guesses: an ambiguous or unknown location gets no HOME', async () => {
    const a = await legacyWorker({ location: 'Somewhere nice', city: 'Somewhere nice', state: null, postalCode: '2000' })
    expect((await reconcile(a))?.home).toBe('ambiguous')
    const b = await legacyWorker({ location: 'Atlantis', city: 'Atlantis', state: null, postalCode: null })
    expect((await reconcile(b))?.home).toBe('unmatched')
    expect(await db.workerLocation.count({ where: { workerProfileId: { in: [a, b] } } })).toBe(0)
  })

  it('the job: finds workers without a marker and workers changed since the watermark, then moves the watermark', async () => {
    const fresh = await legacyWorker({ location: 'Mount Victoria, NSW 2786', city: 'Mount', state: 'NSW', postalCode: '2786' })
    const job = onboardingReconcilerJob(db, pino({ level: 'silent' }), { everyMs: 300_000 })
    const now = new Date()
    const first = await job.run({ watermark: new Date(now.getTime() - 10 * 60_000), now, signal: new AbortController().signal })
    expect(await db.workerOnboarding.count({ where: { workerProfileId: fresh } })).toBe(1)
    expect(first.watermark).toEqual(new Date(now.getTime() - 60_000))
    expect(first.summary).toMatchObject({ failed: 0 })

    // A change after the watermark is picked up on the next run; an unchanged worker is not examined.
    await requirement(fresh, 'police-check', { status: 'SUBMITTED', documentUrl: 'u', documentUploadedAt: new Date(), submittedAt: new Date() })
    const later = new Date(Date.now() + 1000)
    const second = await job.run({ watermark: first.watermark!, now: later, signal: new AbortController().signal })
    expect((await marker(fresh)).stage).toBe('DOCUMENTS_SUBMITTED')
    expect((second.summary as { stageChanges: number }).stageChanges).toBeGreaterThanOrEqual(1)
  })
}, 60_000)
