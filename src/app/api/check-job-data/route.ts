/**
 * Check raw job data in database
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const result = await authPrisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, state, data::text as data_text, retry_count
      FROM pgboss.job
      WHERE id = '${jobId}'
    `);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      job: result[0],
      dataParsed: result[0].data_text ? JSON.parse(result[0].data_text) : null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
