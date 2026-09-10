import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireAnyRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * PATCH /api/admin/contractors/[id]/status
 * Toggle worker status between ACTIVE and SUSPENDED
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Status API] Request received')

    // Verify admin access
    const session = await requireAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])
    if (!session) {
      console.log('[Status API] Unauthorized - no valid session')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { isActive } = body

    console.log('[Status API] Processing:', { workerProfileId: id, isActive })

    if (typeof isActive !== 'boolean') {
      console.log('[Status API] Invalid isActive value:', isActive)
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    // Find the worker profile to get the userId
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id },
      select: { userId: true }
    })

    console.log('[Status API] Worker profile found:', workerProfile)

    if (!workerProfile) {
      console.log('[Status API] Worker profile not found for id:', id)
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    // Update the user status
    const newStatus = isActive ? 'ACTIVE' : 'SUSPENDED'
    console.log('[Status API] Updating user status:', { userId: workerProfile.userId, newStatus })

    const updatedUser = await prisma.user.update({
      where: { id: workerProfile.userId },
      data: {
        status: newStatus
      },
      select: {
        id: true,
        status: true
      }
    })

    console.log('[Status API] User updated successfully:', updatedUser)

    return NextResponse.json({
      success: true,
      data: {
        userId: updatedUser.id,
        isActive: updatedUser.status === 'ACTIVE'
      }
    })

  } catch (error) {
    console.error('[Status API] Error updating worker status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update worker status' },
      { status: 500 }
    )
  }
}
