// The typed client apps/app uses to call apps/api (S1-design 4.2). One method per
// contract entry, with the request and response types derived from its schemas.
// Responses are validated against the contract before they are returned, so a
// server that drifts from the contract fails loudly here rather than downstream.
import * as z from 'zod'
import type { Contract, ContractDef, EntryDef, RequestInput, SuccessResponse } from './define'
import { errorResponseSchema, type ErrorResponse } from './errors'

export type ClientResult<E extends EntryDef> =
  | ({ ok: true } & SuccessResponse<E>)
  | { ok: false; status: number; body: ErrorResponse | null; /** From Retry-After on 429/503: how long to wait before retrying. */ retryAfterSeconds?: number }

type Args<E extends EntryDef> = {
  [K in keyof RequestInput<E> as RequestInput<E>[K] extends undefined ? never : K]: RequestInput<E>[K]
}

export type Client<C extends ContractDef> = {
  [N in keyof C]: (args: Args<C[N]>, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<ClientResult<C[N]>>
}

export interface ClientOptions {
  baseUrl: string
  fetch?: typeof globalThis.fetch
  /** Sent on every request, e.g. a correlation id. */
  headers?: Record<string, string>
}

export function createClient<C extends ContractDef>(contract: Contract<C>, opts: ClientOptions): Client<C> {
  const doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis)
  const base = opts.baseUrl.replace(/\/+$/, '')
  const client = {} as Record<string, unknown>

  for (const [name, entry] of Object.entries(contract.entries)) {
    client[name] = async (args: Partial<Record<'params' | 'query' | 'body', unknown>>, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => {
      const params = (args.params ?? {}) as Record<string, string | number>
      const path = entry.path.replace(/:([a-zA-Z0-9]+)/g, (_, k: string) => {
        const v = params[k]
        if (v === undefined) throw new Error(`${contract.area}.${name}: missing path param ${k}`)
        return encodeURIComponent(String(v))
      })
      const query = args.query ? `?${new URLSearchParams(stringify(args.query as Record<string, unknown>))}` : ''
      const headers: Record<string, string> = { accept: 'application/json', ...opts.headers, ...init?.headers }
      let body: RequestInit['body']
      if (entry.body?.kind === 'json') {
        headers['content-type'] = 'application/json'
        body = JSON.stringify(args.body)
      } else if (entry.body?.kind === 'multipart') {
        body = args.body as FormData // the browser sets the multipart boundary
      }

      const res = await doFetch(`${base}${path}${query}`, { method: entry.method, headers, body, signal: init?.signal })
      const json: unknown = res.status === 204 ? undefined : await res.json().catch(() => null)
      const schema = entry.responses[res.status as keyof EntryDef['responses']]
      if (schema) {
        const parsed = schema.safeParse(json)
        if (!parsed.success) throw new Error(`${contract.area}.${name}: ${res.status} response does not match the contract: ${z.prettifyError(parsed.error)}`)
        return { ok: true, status: res.status, body: parsed.data }
      }
      const err = errorResponseSchema.safeParse(json)
      const header = res.headers.get('retry-after')
      const retryAfter = header === null || header.trim() === '' ? NaN : Number(header)
      return {
        ok: false,
        status: res.status,
        body: err.success ? err.data : null,
        ...(Number.isFinite(retryAfter) && retryAfter >= 0 ? { retryAfterSeconds: retryAfter } : {}),
      }
    }
  }
  return client as Client<C>
}

function stringify(q: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null) out[k] = String(v)
  return out
}
