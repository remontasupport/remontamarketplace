'use client'

import WorkerCard from './WorkerCard'

export interface Worker {
  id: string
  firstName: string
  lastName: string
  photo?: string | null
  role: string
  bio: string
  skills: string[]
  location: string
  isNdisCompliant?: boolean
}

interface WorkerCardGridProps {
  workers: Worker[]
  onViewProfile?: (id: string) => void
  onContact?: (id: string) => void
  isLoading?: boolean
}

export default function WorkerCardGrid({
  workers,
  onViewProfile,
  onContact,
  isLoading = false,
}: WorkerCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div>
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded mb-3" />
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-6 w-24 bg-gray-200 rounded-full" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-gray-200 rounded-lg" />
                <div className="h-9 w-20 bg-gray-200 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-poppins text-gray-500">
          No support workers found. Try adjusting your search.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {workers.map((worker) => (
        <WorkerCard
          key={worker.id}
          {...worker}
          onViewProfile={onViewProfile}
          onContact={onContact}
        />
      ))}
    </div>
  )
}
