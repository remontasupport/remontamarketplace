// Registration: every endpoint of the area, in one file (NFR-ARCH-02).
// S1-design 3.1 and S1-data-model 2.2. Adding an endpoint = one entry here + one
// handler in apps/api's registration module.
// The subpath, not the package index: the index re-exports older schemas with
// tracked type errors, which would otherwise enter this package's strict tsc.
import { workerRegistrationSchema } from '@remonta/schemas/schema/workerRegistrationSchema'
import * as z from 'zod'
import { defineContract } from './define'
import { meta } from './meta'

/** Same text for a new and an existing email (R1, no enumeration; R2, truthful). */
export const REGISTRATION_ACCEPTED_MESSAGE =
  'Check your inbox — if this email is new, your account is ready and you can sign in now.'

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024

export const localitySchema = z.strictObject({
  id: z.number().int().positive(),
  suburb: z.string(),
  state: z.enum(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'OT']),
  postcode: z.string().regex(/^[0-9]{4}$/),
  /** "Parramatta NSW 2150" -- what the autocomplete shows. */
  label: z.string(),
})

export const registrationContract = defineContract('registration', {
  searchLocalities: {
    method: 'GET',
    path: '/v1/localities',
    summary: 'Suburb autocomplete for sign-up: prefix match on suburb or postcode, current rows only, at most 10.',
    query: z.strictObject({
      q: z
        .string()
        .max(200)
        .transform((s) => s.trim().replace(/\s+/g, ' '))
        .pipe(z.string().min(2).max(60)),
    }),
    responses: { 200: z.strictObject({ localities: z.array(localitySchema).max(10) }) },
    meta: meta({
      access: 'public',
      bot: 'none', // called per keystroke; the rate limit and the tiny response bound it
      rateLimit: [
        { per: 'ip', limit: 120, window: '1m' },
        { per: 'global', limit: 6000, window: '1m' },
      ],
      maxBodyKb: 1,
      cacheSeconds: 3600,
    }),
  },

  uploadRegistrationPhoto: {
    method: 'POST',
    path: '/v1/registrations/worker/photo',
    summary: 'Stage a profile photo for a sign-up. Returns an upload id, never a URL.',
    body: {
      kind: 'multipart',
      files: {
        photo: { maxBytes: PHOTO_MAX_BYTES, mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] },
      },
    },
    responses: { 201: z.strictObject({ photoUploadId: z.uuid() }) },
    meta: meta({
      access: 'public',
      bot: 'none',
      rateLimit: [
        { per: 'ip', limit: 10, window: '1h' },
        { per: 'global', limit: 300, window: '1h' },
      ],
      maxBodyKb: 5120,
    }),
  },

  submitWorkerRegistration: {
    method: 'POST',
    path: '/v1/registrations/worker',
    summary: 'Create a worker account. The same 202 for a new and an existing email.',
    body: { kind: 'json', schema: workerRegistrationSchema },
    responses: {
      202: z.strictObject({ status: z.literal('accepted'), message: z.literal(REGISTRATION_ACCEPTED_MESSAGE) }),
    },
    meta: meta({
      access: 'public',
      bot: { captcha: { action: 'worker_register' } },
      rateLimit: [
        { per: 'ip', limit: 5, window: '1h' },
        { per: 'global', limit: 500, window: '1h' },
      ],
      maxBodyKb: 16,
      audit: 'ACCOUNT_REGISTERED',
    }),
  },
})
