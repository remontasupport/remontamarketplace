/**
 * Check Registration Job Status
 *
 * Allows users to check the status of their queued registration
 *
 * GET /api/auth/registration-status/[jobId]
 */

import { NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/queue';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job status from queue
    const job = await getJobStatus(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Map pg-boss states to user-friendly status
    let status = 'processing';
    let message = 'Your registration is being processed...';

    if (job.state === 'completed') {
      status = 'completed';
      message = 'Registration completed successfully! You can now log in.';
    } else if (job.state === 'failed') {
      status = 'failed';
      message = 'Registration failed. Please try again or contact support.';
    } else if (job.state === 'retry') {
      status = 'retrying';
      message = 'We encountered an issue. Retrying your registration...';
    }

    return NextResponse.json({
      jobId: job.id,
      status,
      message,
      createdAt: job.createdon,
      updatedAt: job.completedon || job.startedon,
    });
  } catch (error: any) {
    console.error('❌ Error checking job status:', error);

    return NextResponse.json(
      { error: 'Failed to check registration status' },
      { status: 500 }
    );
  }
}
