/**
 * Background Worker - Process Registration Queue
 *
 * This endpoint processes queued worker registrations
 * Triggered by Vercel Cron or can be called manually
 *
 * GET /api/workers/process-registrations
 *
 * Security: Protected by authorization header
 */

import { NextResponse } from 'next/server';
import { getQueueInstance, JOB_TYPES, type WorkerRegistrationJobData } from '@/lib/queue';
import { processWorkerRegistration } from '@/lib/workers/workerRegistrationProcessor';
import { authPrisma } from '@/lib/auth-prisma';

// Force dynamic rendering - prevents static optimization during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verify authorization for background workers
 * Prevents unauthorized access to worker endpoints
 */
function verifyAuthorization(request: Request): boolean {
  const authHeader = request.headers.get('authorization');

  // Check if authorization header matches secret
  // In production, set CRON_SECRET in your environment variables
  const expectedAuth = `Bearer ${process.env.CRON_SECRET || 'development-secret'}`;

  return authHeader === expectedAuth;
}

const BATCH_SIZE = 20;
const CONCURRENCY = 10;

async function processJobBatch(jobs: any[]) {
  const results = [];

  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map(async (job) => {
        try {
          const jobData = JSON.parse(job.data_json);
          const result = await processWorkerRegistration(jobData);

          if (result.success) {
            await authPrisma.$executeRaw`
              UPDATE pgboss.job
              SET state = 'completed', completed_on = NOW()
              WHERE id = ${job.id}::uuid
            `;
            return { jobId: job.id, status: 'completed', userId: result.userId };
          } else {
            throw new Error(result.error || 'Processing failed');
          }
        } catch (error: any) {
          const newRetryCount = (job.retry_count || 0) + 1;
          const newState = newRetryCount >= 3 ? 'failed' : 'retry';

          await authPrisma.$executeRaw`
            UPDATE pgboss.job
            SET state = ${newState}, retry_count = ${newRetryCount}
            WHERE id = ${job.id}::uuid
          `;

          return { jobId: job.id, status: newState, error: error.message };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

export async function GET(request: Request) {
  try {
    // ============================================
    // SECURITY CHECK
    // ============================================
    if (!verifyAuthorization(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ============================================
    // PROCESS QUEUE (OPTIMIZED FOR HIGH CONCURRENCY)
    // ============================================

    // ATOMIC JOB LOCKING - Prevents race conditions
    const lockedJobs = await authPrisma.$queryRawUnsafe<any[]>(`
      WITH locked AS (
        SELECT id
        FROM pgboss.job
        WHERE name = 'worker-registration'
          AND state IN ('created', 'retry')
        ORDER BY created_on ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE pgboss.job
      SET state = 'active', started_on = NOW()
      FROM locked
      WHERE pgboss.job.id = locked.id
      RETURNING pgboss.job.id, pgboss.job.data::text as data_json,
                pgboss.job.retry_count
    `);

    if (lockedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending jobs',
      });
    }

    // Process jobs in parallel
    const results = await processJobBatch(lockedJobs);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Worker processing failed',
        message: error?.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manually triggering worker
 * Useful for testing and admin operations
 */
export async function POST(request: Request) {
  return GET(request);
}
