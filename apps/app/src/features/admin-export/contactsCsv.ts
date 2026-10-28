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

export function contactsCsv(rows: readonly ContactRow[]): string {
  return toCsv(CSV_HEADER, rows.map((r) => [r.firstName, r.lastName, r.email ?? '', r.mobile]))
}

/** clients-2026-10-28.csv, contractors-2026-10-28.csv */
export function datedCsvName(name: string, today: Date = new Date()): string {
  const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return `${name}-${d}.csv`
}
