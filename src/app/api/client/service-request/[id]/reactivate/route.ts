/**
 * POST /api/client/service-request/[id]/reactivate
 *
 * Reactivates a cancelled service request by setting status back to PENDING.
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

    // 2. Fetch the service request
    const serviceRequest = await authPrisma.serviceRequest.findUnique({ where: { id } })

    if (!serviceRequest) {
      return NextResponse.json({ success: false, error: 'Service request not found' }, { status: 404 })
    }

    // 3. Ownership check
    if (serviceRequest.requesterId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // 4. Only allow reactivation of cancelled requests
    if (serviceRequest.status !== 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Only cancelled requests can be reactivated' },
        { status: 400 }
      )
    }

    // 5. Reset to PENDING and clear selected worker
    const updated = await authPrisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'PENDING',
        selectedWorkers: [],
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Service request reactivated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('[Reactivate API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reactivate request' }, { status: 500 })
  }
}
