import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  CONSENT_WORDING_VERSION,
  isValidPassword,
  normaliseAuMobile,
  normaliseEmail,
  workerRegistrationFormSchema,
  workerRegistrationSchema,
} from './workerRegistrationSchema'

const valid = {
  localityId: 1234,
  firstName: ' Mary-Jane ',
  lastName: "O'Connor",
  email: '  Mary.OConnor@Example.COM ',
  mobile: '0412 345 678',
  password: 'Str0ng!pass',
  services: ['support-worker'],
  supportWorkerCategories: ['personal-care'],
  photoUploadId: '3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f',
  consentProfileShare: true,
  consentWordingVersion: CONSENT_WORDING_VERSION,
  zohoLeadId: '5725767000012345678',
}

describe('workerRegistrationSchema', () => {
  it('accepts a valid sign-up and normalises it', () => {
    const out = workerRegistrationSchema.parse({ ...valid, captchaToken: 't' })
    expect(out).toMatchObject({
      firstName: 'Mary-Jane',
      email: 'mary.oconnor@example.com',
      mobile: '+61412345678',
      zohoLeadId: '5725767000012345678',
    })
  })

  it.each([
    ['an unknown field', { extra: 1 }],
    ['the old free-text location', { location: 'Parramatta NSW 2150' }],
    ['a photo URL instead of an upload id', { photo: 'https://x/y.jpg' }],
    ['a photo upload id that is a URL', { photoUploadId: 'https://evil.example/p.jpg' }],
    ['consent not given', { consentProfileShare: false }],
    ['an old consent wording', { consentWordingVersion: 'worker-profile-share-v0' }],
    ['no services', { services: [] }],
    ['a duplicated service', { services: ['a', 'a'] }],
    ['11 services', { services: Array.from({ length: 11 }, (_, i) => `s${i}`) }],
    ['a name with digits', { firstName: 'R2D2' }],
    ['a name of only punctuation', { lastName: "'-'" }],
    ['a 51-character name', { firstName: 'a'.repeat(51) }],
    ['a landline', { mobile: '02 9876 5432' }],
    ['a non-Australian +44 mobile', { mobile: '+44 7700 900123' }],
    ['a weak password', { password: 'password1' }],
    ['a 129-character password', { password: 'Aa1!' + 'x'.repeat(125) }],
    ['a locality name instead of an id', { localityId: 'Parramatta' }],
    ['a zero locality id', { localityId: 0 }],
  ])('rejects %s', (_label, patch) => {
    expect(workerRegistrationSchema.safeParse({ ...valid, captchaToken: 't', ...patch }).success).toBe(false)
  })

  it('requires the captcha token on the request but not on the form', () => {
    expect(workerRegistrationSchema.safeParse(valid).success).toBe(false)
    expect(workerRegistrationFormSchema.safeParse(valid).success).toBe(true)
    expect(workerRegistrationFormSchema.safeParse({ ...valid, captchaToken: 't' }).success).toBe(false) // strict
  })

  it.each([['abc'], ['12 34'], ['1'.repeat(33)], ['']])('drops a malformed zohoLeadId (%s) without failing', (zohoLeadId) => {
    const out = workerRegistrationSchema.parse({ ...valid, captchaToken: 't', zohoLeadId })
    expect(out.zohoLeadId).toBeUndefined()
  })
})

describe('normaliseAuMobile', () => {
  it.each([
    ['0412345678', '+61412345678'],
    ['0412 345 678', '+61412345678'],
    ['(04) 1234-5678', '+61412345678'],
    ['+61 412 345 678', '+61412345678'],
    ['61412345678', '+61412345678'],
    ['+61412345678', '+61412345678'],
    ['0212345678', null],
    ['+44412345678', null],
    ['04123456789', null],
    ['0412a45678', null],
  ])('%s -> %s', (input, expected) => {
    expect(normaliseAuMobile(input)).toBe(expected)
  })
})

// Any Australian mobile, written in any of the forms people type.
const mobileNumber = fc.stringMatching(/^[0-9]{8}$/).map((rest) => `4${rest}`)
const written = fc.tuple(mobileNumber, fc.constantFrom('0', '+61', '+61 ', '61', '(0', '0'), fc.constantFrom('', ' ', '-', '.')).map(
  ([n, prefix, sep]) => {
    const body = `${n.slice(0, 3)}${sep}${n.slice(3, 6)}${sep}${n.slice(6)}`
    return { n, text: prefix === '(0' ? `(0${body.slice(0, 1)})${body.slice(1)}` : `${prefix}${body}` }
  },
)

describe('normaliser properties', () => {
  it('E.164 is stable: every written form of one number normalises to the same +614 value', () => {
    fc.assert(
      fc.property(written, ({ n, text }) => {
        expect(normaliseAuMobile(text)).toBe(`+61${n}`)
      }),
    )
  })

  it('mobile normalisation is idempotent', () => {
    fc.assert(
      fc.property(fc.oneof(written.map((w) => w.text), fc.string({ maxLength: 20 })), (s) => {
        const once = normaliseAuMobile(s)
        if (once !== null) expect(normaliseAuMobile(once)).toBe(once)
      }),
    )
  })

  it('email normalisation is idempotent', () => {
    fc.assert(fc.property(fc.string(), (s) => normaliseEmail(normaliseEmail(s)) === normaliseEmail(s)))
  })

  it('the stored email is what a re-submission would normalise to', () => {
    fc.assert(
      fc.property(fc.emailAddress(), fc.constantFrom('', ' ', '  '), fc.boolean(), (e, pad, upper) => {
        const input = `${pad}${upper ? e.toUpperCase() : e}${pad}`
        const r = workerRegistrationFormSchema.safeParse({ ...valid, email: input })
        if (r.success) expect(workerRegistrationFormSchema.parse({ ...valid, email: r.data.email }).email).toBe(r.data.email)
      }),
    )
  })
})

describe('page/server parity', () => {
  // The page validates with the form schema, the server with the request schema.
  // For ANY input they must agree on validity and produce the same values, so a
  // form the page accepts is never rejected by the server for a field reason.
  const field = fc.oneof(fc.string({ maxLength: 12 }), fc.integer(), fc.boolean(), fc.constant(undefined), fc.array(fc.string({ maxLength: 5 }), { maxLength: 3 }))
  const mutation = fc.dictionary(fc.constantFrom(...Object.keys(valid), 'extra'), field, { maxKeys: 3 })

  it('form and request agree on every input', () => {
    fc.assert(
      fc.property(mutation, (patch) => {
        const input = { ...valid, ...patch }
        const form = workerRegistrationFormSchema.safeParse(input)
        const request = workerRegistrationSchema.safeParse({ ...input, captchaToken: 't' })
        expect(request.success).toBe(form.success)
        if (form.success && request.success) {
          const { captchaToken: _t, ...rest } = request.data
          expect(rest).toEqual(form.data)
        }
      }),
    )
  })

  it('password validity matches the exported rule the page shows', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 140 }), (p) => {
        expect(workerRegistrationFormSchema.safeParse({ ...valid, password: p }).success).toBe(isValidPassword(p))
      }),
    )
  })
})
