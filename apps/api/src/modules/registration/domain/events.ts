// The outbox events a sign-up produces, declared once: the producer
// (register-worker) and every consumer (notifications; later the CRM handler)
// import the names and payload shapes from here, so they cannot drift apart.
// Payloads carry ids only (no personal data sits in the outbox).
import * as z from 'zod'

export const WORKER_REGISTERED = 'WorkerRegistered'
export const EXISTING_ACCOUNT_ATTEMPT = 'RegistrationAttemptOnExistingAccount'

export const workerRegisteredPayload = z.object({ userId: z.string().min(1), workerProfileId: z.string().min(1) })
export const existingAccountAttemptPayload = z.object({ userId: z.string().min(1) })

export type WorkerRegisteredPayload = z.output<typeof workerRegisteredPayload>
export type ExistingAccountAttemptPayload = z.output<typeof existingAccountAttemptPayload>
