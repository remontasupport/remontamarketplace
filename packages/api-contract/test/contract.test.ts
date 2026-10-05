import * as z from 'zod'
import { describe, expect, it } from 'vitest'
import publicEndpoints from '../public-endpoints.json'
import { checkContracts, contracts, defineContract, meta, registrationContract, type PublicEndpoint } from '../src/index'

const allow = publicEndpoints as PublicEndpoint[]

describe('the contracts as committed', () => {
  it('pass every check', () => {
    expect(checkContracts(contracts, allow)).toEqual([])
  })

  it('declare the seven S1 registration entries plus the two of the direct photo upload (U3)', () => {
    expect(Object.keys(registrationContract.entries).sort()).toEqual([
      'checkEmailAvailability',
      'confirmPhotoUpload',
      'createPhotoUploadTicket',
      'listServiceCategories',
      'requestEmailCode',
      'searchLocalities',
      'submitWorkerRegistration',
      'uploadRegistrationPhoto',
      'verifyEmailCode',
    ])
  })

  it('bind the photo ticket to the accepted types and the size cap, and the confirm to a uuid', () => {
    const ticket = registrationContract.entries.createPhotoUploadTicket
    const body = ticket.body as { kind: 'json'; schema: z.ZodType }
    expect(body.schema.safeParse({ contentType: 'image/jpeg', sizeBytes: 1 }).success).toBe(true)
    expect(body.schema.safeParse({ contentType: 'image/heic', sizeBytes: 1 }).success).toBe(false)
    expect(body.schema.safeParse({ contentType: 'image/png', sizeBytes: 0 }).success).toBe(false)
    expect(body.schema.safeParse({ contentType: 'image/png', sizeBytes: 5 * 1024 * 1024 + 1 }).success).toBe(false)
    expect(ticket.meta.bot).toBe('none')
    expect(ticket.meta.rateLimit).toEqual([
      { per: 'ip', limit: 10, window: '1h' },
      { per: 'global', limit: 300, window: '1h' },
    ])
    const confirm = registrationContract.entries.confirmPhotoUpload
    const cbody = confirm.body as { kind: 'json'; schema: z.ZodType }
    expect(cbody.schema.safeParse({ photoUploadId: 'not-a-uuid' }).success).toBe(false)
    expect(cbody.schema.safeParse({ photoUploadId: '6f1c2c1e-6d8a-4b7e-9f3d-2b0e1d4c5a6b', extra: 1 }).success).toBe(false)
  })

  it('serve the service catalogue publicly, cached, with only what the sign-up shows', () => {
    const e = registrationContract.entries.listServiceCategories
    expect([e.method, e.path]).toEqual(['GET', '/v1/service-categories'])
    expect(e.meta.access).toBe('public')
    expect(e.meta.cacheSeconds).toBeGreaterThan(0)
    const ok = e.responses[200].safeParse({ categories: [{ id: 'support-worker', name: 'Support Worker', requiresQualification: false, subcategories: [{ id: 'sw-1', name: 'Personal care', requiresRegistration: null }] }] })
    expect(ok.success).toBe(true)
    // Documents and anything else stay out of the response.
    const extra = e.responses[200].safeParse({ categories: [{ id: 'x', name: 'X', requiresQualification: false, subcategories: [], documents: {} }] })
    expect(extra.success).toBe(false)
  })

  it('put a CAPTCHA and an audit action on the sign-up itself', () => {
    const m = registrationContract.entries.submitWorkerRegistration.meta
    expect(m.bot).toEqual({ captcha: { action: 'worker_register' } })
    expect(m.audit).toBe('ACCOUNT_REGISTERED')
  })
})

// Each check must be able to fail -- a check that has never rejected anything may
// be unenforceable (CLAUDE.md, "Prove a guard fails").
const ok = meta({ access: 'public', bot: 'none', rateLimit: [{ per: 'ip', limit: 1, window: '1m' }], maxBodyKb: 1 })
const roles = meta({ access: { roles: ['ADMIN'] }, bot: 'none', rateLimit: [{ per: 'user', limit: 1, window: '1m' }], maxBodyKb: 1 })
const res = { 200: z.strictObject({ ok: z.boolean() }) }
const allowFor = (...routes: string[]) => routes.map((route) => ({ route, reason: 'reviewed for the test' }))

describe('checkContracts rejects', () => {
  const cases: [string, Parameters<typeof checkContracts>, RegExp][] = [
    [
      'a public entry missing from the allow-list',
      [[defineContract('test', { a: { method: 'GET', path: '/v1/a', summary: '', responses: res, meta: ok } })], []],
      /public but not on public-endpoints.json/,
    ],
    [
      'an allow-list route that is no longer public',
      [[defineContract('test', { a: { method: 'GET', path: '/v1/a', summary: '', responses: res, meta: roles } })], allowFor('GET /v1/a')],
      /is not a public entry/,
    ],
    [
      'an allow-list entry without a reason',
      [[defineContract('test', { a: { method: 'GET', path: '/v1/a', summary: '', responses: res, meta: ok } })], [{ route: 'GET /v1/a', reason: '' }]],
      /needs a reason/,
    ],
    [
      'a body that accepts unknown fields',
      [[defineContract('test', { a: { method: 'POST', path: '/v1/a', summary: '', body: { kind: 'json', schema: z.object({ x: z.string() }) }, responses: res, meta: roles } })], []],
      /strict object \(P9\)/,
    ],
    [
      'a response that passes unknown fields through',
      [[defineContract('test', { a: { method: 'GET', path: '/v1/a', summary: '', responses: { 200: z.looseObject({ x: z.string() }) }, meta: roles } })], []],
      /must not pass unknown fields through \(P10\)/,
    ],
    [
      'two entries on one route',
      [
        [
          defineContract('test', { a: { method: 'GET', path: '/v1/a', summary: '', responses: res, meta: roles } }),
          defineContract('other', { b: { method: 'GET', path: '/v1/a', summary: '', responses: res, meta: roles } }),
        ],
        [],
      ],
      /is also test\.a/,
    ],
    [
      'path params that do not match the path',
      [[defineContract('test', { a: { method: 'GET', path: '/v1/a/:id', summary: '', responses: res, meta: roles } })], []],
      /do not match pathParams/,
    ],
    [
      'a path outside /v1',
      [[defineContract('test', { a: { method: 'GET', path: '/admin', summary: '', responses: res, meta: roles } })], []],
      /must be \/v1/,
    ],
    [
      'a GET with a body',
      [[defineContract('test', { a: { method: 'GET', path: '/v1/a', summary: '', body: { kind: 'json', schema: z.strictObject({}) }, responses: res, meta: roles } })], []],
      /GET cannot have a body/,
    ],
    [
      'a cached private entry',
      [[defineContract('test', { a: { method: 'GET', path: '/v1/a', summary: '', responses: res, meta: { ...roles, cacheSeconds: 60 } } })], []],
      /only public GETs may be cached/,
    ],
    [
      'a file limit larger than the body limit',
      [[defineContract('test', { a: { method: 'POST', path: '/v1/a', summary: '', body: { kind: 'multipart', files: { f: { maxBytes: 2048, mimeTypes: ['image/png'] } } }, responses: res, meta: roles } })], []],
      /exceeds maxBodyKb/,
    ],
  ]
  cases.push([
    'a probe on an entry with input',
    [[defineContract('test', { a: { method: 'POST', path: '/v1/a', summary: '', body: { kind: 'json', schema: z.strictObject({}) }, responses: res, meta: { ...roles, probe: true } } })], []],
    /only a GET with no input may be a probe/,
  ])
  it.each(cases)('%s', (_label, args, problem) => {
    expect(checkContracts(...args).join('\n')).toMatch(problem)
  })
})

describe('meta() rejects at load time', () => {
  it.each([
    ['no rate limit', { access: 'public', bot: 'none', rateLimit: [], maxBodyKb: 1 }],
    ['no access', { bot: 'none', rateLimit: [{ per: 'ip', limit: 1, window: '1m' }], maxBodyKb: 1 }],
    ['an unknown role', { access: { roles: ['ROOT'] }, bot: 'none', rateLimit: [{ per: 'ip', limit: 1, window: '1m' }], maxBodyKb: 1 }],
    ['a per-user limit on a public entry', { access: 'public', bot: 'none', rateLimit: [{ per: 'user', limit: 1, window: '1m' }], maxBodyKb: 1 }],
    ['a zero limit', { access: 'public', bot: 'none', rateLimit: [{ per: 'ip', limit: 0, window: '1m' }], maxBodyKb: 1 }],
    ['an unknown key', { access: 'public', bot: 'none', rateLimit: [{ per: 'ip', limit: 1, window: '1m' }], maxBodyKb: 1, skipAuth: true }],
  ])('%s', (_label, m) => {
    expect(() => meta(m as never)).toThrow(/invalid contract metadata/)
  })
})
