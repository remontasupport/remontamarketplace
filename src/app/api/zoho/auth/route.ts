import { NextRequest, NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/auth
 * Returns the Zoho authorization URL for initial setup
 */
export async function GET() {
  try {
    const authUrl = zohoCRMService.getAuthorizationUrl();

    return NextResponse.json({
      authUrl,
      message: 'Visit this URL to authorize LocalAid to access your Zoho CRM'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}