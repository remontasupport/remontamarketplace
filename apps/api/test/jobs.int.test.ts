// Scheduler, photo purge, outbox retention and the sign-up email handlers, on
// PostGIS. Runs only when TEST_DATABASE_URL points at localhost.
import { randomUUID } from 'node:crypto'
import pino from 'pino'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { notificationHandlers } from '../src/modules/notifications/notification.handlers'
import type { PhotoStore } from '../src/modules/registration/adapters/photo-store'
import { purgeUnclaimedPhotosJob } from '../src/modules/registration/jobs/purge-photos'
import type { Email, Mailer } from '../src/platform/email/mailer'
import { Scheduler, type Job } from '../src/platform/jobs/scheduler'
import { OutboxDispatcher } from '../src/platform/outbox/dispatcher'
import { enqueue } from '../src/platform/outbox/outbox'
import { outboxRetentionJob } from '../src/platform/outbox/retention'
import { createDb, unitOfWork, type Db } from '../src/platform/persistence/db'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false
const log = pino({ level: 'silent' })

describe.skipIf(!local)('scheduled jobs and notifications on PostGIS', () => {
  let db: Db
  beforeAll(async () => {
    db = createDb(url!)
  })
  afterAll(async () => {
    await db.$executeRaw`DELETE FROM scheduled_jobs WHERE name LIKE 'test-%'`
    await db.$executeRaw`DELETE FROM outbox_events WHERE type LIKE 'test.%'`
    await db.user.deleteMany({ where: { email: { endsWith: '@s1-jobs.example' } } })
    await db.$disconnect()
  })

  describe('Scheduler', () => {
    const job = (name: string, run: Job['run'], everyMs = 60_000): Job => ({ name, everyMs, timeoutMs: 5_000, run })

    it('runs a job on exactly one of several instances at once', async () => {
      const name = `test-lease-${randomUUID()}`
      let runs = 0
      let release!: () => void
      const gate = new Promise<void>((r) => (release = r))
      const j = job(name, async () => {
        runs++
        await gate
        return { summary: { ok: true } }
      })
      const a = new Scheduler(db, [j], log)
      const b = new Scheduler(db, [j], log)
      const first = a.runIfDue(j)
      await new Promise((r) => setTimeout(r, 100))
      expect(await b.runIfDue(j)).toBe(false) // a holds the lease
      release()
      expect(await first).toBe(true)
      expect(runs).toBe(1)
    })

    it('a run longer than its interval is not started twice: the lease, not the schedule, stops it', async () => {
      const name = `test-long-${randomUUID()}`
      let runs = 0
      let release!: () => void
      const gate = new Promise<void>((r) => (release = r))
      const j = job(name, async () => {
        runs++
        await gate
        return { summary: {} }
      }, 1) // due again after 1 ms
      const s = new Scheduler(db, [j], log)
      const first = s.runIfDue(j)
      await new Promise((r) => setTimeout(r, 100))
      expect(await new Scheduler(db, [j], log).runIfDue(j)).toBe(false)
      release()
      await first
      expect(runs).toBe(1)
    })

    it('is not due again until everyMs has passed, then runs with the stored watermark', async () => {
      const name = `test-due-${randomUUID()}`
      let clock = new Date('2030-01-01T00:00:00Z')
      const seen: (Date | null)[] = []
      const j = job(name, async ({ watermark, now }) => {
        seen.push(watermark)
        return { watermark: now, summary: {} }
      })
      const s = new Scheduler(db, [j], log, () => clock)
      expect(await s.runIfDue(j)).toBe(true)
      clock = new Date(clock.getTime() + 30_000)
      expect(await s.runIfDue(j)).toBe(false)
      clock = new Date(clock.getTime() + 31_000)
      expect(await s.runIfDue(j)).toBe(true)
      expect(seen).toEqual([null, new Date('2030-01-01T00:00:00Z')])
    })

    it('a failed run releases the lease and keeps the watermark', async () => {
      const name = `test-fail-${randomUUID()}`
      let clock = new Date('2030-02-01T00:00:00Z')
      let fail = false
      const j = job(name, async ({ now }) => {
        if (fail) throw new Error('boom')
        return { watermark: now, summary: {} }
      })
      const s = new Scheduler(db, [j], log, () => clock)
      await s.runIfDue(j)
      fail = true
      clock = new Date(clock.getTime() + 61_000)
      await expect(s.runIfDue(j)).rejects.toThrow('boom')
      const row = await db.scheduledJob.findUniqueOrThrow({ where: { name } })
      expect(row).toMatchObject({ lockedUntil: null, watermark: new Date('2030-02-01T00:00:00Z'), lastResult: { error: 'boom' } })
    })
  })

  describe('purge-unclaimed-registration-photos', () => {
    it('deletes unclaimed photos older than 24 h, blob first; keeps claimed and recent ones', async () => {
      const deleted: string[] = []
      const gcs = { delete: async (k: string) => void deleted.push(k) } as unknown as PhotoStore
      const mk = async (hoursAgo: number, claimed: boolean) => {
        const id = randomUUID()
        await db.$executeRaw`
          INSERT INTO registration_photo_uploads (id, "blobKey", url, "contentType", "sizeBytes", "ipHash", "createdAt", "claimedAt")
          VALUES (${id}::uuid, ${`test/${id}.jpg`}, 'local-photo://x', 'image/jpeg', 10, 'h', now() - make_interval(hours => ${hoursAgo}::int), ${claimed ? new Date() : null})`
        return id
      }
      const old = await mk(25, false)
      const recent = await mk(2, false)
      const claimed = await mk(30, true)
      const r = await purgeUnclaimedPhotosJob(db, { gcs }).run({ watermark: null, now: new Date(), signal: new AbortController().signal })
      expect(deleted).toContain(`test/${old}.jpg`)
      expect(deleted).not.toContain(`test/${recent}.jpg`)
      expect(deleted).not.toContain(`test/${claimed}.jpg`)
      expect(await db.registrationPhotoUpload.count({ where: { id: old } })).toBe(0)
      expect(await db.registrationPhotoUpload.count({ where: { id: { in: [recent, claimed] } } })).toBe(2)
      expect(r.summary).toMatchObject({ failed: 0 })
      await db.registrationPhotoUpload.deleteMany({ where: { id: { in: [recent, claimed] } } })
    })

    it('keeps the row when the blob could not be deleted, so the next run retries', async () => {
      const id = randomUUID()
      await db.$executeRaw`INSERT INTO registration_photo_uploads (id, "blobKey", url, "contentType", "sizeBytes", "ipHash", "createdAt") VALUES (${id}::uuid, ${`test/${id}.jpg`}, 'x', 'image/jpeg', 1, 'h', now() - interval '2 days')`
      const gcs = { delete: async () => { throw new Error('store down') } } as unknown as PhotoStore
      await purgeUnclaimedPhotosJob(db, { gcs }).run({ watermark: null, now: new Date(), signal: new AbortController().signal })
      expect(await db.registrationPhotoUpload.count({ where: { id } })).toBe(1)
      await db.registrationPhotoUpload.delete({ where: { id } })
    })
  })

  describe('outbox-retention', () => {
    it('deletes DONE events after 30 days and keeps DEAD ones', async () => {
      const ids = await unitOfWork(db, async (tx) => [await enqueue(tx, { type: 'test.old-done', payload: {} }), await enqueue(tx, { type: 'test.old-dead', payload: {} })])
      await db.$executeRaw`UPDATE outbox_events SET status = 'DONE', "processedAt" = now() - interval '31 days' WHERE id = ${ids[0]}::uuid`
      await db.$executeRaw`UPDATE outbox_events SET status = 'DEAD', "processedAt" = now() - interval '90 days' WHERE id = ${ids[1]}::uuid`
      await outboxRetentionJob(db).run({ watermark: null, now: new Date(), signal: new AbortController().signal })
      expect(await db.outboxEvent.count({ where: { id: ids[0] } })).toBe(0)
      expect(await db.outboxEvent.count({ where: { id: ids[1] } })).toBe(1)
    })
  })

  describe('sign-up emails through the real dispatcher', () => {
    const sent: Email[] = []
    let failNext = 0
    const mailer: Mailer = {
      send: async (e) => {
        if (failNext > 0) {
          failNext--
          throw new Error('resend 503')
        }
        sent.push(e)
        return { id: `msg-${sent.length}` }
      },
    }
    beforeEach(() => {
      sent.length = 0
    })

    async function worker(firstName: string) {
      return db.user.create({
        data: { email: `${randomUUID().slice(0, 8)}@s1-jobs.example`, passwordHash: 'x', role: 'WORKER', updatedAt: new Date(), workerProfile: { create: { firstName, lastName: 'T', mobile: '+61400000000', updatedAt: new Date() } } },
      })
    }

    it('WorkerRegistered -> one confirmation to the right address, idempotent on the event id, retried after a failure', async () => {
      const u = await worker('Mary')
      const eventId = await unitOfWork(db, (tx) => enqueue(tx, { type: 'WorkerRegistered', payload: { userId: u.id } }))
      failNext = 1
      let clock = Date.now()
      const d = new OutboxDispatcher(db, notificationHandlers({ db, mailer, appBaseUrl: 'https://app.example' }), log, { now: () => new Date(clock) })
      await d.runOnce()
      expect(sent).toHaveLength(0)
      clock += 3 * 60_000
      await d.runOnce()
      expect(sent).toHaveLength(1)
      expect(sent[0]).toMatchObject({ to: u.email, idempotencyKey: `registration-confirmation/${eventId}` })
      expect(sent[0]!.subject).toContain('your account is ready')
      expect(sent[0]!.text).toContain('Mary')
      expect(await db.outboxEvent.findUniqueOrThrow({ where: { id: eventId } })).toMatchObject({ status: 'DONE', attempts: 2 })
    })

    it('a payload without a user id is DEAD at once (permanent), not retried six times', async () => {
      const id = await unitOfWork(db, (tx) => enqueue(tx, { type: 'WorkerRegistered', payload: { nope: true } }))
      await new OutboxDispatcher(db, notificationHandlers({ db, mailer, appBaseUrl: 'https://app.example' }), log).runOnce()
      expect(await db.outboxEvent.findUniqueOrThrow({ where: { id } })).toMatchObject({ status: 'DEAD', attempts: 1 })
      await db.outboxEvent.delete({ where: { id } })
    })

    it('RegistrationAttemptOnExistingAccount -> the notice, with sign-in and reset links', async () => {
      const u = await worker('Sam')
      await unitOfWork(db, (tx) => enqueue(tx, { type: 'RegistrationAttemptOnExistingAccount', payload: { userId: u.id } }))
      await new OutboxDispatcher(db, notificationHandlers({ db, mailer, appBaseUrl: 'https://app.example' }), log).runOnce()
      expect(sent).toHaveLength(1)
      expect(sent[0]!.subject).toBe('Someone tried to create a Remonta account with your email')
      expect(sent[0]!.text).toContain('https://app.example/forgot-password')
    })
  })
}, 60_000)
