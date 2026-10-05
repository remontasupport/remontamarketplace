import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig } from '../src/config/config'

const complete = {
  AUTH_DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  CORS_ORIGINS: 'http://localhost:3000, https://app.remontaservices.com.au',
  RECAPTCHA_SECRET_KEY: '6LcSECRETsecretSECRETsecret',
  RECAPTCHA_ALLOWED_HOSTNAMES: 'localhost,app.remontaservices.com.au',
  RESEND_API_KEY: 're_SECRETsecret',
  N8N_REGISTRATION_WEBHOOK_URL: 'https://n8n.example.test/webhook/a',
  IP_HASH_SECRET: 'x'.repeat(32),
  EMAIL_FROM: 'Remonta <noreply@remontaservices.com.au>',
  APP_BASE_URL: 'https://app.remontaservices.com.au',
  PHOTO_BUCKET: 'remonta-api-photos-staging',
  PHOTO_PUBLIC_BASE_URL: 'https://storage.googleapis.com/remonta-api-photos-staging',
}

function problems(env: Record<string, string | undefined>): string[] {
  try {
    loadConfig(env)
  } catch (e) {
    if (e instanceof ConfigError) return e.problems
    throw e
  }
  return []
}

describe('loadConfig', () => {
  it('accepts a complete environment and derives the outbound allow-list', () => {
    const c = loadConfig(complete)
    expect(c.CORS_ORIGINS).toEqual(['http://localhost:3000', 'https://app.remontaservices.com.au'])
    expect(c.outboundHosts).toEqual(['www.google.com', 'api.resend.com', 'api.pwnedpasswords.com', 'n8n.example.test'])
    expect(c.requireHttps).toBe(false)
    expect(loadConfig({ ...complete, NODE_ENV: 'production' }).requireHttps).toBe(true)
  })

  it.each(['AUTH_DATABASE_URL', 'CORS_ORIGINS', 'RECAPTCHA_SECRET_KEY', 'RECAPTCHA_ALLOWED_HOSTNAMES', 'RESEND_API_KEY', 'IP_HASH_SECRET', 'PHOTO_BUCKET', 'PHOTO_PUBLIC_BASE_URL'])(
    'refuses to start without %s -- and a blank value counts as missing',
    (key) => {
      expect(problems({ ...complete, [key]: undefined }).join()).toContain(key)
      expect(problems({ ...complete, [key]: '   ' }).join()).toContain(key)
    },
  )

  it('accepts one wildcard label for staging (Vercel previews), and nothing looser', () => {
    const staging = loadConfig({ ...complete, CORS_ORIGINS: 'https://*.vercel.app', RECAPTCHA_ALLOWED_HOSTNAMES: '*.vercel.app' })
    expect(staging.CORS_ORIGINS).toEqual(['https://*.vercel.app'])
    expect(staging.RECAPTCHA_ALLOWED_HOSTNAMES).toEqual(['*.vercel.app'])
    for (const bad of ['https://*.app', 'https://**.vercel.app', 'https://a.*.vercel.app', 'http://*.vercel.app', 'https://*.vercel.app:443']) {
      expect(problems({ ...complete, CORS_ORIGINS: bad }), bad).not.toEqual([])
    }
    for (const bad of ['*', '*.app', 'a.*.vercel.app', '*.*.vercel.app']) {
      expect(problems({ ...complete, RECAPTCHA_ALLOWED_HOSTNAMES: bad }), bad).not.toEqual([])
    }
  })

  it.each([
    ['a wildcard origin', { CORS_ORIGINS: '*' }],
    ['a plain-http public origin', { CORS_ORIGINS: 'http://app.remontaservices.com.au' }],
    ['an origin with a path', { CORS_ORIGINS: 'https://app.example.com/x' }],
    ['an http webhook', { N8N_REGISTRATION_WEBHOOK_URL: 'http://n8n.example.test/b' }],
    ['a non-postgres database URL', { AUTH_DATABASE_URL: 'mysql://x' }],
    ['a score outside 0..1', { RECAPTCHA_MIN_SCORE: '2' }],
  ])('refuses %s', (_label, patch) => {
    expect(problems({ ...complete, ...patch })).not.toEqual([])
  })

  it('does not require the n8n URLs while the CRM notification is deferred', () => {
    expect(problems({ ...complete, N8N_REGISTRATION_WEBHOOK_URL: undefined })).toEqual([])
    expect(loadConfig({ ...complete, N8N_REGISTRATION_WEBHOOK_URL: undefined }).outboundHosts).not.toContain('n8n.example.test')
  })

  it('names the photo bucket per stage; the Blob token is optional (the multipart entry until the clean-up PR)', () => {
    expect(problems({ ...complete, BLOB_READ_WRITE_TOKEN: undefined })).toEqual([])
    expect(problems({ ...complete, PHOTO_BUCKET: 'Not A Bucket' }).join()).toContain('PHOTO_BUCKET')
    expect(problems({ ...complete, PHOTO_PUBLIC_BASE_URL: 'http://storage.googleapis.com/b' }).join()).toContain('PHOTO_PUBLIC_BASE_URL')
    const local = loadConfig({ ...complete, PHOTO_PUBLIC_BASE_URL: 'http://localhost:4443/test-photos', GCS_API_ENDPOINT: 'http://localhost:4443' })
    expect([local.GCS_API_ENDPOINT, local.GCS_TIMEOUT_MS, local.PHOTO_PROCESS_CONCURRENCY]).toEqual(['http://localhost:4443', 5000, 2])
    // A fake storage server never reaches production.
    expect(problems({ ...complete, NODE_ENV: 'production', GCS_API_ENDPOINT: 'http://localhost:4443' }).join()).toContain('GCS_API_ENDPOINT')
  })

  it('never echoes a value in its errors (P6)', () => {
    const msg = problems({ ...complete, RECAPTCHA_SECRET_KEY: 'short-SEKRET', AUTH_DATABASE_URL: 'mysql://admin:TOPSECRET@db' }).join('\n')
    expect(msg).toContain('RECAPTCHA_SECRET_KEY')
    expect(msg).not.toMatch(/SEKRET|TOPSECRET/)
  })
})
