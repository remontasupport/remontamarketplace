import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireAnyRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * POST /api/admin/compliance/:id/publish
 * Update the isPublished status for a worker profile
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN or SUPER_ADMIN role
    await requireAnyRole([UserRole.ADMIN, 'SUPER_ADMIN' as UserRole])

    const { id: workerId } = await params

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { isPublished } = body

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isPublished must be a boolean' },
        { status: 400 }
      )
    }

    // Update the worker profile
    const updatedWorker = await prisma.workerProfile.update({
      where: { id: workerId },
      data: { isPublished },
      select: {
        id: true,
        isPublished: true,
        firstName: true,
        lastName: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedWorker,
      message: isPublished ? 'Compliance verified' : 'Compliance verification removed',
    })
  } catch (error) {
    console.error('Error updating publish status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update publish status' },
      { status: 500 }
    )
  }
}
