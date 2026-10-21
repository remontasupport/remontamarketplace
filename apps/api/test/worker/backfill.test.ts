// The completion backfill (U1 worker-area, P14): the production guard and the report
// shape (no database); the run itself and its idempotency on PostGIS.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { isProductionHost, productionGuard } from '../../scripts/backfill-completion'
import { applyGuard, backfillCompletion, formatCompletionReport, type CompletionBackfillReport } from '../../src/modules/worker/backfill'
import { workerHarness, type WorkerHarness } from './harness'

describe('the production guard (U1-SEC-08)', () => {
  const prod = 'postgresql://u:p@ep-delicate-recipe-a7mbt4ef-pooler.ap-southeast-2.aws.neon.tech/workerprofiles'
  const staging = 'postgresql://u:p@ep-wandering-shadow-a7pxwb8o-pooler.ap-southeast-2.aws.neon.tech/neondb'
  it('knows the production hosts', () => {
    expect(isProductionHost(prod)).toBe(true)
    expect(isProductionHost('postgresql://u:p@ep-polished-thunder-1.neon.tech/db')).toBe(true)
    expect(isProductionHost(staging)).toBe(false)
    expect(isProductionHost('postgresql://postgres:postgres@localhost:55432/s1test')).toBe(false)
    expect(isProductionHost('junk')).toBe(false)
  })
  it('refuses production without --allow-production, and a missing URL', () => {
    expect(productionGuard(prod, ['--apply'])).toMatch(/--allow-production/)
    expect(productionGuard(prod, ['--apply', '--allow-production'])).toBeNull()
    expect(productionGuard(staging, [])).toBeNull()
    expect(productionGuard(undefined, [])).toMatch(/no database URL/)
  })
})

describe('the report', () => {
  it('formats the counts per flag and the sample', () => {
    const r: CompletionBackfillReport = {
      apply: false, model: 'legacy',
      now: new Date('2026-10-12T00:00:00Z'),
      examined: 3,
      changed: 1,
      unchanged: 2,
      byFlag: { accountDetails: { on: 1, off: 0 }, compliance: { on: 0, off: 0 }, trainings: { on: 0, off: 0 }, services: { on: 0, off: 1 }, profileCompleted: { on: 0, off: 0 } },
      verificationMoved: 1,
      sample: [{ workerProfileId: 'wp_1', from: { accountDetails: false, compliance: false, trainings: false, services: true }, to: { accountDetails: true, compliance: false, trainings: false, services: false }, profileCompleted: false }],
      failed: [],
    }
    const text = formatCompletionReport(r)
    expect(text).toContain('dry run')
    expect(text).toContain('examined 3: 1 would change, 2 unchanged, 0 failed')
    expect(text).toContain('NOT_STARTED -> IN_PROGRESS: 1')
    expect(text).toMatch(/accountDetails\s+on\s+1\s+off\s+0/)
    expect(text).toContain('wp_1')
  })
})

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

describe.skipIf(!local)('backfillCompletion on PostGIS (P14)', () => {
  let h: WorkerHarness
  beforeAll(async () => {
    h = await workerHarness('worker-backfill.test')
  }, 60_000)
  afterAll(async () => {
    await h.close()
  })

  it('dry run counts, --apply writes, a second --apply changes nothing', async () => {
    const mine = (r: CompletionBackfillReport) => r.sample.filter((s) => [h.a.profileId, h.b.profileId].includes(s.workerProfileId))
    const dry = await backfillCompletion(h.db, { apply: false, batch: 50 })
    expect(dry.apply).toBe(false)
    expect(dry.examined).toBeGreaterThanOrEqual(2)
    expect(dry.failed).toEqual([])
    const storedBefore = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true } })
    expect(storedBefore).toEqual({ setupProgress: null, profileCompleted: false, verificationStatus: 'NOT_STARTED' })

    const applied = await backfillCompletion(h.db, { apply: true, batch: 50 })
    expect(applied.changed).toBeGreaterThanOrEqual(1)
    expect(applied.failed).toEqual([])
    const storedAfter = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true } })
    expect(storedAfter).toEqual({ setupProgress: { accountDetails: true, compliance: true, trainings: true, services: true }, profileCompleted: true, verificationStatus: 'IN_PROGRESS' })
    const bare = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.b.profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true } })
    expect(bare).toEqual({ setupProgress: null, profileCompleted: false, verificationStatus: 'NOT_STARTED' }) // all false and stored all-false parse equal: nothing to write

    const again = await backfillCompletion(h.db, { apply: true, batch: 50 })
    expect(mine(again)).toEqual([])
    const storedAgain = await h.db.workerProfile.findUniqueOrThrow({ where: { id: h.a.profileId }, select: { setupProgress: true, profileCompleted: true, verificationStatus: true } })
    expect(storedAgain).toEqual(storedAfter)
  }, 120_000)
})

describe('applyGuard (onboarding-tour C1, CP5)', () => {
  const now = new Date('2026-10-21T03:00:00.000Z')
  const dry = (patch: Record<string, unknown> = {}) => ({ apply: false, model: 'groups', now: '2026-10-21T02:30:00.000Z', ...patch })
  it('lets an apply repeat a recent dry run of the same model', () => {
    expect(applyGuard(dry(), 'groups', now)).toBeNull()
    expect(applyGuard(dry({ model: undefined }), 'legacy', now)).toBeNull() // a report from before the model existed is legacy
  })
  it('refuses without a report, an applied report, another model, or one older than an hour', () => {
    expect(applyGuard(null, 'groups', now)).toMatch(/no dry-run report/)
    expect(applyGuard(dry({ apply: true }), 'groups', now)).toMatch(/not a dry run/)
    expect(applyGuard(dry({ model: 'legacy' }), 'groups', now)).toMatch(/--model=legacy/)
    expect(applyGuard(dry({ now: '2026-10-21T01:59:00.000Z' }), 'groups', now)).toMatch(/older than an hour/)
    expect(applyGuard(dry({ now: 'yesterday' }), 'groups', now)).toMatch(/older than an hour/)
  })
})
