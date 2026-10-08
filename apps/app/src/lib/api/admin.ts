// The admin screens' client for apps/api (U1 C13 + U2: L5, R5.6, R11.2, R11.5).
// Every call: a token from the token source, the bearer header, one retry on a
// 401 with a fresh token, and a typed outcome instead of a thrown error. URLs are
// canonical (the contract's own serialisation), so the browser's private cache
// and the api's memo see one URL per set of filters whatever order they were
// chosen in. `cache: 'reload'` bypasses both: the browser adds `Cache-Control:
// no-cache` itself for that mode, which is also what the api's memo looks for,
// so no extra request header (and no CORS allow-list change) is needed.
import {
  adminContract,
  createClient,
  serializeCanonical,
  type ErrorResponse,
  type SuspendedListQuery,
  type SuspendedListResponse,
  type UserListResponse,
  type UserSearchQuery,
  type WorkerSearchQuery,
  type WorkerSearchResponse,
} from '@remonta/api-contract'
import { createTokenSource, Unauthenticated, type TokenSource } from './token'

export type ApiOutcome<T> =
  | { kind: 'ok'; body: T }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' }
  | { kind: 'rateLimited'; retryAfterSeconds: number }
  | { kind: 'unavailable' }
  | { kind: 'failed'; status: number; requestId?: string; fields?: Record<string, string[]> }

export interface CallOptions {
  /** `reload` skips the browser cache and the api's memo (the refresh button, after an admin action). */
  cache?: 'default' | 'reload'
  signal?: AbortSignal
}

export interface AdminApi {
  searchWorkers(query: WorkerSearchQuery, opts?: CallOptions): Promise<ApiOutcome<WorkerSearchResponse>>
  listUsers(query: UserSearchQuery, opts?: CallOptions): Promise<ApiOutcome<UserListResponse>>
  listSuspendedWorkers(query: SuspendedListQuery, opts?: CallOptions): Promise<ApiOutcome<SuspendedListResponse>>
  /** The canonical query string of a search (R8.5): what the URL bar and the cache key carry. */
  canonicalSearch(query: WorkerSearchQuery): string
}

export interface AdminApiDeps {
  baseUrl: string | undefined
  tokenSource: TokenSource
  fetch?: typeof globalThis.fetch
}

type EntryName = 'searchWorkers' | 'listUsers' | 'listSuspendedWorkers'

export function createAdminApi(deps: AdminApiDeps): AdminApi {
  const doFetch = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))
  let warned = false

  function canonical(name: EntryName, query: unknown): Record<string, string> | { fields: Record<string, string[]> } {
    const schema = adminContract.entries[name].query
    const parsed = schema.safeParse(query ?? {})
    if (!parsed.success) {
      const fields: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join('.') || '_'
        ;(fields[key] ??= []).push(issue.message)
      }
      return { fields }
    }
    return Object.fromEntries(new URLSearchParams(serializeCanonical(parsed.data as Record<string, unknown>)))
  }

  async function call<T>(name: EntryName, query: unknown, opts?: CallOptions): Promise<ApiOutcome<T>> {
    if (!deps.baseUrl) {
      if (!warned) {
        warned = true
        console.error('[admin-api] NEXT_PUBLIC_API_URL missing; the admin lists are unavailable')
      }
      return { kind: 'unavailable' }
    }
    const q = canonical(name, query)
    if ('fields' in q && typeof q.fields === 'object') return { kind: 'failed', status: 400, fields: q.fields as Record<string, string[]> }
    const reload = opts?.cache === 'reload'
    const client = createClient(adminContract, {
      baseUrl: deps.baseUrl,
      fetch: (input, init) => doFetch(input, { ...init, cache: reload ? 'reload' : 'default', credentials: 'omit' }),
    })
    let retried = false
    for (;;) {
      let token: string
      try {
        token = await deps.tokenSource.getToken()
      } catch (err) {
        return err instanceof Unauthenticated ? { kind: 'unauthenticated' } : { kind: 'unavailable' }
      }
      let res: Awaited<ReturnType<(typeof client)[EntryName]>>
      try {
        res = await client[name]({ query: q } as never, { signal: opts?.signal, headers: { authorization: `Bearer ${token}` } })
      } catch (err) {
        if (opts?.signal?.aborted) throw err
        return { kind: 'unavailable' }
      }
      if (res.ok) return { kind: 'ok', body: res.body as T }
      if (res.status === 401 && !retried) {
        deps.tokenSource.invalidate() // R5.6: once, with a fresh token
        retried = true
        continue
      }
      return failure(res.status, res.body, res.retryAfterSeconds)
    }
  }

  return {
    searchWorkers: (query, opts) => call('searchWorkers', query, opts),
    listUsers: (query, opts) => call('listUsers', query, opts),
    listSuspendedWorkers: (query, opts) => call('listSuspendedWorkers', query, opts),
    canonicalSearch: (query) => {
      const q = canonical('searchWorkers', query)
      return 'fields' in q && typeof q.fields === 'object' ? '' : new URLSearchParams(q as Record<string, string>).toString()
    },
  }
}

function failure<T>(status: number, body: ErrorResponse | null, retryAfterSeconds?: number): ApiOutcome<T> {
  if (status === 401) return { kind: 'unauthenticated' }
  if (status === 403) return { kind: 'forbidden' }
  if (status === 429) return { kind: 'rateLimited', retryAfterSeconds: retryAfterSeconds ?? 5 }
  if (status === 503) return { kind: 'unavailable' }
  return { kind: 'failed', status, requestId: body?.error.requestId, fields: body?.error.fields }
}

/** The page's token source: one per page load (R5.2). */
export const apiToken: TokenSource = createTokenSource()

/** The client the admin screens use. The base URL is inlined by Next at build time. */
export const adminApi: AdminApi = createAdminApi({ baseUrl: process.env.NEXT_PUBLIC_API_URL, tokenSource: apiToken })
