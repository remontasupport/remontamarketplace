/**
 * Process Queue Directly - OPTIMIZED FOR HIGH CONCURRENCY
 * Features:
 * - Job locking (prevents race conditions)
 * - Parallel processing (10 jobs at once)
 * - Safe for 1000+ concurrent users
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { processWorkerRegistration } from '@/lib/workers/workerRegistrationProcessor';

const BATCH_SIZE = 20; // Process up to 20 jobs per run
const CONCURRENCY = 10; // Process 10 jobs in parallel

async function processJobBatch(jobs: any[]) {
  const results = [];

  // Process jobs in parallel (10 at a time)
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map(async (job) => {
        try {
          // Parse job data
          const jobData = JSON.parse(job.data_json);

          // Process registration
          const result = await processWorkerRegistration(jobData);

          if (result.success) {
            // Mark as completed
            await authPrisma.$executeRaw`
              UPDATE pgboss.job
              SET state = 'completed',
                  completed_on = NOW(),
                  output = ${JSON.stringify({ success: true, userId: result.userId })}::jsonb
              WHERE id = ${job.id}::uuid
            `;

            return {
              jobId: job.id,
              status: 'completed',
              userId: result.userId,
              email: jobData.email
            };
          } else {
            throw new Error(result.error || 'Processing failed');
          }
        } catch (error: any) {
          const newRetryCount = (job.retry_count || 0) + 1;
          const newState = newRetryCount >= 3 ? 'failed' : 'retry';

          await authPrisma.$executeRaw`
            UPDATE pgboss.job
            SET state = ${newState},
                retry_count = ${newRetryCount},
                output = ${JSON.stringify({ error: error.message })}::jsonb
            WHERE id = ${job.id}::uuid
          `;

          return {
            jobId: job.id,
            status: newState,
            error: error.message,
            retryCount: newRetryCount
          };
        }
      })
    );

    results.push(...batchResults);
  }

  return results;
}

export async function GET() {
  try {
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
      SET state = 'active',
          started_on = NOW()
      FROM locked
      WHERE pgboss.job.id = locked.id
      RETURNING pgboss.job.id, pgboss.job.name, pgboss.job.data::text as data_json,
                pgboss.job.state, pgboss.job.retry_count
    `);

    if (lockedJobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending jobs',
      });
    }

    // Process jobs in parallel batches
    const results = await processJobBatch(lockedJobs);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results: results,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to process queue',
      message: error?.message,
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
