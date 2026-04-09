'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import Loader from '@/components/ui/Loader'
import WorkerAvatar from '@/components/ui/WorkerAvatar'

// Dynamically import components to avoid SSR issues
const ContractorsPage = dynamic(
  () => import('../AdminDashboardClient'),
  {
    ssr: false,
    loading: () => <PageLoader />
  }
)

const ReportsPage = dynamic(
  () => import('./ReportsContent'),
  {
    ssr: false,
    loading: () => <PageLoader />
  }
)

const CheckCompliancePage = dynamic(
  () => import('./CheckComplianceContent'),
  {
    ssr: false,
    loading: () => <PageLoader />
  }
)

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size="lg" />
    </div>
  )
}

function ManageContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'contractors'

  const renderContent = () => {
    switch (tab) {
      case 'contractors':
        return <ContractorsPage />
      case 'clients':
        return <ClientsPlaceholder />
      case 'support-coordinators':
        return <SupportCoordinatorsPlaceholder />
      case 'check-compliance':
        return <CheckCompliancePage />
      case 'reports':
        return <ReportsPage />
      case 'search-by-ai':
        return <SearchByAIPlaceholder />
      default:
        return <ContractorsPage />
    }
  }

  return renderContent()
}

// Placeholder components for pages not yet implemented
function ClientsPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-600">Manage client profiles</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Clients management coming soon...</p>
        </div>
      </div>
    </div>
  )
}

function SupportCoordinatorsPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Coordinators</h1>
          <p className="mt-2 text-sm text-gray-600">Manage support coordinator profiles</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">Support coordinators management coming soon...</p>
        </div>
      </div>
    </div>
  )
}

interface AIWorker {
  id: string
  firstName: string
  lastName: string
  location: string | null
  languages: string[]
  photos: string | null
  experience: string | null
  hasVehicle: boolean | null
  introduction: string | null
  services: string[]
}

function SearchByAIPlaceholder() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [workers, setWorkers] = useState<AIWorker[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setWorkers([])
    setError(null)
    setSelectedWorker(null)
    try {
      // Call the n8n webhook
      const webhookRes = await fetch('/api/admin/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const webhookData = await webhookRes.json()

      // Parse workerList from response: [{workerList: [{id, name}, ...]}]
      const workerList: { id: string; name: string }[] = webhookData?.[0]?.workerList ?? []

      if (workerList.length === 0) {
        setWorkers([])
        return
      }

      // Fetch each worker by ID in parallel
      const results = await Promise.all(
        workerList.map((w) =>
          fetch(`/api/admin/contractors/${w.id}`)
            .then((r) => r.json())
            .then((r) => (r.success ? (r.data as AIWorker) : null))
            .catch(() => null)
        )
      )

      setWorkers(results.filter(Boolean) as AIWorker[])
    } catch {
      setError('Failed to reach the AI search service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search by AI</h1>
          <p className="mt-2 text-sm text-gray-600">Use AI to search and find contractors, clients, and more</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 placeholder-gray-400 text-sm"
            placeholder="Describe what you're looking for... e.g. 'Find all contractors with plumbing experience in Sydney who are NDIS registered'"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {!loading && workers.length > 0 && (
          <div className="mt-8">
            <p className="text-lg font-semibold text-gray-900 mb-4">
              {workers.length} contractor{workers.length !== 1 ? 's' : ''} found
            </p>
            <div className="space-y-3">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-lg border-2 border-amber-400 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <WorkerAvatar
                      photo={worker.photos}
                      firstName={worker.firstName}
                      lastName={worker.lastName}
                      size={80}
                      className="border-2 border-white shadow"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {worker.firstName} {worker.lastName?.[0]}.
                      </h3>

                      {/* Services */}
                      {worker.services && worker.services.length > 0 && (
                        <p className="text-xs text-gray-600 mb-2">
                          {worker.services.join(' / ')}
                        </p>
                      )}

                      {/* Details Row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        {worker.location && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {worker.location}
                          </span>
                        )}
                        {worker.languages && worker.languages.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            {worker.languages.join(', ')}
                          </span>
                        )}
                        {worker.hasVehicle && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h10l2-2z" />
                            </svg>
                            Has vehicle
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <a
                          href={`/admin/contractors/${worker.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Profile
                        </a>
                        <a
                          href={`/admin/compliance/${worker.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Show Compliance
                        </a>
                        <button
                          onClick={() => setSelectedWorker(selectedWorker === worker.id ? null : worker.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Introduction
                        </button>
                      </div>

                      {/* Introduction expandable */}
                      {selectedWorker === worker.id && worker.introduction && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                          {worker.introduction}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && workers.length === 0 && !error && query && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No contractors found for your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ManagePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ManageContent />
    </Suspense>
  )
}
