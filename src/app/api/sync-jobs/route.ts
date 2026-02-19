/**
 * POST /api/sync-jobs  — Core sync: Zoho Leads → jobs table
 * GET  /api/sync-jobs  — Check current sync status (no auth required)
 *
 * POST authentication:
 *   Header: x-api-secret: <SYNC_API_SECRET>
 *
 * PERFORMANCE:
 * - Fetches all existing zohoIds in 1 batch query
 * - Runs all upserts in parallel via Promise.allSettled
 * - Total DB round-trips: 3 (fetch IDs + parallel upserts + deactivate)
 */

import { NextRequest, NextResponse } from 'next/server'
import { zohoService } from '@/lib/zoho'
import { authPrisma } from '@/lib/auth-prisma'
import { invalidateCache, CACHE_KEYS } from '@/lib/redis'

// ── In-memory mutex — prevents concurrent syncs ───────────────────────────
let isSyncing = false
let lastSyncTime: string | null = null

// ── GET — sync status ─────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    isSyncing,
    lastSyncTime,
    message: lastSyncTime
      ? `Last sync completed at ${lastSyncTime}`
      : 'No sync has run yet',
  })
}

// ── POST — run sync ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Authenticate
  const apiSecret = request.headers.get('x-api-secret')
  if (!apiSecret || apiSecret !== process.env.SYNC_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Prevent concurrent syncs
  if (isSyncing) {
    return NextResponse.json(
      { error: 'Sync already in progress' },
      { status: 409 }
    )
  }

  isSyncing = true
  const startTime = Date.now()
  const syncTimestamp = new Date()

  const stats = { created: 0, updated: 0, deactivated: 0, errors: 0 }

  try {
    // 3. Fetch all "Recruitment End" leads from Zoho
    const leads = await zohoService.getLeadsByStage('Recruitment End')
    const zohoIds = leads.map((lead) => String(lead['id']))

    // 4. Fetch all existing zohoIds in ONE batch query
    //    Used to distinguish creates vs updates in stats
    const existing = await authPrisma.job.findMany({
      where: { zohoId: { in: zohoIds } },
      select: { zohoId: true },
    })
    const existingIds = new Set(existing.map((j) => j.zohoId))

    // 5. Run all upserts in parallel
    const results = await Promise.allSettled(
      leads.map((lead) => {
        const jobData = {
          zohoId:           String(lead['id']),
          status:           String(lead['Lead_Status'] ?? 'Recruitment End'),
          firstName:        lead['First_Name']        ? String(lead['First_Name'])        : null,
          lastName:         lead['Last_Name']         ? String(lead['Last_Name'])         : null,
          recruitmentTitle: lead['Recruitment_Title'] ? String(lead['Recruitment_Title']) : null,
          service:          lead['Service']           ? String(lead['Service'])           : null,
          description:      lead['Description']       ? String(lead['Description'])       : null,
          jobDescription:   lead['Job_Description']   ? String(lead['Job_Description'])   : null,
          city:             lead['City']              ? String(lead['City'])              : null,
          state:            lead['State']             ? String(lead['State'])             : null,
          postedAt:         lead['Created_Time']      ? new Date(String(lead['Created_Time'])) : null,
          active:           true,
          lastSyncedAt:     syncTimestamp,
        }

        return authPrisma.job.upsert({
          where:  { zohoId: jobData.zohoId },
          update: jobData,
          create: jobData,
        })
      })
    )

    // 6. Tally results
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        existingIds.has(zohoIds[i]) ? stats.updated++ : stats.created++
      } else {
        stats.errors++
      }
    }

    // 7. Deactivate jobs no longer in "Recruitment End" — single query
    const deactivated = await authPrisma.job.updateMany({
      where: {
        active: true,
        zohoId: { notIn: zohoIds },
      },
      data: {
        active:      false,
        lastSyncedAt: syncTimestamp,
      },
    })
    stats.deactivated = deactivated.count

    lastSyncTime = syncTimestamp.toISOString()
    const duration = Date.now() - startTime

    // Bust the shared jobs cache so the next dashboard load reflects the
    // freshly-synced data. Fire-and-forget — a miss here just means workers
    // see the previous list until the 2-hour TTL expires naturally.
    invalidateCache(CACHE_KEYS.activeJobs()).catch((err) =>
      console.error('[SYNC-JOBS] Failed to invalidate jobs cache:', err)
    );

    return NextResponse.json({
      success:   true,
      message:   'Jobs synced successfully',
      stats,
      syncTime:  lastSyncTime,
      duration:  `${duration}ms`,
      totalJobs: stats.created + stats.updated,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { success: false, error: message, stats },
      { status: 502 }
    )
  } finally {
    isSyncing = false
  }
}
