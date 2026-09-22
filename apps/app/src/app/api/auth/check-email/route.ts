/**
 * Check Email Availability API Endpoint
 *
 * Checks if an email address is already registered in the database
 * Used during worker registration to prevent duplicate email submissions
 *
 * POST /api/auth/check-email
 * Body: { email: string }
 * Returns: { exists: boolean }
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email is provided
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists in database
    const existingUser = await authPrisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true }, // Only select ID for performance
    });

    // Return whether email exists
    return NextResponse.json(
      { exists: !!existingUser },
      { status: 200 }
    );

  } catch (error: any) {

    return NextResponse.json(
      { error: 'Failed to check email availability' },
      { status: 500 }
    );
  }
}
