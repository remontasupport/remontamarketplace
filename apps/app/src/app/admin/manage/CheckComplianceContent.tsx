'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, User, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import WorkerAvatar from '@/components/ui/WorkerAvatar'

interface SubmittedDocument {
  id: string
  requirementName: string
  requirementType: string
  submittedAt: string | null
}

interface WorkerWithSubmissions {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  mobile: string | null
  photos: string | null
  isPublished: boolean
  createdAt: string
  totalDocuments: number
  submittedCount: number
  submittedDocuments: SubmittedDocument[]
  oldestSubmission: string | null
  newestSubmission: string | null
}

interface ComplianceData {
  workers: WorkerWithSubmissions[]
  total: number
  totalSubmittedDocuments: number
}

interface CompliantWorker {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  mobile: string | null
  photos: string | null
  isPublished: boolean
  createdAt: string
  publishedAt: string | null
}

interface CompliantData {
  workers: CompliantWorker[]
  total: number
}

type ActiveView = 'pending' | 'compliant'

const PAGE_SIZE = 10

export default function CheckComplianceContent() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [compliantData, setCompliantData] = useState<CompliantData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCompliant, setIsLoadingCompliant] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toggleOpenFor, setToggleOpenFor] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('pending')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingPage, setPendingPage] = useState(1)
  const [compliantPage, setCompliantPage] = useState(1)

  useEffect(() => {
    fetchPendingCompliance()
    fetchCompliantWorkers()
  }, [])

  const fetchPendingCompliance = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/compliance/pending')
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load compliance data')
      }
    } catch (err) {
      setError('Failed to load compliance data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCompliantWorkers = async () => {
    setIsLoadingCompliant(true)
    try {
      const response = await fetch('/api/admin/compliance/compliant')
      const result = await response.json()

      if (result.success) {
        setCompliantData(result.data)
      }
    } catch (err) {
      console.error('Failed to load compliant workers')
    } finally {
      setIsLoadingCompliant(false)
    }
  }

  const handleTogglePublished = async (workerId: string, newStatus: boolean, fromView: 'pending' | 'compliant') => {
    setIsUpdating(workerId)
    try {
      const response = await fetch(`/api/admin/compliance/${workerId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newStatus }),
      })
      const result = await response.json()

      if (result.success) {
        // Update local state for pending workers
        setData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            workers: prev.workers.map(w =>
              w.id === workerId ? { ...w, isPublished: newStatus } : w
            )
          }
        })
        // Update local state for compliant workers
        setCompliantData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            workers: prev.workers.map(w =>
              w.id === workerId ? { ...w, isPublished: newStatus } : w
            )
          }
        })
        setToggleOpenFor(null)
        // Refresh both lists to get accurate counts
        fetchPendingCompliance()
        fetchCompliantWorkers()
      } else {
        alert(`Failed to update status: ${result.error}`)
      }
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setIsUpdating(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
    setPendingPage(1)
    setCompliantPage(1)
  }

  const filterWorkers = (query: string) => (w: { firstName: string | null; lastName: string | null; email: string | null }) => {
    if (!query) return true
    const q = query.toLowerCase()
    const name = `${w.firstName ?? ''} ${w.lastName ?? ''}`.toLowerCase()
    const email = (w.email ?? '').toLowerCase()
    return name.includes(q) || email.includes(q)
  }

  const filteredPendingWorkers = data?.workers.filter(filterWorkers(searchQuery)) ?? []
  const filteredCompliantWorkers = compliantData?.workers.filter(filterWorkers(searchQuery)) ?? []

  const pendingTotalPages = Math.max(1, Math.ceil(filteredPendingWorkers.length / PAGE_SIZE))
  const compliantTotalPages = Math.max(1, Math.ceil(filteredCompliantWorkers.length / PAGE_SIZE))
  const pagedPendingWorkers = filteredPendingWorkers.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE)
  const pagedCompliantWorkers = filteredCompliantWorkers.slice((compliantPage - 1) * PAGE_SIZE, compliantPage * PAGE_SIZE)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Loading pending compliance...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchPendingCompliance}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Check Compliance</h1>
          <p className="mt-2 text-sm text-gray-600">Review workers with pending document submissions</p>
        </div>

        {/* Stats Cards - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveView('pending')}
            className={`bg-white rounded-lg shadow p-6 text-left transition-all ${
              activeView === 'pending'
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Workers Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setActiveView('compliant')}
            className={`bg-white rounded-lg shadow p-6 text-left transition-all ${
              activeView === 'compliant'
                ? 'ring-2 ring-green-500 shadow-lg'
                : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Compliant Ready</p>
                <p className="text-2xl font-bold text-gray-900">{compliantData?.total || 0}</p>
              </div>
            </div>
          </button>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Documents to Review</p>
                <p className="text-2xl font-bold text-gray-900">{data?.totalSubmittedDocuments || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchQuery(''); setPendingPage(1); setCompliantPage(1) }}
              className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>

        {/* Pending Workers Table */}
        {activeView === 'pending' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Workers with Pending Documents</h2>
            </div>

            {!data || data.workers.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-500">No workers have pending documents for review.</p>
              </div>
            ) : filteredPendingWorkers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No workers match &quot;{searchQuery}&quot;.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Worker
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending Docs
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagedPendingWorkers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50 group">
                        {/* Worker Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <WorkerAvatar
                              photo={worker.photos}
                              firstName={worker.firstName ?? ''}
                              lastName={worker.lastName ?? ''}
                              size={40}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {worker.firstName} {worker.lastName}
                              </p>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setToggleOpenFor(toggleOpenFor === worker.id ? null : worker.id)
                                  }}
                                  disabled={isUpdating === worker.id}
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                                    worker.isPublished
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  } ${isUpdating === worker.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {isUpdating === worker.id
                                    ? 'Updating...'
                                    : worker.isPublished
                                      ? 'Compliance Verified'
                                      : 'Compliance Not Verified'}
                                </button>
                                {toggleOpenFor === worker.id && (
                                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[160px]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleTogglePublished(worker.id, !worker.isPublished, 'pending')
                                      }}
                                      disabled={isUpdating === worker.id}
                                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                        worker.isPublished
                                          ? 'text-yellow-700 hover:bg-yellow-50'
                                          : 'text-green-700 hover:bg-green-50'
                                      } disabled:opacity-50`}
                                    >
                                      {worker.isPublished ? 'Mark as Not Verified' : 'Verify Compliance'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {worker.email && (
                              <p className="text-gray-900 truncate max-w-[200px]">{worker.email}</p>
                            )}
                            {worker.mobile && (
                              <p className="text-gray-500">{worker.mobile}</p>
                            )}
                          </div>
                        </td>

                        {/* Pending Count */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            {worker.submittedCount}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                          <Link
                            href={`/admin/compliance/${worker.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            Review
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredPendingWorkers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(pendingPage - 1) * PAGE_SIZE + 1}–{Math.min(pendingPage * PAGE_SIZE, filteredPendingWorkers.length)} of {filteredPendingWorkers.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPendingPage(p => p - 1)}
                    disabled={pendingPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {pendingPage} of {pendingTotalPages}</span>
                  <button
                    onClick={() => setPendingPage(p => p + 1)}
                    disabled={pendingPage === pendingTotalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliant Workers Table */}
        {activeView === 'compliant' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Compliant Ready Workers</h2>
            </div>

            {isLoadingCompliant ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Loading compliant workers...</p>
              </div>
            ) : !compliantData || compliantData.workers.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No compliant workers yet</h3>
                <p className="text-gray-500">Workers will appear here once their compliance is verified.</p>
              </div>
            ) : filteredCompliantWorkers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No workers match &quot;{searchQuery}&quot;.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Worker
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verified Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagedCompliantWorkers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50 group">
                        {/* Worker Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <WorkerAvatar
                              photo={worker.photos}
                              firstName={worker.firstName ?? ''}
                              lastName={worker.lastName ?? ''}
                              size={40}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {worker.firstName} {worker.lastName}
                              </p>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setToggleOpenFor(toggleOpenFor === `compliant-${worker.id}` ? null : `compliant-${worker.id}`)
                                  }}
                                  disabled={isUpdating === worker.id}
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors bg-green-100 text-green-700 hover:bg-green-200 ${
                                    isUpdating === worker.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                  }`}
                                >
                                  {isUpdating === worker.id ? 'Updating...' : 'Compliance Verified'}
                                </button>
                                {toggleOpenFor === `compliant-${worker.id}` && (
                                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 min-w-[160px]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleTogglePublished(worker.id, false, 'compliant')
                                      }}
                                      disabled={isUpdating === worker.id}
                                      className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                                    >
                                      Mark as Not Verified
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {worker.email && (
                              <p className="text-gray-900 truncate max-w-[200px]">{worker.email}</p>
                            )}
                            {worker.mobile && (
                              <p className="text-gray-500">{worker.mobile}</p>
                            )}
                          </div>
                        </td>

                        {/* Verified Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <p className="text-gray-900">{formatDate(worker.publishedAt || worker.createdAt)}</p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                          <Link
                            href={`/admin/compliance/${worker.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            View
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredCompliantWorkers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(compliantPage - 1) * PAGE_SIZE + 1}–{Math.min(compliantPage * PAGE_SIZE, filteredCompliantWorkers.length)} of {filteredCompliantWorkers.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCompliantPage(p => p - 1)}
                    disabled={compliantPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {compliantPage} of {compliantTotalPages}</span>
                  <button
                    onClick={() => setCompliantPage(p => p + 1)}
                    disabled={compliantPage === compliantTotalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
