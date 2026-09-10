/**
 * Feature Access Control
 *
 * Controls access to advanced features based on worker verification status
 *
 * Workers can:
 * - Always: Login, view dashboard, upload documents
 * - After APPROVED: Search clients, accept bookings, message clients, etc.
 */

import { authPrisma } from './auth-prisma';

/**
 * Feature access levels
 */
export enum FeatureLevel {
  BASIC = 'BASIC',           // Available to all logged-in workers
  VERIFIED = 'VERIFIED',     // Requires admin approval
  PREMIUM = 'PREMIUM',       // Future: Paid subscription
}

/**
 * Features and their required access levels
 */
export const FEATURE_REQUIREMENTS: Record<string, FeatureLevel> = {
  // BASIC - Always available after login
  'view_dashboard': FeatureLevel.BASIC,
  'edit_profile': FeatureLevel.BASIC,
  'upload_documents': FeatureLevel.BASIC,
  'view_verification_status': FeatureLevel.BASIC,

  // VERIFIED - Requires admin approval
  'search_clients': FeatureLevel.VERIFIED,
  'view_client_requests': FeatureLevel.VERIFIED,
  'accept_bookings': FeatureLevel.VERIFIED,
  'message_clients': FeatureLevel.VERIFIED,
  'public_profile': FeatureLevel.VERIFIED,
  'receive_notifications': FeatureLevel.VERIFIED,

  // PREMIUM - Future paid features
  'priority_listings': FeatureLevel.PREMIUM,
  'advanced_search': FeatureLevel.PREMIUM,
  'analytics': FeatureLevel.PREMIUM,
};

/**
 * Check if worker can access a specific feature
 *
 * @param userId - User ID
 * @param featureName - Feature name from FEATURE_REQUIREMENTS
 * @returns Promise<boolean> - true if worker can access
 */
export async function canAccessFeature(
  userId: string,
  featureName: string
): Promise<boolean> {
  const requiredLevel = FEATURE_REQUIREMENTS[featureName];

  if (!requiredLevel) {
   
    return false;
  }

  // BASIC features - always available to logged-in users
  if (requiredLevel === FeatureLevel.BASIC) {
    return true;
  }

  // VERIFIED features - check verification status
  if (requiredLevel === FeatureLevel.VERIFIED) {
    const worker = await authPrisma.workerProfile.findUnique({
      where: { userId },
      select: { verificationStatus: true },
    });

    return worker?.verificationStatus === 'APPROVED';
  }

  // PREMIUM features - check subscription (future)
  if (requiredLevel === FeatureLevel.PREMIUM) {
    // TODO: Check subscription status when implemented
    return false;
  }

  return false;
}

/**
 * Get worker's accessible features
 *
 * @param userId - User ID
 * @returns Promise<string[]> - Array of accessible feature names
 */
export async function getAccessibleFeatures(userId: string): Promise<string[]> {
  const worker = await authPrisma.workerProfile.findUnique({
    where: { userId },
    select: {
      verificationStatus: true,
      // TODO: Add subscription field when implemented
    },
  });

  if (!worker) {
    return [];
  }

  const accessibleFeatures: string[] = [];

  for (const [featureName, requiredLevel] of Object.entries(FEATURE_REQUIREMENTS)) {
    if (requiredLevel === FeatureLevel.BASIC) {
      accessibleFeatures.push(featureName);
    } else if (
      requiredLevel === FeatureLevel.VERIFIED &&
      worker.verificationStatus === 'APPROVED'
    ) {
      accessibleFeatures.push(featureName);
    }
    // PREMIUM features check would go here
  }

  return accessibleFeatures;
}

/**
 * Require feature access (throws if not accessible)
 * Use in API routes to protect endpoints
 *
 * @param userId - User ID
 * @param featureName - Feature name
 * @throws Error if feature not accessible
 */
export async function requireFeatureAccess(
  userId: string,
  featureName: string
): Promise<void> {
  const hasAccess = await canAccessFeature(userId, featureName);

  if (!hasAccess) {
    const requiredLevel = FEATURE_REQUIREMENTS[featureName];

    if (requiredLevel === FeatureLevel.VERIFIED) {
      throw new Error(
        'This feature requires admin verification. Please complete your verification process.'
      );
    } else if (requiredLevel === FeatureLevel.PREMIUM) {
      throw new Error(
        'This feature requires a premium subscription.'
      );
    } else {
      throw new Error('Access denied to this feature');
    }
  }
}

/**
 * Get verification status with helpful message
 *
 * @param userId - User ID
 * @returns Object with status and message
 */
export async function getVerificationStatusMessage(userId: string) {
  const worker = await authPrisma.workerProfile.findUnique({
    where: { userId },
    select: {
      verificationStatus: true,
      verificationSubmittedAt: true,
      verificationApprovedAt: true,
      verificationRejectedAt: true,
      verificationNotes: true,
    },
  });

  if (!worker) {
    return {
      status: 'NOT_FOUND',
      message: 'Worker profile not found',
      canAccessAdvancedFeatures: false,
    };
  }

  switch (worker.verificationStatus) {
    case 'NOT_STARTED':
      return {
        status: 'NOT_STARTED',
        message: 'You haven\'t started the verification process yet. Upload your documents to get started.',
        canAccessAdvancedFeatures: false,
        nextStep: 'Upload required documents (Police Check, WWCC, NDIS Screening)',
      };

    case 'IN_PROGRESS':
      return {
        status: 'IN_PROGRESS',
        message: 'Your documents are being prepared. Submit them for admin review when ready.',
        canAccessAdvancedFeatures: false,
        nextStep: 'Submit your documents for admin review',
      };

    case 'PENDING_REVIEW':
      return {
        status: 'PENDING_REVIEW',
        message: 'Your verification is under review by our admin team. This usually takes 24-48 hours.',
        canAccessAdvancedFeatures: false,
        submittedAt: worker.verificationSubmittedAt,
        nextStep: 'Wait for admin review',
      };

    case 'APPROVED':
      return {
        status: 'APPROVED',
        message: 'Congratulations! Your account is verified. You now have access to all features.',
        canAccessAdvancedFeatures: true,
        approvedAt: worker.verificationApprovedAt,
      };

    case 'REJECTED':
      return {
        status: 'REJECTED',
        message: 'Your verification was rejected. Please review the feedback and resubmit.',
        canAccessAdvancedFeatures: false,
        rejectedAt: worker.verificationRejectedAt,
        reason: worker.verificationNotes,
        nextStep: 'Review rejection reason and resubmit documents',
      };

    default:
      return {
        status: 'UNKNOWN',
        message: 'Unknown verification status',
        canAccessAdvancedFeatures: false,
      };
  }
}
