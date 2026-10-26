import { NextResponse } from 'next/server'

/**
 * GET /api/jobs
 *
 * The job listings for the provide-support page: the same list the worker
 * dashboard shows, read from the app's public GET /api/jobs (one query, one
 * FAKE- rule, one cache; apps/app/src/lib/jobs.ts). Marketing holds no
 * database access (P-1), so this route only fetches and reshapes.
 *
 * Fetched server-side, not from the browser, so the app needs no CORS for it.
 * Next caches the response for five minutes; the app caches its query in
 * Redis behind that.
 */

const APP_URL = process.env.APP_URL || 'https://app.remontaservices.com.au'

type AppJob = {
  id: string
  zohoId: string
  recruitmentTitle: string | null
  service: string | null
  jobDescription: string | null
  city: string | null
  state: string | null
  postedAt: string | null
  createdAt: string
}

/** The dashboard's title fallback (NewsSlider, JobCard): "Service - City, ST". */
function title(job: AppJob): string {
  const location = [job.city, job.state].filter(Boolean).join(', ')
  return job.recruitmentTitle || [job.service, location].filter(Boolean).join(' - ') || 'Support Work'
}

export async function GET() {
  try {
    const response = await fetch(`${APP_URL}/api/jobs`, { next: { revalidate: 300 } })
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || `app /api/jobs answered ${response.status}`)
    }

    const jobs = (data.jobs as AppJob[]).map(job => ({
      id: job.id,
      zohoId: job.zohoId,
      recruitmentTitle: title(job),
      service: job.service || '',
      jobDescription: job.jobDescription || '',
      city: job.city,
      state: job.state,
      postedAt: job.postedAt,
      createdAt: job.createdAt,
    }))

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
