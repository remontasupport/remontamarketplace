import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * GET /api/admin/contractors/:id
 * Fetch single worker profile with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        experience: true,
        introduction: true,
        qualifications: true,
        hasVehicle: true,
        funFact: true,
        hobbies: true,
        uniqueService: true,
        whyEnjoyWork: true,
        additionalInfo: true,
        photos: true,
        location: true,
        age: true,
        languages: true,
        workerServices: {
          select: {
            categoryName: true,
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
        ...worker,
        services,
        workerServices: undefined, // Remove from response
      }
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Admin API] Error fetching worker:', errorMsg)

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
