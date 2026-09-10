import { NextRequest, NextResponse } from 'next/server';
import { verifyShareToken } from '@/lib/shareToken';
import { fetchProfileByUserId } from '@/lib/profileData';

/**
 * GET /api/share/profile?token=xxx
 * Fetch profile data using a share token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the token and get userId
    const userId = await verifyShareToken(token);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch profile data using the utility function
    const profileData = await fetchProfileByUserId(userId);

    if (!profileData) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error fetching shared profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
