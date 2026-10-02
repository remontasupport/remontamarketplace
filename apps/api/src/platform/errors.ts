// Pipeline step 11: every failure leaves as the contract's one error shape, with a
// generic message and the request ID. Causes go to the log, never the response.
import { ERROR_CODES, type ErrorResponse, type ErrorStatus } from '@remonta/api-contract'

const GENERIC: Record<ErrorStatus, string> = {
  400: 'The request is not valid.',
  401: 'Sign in to continue.',
  403: 'You cannot do that.',
  404: 'Not found.',
  409: 'That conflicts with the current state.',
  413: 'The request is too large.',
  415: 'That content type is not accepted.',
  429: 'Too many requests. Try again later.',
  500: 'Something went wrong.',
  503: 'The service is temporarily unavailable. Try again shortly.',
}

export class ApiError extends Error {
  constructor(
    readonly status: ErrorStatus,
    /** Logged, never returned. */
    readonly cause_: string = GENERIC[status],
    readonly fields?: Record<string, string[]>,
    readonly headers?: Record<string, string>,
  ) {
    super(cause_)
    this.name = 'ApiError'
  }
}

/**
 * Thrown by an adapter or an outbox handler when retrying cannot help: a provider
 * refused the request (an unverified sender, an address it will not deliver to), or
 * the input is malformed. The outbox sends such an event straight to DEAD instead
 * of retrying; a synchronous caller turns it into a 500 the client does not retry.
 */
export class PermanentFailure extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermanentFailure'
  }
}

export function errorBody(status: ErrorStatus, requestId: string, fields?: Record<string, string[]>): ErrorResponse {
  return { error: { code: ERROR_CODES[status], message: GENERIC[status], requestId, ...(fields ? { fields } : {}) } }
}

/** Maps anything thrown to a status we are willing to return. */
export function statusOf(err: unknown): ErrorStatus {
  if (err instanceof ApiError) return err.status
  if (isOverloadedDatabase(err)) return 503
  const code = (err as { statusCode?: unknown })?.statusCode
  if (typeof code === 'number' && code in ERROR_CODES && code !== 500) return code as ErrorStatus
  return 500
}

/** The pool had no free connection in time (P2024), or the database is unreachable. */
export function isOverloadedDatabase(err: unknown): boolean {
  const e = err as { code?: unknown; name?: unknown } | null
  return e?.code === 'P2024' || e?.name === 'PrismaClientInitializationError'
}
