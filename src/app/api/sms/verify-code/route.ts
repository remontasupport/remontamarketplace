import { NextRequest, NextResponse } from 'next/server';

// This should match the same storage as send-verification
// In production, use Redis or database
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { mobile, code } = await request.json();

    if (!mobile || !code) {
      return NextResponse.json(
        { error: 'Mobile number and code are required' },
        { status: 400 }
      );
    }

    // Normalize the mobile number to match how it was stored
    const normalizedMobile = mobile.replace(/\s/g, '');

    const stored = verificationCodes.get(normalizedMobile) || verificationCodes.get(mobile);

    if (!stored) {
      return NextResponse.json(
        { error: 'No verification code found for this number' },
        { status: 404 }
      );
    }

    // Check if code has expired
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(mobile);
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Verify code
    if (stored.code !== code) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Code is valid - remove it from storage
    verificationCodes.delete(mobile);

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
