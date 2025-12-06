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
    // PROCESS QUEUE
    // ============================================
    const boss = await getQueueInstance();

    // Register worker to process registration jobs
    // Process up to 5 jobs concurrently
    await boss.work(
      JOB_TYPES.WORKER_REGISTRATION,
      { teamSize: 5, teamConcurrency: 5 },
      async (job: { data: WorkerRegistrationJobData; id: string }) => {
        console.log(`🔄 Processing registration job ${job.id} for email: ${job.data.email}`);

        const result = await processWorkerRegistration(job.data);

        if (!result.success) {
          // Job will be retried automatically (up to 3 times)
          throw new Error(result.error || 'Registration processing failed');
        }

        console.log(`✅ Registration completed for user ${result.userId}`);

        return result;
      }
    );

    // Keep worker running for 50 seconds (Vercel function timeout is 60s)
    // In production, this should be a long-running process or triggered by cron
    await new Promise((resolve) => setTimeout(resolve, 50000));

    return NextResponse.json({
      success: true,
      message: 'Worker completed processing cycle',
    });
  } catch (error: any) {
    console.error('❌ Worker error:', error);

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
