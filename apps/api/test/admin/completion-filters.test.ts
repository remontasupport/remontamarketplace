// admin-completion-filters U1: the four completion filters (FR-1, FR-2) and the row's `completion` on request only
// (FR-3); the database-gated half is completion-filters.int.test.ts.
import { COMPLETION_FLAGS, workerRowSchema, workerSearchQuerySchema } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { activeFilters, whereOf } from '../../src/modules/admin/application/filters'
import { shapeRow } from '../../src/modules/admin/application/search-workers'
import { appliedFiltersOf, normaliseQuery } from '../../src/modules/admin/domain/search-query'
import type { RawWorkerRow } from '../../src/modules/admin/persistence/worker-search-sql'
import { parseStoredFlags } from '../../src/modules/worker/domain/persist-completion'

const NOW = new Date('2026-11-09T00:00:00Z')
const q = (raw: Record<string, unknown>) => normaliseQuery(workerSearchQuerySchema.parse(raw), NOW)
const text = (s: { strings: readonly string[]; values: readonly unknown[] }) => s.strings.map((part, i) => part + (i < s.values.length ? `<${JSON.stringify(s.values[i])}>` : '')).join('')

const filterArb = fc.constantFrom(undefined, 'complete' as const, 'incomplete' as const)
const queryArb = fc.record({ accountDetails: filterArb, compliance: filterArb, trainings: filterArb, services: filterArb }).map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)))

describe('the completion filters (FR-1, FR-2)', () => {
  it('complete binds the key against JSON true; incomplete is IS DISTINCT FROM (missing key and NULL included)', () => {
    expect(text(whereOf(q({ compliance: 'complete' })))).toBe(`u.status = 'ACTIVE' AND (p."setupProgress" -> <"compliance">::text = 'true'::jsonb)`)
    expect(text(whereOf(q({ trainings: 'incomplete' })))).toBe(`u.status = 'ACTIVE' AND (p."setupProgress" -> <"trainings">::text IS DISTINCT FROM 'true'::jsonb)`)
    expect(text(whereOf(q({})))).not.toContain('setupProgress')
  })

  it('P1: one fragment per given flag, ANDed, one registry entry; echoed in appliedFilters exactly when given', () => {
    fc.assert(
      fc.property(queryArb, fc.boolean(), (given, withCompletion) => {
        const parsed = q({ ...given, withCompletion: String(withCompletion) })
        const sql = text(whereOf(parsed))
        for (const flag of COMPLETION_FLAGS) expect(sql.includes(`<"${flag}">`)).toBe(flag in given)
        expect(activeFilters(parsed)).toEqual(Object.keys(given).length ? ['completion'] : [])
        const applied = appliedFiltersOf(parsed)
        for (const flag of COMPLETION_FLAGS) expect(applied[flag]).toBe(given[flag])
        expect(applied).not.toHaveProperty('withCompletion')
      }),
    )
  })

  it('refuses any other value', () => {
    expect(workerSearchQuerySchema.safeParse({ compliance: 'yes' }).success).toBe(false)
    expect(workerSearchQuerySchema.safeParse({ services: 'true' }).success).toBe(false)
  })
})

const raw = (patch: Partial<RawWorkerRow> = {}): RawWorkerRow => ({
  id: 'w1', userId: 'u1', firstName: 'Ann', lastName: 'Lee', mobile: '0400000000', gender: 'Female', age: 40, dateOfBirth: null,
  languages: [], photos: null, experience: null, introduction: null,
  createdAt: new Date('2026-01-01T00:00:00Z'), updatedAt: new Date('2026-01-02T00:00:00Z'), email: 'ann@example.test',
  userStatus: 'ACTIVE', infoLanguages: null, serviceNames: null, serviceIds: null, homeSuburb: null, homeState: null,
  homePostcode: null, precision: null, travelRadiusKm: null, distance_m: null, total: 1, ...patch,
})

/** Today's row schema (main 2f8dcf1): strict, no `completion`. */
const todaysRow = workerRowSchema.omit({ completion: true }).strict()

/** Any JSON a setupProgress column may hold: the four keys with any value or missing, or not an object at all. */
const storedArb = fc.oneof(
  fc.constant(null),
  fc.jsonValue(),
  fc.dictionary(fc.constantFrom(...COMPLETION_FLAGS, 'other'), fc.oneof(fc.boolean(), fc.constant('true'), fc.constant(1), fc.constant(null))),
)

describe('the row (FR-3)', () => {
  it('P2: `completion` iff asked, each flag true exactly when the stored value is JSON true; without it the row is today\'s', () => {
    fc.assert(
      fc.property(fc.boolean(), storedArb, (ask, setupProgress) => {
        const row = shapeRow(raw({ setupProgress }), NOW, false, { completion: ask })
        expect(workerRowSchema.safeParse(row).success).toBe(true)
        if (ask) {
          const o = (setupProgress && typeof setupProgress === 'object' ? setupProgress : {}) as Record<string, unknown>
          for (const flag of COMPLETION_FLAGS) expect(row.completion![flag]).toBe(o[flag] === true)
          expect(row.completion).toEqual(parseStoredFlags(setupProgress))
        } else {
          expect(row).not.toHaveProperty('completion')
          expect(todaysRow.safeParse(row).success).toBe(true)
        }
      }),
    )
  })
})
