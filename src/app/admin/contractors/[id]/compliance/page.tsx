'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface VerificationDocument {
  id: string
  requirementType: string
  requirementName: string
  isRequired: boolean
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  documentUrl: string | null
  documentUploadedAt: string | null
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  approvedAt: string | null
  rejectedAt: string | null
  expiresAt: string | null
  notes: string | null
  rejectionReason: string | null
  documentCategory: 'PRIMARY' | 'SECONDARY' | 'WORKING_RIGHTS' | 'SERVICE_QUALIFICATION' | null
  createdAt: string
  updatedAt: string
}

interface ComplianceData {
  documents: VerificationDocument[]
  groupedDocuments: {
    PRIMARY: VerificationDocument[]
    SECONDARY: VerificationDocument[]
    WORKING_RIGHTS: VerificationDocument[]
    SERVICE_QUALIFICATION: VerificationDocument[]
    OTHER: VerificationDocument[]
  }
  stats: {
    total: number
    pending: number
    submitted: number
    approved: number
    rejected: number
    expired: number
  }
}

export default function CompliancePage() {
  const router = useRouter()
  const params = useParams()
  const contractorId = params.id as string

  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComplianceData()
  }, [contractorId])

  const fetchComplianceData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/contractors/${contractorId}/compliance`)
      const result = await response.json()

      if (result.success) {
        setComplianceData(result.data)
      } else {
        setError(result.error || 'Failed to load compliance data')
      }
    } catch (err) {
      setError('Failed to load compliance data')
    
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (document: VerificationDocument) => {
    const message = document.status === 'REJECTED'
      ? `This document is currently REJECTED. Are you sure you want to APPROVE "${document.requirementName}"?`
      : `Are you sure you want to approve "${document.requirementName}"?`

    if (!confirm(message)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/contractors/${contractorId}/compliance/${document.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the data
        await fetchComplianceData()
      } else {
        alert(`Failed to approve document: ${result.error}`)
      }
    } catch (err) {
      alert('Failed to approve document')
     
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectClick = (document: VerificationDocument) => {
    setSelectedDocument(document)
    // Pre-fill with existing rejection reason if available
    setRejectionReason(document.rejectionReason || '')
    setShowRejectModal(true)
  }

  const handleRejectSubmit = async () => {
    if (!selectedDocument) return

    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/contractors/${contractorId}/compliance/${selectedDocument.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        setShowRejectModal(false)
        setSelectedDocument(null)
        setRejectionReason('')
        // Refresh the data
        await fetchComplianceData()
      } else {
        alert(`Failed to reject document: ${result.error}`)
      }
    } catch (err) {
      alert('Failed to reject document')
      
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = async (document: VerificationDocument) => {
    if (!confirm(`Are you sure you want to reset "${document.requirementName}" back to review status?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/contractors/${contractorId}/compliance/${document.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the data
        await fetchComplianceData()
      } else {
        alert(`Failed to reset document: ${result.error}`)
      }
    } catch (err) {
      alert('Failed to reset document')
     
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Loading compliance data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !complianceData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Failed to load compliance data'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Back
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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Documents</h1>
          <p className="mt-2 text-sm text-gray-600">Review and manage worker verification documents</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{complianceData.stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-700">{complianceData.stats.pending}</div>
            <div className="text-sm text-yellow-700 mt-1">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-700">{complianceData.stats.submitted}</div>
            <div className="text-sm text-blue-700 mt-1">Submitted</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center border border-green-200">
            <div className="text-3xl font-bold text-green-700">{complianceData.stats.approved}</div>
            <div className="text-sm text-green-700 mt-1">Approved</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 text-center border border-red-200">
            <div className="text-3xl font-bold text-red-700">{complianceData.stats.rejected}</div>
            <div className="text-sm text-red-700 mt-1">Rejected</div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-700">{complianceData.stats.expired}</div>
            <div className="text-sm text-gray-700 mt-1">Expired</div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Documents</h2>
          </div>

          <div className="p-6 space-y-4">
            {complianceData.documents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No compliance documents found</p>
              </div>
            ) : (
              complianceData.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{doc.requirementName}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                            doc.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : doc.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : doc.status === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-800'
                              : doc.status === 'EXPIRED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {doc.status}
                        </span>
                        {doc.isRequired && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Required
                          </span>
                        )}
                        {doc.documentCategory && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {doc.documentCategory.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Type:</span> {doc.requirementType}
                        </div>
                        {doc.submittedAt && (
                          <div>
                            <span className="font-medium">Submitted:</span>{' '}
                            {new Date(doc.submittedAt).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                        {doc.documentUploadedAt && (
                          <div>
                            <span className="font-medium">Uploaded:</span>{' '}
                            {new Date(doc.documentUploadedAt).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                        {doc.expiresAt && (
                          <div>
                            <span className="font-medium">Expires:</span>{' '}
                            <span
                              className={
                                new Date(doc.expiresAt) < new Date() ? 'text-red-600 font-semibold' : ''
                              }
                            >
                              {new Date(doc.expiresAt).toLocaleDateString('en-AU', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                        {doc.reviewedAt && (
                          <div>
                            <span className="font-medium">Reviewed:</span>{' '}
                            {new Date(doc.reviewedAt).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}
                        {doc.reviewedBy && (
                          <div>
                            <span className="font-medium">Reviewed By:</span> {doc.reviewedBy}
                          </div>
                        )}
                      </div>

                      {doc.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-sm text-blue-900">Notes:</span>
                          <p className="text-sm text-blue-800 mt-1">{doc.notes}</p>
                        </div>
                      )}

                      {doc.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <span className="font-medium text-sm text-red-900">Rejection Reason:</span>
                          <p className="text-sm text-red-800 mt-1">{doc.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {doc.documentUrl && (
                        <button
                          onClick={() => setPreviewDocument(doc.documentUrl)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          Preview
                        </button>
                      )}

                      {/* SUBMITTED status - Show Approve and Reject */}
                      {doc.status === 'SUBMITTED' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(doc)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* APPROVED status - Show Reject and Reset */}
                      {doc.status === 'APPROVED' && (
                        <>
                          <button
                            onClick={() => handleRejectClick(doc)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleReset(doc)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reset to Review
                          </button>
                        </>
                      )}

                      {/* REJECTED status - Show Approve and Reset */}
                      {doc.status === 'REJECTED' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReset(doc)}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reset to Review
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
            onClick={() => setPreviewDocument(null)}
          ></div>

          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Open in New Tab
                  </a>
                  <button
                    onClick={() => setPreviewDocument(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-gray-50">
                {previewDocument.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDocument}
                    className="w-full h-full rounded-lg border-2 border-gray-300"
                    title="Document Preview"
                  />
                ) : previewDocument.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={previewDocument}
                      alt="Document"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">Preview not available</p>
                    <p className="text-sm mb-4">Click "Open in New Tab" to view this document</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => !isSubmitting && setShowRejectModal(false)}
          ></div>

          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedDocument.status === 'APPROVED' ? 'Change to Rejected' : 'Reject Document'}: {selectedDocument.requirementName}
              </h3>

              {selectedDocument.status === 'APPROVED' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This document is currently approved. Rejecting it will change its status.
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Provide a clear reason why this document is being rejected..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
