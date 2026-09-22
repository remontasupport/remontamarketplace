/**
 * POST /api/apply
 *
 * Submits a worker's application for a Zoho "Recruitments" record.
 * No database is involved — this route authenticates the request, then
 * hands the submission off to n8n (via webhook), which performs the
 * corresponding update in Zoho CRM.
 *
 * Body: { recruitmentId: string, ...formFields }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { UserRole } from '@/types/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { recruitmentId, ...formFields } = body

  if (!recruitmentId || typeof recruitmentId !== 'string') {
    return NextResponse.json({ error: 'recruitmentId is required' }, { status: 400 })
  }

  const webhookUrl = process.env.APPLY_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { success: false, error: 'APPLY_WEBHOOK_URL is not configured' },
      { status: 500 }
    )
  }

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recruitmentId,
        workerId: session.user.id,
        workerEmail: session.user.email,
        workerName: session.user.name ?? null,
        ...formFields,
      }),
    })

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text()
      throw new Error(`n8n webhook error ${webhookResponse.status}: ${errorBody}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
