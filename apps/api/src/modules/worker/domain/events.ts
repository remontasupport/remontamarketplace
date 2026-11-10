// The outbox event a change of the Account Details flag produces (worker-zoho-sync U1, FR-1), declared once for the
// producer (persistCompletion) and the consumer (the n8n handler). Ids only: the handler reads the worker at send time.
import * as z from 'zod'

export const WORKER_ACCOUNT_DETAILS_CHANGED = 'WorkerAccountDetailsChanged'
export const workerAccountDetailsChangedPayload = z.object({ workerProfileId: z.string().min(1) })
export type WorkerAccountDetailsChangedPayload = z.infer<typeof workerAccountDetailsChangedPayload>
