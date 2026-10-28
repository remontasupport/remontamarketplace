import { describe, expect, it } from 'vitest'
import { OFFERED_STATUSES, statusChoicesFor } from './statusChoices'

describe('the request card status choices', () => {
  it('offer the list filter the same statuses, Matched left out', () => {
    expect(OFFERED_STATUSES).toEqual(['PENDING', 'MATCHING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'])
  })

  it('leave Matched out, in database order', () => {
    expect(statusChoicesFor('PENDING')).toEqual(['PENDING', 'MATCHING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'])
  })

  it('keep Matched as the current value of a request already matched', () => {
    expect(statusChoicesFor('MATCHED')).toEqual(['PENDING', 'MATCHING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'])
  })
})
