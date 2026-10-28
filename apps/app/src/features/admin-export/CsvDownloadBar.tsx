'use client'

// The download toolbar above an admin list: the ticked count with Clear, "Download selected" and "Download all".
// `pageRows`, for a list without a header checkbox (the contractor cards), adds "Select this page".
import type { ContactsExport } from './useContactsExport'

export default function CsvDownloadBar<R>({ exp, total, pageRows }: { exp: ContactsExport<R>; total: number | undefined; pageRows?: readonly R[] }) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2 text-sm">
        <span className="mr-auto flex items-center gap-3 text-gray-600">
          {pageRows && (
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={exp.allSelected(pageRows)} onChange={(e) => exp.toggle(pageRows, e.target.checked)} />
              Select this page
            </label>
          )}
          {exp.count > 0 && (
            <span>
              {exp.count} selected ·{' '}
              <button onClick={exp.clear} className="text-indigo-700 hover:underline">Clear</button>
            </span>
          )}
        </span>
        <button
          onClick={exp.downloadSelected}
          disabled={exp.count === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download selected{exp.count > 0 ? ` (${exp.count})` : ''}
        </button>
        <button
          onClick={() => void exp.downloadAll()}
          disabled={exp.exporting || !total}
          title="Everyone matching the current search and filters"
          className="rounded-md bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exp.exporting ? 'Preparing…' : `Download all${total !== undefined ? ` (${total})` : ''}`}
        </button>
      </div>
      {exp.notice && <p className="mb-3 text-sm text-red-700">{exp.notice}</p>}
    </>
  )
}
