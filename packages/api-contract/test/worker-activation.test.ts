// worker-activation U1: the activation and suspension entries, the search's activation filter, and N1 -- the responses
// today's production app parses strictly are unchanged. The fixture was generated from `main` 8943f93's schemas; the
// search may differ only by the optional `appliedFilters.activation` and the row's optional `activated`, both sent
// only when queried (BR-6), which today's app never does.
import fc from 'fast-check'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import {
  activationViewSchema,
  adminContract,
  profileSchema,
  suspendedListResponseSchema,
  workerActivationBodySchema,
  workerContract,
  workerSearchQuerySchema,
  workerSearchResponseSchema,
  workerSuspensionBodySchema,
} from '../src'

type Obj = { properties: Record<string, Obj & Record<string, unknown>>; required?: string[]; items?: Obj }
const js = (s: z.ZodType) => z.toJSONSchema(s, { io: 'output', unrepresentable: 'any' }) as unknown as Obj
const compat = JSON.parse(readFileSync(new URL('./fixtures/compat-2026-10-23.json', import.meta.url), 'utf8'))

/** The row schema inside a list response, with the optional `activated` checked and removed. */
function withoutActivated(response: Obj): Obj {
  const row = response.properties.data!.items!
  expect(row.properties.activated).toEqual({ type: 'boolean' })
  expect(row.required ?? []).not.toContain('activated')
  delete row.properties.activated
  return response
}

describe('N1: the strictly parsed responses are unchanged', () => {
  it('the profile read, exactly', () => {
    expect(js(profileSchema)).toEqual(compat.profile)
  })

  it('the search response, but for the optional row.activated and appliedFilters.activation', () => {
    const now = withoutActivated(js(workerSearchResponseSchema))
    const applied = now.properties.appliedFilters!
    expect(applied.properties.activation).toEqual({ type: 'string', enum: ['active', 'inactive'] })
    expect(applied.required ?? []).not.toContain('activation')
    delete applied.properties.activation
    // The nurse type (2026-10-23): optional too, echoed only when queried.
    expect(applied.properties.nursingType).toEqual({ type: 'string', enum: ['registered', 'enrolled'] })
    expect(applied.required ?? []).not.toContain('nursingType')
    delete applied.properties.nursingType
    expect(now).toEqual(compat.searchResponse)
  })

  it('the suspended list, but for the optional row.activated (never sent there)', () => {
    expect(withoutActivated(js(suspendedListResponseSchema))).toEqual(compat.suspendedListResponse)
  })
})

describe('the entries (contract table)', () => {
  it('paths, methods and access', () => {
    expect(adminContract.entries.setWorkerActivation).toMatchObject({ method: 'PUT', path: '/v1/admin/workers/:workerId/activation' })
    expect(adminContract.entries.setWorkerSuspension).toMatchObject({ method: 'PUT', path: '/v1/admin/workers/:workerId/suspension' })
    expect(workerContract.entries.getActivation).toMatchObject({ method: 'GET', path: '/v1/worker/activation' })
    expect(adminContract.entries.setWorkerActivation.meta.access).toEqual({ roles: ['ADMIN'] })
    expect(adminContract.entries.setWorkerSuspension.meta.access).toEqual({ roles: ['ADMIN'] })
    expect(workerContract.entries.getActivation.meta.access).toEqual({ roles: ['WORKER'] })
  })

  it('N3: the writes are never cached, rate-limited per user and per IP, 1 KB', () => {
    for (const e of [adminContract.entries.setWorkerActivation, adminContract.entries.setWorkerSuspension]) {
      expect(e.meta).not.toHaveProperty('privateCacheSeconds')
      expect(e.meta.maxBodyKb).toBe(1)
      expect(e.meta.rateLimit.map((r) => r.per).sort()).toEqual(['ip', 'user'])
    }
    expect(workerContract.entries.getActivation.meta).not.toHaveProperty('privateCacheSeconds')
  })

  it('the bodies are strict booleans', () => {
    expect(workerActivationBodySchema.safeParse({ activated: true }).success).toBe(true)
    expect(workerActivationBodySchema.safeParse({ activated: 'true' }).success).toBe(false)
    expect(workerActivationBodySchema.safeParse({ activated: true, suspended: false }).success).toBe(false)
    expect(workerSuspensionBodySchema.safeParse({ suspended: false }).success).toBe(true)
    expect(workerSuspensionBodySchema.safeParse({}).success).toBe(false)
    expect(activationViewSchema.safeParse({ activated: false }).success).toBe(true)
  })
})

describe('the search query (BR-5, BR-6)', () => {
  it('activation is active or inactive; absent means both', () => {
    expect(workerSearchQuerySchema.parse({}).activation).toBeUndefined()
    expect(workerSearchQuerySchema.parse({ activation: 'inactive' }).activation).toBe('inactive')
    expect(workerSearchQuerySchema.safeParse({ activation: 'all' }).success).toBe(false)
  })

  it('withActivation takes the URL booleans only', () => {
    fc.assert(
      fc.property(fc.string(), (v) => {
        const r = workerSearchQuerySchema.safeParse({ withActivation: v })
        expect(r.success).toBe(v === 'true' || v === 'false')
        if (r.success) expect(r.data.withActivation).toBe(v === 'true')
      }),
    )
  })
})
