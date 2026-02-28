/**
 * POST /api/client/service-request/[id]/select-worker
 *
 * Saves the full list of selected workers in one operation.
 * Called once when the user confirms their selection in the modal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'

type RouteParams = {
  params: Promise<{ id: string }>
}

async function fireWebhook(payload: {
  zohoRecordId: string | null
  selectedWorkers: string[]
  action: 'confirmed'
}) {
  const webhookUrl = process.env.Select_Cancelling_Request_Webhook
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[Webhook] Failed to fire worker webhook:', err)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json()
    const { workerId } = body

    if (!workerId || typeof workerId !== 'string') {
      return NextResponse.json({ success: false, error: 'workerId is required' }, { status: 400 })
    }

    const serviceRequest = await authPrisma.serviceRequest.findUnique({ where: { id } })

    if (!serviceRequest) {
      return NextResponse.json({ success: false, error: 'Service request not found' }, { status: 404 })
    }

    if (serviceRequest.requesterId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const remaining = serviceRequest.selectedWorkers.filter((w) => w !== workerId)

    const updated = await authPrisma.serviceRequest.update({
      where: { id },
      data: { selectedWorkers: remaining },
    })

    await fireWebhook({
      zohoRecordId: serviceRequest.zohoRecordId ?? null,
      selectedWorkers: remaining,
      action: 'confirmed',
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Remove Worker API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to remove worker' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json()
    const { workerIds } = body

    if (!Array.isArray(workerIds) || workerIds.some((w) => typeof w !== 'string')) {
      return NextResponse.json({ success: false, error: 'workerIds must be an array of strings' }, { status: 400 })
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
      data: { selectedWorkers: workerIds },
    })

    await fireWebhook({
      zohoRecordId: serviceRequest.zohoRecordId ?? null,
      selectedWorkers: workerIds,
      action: 'confirmed',
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[Select Worker API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save worker selection' }, { status: 500 })
  }
}
