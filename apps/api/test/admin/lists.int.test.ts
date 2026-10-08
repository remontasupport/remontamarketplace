// The impersonation picker and the suspended list on PostGIS (U2, R9, R10), on the
// seeded fixture. Runs only when TEST_DATABASE_URL points at localhost.
import type { SuspendedListResponse, UserListResponse } from '@remonta/api-contract'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminHarness, type AdminHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = !!url && /@(localhost|127\.0\.0\.1)[:/]/.test(url)

describe.skipIf(!local)('admin lists on PostGIS', () => {
  let h: AdminHarness
  beforeAll(async () => {
    h = await adminHarness('admin-lists.test', { workers: 60, seed: 7 })
  }, 120_000)
  afterAll(async () => {
    await h.close()
  })

  it('listUsers matches email and the profile names, case-insensitively, newest first, 50 at most (R9)', async () => {
    const byEmail = (await h.get(`/v1/admin/users?search=${encodeURIComponent('@admin-lists.test')}`)).json() as UserListResponse
    expect(byEmail.users.length).toBe(50)
    for (let i = 1; i < byEmail.users.length; i++) expect(byEmail.users[i]!.createdAt <= byEmail.users[i - 1]!.createdAt).toBe(true)
    const w = h.workers.find((x) => x.firstName === 'Chloe') ?? h.workers[0]!
    const byName = (await h.get(`/v1/admin/users?search=${w.firstName.toLowerCase()}`)).json() as UserListResponse
    expect(byName.users.some((u) => u.id === w.userId)).toBe(true)
    expect(byName.users.every((u) => u.firstName?.toLowerCase().includes(w.firstName.toLowerCase()) || u.lastName?.toLowerCase().includes(w.firstName.toLowerCase()) || u.email.includes(w.firstName.toLowerCase()))).toBe(true)
    const roleFiltered = (await h.get(`/v1/admin/users?search=${encodeURIComponent('@admin-lists.test')}&role=CLIENT`)).json() as UserListResponse
    expect(roleFiltered.users).toEqual([])
    expect((await h.get('/v1/admin/users?search=a')).statusCode).toBe(400)
  })

  it('listSuspendedWorkers pages the suspended accounts, most recently changed first, inactive rows (R10)', async () => {
    const suspended = h.workers.filter((w) => w.status === 'SUSPENDED')
    const first = (await h.get('/v1/admin/workers/suspended?page=1&pageSize=5')).json() as SuspendedListResponse
    expect(first.pagination.pageSize).toBe(5)
    expect(first.pagination.total).toBeGreaterThanOrEqual(suspended.length)
    for (const r of first.data) expect(r.isActive).toBe(false)
    for (let i = 1; i < first.data.length; i++) expect(first.data[i]!.updatedAt <= first.data[i - 1]!.updatedAt).toBe(true)
    // Every suspended fixture worker appears across the pages.
    const seen = new Set<string>()
    for (let page = 1; ; page++) {
      const res = (await h.get(`/v1/admin/workers/suspended?page=${page}&pageSize=50`)).json() as SuspendedListResponse
      for (const r of res.data) seen.add(r.id)
      if (!res.pagination.hasNext) break
    }
    for (const w of suspended) expect(seen.has(w.id)).toBe(true)
  })

  it('the lists are role-restricted and privately cacheable', async () => {
    expect((await h.t.fastify.inject({ method: 'GET', url: '/v1/admin/users?search=abc' })).statusCode).toBe(401)
    const res = await h.get('/v1/admin/workers/suspended')
    expect(res.headers['cache-control']).toBe('private, max-age=60')
    expect(res.headers['etag']).toBeDefined()
  })
})
