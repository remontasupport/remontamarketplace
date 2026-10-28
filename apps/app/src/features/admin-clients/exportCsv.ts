// admin-clients U2 follow-up: the clients / coordinators list as a CSV (first name, last name, email, mobile). "All" is
// everyone matching the current search and filters, read through the list entry at its largest page.
import { PAGE_SIZE_MAX, type RequesterRole, type RequesterRow } from '@remonta/api-contract'
import { adminApi, type ApiOutcome } from '@/lib/api/admin'
import { toCsv } from '@/lib/csv'
import { REQUESTER_TABS, requestOf, type ListFilters } from './listQuery'

export const CSV_HEADER = ['First name', 'Last name', 'Email', 'Mobile'] as const

export function requestersCsv(rows: readonly RequesterRow[]): string {
  return toCsv(CSV_HEADER, rows.map((r) => [r.firstName, r.lastName, r.email, r.mobile]))
}

/** clients-2026-10-28.csv, support-coordinators-2026-10-28.csv */
export function csvFilename(role: RequesterRole, today: Date = new Date()): string {
  const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return `${REQUESTER_TABS[role].tab}-${d}.csv`
}

/** Every row matching the filters, page by page; the first failure is returned as it came. */
export async function allRequesters(role: RequesterRole, filters: ListFilters): Promise<ApiOutcome<RequesterRow[]>> {
  const rows: RequesterRow[] = []
  for (let page = 1; ; page++) {
    const result = await adminApi.listRequesters({ ...requestOf(role, { ...filters, page }), pageSize: PAGE_SIZE_MAX })
    if (result.kind !== 'ok') return result
    rows.push(...result.body.data)
    if (!result.body.pagination.hasNext) return { kind: 'ok', body: rows }
  }
}
