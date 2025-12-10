import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * GET /api/admin/contractors/:id/compliance
 * Fetch all compliance documents for a worker profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { documentCategory: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Group documents by category
    const groupedDocuments = {
      PRIMARY: documents.filter(doc => doc.documentCategory === 'PRIMARY'),
      SECONDARY: documents.filter(doc => doc.documentCategory === 'SECONDARY'),
      WORKING_RIGHTS: documents.filter(doc => doc.documentCategory === 'WORKING_RIGHTS'),
      SERVICE_QUALIFICATION: documents.filter(doc => doc.documentCategory === 'SERVICE_QUALIFICATION'),
      OTHER: documents.filter(doc => !doc.documentCategory)
    }

    // Calculate statistics
    const stats = {
      total: documents.length,
      pending: documents.filter(d => d.status === 'PENDING').length,
      submitted: documents.filter(d => d.status === 'SUBMITTED').length,
      approved: documents.filter(d => d.status === 'APPROVED').length,
      rejected: documents.filter(d => d.status === 'REJECTED').length,
      expired: documents.filter(d => d.status === 'EXPIRED').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        documents,
        groupedDocuments,
        stats
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
