// GET /v1/service-requirements on PostGIS (signup-abn-agreement, 2026-11-19): public, cached, the catalogue's service
// with the dashboard's rules; an unknown service is a 404. Runs only when TEST_DATABASE_URL points at localhost (CI).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { clearCatalogueCache } from '../../src/modules/worker/persistence/profile-read'
import { registrationHarness, type RegistrationHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false

describe.skipIf(!local)('GET /v1/service-requirements', () => {
  let h: RegistrationHarness
  beforeAll(async () => {
    h = await registrationHarness('svcreq-test.example')
    // A slug id, as the catalogue's are (the harness's own category carries its domain's dot).
    await h.db.subcategory.deleteMany({ where: { categoryId: 'svcreq-support' } })
    await h.db.category.deleteMany({ where: { id: 'svcreq-support' } })
    await h.db.category.create({ data: { id: 'svcreq-support', name: 'Svcreq Support', subcategories: { create: [{ id: 'svcreq-care', name: 'Svcreq Care' }] } } })
    clearCatalogueCache()
  })
  afterAll(async () => {
    await h?.db.subcategory.deleteMany({ where: { categoryId: 'svcreq-support' } })
    await h?.db.category.deleteMany({ where: { id: 'svcreq-support' } })
    await h?.close()
  })
  const get = (q: string) => h.t.fastify.inject({ method: 'GET', url: `/v1/service-requirements?${q}` })

  it('answers the service with its groups, without a CAPTCHA or a token, and lets it be cached', async () => {
    const res = await get('categoryId=svcreq-support&subcategoryIds=svcreq-care')
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ service: 'Svcreq Support', groups: expect.any(Array) })
    expect(String(res.headers['cache-control'])).toContain('max-age=300')
  })

  it('an unknown service is a 404; a malformed id is a 400', async () => {
    expect((await get('categoryId=no-such-service')).statusCode).toBe(404)
    expect((await get('categoryId=Not%20A%20Slug')).statusCode).toBe(400)
  })
})
