// One call to apps/api with the signed-in user's token (search-locations U2): a token from the token source, the
// bearer header, one retry on a 401 with a fresh token, and a typed outcome instead of a thrown error. Shared by the
// account and the search clients; the admin and worker clients still carry their own copy of this loop.
import type { ErrorResponse } from '@remonta/api-contract'
import { failure, type ApiOutcome } from './outcome'
import { Unauthenticated, type TokenSource } from './token'

/** What a contract client's call resolves to, whatever the entry. */
export interface SentCall {
  ok: boolean
  status: number
  body: unknown
  retryAfterSeconds?: number
}

/** Sends the call with this token; `signal` aborts rethrow, any other throw is the api being unreachable. */
export async function callWithToken<T>(tokenSource: TokenSource, send: (token: string) => Promise<SentCall>, signal?: AbortSignal): Promise<ApiOutcome<T>> {
  let retried = false
  for (;;) {
    let token: string
    try {
      token = await tokenSource.getToken()
    } catch (err) {
      return err instanceof Unauthenticated ? { kind: 'unauthenticated' } : { kind: 'unavailable' }
    }
    let res: SentCall
    try {
      res = await send(token)
    } catch (err) {
      if (signal?.aborted) throw err
      return { kind: 'unavailable' }
    }
    if (res.ok) return { kind: 'ok', body: res.body as T }
    if (res.status === 401 && !retried) {
      tokenSource.invalidate() // once, with a fresh token
      retried = true
      continue
    }
    return failure(res.status, res.body as ErrorResponse | null, res.retryAfterSeconds)
  }
}
