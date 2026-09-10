/**
 * GET /api/zoho/leads
 *
 * Admin-only endpoint — fetches Leads directly from Zoho CRM
 * where Lead_Status = "Recruitment End".
 *
 * This is NOT called by the frontend. It is used by admins to
 * manually inspect what is currently in Zoho before a sync.
 *
 * Authentication:
 *   Header: x-api-secret: <SYNC_API_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { zohoService } from '@/lib/zoho'

export async function GET(request: NextRequest) {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const apiSecret = request.headers.get('x-api-secret')

  if (!apiSecret || apiSecret !== process.env.SYNC_API_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // ── 2. Fetch leads from Zoho ─────────────────────────────────────────
    const startTime = Date.now()
    const rawLeads = await zohoService.getLeadsByStage('Recruitment End')
    const duration = Date.now() - startTime

    // ── 3. Map to clean response shape ───────────────────────────────────
    const leads = rawLeads.map((lead) => ({
      id:                lead['id'],
      Lead_Status:       lead['Lead_Status'],
      First_Name:        lead['First_Name'],
      Last_Name:         lead['Last_Name'],
      Recruitment_Title: lead['Recruitment_Title'],
      Service:           lead['Service'],
      Description:       lead['Description'],
      Job_Description:   lead['Job_Description'],
      State_1:           lead['State_1'],
      City:              lead['City'],
    }))

    return NextResponse.json({
      success:  true,
      count:    leads.length,
      duration: `${duration}ms`,
      leads,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 }
    )
  }
}
