/**
 * POST /api/client/service-request/[id]/select-worker
 *
 * Saves the client-selected worker and sets the request status to MATCHED.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 1. Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse body
    const body = await request.json()
    const { workerId } = body

    if (!workerId || typeof workerId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'workerId is required' },
        { status: 400 }
      )
    }

    // 3. Fetch the service request
    const serviceRequest = await authPrisma.serviceRequest.findUnique({
      where: { id },
    })

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    // 4. Ownership check
    if (serviceRequest.requesterId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 5. Update selectedWorker and status
    const updated = await authPrisma.serviceRequest.update({
      where: { id },
      data: {
        selectedWorker: workerId,
        status: 'MATCHED',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Worker selected successfully',
      data: updated,
    })
  } catch (error) {
    console.error('[Select Worker API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to select worker' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const serviceRequest = await authPrisma.serviceRequest.findUnique({ where: { id } })

    if (!serviceRequest) {
      return NextResponse.json({ success: false, error: 'Service request not found' }, { status: 404 })
    }

    if (serviceRequest.requesterId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const updated = await authPrisma.serviceRequest.update({
      where: { id },
      data: {
        selectedWorker: null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Cancel Worker API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to cancel worker' }, { status: 500 })
  }
}
