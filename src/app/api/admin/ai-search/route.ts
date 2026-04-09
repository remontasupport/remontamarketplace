import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN)

    const { query } = await request.json()

    const webhookUrl = process.env.AI_SEARCH_WEBHOOK
    if (!webhookUrl) {
      return NextResponse.json({ error: 'AI search is not configured' }, { status: 500 })
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to perform AI search' }, { status: 500 })
  }
}
