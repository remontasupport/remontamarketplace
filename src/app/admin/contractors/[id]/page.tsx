'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, User, Briefcase, Heart } from 'lucide-react'

interface WorkerProfile {
  id: string
  firstName: string
  lastName: string
  age: number | null
  location: string | null
  experience: string | null
  introduction: string | null
  qualifications: string | null
  hasVehicle: string | null
  funFact: string | null
  hobbies: string | null
  uniqueService: string | null
  whyEnjoyWork: string | null
  additionalInfo: string | null
  photos: string[]
}

interface ApiResponse {
  success: boolean
  data: WorkerProfile
  error?: string
}

export default function WorkerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workerId = params.id as string

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/contractors/${workerId}`)
      if (!res.ok) throw new Error('Failed to fetch worker')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Loading worker profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">Failed to load worker profile</p>
          </div>
        </div>
      </div>
    )
  }

  const worker = data.data

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contractors
          </button>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {worker.firstName} {worker.lastName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Worker Profile Details</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Full Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.firstName} {worker.lastName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.age || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Has Vehicle</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.hasVehicle || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Location */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Location
              </h2>
              <p className="text-sm text-gray-900">{worker.location || 'N/A'}</p>
            </div>

            {/* Introduction & Experience */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Professional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Introduction</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.introduction || 'No introduction provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Experience</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.experience || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Qualifications</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.qualifications || 'N/A'}</dd>
                </div>
              </div>
            </div>

            {/* Personal Touch */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Heart className="mr-2 h-5 w-5" />
                Personal Touch
              </h2>
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fun Fact</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.funFact || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hobbies</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.hobbies || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Unique Service</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.uniqueService || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Why I Enjoy This Work</dt>
                  <dd className="mt-1 text-sm text-gray-900">{worker.whyEnjoyWork || 'N/A'}</dd>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {worker.additionalInfo && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                <p className="text-sm text-gray-900">{worker.additionalInfo}</p>
              </div>
            )}
          </div>

          {/* Right Column - Photos & Info */}
          <div className="space-y-6">
            {/* Photos */}
            {worker.photos && worker.photos.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
                <div className="grid grid-cols-2 gap-4">
                  {worker.photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile ID</h2>
              <p className="text-sm text-gray-900 font-mono break-all">{worker.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
