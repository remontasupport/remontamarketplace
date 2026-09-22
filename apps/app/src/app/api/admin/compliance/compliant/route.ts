import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireAnyRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * GET /api/admin/compliance/compliant
 * Fetch all workers who have isPublished = true (compliance verified)
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN or SUPER_ADMIN role
    await requireAnyRole([UserRole.ADMIN, 'SUPER_ADMIN' as UserRole])

    // Get all published workers
    const compliantWorkers = await prisma.workerProfile.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobile: true,
        photos: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform the data
    const workers = compliantWorkers.map(worker => ({
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.user?.email || null,
      mobile: worker.mobile,
      photos: worker.photos,
      isPublished: worker.isPublished,
      createdAt: worker.createdAt.toISOString(),
      publishedAt: worker.updatedAt.toISOString(), // Using updatedAt as proxy for when it was published
    }))

    return NextResponse.json({
      success: true,
      data: {
        workers,
        total: workers.length
      }
    })
  } catch (error) {
    console.error('Error fetching compliant workers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch compliant workers' },
      { status: 500 }
    )
  }
}
