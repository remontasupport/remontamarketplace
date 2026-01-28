import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

// ============================================================================
// DOCUMENT CATEGORIZATION
// ============================================================================

/**
 * Essential Checks - Mandatory compliance documents
 */
const ESSENTIAL_CHECKS_TYPES = [
  'police-check',
  'worker-screening-check',
  'ndis-screening-check',
  'working-with-children',
  'right-to-work',
]

/**
 * Modules - Training documents
 */
const MODULES_TYPES = [
  'ndis-training',
  'ndis-induction-module',
  'ndis-worker-orientation',
  'effective-communication',
  'safe-enjoyable-meals',
  'infection-control',
  'first-aid-cpr',
  'manual-handling',
  'medication-training',
  'behaviour-support',
]

/**
 * Insurance document types (for service-specific detection)
 */
const INSURANCE_TYPES = [
  'car-insurance',
  'public-liability-10m',
  'professional-indemnity',
]

/**
 * Contract document types
 */
const CONTRACT_TYPES = [
  'code-of-conduct',
  'code-of-conduct-part1',
  'code-of-conduct-part2',
  'contract-of-agreement',
]

/**
 * Categorize a document into one of 6 categories:
 * 1. essentialChecks - Mandatory compliance (police check, WWCC, etc.)
 * 2. modules - Training documents
 * 3. certifications - Qualifications and service-specific non-insurance docs
 * 4. identity - Primary and secondary ID documents
 * 5. insurances - Insurance documents
 * 6. contracts - Code of Conduct and Contract of Agreement
 */
function categorizeDocument(doc: {
  requirementType: string
  documentCategory: string | null
}): 'essentialChecks' | 'modules' | 'certifications' | 'identity' | 'insurances' | 'contracts' {
  const { requirementType, documentCategory } = doc

  // 1. Identity - Check documentCategory first (PRIMARY or SECONDARY)
  if (documentCategory === 'PRIMARY' || documentCategory === 'SECONDARY') {
    return 'identity'
  }

  // 2. Check if it's a service-specific document (contains ':')
  if (requirementType.includes(':')) {
    const docType = requirementType.split(':')[1] // Get the part after ':'

    // Check if it's an insurance type
    if (INSURANCE_TYPES.includes(docType)) {
      return 'insurances'
    }

    // Otherwise it's a certification/qualification
    return 'certifications'
  }

  // 3. Essential Checks
  if (ESSENTIAL_CHECKS_TYPES.includes(requirementType)) {
    return 'essentialChecks'
  }

  // 4. Modules (Training)
  if (MODULES_TYPES.includes(requirementType)) {
    return 'modules'
  }

  // 5. Check for standalone insurance types
  if (INSURANCE_TYPES.includes(requirementType)) {
    return 'insurances'
  }

  // 6. Check for contract types (Code of Conduct, Contract of Agreement)
  if (CONTRACT_TYPES.includes(requirementType)) {
    return 'contracts'
  }

  // 7. SERVICE_QUALIFICATION category goes to certifications
  if (documentCategory === 'SERVICE_QUALIFICATION') {
    return 'certifications'
  }

  // Default to certifications for any unmatched documents
  return 'certifications'
}

/**
 * GET /api/admin/compliance/:id
 * Fetch all compliance documents for a worker profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN role
    await requireRole(UserRole.ADMIN)

    const { id: workerId } = await params

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID is required' },
        { status: 400 }
      )
    }

    // Fetch all verification requirements for this worker
    const documents = await prisma.verificationRequirement.findMany({
      where: { workerProfileId: workerId },
      select: {
        id: true,
        requirementType: true,
        requirementName: true,
        isRequired: true,
        status: true,
        documentUrl: true,
        documentUploadedAt: true,
        submittedAt: true,
        reviewedAt: true,
        reviewedBy: true,
        approvedAt: true,
        rejectedAt: true,
        expiresAt: true,
        notes: true,
        rejectionReason: true,
        documentCategory: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })

    // Group documents by the 6 categories
    const categorizedDocuments = {
      essentialChecks: [] as typeof documents,
      modules: [] as typeof documents,
      certifications: [] as typeof documents,
      identity: [] as typeof documents,
      insurances: [] as typeof documents,
      contracts: [] as typeof documents,
    }

    // Categorize each document
    documents.forEach(doc => {
      const category = categorizeDocument(doc)
      categorizedDocuments[category].push(doc)
    })

    // Calculate statistics
    const stats = {
      total: documents.length,
      pending: documents.filter(d => d.status === 'PENDING').length,
      submitted: documents.filter(d => d.status === 'SUBMITTED').length,
      approved: documents.filter(d => d.status === 'APPROVED').length,
      rejected: documents.filter(d => d.status === 'REJECTED').length,
      expired: documents.filter(d => d.status === 'EXPIRED').length,
    }

    // Calculate stats per category
    const categoryStats = {
      essentialChecks: {
        total: categorizedDocuments.essentialChecks.length,
        approved: categorizedDocuments.essentialChecks.filter(d => d.status === 'APPROVED').length,
      },
      modules: {
        total: categorizedDocuments.modules.length,
        approved: categorizedDocuments.modules.filter(d => d.status === 'APPROVED').length,
      },
      certifications: {
        total: categorizedDocuments.certifications.length,
        approved: categorizedDocuments.certifications.filter(d => d.status === 'APPROVED').length,
      },
      identity: {
        total: categorizedDocuments.identity.length,
        approved: categorizedDocuments.identity.filter(d => d.status === 'APPROVED').length,
      },
      insurances: {
        total: categorizedDocuments.insurances.length,
        approved: categorizedDocuments.insurances.filter(d => d.status === 'APPROVED').length,
      },
      contracts: {
        total: categorizedDocuments.contracts.length,
        approved: categorizedDocuments.contracts.filter(d => d.status === 'APPROVED').length,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        documents,
        categorizedDocuments,
        stats,
        categoryStats,
      }
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'


    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch compliance documents',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
