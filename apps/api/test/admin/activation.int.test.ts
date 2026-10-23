// worker-activation U1 on PostGIS: the column's default (FR-2, FR-3), the activation filter (P1, BR-5), the row's
// `activated` on request (P2, BR-6), and the two switches changing their own column only (P3, P4; BR-2, BR-3, BR-7).
// A dozen workers isolated by an email domain and a shared last name (the search's name filter keeps the rest of the
// database out); their flags re-drawn on every run. Runs only when TEST_DATABASE_URL points at localhost (CI).
import { adminContract } from '@remonta/api-contract'
import fc from 'fast-check'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHandlers } from '../../src/modules/admin/admin.handlers'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

const DOMAIN = 'admin-activation.test'
const LAST_NAME = 'Activationharness'
const COUNT = 12
const ADMIN = { 'x-test-principal': 'admin_1:ADMIN' }

describe.skipIf(!local)('worker-activation U1: the flag, the filter and the switches on PostGIS', () => {
  let db: Db
  let t: TestApp
  const ids: string[] = []
  const userIds: string[] = []

  const cleanup = async () => {
    const users = await db.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } })
    await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } }) // profiles cascade
  }
  const search = (q: Record<string, string>) =>
    t.fastify.inject({ method: 'GET', url: `/v1/admin/workers?${new URLSearchParams({ search: LAST_NAME, pageSize: '50', ...q })}`, headers: { ...ADMIN, 'cache-control': 'no-cache' } })
  const rows = async (q: Record<string, string>) => {
    const res = await search(q)
    expect(res.statusCode, res.body).toBe(200)
    return res.json() as { data: Record<string, unknown>[]; appliedFilters: Record<string, unknown>; unplacedCount: number }
  }
  const found = async (q: Record<string, string>) => (await rows(q)).data.map((r) => r.id as string).sort()
  const put = (workerId: string, what: 'activation' | 'suspension', body: unknown) =>
    t.fastify.inject({ method: 'PUT', url: `/v1/admin/workers/${workerId}/${what}`, headers: ADMIN, payload: body as object })
  /** Both rows whole, for "nothing else changed". */
  const snapshot = async (i: number) => ({
    profile: await db.workerProfile.findUniqueOrThrow({ where: { id: ids[i]! } }),
    user: await db.user.findUniqueOrThrow({ where: { id: userIds[i]! } }),
  })

  beforeAll(async () => {
    db = createDb(url!)
    await cleanup()
    for (let i = 0; i < COUNT; i++) {
      // No isActivated given: the column's default is what every existing and new profile reads (FR-2, FR-3).
      const u = await db.user.create({
        data: { email: `w${i}@${DOMAIN}`, passwordHash: 'x', role: 'WORKER', status: 'ACTIVE', updatedAt: new Date(), workerProfile: { create: { firstName: `W${i}`, lastName: LAST_NAME, mobile: `04100000${String(i).padStart(2, '0')}`, updatedAt: new Date() } } },
        select: { id: true, workerProfile: { select: { id: true } } },
      })
      ids.push(u.workerProfile!.id)
      userIds.push(u.id)
    }
    t = await testApp({ contracts: [adminContract], handlerSets: [adminHandlers({ db, clock: () => new Date() })] })
  }, 60_000)
  afterAll(async () => {
    await t?.close()
    if (db) {
      await cleanup()
      await db.$disconnect()
    }
  })

  it('FR-2/FR-3: every profile starts inactive', async () => {
    const flags = await db.workerProfile.findMany({ where: { id: { in: ids } }, select: { isActivated: true } })
    expect(flags.every((f) => f.isActivated === false)).toBe(true)
    expect(await found({ activation: 'active' })).toEqual([])
    expect(await found({ activation: 'inactive' })).toEqual([...ids].sort())
  })

  it('N1: without withActivation the rows carry no `activated`; with it, the column; the filter is echoed', async () => {
    await db.workerProfile.update({ where: { id: ids[0]! }, data: { isActivated: true } })
    const plain = await rows({})
    expect(plain.data.every((r) => !('activated' in r))).toBe(true)
    expect(plain.appliedFilters).not.toHaveProperty('activation')
    const asked = await rows({ withActivation: 'true', activation: 'active' })
    expect(asked.data.map((r) => [r.id, r.activated])).toEqual([[ids[0], true]])
    expect(asked.appliedFilters.activation).toBe('active')
  })

  it('P1, P2: for random flags, active ∪ inactive = all, disjoint, and `activated` equals the column; the unplaced count follows', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.boolean(), { minLength: COUNT, maxLength: COUNT }), async (flags) => {
        for (const value of [true, false]) await db.workerProfile.updateMany({ where: { id: { in: ids.filter((_, i) => flags[i] === value) } }, data: { isActivated: value } })
        const all = await rows({ withActivation: 'true' })
        const active = await found({ activation: 'active' })
        const inactive = await found({ activation: 'inactive' })
        expect(active).toEqual(ids.filter((_, i) => flags[i]).sort())
        expect([...active, ...inactive].sort()).toEqual(all.data.map((r) => r.id as string).sort())
        expect(active.filter((id) => inactive.includes(id))).toEqual([])
        for (const r of all.data) expect(r.activated).toBe(flags[ids.indexOf(r.id as string)])
        // None of them has a HOME row: each is unplaced, and the count respects the filter.
        expect((await rows({ activation: 'active' })).unplacedCount).toBe(active.length)
      }),
      { numRuns: 8 },
    )
  })

  it('a suspended account stays out of the search whatever its flag (BR-5)', async () => {
    await db.workerProfile.update({ where: { id: ids[1]! }, data: { isActivated: true } })
    await db.user.update({ where: { id: userIds[1]! }, data: { status: 'SUSPENDED' } })
    expect(await found({})).not.toContain(ids[1])
    expect(await found({ activation: 'active' })).not.toContain(ids[1])
    await db.user.update({ where: { id: userIds[1]! }, data: { status: 'ACTIVE' } })
  })

  it('P3: any sequence of activation writes ends at the last; nothing else in either row changes (BR-2)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), async (seq) => {
        const before = await snapshot(2)
        for (const activated of seq) {
          const res = await put(ids[2]!, 'activation', { activated })
          expect(res.statusCode, res.body).toBe(200)
          expect(res.json()).toEqual({ workerId: ids[2], activated })
        }
        const after = await snapshot(2)
        expect(after.profile).toEqual({ ...before.profile, isActivated: seq.at(-1) })
        expect(after.user).toEqual(before.user)
      }),
      { numRuns: 10 },
    )
  })

  it('P4: any sequence of suspension writes ends at the last mapping; the flag and the profile never move (BR-7)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), async (activated, seq) => {
        await db.workerProfile.update({ where: { id: ids[3]! }, data: { isActivated: activated } })
        const before = await snapshot(3)
        for (const suspended of seq) {
          const res = await put(ids[3]!, 'suspension', { suspended })
          expect(res.statusCode, res.body).toBe(200)
          expect(res.json()).toEqual({ workerId: ids[3], suspended })
        }
        const after = await snapshot(3)
        expect(after.user.status).toBe(seq.at(-1) ? 'SUSPENDED' : 'ACTIVE')
        expect(after.profile).toEqual(before.profile)
        const { status: _a, updatedAt: _b, ...restBefore } = before.user
        const { status: _c, updatedAt: _d, ...restAfter } = after.user
        expect(restAfter).toEqual(restBefore)
      }),
      { numRuns: 10 },
    )
    await db.user.update({ where: { id: userIds[3]! }, data: { status: 'ACTIVE' } })
  })

  it('404 for an unknown worker and a non-worker account; 400 for a body that is not the one boolean', async () => {
    expect((await put('nope', 'activation', { activated: true })).statusCode).toBe(404)
    expect((await put('nope', 'suspension', { suspended: true })).statusCode).toBe(404)
    await db.user.update({ where: { id: userIds[4]! }, data: { role: 'ADMIN' } })
    expect((await put(ids[4]!, 'suspension', { suspended: true })).statusCode).toBe(404)
    expect((await db.user.findUniqueOrThrow({ where: { id: userIds[4]! } })).status).toBe('ACTIVE')
    await db.user.update({ where: { id: userIds[4]! }, data: { role: 'WORKER' } })
    expect((await put(ids[4]!, 'activation', { activated: 'yes' })).statusCode).toBe(400)
    expect((await put(ids[4]!, 'activation', { activated: true, suspended: false })).statusCode).toBe(400)
  })

  it('N3: a worker cannot call either switch', async () => {
    // The flags are left random by P1/P2; start this one from a known value.
    await db.workerProfile.update({ where: { id: ids[5]! }, data: { isActivated: false } })
    const res = await t.fastify.inject({ method: 'PUT', url: `/v1/admin/workers/${ids[5]}/activation`, headers: { 'x-test-principal': `${userIds[5]}:WORKER` }, payload: { activated: true } })
    expect(res.statusCode).toBe(403)
    expect((await db.workerProfile.findUniqueOrThrow({ where: { id: ids[5]! } })).isActivated).toBe(false)
  })
})
