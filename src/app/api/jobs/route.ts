import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/jobs
 *
 * Reads active job listings from the local database (synced from Zoho
 * via /api/sync-jobs). Used by the provide-support page to display jobs.
 *
 * The recruitment title is built from the structured service and location
 * columns — never from dealName, which contains participant names. A job
 * with no service is not displayed. Capped at 20 listings, newest first.
 */

/** e.g. "Support Work in Stirling, WA" — falls back to service alone. */
function buildRecruitmentTitle(
  service: string | null,
  suburbs: string | null,
  state: string | null
): string | null {
  const cleanService = service?.trim()
  if (!cleanService) return null

  const location = [suburbs?.trim(), state?.trim()].filter(Boolean).join(', ')
  return location ? `${cleanService} in ${location}` : cleanService
}

export async function GET() {
  try {
    const dbJobs = await prisma.job.findMany({
      where: {
        stage: 'Recruitment End',
        AND: [
          { description: { not: null } },
          { description: { not: '' } },
          // No service means no usable recruitment title
          { serviceAvailed: { not: null } },
          { serviceAvailed: { not: '' } },
        ],
      },
      orderBy: [
        { postedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: 20,
    })

    const jobs = dbJobs
      .map(job => ({
        ...job,
        recruitmentTitle: buildRecruitmentTitle(job.serviceAvailed, job.suburbs, job.state),
      }))
      // Guard against whitespace-only services the DB filter can't catch
      .filter((job): job is typeof job & { recruitmentTitle: string } =>
        job.recruitmentTitle !== null
      )
      .map(job => ({
        id: job.id,
        zohoId: job.zohoId,
        recruitmentTitle: job.recruitmentTitle,
        service: job.serviceAvailed || '',
        jobDescription: job.description || '',
        city: job.suburbs,
        state: job.state,
        postedAt: job.postedAt?.toISOString() ?? null,
        createdAt: job.createdAt.toISOString(),
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
