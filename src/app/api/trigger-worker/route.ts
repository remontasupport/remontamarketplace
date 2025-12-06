/**
 * Trigger Worker (Development Only)
 * Bypasses auth for local testing
 */

import { NextResponse } from 'next/server';
import { getQueueInstance, JOB_TYPES, type WorkerRegistrationJobData } from '@/lib/queue';
import { processWorkerRegistration } from '@/lib/workers/workerRegistrationProcessor';

export async function GET() {
  try {
    console.log('🚀 Triggering worker manually...');

    const boss = await getQueueInstance();

    // Register worker to process registration jobs
    const workPromise = boss.work(
      JOB_TYPES.WORKER_REGISTRATION,
      { teamSize: 5, teamConcurrency: 5 },
      async (job: { data: WorkerRegistrationJobData; id: string }) => {
        console.log(`🔄 Processing registration job ${job.id} for email: ${job.data.email}`);

        const result = await processWorkerRegistration(job.data);

        if (!result.success) {
          throw new Error(result.error || 'Registration processing failed');
        }

        console.log(`✅ Registration completed for user ${result.userId}`);

        return result;
      }
    );

    // Process for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));

    return NextResponse.json({
      success: true,
      message: 'Worker processing initiated',
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

export async function POST() {
  return GET();
}
