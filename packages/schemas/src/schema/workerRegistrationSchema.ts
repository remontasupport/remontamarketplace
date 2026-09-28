// Worker registration (S1). ONE schema, imported by the page (apps/app) and by the
// server (apps/api), so the two cannot disagree about what a valid sign-up is.
// Replaces contractorFormSchema for this form (S1-design section 3.3).
//
// Strict: unknown fields are rejected, strings are trimmed and bounded, and email
// and mobile are normalised, so the server stores exactly what it validated.
import * as z from 'zod'

/** The consent wording currently shown on the form. Bump it when the wording changes. */
export const CONSENT_WORDING_VERSION = 'worker-profile-share-v1'

// Today's live password rule, kept as-is (S1-design 3.3): the special characters are
// exactly the set apps/app accepts now, so no existing user's password pattern changes.
const PASSWORD_SPECIAL = /[@!#$%^&*(),.?":{}|<>]/

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

export function isValidPassword(p: string): boolean {
  return (
    p.length >= PASSWORD_MIN &&
    p.length <= PASSWORD_MAX &&
    /[A-Z]/.test(p) &&
    /[a-z]/.test(p) &&
    /[0-9]/.test(p) &&
    PASSWORD_SPECIAL.test(p)
  )
}

/** Trim and lower-case. Idempotent. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * An Australian mobile in any common form (04xx xxx xxx, +61 4xx xxx xxx,
 * 614xxxxxxxx, with spaces, dots, dashes or brackets) as E.164, `+614XXXXXXXX`;
 * null if it is not one. Idempotent: an E.164 result normalises to itself.
 */
export function normaliseAuMobile(input: string): string | null {
  const trimmed = input.trim()
  if (!/^\+?[0-9 ().-]+$/.test(trimmed)) return null
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+') && !digits.startsWith('61')) return null
  if (digits.length === 10 && digits.startsWith('04')) return `+61${digits.slice(1)}`
  if (digits.length === 11 && digits.startsWith('614')) return `+${digits}`
  return null
}

const ZOHO_LEAD_ID = /^[0-9]{1,32}$/

// Letters in any script, spaces, apostrophes (straight or curly) and hyphens;
// at least one letter.
const personName = (label: string) =>
  z
    .string()
    .max(200) // raw bound before trimming; the 50 below is the real rule
    .transform((s) => s.trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .max(50, `${label} must be 50 characters or fewer`)
        .regex(/^[\p{L}\p{M}'’ -]+$/u, `${label} can contain letters, spaces, apostrophes and hyphens only`)
        .regex(/\p{L}/u, `${label} must contain a letter`),
    )

const email = z
  .string()
  .max(320)
  .transform(normaliseEmail)
  .pipe(z.email('Please enter a valid email address').max(254, 'Please enter a valid email address'))

const mobile = z
  .string()
  .max(32)
  .transform((m, ctx) => {
    const e164 = normaliseAuMobile(m)
    if (e164 === null) {
      ctx.issues.push({
        code: 'custom',
        input: m,
        message: 'Please enter a valid Australian mobile number (e.g., 04XX XXX XXX)',
      })
      return z.NEVER
    }
    return e164
  })

const password = z
  .string()
  .min(PASSWORD_MIN, 'Use 8 characters or more for your password')
  .max(PASSWORD_MAX, 'Use 128 characters or fewer for your password')
  .refine(
    isValidPassword,
    'Password must include uppercase and lowercase letters, numbers and special characters (e.g. @, !, #, %)',
  )

const identifier = z
  .string()
  .max(200)
  .transform((s) => s.trim())
  .pipe(z.string().min(1).max(100))

// ---- Email verification before the password step (S1 step 13) ----------------
// Stateless, as the client sign-up already is: the send answers with a TICKET --
// HMAC(email:code:expiresAt) and the expiry -- and keeps nothing. Verifying, and
// the sign-up itself, recompute the HMAC over what the worker sends back.

const captchaToken = z.string().min(1).max(4096)

/** A code as typed: six digits; spaces are allowed while typing. */
export const emailCode = z
  .string()
  .max(32)
  .transform((c) => c.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^[0-9]{6}$/, 'Please enter the 6-digit code from the email'))

/** POST /v1/registrations/worker/email-codes */
export const emailCodeRequestSchema = z.strictObject({ email, captchaToken })

/**
 * POST /v1/registrations/worker/email-availability (user decision, 2026-09-28):
 * whether an address already has an account, asked when the email field loses
 * focus, so the code is only sent for an address that can sign up.
 */
export const emailAvailabilitySchema = z.strictObject({ email })
export type EmailAvailability = z.output<typeof emailAvailabilitySchema>

const ticketFields = {
  /** HMAC-SHA256 hex, issued by the send. */
  token: z.string().regex(/^[0-9a-f]{64}$/),
  /** Epoch milliseconds. */
  expiresAt: z.number().int().positive(),
}

/** What the send answers with. */
export const emailCodeTicketSchema = z.strictObject(ticketFields)

/** POST /v1/registrations/worker/email-codes/verify: the ticket, the address and the code as typed. */
export const emailCodeVerifySchema = z.strictObject({ ...ticketFields, email, code: emailCode })

/** In the sign-up body: the proof the email was verified; the server checks it again against the body's email. */
export const emailVerificationSchema = z.strictObject({ ...ticketFields, code: emailCode }, 'Please verify your email address')

export type EmailCodeRequest = z.output<typeof emailCodeRequestSchema>
export type EmailCodeTicket = z.output<typeof emailCodeTicketSchema>
export type EmailCodeVerify = z.output<typeof emailCodeVerifySchema>
export type EmailVerification = z.output<typeof emailVerificationSchema>

/** What the worker fills in on the form. The page validates with this. */
export const workerRegistrationFormSchema = z.strictObject({
  /** An au_localities id picked from GET /v1/localities; the server checks it is current. */
  localityId: z.number().int().positive(),
  firstName: personName('First name'),
  lastName: personName('Last name'),
  email,
  /** The verified code's ticket (S1 step 13); the server re-checks it for this email. */
  emailVerification: emailVerificationSchema,
  mobile,
  password,
  /** Category ids; the server checks each exists. */
  services: z
    .array(identifier)
    .min(1, 'Please select at least one service')
    .max(10)
    .refine((s) => new Set(s).size === s.length, 'Each service can be selected once'),
  /** Subcategory ids; the server checks each belongs to a chosen service. */
  supportWorkerCategories: z
    .array(identifier)
    .max(30)
    .refine((s) => new Set(s).size === s.length, 'Each category can be selected once')
    .optional(),
  /** From POST /v1/registrations/worker/photo. Never a URL. */
  photoUploadId: z.uuid('Profile photo is required'),
  consentProfileShare: z.literal(true, 'Profile sharing consent is required'),
  consentWordingVersion: z.literal(CONSENT_WORDING_VERSION),
  /**
   * From the Zoho link the worker followed. Malformed is not an error (US-REG-04):
   * it becomes undefined and registration continues; the server logs a warning when
   * the input had a value and the output does not.
   */
  zohoLeadId: z
    .string()
    .max(256)
    .optional()
    .transform((v) => {
      const t = v?.trim()
      return t && ZOHO_LEAD_ID.test(t) ? t : undefined
    }),
})

/** The request the page sends: the form plus the reCAPTCHA v3 token. */
export const workerRegistrationSchema = workerRegistrationFormSchema.extend({ captchaToken })

export type WorkerRegistrationFormInput = z.input<typeof workerRegistrationFormSchema>
export type WorkerRegistrationRequest = z.input<typeof workerRegistrationSchema>
/** What the server works with, after normalisation. */
export type WorkerRegistration = z.output<typeof workerRegistrationSchema>
