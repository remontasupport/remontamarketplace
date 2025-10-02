import { NextRequest, NextResponse } from 'next/server'
import { zohoService } from '@/lib/zoho'

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to protect this endpoint
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching contractors from Zoho CRM for debugging...')

    // Fetch all contractor contacts from Zoho
    const zohoContacts = await zohoService.getContractorContacts()

    console.log(`Found ${zohoContacts.length} contractors in Zoho CRM`)

    // Return raw Zoho data
    return NextResponse.json(
      {
        message: 'Zoho contractors fetched successfully',
        total: zohoContacts.length,
        contacts: zohoContacts,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching Zoho contractors:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Zoho contractors',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
