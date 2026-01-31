'use client'

import { useState } from 'react'
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { BRAND_COLORS } from '@/lib/constants'
import { useWorkers } from '@/hooks/queries/useWorkers'
import Loader from '@/components/ui/Loader'

type ServiceRequestStatus = 'PENDING' | 'MATCHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

interface ServiceRequest {
  id: string
  participantName: string
  location: string
  assignedWorker: { name?: string; count?: number } | null
  status: ServiceRequestStatus
}

interface ManageRequestTableProps {
  requests: ServiceRequest[]
}

const statusConfig: Record<ServiceRequestStatus, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  PENDING: {
    label: 'Pending',
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
}

export default function ManageRequestTable({ requests }: ManageRequestTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)

  // Fetch workers data
  const { data, isLoading } = useWorkers({ page: 1, pageSize: 3 })

  const workers = data?.data.map(worker => ({
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    photo: worker.photo,
    role: worker.role,
    bio: worker.bio,
    skills: worker.skills,
    location: worker.location,
    isNdisCompliant: worker.isNdisCompliant,
  })) || []

  const openModal = (request: ServiceRequest) => {
    setSelectedRequest(request)
  }

  const closeModal = () => {
    setSelectedRequest(null)
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

          return (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              {/* Header: Participant + Status */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium text-gray-900 font-poppins">
                    {request.participantName}
                  </p>
                  <p className="text-sm text-gray-500 font-poppins">
                    {request.location}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-poppins flex-shrink-0 ${status.bgColor} ${status.textColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`}></span>
                  {status.label}
                </span>
              </div>

              {/* Assign Workers Link */}
              <button
                onClick={() => openModal(request)}
                className="text-sm font-medium font-poppins hover:underline bg-transparent border-none cursor-pointer"
                style={{ color: BRAND_COLORS.PRIMARY }}
              >
                Assign Workers
              </button>
            </div>
          )
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: BRAND_COLORS.TERTIARY }}>
                <th className="px-6 py-4 text-left text-sm font-medium font-poppins text-gray-900">
                  Participant
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium font-poppins text-gray-900">
                  Workers
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium font-poppins text-gray-900">
                  Status
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-200">
              {requests.map((request) => {
                const status = statusConfig[request.status]

                return (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    {/* Participant Column */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 font-poppins">
                          {request.participantName}
                        </p>
                        <p className="text-sm text-gray-500 font-poppins">
                          {request.location}
                        </p>
                      </div>
                    </td>

                    {/* Workers Column */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(request)}
                        className="text-sm font-medium font-poppins hover:underline bg-transparent border-none cursor-pointer"
                        style={{ color: BRAND_COLORS.PRIMARY }}
                      >
                        Assign Workers
                      </button>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium font-poppins ${status.bgColor} ${status.textColor}`}>
                        <span className={`w-2 h-2 rounded-full ${status.dotColor}`}></span>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workers Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto mt-4 sm:mt-8">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-lg sm:text-xl font-semibold font-poppins text-gray-900">
                  Assign Workers
                </h2>
                <p className="text-sm text-gray-500 font-poppins mt-1 truncate">
                  For {selectedRequest.participantName}
                </p>
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
                  No workers available
                </p>
              ) : (
                workers.map((worker) => {
                  const initials = `${worker.firstName.charAt(0)}${worker.lastName.charAt(0)}`.toUpperCase()
                  const displayName = `${worker.firstName}, ${worker.lastName.charAt(0)}.`

                  return (
                    <div
                      key={worker.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      {/* Header Section */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar */}
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

                        {/* Name, Role, Location, NDIS Badge */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-poppins font-semibold text-gray-900 text-base truncate">
                            {displayName}
                          </h3>
                          <p className="font-poppins text-sm text-gray-600 truncate">
                            {worker.role}
                          </p>
                          <p className="font-poppins text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{worker.location}</span>
                          </p>
                          {worker.isNdisCompliant && (
                            <p className="font-poppins text-sm text-green-600 mt-1">
                              NDIS Compliant
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="font-poppins text-sm text-gray-600 mb-3 line-clamp-2">
                        {worker.bio}
                      </p>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {worker.skills.slice(0, 4).map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 font-poppins text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {worker.skills.length > 4 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 font-poppins text-xs rounded-full">
                            +{worker.skills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Footer: Select Button */}
                      <div className="pt-3 border-t border-gray-100">
                        <button
                          className="px-4 py-2 text-sm font-medium font-poppins text-white rounded-lg transition-colors hover:opacity-90"
                          style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
                        >
                          Select
                        </button>
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
