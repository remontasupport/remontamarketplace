// The outbox events a sign-up produces, declared once: the producer
// (register-worker) and every consumer (notifications; later the CRM handler)
// import the names and payload shapes from here, so they cannot drift apart.
// Payloads carry ids only (no personal data sits in the outbox).
import * as z from 'zod'

export const WORKER_REGISTERED = 'WorkerRegistered'
export const EXISTING_ACCOUNT_ATTEMPT = 'RegistrationAttemptOnExistingAccount'

/** Every sign-up event names the account it concerns. A consumer that needs only that parses this. */
export const eventUser = z.object({ userId: z.string().min(1) })

/** What the producer sends (the full shape); consumers parse only the part they read. Type aliases, so they satisfy Prisma's JSON input type. */
export type WorkerRegisteredPayload = { userId: string; workerProfileId: string }
export type ExistingAccountAttemptPayload = { userId: string }

/** A sign-up claimed a photo uploaded to the bucket (U3): the processing handler makes the clean copy. Bucket rows only. */
export const PHOTO_UPLOADED = 'PhotoUploaded'
export const photoUploadedPayload = z.object({ photoUploadId: z.uuid(), workerProfileId: z.string().min(1) })
export type PhotoUploadedPayload = { photoUploadId: string; workerProfileId: string }
