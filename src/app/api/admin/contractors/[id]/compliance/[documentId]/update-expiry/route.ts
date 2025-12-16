import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * POST /api/admin/contractors/:id/compliance/:documentId/update-expiry
 * Update expiration date for a compliance document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    // Require ADMIN role
    await requireRole(UserRole.ADMIN)

    const { id: workerId, documentId } = await params
    const body = await request.json()
    const { expiresAt } = body

    if (!workerId || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID and Document ID are required' },
        { status: 400 }
      )
    }

    // Convert expiresAt to Date or null
    const expiryDate = expiresAt ? new Date(expiresAt) : null

    // Update the document's expiration date
    const updatedDocument = await prisma.verificationRequirement.update({
      where: {
        id: documentId,
        workerProfileId: workerId,
      },
      data: {
        expiresAt: expiryDate,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        requirementName: true,
        expiresAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Expiration date updated successfully',
      data: updatedDocument,
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update expiration date',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
