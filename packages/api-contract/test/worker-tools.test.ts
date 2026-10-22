// worker-tools U1: the tool shapes and entries, and N1 -- the responses today's production app parses strictly are
// unchanged. The fixture was generated from `main` 62e24f9's schemas (openapi.json's diff on this branch only adds
// lines); the search response may differ only by the optional `appliedFilters.tools`, sent only when queried.
import { TOOL_IDS } from '@remonta/schemas/data/serviceTools'
import fc from 'fast-check'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import {
  adminContract,
  adminWorkerParamsSchema,
  profileSchema,
  serviceToolsBodySchema,
  serviceToolsParamsSchema,
  servicesViewSchema,
  workerContract,
  workerSearchQuerySchema,
  workerSearchResponseSchema,
  workerServiceSchema,
} from '../src'

const js = (s: z.ZodType) => z.toJSONSchema(s, { io: 'output', unrepresentable: 'any' })
const compat = JSON.parse(readFileSync(new URL('./fixtures/compat-2026-10-22.json', import.meta.url), 'utf8'))

describe('N1: the strictly parsed responses are unchanged', () => {
  it('the profile read and the services shapes, exactly', () => {
    expect(js(profileSchema)).toEqual(compat.profile)
    expect(js(workerServiceSchema)).toEqual(compat.workerService)
    expect(js(servicesViewSchema)).toEqual(compat.servicesView)
  })

  it('the search response, but for the optional appliedFilters.tools', () => {
    const now = js(workerSearchResponseSchema) as unknown as { properties: { appliedFilters: { properties: Record<string, unknown>; required?: string[] } } }
    expect(now.properties.appliedFilters.properties.tools).toEqual({ type: 'array', items: { type: 'string' } })
    expect(now.properties.appliedFilters.required ?? []).not.toContain('tools')
    delete now.properties.appliedFilters.properties.tools
    expect(now).toEqual(compat.searchResponse)
  })
})

describe('the tool entries (E4)', () => {
  it('paths and access', () => {
    expect(workerContract.entries.getServiceTools).toMatchObject({ method: 'GET', path: '/v1/worker/services/tools' })
    expect(workerContract.entries.putServiceTools).toMatchObject({ method: 'PUT', path: '/v1/worker/services/:categoryId/tools' })
    expect(adminContract.entries.getWorkerServices).toMatchObject({ method: 'GET', path: '/v1/admin/workers/:workerId/services' })
    expect(workerContract.entries.getServiceTools.meta.access).toEqual({ roles: ['WORKER'] })
    expect(adminContract.entries.getWorkerServices.meta.access).toEqual({ roles: ['ADMIN'] })
  })

  it('BR-2: only the two services with a list in the path', () => {
    expect(serviceToolsParamsSchema.safeParse({ categoryId: 'cleaning-services' }).success).toBe(true)
    expect(serviceToolsParamsSchema.safeParse({ categoryId: 'home-yard-maintenance' }).success).toBe(true)
    expect(serviceToolsParamsSchema.safeParse({ categoryId: 'support-worker' }).success).toBe(false)
  })

  it('the body: listed ids only, strict, bounded', () => {
    expect(serviceToolsBodySchema.safeParse({ toolIds: ['vacuum-cleaner'], otherTools: ['Hose'] }).success).toBe(true)
    expect(serviceToolsBodySchema.safeParse({ toolIds: [], otherTools: [] }).success).toBe(true)
    expect(serviceToolsBodySchema.safeParse({ toolIds: ['hammer'], otherTools: [] }).success).toBe(false)
    expect(serviceToolsBodySchema.safeParse({ toolIds: [], otherTools: [], extra: 1 }).success).toBe(false)
    expect(serviceToolsBodySchema.safeParse({ toolIds: [], otherTools: ['x'.repeat(201)] }).success).toBe(false)
    expect(serviceToolsBodySchema.safeParse({ toolIds: [], otherTools: Array(21).fill('x') }).success).toBe(false)
  })

  it('P6: any control character in an own tool is refused', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), fc.integer({ min: 0, max: 0x1f }).chain((c) => fc.constantFrom(c, 0x7f, 0x85)), fc.string({ maxLength: 40 }), (a, code, b) => {
        expect(serviceToolsBodySchema.safeParse({ toolIds: [], otherTools: [`${a}${String.fromCharCode(code)}${b}`] }).success).toBe(false)
      }),
    )
  })

  it('the admin filter takes listed ids, comma-separated, and nothing else', () => {
    expect(workerSearchQuerySchema.parse({ tools: 'ladder,vacuum-cleaner' }).tools).toEqual(['ladder', 'vacuum-cleaner'])
    expect(workerSearchQuerySchema.safeParse({ tools: 'hammer' }).success).toBe(false)
    expect(workerSearchQuerySchema.parse({ tools: TOOL_IDS.join(',') }).tools).toHaveLength(TOOL_IDS.length)
  })

  it('the admin worker id is a plain id', () => {
    expect(adminWorkerParamsSchema.safeParse({ workerId: 'cmj85z8m60000vxr002l9hqqo' }).success).toBe(true)
    expect(adminWorkerParamsSchema.safeParse({ workerId: '../x' }).success).toBe(false)
  })
})
