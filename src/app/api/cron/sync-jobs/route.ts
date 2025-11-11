import { NextRequest, NextResponse } from 'next/server'

/**
 * VERCEL CRON ENDPOINT
 *
 * This endpoint is called automatically by Vercel Cron
 * Schedule: Every 6 hours (0 */6 * * *)
 *
 * Security: Vercel automatically adds Authorization header with CRON_SECRET
 *
 * This route simply triggers the main sync-jobs API
 */
export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Check if request is authorized
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized cron request attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Cron] Starting scheduled job sync...')

    // Call the sync API
    const syncApiSecret = process.env.SYNC_API_SECRET
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/sync-jobs`, {
      method: 'POST',
      headers: {
        'x-api-secret': syncApiSecret!,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[Cron] Sync failed:', result)
      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          details: result
        },
        { status: 500 }
      )
    }

    console.log('[Cron] Sync completed successfully:', result.stats)

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      syncResult: result
    })
  } catch (error) {
    console.error('[Cron] Error executing cron job:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Cron execution failed',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
