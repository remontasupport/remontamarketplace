// The admin search's nurse type (2026-10-23): the filter's values are the nursing answer's, and the query takes only them.
import { describe, expect, it } from 'vitest'
import { NURSING_TYPE_FILTERS, NURSING_TYPES, workerSearchQuerySchema } from '../src'

describe('nursingType on the admin search', () => {
  it('offers exactly the values the nursing answer stores', () => {
    expect([...NURSING_TYPE_FILTERS]).toEqual([...NURSING_TYPES])
  })

  it('registered or enrolled; absent means no filter', () => {
    expect(workerSearchQuerySchema.parse({}).nursingType).toBeUndefined()
    expect(workerSearchQuerySchema.parse({ nursingType: 'enrolled' }).nursingType).toBe('enrolled')
    expect(workerSearchQuerySchema.safeParse({ nursingType: 'student' }).success).toBe(false)
  })
})
