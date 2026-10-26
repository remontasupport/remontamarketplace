/**
 * GET /api/jobs
 *
 * Public endpoint — returns the active job listings the worker dashboard shows.
 * No authentication required (suitable for public website pages): the marketing
 * site's /provide-support page reads it through its own /api/jobs.
 *
 * The list is fetchActiveJobs (lib/jobs.ts), the dashboard's own query, so the
 * two can never disagree: same FAKE- rule, same Redis entry (2-hour TTL,
 * invalidated on every sync), and no participant names.
 *
 * Optional query params:
 *   ?state=QLD          — filter by state
 *   ?city=Brisbane      — filter by city
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchActiveJobs } from '@/lib/jobs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stateFilter = searchParams.get('state')
    const cityFilter  = searchParams.get('city')

    const jobs = (await fetchActiveJobs()).filter((job) =>
      (!stateFilter || job.state === stateFilter) &&
      (!cityFilter  || job.city  === cityFilter)
    )

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
