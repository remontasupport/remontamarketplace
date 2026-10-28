// The statuses an admin may set from a request card. MATCHED is left out for now (user, 2026-10-28; the api still
// accepts it): a request already MATCHED keeps it as its shown current value, so the select never misstates it.
import { SERVICE_REQUEST_STATUSES, type ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'

const NOT_OFFERED: readonly ServiceRequestStatus[] = ['MATCHED']

export function statusChoicesFor(current: ServiceRequestStatus): ServiceRequestStatus[] {
  return SERVICE_REQUEST_STATUSES.filter((s) => s === current || !NOT_OFFERED.includes(s))
}
