import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { inListOrder, isToolService, nameMatches, normaliseOtherTools, normaliseToolText, ownToolMatches, SERVICE_TOOLS, singularOf, TOOL_IDS, TOOL_SERVICES, TOOL_SYNONYMS, toolLabelOf, toolSearchOf, toolSearchWords, toolServiceOf, type ToolService } from './serviceTools'

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

describe('the tool search (tool-search addendum TS-1..TS-3)', () => {
  it('TS-1: every listed tool has a synonym entry, none empty or repeated, and no synonym equals its own label', () => {
    expect(Object.keys(TOOL_SYNONYMS).sort()).toEqual([...TOOL_IDS].sort())
    for (const id of TOOL_IDS) {
      const syn = TOOL_SYNONYMS[id]
      expect(syn.every((n) => n.trim().length > 1)).toBe(true)
      expect(new Set(syn.map(normaliseToolText)).size).toBe(syn.length)
      expect(syn.map(normaliseToolText)).not.toContain(normaliseToolText(toolLabelOf(id)!))
    }
  })

  it('TS-2: normalising, plurals, short words, the word cap', () => {
    expect(normaliseToolText('  Ride-On / Mower.  ')).toBe('ride on mower')
    expect(['brushes', 'mowers', 'gloves', 'boxes', 'glass', 'gas', 'tools'].map(singularOf)).toEqual(['brush', 'mower', 'glove', 'box', 'glass', 'gas', 'tool'])
    expect(toolSearchWords('A pressure  washer & hose')).toEqual(['pressure', 'washer', 'hose'])
    expect(toolSearchWords('one two three four five six')).toHaveLength(5)
    expect(toolSearchWords('a & b')).toEqual([])
    expect(toolSearchOf('  & ')).toBeNull()
  })

  it('TS-3 examples: anywhere in the text, synonyms, all words within one name', () => {
    const ids = (t: string, s?: ToolService[]) => toolSearchOf(t, s)!.listedIds
    expect(ids('saw')).toEqual(['chainsaw'])
    expect(ids('gurney')).toEqual(['pressure-washer'])
    expect(ids('pressure washer')).toEqual(['pressure-washer'])
    expect(ids('washer pressure')).toEqual(['pressure-washer'])
    expect(ids('mowers')).toEqual(['push-mower', 'ride-on-mower'])
    expect(ids('ride-on')).toEqual(['ride-on-mower'])
    expect(ids('vac')).toEqual(['vacuum-cleaner', 'leaf-blower'])
    expect(ids('pressure hose')).toEqual([])
    expect(ids('mower', ['cleaning-services'])).toEqual([])
    expect(toolSearchOf('gurney')!.otherNames).toEqual(['pressure cleaner', 'high pressure cleaner', 'gurney', 'water blaster'])
  })

  it("TS-3 own tools: the query's words, or a whole name of a matched listed tool", () => {
    const s = toolSearchOf('pressure washer')!
    expect(ownToolMatches('Karcher pressure washer', s)).toBe(true)
    expect(ownToolMatches('Gurney 2000', s)).toBe(true)
    expect(ownToolMatches('Pressure hose', s)).toBe(false)
    expect(ownToolMatches('Window washer', s)).toBe(false)
    expect(ownToolMatches('Garden hose', toolSearchOf('hoses')!)).toBe(true)
  })

  const text = fc.oneof(
    fc.string({ maxLength: 40 }),
    fc.constantFrom(...TOOL_IDS.map((id) => toolLabelOf(id)!), ...Object.values(TOOL_SYNONYMS).flat()).map((n) => n.toUpperCase()),
    fc.constantFrom('saw', 'mowers', 'pressure washer', 'brush-cutter', 'gutters', 'hose', 'GURNEY', 'x'),
  )

  it('TS-6: normalising is idempotent, and the singular of a word is found wherever the word is', () => {
    fc.assert(
      fc.property(text, (t) => {
        expect(normaliseToolText(normaliseToolText(t))).toBe(normaliseToolText(t))
        for (const w of normaliseToolText(t).split(' ').filter((x) => x.length > 1)) expect(w.includes(singularOf(w))).toBe(true)
      }),
    )
  })

  it('TS-6: a listed tool is matched exactly when one of its names holds every query word', () => {
    fc.assert(
      fc.property(text, fc.subarray([...TOOL_SERVICES], { minLength: 1 }), (t, services) => {
        const r = toolSearchOf(t, services)
        if (!r) return
        for (const s of TOOL_SERVICES) {
          for (const tool of SERVICE_TOOLS[s]) {
            const expected = services.includes(s) && [tool.label, ...TOOL_SYNONYMS[tool.id]].some((n) => nameMatches(n, r.words))
            expect(r.listedIds.includes(tool.id), `${t} / ${tool.id}`).toBe(expected)
          }
        }
        // A matched tool's own label, typed as an own tool, is found.
        for (const id of r.listedIds) expect(ownToolMatches(toolLabelOf(id)!, r)).toBe(true)
      }),
    )
  })
})

