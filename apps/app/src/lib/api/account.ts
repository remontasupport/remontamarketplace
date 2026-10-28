// Account Settings' client for apps/api (api-review U5d): the signed-in user's own email and password, through the
// shared token-and-retry call (call.ts).
import { accountContract, createClient, type AccountEmailBody, type AccountPasswordBody } from '@remonta/api-contract'
import { apiToken } from './admin'
import { callWithToken, type SentCall } from './call'
import type { ApiOutcome } from './outcome'
import type { TokenSource } from './token'

export interface AccountApi {
  putEmail(body: AccountEmailBody): Promise<ApiOutcome<{ email: string }>>
  putPassword(body: AccountPasswordBody): Promise<ApiOutcome<{ passwordChangedAt: string }>>
}

export function createAccountApi(deps: { baseUrl: string | undefined; tokenSource: TokenSource; fetch?: typeof globalThis.fetch }): AccountApi {
  const doFetch = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))

  async function call<T>(name: 'putEmail' | 'putPassword', body: unknown): Promise<ApiOutcome<T>> {
    if (!deps.baseUrl) return { kind: 'unavailable' }
    const client = createClient(accountContract, { baseUrl: deps.baseUrl, fetch: (i, init) => doFetch(i, { ...init, cache: 'no-store', credentials: 'omit' }) })
    return callWithToken<T>(deps.tokenSource, (token) => (client[name] as (i: unknown, o: unknown) => Promise<SentCall>)({ body }, { headers: { authorization: `Bearer ${token}` } }))
  }

  return {
    putEmail: (body) => call('putEmail', body),
    putPassword: (body) => call('putPassword', body),
  }
}

export const accountApi: AccountApi = createAccountApi({ baseUrl: process.env.NEXT_PUBLIC_API_URL, tokenSource: apiToken })
