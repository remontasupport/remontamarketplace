/**
 * POST /api/refresh-jobs — Manual admin trigger
 *
 * Use this to force a sync immediately after updating leads in Zoho.
 *
 * Authentication:
 *   Header: x-api-secret: <SYNC_API_SECRET>
 *
 * curl example:
 *   curl -X POST https://app.remontaservices.com.au/api/refresh-jobs \
 *     -H "x-api-secret: <SYNC_API_SECRET>"
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const apiSecret = request.headers.get('x-api-secret')
  if (!apiSecret || apiSecret !== process.env.SYNC_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Delegate to sync endpoint
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const response = await fetch(`${baseUrl}/api/sync-jobs`, {
    method: 'POST',
    headers: {
      'x-api-secret': process.env.SYNC_API_SECRET!,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  return NextResponse.json({ triggeredBy: 'manual', ...data })
}
