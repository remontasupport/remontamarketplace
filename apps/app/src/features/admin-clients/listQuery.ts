// admin-clients U2 (A1): the clients / coordinators list's filters as the URL carries them, and back. The sidebar's tab
// names the role; anything the contract would refuse is dropped, so a hand-edited URL shows a list, never an error.
import { REQUESTER_ROLES, type RequesterListQuery, type RequesterRole } from '@remonta/api-contract'
import { FUNDING_TYPES, SERVICE_REQUEST_STATUSES, type FundingType, type ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'

export const REQUESTERS_PAGE_SIZE = 20

/** The sidebar's tab for each role, and its titles. */
export const REQUESTER_TABS: Record<RequesterRole, { tab: string; title: string; singular: string }> = {
  CLIENT: { tab: 'clients', title: 'Clients', singular: 'client' },
  COORDINATOR: { tab: 'support-coordinators', title: 'Support Coordinators', singular: 'support coordinator' },
}

export function roleOfTab(tab: string | null): RequesterRole | undefined {
  return REQUESTER_ROLES.find((r) => REQUESTER_TABS[r].tab === tab)
}

const oneOf = <T extends string>(values: readonly T[], v: string | null): T | undefined => (values as readonly string[]).includes(v ?? '') ? (v as T) : undefined

export interface ListFilters {
  search: string
  requestStatus?: ServiceRequestStatus
  fundingType?: FundingType
  page: number
}

export function filtersOf(params: URLSearchParams): ListFilters {
  const page = Number(params.get('page'))
  return {
    search: (params.get('search') ?? '').trim().slice(0, 100),
    requestStatus: oneOf(SERVICE_REQUEST_STATUSES, params.get('requestStatus')),
    fundingType: oneOf(FUNDING_TYPES, params.get('fundingType')),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

/** The URL's query for a tab and its filters: only what is set, so the default list has a clean URL. */
export function paramsOf(tab: string, f: ListFilters): URLSearchParams {
  const p = new URLSearchParams({ tab })
  if (f.search) p.set('search', f.search)
  if (f.requestStatus) p.set('requestStatus', f.requestStatus)
  if (f.fundingType) p.set('fundingType', f.fundingType)
  if (f.page > 1) p.set('page', String(f.page))
  return p
}

export function requestOf(role: RequesterRole, f: ListFilters): RequesterListQuery {
  return {
    role,
    page: f.page,
    pageSize: REQUESTERS_PAGE_SIZE,
    ...(f.search ? { search: f.search } : {}),
    ...(f.requestStatus ? { requestStatus: f.requestStatus } : {}),
    ...(f.fundingType ? { fundingType: f.fundingType } : {}),
  }
}
