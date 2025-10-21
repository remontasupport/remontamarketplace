/**
 * Admin Verification API Endpoints
 *
 * For admin dashboard to manage worker verifications
 *
 * GET /api/admin/verification - Get all workers awaiting verification
 * POST /api/admin/verification - Approve or reject verification
 */

import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/auth';
import {
  getWorkersAwaitingVerification,
  getWorkersByVerificationStatus,
  approveWorkerVerification,
  rejectWorkerVerification,
  getVerificationStatistics,
} from '@/lib/verification';

/**
 * GET - Fetch workers for admin review
 *
 * Query params:
 * - status: Filter by verification status (optional)
 * - stats: Get statistics (optional)
 */
export async function GET(request: Request) {
  try {
    // TODO: Uncomment when admin role is created
    // const admin = await requireRole(UserRole.COORDINATOR);
    // For now, we'll skip auth check (add it when admin dashboard is ready)

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const getStats = searchParams.get('stats') === 'true';

    // Return statistics
    if (getStats) {
      const stats = await getVerificationStatistics();
      return NextResponse.json({ stats });
    }

    // Return workers by status
    if (status) {
      const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status parameter' },
          { status: 400 }
        );
      }

      const workers = await getWorkersByVerificationStatus(status as any);
      return NextResponse.json({ workers, count: workers.length });
    }

    // Default: Return workers awaiting verification
    const workers = await getWorkersAwaitingVerification();

    return NextResponse.json({
      workers,
      count: workers.length,
      message: workers.length > 0
        ? `${workers.length} worker(s) awaiting verification`
        : 'No workers awaiting verification',
    });

  } catch (error) {
    console.error('❌ Error fetching verification data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification data' },
      { status: 500 }
    );
  }
}

/**
 * POST - Approve or reject worker verification
 *
 * Body:
 * {
 *   "action": "approve" | "reject",
 *   "workerProfileId": "worker_id",
 *   "adminUserId": "admin_id",
 *   "notes": "optional approval notes",
 *   "reason": "required for rejection"
 * }
 */
export async function POST(request: Request) {
  try {
    // TODO: Uncomment when admin role is created
    // const admin = await requireRole(UserRole.COORDINATOR);
    // const adminUserId = admin.id;

    const body = await request.json();
    const { action, workerProfileId, adminUserId, notes, reason } = body;

    // Validation
    if (!action || !workerProfileId || !adminUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, workerProfileId, adminUserId' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Perform action
    let worker;

    if (action === 'approve') {
      worker = await approveWorkerVerification(workerProfileId, adminUserId, notes);

      // TODO: Send approval email to worker
      // await sendApprovalEmail(worker.user.email, worker.firstName);

      return NextResponse.json({
        success: true,
        message: 'Worker verification approved successfully',
        worker: {
          id: worker.id,
          userId: worker.userId,
          email: worker.user.email,
          name: `${worker.firstName} ${worker.lastName}`,
          verificationStatus: worker.verificationStatus,
          approvedAt: worker.verificationApprovedAt,
        },
      });
    } else {
      worker = await rejectWorkerVerification(workerProfileId, adminUserId, reason);

      // TODO: Send rejection email to worker
      // await sendRejectionEmail(worker.user.email, worker.firstName, reason);

      return NextResponse.json({
        success: true,
        message: 'Worker verification rejected',
        worker: {
          id: worker.id,
          userId: worker.userId,
          email: worker.user.email,
          name: `${worker.firstName} ${worker.lastName}`,
          verificationStatus: worker.verificationStatus,
          rejectedAt: worker.verificationRejectedAt,
          reason: worker.verificationNotes,
        },
      });
    }

  } catch (error) {
    console.error('❌ Error updating verification status:', error);
    return NextResponse.json(
      { error: 'Failed to update verification status' },
      { status: 500 }
    );
  }
}
