/**
 * Mandatory Requirements Setup Steps Configuration
 * Steps for workers to complete mandatory documentation and verification
 *
 * NOTE: This section has been deprecated. Proof of Identity has been moved
 * to Account Setup (step 5, right after Address).
 *
 * This file is kept for potential future mandatory requirements.
 */

export interface MandatoryRequirementsSetupStep {
  id: number;
  slug: string;
  title: string;
  component: React.ComponentType<any>;
}

/**
 * Mandatory Requirements Setup Steps
 * Currently empty - Proof of Identity moved to Account Setup
 */
export const MANDATORY_REQUIREMENTS_SETUP_STEPS: MandatoryRequirementsSetupStep[] = [];

/**
 * Get step URL helper
 */
export const getRequirementsStepUrl = (slug: string) =>
  `/dashboard/worker/requirements/setup?step=${slug}`;
