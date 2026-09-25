// Streaming reader for G-NAF's pipe-separated files. ADDRESS_DETAIL is ~17 M rows
// across the states, so nothing here holds a whole file in memory.
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

export type PsvRow = Record<string, string>

/**
 * Yields each data row as a { COLUMN: value } object keyed by the header line.
 * Only the requested columns are materialised; a missing one is an error, because
 * G-NAF renaming a column must fail the build rather than yield empty values.
 */
export async function* readPsv(path: string, columns: readonly string[]): AsyncGenerator<PsvRow> {
  const lines = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity })
  let index: number[] | undefined
  for await (const raw of lines) {
    const line = raw.replace(/^﻿/, '')
    if (line === '') continue
    const cells = line.split('|')
    if (!index) {
      index = columns.map((c) => {
        const i = cells.indexOf(c)
        if (i < 0) throw new Error(`${path}: column ${c} not in header`)
        return i
      })
      continue
    }
    const row: PsvRow = {}
    columns.forEach((c, k) => {
      row[c] = cells[index![k] as number] ?? ''
    })
    yield row
  }
  if (!index) throw new Error(`${path}: empty file`)
}
