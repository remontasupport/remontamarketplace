// Hostile input through the real sign-up api (user request, 2026-09-28): the
// classic payloads -- SQL fragments, script tags, control and unicode tricks,
// oversized values and bodies, wildcards, extra and prototype-polluting fields,
// type confusion, wrong content types. The property: each is either REFUSED with
// a message on its field, or STORED VERBATIM and rendered inert. Nothing is
// "cleaned". Afterwards every table is intact.
//
// The api does not sanitise: it validates against allow-lists at the boundary
// (strict Zod schemas), sends values to PostgreSQL as parameters (Prisma and
// tagged-template raw SQL), and escapes on output (React; the email templates).
import { escapeHtml, registrationConfirmation } from '../../src/modules/notifications/templates'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { registrationHarness, type RegistrationHarness } from './harness'

const url = process.env.TEST_DATABASE_URL
const local = url ? ['localhost', '127.0.0.1'].includes(new URL(url).hostname) : false

/** What an attacker types. Each must be refused by a text field with an allow-list. */
const PAYLOADS: [string, string][] = [
  ['a SQL tautology', "' OR 1=1 --"],
  ['a SQL statement terminator', "Robert'); DROP TABLE users; --"],
  ['a stacked statement', '"; DELETE FROM worker_profiles; --'],
  ['a script tag', '<script>alert(1)</script>'],
  ['an event handler', '<img src=x onerror=alert(1)>'],
  ['a template expression', '${7*7}{{7*7}}'],
  ['a null byte', 'Mary\u0000Smith'],
  ['a CRLF (header injection)', 'Mary\r\nBcc: victim@example.com'],
  ['a right-to-left override', 'Mary‮yraM'],
  ['a zero-width joiner', 'Ma‍ry'],
  ['a NoSQL-style operator, as text', '{"$ne": null}'],
  ['a path traversal', '../../etc/passwd'],
  ['a shell command', '$(rm -rf /)'],
  ['10,000 characters', 'a'.repeat(10_000)],
]

describe.skipIf(!local)('hostile input through the sign-up api', () => {
  let h: RegistrationHarness
  let localities: number
  let usersBefore: number

  beforeAll(async () => {
    h = await registrationHarness('s1-hostile.example')
    localities = await h.db.auLocality.count()
    usersBefore = await h.db.user.count()
  })
  afterAll(async () => {
    // Every table the sign-up touches still exists with what it had (plus this suite's own rows, removed by close()).
    expect(await h.db.auLocality.count()).toBe(localities)
    for (const table of ['users', 'worker_profiles', 'worker_services', 'worker_locations', 'worker_onboarding', 'outbox_events', 'audit_logs']) {
      expect((await h.db.$queryRawUnsafe<{ ok: number }[]>(`SELECT 1 AS ok FROM ${table} LIMIT 0`)).length, table).toBe(0)
    }
    await h.close()
    expect(await h.db.user.count()).toBe(usersBefore)
  })

  /** The top-level fields named by a 400 ("services.0" counts as "services"). */
  const fields = (res: { json(): { error?: { fields?: Record<string, string[]> } } }) => [...new Set(Object.keys(res.json().error?.fields ?? {}).map((k) => k.split('.')[0]!))]

  describe('a name with an allow-list refuses every payload, naming the field', () => {
    it.each(PAYLOADS)('%s', async (_label, value) => {
      for (const field of ['firstName', 'lastName'] as const) {
        const res = await h.register(await h.body({ [field]: value }))
        expect(res.statusCode, `${field} = ${JSON.stringify(value.slice(0, 40))}`).toBe(400)
        expect(fields(res)).toEqual([field])
        expect(res.body).not.toContain(value.slice(0, 20)) // the payload is never echoed
      }
    })
  })

  describe('the email, the mobile and the code refuse every payload', () => {
    it.each(PAYLOADS)('%s', async (_label, value) => {
      for (const [path, payload] of [
        ['/v1/registrations/worker/email-availability', { email: value }],
        ['/v1/registrations/worker/email-codes', { email: value, captchaToken: 'test-token' }],
      ] as const) {
        const res = await h.t.fastify.inject({ method: 'POST', url: path, payload })
        // A value larger than the route's whole body limit is refused as 413 before validation sees it.
        if (res.statusCode === 413) {
          expect(value.length, path).toBeGreaterThan(1000)
          continue
        }
        expect(res.statusCode, path).toBe(400)
        expect(fields(res)).toEqual(['email'])
      }
      const mobile = await h.register(await h.body({ mobile: value }))
      expect(mobile.statusCode).toBe(400)
      expect(fields(mobile)).toEqual(['mobile'])
      const code = await h.t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker/email-codes/verify', payload: { email: h.email(), code: value, token: 'ab'.repeat(32), expiresAt: 1 } })
      if (code.statusCode === 413) {
        expect(value.length).toBeGreaterThan(1000) // over the route's 1 KB body limit
      } else {
        expect(code.statusCode).toBe(400)
        expect(fields(code)).toEqual(['code'])
      }
    })
  })

  describe('the password takes any characters -- it is hashed, never rendered or queried', () => {
    it.each(PAYLOADS.filter(([, v]) => v.length <= 128 && !v.includes('\u0000')))('%s', async (_label, value) => {
      const password = `Aa1!${value}`.slice(0, 128)
      const b = await h.body({ password })
      const res = await h.register(b)
      expect(res.statusCode).toBe(202)
      const user = await h.db.user.findUniqueOrThrow({ where: { email: b.email as string } })
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/)
      expect(user.passwordHash).not.toContain(value.slice(0, 8))
    })
  })

  describe('what an allow-list ACCEPTS is stored verbatim and rendered inert', () => {
    it.each([
      ["an apostrophe: O'Connor", "O'Connor"],
      ['a curly apostrophe', 'O’Neil'],
      ['a double hyphen (a SQL comment marker, but only letters and hyphens)', 'Anne--Marie'],
      ['letters from another script', 'Zoë Müller'],
      ['a name that is only a hyphen and a letter', '-a'],
    ])('%s', async (_label, name) => {
      const b = await h.body({ firstName: name, lastName: name })
      expect((await h.register(b)).statusCode).toBe(202)
      const p = await h.db.workerProfile.findFirstOrThrow({ where: { user: { email: b.email as string } } })
      expect(p.firstName).toBe(name)
      expect(p.lastName).toBe(name)
      // The confirmation email escapes it; the raw value never reaches the HTML.
      const mail = registrationConfirmation(name, 'https://app.example')
      expect(mail.html).toContain(escapeHtml(name))
      if (name.includes("'")) expect(mail.html).not.toContain(`, ${name}<`)
    })
  })

  describe('the request shape', () => {
    it('refuses extra fields, including ones that would escalate or pollute prototypes -- and the prototype stays clean', async () => {
      for (const extra of [{ isAdmin: true }, { role: 'ADMIN' }, { constructor: { prototype: { polluted: true } } }, { 'services.0': 'x' }]) {
        const res = await h.register({ ...(await h.body()), ...extra })
        expect(res.statusCode, JSON.stringify(extra)).toBe(400)
      }
      // "__proto__" as a real JSON key (a spread would set the prototype instead of a property).
      const withProto = Object.assign(JSON.parse('{"__proto__": {"polluted": true}}'), await h.body())
      expect(Object.keys(withProto)).toContain('__proto__')
      const proto = await h.register(withProto)
      expect(proto.statusCode).toBe(400)
      expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
      expect((Object.prototype as { polluted?: boolean }).polluted).toBeUndefined()
    })

    it('refuses the wrong type in every field', async () => {
      const b = await h.body()
      const cases: Record<string, unknown> = {
        localityId: String(b.localityId),
        firstName: ['Mary'],
        email: { $ne: null },
        mobile: 412345678,
        password: { toString: 'x' },
        services: 'test-support',
        supportWorkerCategories: [{ id: 'x' }],
        photoUploadId: { id: b.photoUploadId },
        consentProfileShare: 'true',
        emailVerification: 'verified',
        captchaToken: ['t'],
      }
      for (const [field, value] of Object.entries(cases)) {
        const res = await h.register({ ...b, [field]: value })
        if (field === 'captchaToken') {
          // The bot check runs before validation and fails closed: a token that is not a string is "missing".
          expect(res.statusCode, field).toBe(403)
          continue
        }
        expect(res.statusCode, field).toBe(400)
        expect(fields(res), field).toEqual([field])
      }
    })

    it('refuses a body over the limit (413), a non-JSON content type (415) and malformed JSON (400)', async () => {
      const b = await h.body()
      const big = await h.register({ ...b, lastName: 'a'.repeat(20 * 1024) })
      expect(big.statusCode).toBe(413)
      // A wrong content type never reaches the handler: the pipeline's bot check runs before parsing and fails closed
      // (403, no token in a body it will not parse), or the type is refused outright (415). Either is a refusal.
      const text = await h.t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker', payload: JSON.stringify(b), headers: { 'content-type': 'text/plain' } })
      expect([403, 415]).toContain(text.statusCode)
      const form = await h.t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker', payload: 'email=a%40b.test', headers: { 'content-type': 'application/x-www-form-urlencoded' } })
      expect([403, 415]).toContain(form.statusCode)
      const malformed = await h.t.fastify.inject({ method: 'POST', url: '/v1/registrations/worker', payload: '{"email": "a@b.test",', headers: { 'content-type': 'application/json' } })
      expect(malformed.statusCode).toBe(400)
      expect(await h.db.user.count({ where: { email: b.email as string } })).toBe(0)
    })

    it('the error shape never carries the input back, only the field name and a fixed message', async () => {
      const res = await h.register(await h.body({ firstName: '<script>alert(1)</script>' }))
      const text = res.body
      expect(text).not.toContain('<script>')
      expect(text).not.toContain('alert')
      expect(res.json().error).toEqual({ code: 'INVALID_REQUEST', message: 'The request is not valid.', requestId: expect.any(String), fields: { firstName: ['First name can contain letters, spaces, apostrophes and hyphens only'] } })
    })
  })

  describe('the suburb search', () => {
    it.each([
      ['a wildcard', '%%'],
      ['an underscore wildcard', '____'],
      ['the LIKE escape character', 'parra\\'],
      ['a SQL fragment', "parra' OR 1=1 --"],
      ['a script tag', '<script>x</script>'],
      ['a null byte', 'parra\u0000'],
    ])('%s: answers a list (never an error, never a leak), and the table is untouched', async (_label, q) => {
      const res = await h.t.fastify.inject({ method: 'GET', url: `/v1/localities?q=${encodeURIComponent(q)}` })
      expect(res.statusCode).toBe(200)
      const list = res.json().localities as { suburb: string }[]
      expect(list.length).toBeLessThanOrEqual(10)
      if (q === '%%' || q === '____') expect(list).toEqual([]) // a wildcard matches nothing, not everything
      expect(res.body).not.toContain('<script>')
      expect(await h.db.auLocality.count()).toBe(localities)
    })

    it('refuses a query over 60 characters', async () => {
      const res = await h.t.fastify.inject({ method: 'GET', url: `/v1/localities?q=${'a'.repeat(61)}` })
      expect(res.statusCode).toBe(400)
    })
  })
}, 120_000)
