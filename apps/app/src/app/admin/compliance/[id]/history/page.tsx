'use client'

// document-history U2 (R3, R4): one worker's past documents -- replaced by a new upload, deleted by the worker, or of a
// service the worker removed -- with the review each had, to open or delete for good. Admins only (the api checks).
// `[id]` is the worker profile id, as on the compliance page that links here.
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ExternalLink, History, Trash2 } from 'lucide-react'
import type { DocumentVersion } from '@remonta/api-contract'
import { adminApi } from '@/lib/api/admin'
import { noticeText, noticeTitle } from '@/lib/api/outcome-notice'
import { groupVersions, REASON_LABEL, shortDate, withoutVersion, type VersionGroup } from '@/features/admin-document-history/history'

const SUBJECT = { name: 'document history', plural: 'requests' }

const STATUS_CLASS: Record<string, string> = {
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
}

export default function DocumentHistoryPage() {
  const workerId = useParams().id as string
  const [groups, setGroups] = useState<VersionGroup[] | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState<{ title: string; text: string } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<DocumentVersion | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const out = await adminApi.listDocumentVersions(workerId, { cache: 'reload' })
    if (out.kind !== 'ok') {
      setError(out.kind === 'failed' && out.status === 404 ? { title: 'Worker not found', text: 'No worker has this id.' } : { title: noticeTitle(out, SUBJECT), text: noticeText(out) })
      return
    }
    setGroups(groupVersions(out.body.versions))
    setTruncated(out.body.truncated)
  }, [workerId])

  useEffect(() => {
    void load()
  }, [load])

  const open = async (v: DocumentVersion) => {
    // Opened before the await, so the browser does not treat it as a pop-up.
    const tab = window.open('', '_blank')
    setBusyId(v.id)
    const out = await adminApi.getDocumentVersionLink(v.id)
    setBusyId(null)
    if (out.kind === 'ok' && tab) {
      tab.opener = null
      tab.location.href = out.body.url
      return
    }
    tab?.close()
    setNotice(out.kind === 'ok' ? 'Your browser blocked the new tab. Allow pop-ups for this site and try again.' : out.kind === 'failed' && out.status === 404 ? 'This document has no file to open.' : noticeText(out))
  }

  const remove = async () => {
    const v = confirming
    if (!v) return
    setConfirming(null)
    setBusyId(v.id)
    const out = await adminApi.deleteDocumentVersion(v.id)
    setBusyId(null)
    if (out.kind === 'ok' || (out.kind === 'failed' && out.status === 404)) {
      // A 404 is a version already gone (another admin, or a repeat): the list drops it either way.
      setGroups((g) => (g ? withoutVersion(g, v.id) : g))
      setNotice(`Deleted ${v.fileName ?? v.name} (${shortDate(v.supersededAt)}).`)
      return
    }
    setNotice(`Not deleted: ${noticeText(out)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/admin/compliance/${workerId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Compliance Documents
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="w-7 h-7" />
            Document History
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Past documents this worker replaced or deleted, kept for seven years. The worker cannot see them.
          </p>
        </div>

        {notice && (
          <div role="status" className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-blue-700 hover:text-blue-900">
              Dismiss
            </button>
          </div>
        )}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-900">{error.title}</h2>
            <p className="mt-1 text-sm text-red-800">{error.text}</p>
            <button type="button" onClick={() => void load()} className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              Try again
            </button>
          </div>
        ) : groups === null ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-600 shadow">
            No past documents. Documents this worker replaces or deletes from now on will appear here.
          </div>
        ) : (
          <div className="space-y-6">
            {truncated && <p className="text-sm text-amber-800">Showing the newest 1,000 past documents.</p>}
            {groups.map((g) => (
              <section key={g.key} className="rounded-lg bg-white shadow">
                <header className="border-b border-gray-200 px-5 py-3">
                  <h2 className="font-semibold text-gray-900">{g.name}</h2>
                  {g.serviceName && <p className="text-xs text-gray-500">{g.serviceName}</p>}
                </header>
                <ul className="divide-y divide-gray-100">
                  {g.versions.map((v) => (
                    <li key={v.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-gray-900">{v.fileName ?? 'Document'}</span>
                          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[v.status] ?? 'bg-yellow-100 text-yellow-800'}`}>{v.status}</span>
                        </div>
                        <p className="text-gray-700">
                          {REASON_LABEL[v.reason]} on {shortDate(v.supersededAt)} · uploaded {shortDate(v.uploadedAt)}
                          {v.expiresAt && <> · expiry {shortDate(v.expiresAt)}</>}
                        </p>
                        {v.reviewedBy && (
                          <p className="text-gray-500">
                            Reviewed by {v.reviewedBy} on {shortDate(v.reviewedAt)}
                          </p>
                        )}
                        {v.rejectionReason && <p className="text-red-700">Rejected: {v.rejectionReason}</p>}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => void open(v)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </button>
                        <button
                          type="button"
                          disabled={busyId === v.id}
                          onClick={() => setConfirming(v)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-version-title">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 id="delete-version-title" className="text-lg font-semibold text-gray-900">
              Delete this past document?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {confirming.fileName ?? confirming.name} ({REASON_LABEL[confirming.reason].toLowerCase()} on {shortDate(confirming.supersededAt)}) and its file will be deleted for good. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirming(null)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={() => void remove()} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Delete for good
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
