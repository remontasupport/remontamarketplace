import { describe, expect, it } from 'vitest'
import { SERVICE_REQUEST_STATUSES } from '@remonta/schemas/data/serviceRequests'
import { isEditable } from './status'

describe('which requests the client or coordinator may edit', () => {
  it('is Pending and Matching only', () => {
    expect(SERVICE_REQUEST_STATUSES.filter(isEditable)).toEqual(['PENDING', 'MATCHING'])
  })
})
