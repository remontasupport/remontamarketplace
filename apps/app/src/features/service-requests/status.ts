// A service request status as every screen shows it (moved out of the client's request table, admin-clients U2 A6):
// the label and the badge colours, one entry per database value.
import type { ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'

export type { ServiceRequestStatus }

export const SERVICE_REQUEST_STATUS_STYLE: Record<ServiceRequestStatus, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  PENDING: { label: 'Pending', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', dotColor: 'bg-yellow-500' },
  MATCHING: { label: 'Matching', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', dotColor: 'bg-indigo-500' },
  MATCHED: { label: 'Matched', bgColor: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-500' },
  ACTIVE: { label: 'Active', bgColor: 'bg-green-50', textColor: 'text-green-700', dotColor: 'bg-green-500' },
  COMPLETED: { label: 'Completed', bgColor: 'bg-gray-50', textColor: 'text-gray-700', dotColor: 'bg-gray-500' },
  CANCELLED: { label: 'Cancelled', bgColor: 'bg-red-50', textColor: 'text-red-700', dotColor: 'bg-red-500' },
  ARCHIVED: { label: 'Archived', bgColor: 'bg-gray-50', textColor: 'text-gray-400', dotColor: 'bg-gray-400' },
}
