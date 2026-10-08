// The central security pipeline (S1-design 2.3, NFR-ARCH-01). Every contract entry
// runs these steps, in this order; an entry can set a step's parameters through its
// meta() but cannot skip or reorder one.
//
//   1  request id, security headers, CORS allow-list, HTTPS   (plugins + hooks, app.ts)
//   2  body size limit (maxBodyKb)                              (Fastify bodyLimit / multipart limits)
//   3  rate limit per ip / global -- fails closed
//   4  bot check (reCAPTCHA v3) -- fails closed
//   5  authentication (skipped only for access: 'public'), then per-user rate limits
//   6  policy: role
//   7  input validation: params, query, body (strict), files
//   8  handler
//   9  output shaping: the response must match its contract schema
//   10 audit enforcement
//   10b private caching (privateCacheSeconds): ETag, 304, and the response memo (U2)
//   11 error mapping                                            (error handler, app.ts)
import { createHash } from 'node:crypto'
import { serializeCanonical, type EntryDef, type RateLimitRule } from '@remonta/api-contract'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type * as z from 'zod'
import { RequestAudit } from '../audit'
import type { Authenticator, Principal } from '../auth/authenticator'
import type { ResponseMemo } from '../cache/response-memo'
import type { CaptchaVerifier } from '../captcha/captcha'
import { ApiError } from '../errors'
import type { RateLimiter } from '../rate-limit/rate-limiter'
import type { Handler, HandlerContext, UploadedFile } from '../contract/handlers'

export interface PipelineDeps {
  rateLimiter: RateLimiter
  captcha: CaptchaVerifier
  authenticator: Authenticator
  /** The response memo and the entry ids (`area.name`) that use it (U2, D16). */
  memo?: { store: ResponseMemo; entries: ReadonlySet<string> }
}

export function buildRouteHandler(id: string, entry: EntryDef, handler: Handler<EntryDef>, deps: PipelineDeps) {
  const m = entry.meta

  return async (request: FastifyRequest, reply: FastifyReply) => {
    // 3. Rate limit, before anything costly. Per-user rules wait for step 5.
    await enforceLimits(id, m.rateLimit.filter((r) => r.per !== 'user'), request, null, deps.rateLimiter)

    // 4. Bot check. The token is read from the raw body before validation, so an
    //    automated request is turned away without its payload being examined.
    if (m.bot !== 'none') {
      const token = (request.body as { captchaToken?: unknown } | null)?.captchaToken
      const outcome = await deps.captcha.verify(token, m.bot.captcha.action, request.ip)
      if (!outcome.ok) {
        request.log.warn({ entry: id, captcha: outcome.reason, detail: outcome.detail }, 'captcha refused')
        throw new ApiError(outcome.reason === 'unavailable' ? 503 : 403, `captcha ${outcome.reason}`)
      }
    }

    // 5. Authentication, then 6. policy. The authenticator logs the reason of a refusal
    //    (the auth-failure metric counts its line); this line adds the entry.
    let principal: Principal | null = null
    if (m.access !== 'public') {
      principal = await deps.authenticator.authenticate(request.headers)
      if (!principal) {
        request.log.warn({ entry: id, auth: 'rejected' }, 'auth rejected')
        throw new ApiError(401)
      }
      // Every later line of this request names who asked (R4.1): the 403 below, the
      // handler's lines, the response line. Ids only, never a name or an email.
      request.log = request.log.child({ userId: principal.userId, ...(principal.impersonatorId ? { impersonatorId: principal.impersonatorId } : {}) })
      if (!m.access.roles.includes(principal.role)) throw new ApiError(403, `role ${principal.role} not in ${m.access.roles.join(',')}`)
      await enforceLimits(id, m.rateLimit.filter((r) => r.per === 'user'), request, principal, deps.rateLimiter)
    }

    // 7. Input validation.
    const params = parse(entry.pathParams, request.params ?? {}, 'params')
    const query = parse(entry.query, request.query ?? {}, 'query')
    let body: unknown
    let files: Record<string, UploadedFile> | undefined
    if (entry.body?.kind === 'json') body = parse(entry.body.schema, request.body, 'body')
    else if (entry.body?.kind === 'multipart') files = await readFiles(request, entry.body.files)

    // 7b. The memo (U2, R8.3): the same valid question within the window is answered
    //     from memory. `Cache-Control: no-cache` on the request bypasses the lookup; the
    //     fresh answer then replaces the entry. Only valid queries reach here.
    const memo = deps.memo && deps.memo.entries.has(id) ? deps.memo.store : undefined
    const memoKey = memo ? `${id}|${serializeCanonical((query ?? {}) as Record<string, unknown>)}` : undefined
    const bypass = /(^|[\s,])(no-cache|max-age=0)([\s,]|$)/i.test(String(request.headers['cache-control'] ?? ''))
    let status: number
    let data: unknown
    const hit = memo && memoKey && !bypass ? memo.get(memoKey) : undefined
    if (hit !== undefined) {
      request.log.info({ entry: id, memo: 'hit' }, 'memo hit')
      status = 200
      data = hit
    } else {
      // 8. Handler.
      const audit = new RequestAudit({ ip: request.ip, userAgent: request.headers['user-agent'], requestId: request.id })
      const ctx: HandlerContext = { requestId: request.id, ip: request.ip, principal, rawBody: request.body, log: request.log, audit }
      const result = await handler({ params, query, body, files } as never, ctx)

      // 9. Output shaping. A status the contract does not declare, or a body that does
      //    not match its schema (including an extra field), is a server bug: 500, logged.
      const schema = entry.responses[result.status as keyof EntryDef['responses']]
      if (!schema) throw new Error(`${id}: handler returned undeclared status ${result.status}`)
      const out = schema.safeParse(result.body)
      if (!out.success) throw new Error(`${id}: response does not match the contract: ${out.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`)

      // 10. Audit enforcement.
      if (m.audit && !audit.satisfies(m.audit)) throw new Error(`${id}: succeeded without recording or skipping audit ${m.audit}`)

      status = result.status
      data = out.data
      if (memo && memoKey && status === 200) memo.set(memoKey, data)
    }

    if (m.cacheSeconds) reply.header('cache-control', `public, max-age=${m.cacheSeconds}`)

    // 10b. Private caching (U2, R8.1, R8.2): the browser keeps the answer for its
    //      signed-in user; a matching If-None-Match gets 304 with no body. Only on 200.
    if (m.privateCacheSeconds && status === 200) {
      const etag = `"sha256-${createHash('sha256').update(JSON.stringify(data)).digest('base64url')}"`
      reply.header('etag', etag)
      reply.header('cache-control', `private, max-age=${m.privateCacheSeconds}`)
      reply.header('vary', 'Authorization')
      if (request.headers['if-none-match'] === etag) return reply.status(304).send()
    }
    return reply.status(status).send(data)
  }
}

async function enforceLimits(id: string, rules: readonly RateLimitRule[], request: FastifyRequest, principal: Principal | null, limiter: RateLimiter) {
  for (const r of rules) {
    const who = r.per === 'ip' ? request.ip : r.per === 'user' ? (principal?.userId ?? 'anonymous') : '*'
    let decision
    try {
      decision = await limiter.hit(`${id}:${r.per}:${who}:${r.limit}/${r.window}`, r.limit, r.window)
    } catch (err) {
      // Fails closed: without the counter we cannot know the caller is within limits.
      request.log.error({ err, entry: id }, 'rate limiter unavailable')
      throw new ApiError(503, 'rate limiter unavailable')
    }
    if (!decision.allowed) throw new ApiError(429, `rate limit ${r.per} ${r.limit}/${r.window}`, undefined, { 'retry-after': String(decision.retryAfter) })
  }
}

function parse(schema: z.ZodType | undefined, input: unknown, where: string): unknown {
  if (!schema) {
    if (input && typeof input === 'object' && Object.keys(input).length > 0) throw new ApiError(400, `unexpected ${where}`, { [where]: ['Not accepted here'] })
    return undefined
  }
  const r = schema.safeParse(input)
  if (r.success) return r.data
  const fields: Record<string, string[]> = {}
  for (const issue of r.error.issues) {
    const key = issue.path.length ? issue.path.join('.') : where
    ;(fields[key] ??= []).push(issue.message)
  }
  throw new ApiError(400, `invalid ${where}`, fields)
}

async function readFiles(request: FastifyRequest, rules: Record<string, { maxBytes: number; mimeTypes: readonly string[] }>) {
  if (!request.isMultipart()) throw new ApiError(415, 'expected multipart/form-data')
  const files: Record<string, UploadedFile> = {}
  const largest = Math.max(...Object.values(rules).map((r) => r.maxBytes))
  for await (const part of request.parts({
    // One part more than the contract allows, so an unexpected part reaches the loop
    // below and is refused as invalid (400) rather than as too large (413).
    limits: { fileSize: largest, files: Object.keys(rules).length + 1, fields: 1, parts: Object.keys(rules).length + 1 },
  })) {
    if (part.type !== 'file') throw new ApiError(400, `unexpected field ${part.fieldname}`, { [part.fieldname]: ['Not accepted here'] })
    const rule = rules[part.fieldname]
    if (!rule || files[part.fieldname]) {
      part.file.resume()
      throw new ApiError(400, `unexpected file ${part.fieldname}`, { [part.fieldname]: ['Not accepted here'] })
    }
    if (!rule.mimeTypes.includes(part.mimetype)) {
      part.file.resume()
      throw new ApiError(415, `file type ${part.mimetype}`, { [part.fieldname]: [`Accepted types: ${rule.mimeTypes.join(', ')}`] })
    }
    const data = await part.toBuffer() // throws a 413 past the part's fileSize limit
    if (data.byteLength > rule.maxBytes) throw new ApiError(413, `file ${part.fieldname} too large`)
    if (data.byteLength === 0) throw new ApiError(400, `empty file ${part.fieldname}`, { [part.fieldname]: ['The file is empty'] })
    files[part.fieldname] = { filename: part.filename, declaredType: part.mimetype, data }
  }
  for (const name of Object.keys(rules)) if (!files[name]) throw new ApiError(400, `missing file ${name}`, { [name]: ['Required'] })
  return files
}
