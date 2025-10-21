/**
 * Forgot Password API Endpoint
 *
 * Sends password reset email to user
 * POST /api/auth/forgot-password
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { generateVerificationToken } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/email';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';

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

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // FIND USER
    // ============================================

    const user = await authPrisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        workerProfile: true,
        clientProfile: true,
        coordinatorProfile: true,
      },
    });

    // Security: Don't reveal if user exists or not
    // Always return success to prevent user enumeration
    if (!user) {
      console.log(`⚠️ Password reset requested for non-existent email: ${normalizedEmail}`);

      // Still return success (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // ============================================
    // GENERATE RESET TOKEN
    // ============================================

    const { token: resetToken, expires: resetExpires } = generateVerificationToken(1); // 1 hour expiry

    // Save reset token to database
    await authPrisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // ============================================
    // SEND PASSWORD RESET EMAIL
    // ============================================

    // Get user's first name
    const firstName =
      user.workerProfile?.firstName ||
      user.clientProfile?.firstName ||
      user.coordinatorProfile?.firstName ||
      'User';

    try {
      await sendPasswordResetEmail(normalizedEmail, resetToken, firstName);
      console.log('✅ Password reset email sent to:', normalizedEmail);
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);

      // Don't fail the request if email fails (user won't know)
      // Admin can check logs and manually reset if needed
    }

    // ============================================
    // AUDIT LOG
    // ============================================

    await authPrisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        metadata: {
          email: normalizedEmail,
        },
      },
    }).catch(() => {
      // Don't fail if audit log fails
    });

    // ============================================
    // CONSOLE LOG FOR TESTING (until email is configured)
    // ============================================

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    console.log('\n==============================================');
    console.log('🔑 PASSWORD RESET LINK FOR TESTING');
    console.log('==============================================');
    console.log(`Email: ${normalizedEmail}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Token: ${resetToken}`);
    console.log(`Expires: ${resetExpires.toLocaleString()}`);
    console.log('==============================================\n');

    // ============================================
    // SUCCESS RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset. Please try again.' },
      { status: 500 }
    );
  }
}
