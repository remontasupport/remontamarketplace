import { NextRequest, NextResponse } from 'next/server'

/**
 * MANUAL REFRESH ENDPOINT
 *
 * Allows admins to manually trigger a job sync without waiting for the cron schedule
 *
 * Security: Requires API Secret authentication
 *
 * Usage:
 * POST /api/refresh-jobs
 * Headers: { "x-api-secret": "SYNC_API_SECRET" }
 *
 * This is useful when:
 * - You just added/updated jobs in Zoho and want them on the site immediately
 * - Testing the sync functionality
 * - Emergency updates needed before next scheduled sync
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API Secret
    const apiSecret = request.headers.get('x-api-secret')
    const expectedSecret = process.env.SYNC_API_SECRET

    if (!expectedSecret) {
      console.error('[Refresh Jobs] SYNC_API_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (apiSecret !== expectedSecret) {
      console.warn('[Refresh Jobs] Unauthorized refresh attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Refresh Jobs] Manual refresh triggered...')

    // Call the sync API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/sync-jobs`, {
      method: 'POST',
      headers: {
        'x-api-secret': expectedSecret,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[Refresh Jobs] Sync failed:', result)
      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          details: result
        },
        { status: response.status }
      )
    }

    console.log('[Refresh Jobs] Manual refresh completed:', result.stats)

    return NextResponse.json({
      success: true,
      message: 'Jobs refreshed successfully',
      triggeredBy: 'manual',
      ...result
    })
  } catch (error) {
    console.error('[Refresh Jobs] Error during manual refresh:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Refresh failed',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if refresh is available
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/refresh-jobs',
    method: 'POST',
    authentication: 'Required (x-api-secret header)',
    description: 'Manually trigger job sync from Zoho',
    usage: 'curl -X POST http://localhost:3000/api/refresh-jobs -H "x-api-secret: YOUR_SECRET"'
  })
}
