/**
 * GET /api/jobs
 *
 * Public endpoint — returns all active job listings from the database.
 * No authentication required (suitable for public website pages).
 *
 * Jobs are synced from Zoho CRM via POST /api/sync-jobs.
 * Results are served from Redis cache (2-hour TTL, invalidated on every sync).
 *
 * Optional query params:
 *   ?state=QLD          — filter by state
 *   ?city=Brisbane      — filter by city
 */

import { NextRequest, NextResponse } from 'next/server'
import { authPrisma } from '@/lib/auth-prisma'
import { getOrFetch, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

type Job = {
  id: string
  zohoId: string
  status: string
  firstName: string | null
  lastName: string | null
  recruitmentTitle: string | null
  service: string | null
  description: string | null
  jobDescription: string | null
  city: string | null
  state: string | null
  postedAt: Date | null
  createdAt: Date
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stateFilter = searchParams.get('state')
    const cityFilter  = searchParams.get('city')

    // Use cache only when there are no filters (shared cache key covers unfiltered list)
    const useCache = !stateFilter && !cityFilter

    const jobs = await (useCache
      ? getOrFetch<Job[]>(
          CACHE_KEYS.activeJobs(),
          () => fetchJobs(),
          CACHE_TTL.ACTIVE_JOBS
        )
      : fetchJobs(stateFilter ?? undefined, cityFilter ?? undefined))

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

function fetchJobs(state?: string, city?: string) {
  return authPrisma.job.findMany({
    where: {
      active: true,
      ...(state && { state }),
      ...(city  && { city  }),
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
}
