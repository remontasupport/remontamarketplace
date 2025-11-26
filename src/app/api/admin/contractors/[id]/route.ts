import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'

/**
 * GET /api/admin/contractors/:id
 * Fetch single worker profile with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workerId = params.id

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
        services: true,
      }
    })

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: worker
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
