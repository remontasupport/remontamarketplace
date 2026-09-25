import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { escapeHtml, existingAccountNotice, registrationConfirmation } from '../../src/modules/notifications/templates'
import { ResendMailer } from '../../src/platform/email/mailer'
import { SafeHttpClient } from '../../src/platform/http/safe-http-client'
import { afterFailure, backoffMs, MAX_ATTEMPTS, PermanentFailure } from '../../src/platform/outbox/outbox'

describe('email templates', () => {
  it('say the account is ready -- never "verify your email"', () => {
    for (const m of [registrationConfirmation('Mary', 'https://app.example'), existingAccountNotice('Mary', 'https://app.example')]) {
      expect(`${m.subject} ${m.html} ${m.text}`).not.toMatch(/verif/i)
      expect(m.html).toContain('https://app.example/login')
      expect(m.text).toContain('https://app.example/login')
    }
    expect(registrationConfirmation('Mary', 'https://app.example').text).toMatch(/Your account is ready\. You can sign in now/)
    expect(existingAccountNotice('Mary', 'https://app.example').text).toContain('https://app.example/forgot-password')
  })

  it('escape the name, so it cannot inject markup', () => {
    fc.assert(
      fc.property(fc.string(), (name) => {
        const { html } = registrationConfirmation(name, 'https://app.example')
        return html.includes(escapeHtml(name)) && !(name.includes('<') && html.includes(`, ${name}<`))
      }),
    )
    expect(registrationConfirmation('<img src=x onerror=alert(1)>', 'https://a.example').html).not.toContain('<img src=x')
  })
})

describe('ResendMailer', () => {
  function mailer(respond: (init: RequestInit) => Response) {
    const calls: { url: string; init: RequestInit }[] = []
    const fetch = (async (url: URL | string, init: RequestInit) => {
      calls.push({ url: String(url), init })
      return respond(init)
    }) as unknown as typeof globalThis.fetch
    return { m: new ResendMailer(new SafeHttpClient({ allowedHosts: ['api.resend.com'], fetch }), { apiKey: 're_test_key', from: 'Remonta <noreply@example.test>' }), calls }
  }
  const email = { to: 'a@b.test', subject: 's', html: '<p>h</p>', text: 't', idempotencyKey: 'registration-confirmation/evt-1' }

  it('sends with the API key and the idempotency key', async () => {
    const { m, calls } = mailer(() => new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 }))
    expect(await m.send(email)).toEqual({ id: 'msg_1' })
    const h = calls[0]!.init.headers as Record<string, string>
    expect(calls[0]!.url).toBe('https://api.resend.com/emails')
    expect(h.authorization).toBe('Bearer re_test_key')
    expect(h['idempotency-key']).toBe('registration-confirmation/evt-1')
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ from: 'Remonta <noreply@example.test>', to: ['a@b.test'] })
  })

  it('a 4xx is permanent (no point retrying); 429 and 5xx are retried', async () => {
    await expect(mailer(() => new Response('{}', { status: 422 })).m.send(email)).rejects.toBeInstanceOf(PermanentFailure)
    for (const status of [429, 500, 503]) {
      const err = await mailer(() => new Response('{}', { status })).m.send(email).catch((e: unknown) => e)
      expect(err).toBeInstanceOf(Error)
      expect(err).not.toBeInstanceOf(PermanentFailure)
    }
  })
})

describe('outbox retry policy (property)', () => {
  // Simulates one event's life: each attempt succeeds, fails, or fails permanently.
  function life(outcomes: ('ok' | 'fail' | 'permanent')[]) {
    let attempts = 0
    let waitedMs = 0
    for (const o of outcomes) {
      attempts++
      if (o === 'ok') return { final: 'DONE' as const, attempts, waitedMs }
      const next = afterFailure(attempts, o === 'permanent')
      if (next.status === 'DEAD') return { final: 'DEAD' as const, attempts, waitedMs }
      waitedMs += next.retryInMs
    }
    return { final: 'PENDING' as const, attempts, waitedMs }
  }
  const outcome = fc.constantFrom<'ok' | 'fail' | 'permanent'>('ok', 'fail', 'fail', 'permanent')

  it('DONE exactly when a send succeeds within the attempts allowed; never retried once final', () => {
    fc.assert(
      fc.property(fc.array(outcome, { minLength: MAX_ATTEMPTS, maxLength: 12 }), (outcomes) => {
        const r = life(outcomes)
        const firstOk = outcomes.indexOf('ok')
        const firstPermanent = outcomes.indexOf('permanent')
        const stopsAt = Math.min(...[firstOk, firstPermanent, MAX_ATTEMPTS - 1].filter((i) => i >= 0))
        expect(r.attempts).toBe(stopsAt + 1)
        expect(r.final).toBe(outcomes[stopsAt] === 'ok' ? 'DONE' : 'DEAD')
        expect(r.attempts).toBeLessThanOrEqual(MAX_ATTEMPTS)
      }),
    )
  })

  it('an event that keeps failing is given up after about an hour, never sooner than 1 h', () => {
    const r = life(Array(MAX_ATTEMPTS).fill('fail'))
    expect(r).toMatchObject({ final: 'DEAD', attempts: MAX_ATTEMPTS })
    expect(r.waitedMs).toBe([1, 2, 3, 4, 5].reduce((s, n) => s + backoffMs(n), 0))
    expect(r.waitedMs / 60_000).toBe(62)
  })
})
