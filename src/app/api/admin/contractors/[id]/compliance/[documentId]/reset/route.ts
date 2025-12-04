import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * POST /api/admin/contractors/:id/compliance/:documentId/reset
 * Reset a compliance document back to SUBMITTED status for re-review
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

    // Only allow resetting from APPROVED or REJECTED status
    if (document.status !== 'APPROVED' && document.status !== 'REJECTED') {
      return NextResponse.json(
        { success: false, error: `Document cannot be reset. Current status: ${document.status}` },
        { status: 400 }
      )
    }

    // TODO: Get admin user info from session/auth
    const adminEmail = 'admin@remonta.com'

    const now = new Date()

    // Reset the document to SUBMITTED status
    const updatedDocument = await prisma.verificationRequirement.update({
      where: { id: documentId },
      data: {
        status: 'SUBMITTED',
        reviewedAt: now,
        reviewedBy: adminEmail,
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        notes: document.notes
          ? `${document.notes}\n[${now.toISOString()}] Reset to review by ${adminEmail}`
          : `[${now.toISOString()}] Reset to review by ${adminEmail}`,
        updatedAt: now,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Document reset to review successfully',
      data: updatedDocument,
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Reset API] Error resetting document:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset document',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
