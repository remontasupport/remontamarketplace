import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/jobs
 *
 * Public endpoint to fetch active job listings
 * Used by the provide-support page to display jobs
 *
 * No authentication required (read-only, public data)
 */
export async function GET() {
  try {
    // Fetch only active jobs from database
    const jobs = await prisma.job.findMany({
      where: {
        active: true, // Only show active jobs
      },
      orderBy: {
        postedAt: 'desc', // Newest first
      },
      select: {
        id: true,
        zohoId: true,
        dealName: true,
        title: true,
        description: true,
        stage: true,

        // Location
        suburbs: true,
        state: true,

        // Service info
        serviceAvailed: true,
        serviceRequirements: true,

        // Requirements
        disabilities: true,
        behaviouralConcerns: true,
        culturalConsiderations: true,
        language: true,
        religion: true,

        // Personal preferences
        age: true,
        gender: true,
        hobbies: true,

        // Dates
        postedAt: true,

        // Additional
        active: true,
        createdAt: true,
      }
    })

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
