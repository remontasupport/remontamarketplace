import { NextResponse } from 'next/server';

/**
 * GET /api/zoho/debug
 * Debug Zoho configuration
 */
export async function GET() {
  const config = {
    clientId: process.env.ZOHO_CLIENT_ID || 'NOT_SET',
    clientSecret: process.env.ZOHO_CLIENT_SECRET ? '***SET***' : 'NOT_SET',
    redirectUri: process.env.ZOHO_REDIRECT_URI || 'NOT_SET',
    accountsUrl: process.env.ZOHO_ACCOUNTS_URL || 'NOT_SET',
    crmApiUrl: process.env.ZOHO_CRM_API_URL || 'NOT_SET',
    refreshToken: process.env.ZOHO_REFRESH_TOKEN ? '***SET***' : 'NOT_SET'
  };

  return NextResponse.json({
    message: 'Zoho Configuration Debug',
    config,
    issues: [
      config.clientId === 'NOT_SET' ? '❌ ZOHO_CLIENT_ID not set' : '✅ ZOHO_CLIENT_ID set',
      config.clientSecret === 'NOT_SET' ? '❌ ZOHO_CLIENT_SECRET not set' : '✅ ZOHO_CLIENT_SECRET set',
      config.redirectUri === 'NOT_SET' ? '❌ ZOHO_REDIRECT_URI not set' : '✅ ZOHO_REDIRECT_URI set',
      config.accountsUrl === 'NOT_SET' ? '❌ ZOHO_ACCOUNTS_URL not set' : '✅ ZOHO_ACCOUNTS_URL set',
    ],
    recommendations: [
      'If you\'re in Australia, use: ZOHO_ACCOUNTS_URL=https://accounts.zoho.com.au',
      'If you\'re elsewhere, use: ZOHO_ACCOUNTS_URL=https://accounts.zoho.com',
      'Make sure your Zoho Console redirect URI is exactly: http://localhost:3004/api/zoho/callback',
      'Double-check your Client ID and Secret in the Zoho Developer Console'
    ]
  });
}