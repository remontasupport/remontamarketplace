// The admin search's nurse type (2026-10-23): the fragment on the nursing-services row, the 400 without that type of
// support, and the echo. The database-gated half is nursing-type.int.test.ts.
import { workerSearchQuerySchema } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { activeFilters, whereOf } from '../../src/modules/admin/application/filters'
import { appliedFiltersOf, normaliseQuery } from '../../src/modules/admin/domain/search-query'
import { ApiError } from '../../src/platform/errors'

const NOW = new Date('2026-10-23T00:00:00Z')
const q = (raw: Record<string, unknown>) => normaliseQuery(workerSearchQuerySchema.parse(raw), NOW)
const text = (s: { strings: readonly string[]; values: readonly unknown[] }) => s.strings.map((part, i) => part + (i < s.values.length ? `<${JSON.stringify(s.values[i])}>` : '')).join('')

describe('nursingType', () => {
  it('binds the answer on the worker’s nursing-services row', () => {
    const s = text(whereOf(q({ typeOfSupport: 'nursing-services', nursingType: 'registered' })))
    expect(s).toContain(`ws."categoryId" = 'nursing-services' AND ws.metadata->>'nursingType' = <"registered">`)
    expect(activeFilters(q({ typeOfSupport: 'nursing-services', nursingType: 'enrolled' }))).toEqual(['typeOfSupport', 'nursingType'])
    expect(text(whereOf(q({ typeOfSupport: 'nursing-services' })))).not.toContain('nursingType')
  })

  it('400 on nursingType without Nursing Services as the type of support, for any other type', () => {
    fc.assert(
      fc.property(fc.option(fc.constantFrom('support-worker', 'therapeutic-supports', 'cleaning-services'), { nil: undefined }), fc.constantFrom('registered', 'enrolled'), (typeOfSupport, nursingType) => {
        let err: unknown
        try {
          q({ ...(typeOfSupport ? { typeOfSupport } : {}), nursingType })
        } catch (e) {
          err = e
        }
        expect(err instanceof ApiError && err.status === 400).toBe(true)
      }),
    )
  })

  it('echoed in appliedFilters exactly when given', () => {
    expect(appliedFiltersOf(q({ typeOfSupport: 'nursing-services', nursingType: 'enrolled' })).nursingType).toBe('enrolled')
    expect(appliedFiltersOf(q({ typeOfSupport: 'nursing-services' }))).not.toHaveProperty('nursingType')
  })
})
