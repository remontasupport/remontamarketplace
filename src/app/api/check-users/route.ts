/**
 * Check if users were created
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

export async function GET() {
  try {
    // Get recent users
    const users = await authPrisma.user.findMany({
      where: {
        email: {
          contains: 'test',
        },
      },
      include: {
        workerProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      count: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        hasProfile: !!u.workerProfile,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
