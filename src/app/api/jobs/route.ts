import { NextResponse } from 'next/server'

/**
 * GET /api/jobs
 *
 * Proxies job listings from the Remonta app API (server-side, no CORS issues).
 * Used by the provide-support page to display jobs.
 */
export async function GET() {
  try {
    const response = await fetch('https://app.remontaservices.com.au/api/jobs', {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`)
    }

    const data = await response.json()

    // Handle both array response and { success, jobs } response formats
    const jobs = Array.isArray(data) ? data : data.jobs ?? []

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Jobs API] Error fetching jobs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch jobs',
        jobs: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
