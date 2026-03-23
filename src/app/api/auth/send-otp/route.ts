import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { authPrisma, withRetry } from '@/lib/auth-prisma';
import { generateVerificationCode } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';

const SECRET = process.env.NEXTAUTH_SECRET ?? 'remonta-otp-secret';

export function signOtpToken(email: string, code: string, expiresAt: number): string {
  return createHmac('sha256', SECRET)
    .update(`${email}:${code}:${expiresAt}`)
    .digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const name = (typeof firstName === 'string' && firstName.trim()) ? firstName.trim() : 'there';

    // Check email not already registered
    const existingUser = await withRetry(() =>
      authPrisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in instead.' },
        { status: 409 }
      );
    }

    // Generate 6-digit code valid for 10 minutes
    const { code, expires } = generateVerificationCode(10);
    const expiresAt = expires.getTime();
    const token = signOtpToken(normalizedEmail, code, expiresAt);

    // Send the email
    await sendVerificationEmail(normalizedEmail, code, name);

    return NextResponse.json({ success: true, token, expiresAt });
  } catch (error: any) {
    console.error('[send-otp] error:', error?.message ?? error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}
