import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * GET /api/admin/compliance/pending
 * Fetch all workers who have documents with SUBMITTED status
 * Optimized query for fast performance
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole(UserRole.ADMIN)

    // Fast query: Get distinct worker profiles that have SUBMITTED documents
    // Exclude workers who are already verified (isPublished: true)
    const workersWithSubmittedDocs = await prisma.workerProfile.findMany({
      where: {
        isPublished: false,
        verificationRequirements: {
          some: {
            status: 'SUBMITTED'
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobile: true,
        photos: true,
        isPublished: true,
        createdAt: true,
        // Get email from user relation
        user: {
          select: {
            email: true
          }
        },
        // Get counts using _count
        _count: {
          select: {
            verificationRequirements: true
          }
        },
        // Get only SUBMITTED documents for count
        verificationRequirements: {
          where: {
            status: 'SUBMITTED'
          },
          select: {
            id: true,
            requirementName: true,
            requirementType: true,
            submittedAt: true,
          },
          orderBy: {
            submittedAt: 'desc'
          }
        }
      },
      orderBy: {
        // Order by most recent submission first
        verificationRequirements: {
          _count: 'desc'
        }
      }
    })

    // Transform the data for the frontend
    const workers = workersWithSubmittedDocs.map(worker => ({
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.user?.email || null,
      mobile: worker.mobile,
      photos: worker.photos,
      isPublished: worker.isPublished,
      createdAt: worker.createdAt,
      totalDocuments: worker._count.verificationRequirements,
      submittedCount: worker.verificationRequirements.length,
      submittedDocuments: worker.verificationRequirements,
      oldestSubmission: worker.verificationRequirements.length > 0
        ? worker.verificationRequirements[worker.verificationRequirements.length - 1].submittedAt
        : null,
      newestSubmission: worker.verificationRequirements.length > 0
        ? worker.verificationRequirements[0].submittedAt
        : null,
    }))

    // Sort by number of submitted documents (most first), then by oldest submission
    workers.sort((a, b) => {
      // First by submitted count descending
      if (b.submittedCount !== a.submittedCount) {
        return b.submittedCount - a.submittedCount
      }
      // Then by oldest submission ascending (oldest first for review priority)
      if (a.oldestSubmission && b.oldestSubmission) {
        return new Date(a.oldestSubmission).getTime() - new Date(b.oldestSubmission).getTime()
      }
      return 0
    })

    return NextResponse.json({
      success: true,
      data: {
        workers,
        total: workers.length,
        totalSubmittedDocuments: workers.reduce((sum, w) => sum + w.submittedCount, 0)
      }
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Compliance Pending] Error:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pending compliance data',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
