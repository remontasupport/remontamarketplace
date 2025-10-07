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

    // Access the private method via reflection to get token
    const token = await (zohoService as any).getAccessToken()

    return NextResponse.json(
      {
        access_token: token,
        note: 'Use this token in Postman Authorization header as: Zoho-oauthtoken <token>',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error getting Zoho token:', error)
    return NextResponse.json(
      {
        error: 'Failed to get Zoho token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
