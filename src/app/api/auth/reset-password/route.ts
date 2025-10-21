/**
 * Reset Password API Endpoint
 *
 * Verifies reset token and updates user password
 * POST /api/auth/reset-password
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { hashPassword } from '@/lib/password';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  // ============================================
  // RATE LIMITING (Prevent brute force)
  // ============================================
  const rateLimitResult = await applyRateLimit(request, strictApiRateLimit);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDATE PASSWORD
    // ============================================

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@!#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        { error: 'Password must include uppercase, lowercase, numbers, and special characters' },
        { status: 400 }
      );
    }

    // ============================================
    // FIND USER WITH VALID TOKEN
    // ============================================

    const user = await authPrisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset.' },
        { status: 400 }
      );
    }

    // ============================================
    // HASH NEW PASSWORD
    // ============================================

    const passwordHash = await hashPassword(password);

    // ============================================
    // UPDATE PASSWORD & CLEAR RESET TOKEN
    // ============================================

    await authPrisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null, // Clear reset token
        resetPasswordExpires: null,
        failedLoginAttempts: 0, // Reset failed login attempts
        accountLockedUntil: null, // Unlock account if locked
      },
    });

    // ============================================
    // AUDIT LOG
    // ============================================

    await authPrisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
        metadata: {
          resetMethod: 'email_link',
        },
      },
    }).catch(() => {
      // Don't fail if audit log fails
    });

    console.log('✅ Password reset successful for user:', user.email);

    // ============================================
    // SUCCESS RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}
