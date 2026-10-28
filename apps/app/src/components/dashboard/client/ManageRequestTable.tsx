'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArchiveBoxArrowDownIcon, XCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { BRAND_COLORS } from '@/lib/constants'
import { SERVICE_REQUEST_STATUS_STYLE as statusConfig, type ServiceRequestStatus } from '@/features/service-requests/status'


const SERVICE_LABEL_MAP: Record<string, string> = {
  'Support Worker': 'Support Work',
  'Support Worker (High Intensity)': 'Support Work (High Intensity)',
  'Cleaning Services': 'Cleaning',
  'Home and Yard Maintenance': 'Home & Yard',
  'Therapeutic Supports': 'Therapeutic',
  'Nursing Services': 'Nursing',
}

function formatServiceLabel(service: string): string {
  return SERVICE_LABEL_MAP[service] ?? service
}

interface ServiceRequest {
  id: string
  participantId: string
  participantName: string
  primaryService?: string
  location: string
  assignedWorkerIds: string[]
  selectedWorkers: string[]
  status: ServiceRequestStatus
  zohoRecordId?: string | null
}

interface ManageRequestTableProps {
  requests: ServiceRequest[]
  basePath: string
  showRequestType?: boolean
}

// Statuses whose name does not link to the edit page
const NOT_EDITABLE: ServiceRequestStatus[] = ['CANCELLED', 'COMPLETED']

export default function ManageRequestTable({ requests: initialRequests, basePath, showRequestType = false }: ManageRequestTableProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [isArchiving, setIsArchiving] = useState<string | null>(null)
  const [isCancellingRequest, setIsCancellingRequest] = useState<string | null>(null)

  // Archive confirmation modal
  const [archiveTarget, setArchiveTarget] = useState<ServiceRequest | null>(null)

  // Cancel confirmation modal (ACTIVE requests only)
  const [cancelTarget, setCancelTarget] = useState<ServiceRequest | null>(null)

  const closeCancelModal = () => {
    setCancelTarget(null)
  }

  const handleCancel = (request: ServiceRequest) => {
    if (request.status !== 'ACTIVE') {
      submitCancel(request.id)
      return
    }
    setCancelTarget(request)
  }

  const fireActionWebhook = (action: 'Cancel' | 'Archive', requestId: string) => {
    fetch('/api/client/service-request/action-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, requestId }),
    }).catch(() => {})
  }

  const submitCancel = async (requestId: string) => {
    setIsCancellingRequest(requestId)
    try {
      const res = await fetch(`/api/client/service-request/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      const json = await res.json()
      if (json.success) {
        setRequests((prev) =>
          prev.map((r) => r.id === requestId ? { ...r, status: 'CANCELLED' as ServiceRequestStatus } : r)
        )
        closeCancelModal()
        router.refresh()
      }
    } catch {
      // silently fail
    } finally {
      setIsCancellingRequest(null)
    }
  }

  const submitArchive = async () => {
    if (!archiveTarget) return
    setIsArchiving(archiveTarget.id)
    const targetId = archiveTarget.id
    try {
      const res = await fetch(`/api/client/service-request/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
      const json = await res.json()
      if (json.success) {
        fireActionWebhook('Archive', targetId)
        setRequests((prev) => prev.filter((r) => r.id !== targetId))
        setArchiveTarget(null)
      }
    } catch {
      // silently fail
    } finally {
      setIsArchiving(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500 font-poppins">No service requests found.</p>
        <p className="text-gray-400 font-poppins text-sm mt-2">
          Create a service request to get started.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {requests.map((request) => {
          const status = statusConfig[request.status]

          return (
            <div
              key={request.id}
              className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${request.status === 'CANCELLED' ? 'opacity-60' : ''}`}
            >
              {/* Card body */}
              <div className="p-4">
                {/* Name + status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <button
                    onClick={() => !NOT_EDITABLE.includes(request.status) && router.push(`${basePath}/request-service/edit/${request.id}`)}
                    className={`font-semibold font-poppins text-base text-left leading-snug ${NOT_EDITABLE.includes(request.status) ? 'text-gray-900 cursor-default' : 'text-gray-900 hover:underline cursor-pointer'}`}
                  >
                    {showRequestType ? formatServiceLabel(request.primaryService || '') || 'Service Request' : request.participantName}
                  </button>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-poppins flex-shrink-0 ${status.bgColor} ${status.textColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Action footer — a completed request can only be archived */}
              <div className="border-t border-gray-100 bg-gray-50 px-2 py-1 flex items-center">
                {request.status !== 'COMPLETED' && (
                  <>
                    <button
                      onClick={() => router.push(`${basePath}/request-service/edit/${request.id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium font-poppins text-gray-500 hover:text-blue-600 rounded-lg transition-colors hover:bg-white"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Edit
                    </button>

                    <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

                    {request.status !== 'CANCELLED' && (
                      <>
                        <button
                          onClick={() => handleCancel(request)}
                          disabled={isCancellingRequest === request.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium font-poppins text-gray-500 hover:text-red-500 rounded-lg transition-colors hover:bg-white disabled:opacity-50"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          {isCancellingRequest === request.id ? 'Cancelling…' : 'Cancel'}
                        </button>

                        {request.status !== 'ACTIVE' && <div className="w-px h-5 bg-gray-200 flex-shrink-0" />}
                      </>
                    )}
                  </>
                )}

                {/* An active request cannot be archived */}
                {request.status !== 'ACTIVE' && (
                  <button
                    onClick={() => setArchiveTarget(request)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium font-poppins text-gray-500 hover:text-orange-500 rounded-lg transition-colors hover:bg-white"
                  >
                    <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                    Archive
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
              <th className="px-6 py-4 text-center text-sm font-medium font-poppins text-gray-900">{showRequestType ? 'Request Type' : 'Participant'}</th>
              <th className="px-6 py-4 text-center text-sm font-medium font-poppins text-gray-900">Status</th>
              <th className="px-6 py-4 text-center text-sm font-medium font-poppins text-gray-900">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => {
              const status = statusConfig[request.status]

              return (
                <tr
                  key={request.id}
                  className={`transition-colors ${request.status === 'CANCELLED' ? 'opacity-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => !NOT_EDITABLE.includes(request.status) && router.push(`${basePath}/request-service/edit/${request.id}`)}
                      className={`font-medium font-poppins ${NOT_EDITABLE.includes(request.status) ? 'text-gray-900 cursor-default' : 'text-gray-900 hover:underline cursor-pointer'}`}
                    >
                      {showRequestType ? formatServiceLabel(request.primaryService || '') || 'Service Request' : request.participantName}
                    </button>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium font-poppins ${status.bgColor} ${status.textColor}`}>
                      <span className={`w-2 h-2 rounded-full ${status.dotColor}`}></span>
                      {status.label}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-4">
                      {request.status !== 'CANCELLED' && request.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCancel(request)}
                          disabled={isCancellingRequest === request.id}
                          className="inline-flex items-center gap-1.5 text-sm font-poppins text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          {isCancellingRequest === request.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                      {request.status !== 'COMPLETED' && (
                        <button
                          onClick={() => router.push(`${basePath}/request-service/edit/${request.id}`)}
                          className="inline-flex items-center gap-1.5 text-sm font-poppins text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {request.status !== 'ACTIVE' && (
                        <button
                          onClick={() => setArchiveTarget(request)}
                          className="inline-flex items-center gap-1.5 text-sm font-poppins text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setArchiveTarget(null)} />

          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <ArchiveBoxArrowDownIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold font-poppins text-gray-900">Archive Request?</h2>
                <p className="text-sm text-gray-500 font-poppins">For {archiveTarget.participantName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 font-poppins mb-6">
              This will archive the service request and remove it from your active list. You'll need to create another request for this client.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setArchiveTarget(null)}
                className="px-4 py-2 text-sm font-medium font-poppins text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={submitArchive}
                disabled={isArchiving === archiveTarget.id}
                className="px-4 py-2 text-sm font-medium font-poppins text-white rounded-lg bg-orange-500 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isArchiving === archiveTarget.id ? 'Archiving...' : 'Yes, Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active request: cancelling goes through Remonta, so the modal only says whom to contact */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={closeCancelModal} />

          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold font-poppins text-gray-900">Cancel Active Request?</h2>
                <p className="text-sm text-gray-500 font-poppins">For {cancelTarget.participantName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 font-poppins mb-6">
              Please contact{' '}
              <a href="mailto:jesse.b@remontaservices.com.au" className="font-medium underline" style={{ color: BRAND_COLORS.PRIMARY }}>
                jesse.b@remontaservices.com.au
              </a>{' '}
              to proceed the cancellation
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 text-sm font-medium font-poppins text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={closeCancelModal}
                className="px-4 py-2 text-sm font-medium font-poppins text-white rounded-lg hover:opacity-90 transition-colors"
                style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
