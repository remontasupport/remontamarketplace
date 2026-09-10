import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/zoho/authorize
 * Redirects to Zoho's OAuth consent screen using this app's own
 * client_id/scope, so the (long, easy-to-mangle-when-pasted)
 * authorization URL never has to be typed or copied by hand.
 */
export async function GET(request: NextRequest) {
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com.au'
  const redirectUri = `${request.nextUrl.origin}/api/zoho/callback`

  const params = new URLSearchParams({
    scope: process.env.ZOHO_SCOPE || 'ZohoCRM.modules.ALL',
    client_id: process.env.ZOHO_CLIENT_ID || '',
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: redirectUri,
    prompt: 'consent',
  })

  return NextResponse.redirect(`${accountsUrl}/oauth/v2/auth?${params.toString()}`)
}
