// worker-tools U1: the body rules of a service's tools (BR-4..BR-9), pure, and the admin filter's shape (BR-12).
import { serviceToolsSchema, workerSearchQuerySchema } from '@remonta/api-contract'
import { SERVICE_TOOLS, TOOL_IDS, TOOL_SERVICES } from '@remonta/schemas/data/serviceTools'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { appliedFiltersOf, normaliseQuery } from '../../src/modules/admin/domain/search-query'
import { FILTERS, whereOf } from '../../src/modules/admin/application/filters'
import { OTHER_TOOL_TOO_LONG, TOO_MANY_OTHER_TOOLS, toolsFromBody, toolsOf, toolsOrEmpty } from '../../src/modules/worker/application/sections/service-tools'
import { ApiError } from '../../src/platform/errors'

const fieldsOf = (f: () => unknown) => {
  try {
    f()
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, fields: e.fields }
    throw e
  }
  throw new Error('expected an ApiError')
}

describe('toolsFromBody (BR-4..BR-6)', () => {
  it('ticks in any order are stored in list order, each once (BR-5)', () => {
    expect(toolsFromBody('cleaning-services', { toolIds: ['mop-and-bucket', 'vacuum-cleaner', 'mop-and-bucket'], otherTools: [] })).toEqual({
      categoryId: 'cleaning-services',
      toolIds: ['vacuum-cleaner', 'mop-and-bucket'],
      otherTools: [],
    })
  })

  it('a tool of the other service is refused on toolIds, named (BR-4)', () => {
    expect(fieldsOf(() => toolsFromBody('cleaning-services', { toolIds: ['push-mower'], otherTools: [] }))).toEqual({
      status: 400,
      fields: { toolIds: ['Push lawn mower is not a Cleaning Services tool'] },
    })
  })

  it('own tools cleaned before the limits: six entries that clean to one are accepted (BR-6)', () => {
    const r = toolsFromBody('cleaning-services', { toolIds: [], otherTools: ['  Pressure  washer ', 'pressure washer', 'Vacuum cleaner', '', ' ', 'PRESSURE WASHER'] })
    expect(r.otherTools).toEqual(['Pressure washer'])
  })

  it('more than five distinct, or one over 60 characters, is a 400 on otherTools', () => {
    expect(fieldsOf(() => toolsFromBody('home-yard-maintenance', { toolIds: [], otherTools: ['a', 'b', 'c', 'd', 'e', 'f'] }))).toEqual({ status: 400, fields: { otherTools: [TOO_MANY_OTHER_TOOLS] } })
    expect(fieldsOf(() => toolsFromBody('home-yard-maintenance', { toolIds: [], otherTools: ['x'.repeat(61)] }))).toEqual({ status: 400, fields: { otherTools: [OTHER_TOOL_TOO_LONG] } })
    expect(toolsFromBody('home-yard-maintenance', { toolIds: [], otherTools: ['x'.repeat(60)] }).otherTools).toEqual(['x'.repeat(60)])
  })

  it('an empty body clears (BR-7)', () => {
    expect(toolsFromBody('home-yard-maintenance', { toolIds: [], otherTools: [] })).toEqual({ categoryId: 'home-yard-maintenance', toolIds: [], otherTools: [] })
  })

  it('P2: any valid body gives the list-order subset and passes the response schema', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOL_SERVICES).chain((s) =>
          fc.tuple(fc.constant(s), fc.array(fc.constantFrom(...SERVICE_TOOLS[s].map((t) => t.id)), { maxLength: 30 }), fc.array(fc.stringMatching(/^[A-Za-z ]{0,20}$/), { maxLength: 5 })),
        ),
        ([s, ids, others]) => {
          const r = toolsFromBody(s, { toolIds: ids as never, otherTools: others })
          const list = SERVICE_TOOLS[s].map((t) => t.id) as string[]
          expect(r.toolIds).toEqual(list.filter((id) => (ids as string[]).includes(id)))
          expect(serviceToolsSchema.safeParse(r).success).toBe(true)
          // Replace semantics: saving the answer again stores the same thing.
          expect(toolsFromBody(s, { toolIds: r.toolIds, otherTools: r.otherTools })).toEqual(r)
        },
      ),
    )
  })
})

describe('the reads (BR-9, BR-14)', () => {
  it('a stale id (no longer on the list) is left out', () => {
    expect(toolsOf('cleaning-services', { toolIds: ['vacuum-cleaner', 'retired-tool'], otherTools: ['Hose'] })).toEqual({ categoryId: 'cleaning-services', toolIds: ['vacuum-cleaner'], otherTools: ['Hose'] })
  })

  it('a service without a list reads empty, whatever the row holds', () => {
    expect(toolsOrEmpty('support-worker', { toolIds: ['ladder'], otherTools: ['x'] })).toEqual({ toolIds: [], otherTools: [] })
    expect(toolsOrEmpty('home-yard-maintenance', { toolIds: ['ladder'], otherTools: [] })).toEqual({ toolIds: ['ladder'], otherTools: [] })
  })
})

describe('the admin tools filter (BR-12)', () => {
  const query = (q: Record<string, string>) => normaliseQuery(workerSearchQuerySchema.parse(q), new Date('2026-10-22T00:00:00Z'))

  it('groups the ids by service and echoes them', () => {
    const q = query({ tools: 'ladder,vacuum-cleaner,trailer' })
    expect(q.tools).toEqual(['ladder', 'trailer', 'vacuum-cleaner'])
    expect(q.toolsByService).toEqual({ 'home-yard-maintenance': ['ladder', 'trailer'], 'cleaning-services': ['vacuum-cleaner'] })
  })

  it('one EXISTS per service, ANDed, bound as parameters; inactive without tools', () => {
    const spec = FILTERS.find((f) => f.name === 'tools')!
    expect(spec.applies(query({}))).toBe(false)
    const sql = spec.sql(query({ tools: 'ladder,vacuum-cleaner' }))
    expect(sql.sql.match(/EXISTS/g)).toHaveLength(2)
    expect(sql.sql).toContain(' AND ')
    expect(sql.sql).toContain('"toolIds" @> ')
    expect(sql.values).toEqual(['cleaning-services', ['vacuum-cleaner'], 'home-yard-maintenance', ['ladder']])
    expect(whereOf(query({ tools: TOOL_IDS.join(',') })).sql.match(/EXISTS \(SELECT 1 FROM worker_services ws/g)).toHaveLength(2)
  })
})

describe('the admin tool search (TS-3, TS-4)', () => {
  const query = (q: Record<string, string>) => normaliseQuery(workerSearchQuerySchema.parse(q), new Date('2026-10-22T00:00:00Z'))
  const spec = () => FILTERS.find((f) => f.name === 'toolSearch')!

  it('scoped to the type of support when it has a list, else both; ignored when no word is kept', () => {
    expect(query({ toolSearch: 'gurney', typeOfSupport: 'home-yard-maintenance' }).toolSearch!.match.services).toEqual(['home-yard-maintenance'])
    expect(query({ toolSearch: 'gurney' }).toolSearch!.match.services).toEqual(['cleaning-services', 'home-yard-maintenance'])
    expect(query({ toolSearch: 'gurney', typeOfSupport: 'support-worker' }).toolSearch!.match.services).toEqual(['cleaning-services', 'home-yard-maintenance'])
    expect(query({ toolSearch: '& a' }).toolSearch).toBeUndefined()
    expect(spec().applies(query({}))).toBe(false)
  })

  it('one EXISTS on the searched rows: the listed ids by overlap, the own-tool patterns by LIKE, every value bound', () => {
    const sql = spec().sql(query({ toolSearch: 'pressure washer', typeOfSupport: 'home-yard-maintenance' }))
    expect(sql.sql).toContain('ws."toolIds" && ')
    expect(sql.sql).toContain('unnest(ws."otherTools") o')
    expect(sql.sql).toContain(String.raw`'\s+'`)
    expect(sql.values[0]).toEqual(['home-yard-maintenance'])
    expect(sql.values[1]).toEqual(['pressure-washer'])
    expect(sql.values).toContain('%pressure%')
    expect(sql.values).toContain('%gurney%')
    expect(sql.sql).not.toMatch(/gurney|pressure/)
  })

  it("LIKE's wildcards in a word are escaped", () => {
    const sql = spec().sql(query({ toolSearch: '50% off_road' }))
    expect(sql.values).toContain(String.raw`%50\%%`)
    expect(sql.values).toContain(String.raw`%off\_road%`)
  })

  it('echoed as given only when kept', () => {
    expect(appliedFiltersOf(query({ toolSearch: 'Gurney' })).toolSearch).toBe('Gurney')
    expect(appliedFiltersOf(query({}))).not.toHaveProperty('toolSearch')
  })
})

