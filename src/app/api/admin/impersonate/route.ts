/**
 * Admin Impersonation API
 *
 * Allows admins to impersonate users for customer support and debugging
 *
 * Security features:
 * - Only ADMIN role can impersonate
 * - All impersonation events are logged in audit trail
 * - Stores impersonator ID in session for tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { authPrisma } from '@/lib/auth-prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'
import { getToken } from 'next-auth/jwt'

const secret = process.env.NEXTAUTH_SECRET

/**
 * POST /api/admin/impersonate
 * Start impersonating a user
 *
 * Body: { userEmail: string, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADMIN role
    const admin = await requireRole(UserRole.ADMIN)

    // Get request body
    const body = await request.json()
    const { userEmail, reason } = body

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email is required' },
        { status: 400 }
      )
    }

    // Find the target user (case-insensitive to match search behavior)
    const targetUser = await authPrisma.user.findFirst({
      where: { email: { equals: userEmail, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if target user account is active
    if (targetUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Cannot impersonate ${targetUser.status.toLowerCase()} account` },
        { status: 400 }
      )
    }

    // Log impersonation start in audit trail
    await authPrisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'IMPERSONATION_START',
        metadata: {
          targetUserId: targetUser.id,
          targetUserEmail: targetUser.email,
          targetUserRole: targetUser.role,
          reason: reason || 'Not specified',
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Also log for the target user
    await authPrisma.auditLog.create({
      data: {
        userId: targetUser.id,
        action: 'IMPERSONATION_START',
        metadata: {
          impersonatedBy: admin.id,
          impersonatedByEmail: admin.email,
          reason: reason || 'Not specified',
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Generate a one-time impersonation token (valid for 60 seconds)
    const impersonationToken = `imp_${targetUser.id}_${admin.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const tokenExpiry = new Date(Date.now() + 60000) // 60 seconds

    // Store the token temporarily (you could use Redis in production)
    // For now, we'll create a verification token entry
    // Note: Normalize email to lowercase for consistent token lookup
    await authPrisma.verificationToken.create({
      data: {
        identifier: `impersonation:${targetUser.email.toLowerCase()}`,
        token: impersonationToken,
        expires: tokenExpiry,
      },
    })

    // Return impersonation token data
    return NextResponse.json({
      success: true,
      data: {
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
        },
        impersonatedBy: admin.id,
        impersonationToken, // One-time token for signing in
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to start impersonation' },
      { status: error.message?.includes('required') ? 403 : 500 }
    )
  }
}

/**
 * DELETE /api/admin/impersonate
 * End current impersonation session and return token to restore admin session
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get current session token
    const token = await getToken({ req: request, secret })

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if currently impersonating
    if (!token.impersonatedBy) {
      return NextResponse.json(
        { success: false, error: 'Not currently impersonating' },
        { status: 400 }
      )
    }

    const adminId = token.impersonatedBy as string

    // Get the admin user to restore their session
    const adminUser = await authPrisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    })

    if (!adminUser || adminUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Admin account not found or inactive' },
        { status: 400 }
      )
    }

    // Log impersonation end
    await authPrisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'IMPERSONATION_END',
        metadata: {
          targetUserId: token.id,
          targetUserEmail: token.email,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Also log for the target user
    await authPrisma.auditLog.create({
      data: {
        userId: token.id as string,
        action: 'IMPERSONATION_END',
        metadata: {
          impersonatedBy: adminId,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Generate a one-time token for restoring admin session (valid for 60 seconds)
    const restoreToken = `restore_${adminUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const tokenExpiry = new Date(Date.now() + 60000) // 60 seconds

    // Store the restore token
    await authPrisma.verificationToken.create({
      data: {
        identifier: `impersonation:${adminUser.email.toLowerCase()}`,
        token: restoreToken,
        expires: tokenExpiry,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Impersonation ended successfully',
      data: {
        adminEmail: adminUser.email,
        restoreToken,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to end impersonation' },
      { status: 500 }
    )
  }
}
