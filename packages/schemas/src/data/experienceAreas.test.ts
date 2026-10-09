import { describe, expect, it } from 'vitest'
import { EXPERIENCE_AREA_PAIRS, EXPERIENCE_AREAS_BY_SLUG, EXPERIENCE_DOMAINS, experienceAreasOf, splitExperienceAreaPair } from './experienceAreas'

describe('the experience vocabulary', () => {
  it('five domains, each with a distinct code, slug and label, and distinct areas', () => {
    expect(EXPERIENCE_DOMAINS).toHaveLength(5)
    for (const key of ['domain', 'slug', 'label'] as const) expect(new Set(EXPERIENCE_DOMAINS.map((d) => d[key])).size).toBe(5)
    for (const d of EXPERIENCE_DOMAINS) {
      expect(d.areas.length).toBeGreaterThan(0)
      expect(new Set(d.areas).size).toBe(d.areas.length)
      for (const a of d.areas) expect(a, `${d.domain}: "${a}" has no comma or colon (the query carries pairs comma-separated)`).not.toMatch(/[,:]/)
    }
  })

  it('the pairs cover every area once and split back to their domain and area', () => {
    expect(EXPERIENCE_AREA_PAIRS).toHaveLength(EXPERIENCE_DOMAINS.reduce((n, d) => n + d.areas.length, 0))
    expect(new Set(EXPERIENCE_AREA_PAIRS).size).toBe(EXPERIENCE_AREA_PAIRS.length)
    for (const d of EXPERIENCE_DOMAINS) for (const a of d.areas) expect(splitExperienceAreaPair(`${d.domain}:${a}`)).toEqual({ domain: d.domain, area: a })
    expect(splitExperienceAreaPair('AGED_CARE:Autism')).toBeNull()
    expect(splitExperienceAreaPair('Dementia')).toBeNull()
    expect(splitExperienceAreaPair('NOPE:Dementia')).toBeNull()
  })

  it('lookups by code and by slug agree', () => {
    expect(experienceAreasOf('AGED_CARE')).toEqual(EXPERIENCE_AREAS_BY_SLUG['aged-care'])
    expect(experienceAreasOf('AGED_CARE')).toContain('Dementia')
    expect(experienceAreasOf('nope')).toEqual([])
  })
})
