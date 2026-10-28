// The service request's closed value sets, declared once (admin-clients U1, BR-4/BR-5): packages/db's
// ServiceRequestStatus and FundingType enums, spelled out in their database order (this package never imports Prisma,
// P-5). The admin contract and the types read these; a new database value is added here in the same PR.

export const SERVICE_REQUEST_STATUSES = ['PENDING', 'MATCHING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'] as const
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number]

export const FUNDING_TYPES = ['NDIS', 'AGED_CARE', 'INSURANCE', 'PRIVATE', 'OTHER'] as const
export type FundingType = (typeof FUNDING_TYPES)[number]
