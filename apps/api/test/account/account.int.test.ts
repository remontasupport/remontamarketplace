// U5d the caller's own sign-in details on PostGIS, through the real pipeline: the email change (taken, normalised,
// audited from/to), the password change (rules, breach check, hash, passwordChangedAt, reset link voided, audited),
// both refused while impersonated. Runs only when TEST_DATABASE_URL points at localhost (CI's API Quality job).
import { accountContract } from '@remonta/api-contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { accountHandlers } from '../../src/modules/account/account.handlers'
import { createDb, type Db } from '../../src/platform/persistence/db'
import { testApp, type TestApp } from '../helpers'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)
const DOMAIN = 'account-u5d.test'

describe.skipIf(!local)('U5d account on PostGIS', () => {
  let db: Db
  let t: TestApp
  const ids: Record<string, string> = {}
  const now = new Date('2026-10-16T05:00:00.250Z')
  const send = (method: string, path: string, body: unknown, who: string) => t.fastify.inject({ method: method as 'PUT', url: path, headers: { 'x-test-principal': who }, payload: body as object })

  beforeAll(async () => {
    db = createDb(url!, { poolSize: 4, poolTimeoutS: 5 })
    await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } })
    for (const [k, role] of [['worker', 'WORKER'], ['client', 'CLIENT'], ['other', 'WORKER']] as const) {
      ids[k] = (await db.user.create({ data: { email: `${k}@${DOMAIN}`, passwordHash: 'old', role, status: 'ACTIVE', updatedAt: now, resetPasswordToken: `${k}-reset`, resetPasswordExpires: now }, select: { id: true } })).id
    }
    t = await testApp({
      contracts: [accountContract],
      handlerSets: [
        accountHandlers({
          db,
          clock: () => now,
          hasher: { hash: async (p) => `hashed:${p}`, verify: async () => true, close: async () => undefined },
          breaches: { check: async (p) => (p === 'Breached1!x' ? { status: 'breached', count: 9 } : { status: 'clear' }) },
        }),
      ],
    })
  }, 60_000)
  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { endsWith: `@${DOMAIN}` } } })
    await t?.close()
    await db?.$disconnect()
  })

  it('email: normalised, changed and audited from/to; another account\'s address is 409; the same address changes nothing', async () => {
    const r = await send('PUT', '/v1/account/email', { email: '  New.Worker@' + DOMAIN.toUpperCase() + ' ' }, `${ids.worker}:WORKER`)
    expect(r.statusCode, r.body).toBe(200)
    expect(r.json()).toEqual({ email: `new.worker@${DOMAIN}` })
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.worker } })).email).toBe(`new.worker@${DOMAIN}`)
    const audit = await db.auditLog.findFirstOrThrow({ where: { userId: ids.worker, action: 'EMAIL_CHANGE' }, orderBy: { createdAt: 'desc' } })
    expect(audit.metadata).toMatchObject({ from: `worker@${DOMAIN}`, to: `new.worker@${DOMAIN}` })

    const taken = await send('PUT', '/v1/account/email', { email: `other@${DOMAIN}` }, `${ids.worker}:WORKER`)
    expect(taken.statusCode).toBe(409)
    expect(taken.json().error.fields.email[0]).toMatch(/already in use/)

    const same = await send('PUT', '/v1/account/email', { email: `new.worker@${DOMAIN}` }, `${ids.worker}:WORKER`)
    expect(same.statusCode).toBe(200)
  })

  it('password: the sign-up rules and breach check, the hash stored, passwordChangedAt in whole seconds, the reset link voided, audited', async () => {
    expect((await send('PUT', '/v1/account/password', { password: 'weakpass' }, `${ids.client}:CLIENT`)).statusCode).toBe(400)
    const breached = await send('PUT', '/v1/account/password', { password: 'Breached1!x' }, `${ids.client}:CLIENT`)
    expect(breached.statusCode).toBe(400)
    expect(breached.json().error.fields.password[0]).toMatch(/data breach/)

    const r = await send('PUT', '/v1/account/password', { password: 'Str0ng!pass' }, `${ids.client}:CLIENT`)
    expect(r.statusCode, r.body).toBe(200)
    expect(r.json()).toEqual({ passwordChangedAt: '2026-10-16T05:00:00.000Z' })
    const u = await db.user.findUniqueOrThrow({ where: { id: ids.client } })
    expect(u).toMatchObject({ passwordHash: 'hashed:Str0ng!pass', resetPasswordToken: null, resetPasswordExpires: null })
    expect(u.passwordChangedAt?.toISOString()).toBe('2026-10-16T05:00:00.000Z')
    expect(await db.auditLog.count({ where: { userId: ids.client, action: 'PASSWORD_CHANGE' } })).toBe(1)
  })

  it('an admin impersonating the user may change neither (403); nothing changes', async () => {
    const before = await db.user.findUniqueOrThrow({ where: { id: ids.other } })
    const e = await send('PUT', '/v1/account/email', { email: `taken-over@${DOMAIN}` }, `${ids.other}:WORKER:admin-1`)
    const p = await send('PUT', '/v1/account/password', { password: 'Str0ng!pass' }, `${ids.other}:WORKER:admin-1`)
    expect([e.statusCode, p.statusCode]).toEqual([403, 403])
    expect(e.json().error.fields.general[0]).toMatch(/not while impersonating/)
    expect(await db.user.findUniqueOrThrow({ where: { id: ids.other } })).toEqual(before)
  })

  it('an admin token is refused (the entries are for workers, clients and coordinators); no token is 401', async () => {
    expect((await send('PUT', '/v1/account/password', { password: 'Str0ng!pass' }, `${ids.other}:ADMIN`)).statusCode).toBe(403)
    const anon = await t.fastify.inject({ method: 'PUT', url: '/v1/account/password', payload: { password: 'Str0ng!pass' } })
    expect(anon.statusCode).toBe(401)
  })
})
