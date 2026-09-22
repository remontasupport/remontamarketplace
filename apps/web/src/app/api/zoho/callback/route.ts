import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/zoho/callback
 * One-time OAuth callback used to exchange a Zoho authorization `code`
 * for a refresh token. Visit the Zoho authorization URL with
 * redirect_uri pointing here, approve access, and Zoho will redirect
 * back to this route with a `code` query param.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing code query param' }, { status: 400 })
  }

  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com.au'
  const redirectUri = `${request.nextUrl.origin}/api/zoho/callback`

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.ZOHO_CLIENT_ID || '',
    client_secret: process.env.ZOHO_CLIENT_SECRET || '',
    redirect_uri: redirectUri,
    code,
  })

  const response = await fetch(`${accountsUrl}/oauth/v2/token?${params}`, {
    method: 'POST',
  })

  const data = await response.json()

  return NextResponse.json(data, { status: response.status })
}
