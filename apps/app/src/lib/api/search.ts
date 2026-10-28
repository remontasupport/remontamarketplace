// The client and coordinator dashboard's worker search on apps/api (search-locations U2): GET /v1/client/workers
// with the signed-in user's token (call.ts). The query is sent in its canonical form, so the browser's private cache
// and the api's memo see one URL per set of filters.
import { clientWorkerQuerySchema, createClient, searchContract, serializeCanonical, type ClientWorkerQueryInput, type ClientWorkerResponse } from '@remonta/api-contract'
import { apiToken } from './admin'
import { callWithToken, type SentCall } from './call'
import type { ApiOutcome } from './outcome'
import type { TokenSource } from './token'

export interface SearchApi {
  searchWorkersForClient(query: ClientWorkerQueryInput, opts?: { signal?: AbortSignal }): Promise<ApiOutcome<ClientWorkerResponse>>
}

export function createSearchApi(deps: { baseUrl: string | undefined; tokenSource: TokenSource; fetch?: typeof globalThis.fetch }): SearchApi {
  const doFetch = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))
  let warned = false

  return {
    async searchWorkersForClient(query, opts) {
      if (!deps.baseUrl) {
        if (!warned) {
          warned = true
          console.error('[search-api] NEXT_PUBLIC_API_URL missing; the worker search is unavailable')
        }
        return { kind: 'unavailable' }
      }
      const parsed = clientWorkerQuerySchema.safeParse(query)
      if (!parsed.success) return { kind: 'failed', status: 400 }
      const canonical = Object.fromEntries(new URLSearchParams(serializeCanonical(parsed.data as Record<string, unknown>)))
      const client = createClient(searchContract, { baseUrl: deps.baseUrl, fetch: (i, init) => doFetch(i, { ...init, cache: 'default', credentials: 'omit' }) })
      return callWithToken<ClientWorkerResponse>(
        deps.tokenSource,
        (token) => client.searchWorkersForClient({ query: canonical as never }, { signal: opts?.signal, headers: { authorization: `Bearer ${token}` } }) as Promise<SentCall>,
        opts?.signal,
      )
    },
  }
}

export const searchApi: SearchApi = createSearchApi({ baseUrl: process.env.NEXT_PUBLIC_API_URL, tokenSource: apiToken })
