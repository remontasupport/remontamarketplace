// Pino (Fastify's logger), JSON, a request ID on every line (S1-design 2.8).
// Logs carry IDs, not personal data: these paths are redacted wherever they appear.
import { randomUUID } from 'node:crypto'
import type { FastifyServerOptions } from 'fastify'

// bankAccount, streetLine, storageKey, signedUrl: the worker profile's secrets (U1 worker-area, U1-SEC-02).
const SENSITIVE = ['password', 'email', 'mobile', 'photo', 'token', 'captchaToken', 'authorization', 'cookie', 'firstName', 'lastName', 'bsb', 'accountNumber', 'bankAccount', 'streetLine', 'storageKey', 'signedUrl', 'abn']

export const REDACT_PATHS = [
  ...SENSITIVE.flatMap((k) => [k, `*.${k}`, `*.*.${k}`]),
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
]

const REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/

export function loggerOptions(level: string): FastifyServerOptions['logger'] {
  return {
    level,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    // No query strings in logs: /v1/localities?q= would carry what people type.
    serializers: {
      req: (req: { method: string; url: string; id: string }) => ({ method: req.method, path: req.url.split('?')[0], id: req.id }),
    },
  }
}

/** Accepts a well-formed incoming x-request-id (for tracing from apps/app), else a new UUID. */
export function genReqId(req: { headers: Record<string, string | string[] | undefined> }): string {
  const incoming = req.headers['x-request-id']
  return typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID()
}
