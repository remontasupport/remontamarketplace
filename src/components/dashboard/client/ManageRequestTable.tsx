'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, MapPinIcon, CheckIcon } from '@heroicons/react/24/outline'
import { BRAND_COLORS } from '@/lib/constants'
import Loader from '@/components/ui/Loader'

type ServiceRequestStatus = 'PENDING' | 'MATCHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'

interface Worker {
  id: string
  userId: string
  firstName: string
  lastName: string
  photo: string | null
  role: string
  bio: string
  skills: string[]
  location: string
  isNdisCompliant: boolean
}

interface ServiceRequest {
  id: string
  participantId: string
  participantName: string
  location: string
  assignedWorkerIds: string[]
  selectedWorkers: string[]
  status: ServiceRequestStatus
}

interface ManageRequestTableProps {
  requests: ServiceRequest[]
  basePath: string
}

const statusConfig: Record<ServiceRequestStatus, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  PENDING: {
    label: 'Matching',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    dotColor: 'bg-yellow-500',
  },
  MATCHED: {
    label: 'Matched',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
  ACTIVE: {
    label: 'Active',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    dotColor: 'bg-green-500',
  },
  COMPLETED: {
    label: 'Completed',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    dotColor: 'bg-gray-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    dotColor: 'bg-red-500',
  },
  ARCHIVED: {
    label: 'Archived',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-400',
    dotColor: 'bg-gray-400',
  },
}

export default function ManageRequestTable({ requests: initialRequests, basePath }: ManageRequestTableProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState<string | null>(null)

  // Local pending selection — only saved to DB on Confirm
  const [pendingWorkers, setPendingWorkers] = useState<string[]>([])

  const openModal = async (request: ServiceRequest) => {
    setSelectedRequest(request)
    setPendingWorkers(request.selectedWorkers)
    setWorkers([])

    const idsToFetch = request.assignedWorkerIds ?? []
    if (idsToFetch.length === 0) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/client/workers/by-ids?ids=${idsToFetch.join(',')}`)
      const json = await res.json()
      if (json.success) setWorkers(json.data)
    } catch {
      // silently fail — modal shows empty state
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedRequest(null)
    setWorkers([])
    setPendingWorkers([])
  }

  // Add to pending selection locally — no API call
  const handleSelectWorker = (workerId: string) => {
    setPendingWorkers((prev) =>
      prev.includes(workerId) ? prev : [...prev, workerId]
    )
  }

  // Remove instantly — immediate API call
  const handleRemoveWorker = async (workerId: string) => {
    if (!selectedRequest) return
    setIsRemoving(workerId)
    try {
      const res = await fetch(`/api/client/service-request/${selectedRequest.id}/select-worker`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId }),
      })
      const json = await res.json()
      if (json.success) {
        const updated = selectedRequest.selectedWorkers.filter((w) => w !== workerId)
        setPendingWorkers((prev) => prev.filter((w) => w !== workerId))
        setSelectedRequest((prev) => prev ? { ...prev, selectedWorkers: updated } : prev)
        setRequests((prev) =>
          prev.map((r) => r.id === selectedRequest.id ? { ...r, selectedWorkers: updated } : r)
        )
      }
    } catch {
      // silently fail
    } finally {
      setIsRemoving(null)
    }
  }

  // Single API call on Confirm
  const handleConfirm = async () => {
    if (!selectedRequest) return
    setIsConfirming(true)
    try {
      const res = await fetch(`/api/client/service-request/${selectedRequest.id}/select-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerIds: pendingWorkers }),
      })
      const json = await res.json()
      if (json.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id ? { ...r, selectedWorkers: pendingWorkers } : r
          )
        )
        closeModal()
      }
    } catch {
      // silently fail
    } finally {
      setIsConfirming(false)
    }
  }

  const handleArchive = async (requestId: string) => {
    setIsArchiving(requestId)
    try {
      const res = await fetch(`/api/client/service-request/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
      const json = await res.json()
      if (json.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId))
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
      <div className="md:hidden space-y-4">
        {requests.map((request) => {
          const status = statusConfig[request.status]
          const selectedCount = request.selectedWorkers.length

          return (
            <div
              key={request.id}
              onClick={() => router.push(`${basePath}/request-service/edit/${request.participantId}`)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="font-medium text-gray-900 font-poppins">{request.participantName}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-poppins ${status.bgColor} ${status.textColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
                    {status.label}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArchive(request.id); }}
                    disabled={isArchiving === request.id}
                    className="text-xs font-poppins text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {isArchiving === request.id ? 'Archiving...' : 'Archive'}
                  </button>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); openModal(request); }}
                disabled={request.assignedWorkerIds.length === 0}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-poppins transition-opacity ${request.assignedWorkerIds.length === 0 ? 'bg-green-50 text-green-700 opacity-40 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:opacity-80 cursor-pointer'}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {selectedCount > 0 ? `${selectedCount} Worker${selectedCount > 1 ? 's' : ''} Selected` : 'Choose Your Workers'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
              <th className="px-6 py-4 text-center text-sm font-medium font-poppins text-gray-900">Participant</th>
              <th className="px-6 py-4 text-center text-sm font-medium font-poppins text-gray-900">Workers</th>
              <th className="px-6 py-4 text-center text-sm font-medium font-poppins text-gray-900">Status</th>
              <th className="px-6 py-4 text-center text-sm font-medium font-poppins text-gray-900"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => {
              const status = statusConfig[request.status]
              const selectedCount = request.selectedWorkers.length

              return (
                <tr
                  key={request.id}
                  onClick={() => router.push(`${basePath}/request-service/edit/${request.participantId}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-5 text-center">
                    <p className="font-medium text-gray-900 font-poppins">{request.participantName}</p>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(request); }}
                      disabled={request.assignedWorkerIds.length === 0}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium font-poppins transition-opacity ${request.assignedWorkerIds.length === 0 ? 'bg-green-50 text-green-700 opacity-40 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:opacity-80 cursor-pointer'}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {selectedCount > 0 ? `${selectedCount} Worker${selectedCount > 1 ? 's' : ''} Selected` : 'Choose Your Workers'}
                    </button>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium font-poppins ${status.bgColor} ${status.textColor}`}>
                      <span className={`w-2 h-2 rounded-full ${status.dotColor}`}></span>
                      {status.label}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleArchive(request.id); }}
                      disabled={isArchiving === request.id}
                      className="text-sm font-poppins text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {isArchiving === request.id ? 'Archiving...' : 'Archive'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Workers Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto mt-4 sm:mt-8">
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-lg sm:text-xl font-semibold font-poppins text-gray-900">
                  Choose one or more workers you want to connect with
                </h2>
                {pendingWorkers.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={handleConfirm}
                      disabled={isConfirming}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium font-poppins text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed self-start"
                      style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                    >
                      {isConfirming ? 'Saving...' : 'Confirm'}
                      {!isConfirming && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-xs font-semibold" style={{ color: BRAND_COLORS.PRIMARY }}>
                          {pendingWorkers.length}
                        </span>
                      )}
                    </button>
                    <p className="text-base text-gray-700 font-poppins">
                      Your selected workers will be notified and can review your request before accepting.
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Worker Cards */}
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader size="md" />
                </div>
              ) : workers.length === 0 ? (
                <p className="text-center text-gray-500 font-poppins py-8">
                  No workers assigned yet
                </p>
              ) : (
                workers.map((worker) => {
                  const isSelected = pendingWorkers.includes(worker.id)
                  const initials = `${worker.firstName.charAt(0)}${worker.lastName.charAt(0)}`.toUpperCase()
                  const displayName = `${worker.firstName}, ${worker.lastName.charAt(0)}.`

                  return (
                    <div
                      key={worker.id}
                      className={`bg-white border rounded-xl p-5 transition-all hover:shadow-md ${isSelected ? 'border-green-400 bg-green-50/30' : 'border-gray-200'}`}
                    >
                      {/* Header Section */}
                      <div className="flex items-start gap-3 mb-3">
                        {worker.photo ? (
                          <img
                            src={worker.photo}
                            alt={displayName}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-poppins font-semibold text-sm flex-shrink-0"
                            style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                          >
                            {initials}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-poppins font-semibold text-gray-900 text-base truncate">
                              {displayName}
                            </h3>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-poppins font-medium flex-shrink-0">
                                <CheckIcon className="w-3 h-3" />
                                Selected
                              </span>
                            )}
                          </div>
                          <p className="font-poppins text-sm text-gray-600 truncate">{worker.role}</p>
                          <p className="font-poppins text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{worker.location}</span>
                          </p>
                          {worker.isNdisCompliant && (
                            <p className="font-poppins text-sm text-green-600 mt-1">NDIS Compliant</p>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="font-poppins text-sm text-gray-600 mb-3 line-clamp-2">{worker.bio}</p>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {worker.skills.slice(0, 4).map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 font-poppins text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {worker.skills.length > 4 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 font-poppins text-xs rounded-full">
                            +{worker.skills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                        {isSelected ? (
                          <button
                            onClick={() => handleRemoveWorker(worker.id)}
                            disabled={isRemoving === worker.id}
                            className="px-4 py-2 text-sm font-medium font-poppins text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500"
                          >
                            {isRemoving === worker.id ? 'Removing...' : 'Remove'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectWorker(worker.id)}
                            className="px-4 py-2 text-sm font-medium font-poppins text-white rounded-lg transition-colors hover:opacity-90"
                            style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                          >
                            Select
                          </button>
                        )}
                        <a
                          href={`/workers/${worker.userId}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium font-poppins rounded-lg border transition-colors hover:bg-gray-50"
                          style={{ borderColor: BRAND_COLORS.PRIMARY, color: BRAND_COLORS.PRIMARY }}
                        >
                          Show more details
                        </a>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
