// The worker search's notices, word for word as before the move (admin-clients U2 A6), and the subject for other screens.
import { describe, expect, it } from 'vitest'
import { noticeText, noticeTitle } from './outcome-notice'

const SEARCH = { name: 'search', plural: 'searches' }

describe('outcome notices', () => {
  it("keep the worker search's titles", () => {
    expect(noticeTitle({ kind: 'forbidden' }, SEARCH)).toBe('Your account cannot use the admin search')
    expect(noticeTitle({ kind: 'rateLimited', retryAfterSeconds: 5 }, SEARCH)).toBe('Too many searches')
    expect(noticeTitle({ kind: 'unavailable' }, SEARCH)).toBe('The search is temporarily unavailable')
    expect(noticeTitle({ kind: 'unauthenticated' }, SEARCH)).toBe('Please sign in again')
    expect(noticeTitle({ kind: 'failed', status: 500 }, SEARCH)).toBe('The search could not be completed')
  })

  it('name the subject a screen gives', () => {
    expect(noticeTitle({ kind: 'unavailable' }, { name: 'list', plural: 'requests' })).toBe('The list is temporarily unavailable')
    expect(noticeTitle({ kind: 'rateLimited', retryAfterSeconds: 5 }, { name: 'list', plural: 'requests' })).toBe('Too many requests')
  })

  it('explain each outcome, with the fields and the request id of a failure', () => {
    expect(noticeText({ kind: 'rateLimited', retryAfterSeconds: 7 })).toBe('Retrying automatically in 7 seconds. The last results are kept.')
    expect(noticeText({ kind: 'failed', status: 400, requestId: 'r1', fields: { role: ['Invalid'] } })).toBe('role: Invalid (request r1).')
    expect(noticeText({ kind: 'failed', status: 500 })).toBe('Something went wrong.')
  })
})
