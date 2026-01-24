'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronDown, ChevronRight, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

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
  metadata: { isCitizen?: boolean } | null
  createdAt: string
  updatedAt: string
}

// Helper to check if document is Australian Citizen right-to-work
const isAustralianCitizen = (doc: VerificationDocument): boolean => {
  return doc.requirementType === 'right-to-work' && doc.metadata?.isCitizen === true
}

interface CategoryStats {
  total: number
  approved: number
}

interface ComplianceData {
  documents: VerificationDocument[]
  categorizedDocuments: {
    essentialChecks: VerificationDocument[]
    modules: VerificationDocument[]
    certifications: VerificationDocument[]
    identity: VerificationDocument[]
    insurances: VerificationDocument[]
  }
  stats: {
    total: number
    pending: number
    submitted: number
    approved: number
    rejected: number
    expired: number
  }
  categoryStats: {
    essentialChecks: CategoryStats
    modules: CategoryStats
    certifications: CategoryStats
    identity: CategoryStats
    insurances: CategoryStats
  }
}

type CategoryKey = 'essentialChecks' | 'modules' | 'certifications' | 'identity' | 'insurances'

const CATEGORY_CONFIG: Record<CategoryKey, { title: string; description: string; icon: string }> = {
  essentialChecks: {
    title: 'Essential Checks',
    description: 'Mandatory compliance documents (Police Check, WWCC, etc.)',
    icon: '🔒',
  },
  modules: {
    title: 'Modules',
    description: 'Training and orientation modules',
    icon: '📚',
  },
  certifications: {
    title: 'Certifications / Qualifications',
    description: 'Service-specific qualifications and certificates',
    icon: '🎓',
  },
  identity: {
    title: 'Identity',
    description: 'Primary and secondary identification documents',
    icon: '🪪',
  },
  insurances: {
    title: 'Insurances',
    description: 'Insurance and liability documents',
    icon: '🛡️',
  },
}

const CATEGORY_ORDER: CategoryKey[] = ['essentialChecks', 'modules', 'certifications', 'identity', 'insurances']

export default function CompliancePage() {
  const router = useRouter()
  const params = useParams()
  const contractorId = params.id as string

  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(new Set(['essentialChecks']))
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null)
  const [expiryDateValue, setExpiryDateValue] = useState<string>('')

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

  const toggleCategory = (category: CategoryKey) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
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

  const handleEditExpiry = (document: VerificationDocument) => {
    setEditingExpiryId(document.id)
    if (document.expiresAt) {
      const date = new Date(document.expiresAt)
      const formattedDate = date.toISOString().split('T')[0]
      setExpiryDateValue(formattedDate)
    } else {
      setExpiryDateValue('')
    }
  }

  const handleCancelEditExpiry = () => {
    setEditingExpiryId(null)
    setExpiryDateValue('')
  }

  const handleSaveExpiry = async (documentId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/contractors/${contractorId}/compliance/${documentId}/update-expiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresAt: expiryDateValue || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setEditingExpiryId(null)
        setExpiryDateValue('')
        await fetchComplianceData()
      } else {
        alert(`Failed to update expiration date: ${result.error}`)
      }
    } catch (err) {
      alert('Failed to update expiration date')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'SUBMITTED':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'EXPIRED':
        return <AlertCircle className="w-5 h-5 text-gray-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const renderDocumentCard = (doc: VerificationDocument) => {
    const isCitizen = isAustralianCitizen(doc)

    return (
      <div
        key={doc.id}
        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isCitizen ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                getStatusIcon(doc.status)
              )}
              <h4 className="font-medium text-gray-900">{doc.requirementName}</h4>
              {isCitizen ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Australian Citizen
                </span>
              ) : (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(doc.status)}`}>
                  {doc.status}
                </span>
              )}
              {doc.isRequired && !isCitizen && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  Required
                </span>
              )}
            </div>

            {isCitizen ? (
              // Australian Citizen - simplified view
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  This worker is an Australian Citizen and does not require right to work verification documents.
                </p>
              </div>
            ) : (
              // Regular document view
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
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
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Expires:</span>{' '}
                    {editingExpiryId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={expiryDateValue}
                          onChange={(e) => setExpiryDateValue(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveExpiry(doc.id)}
                          disabled={isSubmitting}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditExpiry}
                          disabled={isSubmitting}
                          className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {doc.expiresAt ? (
                          <span className={new Date(doc.expiresAt) < new Date() ? 'text-red-600 font-semibold' : ''}>
                            {new Date(doc.expiresAt).toLocaleDateString('en-AU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                        <button
                          onClick={() => handleEditExpiry(doc)}
                          className="ml-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="Edit expiration date"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {doc.reviewedAt && (
                    <div>
                      <span className="font-medium">Reviewed:</span>{' '}
                      {new Date(doc.reviewedAt).toLocaleDateString('en-AU', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>

                {doc.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <span className="font-medium text-sm text-red-900">Rejection Reason:</span>
                    <p className="text-sm text-red-800 mt-1">{doc.rejectionReason}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons - Only show if NOT Australian Citizen */}
          {!isCitizen && (
            <div className="flex flex-col gap-2">
              {doc.documentUrl && (
                <button
                  onClick={() => setPreviewDocument(doc.documentUrl)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Preview
                </button>
              )}

              {doc.status === 'SUBMITTED' && (
                <>
                  <button
                    onClick={() => handleApprove(doc)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectClick(doc)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}

              {doc.status === 'APPROVED' && (
                <>
                  <button
                    onClick={() => handleRejectClick(doc)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReset(doc)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    Reset
                  </button>
                </>
              )}

              {doc.status === 'REJECTED' && (
                <>
                  <button
                    onClick={() => handleApprove(doc)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReset(doc)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
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

        {/* Accordions */}
        <div className="space-y-4">
          {CATEGORY_ORDER.map((categoryKey) => {
            const config = CATEGORY_CONFIG[categoryKey]
            const documents = complianceData.categorizedDocuments[categoryKey]
            const categoryStats = complianceData.categoryStats[categoryKey]
            const isExpanded = expandedCategories.has(categoryKey)

            return (
              <div key={categoryKey} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCategory(categoryKey)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {categoryStats.approved}/{categoryStats.total}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">approved</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    {documents.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>No documents in this category</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-4">
                        {documents.map(renderDocumentCard)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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
