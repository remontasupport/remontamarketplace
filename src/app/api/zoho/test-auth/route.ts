import { NextRequest, NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/test-auth
 * Test if we have valid tokens and can access Zoho CRM
 */
export async function GET() {
  try {
    const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!storedRefreshToken) {
      // No refresh token, need to authorize first
      const authUrl = zohoCRMService.getAuthorizationUrl();

      return NextResponse.json({
        status: 'need_authorization',
        message: 'No refresh token found. Please authorize first.',
        authUrl,
        instructions: [
          '1. Visit the authUrl below',
          '2. Complete the authorization',
          '3. Copy the refresh_token from the callback response',
          '4. Add ZOHO_REFRESH_TOKEN=your_token to your .env.local file',
          '5. Restart your development server'
        ]
      });
    }

    // Try to refresh token and test access
    const refreshedTokens = await zohoCRMService.refreshAccessToken(storedRefreshToken);

    // Test access by getting user info
    const testResponse = await fetch(`${process.env.ZOHO_CRM_API_URL}/users?type=CurrentUser`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${refreshedTokens.access_token}`,
      },
    });

    if (testResponse.ok) {
      const userData = await testResponse.json();

      return NextResponse.json({
        status: 'authorized',
        message: 'Successfully connected to Zoho CRM!',
        user: userData.users?.[0]?.full_name || 'Unknown',
        access_token_expires_in: refreshedTokens.expires_in,
        ready_for_testing: true
      });
    } else {
      throw new Error('Failed to access Zoho CRM API');
    }

  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Authentication test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        action: 'Please check your tokens and try re-authorizing'
      },
      { status: 500 }
    );
  }
}