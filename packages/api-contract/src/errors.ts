// The one error shape every entry returns (pipeline step 11, P6/P10): a code, a
// generic message and the request ID. Details go to the logs, never here. The only
// detail returned is per-field validation messages on 400, which describe the
// caller's own input.
import * as z from 'zod'

export const ERROR_CODES = {
  400: 'INVALID_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL',
  503: 'UNAVAILABLE',
} as const

export type ErrorStatus = keyof typeof ERROR_CODES

export const errorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(Object.values(ERROR_CODES) as [string, ...string[]]),
    message: z.string(),
    requestId: z.string(),
    /** 400 only: messages per field path, e.g. { "email": ["Please enter a valid email address"] } */
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
})

export type ErrorResponse = z.output<typeof errorResponseSchema>
