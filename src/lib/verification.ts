/**
 * Worker Verification Helper Functions
 *
 * For admin dashboard to manage worker verification workflow
 */

import { authPrisma } from './auth-prisma';

/**
 * Get all workers pending verification (for admin dashboard)
 *
 * @returns Workers with PENDING_REVIEW status
 */
export async function getWorkersAwaitingVerification() {
  const workers = await authPrisma.workerProfile.findMany({
    where: {
      verificationStatus: 'PENDING_REVIEW',
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          createdAt: true,
          lastLoginAt: true,
        },
      },
      verificationRequirements: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      verificationSubmittedAt: 'asc', // Oldest first (FIFO)
    },
  });

  return workers;
}

/**
 * Get workers by verification status (for admin filtering)
 *
 * @param status - Verification status to filter by
 * @returns Workers with that status
 */
export async function getWorkersByVerificationStatus(
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
) {
  const workers = await authPrisma.workerProfile.findMany({
    where: {
      verificationStatus: status,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      },
      verificationRequirements: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return workers;
}

/**
 * Get single worker's verification details (for admin review)
 *
 * @param userId - User ID
 * @returns Complete worker profile with verification data
 */
export async function getWorkerVerificationDetails(userId: string) {
  const worker = await authPrisma.workerProfile.findUnique({
    where: {
      userId: userId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          createdAt: true,
          emailVerified: true,
          lastLoginAt: true,
        },
      },
      verificationRequirements: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return worker;
}

/**
 * Approve worker verification (Admin action)
 *
 * @param workerProfileId - Worker profile ID
 * @param adminUserId - Admin user ID (for audit)
 * @param notes - Optional approval notes
 */
export async function approveWorkerVerification(
  workerProfileId: string,
  adminUserId: string,
  notes?: string
) {
  const now = new Date();

  // Update worker profile
  const worker = await authPrisma.workerProfile.update({
    where: {
      id: workerProfileId,
    },
    data: {
      verificationStatus: 'APPROVED',
      verificationReviewedAt: now,
      verificationApprovedAt: now,
      verificationNotes: notes || 'Approved by admin',
      isPublished: true, // Make profile public/searchable
    },
    include: {
      user: true,
    },
  });

  // Update all verification requirements to APPROVED
  await authPrisma.verificationRequirement.updateMany({
    where: {
      workerProfileId: workerProfileId,
      status: 'SUBMITTED',
    },
    data: {
      status: 'APPROVED',
      approvedAt: now,
      reviewedAt: now,
      reviewedBy: adminUserId,
    },
  });

  // Audit log
  await authPrisma.auditLog.create({
    data: {
      userId: worker.userId,
      action: 'PROFILE_UPDATE',
      metadata: {
        action: 'VERIFICATION_APPROVED',
        adminUserId: adminUserId,
        notes: notes,
      },
    },
  });

  console.log('✅ Worker verification approved:', worker.userId);

  return worker;
}

/**
 * Reject worker verification (Admin action)
 *
 * @param workerProfileId - Worker profile ID
 * @param adminUserId - Admin user ID (for audit)
 * @param reason - Rejection reason (required)
 */
export async function rejectWorkerVerification(
  workerProfileId: string,
  adminUserId: string,
  reason: string
) {
  const now = new Date();

  // Update worker profile
  const worker = await authPrisma.workerProfile.update({
    where: {
      id: workerProfileId,
    },
    data: {
      verificationStatus: 'REJECTED',
      verificationReviewedAt: now,
      verificationRejectedAt: now,
      verificationNotes: reason,
      isPublished: false, // Keep profile hidden
    },
    include: {
      user: true,
    },
  });

  // Update verification requirements to REJECTED
  await authPrisma.verificationRequirement.updateMany({
    where: {
      workerProfileId: workerProfileId,
      status: 'SUBMITTED',
    },
    data: {
      status: 'REJECTED',
      rejectedAt: now,
      reviewedAt: now,
      reviewedBy: adminUserId,
      rejectionReason: reason,
    },
  });

  // Audit log
  await authPrisma.auditLog.create({
    data: {
      userId: worker.userId,
      action: 'PROFILE_UPDATE',
      metadata: {
        action: 'VERIFICATION_REJECTED',
        adminUserId: adminUserId,
        reason: reason,
      },
    },
  });

  console.log('❌ Worker verification rejected:', worker.userId);

  return worker;
}

/**
 * Check if worker is verified and approved
 *
 * @param userId - User ID
 * @returns boolean - true if worker can use advanced features
 */
export async function isWorkerVerified(userId: string): Promise<boolean> {
  const worker = await authPrisma.workerProfile.findUnique({
    where: {
      userId: userId,
    },
    select: {
      verificationStatus: true,
    },
  });

  return worker?.verificationStatus === 'APPROVED';
}

/**
 * Get verification statistics (for admin dashboard)
 *
 * @returns Object with counts by status
 */
export async function getVerificationStatistics() {
  const [
    notStarted,
    inProgress,
    pendingReview,
    approved,
    rejected,
  ] = await Promise.all([
    authPrisma.workerProfile.count({ where: { verificationStatus: 'NOT_STARTED' } }),
    authPrisma.workerProfile.count({ where: { verificationStatus: 'IN_PROGRESS' } }),
    authPrisma.workerProfile.count({ where: { verificationStatus: 'PENDING_REVIEW' } }),
    authPrisma.workerProfile.count({ where: { verificationStatus: 'APPROVED' } }),
    authPrisma.workerProfile.count({ where: { verificationStatus: 'REJECTED' } }),
  ]);

  return {
    notStarted,
    inProgress,
    pendingReview,
    approved,
    rejected,
    total: notStarted + inProgress + pendingReview + approved + rejected,
  };
}

/**
 * Worker submits for verification (Worker action)
 *
 * @param userId - User ID
 */
export async function submitForVerification(userId: string) {
  const worker = await authPrisma.workerProfile.update({
    where: {
      userId: userId,
    },
    data: {
      verificationStatus: 'PENDING_REVIEW',
      verificationSubmittedAt: new Date(),
    },
  });

  // Audit log
  await authPrisma.auditLog.create({
    data: {
      userId: userId,
      action: 'PROFILE_UPDATE',
      metadata: {
        action: 'SUBMITTED_FOR_VERIFICATION',
      },
    },
  });

  console.log('📝 Worker submitted for verification:', userId);

  return worker;
}
