'use client'

import { MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface CompletedRequest {
  id: string
  participantName: string
  location: string
  title: string
  description: string | null
  createdAt: string // ISO string (serialized from server)
}

interface CompletedJobsListProps {
  requests: CompletedRequest[]
}

export default function CompletedJobsList({ requests }: CompletedJobsListProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-poppins font-medium">No completed jobs</p>
        <p className="text-gray-400 font-poppins text-sm mt-1">
          Completed service requests will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {requests.map((req) => {
        const date = new Date(req.createdAt).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        return (
          <div
            key={req.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card body */}
            <div className="p-4 flex flex-col gap-3">
              {/* Top: icon + title + status */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-poppins font-semibold text-gray-900 text-sm truncate">
                    {req.title}
                  </h3>
                  <p className="font-poppins text-xs text-gray-500 mt-0.5 truncate">
                    {req.participantName}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-poppins bg-green-50 text-green-700 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Completed
                </span>
              </div>

              {/* Description */}
              {req.description && (
                <p className="font-poppins text-sm text-gray-600 line-clamp-2">
                  {req.description}
                </p>
              )}

              {/* Location + date inline */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-poppins min-w-0">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{req.location}</span>
                </div>
                <p className="text-xs text-gray-400 font-poppins flex-shrink-0">{date}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
