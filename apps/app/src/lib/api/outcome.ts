// The typed outcome of a call to apps/api (U1 C13, U2 H1): one mapping from a status and
// an error body to what a screen shows, shared by the admin and the worker clients.
import type { ErrorResponse } from '@remonta/api-contract'

export type ApiOutcome<T> =
  | { kind: 'ok'; body: T }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' }
  | { kind: 'rateLimited'; retryAfterSeconds: number }
  | { kind: 'unavailable' }
  | { kind: 'failed'; status: number; requestId?: string; fields?: Record<string, string[]> }

export function failure<T>(status: number, body: ErrorResponse | null, retryAfterSeconds?: number): ApiOutcome<T> {
  if (status === 401) return { kind: 'unauthenticated' }
  if (status === 403) return { kind: 'forbidden' }
  if (status === 429) return { kind: 'rateLimited', retryAfterSeconds: retryAfterSeconds ?? 5 }
  if (status === 503) return { kind: 'unavailable' }
  return { kind: 'failed', status, requestId: body?.error.requestId, fields: body?.error.fields }
}
