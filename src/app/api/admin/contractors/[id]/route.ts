import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * GET /api/admin/contractors/:id
 * Fetch single worker profile with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN role
    await requireRole(UserRole.ADMIN)

    const { id: workerId } = await params

    if (!workerId) {
      return NextResponse.json(
        { success: false, error: 'Worker ID is required' },
        { status: 400 }
      )
    }

    // Fetch specific worker profile fields
    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        location: true,
        languages: true,
        photos: true,
        experience: true,
        hasVehicle: true,
        introduction: true,
        hobbies: true,
        uniqueService: true,
        qualifications: true,
        workerServices: {
          select: {
            categoryName: true,
            subcategoryIds: true,
            subcategoryNames: true,
          }
        },
      }
    })

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    // Transform workerServices to legacy services array format
    const uniqueCategories = new Set<string>();
    worker.workerServices.forEach(ws => uniqueCategories.add(ws.categoryName));
    const services = Array.from(uniqueCategories);

    return NextResponse.json({
      success: true,
      data: {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        location: worker.location,
        languages: worker.languages,
        photos: worker.photos,
        experience: worker.experience,
        hasVehicle: worker.hasVehicle,
        introduction: worker.introduction,
        hobbies: worker.hobbies,
        uniqueService: worker.uniqueService,
        qualifications: worker.qualifications,
        services,
      }
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch worker profile',
        message: errorMsg,
      },
      { status: 500 }
    )
  }
}
