import { NextRequest, NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/callback
 * Handles the OAuth callback from Zoho and exchanges code for tokens
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const location = searchParams.get('location');
    const accounts_server = searchParams.get('accounts-server');

    // Log all received parameters for debugging
    console.log('🔍 Zoho Callback Debug Info:');
    console.log('Full URL:', request.url);
    console.log('Code:', code);
    console.log('Error:', error);
    console.log('Location:', location);
    console.log('Accounts Server:', accounts_server);
    console.log('All params:', Object.fromEntries(searchParams.entries()));

    if (error) {
      return NextResponse.json(
        {
          error: `Zoho authorization failed: ${error}`,
          debug: { searchParams: Object.fromEntries(searchParams.entries()) }
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          error: 'No authorization code received',
          debug: {
            receivedParams: Object.fromEntries(searchParams.entries()),
            expectedParam: 'code'
          }
        },
        { status: 400 }
      );
    }

    console.log('🔄 Exchanging code for tokens...');

    // Exchange code for tokens
    const tokens = await zohoCRMService.getAccessToken(code);

    console.log('✅ Tokens received:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope
    });

    // In production, you should store these tokens securely in your database
    // For now, we'll return them for manual storage
    return NextResponse.json({
      message: 'Authorization successful! Store these tokens securely.',
      tokens: {
        access_token: tokens.access_token || 'NOT_RECEIVED',
        refresh_token: tokens.refresh_token || 'NOT_RECEIVED',
        expires_in: tokens.expires_in || 0,
        scope: tokens.scope || 'NOT_RECEIVED'
      },
      debug: {
        code_received: code,
        token_response: tokens
      },
      instructions: [
        '1. Copy the refresh_token below and add it to your .env.local file',
        '2. Add: ZOHO_REFRESH_TOKEN=your_refresh_token_here',
        '3. Restart your development server',
        '4. Test with: http://localhost:3004/api/zoho/test-auth'
      ]
    });

  } catch (error) {
    console.error('❌ Error in Zoho callback:', error);
    return NextResponse.json(
      {
        error: 'Failed to process authorization callback',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  }
}