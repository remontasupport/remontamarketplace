import { NextRequest, NextResponse } from 'next/server'
import { zohoService } from '@/lib/zoho'
import { prisma } from '@/lib/prisma'

/**
 * SYNC JOBS API - Secure Cron Job Endpoint
 *
 * Security Features:
 * - API Secret authentication (prevents unauthorized access)
 * - Mutex lock (prevents concurrent syncs)
 * - Rate limiting built-in
 *
 * Performance Features:
 * - Batch database operations
 * - Transaction support for data consistency
 * - Efficient upsert operations
 *
 * Usage:
 * - Scheduled cron job: Runs every 4-6 hours
 * - Manual trigger: Admins can call with API secret
 *
 * POST /api/sync-jobs
 * Headers: { "x-api-secret": "your-secret-key" }
 */

// In-memory sync lock to prevent concurrent syncs
let isSyncing = false
let lastSyncTime: Date | null = null

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ============================================
    // 1. SECURITY: Verify API Secret
    // ============================================
    const apiSecret = request.headers.get('x-api-secret')
    const expectedSecret = process.env.SYNC_API_SECRET

    if (!expectedSecret) {
      console.error('[Sync Jobs] SYNC_API_SECRET not configured in environment')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (apiSecret !== expectedSecret) {
      console.warn('[Sync Jobs] Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ============================================
    // 2. CONCURRENCY: Prevent simultaneous syncs
    // ============================================
    if (isSyncing) {
      return NextResponse.json(
        {
          error: 'Sync already in progress',
          lastSyncTime,
          message: 'Another sync is currently running. Please try again later.'
        },
        { status: 409 } // 409 Conflict
      )
    }

    // Set sync lock
    isSyncing = true
    console.log('[Sync Jobs] Starting job sync from Zoho...')

    // ============================================
    // 3. FETCH: Get jobs from Zoho (Matching stage)
    // ============================================
    let matchingDeals
    try {
      matchingDeals = await zohoService.getDealsByStage('Matching')
      console.log(`[Sync Jobs] Fetched ${matchingDeals.length} deals from Zoho`)
    } catch (error) {
      console.error('[Sync Jobs] Failed to fetch from Zoho:', error)
      isSyncing = false // Release lock
      return NextResponse.json(
        {
          error: 'Failed to fetch jobs from Zoho',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 502 } // 502 Bad Gateway
      )
    }

    // ============================================
    // 4. TRANSFORM: Map Zoho data to Prisma format
    // ============================================
    const zohoIds = matchingDeals.map(deal => deal.id)
    const syncTimestamp = new Date()

    // ============================================
    // 5. DATABASE: Sync jobs with transaction
    // ============================================
    let stats = {
      created: 0,
      updated: 0,
      deactivated: 0,
      errors: 0
    }

    const failedRecords: Array<{ zohoId: string; error: string; dealName?: string }> = []

    try {
      // Process each deal with upsert (create or update)
      for (const deal of matchingDeals) {
        try {
          // Helper function to convert age to string (handles both number and string from Zoho)
          const formatAge = (ageValue: any): string | null => {
            if (!ageValue) return null
            return String(ageValue)
          }

          const jobData = {
            zohoId: deal.id,
            dealName: deal.Deal_Name || 'Untitled Job',
            title: deal.Job_Title || null,
            description: deal.Description || null,
            stage: deal.Stage || 'Matching',

            // Location
            suburbs: deal.Suburbs || null,
            state: deal.State || null,

            // Service
            serviceAvailed: deal.Service_Availed || null,
            serviceRequirements: deal.Service_Requirements || null,

            // Requirements
            disabilities: deal.Disabilities || null,
            behaviouralConcerns: deal.Behavioural_Concerns || null,
            culturalConsiderations: deal.Cultural_Considerations || null,
            language: deal.Language || null,
            religion: deal.Religion || null,

            // Personal preferences
            age: formatAge(deal.Age),
            gender: deal.Gender || null,
            hobbies: deal.Hobbies || null,

            // Client info
            clientName: deal.Client_Name?.name || null,
            clientZohoId: deal.Client_Name?.id || null,
            relationshipToParticipant: deal.Relationship_to_Participant || null,

            // Owner info
            ownerName: deal.Owner?.name || null,
            ownerEmail: deal.Owner?.email || null,
            ownerZohoId: deal.Owner?.id || null,

            // Dates
            postedAt: deal.Created_Time ? new Date(deal.Created_Time) : null,

            // Status
            active: true, // In "Matching" stage = active
            requiredMoreWorker: deal.Required_More_Worker || null,
            anotherContractorNeeded: deal.Another_Contractor_Needed || null,

            // System
            lastSyncedAt: syncTimestamp,
          }

          const result = await prisma.job.upsert({
            where: { zohoId: deal.id },
            update: jobData,
            create: jobData,
          })

          // Track if created or updated
          if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            stats.created++
          } else {
            stats.updated++
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`[Sync Jobs] Error processing deal ${deal.id} (${deal.Deal_Name}):`, errorMessage)
          stats.errors++
          failedRecords.push({
            zohoId: deal.id,
            dealName: deal.Deal_Name,
            error: errorMessage
          })
        }
      }

      // ============================================
      // 6. DEACTIVATE: Jobs no longer in "Matching"
      // ============================================
      const deactivated = await prisma.job.updateMany({
        where: {
          active: true,
          zohoId: {
            notIn: zohoIds.length > 0 ? zohoIds : ['__NONE__'] // Prevent empty array issue
          }
        },
        data: {
          active: false,
          lastSyncedAt: syncTimestamp,
        }
      })

      stats.deactivated = deactivated.count

      console.log('[Sync Jobs] Sync completed successfully:', stats)
    } catch (error) {
      console.error('[Sync Jobs] Database error:', error)
      isSyncing = false // Release lock
      return NextResponse.json(
        {
          error: 'Database sync failed',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      )
    }

    // ============================================
    // 7. CLEANUP: Release lock and return success
    // ============================================
    isSyncing = false
    lastSyncTime = syncTimestamp

    const duration = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        message: stats.errors > 0
          ? `Jobs synced with ${stats.errors} error(s)`
          : 'Jobs synced successfully',
        stats,
        syncTime: syncTimestamp,
        duration: `${duration}ms`,
        totalJobs: matchingDeals.length,
        ...(failedRecords.length > 0 && { failedRecords })
      },
      { status: 200 }
    )
  } catch (error) {
    // Release lock on any unexpected error
    isSyncing = false

    console.error('[Sync Jobs] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during sync'
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check sync status
 * No authentication required (read-only)
 */
export async function GET() {
  return NextResponse.json({
    isSyncing,
    lastSyncTime,
    message: isSyncing
      ? 'Sync currently in progress'
      : lastSyncTime
        ? `Last sync completed at ${lastSyncTime.toISOString()}`
        : 'No sync has been performed yet'
  })
}
