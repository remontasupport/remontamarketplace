// completion-sync (onboarding-tour C1; L4, CP2-CP4, CP7, CT1-CT3) with its seams: the Sydney clock and the daily pass,
// the incremental part, the timeout stop, a failing run's alert line, and the resumability property (any cut points:
// the runs together cover every worker exactly once per day).
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { BATCH, COMPLETION_SYNC_ALERT, completionSyncJob, fullPassFor, sydneyClock, type SyncSummary } from '../../src/modules/worker/completion-sync.job'
import type { ProfileRows } from '../../src/modules/worker/persistence/profile-read'
import type { Db } from '../../src/platform/persistence/db'
import { sampleRows } from './units.test'

const at = (iso: string) => new Date(iso)
const worker = (n: number): ProfileRows => sampleRows({ id: `wp_${String(n).padStart(5, '0')}`, userId: `u_${n}` })
const silent = { error: () => {}, warn: () => {}, info: () => {} } as never

function setup(opts: { workers?: number; changed?: { userId: string; t: Date }[]; failRead?: boolean } = {}) {
  const all = Array.from({ length: opts.workers ?? 0 }, (_, i) => worker(i + 1))
  const written: string[] = []
  const logs: Record<string, unknown>[] = []
  const job = completionSyncJob({
    db: {} as Db,
    log: { ...(silent as object), error: (o: Record<string, unknown>) => void logs.push(o) } as never,
    model: 'legacy',
    everyMs: 300_000,
    changedSince: async () => opts.changed ?? [],
    page: async (_db, afterId, take) => all.filter((w) => w.profile.id > afterId).slice(0, take),
    read: async (_db, userId) => {
      if (opts.failRead) throw new Error('database unreachable')
      return all.find((w) => w.profile.userId === userId) ?? null
    },
    persist: async (rows) => {
      written.push(rows.profile.id)
      return true
    },
  })
  return { job, written, logs }
}
const signal = () => new AbortController().signal

describe('the Sydney clock and the daily pass (CP4)', () => {
  it('reads the Sydney date and hour, daylight saving included', () => {
    expect(sydneyClock(at('2026-10-20T16:30:00Z'))).toEqual({ day: '2026-10-21', hour: 3 }) // AEDT, UTC+11
    expect(sydneyClock(at('2026-06-20T17:30:00Z'))).toEqual({ day: '2026-06-21', hour: 3 }) // AEST, UTC+10
  })
  it('starts after 03:00, continues an unfinished pass, never runs a finished day twice', () => {
    const before3 = at('2026-10-20T15:00:00Z') // 02:00 Sydney
    const after3 = at('2026-10-20T16:30:00Z') // 03:30 Sydney
    expect(fullPassFor(before3, null)).toBeNull()
    expect(fullPassFor(after3, null)).toEqual({ day: '2026-10-21', cursor: null, done: false })
    expect(fullPassFor(after3, { fullPass: { day: '2026-10-21', cursor: 'wp_9', done: false } })).toEqual({ day: '2026-10-21', cursor: 'wp_9', done: false })
    expect(fullPassFor(after3, { fullPass: { day: '2026-10-21', cursor: 'wp_9', done: true } })).toBeNull()
    expect(fullPassFor(after3, { fullPass: { day: '2026-10-20', cursor: 'wp_9', done: true } })).toEqual({ day: '2026-10-21', cursor: null, done: false })
  })
})

describe('a run', () => {
  const noon = at('2026-10-21T01:00:00Z') // 12:00 Sydney, after the pass hour
  const finishedToday = { fullPass: { day: '2026-10-21', cursor: 'wp_99999', done: true } }

  it('the incremental part: recomputes the workers whose documents changed, and moves the watermark', async () => {
    const { job, written } = setup({ workers: 3, changed: [{ userId: 'u_2', t: at('2026-10-21T00:58:00Z') }] })
    const r = await job.run({ watermark: at('2026-10-21T00:55:00Z'), lastResult: finishedToday, now: noon, signal: signal() })
    expect(written).toEqual(['wp_00002'])
    expect((r.summary as unknown as SyncSummary).checked).toBe(1)
    expect(r.watermark!.getTime()).toBe(noon.getTime() - 60_000)
  })
  it('the full pass walks every worker in pages and marks the day done', async () => {
    const { job, written } = setup({ workers: BATCH + 5 })
    const r = await job.run({ watermark: null, lastResult: null, now: noon, signal: signal() })
    expect(written).toHaveLength(BATCH + 5)
    expect((r.summary as unknown as SyncSummary).fullPass).toMatchObject({ day: '2026-10-21', done: true })
  })
  it('CT1: an aborted run stops between pages and keeps its cursor for the next run', async () => {
    const ac = new AbortController()
    const { job, written } = setup({ workers: BATCH * 3 })
    let pages = 0
    const page = async (_db: Db, afterId: string, take: number) => {
      if (++pages === 2) ac.abort()
      return Array.from({ length: BATCH * 3 }, (_, i) => worker(i + 1)).filter((w) => w.profile.id > afterId).slice(0, take)
    }
    const j = completionSyncJob({ db: {} as Db, log: silent, model: 'legacy', everyMs: 300_000, changedSince: async () => [], page, read: async () => null, persist: async (rows) => (written.push(rows.profile.id), true) })
    const r = await j.run({ watermark: null, lastResult: null, now: noon, signal: ac.signal })
    const pass = (r.summary as unknown as SyncSummary).fullPass!
    expect(pass.done).toBe(false)
    expect(pass.cursor).toBe(written.at(-1))
    expect(written).toHaveLength(BATCH * 2)
    void job
  })
  it('CT3: a failing run logs the alert line and throws (the scheduler keeps the watermark)', async () => {
    const { job, logs } = setup({ workers: 1, changed: [{ userId: 'u_1', t: noon }], failRead: true })
    await expect(job.run({ watermark: null, lastResult: finishedToday, now: noon, signal: signal() })).rejects.toThrow('database unreachable')
    expect(logs).toEqual([expect.objectContaining({ alert: COMPLETION_SYNC_ALERT, job: 'completion-sync' })])
  })
})

describe('the resumability property (CP2)', () => {
  it('for any cut points, the day\'s runs together write every worker exactly once', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 3 * BATCH + 7 }), fc.array(fc.integer({ min: 1, max: 4 }), { minLength: 1, maxLength: 8 }), async (n, cuts) => {
        const all = Array.from({ length: n }, (_, i) => worker(i + 1))
        const written: string[] = []
        let last: unknown = null
        for (let run = 0; run < 20; run++) {
          const ac = new AbortController()
          const limit = cuts[run % cuts.length]!
          let pages = 0
          const j = completionSyncJob({
            db: {} as Db, log: silent, model: 'legacy', everyMs: 300_000, changedSince: async () => [], read: async () => null,
            page: async (_db, afterId, take) => {
              if (++pages >= limit) ac.abort()
              return all.filter((w) => w.profile.id > afterId).slice(0, take)
            },
            persist: async (rows) => (written.push(rows.profile.id), true),
          })
          const r = await j.run({ watermark: null, lastResult: last, now: at('2026-10-21T01:00:00Z'), signal: ac.signal })
          last = r.summary
          if ((r.summary as unknown as SyncSummary).fullPass === null) break
          if ((r.summary as unknown as SyncSummary).fullPass!.done) {
            last = r.summary
          }
        }
        expect(new Set(written).size).toBe(n)
        expect(written).toHaveLength(n)
      }),
      { numRuns: 40 },
    )
  })
})
