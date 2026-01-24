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

export default function CheckComplianceContent() {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingCompliance()
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Workers Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
              </div>
            </div>
          </div>
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Docs per Worker</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data && data.total > 0
                    ? (data.totalSubmittedDocuments / data.total).toFixed(1)
                    : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
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
                            <p className="text-xs text-gray-500">
                              {worker.isPublished ? (
                                <span className="text-green-600">Published</span>
                              ) : (
                                <span className="text-yellow-600">Unpublished</span>
                              )}
                            </p>
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
                          href={`/admin/contractors/${worker.id}/compliance`}
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
      </div>
    </div>
  )
}
