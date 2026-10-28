// The ticked rows (kept while the admin pages and filters) and the two downloads: the ticked rows as they were ticked,
// or every row matching the current filters, read by `fetchAll`.
import { useState } from 'react'
import type { ApiOutcome } from '@/lib/api/outcome'
import { noticeText, noticeTitle } from '@/lib/api/outcome-notice'
import { downloadCsv } from '@/lib/csv'
import { contactsCsv, datedCsvName, type ContactRow } from './contactsCsv'

const DOWNLOAD_NOTICE = { name: 'download', plural: 'downloads' }

export interface ContactsExport<R> {
  count: number
  isSelected: (row: R) => boolean
  allSelected: (rows: readonly R[]) => boolean
  toggle: (rows: readonly R[], on: boolean) => void
  clear: () => void
  downloadSelected: () => void
  downloadAll: () => Promise<void>
  exporting: boolean
  notice: string | null
}

export function useContactsExport<R extends ContactRow>({ name, keyOf, fetchAll }: {
  /** The file's prefix: the tab's name. */
  name: string
  keyOf: (row: R) => string
  fetchAll: () => Promise<ApiOutcome<R[]>>
}): ContactsExport<R> {
  const [selected, setSelected] = useState<ReadonlyMap<string, R>>(new Map())
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  return {
    count: selected.size,
    isSelected: (row) => selected.has(keyOf(row)),
    allSelected: (rows) => rows.length > 0 && rows.every((r) => selected.has(keyOf(r))),
    toggle: (rows, on) =>
      setSelected((prev) => {
        const next = new Map(prev)
        for (const r of rows) if (on) next.set(keyOf(r), r); else next.delete(keyOf(r))
        return next
      }),
    clear: () => setSelected(new Map()),
    downloadSelected: () => downloadCsv(datedCsvName(name), contactsCsv([...selected.values()])),
    downloadAll: async () => {
      setExporting(true)
      setNotice(null)
      const all = await fetchAll()
      setExporting(false)
      if (all.kind === 'ok') downloadCsv(datedCsvName(name), contactsCsv(all.body))
      else setNotice(`${noticeTitle(all, DOWNLOAD_NOTICE)}. ${noticeText(all)}`)
    },
    exporting,
    notice,
  }
}
