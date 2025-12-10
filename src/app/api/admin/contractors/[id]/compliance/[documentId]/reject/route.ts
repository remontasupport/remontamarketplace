import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * POST /api/admin/contractors/:id/compliance/:documentId/reject
 * Reject a compliance document with a reason
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

    // Parse request body
    const body = await request.json()
    const { rejectionReason } = body

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
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

    // If already rejected, no need to update
    if (document.status === 'REJECTED') {
      return NextResponse.json({
        success: true,
        message: 'Document is already rejected',
        data: document,
      })
    }

    // Check if document can be rejected (must be SUBMITTED or APPROVED)
    if (document.status !== 'SUBMITTED' && document.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: `Document cannot be rejected from ${document.status} status` },
        { status: 400 }
      )
    }

    // TODO: Get admin user info from session/auth
    // For now, we'll use a placeholder. In production, get from session:
    // const session = await getServerSession(authOptions)
    // const adminEmail = session?.user?.email || 'admin@remonta.com'
    const adminEmail = 'admin@remonta.com'

    const now = new Date()

    // Update the document to REJECTED status
    const updatedDocument = await prisma.verificationRequirement.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        rejectedAt: now,
        reviewedAt: now,
        reviewedBy: adminEmail,
        rejectionReason: rejectionReason.trim(),
        approvedAt: null, // Clear approval date if it was previously approved
        updatedAt: now,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Document rejected successfully',
      data: updatedDocument,
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'


    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject document',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
