/**
 * Setup Password API Endpoint
 *
 * Allows workers with default password to set their own password
 * POST /api/auth/setup-password
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { hashPassword, verifyPassword } from '@/lib/password';
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
    const { email, password } = await request.json();

    // ============================================
    // INPUT VALIDATION
    // ============================================

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // VALIDATE PASSWORD STRENGTH
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
    // FIND USER & VERIFY CONDITIONS
    // ============================================

    const user = await authPrisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
        accountLockedUntil: true,
      },
    });

    // Generic error message to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Verify user is a WORKER
    if (user.role !== 'WORKER') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Verify account is ACTIVE
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact support.' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked. Please try again later.' },
        { status: 400 }
      );
    }

    // ============================================
    // CRITICAL SECURITY CHECK: Verify default password
    // ============================================

    const isDefaultPassword = await verifyPassword('WelcomeRemonta', user.passwordHash);

    if (!isDefaultPassword) {
      return NextResponse.json(
        { error: 'Password has already been set. Please use the login page or reset your password.' },
        { status: 400 }
      );
    }

    // ============================================
    // HASH NEW PASSWORD
    // ============================================

    const newPasswordHash = await hashPassword(password);

    // ============================================
    // UPDATE PASSWORD IN DATABASE
    // ============================================

    await authPrisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });

    // ============================================
    // AUDIT LOG (fire-and-forget)
    // ============================================

    await authPrisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
        metadata: {
          setupMethod: 'self_service',
          setupType: 'initial_password_setup',
        },
      },
    }).catch(() => {
      // Don't fail if audit log fails
    });

    // ============================================
    // SUCCESS RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in with your new password.',
    });

  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to set password. Please try again.' },
      { status: 500 }
    );
  }
}
