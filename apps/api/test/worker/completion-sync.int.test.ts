// completion-sync on PostGIS (onboarding-tour C1; CR-11, L4): the real change query picks up an admin's review, and a
// real run writes the stored flags the model computes, only where they differ. Runs only when TEST_DATABASE_URL points
// at localhost (CI's API Quality job).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { storedCompletion } from '../../src/modules/worker/application/completion-items'
import { completionSyncJob, documentsChangedSince, type SyncSummary } from '../../src/modules/worker/completion-sync.job'
import { readProfileRows } from '../../src/modules/worker/persistence/profile-read'
import { workerHarness, type WorkerHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
const silent = { error: () => {}, warn: () => {}, info: () => {} } as never

describe.skipIf(!local)('completion-sync on PostGIS', () => {
  let h: WorkerHarness
  beforeAll(async () => {
    h = await workerHarness('worker-completion-sync.test')
  }, 60_000)
  afterAll(async () => {
    await h.close()
  })

  it('an admin review (reviewedAt) of one worker\'s document is a change for that worker only', async () => {
    const since = new Date(Date.now() - 1000)
    const updated = await h.db.verificationRequirement.updateMany({ where: { workerProfileId: h.a.profileId }, data: { reviewedAt: new Date(), status: 'REJECTED' } })
    expect(updated.count).toBeGreaterThan(0)
    const changed = await documentsChangedSince(h.db, since, new Date(Date.now() + 1000), 200)
    expect(changed.map((c) => c.userId)).toContain(h.a.userId)
    expect(changed.map((c) => c.userId)).not.toContain(h.b.userId)
  })

  it('a run writes what the model computes for the changed worker; a second run changes nothing', async () => {
    await h.db.workerProfile.update({ where: { id: h.a.profileId }, data: { setupProgress: { accountDetails: true, compliance: true, trainings: true, services: true }, profileCompleted: true } })
    const job = completionSyncJob({ db: h.db, log: silent, model: 'groups', everyMs: 300_000 })
    const now = new Date(Date.now() + 1000)
    const finished = { fullPass: { day: '9999-12-31', cursor: null, done: true } } // no full pass in this test
    const r1 = await job.run({ watermark: new Date(Date.now() - 60_000), lastResult: { fullPass: { ...finished.fullPass, day: new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(now) } }, now, signal: new AbortController().signal })
    expect((r1.summary as unknown as SyncSummary).changed).toBeGreaterThanOrEqual(1)
    const rows = (await readProfileRows(h.db, h.a.userId))!
    const expected = storedCompletion(rows, 'groups')
    expect(rows.profile.profileCompleted).toBe(expected.profileCompleted)
    expect(rows.profile.setupProgress).toEqual({ accountDetails: expected.accountDetails, compliance: expected.compliance, trainings: expected.trainings, services: expected.services })
    const r2 = await job.run({ watermark: new Date(Date.now() - 60_000), lastResult: r1.summary, now, signal: new AbortController().signal })
    expect((r2.summary as unknown as SyncSummary).changed).toBe(0)
  })
})
