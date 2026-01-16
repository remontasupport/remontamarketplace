/**
 * Admin Users API
 *
 * Fetch users for impersonation
 */

import { NextRequest, NextResponse } from 'next/server'
import { authPrisma } from '@/lib/auth-prisma'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

/**
 * GET /api/admin/users
 * Search for users (admin only)
 *
 * Query params:
 * - search: email, name, or mobile
 * - role: filter by role
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole(UserRole.ADMIN)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')

    // Build where clause
    const where: any = {}

    // Search by email, first name, or last name
    if (search && search.length >= 2) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { workerProfile: { firstName: { contains: search, mode: 'insensitive' } } },
        { workerProfile: { lastName: { contains: search, mode: 'insensitive' } } },
        { clientProfile: { firstName: { contains: search, mode: 'insensitive' } } },
        { clientProfile: { lastName: { contains: search, mode: 'insensitive' } } },
        { coordinatorProfile: { firstName: { contains: search, mode: 'insensitive' } } },
        { coordinatorProfile: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Role filter
    if (role && role !== 'all') {
      where.role = role
    }

    // Fetch users
    const users = await authPrisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        workerProfile: {
          select: {
            firstName: true,
            lastName: true,
            mobile: true,
          },
        },
        clientProfile: {
          select: {
            firstName: true,
            lastName: true,
            mobile: true,
          },
        },
        coordinatorProfile: {
          select: {
            firstName: true,
            lastName: true,
            mobile: true,
          },
        },
      },
      take: 50, // Limit results
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform data to flatten profile info
    const transformedUsers = users.map((user) => {
      const profile = user.workerProfile || user.clientProfile || user.coordinatorProfile

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        mobile: profile?.mobile,
      }
    })

    return NextResponse.json({
      success: true,
      users: transformedUsers,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: error.message?.includes('required') ? 403 : 500 }
    )
  }
}
