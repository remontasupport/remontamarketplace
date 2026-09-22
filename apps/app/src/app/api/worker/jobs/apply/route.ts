/**
 * POST /api/worker/jobs/apply
 * Creates a job application. Idempotent — safe to call multiple times.
 * Body: { jobId: string }
 *
 * PATCH /api/worker/jobs/apply
 * Withdraws an existing application.
 * Body: { jobId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { jobId } = body

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    // Verify the job exists and is active
    const job = await authPrisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, active: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.active) {
      return NextResponse.json({ error: 'This job is no longer active' }, { status: 410 })
    }

    // Upsert — re-applying after withdrawal resets status back to PENDING
    const application = await authPrisma.jobApplication.upsert({
      where: {
        jobId_workerId: { jobId, workerId: session.user.id },
      },
      update: { status: 'PENDING' },
      create: {
        jobId,
        workerId: session.user.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, applicationId: application.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { jobId } = body

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const application = await authPrisma.jobApplication.findUnique({
      where: { jobId_workerId: { jobId, workerId: session.user.id } },
      select: { id: true, status: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status === 'WITHDRAWN') {
      return NextResponse.json({ error: 'Application already withdrawn' }, { status: 409 })
    }

    await authPrisma.jobApplication.update({
      where: { jobId_workerId: { jobId, workerId: session.user.id } },
      data: { status: 'WITHDRAWN' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
