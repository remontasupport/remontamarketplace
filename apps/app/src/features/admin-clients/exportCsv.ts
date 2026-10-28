// admin-clients U2 follow-up: "Download all" on the clients / coordinators list is everyone matching the current search
// and filters, read through the list entry at its largest page (the CSV itself: features/admin-export).
import { PAGE_SIZE_MAX, type RequesterRole, type RequesterRow } from '@remonta/api-contract'
import { adminApi, type ApiOutcome } from '@/lib/api/admin'
import { allPages } from '@/lib/api/allPages'
import { requestOf, type ListFilters } from './listQuery'

export function allRequesters(role: RequesterRole, filters: ListFilters): Promise<ApiOutcome<RequesterRow[]>> {
  return allPages((page) => adminApi.listRequesters({ ...requestOf(role, { ...filters, page }), pageSize: PAGE_SIZE_MAX }))
}
