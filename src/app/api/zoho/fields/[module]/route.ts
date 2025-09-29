import { NextRequest, NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/fields/[module]
 * Get fields for a specific CRM module (e.g., Contractors, Leads, etc.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ module: string }> }
) {
  try {
    const resolvedParams = await params;
    const moduleName = resolvedParams.module;

    if (!moduleName) {
      return NextResponse.json(
        { error: 'Module name is required' },
        { status: 400 }
      );
    }

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

    // Get module fields
    const fields = await zohoCRMService.getModuleFields(moduleName, accessToken);

    return NextResponse.json({
      success: true,
      module: moduleName,
      data: fields,
      message: `Successfully retrieved fields for ${moduleName} module`
    });

  } catch (error) {
    const resolvedParams = await params;
    console.error(`Error getting fields for module ${resolvedParams.module}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get fields for module: ${resolvedParams.module}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}