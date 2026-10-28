'use client'

// admin-clients U2 (A3, A4): one service request as the admin sees it, and its status control. The change asks for
// confirmation first: the api tells the CRM (Zoho) of it.
import { useState } from 'react'
import Link from 'next/link'
import type { AdminServiceRequest } from '@remonta/api-contract'
import type { ServiceRequestStatus } from '@remonta/schemas/data/serviceRequests'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { SERVICE_REQUEST_STATUS_STYLE } from '@/features/service-requests/status'
import { detailRows, servicesText } from './requestDetails'
import { statusChoicesFor } from './statusChoices'

const date = (iso: string) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

export default function RequestCard({ request, onChangeStatus }: {
  request: AdminServiceRequest
  /** Resolves to a message when the change did not happen. */
  onChangeStatus: (requestId: string, status: ServiceRequestStatus) => Promise<string | null>
}) {
  const [chosen, setChosen] = useState<ServiceRequestStatus>(request.status)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const style = SERVICE_REQUEST_STATUS_STYLE[request.status]
  const rows = detailRows(request.details)

  const change = async () => {
    setConfirming(false)
    setSaving(true)
    const failed = await onChangeStatus(request.id, chosen)
    setSaving(false)
    setMessage(failed ?? 'Status changed.')
    if (failed) setChosen(request.status)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bgColor} ${style.textColor}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dotColor}`} />
            {style.label}
          </span>
          <ul className="mt-2 text-sm font-medium text-gray-900">
            {servicesText(request.services).map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="mt-1 text-sm text-gray-600">{request.location}</p>
          <p className="mt-1 text-xs text-gray-500">Requested {date(request.createdAt)} · updated {date(request.updatedAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={chosen}
            onChange={(e) => { setChosen(e.target.value as ServiceRequestStatus); setMessage(null) }}
            disabled={saving}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            aria-label="New status"
          >
            {statusChoicesFor(request.status).map((s) => <option key={s} value={s}>{SERVICE_REQUEST_STATUS_STYLE[s].label}</option>)}
          </select>
          <button
            onClick={() => setConfirming(true)}
            disabled={saving || chosen === request.status}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Changing…' : 'Change status'}
          </button>
        </div>
      </div>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}

      {request.assignedWorkers.length > 0 && (
        <p className="mt-3 text-sm text-gray-700">
          Assigned:{' '}
          {request.assignedWorkers.map((w, i) => (
            <span key={w.workerProfileId}>
              {i > 0 && ', '}
              <Link href={`/admin/contractors/${w.workerProfileId}`} className="text-indigo-700 hover:underline">{w.name}</Link>
            </span>
          ))}
        </p>
      )}

      {rows.length > 0 && (
        <dl className="mt-3 grid gap-x-6 gap-y-2 border-t border-gray-100 pt-3 text-sm sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label}>
              <dt className="text-xs text-gray-500">{r.label}</dt>
              <dd className="whitespace-pre-wrap text-gray-900">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={change}
        title="Change the request's status?"
        message={`Change this request from ${style.label} to ${SERVICE_REQUEST_STATUS_STYLE[chosen].label}? The CRM (Zoho) is told of the change.`}
        confirmText="Change status"
        cancelText="Cancel"
      />
    </div>
  )
}
