import { NextRequest, NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/modules
 * Get all CRM modules for testing
 */
export async function GET() {
  try {
    // Get access token
    const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!storedRefreshToken) {
      return NextResponse.json(
        {
          error: 'No refresh token available',
          message: 'Please complete Zoho authorization first by visiting /api/zoho/auth'
        },
        { status: 401 }
      );
    }

    // Refresh the access token
    const refreshedTokens = await zohoCRMService.refreshAccessToken(storedRefreshToken);
    const accessToken = refreshedTokens.access_token;

    // Get modules
    const modules = await zohoCRMService.getModules(accessToken);

    return NextResponse.json({
      success: true,
      data: modules,
      message: 'Successfully retrieved CRM modules'
    });

  } catch (error) {
    console.error('Error getting modules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get CRM modules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}