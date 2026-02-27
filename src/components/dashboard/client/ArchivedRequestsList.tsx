'use client'

import { useState } from 'react'
import { MapPinIcon, ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ArchivedRequest {
  id: string
  participantName: string
  location: string
  title: string
  description: string | null
  createdAt: string // ISO string (serialized from server)
}

interface ArchivedRequestsListProps {
  initialRequests: ArchivedRequest[]
}

export default function ArchivedRequestsList({ initialRequests }: ArchivedRequestsListProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/client/service-request/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id))
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <ArchiveBoxIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-poppins font-medium">No archived requests</p>
        <p className="text-gray-400 font-poppins text-sm mt-1">
          Requests you archive will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {requests.map((req) => {
        const isConfirming = confirmingId === req.id
        const isDeleting = deletingId === req.id
        const date = new Date(req.createdAt).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        return (
          <div
            key={req.id}
            className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            {/* Top: icon + title + status */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <ArchiveBoxIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-poppins font-semibold text-gray-900 text-sm truncate">
                  {req.title}
                </h3>
                <p className="font-poppins text-xs text-gray-500 mt-0.5 truncate">
                  {req.participantName}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-poppins bg-gray-100 text-gray-500 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Archived
              </span>
            </div>

            {/* Description */}
            {req.description && (
              <p className="font-poppins text-sm text-gray-600 line-clamp-2">
                {req.description}
              </p>
            )}

            {/* Location */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-poppins">
              <MapPinIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{req.location}</span>
            </div>

            {/* Footer: date + delete */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400 font-poppins">{date}</p>

              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-poppins">Delete permanently?</span>
                  <button
                    onClick={() => handleDelete(req.id)}
                    disabled={isDeleting}
                    className="text-xs font-poppins font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="text-xs font-poppins text-gray-400 hover:text-gray-600"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(req.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-poppins text-gray-400 hover:text-red-500 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
