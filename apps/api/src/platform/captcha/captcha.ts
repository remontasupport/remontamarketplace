// Pipeline step 4: reCAPTCHA v3, failing closed (S1-design 2.3, P3/P4).
// Unlike today's apps/app helper, a missing secret stops the service (config), an
// unreachable provider rejects the request, and the provider's response is
// schema-validated with the action and hostname checked, not just `success`.
import * as z from 'zod'
import type { SafeHttpClient } from '../http/safe-http-client'

export type CaptchaOutcome = { ok: true; score: number } | { ok: false; reason: 'missing' | 'rejected' | 'unavailable'; detail: string }

export interface CaptchaVerifier {
  verify(token: unknown, expectedAction: string, remoteIp: string): Promise<CaptchaOutcome>
}

const siteverifySchema = z.object({
  success: z.boolean(),
  score: z.number().min(0).max(1).optional(),
  action: z.string().optional(),
  hostname: z.string().optional(),
  'error-codes': z.array(z.string()).optional(),
})

export class RecaptchaV3Verifier implements CaptchaVerifier {
  constructor(
    private readonly http: SafeHttpClient,
    private readonly opts: { secret: string; allowedHostnames: readonly string[]; minScore: number },
  ) {}

  async verify(token: unknown, expectedAction: string, remoteIp: string): Promise<CaptchaOutcome> {
    if (typeof token !== 'string' || token.length === 0 || token.length > 4096) return { ok: false, reason: 'missing', detail: 'no token' }
    const res = await this.http.request({
      method: 'POST',
      url: 'https://www.google.com/recaptcha/api/siteverify',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: this.opts.secret, response: token, remoteip: remoteIp }),
      schema: siteverifySchema,
    })
    if (!res.ok) return { ok: false, reason: 'unavailable', detail: res.error.kind }
    const r = res.data
    if (!r.success) return { ok: false, reason: 'rejected', detail: `not successful: ${(r['error-codes'] ?? []).join(',')}` }
    if (r.action !== expectedAction) return { ok: false, reason: 'rejected', detail: `action ${r.action ?? '(none)'} != ${expectedAction}` }
    if (!r.hostname || !this.opts.allowedHostnames.includes(r.hostname)) return { ok: false, reason: 'rejected', detail: `hostname ${r.hostname ?? '(none)'}` }
    if (r.score === undefined || r.score < this.opts.minScore) return { ok: false, reason: 'rejected', detail: `score ${r.score ?? '(none)'}` }
    return { ok: true, score: r.score }
  }
}
