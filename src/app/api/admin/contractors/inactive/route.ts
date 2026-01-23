import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireAnyRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * GET /api/admin/contractors/inactive
 * Fetches all suspended/inactive workers
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await requireAnyRole([UserRole.ADMIN, UserRole.SUPER_ADMIN])
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const skip = (page - 1) * pageSize

    // Fetch inactive/suspended workers
    const [total, workers] = await Promise.all([
      prisma.workerProfile.count({
        where: {
          user: {
            status: 'SUSPENDED'
          }
        }
      }),
      prisma.workerProfile.findMany({
        where: {
          user: {
            status: 'SUSPENDED'
          }
        },
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          mobile: true,
          gender: true,
          age: true,
          dateOfBirth: true,
          languages: true,
          workerServices: {
            select: {
              categoryName: true,
            }
          },
          user: {
            select: {
              email: true,
              status: true,
            }
          },
          city: true,
          state: true,
          postalCode: true,
          photos: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    ])

    // Transform response
    const workersData = workers.map(worker => ({
      ...worker,
      email: worker.user?.email || null,
      services: worker.workerServices.map(ws => ws.categoryName),
      isActive: false, // All are inactive/suspended
      workerServices: undefined,
      user: undefined,
    }))

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: workersData,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    })

  } catch (error) {
    console.error('[Inactive API] Error fetching inactive workers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inactive workers' },
      { status: 500 }
    )
  }
}
