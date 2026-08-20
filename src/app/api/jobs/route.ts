import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/jobs
 *
 * Reads active job listings from the local database (synced from Zoho
 * via /api/sync-jobs). Used by the provide-support page to display jobs.
 */
export async function GET() {
  try {
    const dbJobs = await prisma.job.findMany({
      where: {
        stage: 'Recruitment End',
        AND: [
          { description: { not: null } },
          { description: { not: '' } },
        ],
      },
      orderBy: { postedAt: 'desc' },
      take: 20,
    })

    const jobs = dbJobs.map(job => ({
      id: job.id,
      zohoId: job.zohoId,
      recruitmentTitle: job.title || job.dealName,
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
