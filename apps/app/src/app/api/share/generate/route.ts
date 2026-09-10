import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { generateShareToken } from '@/lib/shareToken';
import { UserRole } from '@/types/auth';

/**
 * POST /api/share/generate
 * Generate a share token for a worker profile
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, expiryTime } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Generate the token (default: 30 days)
    const token = await generateShareToken(userId, expiryTime || '30d');

    return NextResponse.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Error generating share token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
