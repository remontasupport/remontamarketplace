// CSV files the admin downloads (admin-clients): RFC 4180 quoting, a UTF-8 byte-order mark so Excel reads accents, and
// a guard against spreadsheet formulas: a cell starting with = + - @ (or a tab / carriage return) is prefixed with an
// apostrophe, except a phone-like value ("+61 412 345 678"), which stays as entered.
const PHONE_LIKE = /^[+-]?[\d\s()-]+$/
const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value: string): string {
  const safe = FORMULA_START.test(value) && !PHONE_LIKE.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function toCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

/** Hands the browser the file to save. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
