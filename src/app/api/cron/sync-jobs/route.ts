/**
 * GET /api/cron/sync-jobs — Vercel cron entry point
 *
 * Called automatically by Vercel on schedule (see vercel.json).
 * Vercel injects: Authorization: Bearer <CRON_SECRET>
 *
 * Do not call this manually in production.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 1. Verify Vercel cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Internally call the sync endpoint
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const response = await fetch(`${baseUrl}/api/sync-jobs`, {
    method: 'POST',
    headers: {
      'x-api-secret':  process.env.SYNC_API_SECRET!,
      'Content-Type':  'application/json',
    },
  })

  const data = await response.json()

  return NextResponse.json({ triggeredBy: 'cron', ...data })
}
