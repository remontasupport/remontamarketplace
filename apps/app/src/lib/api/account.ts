// Account Settings' client for apps/api (api-review U5d): the signed-in user's own email and password. The same shape
// as the worker client: a token from the page's token source, the bearer header, one retry on a 401 with a fresh
// token, and a typed outcome instead of a thrown error.
import { accountContract, createClient, type AccountEmailBody, type AccountPasswordBody } from '@remonta/api-contract'
import { apiToken } from './admin'
import { failure, type ApiOutcome } from './outcome'
import { Unauthenticated, type TokenSource } from './token'

export interface AccountApi {
  putEmail(body: AccountEmailBody): Promise<ApiOutcome<{ email: string }>>
  putPassword(body: AccountPasswordBody): Promise<ApiOutcome<{ passwordChangedAt: string }>>
}

export function createAccountApi(deps: { baseUrl: string | undefined; tokenSource: TokenSource; fetch?: typeof globalThis.fetch }): AccountApi {
  const doFetch = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))

  async function call<T>(name: 'putEmail' | 'putPassword', body: unknown): Promise<ApiOutcome<T>> {
    if (!deps.baseUrl) return { kind: 'unavailable' }
    const client = createClient(accountContract, { baseUrl: deps.baseUrl, fetch: (i, init) => doFetch(i, { ...init, cache: 'no-store', credentials: 'omit' }) })
    let retried = false
    for (;;) {
      let token: string
      try {
        token = await deps.tokenSource.getToken()
      } catch (err) {
        return err instanceof Unauthenticated ? { kind: 'unauthenticated' } : { kind: 'unavailable' }
      }
      let res: { ok: boolean; status: number; body: unknown; retryAfterSeconds?: number }
      try {
        res = await (client[name] as (i: unknown, o: unknown) => Promise<typeof res>)({ body }, { headers: { authorization: `Bearer ${token}` } })
      } catch {
        return { kind: 'unavailable' }
      }
      if (res.ok) return { kind: 'ok', body: res.body as T }
      if (res.status === 401 && !retried) {
        deps.tokenSource.invalidate()
        retried = true
        continue
      }
      return failure(res.status, res.body as never, res.retryAfterSeconds)
    }
  }

  return {
    putEmail: (body) => call('putEmail', body),
    putPassword: (body) => call('putPassword', body),
  }
}

export const accountApi: AccountApi = createAccountApi({ baseUrl: process.env.NEXT_PUBLIC_API_URL, tokenSource: apiToken })
