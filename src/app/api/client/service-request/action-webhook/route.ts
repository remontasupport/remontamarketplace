import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, requestId } = await req.json()

  if (!action || !requestId) {
    return NextResponse.json({ error: 'Missing action or requestId' }, { status: 400 })
  }

  const webhookUrl = process.env.Cancel_Archive_Webhook
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Fetch zohoRecordId fresh from DB to guarantee accuracy
  const serviceRequest = await authPrisma.serviceRequest.findUnique({
    where: { id: requestId },
    select: { zohoRecordId: true },
  })

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, zohoRecordId: serviceRequest?.zohoRecordId ?? null }),
  })

  return NextResponse.json({ success: true })
}
