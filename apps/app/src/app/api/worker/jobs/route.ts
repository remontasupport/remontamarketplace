/**
 * GET /api/worker/jobs
 *
 * Returns all active job listings from the database for the worker dashboard.
 * Jobs are synced from Zoho CRM via /api/sync-jobs.
 *
 * Authentication: requires a valid worker session
 *
 * Optional query params:
 *   ?state=QLD          — filter by state
 *   ?city=Brisbane      — filter by city
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'

export async function GET(request: NextRequest) {
  // 1. Authenticate
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 2. Optional filters from query params
    const { searchParams } = new URL(request.url)
    const stateFilter = searchParams.get('state')
    const cityFilter  = searchParams.get('city')

    // 3. Fetch active jobs from DB
    const jobs = await authPrisma.job.findMany({
      where: {
        active: true,
        ...(stateFilter && { state: stateFilter }),
        ...(cityFilter  && { city:  cityFilter  }),
      },
      select: {
        id:               true,
        zohoId:           true,
        status:           true,
        firstName:        true,
        lastName:         true,
        recruitmentTitle: true,
        service:          true,
        description:      true,
        jobDescription:   true,
        city:             true,
        state:            true,
        postedAt:         true,
        createdAt:        true,
      },
      orderBy: { postedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      count:   jobs.length,
      jobs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
