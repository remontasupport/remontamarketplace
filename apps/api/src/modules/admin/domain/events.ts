// The outbox event an admin's status change produces (admin-clients U1, BR-7), declared once for the producer
// (requesters.ts) and the consumer (the n8n handler). Ids only: the handler reads the request fresh at send time.
import * as z from 'zod'

export const SERVICE_REQUEST_STATUS_CHANGED = 'ServiceRequestStatusChanged'
export const serviceRequestStatusChangedPayload = z.object({ serviceRequestId: z.string().min(1), adminUserId: z.string().min(1) })
export type ServiceRequestStatusChangedPayload = { serviceRequestId: string; adminUserId: string }
