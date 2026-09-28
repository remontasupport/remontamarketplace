// data/au_localities.csv -- the committed, reviewable form of the suburb list.
// Row order and number formatting are fixed so that rebuilding the same release is
// byte-identical and a new release diffs as exactly the suburbs that changed.

export interface LocalityRow {
  localityPid: string
  state: string
  suburb: string
  searchName: string
  postcode: string
  latitude: number
  longitude: number
}

export const CSV_HEADER = 'locality_pid,state,suburb,search_name,postcode,latitude,longitude'

/** Six decimal places is ~0.1 m -- far below what a suburb centroid means. */
export function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

export function rowKey(r: { localityPid: string; postcode: string }): string {
  return `${r.localityPid}|${r.postcode}`
}

export function compareRows(a: LocalityRow, b: LocalityRow): number {
  return (
    cmp(a.state, b.state) ||
    cmp(a.searchName, b.searchName) ||
    cmp(a.postcode, b.postcode) ||
    cmp(a.localityPid, b.localityPid)
  )
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function toCsv(rows: readonly LocalityRow[]): string {
  const sorted = [...rows].sort(compareRows)
  const lines = sorted.map((r) =>
    [r.localityPid, r.state, r.suburb, r.searchName, r.postcode, r.latitude.toFixed(6), r.longitude.toFixed(6)]
      .map(quote)
      .join(','),
  )
  return [CSV_HEADER, ...lines].join('\n') + '\n'
}

function quote(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function fromCsv(text: string): LocalityRow[] {
  const records = parseRecords(text.replace(/^﻿/, ''))
  const header = records.shift()
  if (header?.join(',') !== CSV_HEADER) throw new Error(`unexpected CSV header: ${header?.join(',')}`)
  return records.map((f, i) => {
    if (f.length !== 7) throw new Error(`CSV record ${i + 2}: expected 7 fields, got ${f.length}`)
    const [localityPid, state, suburb, searchName, postcode, lat, lng] = f as [string, string, string, string, string, string, string]
    const latitude = Number(lat)
    const longitude = Number(lng)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error(`CSV record ${i + 2}: bad coordinates`)
    return { localityPid, state, suburb, searchName, postcode, latitude, longitude }
  })
}

function parseRecords(text: string): string[][] {
  const out: string[][] = []
  let rec: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      rec.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      rec.push(field)
      out.push(rec)
      rec = []
      field = ''
    } else field += c
  }
  if (field !== '' || rec.length > 0) {
    rec.push(field)
    out.push(rec)
  }
  return out
}
