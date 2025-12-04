import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * POST /api/admin/contractors/:id/compliance/:documentId/approve
 * Approve a compliance document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id: workerId, documentId } = await params

    if (!workerId || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID and Document ID are required' },
        { status: 400 }
      )
    }

    // Verify the document exists and belongs to this worker
    const document = await prisma.verificationRequirement.findFirst({
      where: {
        id: documentId,
        workerProfileId: workerId,
      },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    // If already approved, no need to update
    if (document.status === 'APPROVED') {
      return NextResponse.json({
        success: true,
        message: 'Document is already approved',
        data: document,
      })
    }

    // Check if document can be approved (must be SUBMITTED or REJECTED)
    if (document.status !== 'SUBMITTED' && document.status !== 'REJECTED') {
      return NextResponse.json(
        { success: false, error: `Document cannot be approved from ${document.status} status` },
        { status: 400 }
      )
    }

    // TODO: Get admin user info from session/auth
    // For now, we'll use a placeholder. In production, get from session:
    // const session = await getServerSession(authOptions)
    // const adminEmail = session?.user?.email || 'admin@remonta.com'
    const adminEmail = 'admin@remonta.com'

    const now = new Date()

    // Update the document to APPROVED status
    const updatedDocument = await prisma.verificationRequirement.update({
      where: { id: documentId },
      data: {
        status: 'APPROVED',
        approvedAt: now,
        reviewedAt: now,
        reviewedBy: adminEmail,
        rejectedAt: null, // Clear rejection date if it was previously rejected
        rejectionReason: null, // Clear rejection reason
        updatedAt: now,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Document approved successfully',
      data: updatedDocument,
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Approve API] Error approving document:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve document',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
