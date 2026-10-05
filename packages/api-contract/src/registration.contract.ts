// Registration: every endpoint of the area, in one file (NFR-ARCH-02).
// S1-design 3.1 and S1-data-model 2.2. Adding an endpoint = one entry here + one
// handler in apps/api's registration module.
// The subpath, not the package index: the index re-exports older schemas with
// tracked type errors, which would otherwise enter this package's strict tsc.
import { ACCEPTED_IMAGE_TYPES } from '@remonta/schemas/image-type'
import { emailAvailabilitySchema, emailCodeRequestSchema, emailCodeTicketSchema, emailCodeVerifySchema, workerRegistrationSchema } from '@remonta/schemas/schema/workerRegistrationSchema'
import * as z from 'zod'
import { defineContract } from './define'
import { meta } from './meta'

/** Same text for a new and an existing email (R1, no enumeration; R2, truthful). */
export const REGISTRATION_ACCEPTED_MESSAGE =
  'Check your inbox — if this email is new, your account is ready and you can sign in now.'

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024

// The sign-up photo's direct upload (U3): a ticket names one key the browser may fill
// for ten minutes; confirm checks what landed before any row exists.
export const photoTicketRequestSchema = z.strictObject({
  contentType: z.enum(ACCEPTED_IMAGE_TYPES),
  sizeBytes: z.int().min(1).max(PHOTO_MAX_BYTES),
})
export type PhotoTicketRequest = z.infer<typeof photoTicketRequestSchema>

export const photoTicketResponseSchema = z.strictObject({
  photoUploadId: z.uuid(),
  upload: z.strictObject({
    url: z.url(),
    method: z.literal('POST'),
    /** The signed policy's form fields, sent before the file. */
    fields: z.record(z.string(), z.string()),
    fileField: z.literal('file'),
  }),
  expiresAt: z.iso.datetime(),
})
export type PhotoTicketResponse = z.infer<typeof photoTicketResponseSchema>

export const photoConfirmSchema = z.strictObject({ photoUploadId: z.uuid() })

export const localitySchema = z.strictObject({
  id: z.number().int().positive(),
  suburb: z.string(),
  state: z.enum(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'OT']),
  postcode: z.string().regex(/^[0-9]{4}$/),
  /** "Parramatta NSW 2150" -- what the autocomplete shows. */
  label: z.string(),
})

/** A service the worker can offer, with only what the sign-up's services step shows. */
export const serviceCategorySchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  requiresQualification: z.boolean(),
  subcategories: z.array(z.strictObject({ id: z.string(), name: z.string(), requiresRegistration: z.string().nullable() })),
})

export const registrationContract = defineContract('registration', {
  listServiceCategories: {
    method: 'GET',
    path: '/v1/service-categories',
    summary: 'The service catalogue for the sign-up services step: categories in display order, sub-categories by name.',
    responses: { 200: z.strictObject({ categories: z.array(serviceCategorySchema) }) },
    meta: meta({
      access: 'public',
      bot: 'none', // read-only, the same for everyone, cached
      rateLimit: [
        { per: 'ip', limit: 60, window: '1m' },
        { per: 'global', limit: 3000, window: '1m' },
      ],
      maxBodyKb: 1,
      cacheSeconds: 300,
    }),
  },

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

  checkEmailAvailability: {
    method: 'POST',
    path: '/v1/registrations/worker/email-availability',
    summary: 'Whether an address can sign up (no account yet). Asked when the email field loses focus. One indexed lookup, nothing else.',
    body: { kind: 'json', schema: emailAvailabilitySchema },
    responses: { 200: z.strictObject({ available: z.boolean() }) },
    meta: meta({
      access: 'public',
      bot: 'none', // a CAPTCHA token would cost more than the lookup; the limit bounds enumeration
      rateLimit: [
        { per: 'ip', limit: 60, window: '1h' },
        { per: 'global', limit: 6000, window: '1h' },
      ],
      maxBodyKb: 1,
    }),
  },

  requestEmailCode: {
    method: 'POST',
    path: '/v1/registrations/worker/email-codes',
    summary: 'Email a 6-digit code to the address the worker wants to sign up with. Answers a signed ticket; nothing is stored. The same 202 for any address.',
    body: { kind: 'json', schema: emailCodeRequestSchema },
    responses: { 202: emailCodeTicketSchema },
    meta: meta({
      access: 'public',
      bot: { captcha: { action: 'worker_email_code' } },
      rateLimit: [
        { per: 'ip', limit: 10, window: '1h' },
        { per: 'global', limit: 1000, window: '1h' },
      ],
      maxBodyKb: 4,
    }),
  },

  verifyEmailCode: {
    method: 'POST',
    path: '/v1/registrations/worker/email-codes/verify',
    summary: 'Check a code against its ticket. The code expires 10 minutes after it was sent.',
    body: { kind: 'json', schema: emailCodeVerifySchema },
    responses: { 200: z.strictObject({ verified: z.literal(true) }) },
    meta: meta({
      access: 'public',
      bot: 'none', // guesses are bounded by this limit and the 10-minute expiry
      rateLimit: [
        { per: 'ip', limit: 30, window: '1h' },
        { per: 'global', limit: 5000, window: '1h' },
      ],
      maxBodyKb: 1,
    }),
  },

  createPhotoUploadTicket: {
    method: 'POST',
    path: '/v1/registrations/worker/photo-tickets',
    summary: 'A ticket to upload the sign-up photo straight to storage: one key, one type, at most 5 MB, ten minutes. Nothing is stored until confirm.',
    body: { kind: 'json', schema: photoTicketRequestSchema },
    responses: { 201: photoTicketResponseSchema },
    meta: meta({
      access: 'public',
      bot: 'none', // the limits bound tickets; an unused ticket costs nothing but a signing call
      rateLimit: [
        { per: 'ip', limit: 10, window: '1h' },
        { per: 'global', limit: 300, window: '1h' },
      ],
      maxBodyKb: 1,
    }),
  },

  confirmPhotoUpload: {
    method: 'POST',
    path: '/v1/registrations/worker/photo-confirmations',
    summary: 'Confirm an uploaded sign-up photo: the object is checked (size, first bytes) and only then recorded. Returns the same id, never a URL.',
    body: { kind: 'json', schema: photoConfirmSchema },
    responses: { 200: z.strictObject({ photoUploadId: z.uuid() }) },
    meta: meta({
      access: 'public',
      bot: 'none',
      rateLimit: [
        { per: 'ip', limit: 30, window: '1h' },
        { per: 'global', limit: 1000, window: '1h' },
      ],
      maxBodyKb: 1,
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
