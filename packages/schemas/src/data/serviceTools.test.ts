import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { inListOrder, isToolService, normaliseOtherTools, SERVICE_TOOLS, TOOL_IDS, TOOL_SERVICES, toolLabelOf, toolServiceOf, type ToolService } from './serviceTools'

const labels = (s: ToolService) => SERVICE_TOOLS[s].map((t) => t.label)

describe('the tool lists (E1, BR-1)', () => {
  it('two services, 14 cleaning tools and 15 yard tools, as approved (F1)', () => {
    expect(TOOL_SERVICES).toEqual(['cleaning-services', 'home-yard-maintenance'])
    expect(SERVICE_TOOLS['cleaning-services']).toHaveLength(14)
    expect(SERVICE_TOOLS['home-yard-maintenance']).toHaveLength(15)
  })

  it('P5: ids unique across all lists, kebab-case, and each maps back to its service and label', () => {
    expect(new Set(TOOL_IDS).size).toBe(TOOL_IDS.length)
    for (const s of TOOL_SERVICES) {
      expect(new Set(labels(s).map((l) => l.toLowerCase())).size).toBe(labels(s).length)
      for (const t of SERVICE_TOOLS[s]) {
        expect(t.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        expect(t.id, 'no comma: the admin query carries ids comma-separated').not.toMatch(/,/)
        expect(toolServiceOf(t.id)).toBe(s)
        expect(toolLabelOf(t.id)).toBe(t.label)
      }
    }
    expect(toolServiceOf('hammer')).toBeUndefined()
    expect(toolLabelOf('hammer')).toBeUndefined()
  })

  it('isToolService knows the two services only', () => {
    expect(isToolService('cleaning-services')).toBe(true)
    expect(isToolService('home-yard-maintenance')).toBe(true)
    expect(isToolService('support-worker')).toBe(false)
    expect(isToolService('toString')).toBe(false)
  })
})

describe('inListOrder (BR-5)', () => {
  it('examples', () => {
    expect(inListOrder('cleaning-services', ['mop-and-bucket', 'vacuum-cleaner'])).toEqual(['vacuum-cleaner', 'mop-and-bucket'])
    expect(inListOrder('cleaning-services', ['push-mower', 'steam-mop', 'steam-mop'])).toEqual(['steam-mop'])
    expect(inListOrder('home-yard-maintenance', [])).toEqual([])
  })

  it('P2: any order with repeats gives the subset in list order, each once', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TOOL_SERVICES), fc.array(fc.constantFrom(...TOOL_IDS), { maxLength: 40 }), (s, ids) => {
        const out = inListOrder(s, ids)
        const list = SERVICE_TOOLS[s].map((t) => t.id) as string[]
        expect(out).toEqual(list.filter((id) => ids.includes(id as never)))
        expect(inListOrder(s, out)).toEqual(out)
      }),
    )
  })
})

describe('normaliseOtherTools (BR-6)', () => {
  it('the logic model example', () => {
    expect(normaliseOtherTools(['  Pressure  washer ', 'pressure washer', 'Vacuum cleaner', ''], 'cleaning-services')).toEqual(['Pressure washer'])
  })

  it('a listed label of the OTHER service is kept (it is not on this list)', () => {
    expect(normaliseOtherTools(['Ladder'], 'cleaning-services')).toEqual(['Ladder'])
    expect(normaliseOtherTools(['ladder'], 'home-yard-maintenance')).toEqual([])
  })

  const messy = fc.array(
    fc.oneof(
      fc.string(),
      fc.constantFrom(...labels('cleaning-services'), ...labels('home-yard-maintenance')).map((l) => `  ${l.toUpperCase()} `),
      fc.constantFrom('Hose', 'hose', ' HOSE ', 'Grass  catcher', 'Grass catcher', 'Café polish', '', '   ', '\t'),
    ),
    { maxLength: 25 },
  )

  it('P1: idempotent; no empty, duplicate (ignoring case) or listed-label entry; each output is a cleaned input', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TOOL_SERVICES), messy, (s, raw) => {
        const out = normaliseOtherTools(raw, s)
        expect(normaliseOtherTools(out, s)).toEqual(out)
        const lower = out.map((v) => v.toLocaleLowerCase('en-AU'))
        expect(new Set(lower).size).toBe(out.length)
        const listed = new Set(labels(s).map((l) => l.toLocaleLowerCase('en-AU')))
        for (const v of out) {
          expect(v).not.toBe('')
          expect(v).toBe(v.trim())
          expect(v).not.toMatch(/\s{2}/)
          expect(listed.has(v.toLocaleLowerCase('en-AU'))).toBe(false)
          expect(raw.some((r) => r.trim().replace(/\s+/g, ' ') === v)).toBe(true)
        }
      }),
    )
  })
})
