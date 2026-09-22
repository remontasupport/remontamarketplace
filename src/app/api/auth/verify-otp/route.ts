import { NextResponse } from 'next/server';
import { verifyOtpToken } from '@/lib/otp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, token, expiresAt } = body;

    if (!email || !code || !token || !expiresAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check expiry
    if (Date.now() > Number(expiresAt)) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify HMAC signature matches email + code + expiry.
    // Constant-time comparison: a plain !== leaks how much of the candidate
    // token was correct via early exit.
    if (!verifyOtpToken(normalizedEmail, code.trim(), Number(expiresAt), token)) {
      return NextResponse.json(
        { error: 'Incorrect code. Please check your email and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[verify-otp] error:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Failed to verify code. Please try again.' },
      { status: 500 }
    );
  }
}
