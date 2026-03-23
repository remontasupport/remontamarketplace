import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET ?? 'remonta-otp-secret';

function signOtpToken(email: string, code: string, expiresAt: number): string {
  return createHmac('sha256', SECRET)
    .update(`${email}:${code}:${expiresAt}`)
    .digest('hex');
}

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

    // Verify HMAC signature matches email + code + expiry
    const expected = signOtpToken(normalizedEmail, code.trim(), Number(expiresAt));
    if (expected !== token) {
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
