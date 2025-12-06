/**
 * Check Database Tables
 * Query the database directly to see if pgboss tables exist
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

export async function GET() {
  try {
    // Query to check for pgboss tables
    const result = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname IN ('public', 'pgboss')
      ORDER BY schemaname, tablename
    `);

    // Count tables per schema
    const publicTables = result.filter(r => r.schemaname === 'public');
    const pgbossTables = result.filter(r => r.schemaname === 'pgboss');

    return NextResponse.json({
      success: true,
      tables: result,
      summary: {
        public: publicTables.length,
        pgboss: pgbossTables.length,
      },
      pgbossTables: pgbossTables.map(t => t.tablename),
    });

  } catch (error: any) {
    console.error('❌ Error querying tables:', error);

    return NextResponse.json({
      error: 'Failed to query tables',
      message: error.message,
    }, { status: 500 });
  }
}
