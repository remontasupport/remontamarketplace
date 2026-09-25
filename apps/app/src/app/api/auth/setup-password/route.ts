/**
 * Setup Password API Endpoint
 *
 * Invited workers still on the default password ask for a link to set
 * their own. The password itself is set through /reset-password with a
 * single-use token sent to the account's email, so knowing an email
 * address is not enough to take over the account.
 * POST /api/auth/setup-password
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { generateVerificationToken, verifyPassword } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/email';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';

// Same response whatever the outcome, so the endpoint does not reveal
// which emails have accounts or which accounts still need a password.
const GENERIC_RESPONSE = {
  success: true,
  message: 'If this email belongs to an account that still needs a password, we have sent a link to set it. The link expires in 1 hour.',
};

export async function POST(request: Request) {
  // ============================================
  // RATE LIMITING (Prevent abuse)
  // ============================================
  const rateLimitResult = await applyRateLimit(request, strictApiRateLimit);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // FIND USER & VERIFY CONDITIONS
    // ============================================

    const user = await authPrisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        status: true,
        workerProfile: {
          select: { firstName: true },
        },
      },
    });

    if (!user || user.role !== 'WORKER' || user.status !== 'ACTIVE') {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const isDefaultPassword = await verifyPassword('WelcomeRemonta', user.passwordHash);

    if (!isDefaultPassword) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // ============================================
    // GENERATE SINGLE-USE TOKEN
    // ============================================

    const { token: setupToken, expires: setupExpires } = generateVerificationToken(1); // 1 hour expiry

    await authPrisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: setupToken,
        resetPasswordExpires: setupExpires,
      },
    });

    // ============================================
    // SEND LINK
    // ============================================

    try {
      await sendPasswordResetEmail(
        normalizedEmail,
        setupToken,
        user.workerProfile?.firstName || 'User'
      );
    } catch (emailError) {
      // Don't reveal delivery failures; the worker can request again
    }

    // ============================================
    // AUDIT LOG
    // ============================================

    await authPrisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        metadata: {
          setupMethod: 'self_service',
          setupType: 'initial_password_setup',
        },
      },
    }).catch(() => {
      // Don't fail if audit log fails
    });

    return NextResponse.json(GENERIC_RESPONSE);

  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to process request. Please try again.' },
      { status: 500 }
    );
  }
}
