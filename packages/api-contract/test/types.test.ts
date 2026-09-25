// Compile-time checks: `pnpm typecheck` covers this file, and the @ts-expect-error
// lines fail the type-check if inference ever stops rejecting them. This is the
// property ts-rest lost with Zod 4 (everything inferred as never -- D1).
import { describe, expect, it } from 'vitest'
import { registrationContract, type BodyInput, type BodyOutput, type RequestInput, type SuccessResponse } from '../src/index'

type Submit = typeof registrationContract.entries.submitWorkerRegistration
type Search = typeof registrationContract.entries.searchLocalities

describe('types derived from the contract', () => {
  it('are specific, not never or any', () => {
    const body: BodyInput<Submit> = {
      localityId: 1,
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.co',
      mobile: '0412345678',
      password: 'Str0ng!pass',
      services: ['s'],
      photoUploadId: '3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f',
      consentProfileShare: true,
      consentWordingVersion: 'worker-profile-share-v1',
      captchaToken: 't',
    }
    // @ts-expect-error localityId is a number
    const wrong: BodyInput<Submit> = { ...body, localityId: 'Parramatta' }
    // @ts-expect-error consent must be the literal true
    const noConsent: BodyInput<Submit> = { ...body, consentProfileShare: false }

    // The server sees normalised output: zohoLeadId is optional string after the transform.
    const out = null as unknown as BodyOutput<Submit>
    const lead: string | undefined = out?.zohoLeadId

    const q: RequestInput<Search>['query'] = { q: 'parra' }
    // @ts-expect-error q is a string
    const badQ: RequestInput<Search>['query'] = { q: 5 }

    const r: SuccessResponse<Search> = { status: 200, body: { localities: [{ id: 1, suburb: 'Parramatta', state: 'NSW', postcode: '2150', label: 'Parramatta NSW 2150' }] } }
    // @ts-expect-error OT is a state, XX is not
    const badState: SuccessResponse<Search> = { status: 200, body: { localities: [{ id: 1, suburb: 'X', state: 'XX', postcode: '2150', label: '' }] } }
    // @ts-expect-error searchLocalities has no 201
    const badStatus: SuccessResponse<Search> = { status: 201, body: { localities: [] } }

    expect([body, wrong, noConsent, lead, q, badQ, r, badState, badStatus]).toHaveLength(9)
  })
})
