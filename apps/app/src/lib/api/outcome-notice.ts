// What an admin screen says when a call to apps/api did not succeed (moved out of the worker search, admin-clients U2
// A6): one wording for every admin screen, the subject named by the caller ("search", "list", ...).
import type { ApiOutcome } from './outcome'

export type FailedOutcome = Exclude<ApiOutcome<unknown>, { kind: 'ok' }>

/** The thing that failed, as the title names it: `{ name: 'search', plural: 'searches' }`. */
export interface NoticeSubject {
  name: string
  plural: string
}

export function noticeTitle(o: FailedOutcome, subject: NoticeSubject): string {
  switch (o.kind) {
    case 'forbidden':
      return `Your account cannot use the admin ${subject.name}`
    case 'rateLimited':
      return `Too many ${subject.plural}`
    case 'unavailable':
      return `The ${subject.name} is temporarily unavailable`
    case 'unauthenticated':
      return 'Please sign in again'
    default:
      return `The ${subject.name} could not be completed`
  }
}

export function noticeText(o: FailedOutcome): string {
  switch (o.kind) {
    case 'forbidden':
      return 'This happens while impersonating a user or after a role change. The last results are kept.'
    case 'rateLimited':
      return `Retrying automatically in ${o.retryAfterSeconds} seconds. The last results are kept.`
    case 'unavailable':
      return 'Please try again in a moment. The last results are kept.'
    case 'unauthenticated':
      return 'Your session has ended.'
    default: {
      const fields = o.fields ? Object.entries(o.fields).map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ') : ''
      return `${fields || 'Something went wrong'}${o.requestId ? ` (request ${o.requestId})` : ''}.`
    }
  }
}
