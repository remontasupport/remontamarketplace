// The statuses the admin's client pages offer: the request card's Change status and the list's request-status filter.
// MATCHED is left out of both for now (user, 2026-10-28; the api still accepts it): a request already MATCHED keeps it
// as its shown current value, so the card's select never misstates it.
import { SERVICE_REQUEST_STATUSES, type ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'

const NOT_OFFERED: readonly ServiceRequestStatus[] = ['MATCHED']

/** In database order, without the ones not offered. */
export const OFFERED_STATUSES: readonly ServiceRequestStatus[] = SERVICE_REQUEST_STATUSES.filter((s) => !NOT_OFFERED.includes(s))

export function statusChoicesFor(current: ServiceRequestStatus): ServiceRequestStatus[] {
  return SERVICE_REQUEST_STATUSES.filter((s) => s === current || OFFERED_STATUSES.includes(s))
}
