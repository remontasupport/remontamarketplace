import { describe, expect, it } from 'vitest'
import { SERVICE_REQUEST_STATUSES } from '@remonta/schemas/data/serviceRequests'
import { isArchivable, isEditable } from './status'

describe('what the client or coordinator may do to a request', () => {
  it('edits Pending and Matching only', () => {
    expect(SERVICE_REQUEST_STATUSES.filter(isEditable)).toEqual(['PENDING', 'MATCHING'])
  })

  it('archives Completed and Cancelled only', () => {
    expect(SERVICE_REQUEST_STATUSES.filter(isArchivable)).toEqual(['COMPLETED', 'CANCELLED'])
  })
})
