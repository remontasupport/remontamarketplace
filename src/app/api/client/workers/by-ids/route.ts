/**
 * GET /api/client/workers/by-ids?ids=userId1,userId2
 *
 * Fetches worker data for a list of user IDs stored in the assignedWorker column.
 * Queries WorkerProfile by userId field.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { UserRole } from '@/types/auth'
import { authPrisma } from '@/lib/auth-prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse IDs
    const idsParam = request.nextUrl.searchParams.get('ids') || ''
    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 3. Query WorkerProfile by userId (assignedWorker stores User IDs)
    const workerProfiles = await authPrisma.workerProfile.findMany({
      where: { userId: { in: ids } },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        photos: true,
        introduction: true,
        city: true,
        state: true,
        workerServices: {
          select: { categoryName: true, subcategoryNames: true },
          take: 5,
        },
        verificationRequirements: {
          where: { status: 'APPROVED' },
          select: { status: true },
          take: 1,
        },
      },
    })

    // 4. Transform to unified shape
    const workerMap = new Map(
      workerProfiles.map((w) => {
        const locationParts = [w.city, w.state].filter(Boolean)
        const skills = [...new Set(w.workerServices.flatMap((ws) => ws.subcategoryNames))]
        return [
          w.userId,
          {
            id: w.userId,       // User.id — consistent key for fetching & select
            userId: w.userId,   // User.id — used for profile page link
            firstName: w.firstName,
            lastName: w.lastName,
            photo: w.photos || null,
            role: w.workerServices[0]?.categoryName || 'Support Worker',
            bio: w.introduction || '',
            skills,
            location: locationParts.join(', ') || 'Australia',
            isNdisCompliant: w.verificationRequirements.length > 0,
          },
        ]
      })
    )

    // 5. Return in same order as requested IDs (deduplicated, keyed by userId)
    console.log('[by-ids] profiles found:', workerProfiles.length, workerProfiles.map(w => ({ id: w.id, userId: w.userId })))
    const uniqueIds = [...new Set(ids)]
    const data = uniqueIds.map((id) => workerMap.get(id)).filter(Boolean)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Workers by-ids API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workers' },
      { status: 500 }
    )
  }
}
