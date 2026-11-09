// The contact list the admin downloads from the Clients, Support Coordinators and Contractors tabs: first name, last
// name, email, mobile, named after the tab and the day.
import { toCsv } from '@/lib/csv'

export interface ContactRow {
  firstName: string
  lastName: string
  email: string | null
  mobile: string
}

export const CSV_HEADER = ['First name', 'Last name', 'Email', 'Mobile'] as const

/** A tab's own columns after the four (the Contractors tab's checklist items, admin-completion-filters FR-6). */
export interface ExtraColumn<R> {
  header: string
  value: (row: R) => string
}

export function contactsCsv<R extends ContactRow>(rows: readonly R[], extra: readonly ExtraColumn<R>[] = []): string {
  return toCsv([...CSV_HEADER, ...extra.map((c) => c.header)], rows.map((r) => [r.firstName, r.lastName, r.email ?? '', r.mobile, ...extra.map((c) => c.value(r))]))
}

/** clients-2026-10-28.csv, contractors-2026-10-28.csv */
export function datedCsvName(name: string, today: Date = new Date()): string {
  const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return `${name}-${d}.csv`
}
