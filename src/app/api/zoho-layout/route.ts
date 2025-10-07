import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to protect this endpoint
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get access token
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN
    const clientId = process.env.ZOHO_CLIENT_ID
    const clientSecret = process.env.ZOHO_CLIENT_SECRET
    const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com.au'
    const apiUrl = process.env.ZOHO_CRM_API_URL || 'https://www.zohoapis.com.au/crm/v2'

    const params = new URLSearchParams({
      refresh_token: refreshToken!,
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'refresh_token',
    })

    const tokenResponse = await fetch(`${accountsUrl}/oauth/v2/token?${params}`, {
      method: 'POST',
    })

    if (!tokenResponse.ok) {
      throw new Error(`Failed to refresh token: ${tokenResponse.statusText}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch layout metadata for Contractors layout
    const contractorsLayoutId = '87697000001047516'
    const layoutResponse = await fetch(
      `${apiUrl}/settings/layouts/${contractorsLayoutId}?module=Contacts`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    if (!layoutResponse.ok) {
      throw new Error(`Failed to fetch layout: ${layoutResponse.statusText}`)
    }

    const layoutData = await layoutResponse.json()

    // Find the Profile Submission section
    const sections = layoutData.layouts?.[0]?.sections || []
    const profileSection = sections.find((section: any) =>
      section.display_label === 'Profile Submission' || section.name === 'Profile Submission'
    )

    return NextResponse.json(
      {
        message: 'Layout metadata fetched successfully',
        allSections: sections.map((s: any) => ({ name: s.name, display_label: s.display_label })),
        profileSubmissionSection: profileSection,
        profileSubmissionFields: profileSection?.fields?.map((f: any) => ({
          api_name: f.api_name,
          display_label: f.field_label,
          data_type: f.data_type
        }))
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching layout metadata:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch layout metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
