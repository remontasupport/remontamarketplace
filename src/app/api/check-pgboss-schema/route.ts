/**
 * Check pg-boss schema structure
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

export async function GET() {
  try {
    // Check job table columns
    const columns = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'pgboss' AND table_name = 'job'
      ORDER BY ordinal_position
    `);

    // Check if there are any jobs
    const jobCountResult = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as count FROM pgboss.job
    `);
    const jobCount = Number(jobCountResult[0].count);

    // Get pg-boss version
    const version = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM pgboss.version
    `);

    // Try to query with correct column names
    let sampleJobs = null;
    try {
      sampleJobs = await authPrisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM pgboss.job LIMIT 3
      `);
    } catch (e: any) {
      sampleJobs = { error: e.message };
    }

    return NextResponse.json({
      success: true,
      columns: columns,
      jobCount: jobCount,
      version: version,
      sampleJobs: sampleJobs,
    });

  } catch (error: any) {
    console.error('❌ Error checking schema:', error);

    return NextResponse.json({
      error: 'Failed to check schema',
      message: error.message,
    }, { status: 500 });
  }
}
