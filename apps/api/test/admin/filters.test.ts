// filters.ts (U2, rules R3; property G4): one parameterised fragment per active filter,
// ANDed with the active condition, nothing dropped or overwritten.
import { workerSearchQuerySchema } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { activeFilters, FILTERS, whereOf } from '../../src/modules/admin/application/filters'
import { normaliseQuery } from '../../src/modules/admin/domain/search-query'
import { searchStatement, unplacedCountStatement } from '../../src/modules/admin/persistence/worker-search-sql'

const NOW = new Date('2026-10-08T00:00:00Z')
const q = (raw: Record<string, unknown>) => normaliseQuery(workerSearchQuerySchema.parse(raw), NOW)
/** The text of a Prisma.Sql with its parameters shown inline, for assertions only. */
const text = (s: { strings: readonly string[]; values: readonly unknown[] }) => s.strings.map((part, i) => part + (i < s.values.length ? `<${JSON.stringify(s.values[i])}>` : '')).join('')

describe('each filter contributes its fragment with bound parameters', () => {
  it('search: one word, and the two-word name forms both ways (R3.1), wildcards escaped', () => {
    const one = text(whereOf(q({ search: 'ann' })))
    expect(one).toContain('p."firstName" ILIKE <"%ann%">')
    expect(one).toContain('p.mobile LIKE <"%ann%">')
    expect(one).not.toContain('AND p."lastName"')
    const two = text(whereOf(q({ search: 'Test Terson' })))
    expect(two).toContain('(p."firstName" ILIKE <"%Test%"> AND p."lastName" ILIKE <"%Terson%">)')
    expect(two).toContain('(p."lastName" ILIKE <"%Test%"> AND p."firstName" ILIKE <"%Terson%">)')
    expect(text(whereOf(q({ search: '50%' })))).toContain('<"%50\\\\%%">')
  })

  it('type of support by category id; therapeutic sub-categories any-of (R3.2, R3.3)', () => {
    expect(text(whereOf(q({ typeOfSupport: 'support-worker' })))).toContain('ws."categoryId" = <"support-worker">')
    expect(text(whereOf(q({ therapeuticSubcategories: 'b,a' })))).toContain('ws."subcategoryIds" && <["a","b"]>::text[]')
  })

  it('gender, vehicle, worker type as the JSON path (R3.4, R3.5, R3.7)', () => {
    expect(text(whereOf(q({ gender: 'Female' })))).toContain('p.gender = <"Female">')
    expect(text(whereOf(q({ hasVehicle: 'Yes' })))).toContain('p."hasVehicle" = <"Yes">')
    expect(text(whereOf(q({ workerType: 'Contractor' })))).toContain(`p.abn #>> '{workerEngagementType,type}' = <"abn">`)
  })

  it('age: the text window with the integer fallback (R3.6)', () => {
    const s = text(whereOf(q({ age: '31-45' })))
    expect(s).toContain('p."dateOfBirth" >= <"1981-01-01">')
    expect(s).toContain('p."dateOfBirth" <= <"1995-12-31">')
    expect(s).toContain('p.age BETWEEN <31> AND <45>')
  })

  it('languages: the additional-info list first, else the profile list (R3.8); experience: all of (R3.9)', () => {
    const l = text(whereOf(q({ languages: 'mandarin' })))
    expect(l).toContain('wai.languages && <["Mandarin"]>::text[]')
    expect(l).toContain('p.languages && <["Mandarin"]>::text[]')
    const e = text(whereOf(q({ experienceWith: 'AGED_CARE,DISABILITY' })))
    expect(e).toContain('we.domain = <"AGED_CARE">::"CareDomain"')
    expect(e).toContain('we.domain = <"DISABILITY">::"CareDomain"')
    expect(e.split('EXISTS (SELECT 1 FROM worker_experience').length - 1).toBe(2)
  })

  it('experience areas: per domain, any of its areas on that domain row, domains ANDed (R3.11)', () => {
    const a = text(whereOf(q({ experienceWith: 'AGED_CARE,DISABILITY', experienceAreas: 'DISABILITY:Autism,AGED_CARE:Stroke Recovery,AGED_CARE:Dementia' })))
    expect(a).toContain('we.domain = <"AGED_CARE">::"CareDomain" AND we."specificAreas" && <["Dementia","Stroke Recovery"]>::text[]')
    expect(a).toContain('we.domain = <"DISABILITY">::"CareDomain" AND we."specificAreas" && <["Autism"]>::text[]')
    // The R3.9 condition for each domain (2) plus one area condition per domain with areas (2).
    expect(a.split('EXISTS (SELECT 1 FROM worker_experience').length - 1).toBe(4)
    const one = text(whereOf(q({ experienceWith: 'AGED_CARE,DISABILITY', experienceAreas: 'AGED_CARE:Dementia' })))
    expect(one.split('"specificAreas" &&').length - 1).toBe(1)
  })

  it('always the active condition, alone when nothing else applies (R3.10)', () => {
    expect(text(whereOf(q({})))).toBe(`u.status = 'ACTIVE'`)
  })
})

describe('G4: composition', () => {
  const arb = fc.record(
    {
      search: fc.constantFrom('a', 'b c'),
      typeOfSupport: fc.constant('support-worker'),
      therapeuticSubcategories: fc.constant('x'),
      gender: fc.constantFrom('Male', 'Female'),
      hasVehicle: fc.constant('Yes'),
      workerType: fc.constant('Employee'),
      age: fc.constant('20-30'),
      languages: fc.constant('English'),
      experienceWith: fc.constantFrom('AGED_CARE', 'AGED_CARE,MENTAL_HEALTH'),
      experienceAreas: fc.constantFrom('AGED_CARE:Dementia', 'AGED_CARE:Dementia,AGED_CARE:Stroke Recovery'),
    },
    { requiredKeys: [] },
  )
  it('one fragment per active filter, ANDed, every value bound, none dropped', () => {
    fc.assert(
      fc.property(arb, (raw0) => {
        // An area needs its domain searched (R3.11); every experienceWith option above carries AGED_CARE.
        const raw = raw0.experienceAreas && !raw0.experienceWith ? { ...raw0, experienceWith: 'AGED_CARE' } : raw0
        const query = q(raw)
        const names = activeFilters(query)
        expect(names.sort()).toEqual(Object.keys(raw).sort())
        // The composition is exactly: the active condition, then each active spec's
        // fragment in parentheses, joined by AND -- rebuilt here from the specs themselves.
        const expected = [`u.status = 'ACTIVE'`, ...FILTERS.filter((f) => f.applies(query)).map((f) => `(${text(f.sql(query))})`)].join(' AND ')
        expect(text(whereOf(query))).toBe(expected)
        // Every user value travels as a bound parameter (as itself, inside a LIKE pattern, or in an array).
        const bound = whereOf(query).values.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
        for (const [k, v] of Object.entries(raw)) {
          if (k === 'workerType' || k === 'age') continue // mapped (JSON code; the date window), covered above
          // An area pair is bound as its domain and, inside an array, its area.
          for (const piece of v.split(',').flatMap((p) => (k === 'experienceAreas' ? p.split(':') : [p]))) expect(bound.some((b) => b.includes(piece)), `${k}=${piece} bound`).toBe(true)
        }
      }),
      { numRuns: 120 },
    )
  })

  it('every filter spec has a distinct name', () => {
    expect(new Set(FILTERS.map((f) => f.name)).size).toBe(FILTERS.length)
  })
})

describe('the statement', () => {
  it('orders by distance then id with a suburb, uses ST_DWithin with metres for a radius, and counts in the same statement (R4, R5)', () => {
    const s = text(searchStatement(q({ localityId: '42', withinKm: '10' }), 42))
    expect(s).toContain('ST_DWithin(wl.point, (SELECT point FROM au_localities WHERE id = <42>), <10000>)')
    expect(s).toContain('ST_Distance(wl.point, (SELECT point FROM au_localities WHERE id = <42>)) AS distance_m')
    expect(s).toContain('COUNT(*) OVER()::int AS total')
    expect(s).toMatch(/ORDER BY distance_m ASC, p\.id ASC/)
    expect(s).toContain('LIMIT <20> OFFSET <0>')
  })
  it('any distance: placed workers only, no radius; no suburb: no location term; unmapped: wl.id IS NULL', () => {
    expect(text(searchStatement(q({ localityId: '42' }), 42))).toMatch(/AND wl\.point IS NOT NULL\s+ORDER BY/)
    const none = text(searchStatement(q({ gender: 'Male' }), undefined))
    expect(none).not.toContain('ST_DWithin')
    expect(none).toContain('NULL::double precision AS distance_m')
    expect(text(searchStatement(q({ unplaced: 'true' }), undefined))).toContain('AND wl.id IS NULL')
    expect(text(unplacedCountStatement(q({ gender: 'Male' })))).toContain('AND wl.id IS NULL')
  })
  it('city and state sort from the HOME locality with the legacy fallback (R5.1)', () => {
    expect(text(searchStatement(q({ sortBy: 'city', sortOrder: 'asc' }), undefined))).toMatch(/ORDER BY COALESCE\(al\.suburb, p\.city\) ASC, p\.id ASC/)
    expect(text(searchStatement(q({ sortBy: 'state' }), undefined))).toMatch(/ORDER BY COALESCE\(al\.state, p\.state\) DESC/)
  })
})
