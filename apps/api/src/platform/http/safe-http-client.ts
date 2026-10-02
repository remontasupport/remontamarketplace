// Every outbound call goes through here (S1-design 2.5, P4/P5):
// - only hosts on the configured allow-list; callers cannot supply a new one (SSRF)
// - HTTPS only, redirects not followed, 3 s timeout, response size bounded
// - every JSON response parsed with a Zod schema before use
// - failures come back typed, never thrown raw
import type * as z from 'zod'

export type HttpFailure =
  | { kind: 'blocked'; reason: string } // refused before sending: a bug, not an outage
  | { kind: 'timeout' }
  | { kind: 'network'; message: string }
  /** detail: the start of the error body (bounded), for the log -- a provider's reason. */
  | { kind: 'status'; status: number; detail?: string }
  | { kind: 'too-large' }
  | { kind: 'invalid-response'; issues: string }

const ERROR_DETAIL_BYTES = 512

export type HttpResult<T> = { ok: true; status: number; data: T } | { ok: false; error: HttpFailure }

export interface SafeRequest<S extends z.ZodType | undefined> {
  method: 'GET' | 'POST'
  url: string
  headers?: Record<string, string>
  body?: string | URLSearchParams
  /** Parse the body with this schema (JSON, or the text itself with responseType 'text'). Omit to ignore the body. */
  schema?: S
  responseType?: 'json' | 'text'
  timeoutMs?: number
}

export interface SafeHttpClientOptions {
  allowedHosts: readonly string[]
  fetch?: typeof globalThis.fetch
  maxResponseBytes?: number
  defaultTimeoutMs?: number
}

export class SafeHttpClient {
  private readonly allowed: Set<string>
  private readonly doFetch: typeof globalThis.fetch
  private readonly maxBytes: number
  private readonly timeoutMs: number

  constructor(opts: SafeHttpClientOptions) {
    this.allowed = new Set(opts.allowedHosts.map((h) => h.toLowerCase()))
    this.doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis)
    this.maxBytes = opts.maxResponseBytes ?? 256 * 1024
    this.timeoutMs = opts.defaultTimeoutMs ?? 3000
  }

  async request<S extends z.ZodType | undefined = undefined>(
    req: SafeRequest<S>,
  ): Promise<HttpResult<S extends z.ZodType ? z.output<S> : undefined>> {
    type T = S extends z.ZodType ? z.output<S> : undefined
    let url: URL
    try {
      url = new URL(req.url)
    } catch {
      return fail({ kind: 'blocked', reason: 'not a URL' })
    }
    if (url.protocol !== 'https:') return fail({ kind: 'blocked', reason: 'https only' })
    if (url.username || url.password) return fail({ kind: 'blocked', reason: 'credentials in URL' })
    if (url.port && url.port !== '443') return fail({ kind: 'blocked', reason: 'non-standard port' })
    if (!this.allowed.has(url.hostname.toLowerCase())) return fail({ kind: 'blocked', reason: `host ${url.hostname} not allowed` })

    let res: Response
    try {
      res = await this.doFetch(url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
        redirect: 'manual',
        signal: AbortSignal.timeout(req.timeoutMs ?? this.timeoutMs),
      })
    } catch (e) {
      const name = (e as { name?: string })?.name
      if (name === 'TimeoutError' || name === 'AbortError') return fail({ kind: 'timeout' })
      return fail({ kind: 'network', message: e instanceof Error ? e.message : String(e) })
    }

    if (res.status < 200 || res.status >= 300) {
      // The provider's reason ("domain not verified", "testing emails only to ...")
      // is worth a log line; keep the start of the body, never more.
      const detail = (await readBounded(res, ERROR_DETAIL_BYTES).catch(() => null))?.replace(/\s+/g, ' ').trim()
      await res.body?.cancel().catch(() => {})
      return fail({ kind: 'status', status: res.status, ...(detail ? { detail } : {}) })
    }

    const text = await readBounded(res, this.maxBytes)
    if (text === null) return fail({ kind: 'too-large' })
    if (!req.schema) return { ok: true, status: res.status, data: undefined as T }

    let json: unknown = text
    if (req.responseType !== 'text') {
      try {
        json = JSON.parse(text)
      } catch {
        return fail({ kind: 'invalid-response', issues: 'not JSON' })
      }
    }
    const parsed = req.schema.safeParse(json)
    if (!parsed.success) return fail({ kind: 'invalid-response', issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') })
    return { ok: true, status: res.status, data: parsed.data as T }
  }
}

function fail(error: HttpFailure): { ok: false; error: HttpFailure } {
  return { ok: false, error }
}

async function readBounded(res: Response, max: number): Promise<string | null> {
  const declared = Number(res.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > max) {
    await res.body?.cancel().catch(() => {})
    return null
  }
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}
