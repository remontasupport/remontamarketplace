'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, User, Clock, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

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

export default function CheckComplianceContent() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [compliantData, setCompliantData] = useState<CompliantData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCompliant, setIsLoadingCompliant] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toggleOpenFor, setToggleOpenFor] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('pending')

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

  const getTimeSinceSubmission = (dateString: string | null) => {
    if (!dateString) return null
    const submitted = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - submitted.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ago`
    }
    return `${diffHours}h ago`
  }

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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Oldest Submission
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.workers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50">
                        {/* Worker Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {worker.photos ? (
                              <img
                                src={worker.photos}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-medium text-sm">
                                  {worker.firstName?.[0]}{worker.lastName?.[0]}
                                </span>
                              </div>
                            )}
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

                        {/* Document Names */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {worker.submittedDocuments.slice(0, 3).map((doc) => (
                              <span
                                key={doc.id}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                title={doc.requirementName}
                              >
                                {doc.requirementName.length > 20
                                  ? doc.requirementName.substring(0, 20) + '...'
                                  : doc.requirementName}
                              </span>
                            ))}
                            {worker.submittedDocuments.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                +{worker.submittedDocuments.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Oldest Submission */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <p className="text-gray-900">{formatDate(worker.oldestSubmission)}</p>
                            {worker.oldestSubmission && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getTimeSinceSubmission(worker.oldestSubmission)}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-center">
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
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compliantData.workers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50">
                        {/* Worker Info */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {worker.photos ? (
                              <img
                                src={worker.photos}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 font-medium text-sm">
                                  {worker.firstName?.[0]}{worker.lastName?.[0]}
                                </span>
                              </div>
                            )}
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
                        <td className="px-6 py-4 text-center">
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
          </div>
        )}
      </div>
    </div>
  )
}
