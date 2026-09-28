// Outbound email through Resend (US-NOT-03), via SafeHttpClient.
//
// Every send carries an idempotency key (the outbox event id), so an outbox retry
// after a timeout that actually delivered cannot send a second copy. A 4xx other
// than 429 is permanent (bad address, unverified sender): retrying cannot help.
import * as z from 'zod'
import type { SafeHttpClient } from '../http/safe-http-client'
import { PermanentFailure } from '../outbox/outbox'

export interface Email {
  to: string
  subject: string
  html: string
  text: string
  /** Stable per logical email; Resend drops repeats within 24 h. */
  idempotencyKey: string
}

export interface Mailer {
  send(email: Email): Promise<{ id: string }>
}

const sent = z.object({ id: z.string() })

export class ResendMailer implements Mailer {
  constructor(
    private readonly http: SafeHttpClient,
    private readonly opts: { apiKey: string; from: string },
  ) {}

  async send(email: Email): Promise<{ id: string }> {
    const res = await this.http.request({
      method: 'POST',
      url: 'https://api.resend.com/emails',
      headers: {
        authorization: `Bearer ${this.opts.apiKey}`,
        'content-type': 'application/json',
        'idempotency-key': email.idempotencyKey,
      },
      body: JSON.stringify({ from: this.opts.from, to: [email.to], subject: email.subject, html: email.html, text: email.text }),
      schema: sent,
      timeoutMs: 5000,
    })
    if (res.ok) return res.data
    const e = res.error
    const said = e.kind === 'status' && e.detail ? ` -- ${e.detail}` : ''
    if (e.kind === 'status' && e.status >= 400 && e.status < 500 && e.status !== 429) throw new PermanentFailure(`resend refused the email: HTTP ${e.status}${said}`)
    throw new Error(`resend unavailable: ${e.kind}${e.kind === 'status' ? ` ${e.status}${said}` : ''}`)
  }
}
